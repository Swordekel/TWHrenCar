-- Panel admin TWH Rent Car: akun, login dengan kode email, isi situs (draf dan versi terbit), foto
-- unggahan, dan catatan aktivitas.

-- akun yang boleh masuk ke panel admin. peran: pembuat (ARSWORD: semua, termasuk mengelola akun dan pengaturan teknis)
-- atau admin (pemilik website: mengubah isi, foto, dan menerbitkan). Email di variabel PEMBUAT (wrangler.jsonc) selalu
-- pembuat, juga sebelum barisnya ada.
CREATE TABLE akun (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL DEFAULT '',
  peran TEXT NOT NULL DEFAULT 'admin' CHECK (peran IN ('pembuat', 'admin')),
  aktif INTEGER NOT NULL DEFAULT 1,
  dibuat_pada INTEGER NOT NULL,
  dibuat_oleh TEXT,
  terakhir_masuk INTEGER
);

-- kode masuk 6 angka: hanya hash-nya yang disimpan. kode_hash 'salah' = penanda satu tebakan salah (bukan kode)
CREATE TABLE kode_masuk (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  kode_hash TEXT NOT NULL,
  ip TEXT,
  percobaan INTEGER NOT NULL DEFAULT 0,
  dipakai_pada INTEGER,
  dibuat_pada INTEGER NOT NULL,
  kedaluwarsa INTEGER NOT NULL
);
CREATE INDEX kode_email ON kode_masuk (email, dibuat_pada);
CREATE INDEX kode_ip ON kode_masuk (ip, dibuat_pada);

-- sesi: cookie berisi token acak, database hanya hash-nya
CREATE TABLE sesi (
  token_hash TEXT PRIMARY KEY,
  akun_id INTEGER NOT NULL REFERENCES akun (id) ON DELETE CASCADE,
  dibuat_pada INTEGER NOT NULL,
  kedaluwarsa INTEGER NOT NULL,
  terakhir INTEGER,
  perangkat TEXT
);
CREATE INDEX sesi_akun ON sesi (akun_id);

-- draf: satu baris per bagian isi (lihat src/isi-awal.mjs). Bagian tanpa baris = sama dengan versi terbit terakhir.
CREATE TABLE draf (
  bagian TEXT PRIMARY KEY,
  isi TEXT NOT NULL,
  rev INTEGER NOT NULL DEFAULT 1,
  diubah_oleh TEXT,
  diubah_pada INTEGER NOT NULL
);

-- versi terbit: isi lengkap saat diterbitkan, plus ukuran foto unggahan yang dipakainya. Yang tampil di situs = id terbesar.
CREATE TABLE versi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  isi TEXT NOT NULL,
  media TEXT NOT NULL DEFAULT '{}',
  bagian TEXT,
  catatan TEXT,
  oleh TEXT NOT NULL,
  pada INTEGER NOT NULL
);

-- foto unggahan (R2: m/<id>.<ext> dan m/<id>-640.<ext>). video dan durasi tidak dipakai TWH (kolomnya sama dengan panel
-- Silibet, tempat panel ini berasal).
CREATE TABLE media (
  id TEXT PRIMARY KEY,
  ext TEXT NOT NULL,
  w INTEGER NOT NULL,
  h INTEGER NOT NULL,
  ukuran INTEGER NOT NULL,
  nama TEXT,
  alt TEXT,
  oleh TEXT,
  pada INTEGER NOT NULL,
  video TEXT,
  durasi REAL
);

-- siapa melakukan apa: masuk, menyimpan draf (digabung per bagian per 10 menit), menerbitkan, foto, akun
CREATE TABLE aktivitas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pada INTEGER NOT NULL,
  oleh TEXT,
  aksi TEXT NOT NULL,
  bagian TEXT,
  detail TEXT
);
CREATE INDEX aktivitas_pada ON aktivitas (pada);
