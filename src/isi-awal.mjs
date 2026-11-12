// Isi awal situs TWH Rent Car: semua teks, harga, foto, dan daftar yang bisa diubah di panel admin (/admin/).
// Panel admin menyimpan salinan isi ini di D1 (draf, lalu versi terbit). Selama belum ada versi terbit, Worker dan
// bangun.mjs merakit halaman dari isi awal ini, jadi situs sama persis seperti sebelum ada panel admin.
//
// Setiap kunci teratas adalah satu "bagian" yang disimpan sendiri-sendiri (tabel draf). Foto mobil ditulis sebagai nama
// foto bawaan (public/assets/armada/<nama>.webp, potongan tanpa latar dari alat/foto.py) atau "m/<id>" untuk foto yang
// diunggah lewat panel admin (R2, /media/).
//
// Isian otomatis di teks (src/rakit.mjs isiTeks): {jumlah} = jumlah kendaraan yang tampil, {termurah} = harga sewa
// termurah, {harga:<slug mobil>} = harga satu mobil, {unit:<slug kota>} = unit satu kota, {totalUnit} = unit semua
// kota. Di teks halaman satu mobil juga {nama} dan {model}; di halaman satu kota {kota} dan {unit}.
import * as D from './data.mjs';

const id = (p, i) => `${p}${i + 1}`;

export const ISI_AWAL = {
  situs: {
    nama: D.NAMA,
    // nomor tujuan semua tombol WhatsApp (diawali 62) dan cara nomornya ditulis di situs
    wa: D.KONTAK.wa,
    telepon: D.KONTAK.telepon,
    alamat: D.KONTAK.alamat,
    alamatPendek: D.KONTAK.alamatPendek,
    jalan: D.KONTAK.jalan,
    kodePos: D.KONTAK.kodePos,
    lat: D.KONTAK.geo.lat,
    lng: D.KONTAK.geo.lng,
    maps: D.KONTAK.maps,
    mapsEmbed: D.KONTAK.mapsEmbed,
    berdiri: D.KONTAK.berdiri,
    jam: D.KONTAK.jam,
    bayar: D.KONTAK.bayar.slice(),
    instagram: D.KONTAK.instagram,
    // deskripsi usaha untuk Google (data terstruktur), tidak tampil di halaman
    deskripsi: 'Rental mobil dan bus di Jakarta, Malang, dan Surabaya sejak 2017. Armada dari Avanza sampai bus pariwisata 59 kursi, diantar ke hotel dan bandara, buka 24 jam.',
    // tampil di Google (meta robots, X-Robots-Tag, robots.txt); hanya akun pembuat yang bisa mengubahnya. Situs ini sudah
    // tayang dan terdaftar di Google Search Console sejak 2026-11-09.
    indeks: true,
  },

  // angka di beranda dan di bagian ulasan (rating dan jumlah ulasan sama dengan panel Google Business Profile)
  angka: { armada: D.STATISTIK.armada, kota: D.STATISTIK.kota, rating: D.STATISTIK.rating, ulasan: D.STATISTIK.ulasan },

  // tulisan yang ada di semua halaman
  umum: {
    tombolPesan: 'Pesan mobil',
    tombolWa: 'Chat WhatsApp',
    buka: 'Buka 24 jam, setiap hari',
  },

  // judul tab, deskripsi untuk Google, dan kalimat gambar bagikan halaman-halaman tetap (halaman satu mobil dan satu kota
  // punya isian Google sendiri di Armada dan Kota)
  halaman: {
    beranda: { judul: 'TWH Rent Car: Sewa Mobil & Bus di Jakarta, Malang, Surabaya', deskripsi: 'Rental mobil TWH Rent Car sejak 2017: Avanza, Innova, Alphard, Hiace, sampai bus pariwisata. Diantar ke hotel dan bandara, buka 24 jam. Pesan lewat WhatsApp.', og: 'Sewa mobil, diantar ke depan pintu.' },
    armada: { judul: 'Armada & Harga Sewa Mobil per Hari | TWH Rent Car', deskripsi: 'Daftar lengkap armada TWH Rent Car dan harga sewa per hari: Avanza Rp450 rb, Innova, Fortuner, Alphard, Hiace, Elf, sampai bus 59 kursi.', og: 'Sepuluh pilihan, dari Avanza sampai bus.' },
    layanan: { judul: 'Layanan Sewa Mobil: Bandara, Pengantin, Perusahaan | TWH Rent Car', deskripsi: 'Antar jemput bandara, mobil pengantin, sewa untuk perusahaan, wisata rombongan, antar kota, dan sewa mingguan atau bulanan di Jakarta, Malang, Surabaya.', og: 'Satu rental untuk semua perjalanan.' },
    'cara-sewa': { judul: 'Cara & Syarat Sewa Mobil, Pembayaran, FAQ | TWH Rent Car', deskripsi: 'Empat langkah sewa mobil di TWH Rent Car, dokumen yang dibutuhkan (KTP, KK, SIM), cara bayar, dan jawaban untuk pertanyaan yang paling sering ditanyakan.', og: 'Empat langkah, sekitar sepuluh menit.' },
    lokasi: { judul: 'Lokasi Rental Mobil TWH: Jakarta, Malang, Surabaya', deskripsi: 'TWH Rent Car tersedia di Jakarta (20 unit), Malang (15 unit), dan Surabaya (15 unit). Antar ke hotel, bandara, dan stasiun. Garasi di Pancoran, Jakarta Selatan.', og: 'Jakarta, Malang, Surabaya.' },
    kontak: { judul: 'Kontak & Pesan Mobil Lewat WhatsApp | TWH Rent Car', deskripsi: 'Pesan mobil TWH Rent Car lewat WhatsApp 0812-9060-8190, buka 24 jam. Garasi: Jl. Pengadegan Timur III No.37, Pancoran, Jakarta Selatan.', og: 'Pesan sekarang, kami balas cepat.' },
  },

  beranda: {
    label: 'Buka 24 jam · Jakarta, Malang, Surabaya',
    judul1: 'Sewa mobil,',
    judul2: 'diantar ke depan pintu.',
    teks: 'Rental mobil sejak 2017, dari Avanza sampai Alphard dan bus 59 kursi. Bersih, tangki penuh, diantar ke hotel, bandara, atau rumah Anda.',
    tautan: 'Lihat armada dan harga',
    petunjuk: 'Klik mobilnya untuk menyalakan lampu',
    pernyataan: 'Sejak 2017 kami menyerahkan kunci mobil yang bersih, bertangki penuh, dan datang tepat waktu: di depan rumah, di lobi hotel, atau di pintu kedatangan bandara.',
    armadaJudul: 'Sepuluh pilihan, satu garasi.',
    armadaTeks: 'Harga sewa per hari. Geser untuk melihat semuanya, dari Avanza sampai bus 59 kursi.',
    armadaTautan: 'Semua armada',
    armadaSemua: 'Lihat semua armada, filter, dan pilih menurut jumlah penumpang',
    layananJudul: 'Untuk perjalanan apa pun.',
    layananTeks: 'Dari jemput di bandara jam tiga pagi sampai bus untuk satu rombongan sekolah. Semua dipesan lewat satu nomor WhatsApp.',
    caraJudul: 'Empat langkah, kunci di tangan.',
    caraTeks: 'Verifikasi data lewat WhatsApp sekitar sepuluh menit. Tidak perlu datang ke kantor.',
    caraTautan: 'Syarat dan cara sewa lengkap',
    kotaJudul: 'Tiga kota, lima puluh mobil.',
    kotaTeks: 'Garasi utama di Pancoran, Jakarta Selatan. Di Malang dan Surabaya mobil diantar ke bandara, stasiun, hotel, atau alamat Anda.',
    ulasanJudul: 'Kata yang sudah menyewa.',
  },

  armadaHal: {
    judul: 'Armada dan harga sewa.',
    teks: 'Sepuluh jenis kendaraan, dari MPV tujuh kursi sampai bus pariwisata 59 kursi. Harga per hari, diantar ke hotel dan bandara di Jakarta, Malang, dan Surabaya.',
    mobil: 'toyota-innova-zenix',
    penumpangJudul: 'Berapa orang yang ikut?',
    penumpangTeks: 'Geser, lalu lihat kendaraan yang muat untuk rombongan Anda.',
    daftarJudul: 'Pilih kendaraannya.',
    hargaJudul: 'Daftar harga sewa per hari',
    hargaKet: 'Harga sewa kendaraan TWH Rent Car per hari. Harga akhir dikonfirmasi lewat WhatsApp sesuai tanggal, lama sewa, dan tujuan.',
    catatan1: 'Antar ke hotel, bandara, atau alamat Anda dikenai biaya tambahan yang disampaikan di awal.',
    catatan2: 'Deposit dikembalikan setelah mobil kembali.',
  },

  layananHal: {
    judul: 'Satu rental untuk semua perjalanan.',
    teks: 'Antar jemput bandara, mobil pengantin, kendaraan untuk perusahaan, wisata rombongan, antar kota, dan sewa bulanan. Di Jakarta, Malang, dan Surabaya.',
    mobil: 'toyota-hiace',
  },

  caraHal: {
    judul: 'Cara sewa, syarat, dan pembayaran.',
    teks: 'Empat langkah dari memilih mobil sampai kunci di tangan. Semua dokumen cukup dikirim lewat WhatsApp; verifikasinya sekitar sepuluh menit.',
    mobil: 'toyota-avanza',
    langkahJudul: 'Empat langkah.',
    syaratJudul: 'Dokumen yang disiapkan.',
    syaratTeks: 'Kirim fotonya lewat WhatsApp. Data hanya dipakai untuk verifikasi penyewaan.',
    bayarJudul: 'Bayar dengan cara Anda.',
    bayarTeks: 'Deposit dikembalikan setelah mobil kembali. Biaya antar ke hotel, bandara, atau alamat Anda disampaikan di awal, sebelum membayar.',
    faqJudul: 'Pertanyaan yang sering ditanyakan.',
  },

  lokasiHal: {
    judul: 'Jakarta, Malang, Surabaya.',
    teks: 'Lima puluh kendaraan di tiga kota. Diantar ke bandara, stasiun, hotel, atau alamat Anda, buka 24 jam.',
    mobil: 'toyota-innova-reborn',
    petaJudul: 'Di mana kami ada.',
    garasiJudul: 'Garasi Jakarta.',
    garasiTeks: 'Ambil sendiri di garasi atau minta diantar.',
    tombolMaps: 'Buka di Google Maps',
    tautanKontak: 'Kontak dan formulir pesan',
  },

  kontakHal: {
    judul: 'Pesan mobil.',
    teks: 'Isi formulir, pesan Anda terbuka di WhatsApp dan tinggal dikirim. Kami balas 24 jam, setiap hari.',
    petaJudul: 'Garasi kami di Pancoran.',
  },

  // tulisan di setiap halaman satu mobil ({nama}, {model} = mobil halaman itu)
  mobilHal: {
    tentangJudul: 'Tentang {nama} ini.',
    cocokJudul: 'Cocok untuk',
    penyerahan: 'Garasi, hotel, bandara, atau alamat Anda',
    caraJudul: 'Cara menyewa {model}.',
    caraTeks: 'Siapkan KTP, Kartu Keluarga, SIM, ID card kerja, akun Instagram, dan satu nomor kontak lain.',
    caraTautan: 'Syarat lengkap dan FAQ',
    lainJudul: 'Pilihan lain.',
  },

  // tulisan di setiap halaman satu kota ({kota}, {unit} = kota halaman itu)
  kotaHal: {
    antarJudul: 'Diantar ke mana saja di {kota}.',
    biaya: 'Biaya antar disampaikan di awal.',
    armadaJudul: 'Armada di {kota}.',
    armadaTeks: '{unit} unit di {kota}. Unit yang tersedia pada tanggal Anda dikonfirmasi lewat WhatsApp.',
    caraJudul: 'Cara sewa mobil di {kota}.',
    caraTautan: 'Syarat dokumen dan FAQ',
    lainJudul: 'Juga tersedia di',
  },

  // ajakan di bawah setiap halaman (dengan gantungan kunci)
  kaki: {
    judul: 'Kuncinya sudah siap.',
    teks: 'Tinggal pilih tanggalnya. Kami balas WhatsApp Anda kapan saja, 24 jam.',
    tautan: 'Isi formulir pesan',
    petunjuk: 'Goyangkan kuncinya',
  },

  kelas: D.KELAS.map((k) => ({ id: k.id, label: k.label })),

  // armada. foto = nama foto bawaan (slug) atau "m/<id>". arah = ke mana bagian depan mobil menghadap di foto. lampu =
  // titik lampu depan (pecahan lebar dan tinggi foto) untuk kedipan lampu di panggung beranda. hero = urutan di panggung
  // beranda (0 = tidak tampil di panggung). judulSeo/deskripsiSeo kosong = dibuat otomatis.
  armada: D.ARMADA.map((m) => ({
    id: m.slug, slug: m.slug, tampil: true, merek: m.merek, model: m.model, trim: m.trim, kelas: m.kelas, jenis: m.jenis,
    kursi: m.kursi, transmisi: m.transmisi, harga: m.harga, foto: m.slug, arah: m.arah, lampu: m.lampu ? m.lampu.map((p) => p.slice()) : [],
    hero: m.hero || 0, ringkas: m.ringkas, isi: m.isi, cocok: m.cocok.slice(), judulSeo: '', deskripsiSeo: '',
  })),

  // kota. Titik di peta Jawa hanya ada untuk Jakarta, Malang, dan Surabaya (src/peta.json). mobil = mobil di bagian atas
  // halaman kota itu.
  kota: D.KOTA.map((k) => ({
    id: k.slug, slug: k.slug, nama: k.nama, unit: k.unit, garasi: !!k.garasi,
    mobil: k.slug === 'jakarta' ? 'toyota-avanza' : k.slug === 'malang' ? 'toyota-hiace' : 'toyota-innova-zenix',
    judul: k.judul, pembuka: k.pembuka, bandara: k.bandara.slice(), titik: k.titik.slice(), cerita: k.cerita, judulSeo: '', deskripsiSeo: '',
  })),

  // layanan. ikon: pesawat, cincin, gedung, rombongan, jalan, kalender. mobil = mobil yang disarankan. wa = kata di pesan
  // WhatsApp ("Halo, saya ingin <wa>").
  layanan: D.LAYANAN.map((l) => ({
    id: l.id, ikon: { bandara: 'pesawat', pengantin: 'cincin', perusahaan: 'gedung', wisata: 'rombongan', antarkota: 'jalan', bulanan: 'kalender' }[l.id],
    judul: l.judul, mobil: l.mobil, teks: l.teks, wa: l.wa,
  })),

  langkah: D.LANGKAH.map((l, i) => ({ id: id('l', i), judul: l.judul, teks: l.teks })),
  syarat: D.SYARAT.map((s, i) => ({ id: id('s', i), nama: s.nama, teks: s.teks })),
  faq: D.FAQ.map((f, i) => ({ id: id('q', i), tanya: f.t, jawab: f.j })),
  ulasan: D.ULASAN.map((x, i) => ({ id: id('u', i), nama: x.nama, mobil: x.mobil, teks: x.teks })),
};

// Daftar bagian (urutan di panel admin)
export const BAGIAN = Object.keys(ISI_AWAL);

// Isi lengkap: bagian yang belum pernah disimpan diisi dari isi awal, dan kunci baru di isi awal (setelah situs
// diperbarui) ikut masuk ke bagian lama
export function lengkapi(isi) {
  const out = {};
  for (const k of BAGIAN) {
    const awal = ISI_AWAL[k], ada = isi && isi[k];
    if (ada == null) out[k] = structuredClone(awal);
    else if (awal && typeof awal === 'object' && !Array.isArray(awal) && typeof ada === 'object' && !Array.isArray(ada)) {
      out[k] = { ...structuredClone(awal), ...ada };
      // halaman: tiap halaman juga dilengkapi
      if (k === 'halaman') for (const h of Object.keys(awal)) out[k][h] = { ...structuredClone(awal[h]), ...(ada[h] || {}) };
    } else out[k] = ada;
  }
  return out;
}
