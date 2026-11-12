// Worker situs TWH Rent Car (twhrentcar.arswordlab.com).
//
// - Halaman (/, /armada/, …, /armada/<mobil>/ untuk setiap mobil yang tampil, /sewa-mobil-<kota>/): dirakit dari versi
//   terbit panel admin (D1) dengan src/rakit.mjs. Selama belum ada versi terbit, atau bila database tidak bisa dibaca,
//   halaman cadangan statis di public/ yang dikirim (hasil node bangun.mjs dari isi awal, isinya sama).
// - /admin/: panel admin (berkas statis di public/admin/), /admin/api/*: API-nya, /admin/pratinjau/*: halaman dirakit
//   dari draf (hanya untuk yang sudah masuk).
// - /media/*: foto unggahan panel admin (R2).
// - /robots.txt dan /sitemap.xml mengikuti versi terbit dan pengaturan "tampil di Google" (akun pembuat).
// - http:// dialihkan permanen ke https:// (zona arswordlab.com tidak memaksa HTTPS; worker/http.js alamatKanon), dan
//   perapian alamat dari html_handling (/armada -> /armada/) yang dijawab Cloudflare dengan 307 dijadikan 301.
// Berkas lain (CSS, JS, foto bawaan, font) langsung dari aset statis tanpa melewati Worker (run_worker_first).
import { rakit, halamanDari, halaman404, sitemapXml } from '../src/rakit.mjs';
import MANIFEST from '../src/manifest.json';
import UKURAN from '../src/armada-ukuran.json';
import PETA from '../src/peta.json';
import { json, gagal, GalatHttp, asalSama, alamatKanon } from './http.js';
import { mintaKode, cocokkanKode, masukTiket, akunMasuk, keluar } from './auth.js';
import { ambilTerbit, ambilDraf, petaMedia, apiIsi, simpanBagian, terbitkan, buangDraf, riwayat, pulihkan } from './isi.js';
import { daftarMedia, unggah, ubahMedia, hapusMedia, sajikanMedia } from './media.js';
import { daftarAkun, tambahAkun, ubahAkun, hapusAkun, keluarkanAkun, saya, ubahSaya } from './akun.js';
import { izinAsisten, tanyaAsisten, kodeAsisten } from './asisten.js';

const SITUS = 'https://twhrentcar.arswordlab.com';
// sama dengan blok /* di public/_headers (halaman statis); ubah keduanya bersamaan
const CSP = "default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; frame-src https://www.google.com https://maps.google.com; connect-src 'self' https://cloudflareinsights.com; base-uri 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'self'";
const KEPALA = {
  'content-type': 'text/html; charset=utf-8',
  'content-security-policy': CSP,
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'x-frame-options': 'SAMEORIGIN',
};
// panel admin (sama dengan blok /admin/* di public/_headers)
const KEPALA_ADMIN = {
  'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'",
  'cache-control': 'no-cache',
  'x-frame-options': 'SAMEORIGIN',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-robots-tag': 'noindex',
};
async function panelAdmin(req, env) {
  const r = await env.ASSETS.fetch(req), h = new Headers(r.headers);
  for (const [k, v] of Object.entries(KEPALA_ADMIN)) h.set(k, v);
  return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
}

const situsDari = (env) => env.SITUS || SITUS;
const tgl = (ms) => new Date((ms || Date.now()) + 7 * 3600_000).toISOString().slice(0, 10);
const alatDasar = (env, media, pada) => ({
  versi: (rel) => MANIFEST[rel] || '0',
  ada: (rel) => !!MANIFEST[rel],
  ukuran: UKURAN,
  peta: PETA,
  media,
  situs: situsDari(env),
  diperbarui: tgl(pada),
});

// alamat halaman yang mungkin ada (mobil dan kota bisa ditambah lewat panel)
const POLA_HALAMAN = /^\/(?:|armada\/|layanan\/|cara-sewa\/|lokasi\/|kontak\/|armada\/[a-z0-9-]+\/|sewa-mobil-[a-z0-9-]+\/)$/;

async function halamanPublik(req, env, path) {
  let terbit = null;
  try { terbit = await ambilTerbit(env); } catch (err) { console.error('versi terbit tidak terbaca', err && err.message); }
  if (!terbit) return aset(req, env);
  const alat = alatDasar(env, terbit.media, terbit.pada);
  const h = halamanDari(terbit.isi, path);
  const indeks = terbit.isi.situs.indeks !== false;
  if (!h) return new Response(req.method === 'HEAD' ? null : halaman404(alat), { status: 404, headers: { ...KEPALA, 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
  const html = rakit(h, terbit.isi, alat);
  return new Response(req.method === 'HEAD' ? null : html, {
    headers: { ...KEPALA, 'cache-control': 'public, max-age=0, must-revalidate', ...(indeks ? {} : { 'x-robots-tag': 'noindex' }) },
  });
}

// pratinjau draf: tautan antarhalaman tetap di dalam /admin/pratinjau/
const keDalamPratinjau = (html) => html.replace(/href="\/(?!\/|assets\/|media\/|admin\/|favicon|apple-touch|site\.webmanifest|styles\.css|app\.js)/g, 'href="/admin/pratinjau/');
async function pratinjau(req, env, path) {
  const akun = await akunMasuk(req, env);
  if (!akun) return new Response('Masuk dulu ke panel admin.', { status: 401, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  const p = path.endsWith('/') ? path : path + '/';
  const [d, media] = await Promise.all([ambilDraf(env), petaMedia(env)]);
  const alat = alatDasar(env, media, Date.now());
  const h = halamanDari(d.isi, p) || halamanDari(d.isi, '/');
  const html = keDalamPratinjau(rakit(h, d.isi, alat));
  return new Response(html, { headers: { ...KEPALA, 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
}

async function terbitAtauNull(env) {
  try { return await ambilTerbit(env); } catch { return null; }
}

async function robots(env) {
  const t = await terbitAtauNull(env);
  const buka = !t || t.isi.situs.indeks !== false;
  const teks = buka
    ? `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${situsDari(env)}/sitemap.xml\n`
    : '# Sementara tidak dibuka untuk mesin pencari (Pengaturan situs di panel admin).\nUser-agent: *\nDisallow: /\n';
  return new Response(teks, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300' } });
}

async function sitemap(req, env) {
  const t = await terbitAtauNull(env);
  if (!t) return aset(req, env);
  if (t.isi.situs.indeks === false) return new Response('Tidak ditemukan', { status: 404 });
  const xml = sitemapXml(t.isi, alatDasar(env, t.media, t.pada));
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=300' } });
}

// foto mobil bawaan (public/assets/armada) untuk pemilih foto di panel admin, dan kota yang punya titik di peta
function bawaan() {
  return json({
    foto: Object.entries(UKURAN).map(([nama, { w, h }]) => ({
      nama, w, h,
      url: `/assets/armada/${nama}.webp?v=${MANIFEST[`assets/armada/${nama}.webp`] || '0'}`,
      kecil: `/assets/armada/${nama}-720.webp?v=${MANIFEST[`assets/armada/${nama}-720.webp`] || '0'}`,
    })),
    tempat: Object.keys(PETA.tempat),
  });
}

async function api(req, env, jalur, ctx) {
  const m = req.method, s = jalur.split('/').filter(Boolean);
  if (!asalSama(req)) gagal(403, 'asal', 'Permintaan ini harus datang dari panel admin.');
  // tanpa sesi
  if (m === 'POST' && jalur === 'masuk/kode') return mintaKode(req, env);
  if (m === 'POST' && jalur === 'masuk/verifikasi') return cocokkanKode(req, env);
  // masuk dari dashboard ARSWORD dengan tiket sekali pakai (worker/auth.js masukTiket); dibuka sebagai tautan, jadi GET
  if (m === 'GET' && jalur === 'masuk/tiket') return masukTiket(req, env);
  const akun = await akunMasuk(req, env);
  if (!akun) gagal(401, 'masuk', 'Sesi Anda sudah berakhir. Masuk lagi dengan kode email.');
  const pembuat = akun.peran === 'pembuat';
  const r = await (async () => {
    if (jalur === 'saya') return m === 'GET' ? saya(env, akun) : m === 'PATCH' ? ubahSaya(req, env, akun) : null;
    if (m === 'POST' && jalur === 'keluar') return keluar(req, env, akun);
    if (m === 'POST' && jalur === 'keluar-semua') return keluar(req, env, akun, true);
    if (m === 'GET' && jalur === 'isi') return apiIsi(env);
    if (m === 'PUT' && s[0] === 'isi' && s[1]) return simpanBagian(req, env, akun, s[1]);
    if (m === 'POST' && jalur === 'terbit') return terbitkan(req, env, akun);
    if (m === 'POST' && jalur === 'buang') return buangDraf(req, env, akun);
    if (m === 'GET' && jalur === 'riwayat') return riwayat(env);
    if (m === 'POST' && s[0] === 'versi' && s[2] === 'pulihkan') return pulihkan(env, akun, +s[1]);
    if (m === 'GET' && jalur === 'bawaan') return bawaan();
    // asisten Claude, khusus admin ARSWORD (worker/asisten.js; ARSWORD yang memutuskan siapa admin-nya)
    if (jalur === 'asisten') return m === 'GET' ? izinAsisten(env, akun) : m === 'POST' ? tanyaAsisten(req, env, akun, ctx) : null;
    if (m === 'POST' && jalur === 'asisten/kode') return kodeAsisten(req, env, akun);
    if (s[0] === 'media') {
      if (m === 'GET' && !s[1]) return daftarMedia(env);
      if (m === 'POST' && !s[1]) return unggah(req, env, akun);
      if (m === 'PATCH' && s[1]) return ubahMedia(req, env, akun, s[1]);
      if (m === 'DELETE' && s[1]) return hapusMedia(env, akun, s[1]);
    }
    if (s[0] === 'akun') {
      if (!pembuat) gagal(403, 'pembuat', 'Hanya akun pembuat yang bisa mengelola akun.');
      if (m === 'GET' && !s[1]) return daftarAkun(env);
      if (m === 'POST' && !s[1]) return tambahAkun(req, env, akun);
      if (m === 'PATCH' && s[1]) return ubahAkun(req, env, akun, +s[1]);
      if (m === 'DELETE' && s[1]) return hapusAkun(env, akun, +s[1]);
      if (m === 'POST' && s[2] === 'keluarkan') return keluarkanAkun(env, akun, +s[1]);
    }
    return null;
  })();
  if (!r) gagal(404, 'tidak_ada', 'Alamat API ini tidak ada.');
  if (akun.perpanjang && !r.headers.has('set-cookie')) {
    const h = new Headers(r.headers); h.append('set-cookie', akun.perpanjang);
    return new Response(r.body, { status: r.status, headers: h });
  }
  return r;
}

// aset statis; perapian alamat 307 dari html_handling dijadikan 301 (permanen)
async function aset(req, env) {
  const res = await env.ASSETS.fetch(req);
  if (res.status === 307 && res.headers.has('location')) return new Response(null, { status: 301, headers: new Headers(res.headers) });
  return res;
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url), p = url.pathname;
    const kanon = alamatKanon(url, env);
    if (kanon) return Response.redirect(kanon, 301);
    try {
      if (p.startsWith('/admin/api/')) return await api(req, env, p.slice('/admin/api/'.length), ctx);
      if (p === '/admin/pratinjau' || p.startsWith('/admin/pratinjau/')) return await pratinjau(req, env, p.slice('/admin/pratinjau'.length) || '/');
      if (p.startsWith('/media/')) return await sajikanMedia(req, env, p.slice('/media/'.length));
      if (p === '/admin' || p === '/admin/') return await panelAdmin(req, env);
      if (p === '/robots.txt') return await robots(env);
      if (p === '/sitemap.xml') return await sitemap(req, env);
      const baca = req.method === 'GET' || req.method === 'HEAD';
      if (baca && POLA_HALAMAN.test(p)) return await halamanPublik(req, env, p);
      // alamat halaman tanpa garis miring akhir (juga untuk mobil dan kota baru yang belum punya halaman statis)
      if (baca && !p.endsWith('/') && POLA_HALAMAN.test(p + '/')) return Response.redirect(`${url.origin}${p}/${url.search}`, 301);
      return await aset(req, env);
    } catch (err) {
      if (err instanceof GalatHttp) return json({ ok: false, kode: err.kode, pesan: err.message, ...(err.tambahan || {}) }, err.status);
      console.error('galat', err && err.stack);
      return json({ ok: false, kode: 'galat', pesan: 'Terjadi kesalahan di server. Coba lagi sebentar.' }, 500);
    }
  },
};
