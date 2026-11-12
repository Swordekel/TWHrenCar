// Buku catatan situs TWH Rent Car untuk asisten Claude di panel (worker/asisten.js). Ditulis ARSWORD; perbarui setiap kali
// situs atau panelnya berubah, atau ada jawaban baru dari klien.
export const CATATAN = `Tentang usaha:
- TWH Rent Car (juga ditulis TWHRENTCAR): rental mobil dan bus sejak 2017 di Jakarta, Malang, dan Surabaya. Garasi utama
  di Jl. Pengadegan Timur III No.37, Pancoran, Jakarta Selatan. Buka 24 jam. Pesanan lewat WhatsApp; situs tidak
  menyimpan data pemesan (formulir hanya menyusun pesan WhatsApp di perangkat pengunjung).
- Situs ini klien ARSWORD yang sudah tayang dan terdaftar di Google Search Console. Alamatnya domain sendiri
  twhrentcar.com sejak 2026-11-12; alamat lama twhrentcar.arswordlab.com (2026-11-09 s.d. 11-12) dan twhrentcar.vercel.app
  dialihkan permanen ke sana. Nomor WhatsApp di situs adalah nomor klien yang sungguhan.
- Rating Google 5,0 dari 22 ulasan (dicek 2026-11-09). Kalau admin memberi angka baru, ubah di Ulasan & angka.

Halaman (alamat tetap; mobil dan kota punya halaman sendiri):
- / beranda: panggung mobil (WebGL, mobil keluar-masuk, klik mobil = lampu depan berkedip), cek tanggal, kalimat besar,
  angka, kartu armada yang digeser, layanan, cara sewa singkat, peta Jawa dengan titik tiap kota, ulasan.
- /armada/ (pemilih jumlah penumpang, filter kelas, kartu, tabel harga), /armada/<slug>/ satu per mobil yang tampil.
- /layanan/, /cara-sewa/ (langkah, dokumen, cara bayar, FAQ), /lokasi/ (peta dan kartu kota), /sewa-mobil-<slug>/ satu
  per kota, /kontak/ (formulir pesan dan peta garasi). Di bawah setiap halaman: ajakan "Kuncinya sudah siap." dengan
  gantungan kunci yang bisa digoyang.

Cara kerja panel:
- Semua perubahan masuk draf dulu, tersimpan otomatis; pengunjung baru melihatnya setelah Terbitkan. Riwayat menyimpan
  setiap versi terbit dan bisa dipulihkan ke draf.
- Letak di panel: Armada & harga (mobil, harga, foto, kelas), Halaman (teks tiap halaman + kartu Judul tab & Google per
  halaman), Kota, Layanan, Cara sewa & FAQ (langkah, dokumen, cara bayar, pertanyaan), Ulasan & angka, Foto (unggahan),
  Pengaturan (Identitas: nama usaha, tombol di semua halaman; Kontak: WhatsApp, telepon, alamat, peta; Judul & Google;
  Tampil di Google, khusus akun pembuat), Riwayat, Akun admin (khusus pembuat).
- Halaman › Tulisan kecil (bagian "kecil"): label menu, formulir pesan (termasuk pilihan tempat penyerahan satu per baris;
  yang pertama = garasi tanpa alamat), label kartu dan halaman mobil ("kursi", "/hari", "Pesan", spesifikasi), cek
  ketersediaan, angka, ulasan ({ulasan}), armada ({maks}), layanan, lokasi, kontak, dan halaman kota. Nama usaha di logo
  dan kaki = situs.nama. Pesan WhatsApp yang disusun formulir, saran jumlah penumpang, dan intro tetap di kode.
- Gambar saat tautan dibagikan (ogFoto, 1200×630): per halaman tetap (kartu Judul tab & Google), per mobil, dan per kota.
  Kosong = kartu bawaan (alat/og.py); mobil dan kota baru tanpa kartu bawaan memakai foto mobil atau gambar beranda.
- Harga ditulis angka per hari (Rp). Harga yang berubah ikut berubah di kartu, tabel harga, halaman mobil, formulir pesan
  (perkiraan harga), dan data Google (Offer). Teks yang menulis harga sendiri TIDAK ikut berubah: jawaban FAQ pertama,
  deskripsi Google halaman Armada ("Avanza Rp450 rb"), dan teks lain. Saat harga berubah, periksa teks itu juga.
- Isian otomatis di teks: {jumlah} jumlah mobil yang tampil, {termurah} harga termurah, {harga:<slug>} harga satu mobil
  (mis. {harga:toyota-avanza}), {unit:<slug kota>} unit satu kota, {totalUnit} unit semua kota. Di teks halaman mobil:
  {nama}, {model}; di teks halaman kota: {kota}, {unit}. Banyak teks lama masih menulis angka dengan kata ("Sepuluh
  pilihan", "lima puluh mobil", "Tiga kota"); ganti dengan isian otomatis bila admin menambah atau menyembunyikan mobil.
- Judul Google halaman mobil dan kota dibuat otomatis kalau judulSeo/deskripsiSeo kosong:
  mobil "Sewa <nama> [Pariwisata ]Jakarta, <harga pendek>/hari | TWH Rent Car" (Pariwisata untuk kelas bus),
  kota "Sewa Mobil <kota>, Antar Bandara & Hotel | TWH Rent Car". Isi kolomnya hanya bila admin minta judul lain.
- Nama mobil di situs = merek + model, kecuali merek "Bus" (nama = model saja, mis. "Big Bus").
- Mobil baru: alamatnya /armada/<slug>/ dari merek dan model, tidak berubah lagi. Butuh foto mobil TANPA LATAR (PNG
  transparan, dari samping) supaya cocok dengan situs; tanpa foto atau harga, mobil disembunyikan. Panggung beranda:
  isian "Urutan di panggung beranda" (0 = tidak tampil), arah depan mobil di foto, dan titik lampu depan (dipasang admin
  dengan mengetuk foto di panel). Sebaiknya 3 sampai 6 mobil di panggung.
- Menyembunyikan mobil (sakelar Tampilkan di situs) juga menyembunyikan halamannya (jadi 404) dan mengeluarkannya dari
  sitemap. Mobil yang masih dipakai sebagai "mobil" di layanan, halaman kota, atau bagian atas halaman tidak bisa
  dihapus sebelum diganti.
- Kota: setiap kota punya titik di peta Jawa (beranda dan /lokasi/). Kota-kota di Jawa dan Madura mendapat titik otomatis
  dari namanya (Yogyakarta/Jogja, Bandung, Semarang, Solo, Bogor, …); titik bisa digeser, atau dipasang untuk kota lain,
  dengan mengetuk peta di isian kotanya (menu Kota). Kota di luar peta (Bali, luar Jawa) tidak bisa bertitik. Letak nama
  kota (otomatis, atas, kanan, kiri, bawah) dipilih di isian yang sama. Rute antar kota menyambung sendiri dari barat.
- Layanan: ikon dipilih dari pesawat, cincin, gedung, rombongan, jalan, kalender. "Kata di pesan WhatsApp" melanjutkan
  "Halo TWH Rent Car, saya ingin tanya <kata>. Untuk tanggal: ".
- Judul besar halaman Kontak juga judul lembar pesan di semua halaman.
- Tampil di Google (situs.indeks) menyala dan harus tetap menyala; hanya akun pembuat yang bisa mengubahnya.

Pertanyaan yang belum dijawab klien (README situs):
- Lepas kunci dan/atau dengan sopir? Bus dan minibus pasti dengan sopir? Harga termasuk sopir dan BBM?
- Situs lama menulis "mulai Rp350.000" dan "bus besar Rp2.500.000"; situs sekarang memakai daftar harga per mobil
  (Avanza Rp450.000 sampai Big Bus Rp3.500.000).
- Mobil apa saja di Malang dan Surabaya, dan titik ambil di sana. Besar deposit, biaya antar per kota, koordinat garasi
  yang tepat. Foto armada yang lebih tajam (Fortuner dan Elf kurang bagus). TikTok/Google Business Profile.
Jangan menjawab hal-hal ini seolah sudah pasti; sebut bahwa belum dikonfirmasi klien.

Yang masih butuh kode (pakai tulis_permintaan_kode):
- Tulisan antarmuka formulir pesan dan bilah cek tanggal (label, pilihan jam, tempat serah), halaman 404, judul kolom
  tabel harga, tulisan kecil di kartu mobil ("kursi", "Pesan"), label angka di beranda (Armada, Kota, Rating Google,
  Melayani 24 jam).
- Titik peta untuk kota baru, warna dan efek WebGL, gambar bagikan (og) 1200x630 untuk mobil baru (sementara dipakai
  foto mobilnya sendiri), ikon layanan baru, logo dan favicon, domain sendiri.
- Cara serah "Garasi kami / Hotel / Bandara / Alamat lain" dan pesan WhatsApp umum ("saya ingin tanya sewa mobil").
`;
