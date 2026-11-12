// Foto unggahan panel admin, disimpan di R2 (binding MEDIA): m/<id>.<ext> dan m/<id>-640.<ext>. Halaman panel sudah
// memperkecil foto dan mengubahnya ke WebP sebelum mengunggah (PNG bila peramban tidak bisa membuat WebP dan fotonya
// tembus pandang, seperti foto mobil tanpa latar; selain itu JPEG), jadi Worker hanya memeriksa jenis, ukuran berkas,
// dan lebar/tinggi. Pengunjung: /media/<berkas> (nama unik, disimpan cache selamanya).
// (Diadaptasi dari panel Silibet, tanpa video: situs TWH tidak memakai video.)
import { json, gagal, acakHex, catat, isiJson } from './http.js';
import { ambilDraf, ambilTerbit, bacaMedia } from './isi.js';
import { fotoDipakai } from '../src/rakit.mjs';

const JENIS = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };
const MIME = { webp: 'image/webp', jpg: 'image/jpeg', png: 'image/png' };
const MAKS_BERKAS = 8 * 1024 * 1024;
const SIMPAN = 'public, max-age=31536000, immutable';

export async function daftarMedia(env) {
  const baris = await bacaMedia(env, 'id, ext, w, h, ukuran, nama, alt, oleh, pada', 'ORDER BY pada DESC');
  const d = await ambilDraf(env), t = await ambilTerbit(env);
  const draf = fotoDipakai(d.isi), terbit = t ? fotoDipakai(t.isi) : new Set();
  return json({ media: baris.map((m) => ({ ...m, dipakai: draf.has(m.id) || terbit.has(m.id) })) });
}

// foto dari formulir: besar wajib, kecil (lebar 640) bila fotonya lebih lebar dari 640
function fotoDari(form) {
  const besar = form.get('besar'), kecil = form.get('kecil');
  const w = Math.round(+form.get('w')), h = Math.round(+form.get('h'));
  if (!besar || typeof besar === 'string') gagal(400, 'berkas', 'Fotonya belum ada.');
  const ext = JENIS[besar.type];
  if (!ext) gagal(415, 'jenis', 'Jenis berkas ini tidak bisa dipakai. Pilih foto JPG, PNG, WebP, atau HEIC.');
  if (besar.size > MAKS_BERKAS || (kecil && kecil.size > MAKS_BERKAS)) gagal(413, 'terlalu_besar', 'Fotonya terlalu besar.');
  if (!(w > 0 && h > 0 && w <= 4000 && h <= 4000)) gagal(400, 'ukuran', 'Ukuran fotonya tidak terbaca.');
  if (kecil && typeof kecil !== 'string' && JENIS[kecil.type] !== ext) gagal(415, 'jenis', 'Jenis berkas kecil tidak sama.');
  return { besar, kecil: kecil && typeof kecil !== 'string' && w > 640 ? kecil : null, ext, w, h };
}

export async function unggah(req, env, akun) {
  if ((+req.headers.get('content-length') || 0) > 2 * MAKS_BERKAS + 50_000) gagal(413, 'terlalu_besar', 'Fotonya terlalu besar.');
  let form;
  try { form = await req.formData(); } catch { gagal(400, 'form', 'Unggahan tidak terbaca.'); }
  const f = fotoDari(form), id = acakHex(8);
  // akun admin: unggahan yang membuat penyimpanan melewati batas ditolak (akun pembuat ARSWORD tidak dibatasi)
  if (akun.peran !== 'pembuat') {
    const { bita } = await hitungR2(env, true);
    if (bita + f.besar.size + (f.kecil ? f.kecil.size : 0) > KUOTA_ADMIN) gagal(413, 'kuota', `Penyimpanan foto sudah penuh (batas ${KUOTA_ADMIN / 1e6} MB). Hapus foto yang tidak dipakai, atau hubungi ARSWORD.`);
  }
  const meta = { httpMetadata: { contentType: MIME[f.ext], cacheControl: SIMPAN } };
  await env.MEDIA.put(`m/${id}.${f.ext}`, f.besar.stream(), meta);
  if (f.kecil) await env.MEDIA.put(`m/${id}-640.${f.ext}`, f.kecil.stream(), meta);
  SIMPAN_R2.pada = 0; // angka penyimpanan dihitung ulang
  const nama = String(form.get('nama') || '').slice(0, 120), alt = String(form.get('alt') || '').slice(0, 300);
  const pada = Date.now();
  await env.DB.prepare('INSERT INTO media (id, ext, w, h, ukuran, nama, alt, oleh, pada) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, f.ext, f.w, f.h, f.besar.size, nama, alt, akun.email, pada).run();
  await catat(env, { oleh: akun.email, aksi: 'unggah', detail: { id, nama } });
  return json({ ok: true, media: { id, ext: f.ext, w: f.w, h: f.h, ukuran: f.besar.size, nama, alt, oleh: akun.email, pada, dipakai: false } });
}

export async function ubahMedia(req, env, akun, id) {
  const { alt, nama } = await isiJson(req, 4_000);
  const r = await env.DB.prepare('UPDATE media SET alt = COALESCE(?, alt), nama = COALESCE(?, nama) WHERE id = ?')
    .bind(alt == null ? null : String(alt).slice(0, 300), nama == null ? null : String(nama).slice(0, 120), id).run();
  if (!r.meta.changes) gagal(404, 'media', 'Foto ini tidak ada.');
  return json({ ok: true });
}

// foto yang masih dipakai draf atau situs yang tayang tidak bisa dihapus
export async function hapusMedia(env, akun, id) {
  const baris = await env.DB.prepare('SELECT id, ext, nama FROM media WHERE id = ?').bind(id).first();
  if (!baris) gagal(404, 'media', 'Foto ini tidak ada.');
  const d = await ambilDraf(env), t = await ambilTerbit(env);
  if (fotoDipakai(d.isi).has(id) || (t && fotoDipakai(t.isi).has(id))) gagal(409, 'dipakai', 'Foto ini masih dipakai di situs atau draf. Ganti dulu di bagian yang memakainya, terbitkan, lalu hapus.');
  await env.MEDIA.delete([`m/${id}.${baris.ext}`, `m/${id}-640.${baris.ext}`]);
  SIMPAN_R2.pada = 0;
  await env.DB.prepare('DELETE FROM media WHERE id = ?').bind(id).run();
  await catat(env, { oleh: akun.email, aksi: 'hapus_foto', detail: { id, nama: baris.nama } });
  return json({ ok: true });
}

// /media/<id>.<ext> dan /media/<id>-640.<ext> untuk pengunjung
export async function sajikanMedia(req, env, berkas) {
  if (!/^[0-9a-f]{16}(-640)?\.(webp|jpg|png)$/.test(berkas)) return new Response('Tidak ditemukan', { status: 404 });
  const obj = await env.MEDIA.get(`m/${berkas}`);
  if (!obj) return new Response('Tidak ditemukan', { status: 404 });
  const h = new Headers();
  obj.writeHttpMetadata(h);
  h.set('etag', obj.httpEtag);
  h.set('cache-control', SIMPAN);
  h.set('x-content-type-options', 'nosniff');
  if (req.headers.get('if-none-match') === obj.httpEtag) return new Response(null, { status: 304, headers: h });
  return new Response(req.method === 'HEAD' ? null : obj.body, { headers: h });
}

// Penyimpanan R2 situs ini dan perkiraan biayanya dalam rupiah (pemilik ARSWORD 2026-11-12: "pada tiap admin panel
// menampilkan storage penggunaan R2 dan biaya rupiah nya berapa"; sama dengan kit panel ARSWORD,
// racik-paket-pos/tools/kit-panel/worker/kit/media.js). Ukurannya dijumlah dari daftar objek di bucket, disimpan sebentar
// di memori isolate. Tarif R2 Standard: $0,015 per GB per bulan, dihitung penuh tanpa jatah gratis 10 GB akun Cloudflare
// (pemilik ARSWORD 2026-11-12: "tidak usah di hitung itu gratis penggunaan 10gb dari cloudflare"); data keluar (egress) selalu gratis. Kurs bisa diganti lewat
// variabel KURS_USD; bawaannya kurs tengah BI 9 November 2026.
//
// Akun admin (klien TWH) tidak melihat biaya: hanya terpakai dari batas 500 MB, dan unggahan yang melewati batas itu
// ditolak (pemilik ARSWORD 2026-11-13: "pada akun admin tidak ada informasi biaya hanya upload saja dengan batas 500mb
// ini hanya khusus pada admin twhrentcar admin panel"). Akun pembuat (ARSWORD) tetap melihat biaya dan batasnya, dan
// unggahannya tidak dibatasi. 1 MB = 1.000.000 bita, sama dengan tampilan di panel.
const TARIF_R2 = { usdPerGb: 0.015, kurs: 18130, kursKet: 'kurs tengah BI 9 November 2026' };
export const KUOTA_ADMIN = 500 * 1e6;
let SIMPAN_R2 = { pada: 0, data: null };
export async function penyimpanan(env, segar = false, pembuat = false) {
  const d = await hitungR2(env, segar);
  if (!pembuat) return json({ bita: d.bita, objek: d.objek, kuota: KUOTA_ADMIN, sisa: Math.max(0, KUOTA_ADMIN - d.bita), dihitung: d.dihitung });
  return json({ ...d, kuota: KUOTA_ADMIN, sisa: Math.max(0, KUOTA_ADMIN - d.bita) });
}
async function hitungR2(env, segar = false) {
  if (!segar && SIMPAN_R2.data && Date.now() - SIMPAN_R2.pada < 5 * 60_000) return SIMPAN_R2.data;
  let bita = 0, objek = 0, cursor, halaman = 0;
  do {
    const r = await env.MEDIA.list({ cursor, limit: 1000 });
    for (const o of r.objects) { bita += o.size; objek++; }
    cursor = r.truncated ? r.cursor : undefined;
  } while (cursor && ++halaman < 200);
  const kurs = +env.KURS_USD > 0 ? +env.KURS_USD : TARIF_R2.kurs;
  const gb = bita / 1e9, usd = gb * TARIF_R2.usdPerGb;
  SIMPAN_R2 = { pada: Date.now(), data: {
    bita, objek, gb, usd, rupiah: usd * kurs, kurs, kursKet: +env.KURS_USD > 0 ? 'kurs dari pengaturan Worker (KURS_USD)' : TARIF_R2.kursKet,
    rupiahPerGb: TARIF_R2.usdPerGb * kurs, usdPerGb: TARIF_R2.usdPerGb, dihitung: Date.now(),
  } };
  return SIMPAN_R2.data;
}
