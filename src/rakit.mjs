// Merakit halaman situs TWH Rent Car dari isi (src/isi-awal.mjs, atau isi panel admin dari D1). Dipakai bangun.mjs
// (halaman statis cadangan di public/) dan Worker (worker/index.js: halaman dari versi terbit, dan pratinjau draf).
// Halaman = kepala dokumen (SEO lengkap: judul, deskripsi, kanonis, Open Graph, data terstruktur JSON-LD) + intro
// (beranda) + kepala + menu HP + isi (src/halaman/<templat>.mjs) + kaki + lembar pesan + tombol WhatsApp.
//
// alat (dari pemanggil): versi(rel) -> 8 huruf penanda versi berkas di public/, ada(rel) -> berkas itu ada, ukuran =
// src/armada-ukuran.json, peta = src/peta.json, media = { id: [w, h, ext] } foto unggahan, situs = 'https://…',
// diperbarui = 'YYYY-MM-DD' (lastmod dan dateModified).
import beranda from './halaman/beranda.mjs';
import armada from './halaman/armada.mjs';
import layanan from './halaman/layanan.mjs';
import caraSewa from './halaman/cara-sewa.mjs';
import lokasi from './halaman/lokasi.mjs';
import kontak from './halaman/kontak.mjs';
import mobil from './halaman/mobil.mjs';
import kota from './halaman/kota.mjs';

const MODUL = { beranda, armada, layanan, 'cara-sewa': caraSewa, lokasi, kontak, mobil, kota };

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// alamat luar yang ditulis di panel (Google Maps, Instagram): hanya http(s); hanya kutip dan kurung sudut yang diubah,
// supaya & di alamat tetap seperti aslinya
export const href = (u) => (/^https?:\/\//i.test(String(u ?? '').trim()) ? String(u).trim().replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '#');
const ikon = (id) => `<svg class="ik" aria-hidden="true"><use href="#i-${id}"/></svg>`;
// Rp450.000 (titik ribuan, tanpa Intl supaya sama di Node dan Worker)
export const rupiah = (n) => 'Rp' + String(Math.round(+n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const rupiahPendek = (n) => (n >= 1e6 ? `Rp${String(n / 1e6).replace('.', ',')} jt` : `Rp${String(n / 1000).replace('.', ',')} rb`);
export const namaMobil = (m) => (m.merek && m.merek !== 'Bus' ? `${m.merek} ${m.model}` : m.model);

// ---------- data dari isi ----------
// D = bentuk yang dipakai templat: kontak, armada yang tampil (dengan nama), mobil panggung, kota, layanan, dll.
export function dataDari(isi) {
  const S = isi.situs;
  const wa = String(S.wa || '').replace(/\D/g, '');
  const KONTAK = {
    wa, telepon: S.telepon, teleponLink: '+' + wa, teleponIntl: String(S.telepon || '').replace(/^0/, '+62 '),
    alamat: S.alamat, alamatPendek: S.alamatPendek, jalan: S.jalan, kodePos: S.kodePos, geo: { lat: +S.lat, lng: +S.lng },
    maps: S.maps, mapsEmbed: S.mapsEmbed, berdiri: S.berdiri, jam: S.jam, bayar: S.bayar || [], instagram: S.instagram,
  };
  const SEMUA = (isi.armada || []).map((m) => ({ ...m, nama: namaMobil(m), cocok: m.cocok || [], harga: +m.harga || 0, kursi: +m.kursi || 0 }));
  const ARMADA = SEMUA.filter((m) => m.tampil !== false);
  const HERO = ARMADA.filter((m) => +m.hero > 0).sort((a, b) => a.hero - b.hero);
  const harga = ARMADA.map((m) => m.harga).filter((n) => n > 0);
  return {
    NAMA: S.nama, KONTAK, ANGKA: isi.angka, ARMADA, SEMUA, HERO: HERO.length ? HERO : ARMADA.slice(0, 1),
    KELAS: (isi.kelas || []).filter((k) => ARMADA.some((m) => m.kelas === k.id)),
    KOTA: isi.kota || [], LAYANAN: isi.layanan || [], LANGKAH: isi.langkah || [], SYARAT: isi.syarat || [], FAQ: isi.faq || [], ULASAN: isi.ulasan || [],
    termurah: harga.length ? Math.min(...harga) : 0, termahal: harga.length ? Math.max(...harga) : 0,
  };
}

// isian otomatis di teks panel: {jumlah}, {termurah}, {harga:<slug>}, {unit:<kota>}, {totalUnit}, dan isian halaman itu
// ({nama}, {model}, {kota}, {unit}). Isian yang tidak dikenal dibiarkan apa adanya.
export function isiTeks(D, s, lokal = {}) {
  return String(s ?? '').replace(/\{(jumlah|termurah|totalUnit|harga:([a-z0-9-]+)|unit:([a-z0-9-]+)|nama|model|kota|unit)\}/g, (semua, k, hs, us) => {
    if (hs) { const m = D.SEMUA.find((x) => x.slug === hs); return m ? rupiah(m.harga) : semua; }
    if (us) { const x = D.KOTA.find((y) => y.slug === us); return x ? String(x.unit) : semua; }
    if (k === 'jumlah') return String(D.ARMADA.length);
    if (k === 'termurah') return rupiah(D.termurah);
    if (k === 'totalUnit') return String(D.KOTA.reduce((n, x) => n + (+x.unit || 0), 0));
    return lokal[k] != null ? String(lokal[k]) : semua;
  });
}

// ---------- halaman ----------
// halaman tetap: alamat dan label navigasi ada di kode; judul tab, deskripsi, dan kalimat gambar bagikan di isi.halaman.
// foto = mobil di gambar bagikan (og) halaman itu (alat/og.py).
export const TETAP = [
  { kunci: 'beranda', templat: 'beranda', path: '/', nav: null, foto: 'toyota-alphard' },
  { kunci: 'armada', templat: 'armada', path: '/armada/', nav: 'Armada', foto: 'toyota-innova-zenix' },
  { kunci: 'layanan', templat: 'layanan', path: '/layanan/', nav: 'Layanan', foto: 'toyota-hiace' },
  { kunci: 'cara-sewa', templat: 'cara-sewa', path: '/cara-sewa/', nav: 'Cara Sewa', foto: 'toyota-avanza' },
  { kunci: 'lokasi', templat: 'lokasi', path: '/lokasi/', nav: 'Kota', foto: 'toyota-innova-reborn' },
  { kunci: 'kontak', templat: 'kontak', path: '/kontak/', nav: 'Kontak', foto: 'toyota-alphard' },
];

// semua halaman: tetap, satu per mobil yang tampil (/armada/<slug>/), satu per kota (/sewa-mobil-<slug>/)
export function daftarHalaman(isi, D = dataDari(isi)) {
  const f = (s) => isiTeks(D, s);
  const tetap = TETAP.map((h) => { const x = isi.halaman[h.kunci] || {}; return { ...h, judul: f(x.judul), deskripsi: f(x.deskripsi), og: f(x.og) }; });
  const mobil = D.ARMADA.map((m) => ({
    kunci: 'mobil-' + m.slug, templat: 'mobil', path: `/armada/${m.slug}/`, nav: null, foto: m.foto, mobil: m, induk: 'armada',
    judul: (m.judulSeo || '').trim() ? isiTeks(D, m.judulSeo, { nama: m.nama, model: m.model }) : `Sewa ${m.nama} ${m.kelas === 'bus' ? 'Pariwisata ' : ''}Jakarta, ${rupiahPendek(m.harga)}/hari | TWH Rent Car`,
    // deskripsi maks. sekitar 160 huruf (Google memotong yang lebih panjang)
    deskripsi: (m.deskripsiSeo || '').trim() ? isiTeks(D, m.deskripsiSeo, { nama: m.nama, model: m.model }) : [`Sewa ${m.nama} ${m.trim} di Jakarta, Malang, dan Surabaya mulai ${rupiah(m.harga)} per hari. ${m.kursi} kursi, ${String(m.transmisi).toLowerCase()}. Diantar ke hotel dan bandara.`,
      `Sewa ${m.nama} di Jakarta, Malang, dan Surabaya mulai ${rupiah(m.harga)} per hari. ${m.kursi} kursi, ${String(m.transmisi).toLowerCase()}. Diantar ke hotel dan bandara.`].find((t, i, a) => t.length <= 160 || i === a.length - 1),
    og: `${m.nama}, ${rupiahPendek(m.harga)} per hari.`,
  }));
  const kota = D.KOTA.map((k) => ({
    kunci: 'kota-' + k.slug, templat: 'kota', path: `/sewa-mobil-${k.slug}/`, nav: null, foto: k.mobil, kota: k, induk: 'lokasi',
    judul: (k.judulSeo || '').trim() ? isiTeks(D, k.judulSeo, { kota: k.nama, unit: k.unit }) : `Sewa Mobil ${k.nama}, Antar Bandara & Hotel | TWH Rent Car`,
    deskripsi: (k.deskripsiSeo || '').trim() ? isiTeks(D, k.deskripsiSeo, { kota: k.nama, unit: k.unit }) : `Rental mobil di ${k.nama}: ${k.unit} unit dari Avanza sampai bus, mulai ${rupiah(D.termurah)} per hari. Diantar ke ${String((k.bandara || [])[0] || 'bandara').replace(/ \(.*\)/, '')}, hotel, dan alamat Anda. Buka 24 jam.`,
    og: `Sewa mobil di ${k.nama}.`,
  }));
  return [...tetap, ...mobil, ...kota];
}

export function halamanDari(isi, path) {
  const p = path.endsWith('/') ? path : path + '/';
  return daftarHalaman(isi).find((h) => h.path === p) || null;
}

// foto unggahan yang dipakai isi (m/<id>), supaya tidak bisa dihapus selagi dipakai
export function fotoDipakai(isi) {
  const out = new Set();
  const jalan = (v) => { if (typeof v === 'string') { if (v.startsWith('m/')) out.add(v.slice(2)); } else if (v && typeof v === 'object') Object.values(v).forEach(jalan); };
  jalan(isi);
  return out;
}

// ---------- tanda, ikon, intro ----------
// tanda TWH: segi enam runcing atas-bawah seperti lencana klien (rasio tinggi/lebar 1,1 dari alat/logo.py), bingkai
// navy, isi mint, huruf TWH. Lencana utuh (raster dari berkas klien) dipakai di intro dan gambar bagikan.
const HEKS = (x0, y0, w, h) => `${x0 + w / 2},${y0} ${x0 + w},${y0 + h * 0.25} ${x0 + w},${y0 + h * 0.75} ${x0 + w / 2},${y0 + h} ${x0},${y0 + h * 0.75} ${x0},${y0 + h * 0.25}`;
export const SPRITE = `<svg class="sprite" aria-hidden="true" focusable="false">
  <symbol id="logo-twh" viewBox="0 0 100 110"><polygon points="${HEKS(0, 0, 100, 110)}" fill="#1B4766"/><polygon points="${HEKS(7, 8, 86, 94)}" fill="#90D0BF"/><polygon points="${HEKS(11, 12.5, 78, 85)}" fill="none" stroke="#fff" stroke-width="2.2"/><text x="50" y="64.5" text-anchor="middle" font-family="Archivo,system-ui,sans-serif" font-weight="800" font-size="30" letter-spacing="-.5" fill="#1B4766">TWH</text></symbol>
  <symbol id="i-panah" viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-tambah" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
  <symbol id="i-tutup" viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
  <symbol id="i-cek" viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-kursi" viewBox="0 0 16 16"><path d="M5 2.5h5a1.5 1.5 0 0 1 1.5 1.5v4.5H3.5V4A1.5 1.5 0 0 1 5 2.5zM2.5 8.5h11V11h-11zM4 11v2.5M12 11v2.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/></symbol>
  <symbol id="i-gigi" viewBox="0 0 16 16"><path d="M3.5 3v10M8 3v10M12.5 3v5H3.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="3.5" cy="3" r="1.3" fill="currentColor"/><circle cx="8" cy="3" r="1.3" fill="currentColor"/><circle cx="12.5" cy="3" r="1.3" fill="currentColor"/></symbol>
  <symbol id="i-pin" viewBox="0 0 16 16"><path d="M8 14.5s4.5-4 4.5-7.7a4.5 4.5 0 1 0-9 0C3.5 10.5 8 14.5 8 14.5z" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="6.8" r="1.6" fill="currentColor"/></symbol>
  <symbol id="i-jam" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 4.8V8l2.2 1.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></symbol>
  <symbol id="i-telepon" viewBox="0 0 16 16"><path d="M5.2 2.5l1.6 3-1.3 1.2a7.6 7.6 0 0 0 3.8 3.8l1.2-1.3 3 1.6-.6 2.3a1.4 1.4 0 0 1-1.5 1C6 13.6 2.4 10 2.1 4.6a1.4 1.4 0 0 1 1-1.5z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></symbol>
  <symbol id="i-bintang" viewBox="0 0 16 16"><path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z" fill="currentColor"/></symbol>
  <symbol id="i-pesawat" viewBox="0 0 24 24"><path d="M10.5 3.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5V9l8 4.5v2l-8-2.3V18l2.5 1.8V21.5L12 20.6l-4 .9v-1.7l2.5-1.8v-4.8l-8 2.3v-2L10.5 9z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></symbol>
  <symbol id="i-cincin" viewBox="0 0 24 24"><circle cx="9" cy="14" r="5.5" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="15" cy="14" r="5.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M10.5 5.5L12 3.5l1.5 2L12 7z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></symbol>
  <symbol id="i-gedung" viewBox="0 0 24 24"><path d="M4 21V5.5L13 3v18M13 9l7 2v10M2.5 21h19M7 8h3M7 11.5h3M7 15h3M16 14h1.5M16 17.5h1.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-rombongan" viewBox="0 0 24 24"><circle cx="8" cy="8" r="2.6" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="16" cy="8" r="2.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M3 19c0-3 2.2-5 5-5s5 2 5 5M11 19c0-3 2.2-5 5-5s5 2 5 5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></symbol>
  <symbol id="i-jalan" viewBox="0 0 24 24"><path d="M8 3L4 21M16 3l4 18M12 4v2.5M12 10v3M12 16.5V20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></symbol>
  <symbol id="i-kalender" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M3.5 10h17M8 3v4M16 3v4M7.5 14h2M11 14h2M14.5 14h2M7.5 17h2M11 17h2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></symbol>
  <symbol id="i-wa" viewBox="0 0 24 24"><path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88a9.82 9.82 0 0 1 6.99 2.9 9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41z"/></symbol>
</svg>`;
export const LOGO = (kelas = 'logo-tanda') => `<svg class="${kelas}" viewBox="0 0 100 110" aria-hidden="true" focusable="false"><use href="#logo-twh"/></svg>`;

// ---------- formulir pesan (lembar di semua halaman, dan di /kontak/) ----------
const JAM_PILIHAN = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}.00`);

// ---------- halaman 404 dan sitemap (Worker dan bangun.mjs) ----------
export function halaman404(alat) {
  return `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Halaman tidak ditemukan | TWH Rent Car</title><meta name="robots" content="noindex">
<link rel="icon" href="/favicon.png" type="image/png"><link rel="stylesheet" href="/styles.css?v=${alat.versi('styles.css')}"></head>
<body class="hal-404">${SPRITE}<main class="kosong-404">${LOGO('kosong-logo')}<h1>Jalannya buntu.</h1><p>Halaman yang Anda cari tidak ada atau sudah pindah.</p>
<div class="tombol-baris"><a class="pill pill-navy" href="/">Ke beranda</a><a class="pill pill-garis-gelap" href="/armada/">Lihat armada</a></div></main></body></html>
`;
}

// sitemap: semua halaman, prioritas beranda > halaman utama > mobil dan kota
export function sitemapXml(isi, alat) {
  const D = dataDari(isi), A = alatLengkap(alat);
  const prioritas = (h) => (h.kunci === 'beranda' ? '1.0' : h.nav ? '0.8' : '0.7');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${daftarHalaman(isi, D).map((h) => { const f = h.mobil && A.infoFoto(h.mobil.foto); return `  <url>
    <loc>${A.situs}${h.path}</loc>
    <lastmod>${A.diperbarui}</lastmod>
    <changefreq>${h.kunci === 'beranda' || h.kunci === 'armada' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${prioritas(h)}</priority>${f ? `
    <image:image><image:loc>${A.situs}${f.polos}</image:loc></image:image>` : ''}
  </url>`; }).join('\n')}
</urlset>
`;
}

// alat + bantuan foto: foto bawaan (public/assets/armada/<nama>.webp dan -720) atau unggahan (/media/<id>.<ext>, -640)
function alatLengkap(alat) {
  const versi = alat.versi;
  const infoFoto = (nama) => {
    if (!nama) return null;
    if (nama.startsWith('m/')) {
      const id = nama.slice(2), x = alat.media && alat.media[id];
      if (!x) return null;
      const [w, h, ext = 'webp'] = x;
      const besar = `/media/${id}.${ext}`, kecil = w > 640 ? `/media/${id}-640.${ext}` : besar;
      return { w, h, besar, kecil, polos: besar, set: `${kecil} ${Math.min(w, 640)}w, ${besar} ${w}w`, jenis: ext === 'png' ? 'image/png' : ext === 'jpg' ? 'image/jpeg' : 'image/webp' };
    }
    const u = alat.ukuran[nama];
    if (!u) return null;
    const besar = `/assets/armada/${nama}.webp?v=${versi(`assets/armada/${nama}.webp`)}`, kecil = `/assets/armada/${nama}-720.webp?v=${versi(`assets/armada/${nama}-720.webp`)}`;
    return { w: u.w, h: u.h, besar, kecil, polos: `/assets/armada/${nama}.webp`, set: `${kecil} 720w, ${besar} 1400w`, jenis: 'image/webp' };
  };
  return { ...alat, infoFoto, situs: alat.situs || 'https://twhrentcar.arswordlab.com', diperbarui: alat.diperbarui || '2026-11-09' };
}

// ---------- satu halaman ----------
export function rakit(h, isi, alatAwal) {
  const A = alatLengkap(alatAwal), { versi, infoFoto, situs } = A;
  const D = dataDari(isi), K = D.KONTAK, NAMA = D.NAMA;
  const HALAMAN = daftarHalaman(isi, D);
  const t = (s, lokal) => esc(isiTeks(D, s, lokal));
  const aset = (rel) => `/assets/${rel}?v=${versi('assets/' + rel)}`;
  const url = (p) => situs + p;
  const WA = `https://wa.me/${K.wa}`; // app.js mengganti tautan data-wa dengan pesan yang sesuai
  const mobilBySlug = (s) => D.ARMADA.find((m) => m.slug === s);

  // foto mobil tanpa latar: versi kecil untuk kartu, versi besar untuk layar lebar dan halaman mobil
  function fotoMobil(m, sizes, kelas = '', muat = 'lazy', alt = null) {
    const f = infoFoto(m.foto);
    const teks = alt ?? `${m.nama} ${m.trim} untuk disewa di TWH Rent Car`;
    if (!f) return `<span class="foto-kosong${kelas ? ' ' + kelas : ''}" role="img" aria-label="${esc(teks)}"></span>`;
    return `<img${kelas ? ` class="${kelas}"` : ''} src="${f.kecil}" srcset="${f.set}" sizes="${sizes}" width="${f.w}" height="${f.h}" alt="${esc(teks)}"${muat === 'lazy' ? ' loading="lazy"' : ' fetchpriority="high"'} decoding="async">`;
  }

  // intro beranda (sekali per sesi, app.js): lencana TWH muncul di atas navy, garis segi enam putih tergambar
  // mengelilinginya dan petir berkedip, lalu layar navy menyusut menjadi segi enam yang terbang ke logo di kepala
  const INTRO = `<div class="intro" id="intro" aria-hidden="true">
  <div class="intro-lapis"></div>
  <div class="intro-tanda">
    <svg class="intro-garis" viewBox="-8 -8.8 116 127.6" focusable="false"><polygon points="${HEKS(0, 0, 100, 110)}" pathLength="1"/></svg>
    <img class="intro-lencana" src="${aset('logo/lencana.webp')}" alt="" width="720" height="792">
    <i class="intro-kilat"></i>
  </div>
</div>`;

  // ---------- gambar bagikan ----------
  // kartu JPG 1200x630 (alat/og.py) bila ada dan masih cocok; mobil dengan foto unggahan memakai fotonya sendiri
  const ogDari = (x) => {
    const rel = `assets/og/${x.kunci}.jpg`;
    const fotoBaru = x.mobil && x.mobil.foto !== x.mobil.slug;
    if (A.ada && A.ada(rel) && !fotoBaru) return { url: url(`/${rel}`), v: versi(rel), w: 1200, h: 630, jenis: 'image/jpeg' };
    const f = x.mobil && infoFoto(x.mobil.foto);
    if (f) return { url: url(f.polos), v: '', w: f.w, h: f.h, jenis: f.jenis };
    return { url: url('/assets/og/beranda.jpg'), v: versi('assets/og/beranda.jpg'), w: 1200, h: 630, jenis: 'image/jpeg' };
  };

  // ---------- data terstruktur (JSON-LD) ----------
  const BISNIS_ID = url('/#bisnis'), SITUS_ID = url('/#situs');
  const kotaLayan = D.KOTA.map((k) => ({ '@type': 'City', name: k.nama }));
  const fotoUtama = infoFoto((mobilBySlug('toyota-alphard') || D.ARMADA[0] || {}).foto);
  const BISNIS = {
    '@type': ['AutoRental', 'LocalBusiness'], '@id': BISNIS_ID, name: NAMA, alternateName: ['TWHRENTCAR', 'The TWH Car Rental'],
    description: isi.situs.deskripsi,
    url: url('/'), telephone: K.teleponIntl, image: [url('/assets/og/beranda.jpg'), ...(fotoUtama ? [url(fotoUtama.polos)] : [])],
    logo: { '@type': 'ImageObject', url: url('/assets/logo/lencana.png'), width: 512, height: 563 },
    priceRange: `${rupiah(D.termurah)}–${rupiah(D.termahal)}`, currenciesAccepted: 'IDR', paymentAccepted: K.bayar.join(', '),
    foundingDate: K.berdiri,
    address: { '@type': 'PostalAddress', streetAddress: K.jalan, addressLocality: 'Jakarta Selatan', addressRegion: 'DKI Jakarta', postalCode: K.kodePos, addressCountry: 'ID' },
    geo: { '@type': 'GeoCoordinates', latitude: K.geo.lat, longitude: K.geo.lng },
    hasMap: K.maps,
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '00:00', closes: '23:59' }],
    areaServed: kotaLayan,
    contactPoint: { '@type': 'ContactPoint', telephone: K.teleponIntl, contactType: 'customer service', areaServed: 'ID', availableLanguage: ['Indonesian'] },
    knowsLanguage: 'id',
    sameAs: K.instagram ? [K.instagram] : [],
  };
  // Nama situs di hasil Google: name dulu, lalu alternateName. Sengaja tanpa alamat situs sebagai cadangan (saran Google
  // untuk subdomain): di Uncle Ren cadangan itu yang dipakai Google, bukan nama merek. Pemilik 2026-11-09: nama yang
  // diinginkan "TWH Rent Car", tetap di subdomain arswordlab.com (tanpa domain sendiri).
  const SITUS_LD = { '@type': 'WebSite', '@id': SITUS_ID, url: url('/'), name: NAMA, alternateName: ['TWHRENTCAR', 'TWH Car Rental'],
    inLanguage: 'id-ID', publisher: { '@id': BISNIS_ID } };
  const tawaran = (m) => ({
    '@type': 'Offer', url: url(`/armada/${m.slug}/`), price: m.harga, priceCurrency: 'IDR', availability: 'https://schema.org/InStock',
    businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut', seller: { '@id': BISNIS_ID },
    priceSpecification: { '@type': 'UnitPriceSpecification', price: m.harga, priceCurrency: 'IDR', unitCode: 'DAY', unitText: 'hari', referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'DAY' } },
    areaServed: kotaLayan,
  });
  function jsonld(remah, og) {
    const u = url(h.path);
    const tipe = { kontak: 'ContactPage', armada: 'CollectionPage', lokasi: 'CollectionPage', 'cara-sewa': 'FAQPage' }[h.kunci] || 'WebPage';
    const hal = { '@type': tipe, '@id': u + '#halaman', url: u, name: h.judul, description: h.deskripsi, inLanguage: 'id-ID', isPartOf: { '@id': SITUS_ID },
      about: { '@id': BISNIS_ID }, primaryImageOfPage: { '@type': 'ImageObject', url: og.url, width: og.w, height: og.h }, dateModified: A.diperbarui };
    const g = [SITUS_LD, BISNIS, hal];
    if (remah.length > 1) {
      hal.breadcrumb = { '@id': u + '#remah' };
      g.push({ '@type': 'BreadcrumbList', '@id': u + '#remah', itemListElement: remah.map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: r.nama, item: url(r.path) })) });
    }
    if (h.kunci === 'cara-sewa') hal.mainEntity = D.FAQ.map((f) => ({ '@type': 'Question', name: isiTeks(D, f.tanya), acceptedAnswer: { '@type': 'Answer', text: isiTeks(D, f.jawab) } }));
    if (h.kunci === 'armada' || h.kunci === 'beranda') {
      const daftar = { '@type': 'ItemList', '@id': url('/armada/#daftar'), name: 'Armada TWH Rent Car', numberOfItems: D.ARMADA.length,
        itemListElement: D.ARMADA.map((m, i) => ({ '@type': 'ListItem', position: i + 1, url: url(`/armada/${m.slug}/`), name: `Sewa ${m.nama}` })) };
      if (h.kunci === 'armada') { hal.mainEntity = { '@id': daftar['@id'] }; g.push(daftar); }
    }
    if (h.mobil) {
      const m = h.mobil, f = infoFoto(m.foto);
      hal.mainEntity = { '@id': u + '#mobil' };
      g.push({ '@type': ['Product', 'Car'], '@id': u + '#mobil', name: `Sewa ${m.nama} ${m.trim}`, description: isiTeks(D, m.isi, { nama: m.nama, model: m.model }),
        ...(f ? { image: url(f.polos) } : {}), ...(m.merek && m.merek !== 'Bus' ? { brand: { '@type': 'Brand', name: m.merek }, manufacturer: { '@type': 'Organization', name: m.merek } } : {}),
        model: m.model, vehicleConfiguration: m.trim, bodyType: m.jenis, vehicleSeatingCapacity: m.kursi, vehicleTransmission: m.transmisi,
        category: m.jenis, offers: tawaran(m) });
    }
    if (h.kota) {
      const k = h.kota;
      hal.mainEntity = { '@id': u + '#layanan' };
      g.push({ '@type': 'Service', '@id': u + '#layanan', name: `Sewa mobil ${k.nama}`, serviceType: 'Rental mobil dan bus', provider: { '@id': BISNIS_ID },
        areaServed: { '@type': 'City', name: k.nama }, description: isiTeks(D, k.pembuka, { kota: k.nama, unit: k.unit }),
        offers: { '@type': 'AggregateOffer', priceCurrency: 'IDR', lowPrice: D.termurah, highPrice: D.termahal, offerCount: D.ARMADA.length } });
    }
    if (h.kunci === 'layanan') {
      hal.mainEntity = D.LAYANAN.map((l) => ({ '@type': 'Service', name: isiTeks(D, l.judul), description: isiTeks(D, l.teks), provider: { '@id': BISNIS_ID }, areaServed: kotaLayan }));
    }
    return JSON.stringify({ '@context': 'https://schema.org', '@graph': g }).replace(/</g, '\\u003c');
  }

  // ---------- formulir pesan ----------
  const pilihanMobil = D.KELAS.map((k) => `<optgroup label="${esc(k.label)}">${D.ARMADA.filter((m) => m.kelas === k.id).map((m) => `<option value="${m.slug}">${esc(m.nama)} · ${rupiah(m.harga)}/hari</option>`).join('')}</optgroup>`).join('');
  function formPesan(id) {
    const f = (n) => `${id}-${n}`;
    return `<form class="form-pesan" id="${id}" data-form-pesan novalidate>
  <div class="isian">
    <label class="kolom kolom-lebar" for="${f('mobil')}"><span>Mobil</span>
      <select id="${f('mobil')}" name="mobil"><option value="">Belum tahu, minta saran</option>${pilihanMobil}</select></label>
    <fieldset class="kolom kolom-lebar"><legend>Kota</legend>
      <div class="chips" data-chips="kota">${D.KOTA.map((k, i) => `<button type="button" aria-pressed="${i === 0}" data-nilai="${esc(k.nama)}">${esc(k.nama)}</button>`).join('')}</div></fieldset>
    <label class="kolom" for="${f('mulai')}"><span>Tanggal ambil</span><input id="${f('mulai')}" name="mulai" type="date" required><span class="salah" hidden></span></label>
    <label class="kolom" for="${f('selesai')}"><span>Tanggal kembali</span><input id="${f('selesai')}" name="selesai" type="date" required><span class="salah" hidden></span></label>
    <label class="kolom" for="${f('jam')}"><span>Jam ambil</span><select id="${f('jam')}" name="jam">${JAM_PILIHAN.map((j) => `<option${j === '08.00' ? ' selected' : ''}>${j}</option>`).join('')}</select></label>
    <fieldset class="kolom"><legend>Mobil diserahkan di</legend>
      <div class="chips" data-chips="tempat">${['Garasi kami', 'Hotel', 'Bandara', 'Alamat lain'].map((x, i) => `<button type="button" aria-pressed="${i === 0}" data-nilai="${x}">${x}</button>`).join('')}</div></fieldset>
    <label class="kolom kolom-lebar" for="${f('alamat')}" data-alamat hidden><span>Alamat, nama hotel, atau bandara</span><input id="${f('alamat')}" name="alamat" type="text" autocomplete="street-address" placeholder="Contoh: Terminal 3 Soekarno-Hatta, pukul 09.30"><span class="salah" hidden></span></label>
    <label class="kolom" for="${f('nama')}"><span>Nama</span><input id="${f('nama')}" name="nama" type="text" autocomplete="name" placeholder="Nama sesuai KTP" required><span class="salah" hidden></span></label>
    <label class="kolom" for="${f('catatan')}"><span>Catatan <span class="opsional">(boleh kosong)</span></span><input id="${f('catatan')}" name="catatan" type="text" placeholder="Jumlah penumpang, tujuan, dll."></label>
  </div>
  <div class="estimasi" data-estimasi aria-live="polite"></div>
  <div class="form-bawah">
    <button class="pill pill-navy pill-lebar" type="submit">${ikon('wa')} Kirim pesanan lewat WhatsApp</button>
    <button class="tautan" type="button" data-salin>Salin pesan</button>
  </div>
  <p class="form-catatan" data-catatan>Tidak ada data yang disimpan di server. Pesan terbuka di WhatsApp dan Anda yang mengirimnya.</p>
</form>`;
  }
  const LEMBAR = `<dialog class="lembar" id="lembar-pesan" aria-labelledby="lembar-judul">
  <div class="lembar-isi">
    <div class="lembar-kepala"><h2 id="lembar-judul">${t(isi.kontakHal.judul)}</h2><button class="lembar-tutup" type="button" data-tutup aria-label="Tutup">${ikon('tutup')}</button></div>
    ${formPesan('lembar-form')}
  </div>
</dialog>`;

  // ---------- remah roti dan navigasi ----------
  const remah = [{ nama: 'Beranda', path: '/' }];
  if (h.kunci !== 'beranda') {
    if (h.induk) { const i = TETAP.find((x) => x.kunci === h.induk); remah.push({ nama: i.kunci === 'lokasi' ? 'Lokasi' : i.nav, path: i.path }); }
    remah.push({ nama: h.mobil ? h.mobil.nama : h.kota ? `Sewa mobil ${h.kota.nama}` : h.nav === 'Kota' ? 'Lokasi' : h.nav, path: h.path });
  }
  const remahHtml = remah.length < 2 ? '' : `<nav class="remah" aria-label="Remah roti"><ol>${remah.map((x, i) => i === remah.length - 1 ? `<li aria-current="page">${esc(x.nama)}</li>` : `<li><a href="${x.path}">${esc(x.nama)}</a></li>`).join('')}</ol></nav>`;
  const nav = TETAP.filter((x) => x.nav);
  const navTautan = (x) => {
    const aktif = x.kunci === h.kunci || h.induk === x.kunci;
    return `<a href="${x.path}"${aktif ? ` class="aktif"${x.kunci === h.kunci ? ' aria-current="page"' : ''}` : ''}>${esc(x.nav)}</a>`;
  };

  const beranda = h.kunci === 'beranda';
  const T = isi;
  const ctx = { h, D, T, t, esc, href, ikon, aset, versi, fotoMobil, mobilBySlug, WA, LOGO, remah: remahHtml, formPesan, rupiah, peta: A.peta };
  const og = ogDari(h);
  const ogUrl = og.url + (og.v ? `?v=${og.v}` : '');
  // gambar terbesar di layar pertama (LCP): mobil pertama di hero beranda, mobil di halaman mobil
  const muatAwal = beranda ? D.HERO[0] : h.mobil;
  const fa = muatAwal && infoFoto(muatAwal.foto);
  const pramuat = fa ? `<link rel="preload" as="image" href="${fa.kecil}" imagesrcset="${fa.set}" imagesizes="${beranda ? '(max-width: 760px) 92vw, 56vw' : '(max-width: 900px) 92vw, 52vw'}" fetchpriority="high">\n` : '';
  const indeks = isi.situs.indeks !== false;
  const U = isi.umum;
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="format-detection" content="telephone=no, date=no, address=no">
<title>${esc(h.judul)}</title>
<meta name="description" content="${esc(h.deskripsi)}">
<meta name="robots" content="${indeks ? 'index, follow, max-image-preview:large, max-snippet:-1' : 'noindex, nofollow'}">
<link rel="canonical" href="${url(h.path)}">
<meta name="theme-color" content="#EEF4F1">
<meta name="google-site-verification" content="9gL2tKgtHNhdStXDPxCgOnIVfQBGf971LLXL4w3vFeE">
<meta property="og:type" content="${h.mobil ? 'product' : 'website'}">
<meta property="og:site_name" content="${esc(NAMA)}">
<meta name="application-name" content="${esc(NAMA)}">
<meta name="apple-mobile-web-app-title" content="${esc(NAMA)}">
<meta property="og:locale" content="id_ID">
<meta property="og:title" content="${esc(h.judul.replace(/ \| TWH Rent Car$/, ''))}">
<meta property="og:description" content="${esc(h.deskripsi)}">
<meta property="og:url" content="${url(h.path)}">
<meta property="og:image" content="${ogUrl}">
<meta property="og:image:type" content="${og.jenis}">
<meta property="og:image:width" content="${og.w}">
<meta property="og:image:height" content="${og.h}">
<meta property="og:image:alt" content="${esc(h.og)} TWH Rent Car">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(h.judul)}">
<meta name="twitter:description" content="${esc(h.deskripsi)}">
<meta name="twitter:image" content="${ogUrl}">
<meta name="geo.region" content="ID-JK">
<meta name="geo.placename" content="Jakarta Selatan">
<meta name="geo.position" content="${K.geo.lat};${K.geo.lng}">
<link rel="icon" href="/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/font/archivo.woff2" as="font" type="font/woff2" crossorigin>
${pramuat}<link rel="stylesheet" href="/styles.css?v=${versi('styles.css')}">
<script src="/app.js?v=${versi('app.js')}" defer></script>
<script type="application/ld+json">${jsonld(remah, og)}</script>
</head>
<body data-halaman="${h.templat}" data-wa-nomor="${K.wa}" data-telepon="${esc(K.telepon)}">
${beranda ? INTRO + '\n' : ''}<div data-nosnippet>${SPRITE}
<a class="lewati" href="#isi">Langsung ke isi</a></div>
<canvas id="latar" aria-hidden="true"></canvas>

<header class="kepala di-hero" id="kepala">
  <div class="kepala-isi" data-nosnippet>
    <a class="logo" href="/" aria-label="TWH Rent Car, beranda">${LOGO()}<span class="logo-nama">TWH Rent Car</span></a>
    <nav class="nav" aria-label="Navigasi utama">
      ${nav.map(navTautan).join('\n      ')}
    </nav>
    <div class="kepala-kanan">
      <a class="kepala-telepon" href="tel:${K.teleponLink}">${ikon('telepon')}<span>${esc(K.telepon)}</span></a>
      <a class="pill pill-kecil pill-navy kepala-cta" href="/kontak/#pesan" data-pesan>${t(U.tombolPesan)}</a>
      <button class="burger" id="burger" type="button" aria-label="Buka menu" aria-expanded="false" aria-controls="menu"><span></span><span></span></button>
    </div>
  </div>
</header>

<div class="menu" id="menu" hidden>
  <div class="menu-latar" aria-hidden="true"></div>
  <nav aria-label="Navigasi seluler">
    <a href="/"${beranda ? ' class="aktif" aria-current="page"' : ''}>Beranda</a>
    ${nav.map(navTautan).join('\n    ')}
  </nav>
  <div class="menu-bawah">
    <span class="buka-24">${ikon('jam')} ${t(U.buka)}</span>
    <a class="pill pill-mint pill-lebar" data-wa="umum" href="${WA}" target="_blank" rel="noopener">${ikon('wa')} ${t(U.tombolWa)}</a>
    <a class="menu-telepon" href="tel:${K.teleponLink}">${esc(K.telepon)}</a>
  </div>
</div>

<main id="isi">
${MODUL[h.templat](ctx).trim()}
</main>

<footer class="kaki">
  <section class="ajakan gelap" id="ajakan" aria-labelledby="cta-akhir">
    <canvas id="kaki-kanvas" aria-hidden="true"></canvas>
    <div class="ajakan-isi">
      <h2 id="cta-akhir">${t(isi.kaki.judul)}</h2>
      <p>${t(isi.kaki.teks)}</p>
      <div class="tombol-kiri">
        <a class="pill pill-mint" data-wa="umum" href="${WA}" target="_blank" rel="noopener">${ikon('wa')} ${t(U.tombolWa)}</a>
        <a class="tautan-terang" href="/kontak/#pesan" data-pesan>${t(isi.kaki.tautan)} ${ikon('panah')}</a>
      </div>
    </div>
    <p class="ajakan-petunjuk" aria-hidden="true">${t(isi.kaki.petunjuk)}</p>
  </section>
  <div class="kaki-bawah">
    <div class="kaki-merek">
      <a class="kaki-logo" href="/" aria-label="TWH Rent Car, beranda">${LOGO()}<span>TWH Rent Car</span></a>
      <address class="kaki-nap">
        <span>${esc(K.alamat)}</span>
        <a href="tel:${K.teleponLink}">${esc(K.telepon)}</a>
        <span>${esc(K.jam)}</span>
      </address>
    </div>
    <nav class="kaki-kolom" aria-label="Armada">
      <h3>Armada</h3>
      ${D.ARMADA.map((m) => `<a href="/armada/${m.slug}/">Sewa ${esc(m.nama)}</a>`).join('\n      ')}
    </nav>
    <nav class="kaki-kolom" aria-label="Kota dan halaman">
      <h3>Kota</h3>
      ${D.KOTA.map((k) => `<a href="/sewa-mobil-${k.slug}/">Sewa mobil ${esc(k.nama)}</a>`).join('\n      ')}
      <h3 class="kaki-h3-jarak">Halaman</h3>
      ${nav.map((x) => `<a href="${x.path}">${esc(x.nav === 'Kota' ? 'Lokasi' : x.nav)}</a>`).join('\n      ')}
    </nav>
  </div>
  <div class="kaki-dasar">
    <span>© <span id="tahun">2026</span> TWH Rent Car · sejak ${esc(K.berdiri)}</span>
    <a class="kaki-oleh" href="https://arswordlab.com" target="_blank" rel="noopener">Website oleh ARSWORD</a>
  </div>
</footer>

${LEMBAR}
<a class="fab" id="fab" data-wa="umum" href="${WA}" target="_blank" rel="noopener" aria-label="${t(U.tombolWa)}" title="${t(U.tombolWa)}" tabindex="-1">${ikon('wa')}</a>
<script type="application/json" id="armada-data">${JSON.stringify(D.ARMADA.map((m) => { const f = infoFoto(m.foto) || { w: 1400, h: 700, besar: '', kecil: '' }; return { slug: m.slug, nama: m.nama, trim: m.trim, harga: m.harga, kursi: m.kursi, transmisi: m.transmisi, kelas: m.kelas, arah: m.arah, lampu: m.lampu && m.lampu.length === 2 ? m.lampu : null, hero: +m.hero || 0, w: f.w, h: f.h, src: f.besar, src7: f.kecil }; })).replace(/</g, '\\u003c')}</script>
</body>
</html>
`;
}

// daftar gambar bagikan untuk alat/og.py (src/og.json): judul dan baris kecil per halaman, mobil di gambar
export function ogDaftar(isi) {
  const D = dataDari(isi);
  return daftarHalaman(isi, D).map((h) => ({ kunci: h.kunci, judul: h.og, sub: h.mobil ? `${h.mobil.kursi} kursi · ${h.mobil.transmisi} · mulai ${rupiah(h.mobil.harga)}/hari` : h.kota ? `${h.kota.unit} unit · antar ke hotel dan bandara · buka 24 jam` : 'Jakarta · Malang · Surabaya · buka 24 jam', mobil: h.foto }));
}
