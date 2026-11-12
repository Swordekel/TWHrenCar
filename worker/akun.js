// Akun panel admin. Hanya akun pembuat (ARSWORD) yang bisa menambah, mengubah, menonaktifkan, dan menghapus akun; email
// di variabel PEMBUAT tidak bisa diubah atau dihapus dari sini. Setiap akun bisa mengubah namanya sendiri dan
// mengeluarkan perangkatnya yang lain.
import { json, gagal, isiJson, normalEmail, emailSah, catat } from './http.js';
import { pembuatTetap, daftarPembuat } from './auth.js';
import { kirimUndangan } from './surat.js';

const PERAN = ['admin', 'pembuat'];

export async function daftarAkun(env) {
  const baris = (await env.DB.prepare(`SELECT a.id, a.email, a.nama, a.peran, a.aktif, a.dibuat_pada, a.dibuat_oleh, a.terakhir_masuk,
    (SELECT COUNT(*) FROM sesi s WHERE s.akun_id = a.id AND s.kedaluwarsa > ?) AS sesi FROM akun a ORDER BY a.peran DESC, a.dibuat_pada`).bind(Date.now()).all()).results || [];
  const ada = new Set(baris.map((a) => a.email));
  // email PEMBUAT yang belum pernah masuk tetap ditampilkan
  const tetap = daftarPembuat(env).filter((e) => !ada.has(e)).map((email) => ({ id: null, email, nama: 'ARSWORD', peran: 'pembuat', aktif: 1, sesi: 0, terakhir_masuk: null }));
  return json({ akun: [...tetap, ...baris].map((a) => ({ ...a, tetap: pembuatTetap(env, a.email), peran: pembuatTetap(env, a.email) ? 'pembuat' : a.peran })) });
}

export async function tambahAkun(req, env, akun) {
  const { email, nama, peran = 'admin', undang = true } = await isiJson(req, 4_000);
  const e = normalEmail(email);
  if (!emailSah(e)) gagal(400, 'email', 'Tulis alamat email yang benar.');
  if (!PERAN.includes(peran)) gagal(400, 'peran', 'Peran tidak dikenal.');
  const n = String(nama || '').trim().slice(0, 80);
  const ada = await env.DB.prepare('SELECT id FROM akun WHERE email = ?').bind(e).first();
  if (ada || pembuatTetap(env, e)) gagal(409, 'ada', 'Email ini sudah terdaftar.');
  await env.DB.prepare('INSERT INTO akun (email, nama, peran, aktif, dibuat_pada, dibuat_oleh) VALUES (?, ?, ?, 1, ?, ?)')
    .bind(e, n, peran, Date.now(), akun.email).run();
  await catat(env, { oleh: akun.email, aksi: 'akun_tambah', detail: { email: e, peran } });
  let terkirim = false;
  if (undang) {
    try { await kirimUndangan(env, e, { nama: n, oleh: akun.nama || akun.email, situs: env.SITUS }); terkirim = true; } catch { terkirim = false; }
  }
  return json({ ok: true, terkirim });
}

export async function ubahAkun(req, env, akun, id) {
  const { nama, peran, aktif } = await isiJson(req, 4_000);
  const a = await env.DB.prepare('SELECT id, email FROM akun WHERE id = ?').bind(id).first();
  if (!a) gagal(404, 'akun', 'Akun ini tidak ada.');
  if (pembuatTetap(env, a.email) && (peran != null || aktif != null)) gagal(403, 'tetap', 'Akun pembuat utama tidak bisa diubah perannya atau dinonaktifkan.');
  if (a.id === akun.id && (peran === 'admin' || aktif === false || aktif === 0)) gagal(403, 'diri', 'Anda tidak bisa menurunkan atau menonaktifkan akun sendiri.');
  if (peran != null && !PERAN.includes(peran)) gagal(400, 'peran', 'Peran tidak dikenal.');
  await env.DB.prepare('UPDATE akun SET nama = COALESCE(?, nama), peran = COALESCE(?, peran), aktif = COALESCE(?, aktif) WHERE id = ?')
    .bind(nama == null ? null : String(nama).trim().slice(0, 80), peran ?? null, aktif == null ? null : aktif ? 1 : 0, id).run();
  // akun yang dinonaktifkan langsung keluar dari semua perangkat
  if (aktif === false || aktif === 0) await env.DB.prepare('DELETE FROM sesi WHERE akun_id = ?').bind(id).run();
  await catat(env, { oleh: akun.email, aksi: 'akun_ubah', detail: { email: a.email, nama, peran, aktif } });
  return json({ ok: true });
}

export async function hapusAkun(env, akun, id) {
  const a = await env.DB.prepare('SELECT id, email FROM akun WHERE id = ?').bind(id).first();
  if (!a) gagal(404, 'akun', 'Akun ini tidak ada.');
  if (pembuatTetap(env, a.email)) gagal(403, 'tetap', 'Akun pembuat utama tidak bisa dihapus.');
  if (a.id === akun.id) gagal(403, 'diri', 'Anda tidak bisa menghapus akun sendiri.');
  await env.DB.batch([env.DB.prepare('DELETE FROM sesi WHERE akun_id = ?').bind(id), env.DB.prepare('DELETE FROM akun WHERE id = ?').bind(id)]);
  await catat(env, { oleh: akun.email, aksi: 'akun_hapus', detail: { email: a.email } });
  return json({ ok: true });
}

export async function keluarkanAkun(env, akun, id) {
  await env.DB.prepare('DELETE FROM sesi WHERE akun_id = ?').bind(id).run();
  await catat(env, { oleh: akun.email, aksi: 'akun_keluarkan', detail: { id } });
  return json({ ok: true });
}

// akun sendiri: nama dan perangkat yang sedang masuk
export async function saya(env, akun) {
  const sesi = (await env.DB.prepare('SELECT token_hash, dibuat_pada, terakhir, perangkat FROM sesi WHERE akun_id = ? AND kedaluwarsa > ? ORDER BY terakhir DESC').bind(akun.id, Date.now()).all()).results || [];
  return json({ email: akun.email, nama: akun.nama, peran: akun.peran, sesi: sesi.map((s) => ({ dibuat: s.dibuat_pada, terakhir: s.terakhir, perangkat: s.perangkat, ini: s.token_hash === akun.tokenHash })) });
}

export async function ubahSaya(req, env, akun) {
  const { nama } = await isiJson(req, 2_000);
  const n = String(nama || '').trim().slice(0, 80);
  if (!n) gagal(400, 'nama', 'Tulis nama Anda.');
  await env.DB.prepare('UPDATE akun SET nama = ? WHERE id = ?').bind(n, akun.id).run();
  return json({ ok: true, nama: n });
}
