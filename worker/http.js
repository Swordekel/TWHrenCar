// Bantuan HTTP untuk API panel admin: balasan JSON, galat yang membawa status, cookie, isi permintaan, pemeriksaan asal
// yang sama untuk semua yang mengubah data, dan nilai acak serta hash. (Diadaptasi dari worker/http.js ARSWORD.)

export class GalatHttp extends Error {
  constructor(status, kode, pesan, tambahan = null) {
    super(pesan);
    this.status = status;
    this.kode = kode;
    this.tambahan = tambahan;
  }
}

// lempar dari mana saja; router mengubahnya jadi balasan JSON dengan pesan yang bisa ditampilkan halaman
export function gagal(status, kode, pesan, tambahan = null) {
  throw new GalatHttp(status, kode, pesan, tambahan);
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...headers,
    },
  });
}

export function cookies(req) {
  const out = {};
  for (const part of (req.headers.get('cookie') || '').split(/;\s*/)) {
    const i = part.indexOf('=');
    if (i > 0) {
      try { out[part.slice(0, i)] = decodeURIComponent(part.slice(i + 1)); } catch { /* cookie rusak = tidak ada */ }
    }
  }
  return out;
}

// isi JSON paling besar `maks` byte
export async function isiJson(req, maks = 100_000) {
  if ((+req.headers.get('content-length') || 0) > maks) gagal(413, 'terlalu_besar', 'Isinya terlalu besar.');
  const teks = await req.text();
  if (teks.length > maks) gagal(413, 'terlalu_besar', 'Isinya terlalu besar.');
  try {
    return teks ? JSON.parse(teks) : {};
  } catch {
    gagal(400, 'json', 'Format data tidak dikenali.');
  }
}

// semua yang mengubah data harus datang dari halaman kita sendiri: cookie sesi SameSite=Strict, dan Origin (atau, tanpa
// itu, Fetch Metadata) harus menyebut situs ini. GET dan HEAD tidak pernah mengubah apa pun.
// alamat lama, www, dan http:// dialihkan permanen (301) ke https:// alamat utama situs (env.SITUS), dengan jalur dan
// kueri yang sama, supaya tautan lama tetap jalan dan Google hanya mengenal satu alamat. Tidak berlaku saat pengembangan
// lokal (DEV=1).
// (twhrentcar.vercel.app dialihkan oleh Vercel sendiri, lihat vercel.json)
export const ALAMAT_LAMA = ['twhrentcar.arswordlab.com'];
export function alamatKanon(url, env) {
  if (env.DEV === '1' || !env.SITUS) return null;
  const utama = new URL(env.SITUS).host;
  const alamatLain = ALAMAT_LAMA.includes(url.hostname) || url.hostname === 'www.' + utama;
  if (!alamatLain && (url.host !== utama || url.protocol === 'https:')) return null;
  return `https://${utama}${url.pathname}${url.search}`;
}

export function asalSama(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return true;
  const origin = req.headers.get('origin');
  if (origin) return origin === new URL(req.url).origin;
  return req.headers.get('sec-fetch-site') === 'same-origin';
}

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export async function sha256(s) {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
}

export const acakHex = (bytes) => hex(crypto.getRandomValues(new Uint8Array(bytes)));

export function tokenAcak(bytes = 32) {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// kode 6 angka yang benar-benar acak merata (rejection sampling)
export function enamAngka() {
  const a = new Uint32Array(1);
  let n;
  do { crypto.getRandomValues(a); n = a[0]; } while (n >= 4_294_000_000);
  return String(n % 1_000_000).padStart(6, '0');
}

// perbandingan dua string hex dengan waktu tetap
export function sama(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export const normalEmail = (e) => String(e ?? '').trim().toLowerCase();
export const emailSah = (e) => /^[^@\s]{1,64}@[^@\s]{1,190}\.[a-z]{2,}$/i.test(e) && e.length <= 254;

export async function catat(env, { oleh = null, aksi, bagian = null, detail = null }) {
  await env.DB.prepare('INSERT INTO aktivitas (pada, oleh, aksi, bagian, detail) VALUES (?, ?, ?, ?, ?)')
    .bind(Date.now(), oleh, aksi, bagian, detail == null ? null : typeof detail === 'string' ? detail : JSON.stringify(detail))
    .run();
}
