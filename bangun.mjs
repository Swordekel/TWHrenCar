// Merakit situs TWH Rent Car dari src/ ke public/ (tanpa paket tambahan): node bangun.mjs
// Halaman = kepala dokumen (SEO lengkap: judul, deskripsi, kanonis, Open Graph, data terstruktur JSON-LD) + intro
// (beranda) + kepala + menu HP + isi (src/halaman/<templat>.mjs) + kaki + lembar pesan + tombol WhatsApp.
// Juga menulis sitemap.xml, robots.txt, 404.html, dan src/og.json (daftar gambar bagikan untuk alat/og.py).
// Hasilnya (public/**) ikut di-commit: Worker Cloudflare menyajikan folder public/ apa adanya (lihat wrangler.jsonc).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as D from './src/data.mjs';

const { SITUS, NAMA, KONTAK, ARMADA, KOTA, KELAS, HALAMAN, HERO, rupiah, DIPERBARUI } = D;
const AKAR = dirname(fileURLToPath(import.meta.url));
const UKURAN = JSON.parse(readFileSync(join(AKAR, 'src', 'armada-ukuran.json'), 'utf8'));
const WA = `https://wa.me/${KONTAK.wa}`; // app.js mengganti tautan data-wa dengan pesan yang sesuai

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ikon = (id) => `<svg class="ik" aria-hidden="true"><use href="#i-${id}"/></svg>`;

// penanda versi dari isi berkas (?v=8 huruf): /assets/* disimpan lama di cache browser, jadi berkas yang diganti baru
// terlihat bila alamatnya ikut berubah
const VERSI = new Map();
const versi = (rel) => {
  if (!VERSI.has(rel)) {
    const p = join(AKAR, 'public', rel);
    VERSI.set(rel, existsSync(p) ? createHash('sha1').update(readFileSync(p)).digest('hex').slice(0, 8) : '0');
  }
  return VERSI.get(rel);
};
const aset = (rel) => `/assets/${rel}?v=${versi('assets/' + rel)}`;
const mobilBySlug = (s) => ARMADA.find((m) => m.slug === s);

// foto mobil tanpa latar (alat/foto.py): -720 untuk kartu, versi 1400 untuk layar lebar dan halaman mobil
function fotoMobil(m, sizes, kelas = '', muat = 'lazy', alt = null) {
  const u = UKURAN[m.slug];
  const v = (akhir) => `/assets/armada/${m.slug}${akhir}.webp?v=${versi(`assets/armada/${m.slug}${akhir}.webp`)}`;
  const teks = alt ?? `${m.nama} ${m.trim} untuk disewa di TWH Rent Car`;
  return `<img${kelas ? ` class="${kelas}"` : ''} src="${v('-720')}" srcset="${v('-720')} 720w, ${v('')} 1400w" sizes="${sizes}" width="${u.w}" height="${u.h}" alt="${esc(teks)}"${muat === 'lazy' ? ' loading="lazy"' : ' fetchpriority="high"'} decoding="async">`;
}

// tanda TWH: segi enam runcing atas-bawah seperti lencana klien (rasio tinggi/lebar 1,1 dari alat/logo.py), bingkai
// navy, isi mint, huruf TWH. Lencana utuh (raster dari berkas klien) dipakai di intro dan gambar bagikan.
const HEKS = (x0, y0, w, h) => `${x0 + w / 2},${y0} ${x0 + w},${y0 + h * 0.25} ${x0 + w},${y0 + h * 0.75} ${x0 + w / 2},${y0 + h} ${x0},${y0 + h * 0.75} ${x0},${y0 + h * 0.25}`;
const SPRITE = `<svg class="sprite" aria-hidden="true" focusable="false">
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
const LOGO = (kelas = 'logo-tanda') => `<svg class="${kelas}" viewBox="0 0 100 110" aria-hidden="true" focusable="false"><use href="#logo-twh"/></svg>`;

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

// ---------- data terstruktur (JSON-LD) ----------
const url = (p) => SITUS + p;
const ogGambar = (h) => url(`/assets/og/${h.kunci}.jpg`);
const BISNIS_ID = url('/#bisnis'), SITUS_ID = url('/#situs');
const BISNIS = {
  '@type': ['AutoRental', 'LocalBusiness'], '@id': BISNIS_ID, name: NAMA, alternateName: ['TWHRENTCAR', 'The TWH Car Rental'],
  description: 'Rental mobil dan bus di Jakarta, Malang, dan Surabaya sejak 2017. Armada dari Avanza sampai bus pariwisata 59 kursi, diantar ke hotel dan bandara, buka 24 jam.',
  url: url('/'), telephone: KONTAK.teleponIntl, image: [url('/assets/og/beranda.jpg'), url(`/assets/armada/toyota-alphard.webp`)],
  logo: { '@type': 'ImageObject', url: url('/assets/logo/lencana.png'), width: 512, height: 563 },
  priceRange: `${rupiah(450000)}–${rupiah(3500000)}`, currenciesAccepted: 'IDR', paymentAccepted: 'Tunai, Transfer bank, GoPay, OVO, DANA',
  foundingDate: KONTAK.berdiri,
  address: { '@type': 'PostalAddress', streetAddress: KONTAK.jalan, addressLocality: 'Jakarta Selatan', addressRegion: 'DKI Jakarta', postalCode: KONTAK.kodePos, addressCountry: 'ID' },
  geo: { '@type': 'GeoCoordinates', latitude: KONTAK.geo.lat, longitude: KONTAK.geo.lng },
  hasMap: KONTAK.maps,
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '00:00', closes: '23:59' }],
  areaServed: KOTA.map((k) => ({ '@type': 'City', name: k.nama })),
  contactPoint: { '@type': 'ContactPoint', telephone: KONTAK.teleponIntl, contactType: 'customer service', areaServed: 'ID', availableLanguage: ['Indonesian'] },
  knowsLanguage: 'id',
  sameAs: [KONTAK.instagram],
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
  areaServed: KOTA.map((k) => ({ '@type': 'City', name: k.nama })),
});
function jsonld(h, remah) {
  const u = url(h.path);
  const tipe = { kontak: 'ContactPage', armada: 'CollectionPage', lokasi: 'CollectionPage', 'cara-sewa': 'FAQPage' }[h.kunci] || 'WebPage';
  const hal = { '@type': tipe, '@id': u + '#halaman', url: u, name: h.judul, description: h.deskripsi, inLanguage: 'id-ID', isPartOf: { '@id': SITUS_ID },
    about: { '@id': BISNIS_ID }, primaryImageOfPage: { '@type': 'ImageObject', url: ogGambar(h), width: 1200, height: 630 }, dateModified: DIPERBARUI };
  const g = [SITUS_LD, BISNIS, hal];
  if (remah.length > 1) {
    hal.breadcrumb = { '@id': u + '#remah' };
    g.push({ '@type': 'BreadcrumbList', '@id': u + '#remah', itemListElement: remah.map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: r.nama, item: url(r.path) })) });
  }
  if (h.kunci === 'cara-sewa') hal.mainEntity = D.FAQ.map((f) => ({ '@type': 'Question', name: f.t, acceptedAnswer: { '@type': 'Answer', text: f.j } }));
  if (h.kunci === 'armada' || h.kunci === 'beranda') {
    const daftar = { '@type': 'ItemList', '@id': url('/armada/#daftar'), name: 'Armada TWH Rent Car', numberOfItems: ARMADA.length,
      itemListElement: ARMADA.map((m, i) => ({ '@type': 'ListItem', position: i + 1, url: url(`/armada/${m.slug}/`), name: `Sewa ${m.nama}` })) };
    if (h.kunci === 'armada') { hal.mainEntity = { '@id': daftar['@id'] }; g.push(daftar); }
  }
  if (h.mobil) {
    const m = h.mobil;
    hal.mainEntity = { '@id': u + '#mobil' };
    g.push({ '@type': ['Product', 'Car'], '@id': u + '#mobil', name: `Sewa ${m.nama} ${m.trim}`, description: m.isi,
      image: url(`/assets/armada/${m.slug}.webp`), ...(m.merek !== 'Bus' ? { brand: { '@type': 'Brand', name: m.merek }, manufacturer: { '@type': 'Organization', name: m.merek } } : {}),
      model: m.model, vehicleConfiguration: m.trim, bodyType: m.jenis, vehicleSeatingCapacity: m.kursi, vehicleTransmission: m.transmisi,
      category: m.jenis, offers: tawaran(m) });
  }
  if (h.kota) {
    const k = h.kota;
    hal.mainEntity = { '@id': u + '#layanan' };
    g.push({ '@type': 'Service', '@id': u + '#layanan', name: `Sewa mobil ${k.nama}`, serviceType: 'Rental mobil dan bus', provider: { '@id': BISNIS_ID },
      areaServed: { '@type': 'City', name: k.nama }, description: k.pembuka,
      offers: { '@type': 'AggregateOffer', priceCurrency: 'IDR', lowPrice: 450000, highPrice: 3500000, offerCount: ARMADA.length } });
  }
  if (h.kunci === 'layanan') {
    hal.mainEntity = D.LAYANAN.map((l) => ({ '@type': 'Service', name: l.judul, description: l.teks, provider: { '@id': BISNIS_ID }, areaServed: KOTA.map((k) => ({ '@type': 'City', name: k.nama })) }));
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': g }).replace(/</g, '\\u003c');
}

// ---------- formulir pesan (lembar di semua halaman, dan di /kontak/) ----------
const pilihanMobil = KELAS.map((k) => `<optgroup label="${esc(k.label)}">${ARMADA.filter((m) => m.kelas === k.id).map((m) => `<option value="${m.slug}">${esc(m.nama)} · ${rupiah(m.harga)}/hari</option>`).join('')}</optgroup>`).join('');
const JAM_PILIHAN = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}.00`);
function formPesan(id) {
  const f = (n) => `${id}-${n}`;
  return `<form class="form-pesan" id="${id}" data-form-pesan novalidate>
  <div class="isian">
    <label class="kolom kolom-lebar" for="${f('mobil')}"><span>Mobil</span>
      <select id="${f('mobil')}" name="mobil"><option value="">Belum tahu, minta saran</option>${pilihanMobil}</select></label>
    <fieldset class="kolom kolom-lebar"><legend>Kota</legend>
      <div class="chips" data-chips="kota">${KOTA.map((k, i) => `<button type="button" aria-pressed="${i === 0}" data-nilai="${k.nama}">${k.nama}</button>`).join('')}</div></fieldset>
    <label class="kolom" for="${f('mulai')}"><span>Tanggal ambil</span><input id="${f('mulai')}" name="mulai" type="date" required><span class="salah" hidden></span></label>
    <label class="kolom" for="${f('selesai')}"><span>Tanggal kembali</span><input id="${f('selesai')}" name="selesai" type="date" required><span class="salah" hidden></span></label>
    <label class="kolom" for="${f('jam')}"><span>Jam ambil</span><select id="${f('jam')}" name="jam">${JAM_PILIHAN.map((j) => `<option${j === '08.00' ? ' selected' : ''}>${j}</option>`).join('')}</select></label>
    <fieldset class="kolom"><legend>Mobil diserahkan di</legend>
      <div class="chips" data-chips="tempat">${['Garasi kami', 'Hotel', 'Bandara', 'Alamat lain'].map((t, i) => `<button type="button" aria-pressed="${i === 0}" data-nilai="${t}">${t}</button>`).join('')}</div></fieldset>
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
    <div class="lembar-kepala"><h2 id="lembar-judul">Pesan mobil.</h2><button class="lembar-tutup" type="button" data-tutup aria-label="Tutup">${ikon('tutup')}</button></div>
    ${formPesan('lembar-form')}
  </div>
</dialog>`;

// ---------- halaman ----------
function remahUntuk(h) {
  const r = [{ nama: 'Beranda', path: '/' }];
  if (h.kunci === 'beranda') return r;
  if (h.induk) { const i = HALAMAN.find((x) => x.kunci === h.induk); r.push({ nama: i.kunci === 'lokasi' ? 'Lokasi' : i.nav, path: i.path }); }
  r.push({ nama: h.mobil ? h.mobil.nama : h.kota ? `Sewa mobil ${h.kota.nama}` : h.nav === 'Kota' ? 'Lokasi' : h.nav, path: h.path });
  return r;
}
const remahHtml = (r) => r.length < 2 ? '' : `<nav class="remah" aria-label="Remah roti"><ol>${r.map((x, i) => i === r.length - 1 ? `<li aria-current="page">${esc(x.nama)}</li>` : `<li><a href="${x.path}">${esc(x.nama)}</a></li>`).join('')}</ol></nav>`;

const nav = HALAMAN.filter((x) => x.nav);
const navTautan = (h) => (x) => {
  const aktif = x.kunci === h.kunci || h.induk === x.kunci;
  return `<a href="${x.path}"${aktif ? ` class="aktif"${x.kunci === h.kunci ? ' aria-current="page"' : ''}` : ''}>${esc(x.nav)}</a>`;
};

async function render(h) {
  const beranda = h.kunci === 'beranda';
  const remah = remahUntuk(h);
  const { default: isi } = await import(pathToFileURL(join(AKAR, 'src', 'halaman', `${h.templat}.mjs`)).href);
  const ctx = { h, D, ikon, esc, aset, versi, fotoMobil, mobilBySlug, WA, LOGO, remah: remahHtml(remah), formPesan, UKURAN, rupiah };
  const og = ogGambar(h) + `?v=${versi(`assets/og/${h.kunci}.jpg`)}`;
  // gambar terbesar di layar pertama (LCP): mobil pertama di hero beranda, mobil di halaman mobil
  const muatAwal = beranda ? HERO[0] : h.mobil;
  const pramuat = muatAwal ? `<link rel="preload" as="image" href="/assets/armada/${muatAwal.slug}-720.webp?v=${versi(`assets/armada/${muatAwal.slug}-720.webp`)}" imagesrcset="/assets/armada/${muatAwal.slug}-720.webp?v=${versi(`assets/armada/${muatAwal.slug}-720.webp`)} 720w, /assets/armada/${muatAwal.slug}.webp?v=${versi(`assets/armada/${muatAwal.slug}.webp`)} 1400w" imagesizes="${beranda ? '(max-width: 760px) 92vw, 56vw' : '(max-width: 900px) 92vw, 52vw'}" fetchpriority="high">\n` : '';
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="format-detection" content="telephone=no, date=no, address=no">
<title>${esc(h.judul)}</title>
<meta name="description" content="${esc(h.deskripsi)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<link rel="canonical" href="${url(h.path)}">
<meta name="theme-color" content="#EEF4F1">
<meta name="google-site-verification" content="9gL2tKgtHNhdStXDPxCgOnIVfQBGf971LLXL4w3vFeE">
<meta property="og:type" content="${h.mobil ? 'product' : 'website'}">
<meta property="og:site_name" content="${NAMA}">
<meta name="application-name" content="${NAMA}">
<meta name="apple-mobile-web-app-title" content="${NAMA}">
<meta property="og:locale" content="id_ID">
<meta property="og:title" content="${esc(h.judul.replace(/ \| TWH Rent Car$/, ''))}">
<meta property="og:description" content="${esc(h.deskripsi)}">
<meta property="og:url" content="${url(h.path)}">
<meta property="og:image" content="${og}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(h.og)} TWH Rent Car">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(h.judul)}">
<meta name="twitter:description" content="${esc(h.deskripsi)}">
<meta name="twitter:image" content="${og}">
<meta name="geo.region" content="ID-JK">
<meta name="geo.placename" content="Jakarta Selatan">
<meta name="geo.position" content="${KONTAK.geo.lat};${KONTAK.geo.lng}">
<link rel="icon" href="/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/font/archivo.woff2" as="font" type="font/woff2" crossorigin>
${pramuat}<link rel="stylesheet" href="/styles.css?v=${versi('styles.css')}">
<script src="/app.js?v=${versi('app.js')}" defer></script>
<script type="application/ld+json">${jsonld(h, remah)}</script>
</head>
<body data-halaman="${h.templat}">
${beranda ? INTRO + '\n' : ''}<div data-nosnippet>${SPRITE}
<a class="lewati" href="#isi">Langsung ke isi</a></div>
<canvas id="latar" aria-hidden="true"></canvas>

<header class="kepala di-hero" id="kepala">
  <div class="kepala-isi" data-nosnippet>
    <a class="logo" href="/" aria-label="TWH Rent Car, beranda">${LOGO()}<span class="logo-nama">TWH Rent Car</span></a>
    <nav class="nav" aria-label="Navigasi utama">
      ${nav.map(navTautan(h)).join('\n      ')}
    </nav>
    <div class="kepala-kanan">
      <a class="kepala-telepon" href="tel:${KONTAK.teleponLink}">${ikon('telepon')}<span>${KONTAK.telepon}</span></a>
      <a class="pill pill-kecil pill-navy kepala-cta" href="/kontak/#pesan" data-pesan>Pesan mobil</a>
      <button class="burger" id="burger" type="button" aria-label="Buka menu" aria-expanded="false" aria-controls="menu"><span></span><span></span></button>
    </div>
  </div>
</header>

<div class="menu" id="menu" hidden>
  <div class="menu-latar" aria-hidden="true"></div>
  <nav aria-label="Navigasi seluler">
    <a href="/"${beranda ? ' class="aktif" aria-current="page"' : ''}>Beranda</a>
    ${nav.map(navTautan(h)).join('\n    ')}
  </nav>
  <div class="menu-bawah">
    <span class="buka-24">${ikon('jam')} Buka 24 jam, setiap hari</span>
    <a class="pill pill-mint pill-lebar" data-wa="umum" href="${WA}" target="_blank" rel="noopener">${ikon('wa')} Chat WhatsApp</a>
    <a class="menu-telepon" href="tel:${KONTAK.teleponLink}">${KONTAK.telepon}</a>
  </div>
</div>

<main id="isi">
${isi(ctx).trim()}
</main>

<footer class="kaki">
  <section class="ajakan gelap" id="ajakan" aria-labelledby="cta-akhir">
    <canvas id="kaki-kanvas" aria-hidden="true"></canvas>
    <div class="ajakan-isi">
      <h2 id="cta-akhir">Kuncinya sudah siap.</h2>
      <p>Tinggal pilih tanggalnya. Kami balas WhatsApp Anda kapan saja, 24 jam.</p>
      <div class="tombol-kiri">
        <a class="pill pill-mint" data-wa="umum" href="${WA}" target="_blank" rel="noopener">${ikon('wa')} Chat WhatsApp</a>
        <a class="tautan-terang" href="/kontak/#pesan" data-pesan>Isi formulir pesan ${ikon('panah')}</a>
      </div>
    </div>
    <p class="ajakan-petunjuk" aria-hidden="true">Goyangkan kuncinya</p>
  </section>
  <div class="kaki-bawah">
    <div class="kaki-merek">
      <a class="kaki-logo" href="/" aria-label="TWH Rent Car, beranda">${LOGO()}<span>TWH Rent Car</span></a>
      <address class="kaki-nap">
        <span>${esc(KONTAK.alamat)}</span>
        <a href="tel:${KONTAK.teleponLink}">${KONTAK.telepon}</a>
        <span>${esc(KONTAK.jam)}</span>
      </address>
    </div>
    <nav class="kaki-kolom" aria-label="Armada">
      <h3>Armada</h3>
      ${ARMADA.map((m) => `<a href="/armada/${m.slug}/">Sewa ${esc(m.nama)}</a>`).join('\n      ')}
    </nav>
    <nav class="kaki-kolom" aria-label="Kota dan halaman">
      <h3>Kota</h3>
      ${KOTA.map((k) => `<a href="/sewa-mobil-${k.slug}/">Sewa mobil ${k.nama}</a>`).join('\n      ')}
      <h3 class="kaki-h3-jarak">Halaman</h3>
      ${nav.map((x) => `<a href="${x.path}">${esc(x.nav === 'Kota' ? 'Lokasi' : x.nav)}</a>`).join('\n      ')}
    </nav>
  </div>
  <div class="kaki-dasar">
    <span>© <span id="tahun">2026</span> TWH Rent Car · sejak ${KONTAK.berdiri}</span>
    <a class="kaki-oleh" href="https://arswordlab.com" target="_blank" rel="noopener">Website oleh ARSWORD</a>
  </div>
</footer>

${LEMBAR}
<a class="fab" id="fab" data-wa="umum" href="${WA}" target="_blank" rel="noopener" aria-label="Chat WhatsApp" title="Chat WhatsApp" tabindex="-1">${ikon('wa')}</a>
<script type="application/json" id="armada-data">${JSON.stringify(ARMADA.map((m) => ({ slug: m.slug, nama: m.nama, trim: m.trim, harga: m.harga, kursi: m.kursi, transmisi: m.transmisi, kelas: m.kelas, arah: m.arah, lampu: m.lampu || null, hero: m.hero || 0, w: UKURAN[m.slug].w, h: UKURAN[m.slug].h, v: versi(`assets/armada/${m.slug}.webp`), v7: versi(`assets/armada/${m.slug}-720.webp`) }))).replace(/</g, '\\u003c')}</script>
</body>
</html>
`;
}

const ogDaftar = [];
for (const h of HALAMAN) {
  const html = await render(h);
  const tujuan = join(AKAR, 'public', h.path, 'index.html');
  mkdirSync(dirname(tujuan), { recursive: true });
  writeFileSync(tujuan, html);
  ogDaftar.push({ kunci: h.kunci, judul: h.og, sub: h.mobil ? `${h.mobil.kursi} kursi · ${h.mobil.transmisi} · mulai ${rupiah(h.mobil.harga)}/hari` : h.kota ? `${h.kota.unit} unit · antar ke hotel dan bandara · buka 24 jam` : 'Jakarta · Malang · Surabaya · buka 24 jam', mobil: h.foto });
  console.log('ditulis', h.path);
}
writeFileSync(join(AKAR, 'src', 'og.json'), JSON.stringify(ogDaftar, null, 1) + '\n');

// sitemap: semua halaman, prioritas beranda > halaman utama > mobil dan kota
const prioritas = (h) => h.kunci === 'beranda' ? '1.0' : h.nav ? '0.8' : '0.7';
writeFileSync(join(AKAR, 'public', 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${HALAMAN.map((h) => `  <url>
    <loc>${url(h.path)}</loc>
    <lastmod>${DIPERBARUI}</lastmod>
    <changefreq>${h.kunci === 'beranda' || h.kunci === 'armada' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${prioritas(h)}</priority>${h.mobil ? `
    <image:image><image:loc>${url(`/assets/armada/${h.mobil.slug}.webp`)}</image:loc></image:image>` : ''}
  </url>`).join('\n')}
</urlset>
`);
// robots: semua boleh dirayapi (CSS, JS, dan gambar perlu dibaca Google untuk merender halaman)
writeFileSync(join(AKAR, 'public', 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${url('/sitemap.xml')}\n`);
writeFileSync(join(AKAR, 'public', 'site.webmanifest'), JSON.stringify({
  name: NAMA, short_name: 'TWH Rent Car', lang: 'id', start_url: '/', display: 'browser', background_color: '#EEF4F1', theme_color: '#1B4766',
  icons: [{ src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }, { src: '/assets/logo/ikon-512.png', sizes: '512x512', type: 'image/png' }],
}, null, 1) + '\n');
// 404: halaman sederhana tanpa app.js
writeFileSync(join(AKAR, 'public', '404.html'), `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Halaman tidak ditemukan | TWH Rent Car</title><meta name="robots" content="noindex">
<link rel="icon" href="/favicon.png" type="image/png"><link rel="stylesheet" href="/styles.css?v=${versi('styles.css')}"></head>
<body class="hal-404">${SPRITE}<main class="kosong-404">${LOGO('kosong-logo')}<h1>Jalannya buntu.</h1><p>Halaman yang Anda cari tidak ada atau sudah pindah.</p>
<div class="tombol-baris"><a class="pill pill-navy" href="/">Ke beranda</a><a class="pill pill-garis-gelap" href="/armada/">Lihat armada</a></div></main></body></html>
`);
console.log('sitemap.xml, robots.txt, site.webmanifest, 404.html, src/og.json ditulis');
if (!existsSync(join(AKAR, 'public', 'assets', 'og', 'beranda.jpg'))) console.log('gambar bagikan belum ada: jalankan python -I alat/og.py lalu node bangun.mjs lagi');
