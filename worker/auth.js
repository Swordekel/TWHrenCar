// Masuk ke panel admin: email dan kode 6 angka yang dikirim ke email itu. Tanpa kata sandi (pola yang sama dengan Studio
// ARSWORD, termasuk hasil audit keamanannya 2026-10-03).
// - Hanya email terdaftar (tabel akun, aktif) dan email PEMBUAT yang dikirimi kode. Untuk email lain balasannya sama
//   (tidak membocorkan email mana yang terdaftar), tapi tidak ada email yang dikirim.
// - Kode berlaku 10 menit, 5 tebakan per kode, hanya hash-nya disimpan, dan sekali pakai.
// - Satu email boleh meminta 5 kode per jam, satu IP 20, semua email bersama 100 (kuota email tidak bisa dihabiskan satu
//   pengirim). Satu email boleh salah menebak 10 kali sehari (pembuat 20).
// - Kode benar = sesi 30 hari: cookie berisi token acak, database hanya hash-nya. Sesi diperpanjang paling sering sekali
//   sehari selama dipakai. Cookie __Host-, HttpOnly, Secure, SameSite=Strict.
// - Admin ARSWORD juga bisa masuk dari dashboard arswordlab.com (Panel situs) tanpa kode: lihat masukTiket di bawah.
import { json, gagal, isiJson, cookies, sha256, tokenAcak, enamAngka, sama, normalEmail, emailSah, catat } from './http.js';
import { kirimKode } from './surat.js';

const UMUR_KODE = 10 * 60_000;
const UMUR_SESI = 30 * 24 * 3600_000;
const PERPANJANG = 24 * 3600_000;
const PER_EMAIL = 5, PER_IP = 20, SEMUA = 100;
const SALAH_HARI = 10, SALAH_HARI_PEMBUAT = 20;
const SALAH = 'salah';

const namaCookie = (env) => (env.DEV === '1' ? 'twh_sesi' : '__Host-twh_sesi');
const cookieSesi = (env, nilai, ms) =>
  `${namaCookie(env)}=${nilai}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.round(ms / 1000)}; Expires=${new Date(ms ? Date.now() + ms : 0).toUTCString()}${env.DEV === '1' ? '' : '; Secure'}`;

export const daftarPembuat = (env) => String(env.PEMBUAT || '').split(',').map(normalEmail).filter(Boolean);
export const pembuatTetap = (env, email) => daftarPembuat(env).includes(normalEmail(email));

async function bolehMasuk(env, e) {
  if (pembuatTetap(env, e)) return true;
  const a = await env.DB.prepare('SELECT aktif FROM akun WHERE email = ?').bind(e).first();
  return !!(a && a.aktif);
}

export async function mintaKode(req, env) {
  const { email } = await isiJson(req, 2_000);
  const e = normalEmail(email);
  if (!emailSah(e)) gagal(400, 'email', 'Tulis alamat email yang benar.');
  const sekarang = Date.now(), sejak = sekarang - 3600_000;
  const ip = req.headers.get('cf-connecting-ip') || '';
  const perEmail = await env.DB.prepare('SELECT COUNT(*) AS n FROM kode_masuk WHERE email = ? AND dibuat_pada > ? AND kode_hash != ?').bind(e, sejak, SALAH).first('n');
  if (perEmail >= PER_EMAIL) gagal(429, 'pelan', 'Kode sudah diminta beberapa kali. Coba lagi dalam satu jam, atau pakai kode terakhir di email Anda.');
  if (ip) {
    const perIp = await env.DB.prepare('SELECT COUNT(*) AS n FROM kode_masuk WHERE ip = ? AND dibuat_pada > ? AND kode_hash != ?').bind(ip, sejak, SALAH).first('n');
    if (perIp >= PER_IP) gagal(429, 'pelan', 'Terlalu banyak permintaan dari jaringan ini. Coba lagi dalam satu jam.');
  }
  const semua = await env.DB.prepare('SELECT COUNT(*) AS n FROM kode_masuk WHERE dibuat_pada > ? AND kode_hash != ?').bind(sejak, SALAH).first('n');
  if (semua >= SEMUA) gagal(429, 'pelan', 'Layanan masuk sedang sibuk. Coba lagi beberapa menit lagi.');
  // wrangler dev memberi req.url berhost rute produksi, jadi SITUS (dari .dev.vars) ikut diperiksa
  const lokal = env.DEV_MAIL === '1' && (/^(localhost|127\.0\.0\.1)$/.test(new URL(req.url).hostname) || /^http:\/\/(localhost|127\.0\.0\.1)[:/]/.test(env.SITUS || ''));
  if (!(await bolehMasuk(env, e))) {
    // dicatat untuk batas per IP, tanpa kode sungguhan (kode_hash acak yang tidak pernah cocok)
    await env.DB.prepare('INSERT INTO kode_masuk (email, kode_hash, ip, dibuat_pada, kedaluwarsa) VALUES (?, ?, ?, ?, ?)')
      .bind(e, 'x' + tokenAcak(16), ip, sekarang, sekarang).run();
    return json({ ok: true, email: e, ...(lokal ? { devTerdaftar: false } : {}) });
  }
  const kode = enamAngka();
  await env.DB.prepare('INSERT INTO kode_masuk (email, kode_hash, ip, dibuat_pada, kedaluwarsa) VALUES (?, ?, ?, ?, ?)')
    .bind(e, await sha256(`${e}:${kode}`), ip, sekarang, sekarang + UMUR_KODE).run();
  await kirimKode(env, e, kode);
  // pengembangan lokal saja (email dicetak, alamat localhost): kode ikut dikembalikan untuk uji otomatis
  return json({ ok: true, email: e, ...(lokal ? { devKode: kode } : {}) });
}

export async function cocokkanKode(req, env) {
  const { email, kode } = await isiJson(req, 2_000);
  const e = normalEmail(email);
  const k = String(kode ?? '').replace(/\D/g, '');
  if (!emailSah(e)) gagal(400, 'email', 'Tulis alamat email yang benar.');
  if (k.length !== 6) gagal(400, 'kode', 'Kodenya 6 angka.');
  const sekarang = Date.now();
  const salah = await env.DB.prepare('SELECT COUNT(*) AS n FROM kode_masuk WHERE email = ? AND kode_hash = ? AND dibuat_pada > ?').bind(e, SALAH, sekarang - 86400_000).first('n');
  if (salah >= (pembuatTetap(env, e) ? SALAH_HARI_PEMBUAT : SALAH_HARI)) gagal(429, 'pelan', 'Terlalu banyak kode yang salah hari ini. Coba lagi besok, atau hubungi ARSWORD.');
  // setiap kode yang masih berlaku untuk email ini ikut dihitung (email lama bisa datang setelah yang baru); tebakan
  // dihitung dalam pernyataan yang sama yang membaca kodenya, jadi dua tebakan bersamaan tidak lolos batas
  const hidup = (await env.DB.prepare(
    'UPDATE kode_masuk SET percobaan = percobaan + 1 WHERE email = ? AND dipakai_pada IS NULL AND kedaluwarsa > ? AND percobaan < 5 AND kode_hash != ? RETURNING id, kode_hash',
  ).bind(e, sekarang, SALAH).all()).results || [];
  if (!hidup.length) gagal(400, 'kedaluwarsa', 'Kode ini sudah tidak berlaku. Minta kode baru.');
  const h = await sha256(`${e}:${k}`);
  const kena = hidup.find((r) => sama(r.kode_hash, h));
  if (!kena) {
    await env.DB.prepare('INSERT INTO kode_masuk (email, kode_hash, ip, percobaan, dipakai_pada, dibuat_pada, kedaluwarsa) VALUES (?, ?, ?, 0, ?, ?, ?)')
      .bind(e, SALAH, req.headers.get('cf-connecting-ip') || '', sekarang, sekarang, sekarang).run();
    gagal(400, 'salah', 'Kodenya belum cocok. Periksa lagi email terbaru dari kami.');
  }
  const klaim = await env.DB.prepare('UPDATE kode_masuk SET dipakai_pada = ? WHERE id = ? AND dipakai_pada IS NULL').bind(sekarang, kena.id).run();
  if (klaim.meta.changes !== 1) gagal(400, 'kedaluwarsa', 'Kode ini sudah dipakai. Minta kode baru.');
  await env.DB.prepare('UPDATE kode_masuk SET dipakai_pada = ? WHERE email = ? AND dipakai_pada IS NULL').bind(sekarang, e).run();

  // akun: email PEMBUAT dibuat otomatis saat pertama masuk
  let akun = await env.DB.prepare('SELECT id, email, nama, peran, aktif FROM akun WHERE email = ?').bind(e).first();
  if (pembuatTetap(env, e)) {
    if (!akun) {
      await env.DB.prepare("INSERT INTO akun (email, nama, peran, aktif, dibuat_pada, dibuat_oleh) VALUES (?, ?, 'pembuat', 1, ?, 'sistem')").bind(e, 'ARSWORD', sekarang).run();
      akun = await env.DB.prepare('SELECT id, email, nama, peran, aktif FROM akun WHERE email = ?').bind(e).first();
    } else if (akun.peran !== 'pembuat' || !akun.aktif) {
      await env.DB.prepare("UPDATE akun SET peran = 'pembuat', aktif = 1 WHERE id = ?").bind(akun.id).run();
    }
  }
  if (!akun || (!akun.aktif && !pembuatTetap(env, e))) gagal(403, 'nonaktif', 'Akun ini tidak aktif. Hubungi ARSWORD.');
  const token = await buatSesi(req, env, akun, sekarang);
  await catat(env, { oleh: e, aksi: 'masuk' });
  return json({ ok: true, email: e }, 200, { 'set-cookie': cookieSesi(env, token, UMUR_SESI) });
}

// sesi baru untuk satu akun: token acak (hanya hash-nya yang disimpan), sekaligus membuang kode dan sesi yang kedaluwarsa
async function buatSesi(req, env, akun, sekarang) {
  const token = tokenAcak(32);
  const perangkat = String(req.headers.get('user-agent') || '').slice(0, 160);
  await env.DB.prepare('INSERT INTO sesi (token_hash, akun_id, dibuat_pada, kedaluwarsa, terakhir, perangkat) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(await sha256(token), akun.id, sekarang, sekarang + UMUR_SESI, sekarang, perangkat).run();
  await env.DB.batch([
    env.DB.prepare('UPDATE akun SET terakhir_masuk = ? WHERE id = ?').bind(sekarang, akun.id),
    env.DB.prepare('DELETE FROM kode_masuk WHERE dibuat_pada < ?').bind(sekarang - 2 * 86400_000),
    env.DB.prepare('DELETE FROM sesi WHERE kedaluwarsa < ?').bind(sekarang),
  ]);
  return token;
}

// Masuk dari dashboard ARSWORD (arswordlab.com › Panel situs › Buka panel), tanpa kode email. Dashboard membuat tiket
// sekali pakai yang berlaku satu menit dan membuka GET /admin/api/masuk/tiket?t=… di tab baru. Tiket itu ditukar di
// sini lewat service binding ke Worker arswordlab (entrypoint TiketSitus; hanya bisa dipanggil Worker di akun
// Cloudflare yang sama, jadi tidak ada kunci rahasia yang disimpan): jawabannya email admin ARSWORD yang membukanya,
// sekali saja dan hanya untuk situs "twhrentcar". Email pembuat masuk sebagai pembuat; admin ARSWORD lain dibuatkan akun
// admin biasa. Akun yang dinonaktifkan pembuat tetap tidak bisa masuk. Tiket yang gagal kembali ke halaman masuk.
export async function masukTiket(req, env) {
  const balik = (kode, cookie) => new Response(null, {
    status: 302,
    headers: { location: `/admin/${kode ? '?tiket=' + kode : ''}`, 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', ...(cookie ? { 'set-cookie': cookie } : {}) },
  });
  const t = new URL(req.url).searchParams.get('t') || '';
  if (!env.ARSWORD || !/^[A-Za-z0-9_-]{20,100}$/.test(t)) return balik('gagal');
  // (sambungan antar-Worker yang putus sesaat dicoba sekali lagi; tiket baru terpakai kalau panggilannya sampai)
  let r = null;
  for (let coba = 0; coba < 2 && !r; coba++) {
    try { r = await env.ARSWORD.tukar(t, 'twhrentcar'); } catch { r = null; }
  }
  const e = r && r.ok === true ? normalEmail(r.email) : '';
  if (!emailSah(e)) return balik('gagal');
  const sekarang = Date.now();
  const cari = () => env.DB.prepare('SELECT id, email, nama, peran, aktif FROM akun WHERE email = ?').bind(e).first();
  let akun = await cari();
  if (pembuatTetap(env, e)) {
    if (!akun) { await env.DB.prepare("INSERT INTO akun (email, nama, peran, aktif, dibuat_pada, dibuat_oleh) VALUES (?, ?, 'pembuat', 1, ?, 'sistem')").bind(e, 'ARSWORD', sekarang).run(); akun = await cari(); }
    else if (akun.peran !== 'pembuat' || !akun.aktif) await env.DB.prepare("UPDATE akun SET peran = 'pembuat', aktif = 1 WHERE id = ?").bind(akun.id).run();
  } else if (!akun) {
    await env.DB.prepare("INSERT INTO akun (email, nama, peran, aktif, dibuat_pada, dibuat_oleh) VALUES (?, ?, 'admin', 1, ?, 'arswordlab')").bind(e, 'ARSWORD', sekarang).run();
    akun = await cari();
  } else if (!akun.aktif) return balik('nonaktif');
  if (!akun) return balik('gagal');
  const token = await buatSesi(req, env, akun, sekarang);
  await catat(env, { oleh: e, aksi: 'masuk', detail: { lewat: 'arswordlab' } });
  return balik('', cookieSesi(env, token, UMUR_SESI));
}

// akun yang sedang masuk, atau null. Sesi yang dipakai lagi setelah lebih dari sehari mendapat 30 harinya kembali.
export async function akunMasuk(req, env) {
  const token = cookies(req)[namaCookie(env)];
  if (!token || token.length > 100) return null;
  const h = await sha256(token), sekarang = Date.now();
  const r = await env.DB.prepare('SELECT a.id, a.email, a.nama, a.peran, a.aktif, s.kedaluwarsa, s.terakhir FROM sesi s JOIN akun a ON a.id = s.akun_id WHERE s.token_hash = ? AND s.kedaluwarsa > ?')
    .bind(h, sekarang).first();
  if (!r) return null;
  const pembuat = pembuatTetap(env, r.email);
  if (!r.aktif && !pembuat) return null;
  const akun = { id: r.id, email: r.email, nama: r.nama, peran: pembuat ? 'pembuat' : r.peran, tokenHash: h };
  if (!r.terakhir || sekarang - r.terakhir > PERPANJANG) {
    await env.DB.prepare('UPDATE sesi SET kedaluwarsa = ?, terakhir = ? WHERE token_hash = ?').bind(sekarang + UMUR_SESI, sekarang, h).run();
    akun.perpanjang = cookieSesi(env, token, UMUR_SESI);
  }
  return akun;
}

export async function keluar(req, env, akun, semua = false) {
  if (akun) {
    if (semua) await env.DB.prepare('DELETE FROM sesi WHERE akun_id = ?').bind(akun.id).run();
    else await env.DB.prepare('DELETE FROM sesi WHERE token_hash = ?').bind(akun.tokenHash).run();
    await catat(env, { oleh: akun.email, aksi: semua ? 'keluar_semua' : 'keluar' });
  }
  return json({ ok: true }, 200, { 'set-cookie': cookieSesi(env, '', 0) });
}
