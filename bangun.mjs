// Merakit situs TWH Rent Car dari src/ ke public/ (tanpa paket tambahan): node bangun.mjs
// Isi dari src/isi-awal.mjs (dari src/data.mjs), halaman dari src/rakit.mjs, sama dengan yang dirakit Worker dari isi
// panel admin. Hasilnya halaman cadangan statis: dipakai selama belum ada versi terbit di panel admin, atau bila
// database tidak bisa dibaca.
// Juga menulis sitemap.xml, robots.txt, site.webmanifest, 404.html, src/og.json (daftar gambar bagikan untuk
// alat/og.py), dan src/manifest.json (penanda versi tiap berkas, dibundel ke Worker).
// Hasilnya (public/**, src/*.json) ikut di-commit. Jalankan setiap kali app.js, styles.css, foto, atau src/ berubah.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITUS, NAMA, DIPERBARUI } from './src/data.mjs';
import { ISI_AWAL, lengkapi } from './src/isi-awal.mjs';
import { rakit, daftarHalaman, sitemapXml, halaman404, ogDaftar } from './src/rakit.mjs';

const AKAR = dirname(fileURLToPath(import.meta.url));
const baca = (rel) => JSON.parse(readFileSync(join(AKAR, rel), 'utf8'));
const UKURAN = baca('src/armada-ukuran.json');
const PETA = baca('src/peta.json');

// penanda versi dari isi berkas (?v=8 huruf): /assets/* disimpan lama di cache browser, jadi berkas yang diganti baru
// terlihat bila alamatnya ikut berubah. Berkas teks dihitung dengan akhir baris LF, supaya hasilnya sama di Windows
// (git autocrlf menulis CRLF) dan di tempat lain.
const TEKS = /\.(css|js|mjs|json|svg|html|txt|xml|webmanifest)$/;
const VERSI = new Map();
const versi = (rel) => {
  if (!VERSI.has(rel)) {
    const p = join(AKAR, 'public', rel);
    let isi = existsSync(p) ? readFileSync(p) : null;
    if (isi && TEKS.test(rel)) isi = Buffer.from(isi.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
    VERSI.set(rel, isi ? createHash('sha1').update(isi).digest('hex').slice(0, 8) : '0');
  }
  return VERSI.get(rel);
};
const ada = (rel) => existsSync(join(AKAR, 'public', rel));
const alat = { versi, ada, ukuran: UKURAN, peta: PETA, media: {}, situs: SITUS, diperbarui: DIPERBARUI };

const isi = lengkapi(ISI_AWAL);
for (const h of daftarHalaman(isi)) {
  const tujuan = join(AKAR, 'public', h.path, 'index.html');
  mkdirSync(dirname(tujuan), { recursive: true });
  writeFileSync(tujuan, rakit(h, isi, alat));
  console.log('ditulis', h.path);
}
writeFileSync(join(AKAR, 'src', 'og.json'), JSON.stringify(ogDaftar(isi), null, 1) + '\n');
writeFileSync(join(AKAR, 'public', 'sitemap.xml'), sitemapXml(isi, alat));
// robots: semua boleh dirayapi (CSS, JS, dan gambar perlu dibaca Google untuk merender halaman). Worker menjawab
// /robots.txt sendiri (menurut "Tampil di Google" di panel admin); berkas ini cadangannya.
writeFileSync(join(AKAR, 'public', 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITUS}/sitemap.xml\n`);
writeFileSync(join(AKAR, 'public', 'site.webmanifest'), JSON.stringify({
  name: NAMA, short_name: 'TWH Rent Car', lang: 'id', start_url: '/', display: 'browser', background_color: '#EEF4F1', theme_color: '#1B4766',
  icons: [{ src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }, { src: '/assets/logo/ikon-512.png', sizes: '512x512', type: 'image/png' }],
}, null, 1) + '\n');
// 404: halaman sederhana tanpa app.js
writeFileSync(join(AKAR, 'public', '404.html'), halaman404(alat));

// penanda versi semua berkas yang bisa dirujuk halaman, untuk Worker (yang tidak bisa membaca berkas aset)
const berkas = ['styles.css', 'app.js',
  ...['armada', 'og', 'logo'].flatMap((d) => readdirSync(join(AKAR, 'public', 'assets', d)).map((f) => `assets/${d}/${f}`))];
writeFileSync(join(AKAR, 'src', 'manifest.json'), JSON.stringify(Object.fromEntries(berkas.sort().map((rel) => [rel, versi(rel)])), null, 1) + '\n');
console.log('sitemap.xml, robots.txt, site.webmanifest, 404.html, src/og.json, src/manifest.json ditulis');
if (!existsSync(join(AKAR, 'public', 'assets', 'og', 'beranda.jpg'))) console.log('gambar bagikan belum ada: jalankan python -I alat/og.py lalu node bangun.mjs lagi');
