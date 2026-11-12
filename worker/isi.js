// Isi situs di panel admin: draf per bagian, terbitkan, buang draf, riwayat versi, dan pulihkan.
//
// Versi terbit = baris terakhir tabel versi (isi lengkap + ukuran foto unggahan yang dipakai). Draf = versi terbit
// ditimpa baris-baris tabel draf (satu per bagian). Selama belum ada versi terbit, dasarnya isi awal (src/isi-awal.mjs),
// yang sama dengan halaman cadangan statis di public/.
import { ISI_AWAL, BAGIAN, lengkapi } from '../src/isi-awal.mjs';
import { fotoDipakai } from '../src/rakit.mjs';
import { json, gagal, isiJson, catat } from './http.js';

const MAKS_BAGIAN = 400_000; // karakter JSON per bagian

// versi terbit, disimpan sebentar di memori isolate (diperiksa ulang paling lambat tiap 10 detik)
let TERBIT = { id: -1, isi: null, media: {}, cek: 0, pada: 0, oleh: '' };
export async function ambilTerbit(env, segar = false) {
  const sekarang = Date.now();
  if (!segar && TERBIT.cek && sekarang - TERBIT.cek < 10_000) return TERBIT.id > 0 ? TERBIT : null;
  const atas = await env.DB.prepare('SELECT id FROM versi ORDER BY id DESC LIMIT 1').first();
  if (!atas) { TERBIT = { id: 0, isi: null, media: {}, cek: sekarang }; return null; }
  if (atas.id !== TERBIT.id) {
    const v = await env.DB.prepare('SELECT id, isi, media, pada, oleh, catatan FROM versi WHERE id = ?').bind(atas.id).first();
    TERBIT = { id: v.id, isi: lengkapi(JSON.parse(v.isi)), media: JSON.parse(v.media || '{}'), pada: v.pada, oleh: v.oleh, catatan: v.catatan, cek: sekarang };
  } else TERBIT.cek = sekarang;
  return TERBIT;
}

// baris tabel media. Kolom video dan durasi baru ada setelah migrasi 0002; sebelum itu panel dan situs tetap jalan
// (tanpa video), jadi urutan deploy dan migrasi tidak merusak situs
export async function bacaMedia(env, kolom, ekor = '') {
  try { return (await env.DB.prepare(`SELECT ${kolom}, video, durasi FROM media ${ekor}`).all()).results || []; } catch (e) {
    if (!/no such column/i.test(String(e && e.message))) throw e;
    return (await env.DB.prepare(`SELECT ${kolom} FROM media ${ekor}`).all()).results || [];
  }
}

// ukuran semua foto unggahan: { id: [w, h, ext] }, video: { id: [w, h, ext sampul, ext video, durasi] }
export async function petaMedia(env) {
  const r = await bacaMedia(env, 'id, w, h, ext');
  return Object.fromEntries(r.map((m) => [m.id, m.video ? [m.w, m.h, m.ext, m.video, m.durasi || 0] : [m.w, m.h, m.ext]]));
}

export async function ambilDraf(env) {
  const terbit = await ambilTerbit(env, true);
  const dasar = terbit ? terbit.isi : lengkapi(ISI_AWAL);
  const baris = (await env.DB.prepare('SELECT bagian, isi, rev, diubah_oleh, diubah_pada FROM draf').all()).results || [];
  const isi = structuredClone(dasar), rev = {}, ubah = {};
  for (const b of baris) {
    if (!BAGIAN.includes(b.bagian)) continue;
    try { isi[b.bagian] = JSON.parse(b.isi); } catch { continue; }
    rev[b.bagian] = b.rev;
    ubah[b.bagian] = { oleh: b.diubah_oleh, pada: b.diubah_pada };
  }
  const lengkap = lengkapi(isi);
  const berubah = BAGIAN.filter((k) => JSON.stringify(lengkap[k]) !== JSON.stringify(dasar[k]));
  return { isi: lengkap, rev, ubah, berubah, terbit: terbit ? { id: terbit.id, pada: terbit.pada, oleh: terbit.oleh, catatan: terbit.catatan } : null };
}

export async function apiIsi(env) {
  return json(await ambilDraf(env));
}

// simpan satu bagian draf. rev = nomor revisi bagian yang dimiliki halaman; bila sudah berubah (admin lain menyimpan
// lebih dulu) dibalas 409 bersama isi terbarunya
export async function simpanBagian(req, env, akun, bagian) {
  if (!BAGIAN.includes(bagian)) gagal(404, 'bagian', 'Bagian ini tidak dikenal.');
  const { isi, rev } = await isiJson(req, MAKS_BAGIAN + 1_000);
  const awal = ISI_AWAL[bagian];
  if (isi == null || typeof isi !== 'object' || Array.isArray(isi) !== Array.isArray(awal)) gagal(400, 'bentuk', 'Bentuk isi bagian ini tidak sesuai.');
  const teks = JSON.stringify(isi);
  if (teks.length > MAKS_BAGIAN) gagal(413, 'terlalu_besar', 'Isi bagian ini terlalu panjang.');
  // tampil di Google hanya bisa diubah akun pembuat
  if (bagian === 'situs' && akun.peran !== 'pembuat') {
    const d = await ambilDraf(env);
    isi.indeks = d.isi.situs.indeks;
  }
  const sekarang = Date.now();
  const ada = await env.DB.prepare('SELECT rev, diubah_oleh, isi FROM draf WHERE bagian = ?').bind(bagian).first();
  if (ada && rev != null && +rev !== ada.rev) {
    gagal(409, 'bentrok', `Bagian ini baru saja diubah oleh ${ada.diubah_oleh || 'admin lain'}. Muat ulang dulu supaya perubahannya tidak tertimpa.`, { rev: ada.rev, oleh: ada.diubah_oleh, isi: JSON.parse(ada.isi) });
  }
  let revBaru;
  if (ada) {
    const r = await env.DB.prepare('UPDATE draf SET isi = ?, rev = rev + 1, diubah_oleh = ?, diubah_pada = ? WHERE bagian = ? AND rev = ? RETURNING rev')
      .bind(JSON.stringify(isi), akun.email, sekarang, bagian, ada.rev).first();
    if (!r) gagal(409, 'bentrok', 'Bagian ini baru saja diubah admin lain. Muat ulang dulu.');
    revBaru = r.rev;
  } else {
    await env.DB.prepare('INSERT INTO draf (bagian, isi, rev, diubah_oleh, diubah_pada) VALUES (?, ?, 1, ?, ?)').bind(bagian, JSON.stringify(isi), akun.email, sekarang).run();
    revBaru = 1;
  }
  // aktivitas: penyimpanan beruntun oleh orang yang sama di bagian yang sama dalam 10 menit digabung
  const akhir = await env.DB.prepare("SELECT id FROM aktivitas WHERE aksi = 'simpan' AND oleh = ? AND bagian = ? AND pada > ? ORDER BY id DESC LIMIT 1")
    .bind(akun.email, bagian, sekarang - 600_000).first();
  if (akhir) await env.DB.prepare('UPDATE aktivitas SET pada = ? WHERE id = ?').bind(sekarang, akhir.id).run();
  else await catat(env, { oleh: akun.email, aksi: 'simpan', bagian });
  const d = await ambilDraf(env);
  return json({ ok: true, rev: revBaru, berubah: d.berubah, isi: d.isi[bagian] });
}

// terbitkan draf: isi lengkap + ukuran foto unggahan yang dipakainya jadi versi baru
export async function terbitkan(req, env, akun) {
  const { catatan } = await isiJson(req, 4_000);
  const d = await ambilDraf(env);
  if (!d.berubah.length && d.terbit) gagal(400, 'sama', 'Tidak ada perubahan yang perlu diterbitkan.');
  const semuaMedia = await petaMedia(env);
  const dipakai = fotoDipakai(d.isi);
  const media = Object.fromEntries([...dipakai].filter((id) => semuaMedia[id]).map((id) => [id, semuaMedia[id]]));
  const bagian = d.terbit ? d.berubah : BAGIAN;
  const r = await env.DB.prepare('INSERT INTO versi (isi, media, bagian, catatan, oleh, pada) VALUES (?, ?, ?, ?, ?, ?) RETURNING id')
    .bind(JSON.stringify(d.isi), JSON.stringify(media), bagian.join(','), String(catatan || '').slice(0, 300) || null, akun.email, Date.now()).first();
  await catat(env, { oleh: akun.email, aksi: 'terbit', detail: { versi: r.id, bagian } });
  await ambilTerbit(env, true);
  return json({ ok: true, versi: r.id, ...(await ambilDraf(env)) });
}

// buang draf (semua, atau satu bagian): kembali sama dengan versi terbit
export async function buangDraf(req, env, akun) {
  const { bagian } = await isiJson(req, 2_000);
  if (bagian) {
    if (!BAGIAN.includes(bagian)) gagal(404, 'bagian', 'Bagian ini tidak dikenal.');
    await env.DB.prepare('DELETE FROM draf WHERE bagian = ?').bind(bagian).run();
  } else await env.DB.prepare('DELETE FROM draf').run();
  await catat(env, { oleh: akun.email, aksi: 'buang_draf', bagian: bagian || null });
  return json({ ok: true, ...(await ambilDraf(env)) });
}

export async function riwayat(env) {
  const versi = (await env.DB.prepare('SELECT id, bagian, catatan, oleh, pada FROM versi ORDER BY id DESC LIMIT 60').all()).results || [];
  const aktivitas = (await env.DB.prepare('SELECT pada, oleh, aksi, bagian, detail FROM aktivitas ORDER BY id DESC LIMIT 150').all()).results || [];
  return json({ versi, aktivitas });
}

// pulihkan versi lama ke draf (diperiksa dulu di pratinjau, lalu diterbitkan seperti biasa)
export async function pulihkan(env, akun, id) {
  const v = await env.DB.prepare('SELECT isi FROM versi WHERE id = ?').bind(id).first();
  if (!v) gagal(404, 'versi', 'Versi ini tidak ada.');
  const isi = lengkapi(JSON.parse(v.isi)), sekarang = Date.now();
  await env.DB.batch(BAGIAN.map((b) => env.DB.prepare(
    'INSERT INTO draf (bagian, isi, rev, diubah_oleh, diubah_pada) VALUES (?, ?, 1, ?, ?) ON CONFLICT (bagian) DO UPDATE SET isi = excluded.isi, rev = draf.rev + 1, diubah_oleh = excluded.diubah_oleh, diubah_pada = excluded.diubah_pada',
  ).bind(b, JSON.stringify(isi[b]), akun.email, sekarang)));
  await catat(env, { oleh: akun.email, aksi: 'pulihkan', detail: { versi: id } });
  return json({ ok: true, ...(await ambilDraf(env)) });
}
