// Titik kota di peta titik Pulau Jawa (src/peta.json, alat/peta.py). Proyeksinya sama dengan alat/peta.py:
// equirectangular, bujur 105,0–115,0 dan lintang -5,6 sampai -9,0, 120 piksel per derajat (peta 1200 × 408).
//
// Titik sebuah kota, berurutan: titik yang dipasang admin di panel (kota.peta = [x, y], ketuk peta di menu Kota), titik
// dari src/peta.json (Jakarta, Malang, Surabaya), lalu titik bawaan kota-kota di Jawa dan Madura di bawah ini (dicari dari
// alamat halaman atau nama kotanya). Kota di luar peta (mis. Denpasar) tidak punya titik; kartu dan halamannya tetap ada.
// Pemilik ARSWORD 2026-11-13, kota baru dari panel belum muncul di peta: "apakah bisa dibuat bisa ada juga?".

export const B0 = 105.0, L1 = -5.6, S = 120;
export const keXY = (lon, lat) => [Math.round((lon - B0) * S * 10) / 10, Math.round((L1 - lat) * S * 10) / 10];

// [bujur, lintang] pusat kota (dibulatkan, cukup untuk peta titik selebar 9 piksel per titik)
const KOTA_JAWA = {
  jakarta: [106.8456, -6.2088], bogor: [106.799, -6.595], depok: [106.8186, -6.4025], tangerang: [106.6403, -6.1783],
  bekasi: [106.9896, -6.2383], serang: [106.1503, -6.12], cilegon: [106.0539, -6.0025], sukabumi: [106.9272, -6.9277],
  bandung: [107.6191, -6.9175], karawang: [107.3375, -6.3227], purwakarta: [107.4433, -6.5569], garut: [107.9031, -7.2279],
  tasikmalaya: [108.2207, -7.3274], cirebon: [108.5523, -6.7063], tegal: [109.1402, -6.8694], purwokerto: [109.2348, -7.4214],
  pekalongan: [109.6753, -6.8898], semarang: [110.4203, -6.9667], kudus: [110.8406, -6.8048], salatiga: [110.4928, -7.3305],
  magelang: [110.2177, -7.4797], yogyakarta: [110.3695, -7.7956], klaten: [110.6062, -7.7058], surakarta: [110.8243, -7.5755],
  madiun: [111.5239, -7.6298], ponorogo: [111.462, -7.8651], bojonegoro: [111.8816, -7.1502], tuban: [112.0483, -6.8976],
  kediri: [112.0178, -7.848], blitar: [112.1683, -8.0955], lamongan: [112.4167, -7.1167], gresik: [112.6539, -7.1554],
  mojokerto: [112.4338, -7.4705], batu: [112.5246, -7.8672], malang: [112.6326, -7.9666], surabaya: [112.7521, -7.2575],
  sidoarjo: [112.7183, -7.4478], bangkalan: [112.7378, -7.0455], pasuruan: [112.9075, -7.6453], probolinggo: [113.2159, -7.7543],
  lumajang: [113.2245, -8.1335], jember: [113.7031, -8.1724], sumenep: [113.865, -7.0167], banyuwangi: [114.3691, -8.2192],
};
// nama lain yang sering dipakai
const SEBUTAN = { jogja: 'yogyakarta', yogya: 'yogyakarta', jogjakarta: 'yogyakarta', djogja: 'yogyakarta', solo: 'surakarta', purwakerto: 'purwokerto', madura: 'bangkalan' };
// titik [x, y] di peta untuk setiap nama (termasuk nama lain); panel admin memakai daftar yang sama (GET bawaan)
export const TITIK_JAWA = Object.fromEntries([
  ...Object.entries(KOTA_JAWA).map(([n, [lon, lat]]) => [n, keXY(lon, lat)]),
  ...Object.entries(SEBUTAN).map(([n, ke]) => [n, keXY(...KOTA_JAWA[ke])]),
]);

// (sama dengan kunciKota di public/admin/admin.js)
export const kunciKota = (s) => String(s || '').toLowerCase().replace(/^(kota|kabupaten|kab\.?)\s+/, '').replace(/[^a-z]/g, '');
// titik bawaan dari alamat halaman (yogyakarta, jogja) atau nama kota ("Kota Yogyakarta")
export function titikBawaan(k) {
  for (const c of [kunciKota(k.slug), kunciKota(k.nama), ...String(k.slug || '').split('-').map(kunciKota)]) if (TITIK_JAWA[c]) return TITIK_JAWA[c];
  return null;
}

const diPeta = (p, P) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && p[0] >= 0 && p[0] <= P.lebar && p[1] >= 0 && p[1] <= P.tinggi;
// titik kota di peta P (src/peta.json): [x, y] dan dari mana ('panel' | 'bawaan'), atau null bila kota itu tidak di peta
export function titikKota(k, P) {
  if (diPeta(k.peta, P)) return { xy: [+k.peta[0], +k.peta[1]], asal: 'panel' };
  const t = (P.tempat && P.tempat[k.slug]) || titikBawaan(k);
  return diPeta(t, P) ? { xy: t, asal: 'bawaan' } : null;
}

// letak nama kota terhadap titiknya: [dx, dy, text-anchor]. Bawaan Jakarta di atas, Surabaya di kanan, Malang di kiri
// bawah (seperti sebelumnya); kota lain di atas, atau sesuai pilihan di panel (kota.label)
const LETAK = { atas: [0, -26, 'middle'], kanan: [22, -6, 'start'], kiri: [-22, -6, 'end'], bawah: [0, 34, 'middle'] };
const LETAK_KOTA = { jakarta: [0, -26, 'middle'], surabaya: [22, -6, 'start'], malang: [-22, 18, 'end'] };
export const letakLabel = (k) => LETAK[k.label] || LETAK_KOTA[k.slug] || LETAK.atas;

// rute melengkung yang menyambung semua titik: mulai dari kota paling barat, lalu selalu ke kota terdekat berikutnya.
// Lompatan jauh melengkung ke atas, lompatan pendek menggembung ke kanan (dengan Jakarta, Surabaya, Malang hasilnya
// sama dengan rute lama Jakarta → Surabaya → Malang).
export function rute(titik) {
  if (titik.length < 2) return '';
  const sisa = titik.slice().sort((a, b) => a[0] - b[0]);
  const urut = [sisa.shift()];
  while (sisa.length) {
    const a = urut[urut.length - 1];
    let i = 0, d = Infinity;
    sisa.forEach((b, j) => { const e = Math.hypot(b[0] - a[0], b[1] - a[1]); if (e < d) { d = e; i = j; } });
    urut.push(sisa.splice(i, 1)[0]);
  }
  let s = `M${urut[0][0]} ${urut[0][1]}`;
  for (let i = 1; i < urut.length; i++) {
    const a = urut[i - 1], b = urut[i];
    s += Math.abs(b[0] - a[0]) > 200 ? `Q${(a[0] + b[0]) / 2} ${Math.min(a[1], b[1]) - 120} ${b[0]} ${b[1]}` : `Q${a[0] + 40} ${(a[1] + b[1]) / 2} ${b[0]} ${b[1]}`;
  }
  return s;
}
