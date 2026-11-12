// Gambar di percakapan asisten panel admin TWH Rent Car (vision; pemilik ARSWORD, 2026-11-13: "jangan lupa untuk menambahkan fitur bisa upload
// gambar pada tiap ai assistent pada admin panel"). Admin ARSWORD menempel, menyeret, atau memilih gambar di laci
// (tangkapan layar revisi dari klien, foto); panel memperkecilnya di peramban (sisi terpanjang paling panjang 1568 px,
// WebP atau JPEG) dan mengirimnya sebagai base64 bersama pesan. Claude membacanya sebagai blok image di giliran admin.
//
// Diperiksa di sini sebelum pertanyaan berangkat ke ARSWORD (yang memeriksanya lagi dengan aturan yang sama,
// worker/asisten-gambar.js di racik-paket-pos, dan menghitung tokennya untuk batas harian admin):
//   - gambar base64 JPEG, PNG, WebP, atau GIF yang bita awalnya cocok dengan jenisnya (gambar lewat alamat tidak
//     diteruskan: Claude akan mengambilnya sendiri), paling besar MAKS_BITA bita dan 8000 piksel per sisi;
//   - paling banyak 5 gambar per pesan, 20 gambar dan 12 MB dalam seluruh percakapan (panel melepas gambar terlama
//     menjadi satu baris tulisan sebelum itu);
//   - gambar hanya di giliran admin; giliran admin hanya berisi tulisan, gambar, dan hasil alat.
// Kode di bawah sama dengan worker/asisten-gambar.js di ARSWORD.

export const GAMBAR = {
  jenis: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maksPesan: 5,
  maksPercakapan: 20,
  maksBita: 2_000_000,
  maksTotal: 12_000_000,
  maksSisi: 8000,
  maksTokenHari: 250_000,
};

const RUSAK = 'Riwayat percakapan rusak. Mulai percakapan baru.';
const str = (v) => typeof v === 'string';
const B64 = /^[A-Za-z0-9+/]*={0,2}$/;
const bitaDari = (s) => Math.floor((s.length * 3) / 4) - (s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0);
const mb = (n) => `${(n / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} MB`;

// the first n bytes of a base64 string (all of it when n reaches its end)
function awal(s, n) {
  const bin = atob(s.slice(0, Math.ceil(n / 3) * 4));
  const b = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
  return b;
}

// width and height from a picture's own header, or null when the bytes are not that kind of picture ('kurang': a JPEG
// whose size comes after the bytes given)
function ukuran(b, jenis) {
  const ada = (i, s) => [...s].every((c, j) => b[i + j] === c.charCodeAt(0));
  const u16 = (i) => (b[i] << 8) | b[i + 1];
  const u16le = (i) => b[i] | (b[i + 1] << 8);
  const u24le = (i) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
  const u32 = (i) => (b[i] * 2 ** 24) + ((b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]);
  if (jenis === 'image/png') return b.length >= 24 && b[0] === 0x89 && ada(1, 'PNG\r\n\x1a\n') && ada(12, 'IHDR') ? { w: u32(16), h: u32(20) } : null;
  if (jenis === 'image/gif') return b.length >= 10 && (ada(0, 'GIF87a') || ada(0, 'GIF89a')) ? { w: u16le(6), h: u16le(8) } : null;
  if (jenis === 'image/webp') {
    if (b.length < 25 || !ada(0, 'RIFF') || !ada(8, 'WEBP')) return null;
    if (ada(12, 'VP8L')) return b[20] === 0x2f ? { w: 1 + (b[21] | ((b[22] & 0x3f) << 8)), h: 1 + ((b[22] >> 6) | (b[23] << 2) | ((b[24] & 0x0f) << 10)) } : null;
    if (b.length < 30) return null;
    if (ada(12, 'VP8 ')) return { w: u16le(26) & 0x3fff, h: u16le(28) & 0x3fff };
    if (ada(12, 'VP8X')) return { w: 1 + u24le(24), h: 1 + u24le(27) };
    return null;
  }
  if (jenis === 'image/jpeg') {
    if (b[0] !== 0xff || b[1] !== 0xd8) return null;
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const m = b[i + 1];
      if (m === 0xff) { i++; continue; }
      if (m === 0x01 || (m >= 0xd0 && m <= 0xd8)) { i += 2; continue; }
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: u16(i + 5), w: u16(i + 7) };
      if (m === 0xda || m === 0xd9) return null;
      i += 2 + u16(i + 2);
    }
    return 'kurang';
  }
  return null;
}

// tokens Claude counts for a picture of w × h (after the API shrinks it to 2576 px a side and 3.75 MP)
export function tokenGambar(w, h) {
  const s = Math.min(1, 2576 / Math.max(w, h), Math.sqrt(3_750_000 / (w * h)));
  return Math.min(4784, Math.ceil((w * s * h * s) / 784));
}

// one picture: { w, h, bita, token } or { pesan } (why it cannot go, in words for the admin)
export function bacaGambar(jenis, data) {
  if (!GAMBAR.jenis.includes(jenis)) return { pesan: 'Gambar harus JPG, PNG, WebP, atau GIF.' };
  if (!str(data) || !data || data.length % 4 || !B64.test(data)) return { pesan: 'Gambar rusak atau tidak terbaca. Lampirkan lagi.' };
  const bita = bitaDari(data);
  if (bita > GAMBAR.maksBita) return { pesan: `Gambar terlalu besar (${mb(bita)}; paling besar ${mb(GAMBAR.maksBita)} per gambar). Perkecil atau potong gambarnya, lalu lampirkan lagi.` };
  let u = ukuran(awal(data, 65_536), jenis);
  if (u === 'kurang') u = ukuran(awal(data, bita), jenis);
  if (!u || u === 'kurang' || !u.w || !u.h) return { pesan: 'Isi gambar tidak sesuai jenisnya (JPG, PNG, WebP, atau GIF). Lampirkan lagi.' };
  if (u.w > GAMBAR.maksSisi || u.h > GAMBAR.maksSisi) return { pesan: `Gambar terlalu besar (${u.w}×${u.h} piksel; paling besar ${GAMBAR.maksSisi} piksel per sisi).` };
  return { w: u.w, h: u.h, bita, token: tokenGambar(u.w, u.h) };
}

// What a panel sends with the admin's words: [{ jenis, data }] → image blocks for the new turn (throws with words)
export function blokGambar(daftar) {
  if (daftar == null) return [];
  if (!Array.isArray(daftar)) throw new Error('Gambar tidak terbaca. Lampirkan lagi.');
  if (daftar.length > GAMBAR.maksPesan) throw new Error(`Paling banyak ${GAMBAR.maksPesan} gambar dalam satu pesan.`);
  return daftar.map((g, i) => {
    const x = g && typeof g === 'object' ? g : {};
    const r = bacaGambar(x.jenis, x.data);
    if (r.pesan) throw new Error(daftar.length > 1 ? `Gambar ${i + 1}: ${r.pesan}` : r.pesan);
    return { type: 'image', source: { type: 'base64', media_type: x.jenis, data: x.data } };
  });
}

const teksSah = (b) => b && b.type === 'text' && str(b.text);
// A conversation as it goes to Claude (messages alternate and are arrays of blocks; bersihkan and bacaRiwayat check that
// first): every block of the admin's turns rebuilt from what is allowed, every picture checked, the answers left as Claude
// wrote them but never with a picture or a document. → { messages, gambar: { n, token } } for the last turn's pictures.
// Throws with words the panel can show.
export function rapikanIsi(messages) {
  let semua = 0, total = 0, n = 0, token = 0;
  const akhir = messages.length - 1;
  const hasil = messages.map((m, i) => {
    if (m.role === 'assistant') {
      if (m.content.some((b) => !b || typeof b !== 'object' || b.type === 'image' || b.type === 'document')) throw new Error(RUSAK);
      return m;
    }
    const content = m.content.map((b, j) => {
      if (teksSah(b)) return { type: 'text', text: b.text, ...(i === 0 && j === 0 && b.cache_control ? { cache_control: { type: 'ephemeral' } } : {}) };
      if (b && b.type === 'tool_result' && str(b.tool_use_id) && b.tool_use_id.length <= 200) {
        let c = b.content;
        if (Array.isArray(c)) {
          if (!c.every(teksSah)) throw new Error(RUSAK);
          c = c.map((x) => ({ type: 'text', text: x.text }));
        } else if (!str(c)) c = '';
        return { type: 'tool_result', tool_use_id: b.tool_use_id, content: c, ...(b.is_error === true ? { is_error: true } : {}) };
      }
      if (b && b.type === 'image') {
        const s = b.source && typeof b.source === 'object' ? b.source : {};
        if (s.type !== 'base64') throw new Error('Gambar hanya bisa dikirim sebagai berkas yang dilampirkan, bukan alamat.');
        const r = bacaGambar(s.media_type, s.data);
        if (r.pesan) throw new Error(r.pesan);
        semua++; total += r.bita;
        if (i === akhir) { n++; token += r.token; }
        return { type: 'image', source: { type: 'base64', media_type: s.media_type, data: s.data } };
      }
      throw new Error(RUSAK);
    });
    return { role: 'user', content };
  });
  if (n > GAMBAR.maksPesan) throw new Error(`Paling banyak ${GAMBAR.maksPesan} gambar dalam satu pesan.`);
  if (semua > GAMBAR.maksPercakapan || total > GAMBAR.maksTotal) throw new Error('Gambar dalam percakapan ini sudah terlalu banyak. Mulai percakapan baru.');
  return { messages: hasil, gambar: { n, token } };
}

// A turn as it goes back to the panel: the pictures without their bytes (the panel already has them and puts them back)
export const tanpaDataGambar = (m) => ({
  ...m,
  content: m.content.map((b) => (b && b.type === 'image' ? { type: 'image', source: { type: 'base64', media_type: b.source.media_type, data: '' } } : b)),
});

// JSON.stringify replacer that leaves out the pictures' bytes (for size limits meant for words)
export function tanpaBita(k, v) {
  return k === 'data' && this && this.type === 'base64' && str(v) ? '' : v;
}
