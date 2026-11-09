// Isi situs TWH Rent Car: kontak, armada, kota, layanan, langkah sewa, FAQ, dan daftar halaman. bangun.mjs merakit
// semua halaman dari sini; app.js membaca data armada yang ditanam di halaman (#armada-data).
// Sumber isi: situs lama klien (index.html + js/main.js di riwayat git: harga, kursi, transmisi, unit per kota, syarat
// dokumen, cara bayar, alamat, nomor WhatsApp). Hal yang belum pasti ada di README (Pertanyaan untuk klien).

// Sejak 2026-11-09 di Cloudflare (wrangler.jsonc); twhrentcar.vercel.app mengalihkan setiap alamat ke sini (vercel.json).
// Di alamat *.vercel.app Google menampilkan "Vercel" sebagai nama situs (nama domain induk).
export const SITUS = 'https://twhrentcar.arswordlab.com';
export const NAMA = 'TWH Rent Car';
export const DIPERBARUI = '2026-11-09'; // lastmod sitemap

export const KONTAK = {
  wa: '6281290608190',
  telepon: '0812-9060-8190',
  teleponLink: '+6281290608190',
  teleponIntl: '+62 812-9060-8190',
  alamat: 'Jl. Pengadegan Timur III No.37, RT.8/RW.2, Pengadegan, Kec. Pancoran, Jakarta Selatan 12770',
  alamatPendek: 'Pengadegan, Pancoran, Jakarta Selatan',
  jalan: 'Jl. Pengadegan Timur III No.37, RT.8/RW.2, Pengadegan, Kec. Pancoran',
  kodePos: '12770',
  // titik RW 02 Pengadegan (OpenStreetMap); tempelkan koordinat dari Google Business Profile bila sudah ada
  geo: { lat: -6.2471, lng: 106.8588 },
  maps: 'https://www.google.com/maps/search/?api=1&query=TWH+Rent+Car+Jl.+Pengadegan+Timur+III+No.37+Pancoran+Jakarta+Selatan',
  mapsEmbed: 'https://www.google.com/maps?q=Jl.+Pengadegan+Timur+III+No.37,+Pengadegan,+Pancoran,+Jakarta+Selatan&output=embed',
  berdiri: '2017',
  jam: 'Buka 24 jam, Senin sampai Minggu',
  bayar: ['Transfer bank', 'GoPay', 'OVO', 'DANA', 'Tunai'],
  // akun resmi yang sama di panel Google (lencana TWH yang sama); sameAs di data terstruktur bisnis
  instagram: 'https://www.instagram.com/twh_rentcar/',
};

// rating dan jumlah ulasan sama dengan panel Google Business Profile (dicek 2026-11-09: 5,0 dari 22 ulasan)
export const STATISTIK = { armada: 50, kota: 3, rating: '5,0', ulasan: 22, pelanggan: 1000 };

// kelas armada (filter di /armada/ dan di beranda)
export const KELAS = [
  { id: 'mpv', label: 'MPV & SUV' },
  { id: 'minibus', label: 'Minibus' },
  { id: 'bus', label: 'Bus' },
];

// Armada. arah = ke mana bagian depan mobil menghadap di foto (hero: mobil keluar ke arah depannya). lampu = titik
// lampu depan di foto hasil alat/foto.py (pecahan lebar dan tinggi gambar; diukur ulang 2026-11-04 untuk foto ChatGPT), untuk kedipan lampu saat mobil diklik di
// hero. ganti = urutan di hero beranda.
export const ARMADA = [
  {
    slug: 'toyota-avanza', merek: 'Toyota', model: 'Avanza', trim: '1.5 G CVT', kelas: 'mpv', jenis: 'MPV', kursi: 7, transmisi: 'CVT (otomatis)', harga: 450000,
    arah: 'kanan', lampu: [[0.47, 0.4], [0.935, 0.39]], hero: 1,
    ringkas: 'MPV tujuh kursi yang paling sering dipilih untuk keluarga.',
    isi: 'Avanza generasi terbaru dengan transmisi CVT: ringan dikendarai di jalan Jakarta yang padat, kabin tiga baris untuk tujuh orang, dan bagasi yang cukup untuk koper satu keluarga bila baris ketiga dilipat.',
    cocok: ['Liburan keluarga', 'Antar jemput bandara', 'Keperluan harian dalam kota'],
  },
  {
    slug: 'daihatsu-xenia', merek: 'Daihatsu', model: 'Xenia', trim: '1.5 R CVT', kelas: 'mpv', jenis: 'MPV', kursi: 7, transmisi: 'CVT (otomatis)', harga: 450000,
    arah: 'kiri',
    ringkas: 'Saudara kembar Avanza dengan tampilan lebih sporty.',
    isi: 'Xenia 1.5 R CVT berbagi mesin dan kabin dengan Avanza: tujuh kursi, irit, dan mudah diparkir. Pilihan tepat bila Avanza sedang terpakai pada tanggal Anda.',
    cocok: ['Keluarga kecil', 'Perjalanan dalam kota', 'Sewa mingguan'],
  },
  {
    slug: 'toyota-innova-reborn', merek: 'Toyota', model: 'Innova Reborn', trim: '2.4 V Diesel', kelas: 'mpv', jenis: 'MPV', kursi: 7, transmisi: 'Otomatis', harga: 700000,
    arah: 'kanan',
    ringkas: 'MPV diesel yang tangguh untuk perjalanan jauh.',
    isi: 'Innova Reborn bermesin diesel 2.4 dengan transmisi otomatis: tenaganya cukup untuk tanjakan dan jalan tol antarkota, kabinnya lega, dan suspensinya nyaman untuk perjalanan berjam-jam.',
    cocok: ['Antar kota', 'Perjalanan dinas', 'Rombongan kecil dengan banyak bawaan'],
  },
  {
    slug: 'toyota-innova-zenix', merek: 'Toyota', model: 'Innova Zenix', trim: '2.0 Q Hybrid', kelas: 'mpv', jenis: 'MPV', kursi: 7, transmisi: 'e-CVT (hybrid)', harga: 1500000,
    arah: 'kiri', lampu: [[0.045, 0.42], [0.37, 0.45]], hero: 2,
    ringkas: 'Innova generasi terbaru, hybrid, senyap, dan mewah.',
    isi: 'Innova Zenix 2.0 Q Hybrid adalah varian tertinggi: mesin hybrid yang senyap dan irit, kursi baris kedua captain seat, dan fitur kenyamanan yang membuat perjalanan bisnis terasa kelas atas.',
    cocok: ['Tamu perusahaan', 'Antar jemput bandara', 'Perjalanan bisnis'],
  },
  {
    slug: 'toyota-alphard', merek: 'Toyota', model: 'Alphard', trim: '2.5 G AT', kelas: 'mpv', jenis: 'MPV mewah', kursi: 7, transmisi: 'Otomatis', harga: 1700000,
    arah: 'kiri', lampu: [[0.04, 0.4], [0.32, 0.4]], hero: 3,
    ringkas: 'MPV paling mewah di armada kami.',
    isi: 'Alphard generasi terbaru dengan kabin bak ruang tunggu kelas satu: pintu geser elektrik, kursi tengah yang bisa direbahkan, dan ruang kaki yang lapang. Pilihan utama untuk pernikahan, tamu VIP, dan acara penting.',
    cocok: ['Mobil pengantin', 'Tamu VIP dan direksi', 'Acara resmi'],
  },
  {
    slug: 'toyota-fortuner', merek: 'Toyota', model: 'Fortuner', trim: '2.8 VRZ Diesel', kelas: 'mpv', jenis: 'SUV', kursi: 7, transmisi: 'Otomatis', harga: 1500000,
    arah: 'kiri',
    ringkas: 'SUV diesel yang gagah, siap untuk jalan apa pun.',
    isi: 'Fortuner 2.8 VRZ bermesin diesel bertenaga besar dengan posisi duduk tinggi. Nyaman di tol, tetap percaya diri di jalan pegunungan atau jalan yang kurang mulus.',
    cocok: ['Perjalanan ke daerah pegunungan', 'Perjalanan dinas', 'Pengawalan tamu'],
  },
  {
    slug: 'toyota-hiace', merek: 'Toyota', model: 'Hiace', trim: 'Commuter', kelas: 'minibus', jenis: 'Minibus', kursi: 15, transmisi: 'Manual', harga: 1800000,
    arah: 'kiri', lampu: [[0.025, 0.56], [0.25, 0.57]], hero: 4,
    ringkas: 'Minibus 15 kursi untuk rombongan.',
    isi: 'Hiace Commuter muat lima belas penumpang dengan kabin tinggi dan AC sampai ke baris belakang. Satu mobil untuk satu rombongan: lebih hemat dan lebih mudah dikoordinasikan daripada beberapa MPV.',
    cocok: ['Wisata rombongan', 'Outing kantor', 'Antar jemput acara'],
  },
  {
    slug: 'isuzu-elf', merek: 'Isuzu', model: 'Elf', trim: 'Long NLR', kelas: 'minibus', jenis: 'Minibus', kursi: 19, transmisi: 'Manual', harga: 1800000,
    arah: 'kiri',
    ringkas: 'Minibus 19 kursi untuk rombongan yang lebih besar.',
    isi: 'Isuzu Elf Long muat sembilan belas penumpang. Pilihan klasik untuk ziarah, wisata keluarga besar, dan antar jemput karyawan.',
    cocok: ['Keluarga besar', 'Ziarah dan wisata', 'Antar jemput karyawan'],
  },
  {
    slug: 'bus-medium', merek: 'Bus', model: 'Medium Bus', trim: 'Pariwisata', kelas: 'bus', jenis: 'Bus', kursi: 31, transmisi: 'Manual', harga: 2500000,
    arah: 'kiri',
    ringkas: 'Bus pariwisata 31 kursi.',
    isi: 'Medium bus pariwisata untuk tiga puluh satu penumpang: cukup besar untuk satu rombongan sekolah atau kantor, cukup lincah untuk masuk ke jalan kota dan tempat wisata.',
    cocok: ['Study tour', 'Gathering kantor', 'Wisata rombongan'],
  },
  {
    slug: 'bus-besar', merek: 'Bus', model: 'Big Bus', trim: 'Pariwisata SHD', kelas: 'bus', jenis: 'Bus', kursi: 59, transmisi: 'Manual', harga: 3500000,
    arah: 'kiri', lampu: [[0.13, 0.84], [0.41, 0.84]], hero: 5,
    ringkas: 'Bus pariwisata besar, sampai 59 kursi.',
    isi: 'Big bus pariwisata SHD (super high deck) untuk lima puluh sembilan penumpang dengan bagasi besar di bawah kabin. Untuk rombongan besar dan perjalanan antarkota yang jauh.',
    cocok: ['Rombongan besar', 'Perjalanan antarkota', 'Acara perusahaan'],
  },
];
ARMADA.forEach((m) => { m.nama = m.merek === 'Bus' ? m.model : `${m.merek} ${m.model}`; });
export const HERO = ARMADA.filter((m) => m.hero).sort((a, b) => a.hero - b.hero);

export const rupiah = (n) => 'Rp' + n.toLocaleString('id-ID');
export const rupiahPendek = (n) => n >= 1e6 ? `Rp${String(n / 1e6).replace('.', ',')} jt` : `Rp${n / 1000} rb`;

// Kota. Jumlah unit dari situs lama. Bandara dan stasiun = tempat antar jemput yang paling sering diminta.
export const KOTA = [
  {
    slug: 'jakarta', nama: 'Jakarta', unit: 20, garasi: true, latlng: [-6.2088, 106.8456],
    judul: 'Sewa mobil di Jakarta.',
    pembuka: 'Garasi kami ada di Pengadegan, Pancoran, Jakarta Selatan. Dari sini mobil diantar ke rumah, kantor, hotel, atau bandara Anda, atau ambil sendiri di garasi.',
    bandara: ['Bandara Soekarno-Hatta (CGK)', 'Bandara Halim Perdanakusuma (HLP)'],
    titik: ['Hotel di Sudirman, Thamrin, dan Kuningan', 'Stasiun Gambir dan Pasar Senen', 'Rumah dan kantor di seluruh Jakarta'],
    cerita: 'Jakarta adalah kota pertama kami, sejak 2017. Mobil yang paling sering disewa di sini adalah Avanza dan Innova untuk keperluan keluarga, Innova Zenix dan Alphard untuk tamu perusahaan, serta Hiace dan bus untuk rombongan.',
  },
  {
    slug: 'malang', nama: 'Malang', unit: 15, latlng: [-7.9666, 112.6326],
    judul: 'Sewa mobil di Malang.',
    pembuka: 'Untuk liburan ke Malang dan Batu, atau perjalanan ke Bromo: mobil diantar ke hotel, bandara, atau stasiun tempat Anda tiba.',
    bandara: ['Bandara Abdulrachman Saleh (MLG)'],
    titik: ['Stasiun Malang', 'Hotel dan vila di Malang dan Batu', 'Rumah dan kantor di kota Malang'],
    cerita: 'Malang adalah kota tujuan liburan. Rombongan keluarga biasanya memilih Innova atau Hiace untuk berkeliling Batu, sedangkan rombongan sekolah dan kantor memakai bus untuk study tour dan gathering.',
  },
  {
    slug: 'surabaya', nama: 'Surabaya', unit: 15, latlng: [-7.2575, 112.7521],
    judul: 'Sewa mobil di Surabaya.',
    pembuka: 'Untuk urusan bisnis di Surabaya, mudik, atau perjalanan ke Madura dan Malang: mobil diantar ke Juanda, stasiun, hotel, atau alamat Anda.',
    bandara: ['Bandara Juanda (SUB)'],
    titik: ['Stasiun Gubeng dan Pasar Turi', 'Hotel di pusat kota Surabaya', 'Rumah dan kantor di Surabaya'],
    cerita: 'Di Surabaya, mobil kami banyak dipakai untuk perjalanan dinas dan menjemput tamu di Juanda. Untuk rombongan, Hiace, Elf, dan bus siap untuk perjalanan antarkota di Jawa Timur.',
  },
];

// Layanan (dari situs lama: Airport Transfer, Wedding Car, Corporate Rental, Wisata, Antar Kota, Sewa Mingguan/Bulanan)
export const LAYANAN = [
  { id: 'bandara', judul: 'Antar jemput bandara', mobil: 'toyota-innova-zenix', teks: 'Dijemput saat mendarat, diantar sebelum jadwal terbang. Soekarno-Hatta, Halim, Juanda, dan Abdulrachman Saleh.', wa: 'antar jemput bandara' },
  { id: 'pengantin', judul: 'Mobil pengantin', mobil: 'toyota-alphard', teks: 'Alphard yang bersih dan wangi untuk hari besar Anda, dari rumah ke tempat akad dan resepsi.', wa: 'mobil pengantin' },
  { id: 'perusahaan', judul: 'Sewa untuk perusahaan', mobil: 'toyota-fortuner', teks: 'Mobil untuk tamu, direksi, dan karyawan. Bisa harian, mingguan, atau bulanan dengan tagihan yang rapi.', wa: 'sewa mobil untuk perusahaan' },
  { id: 'wisata', judul: 'Wisata dan rombongan', mobil: 'toyota-hiace', teks: 'Hiace, Elf, dan bus pariwisata untuk keluarga besar, sekolah, komunitas, dan outing kantor.', wa: 'sewa kendaraan untuk wisata rombongan' },
  { id: 'antarkota', judul: 'Antar kota', mobil: 'toyota-innova-reborn', teks: 'Jakarta ke Bandung, Surabaya ke Malang, atau tujuan lain di Jawa. Mobil prima untuk perjalanan jauh.', wa: 'sewa mobil untuk perjalanan antar kota' },
  { id: 'bulanan', judul: 'Sewa mingguan dan bulanan', mobil: 'toyota-avanza', teks: 'Untuk proyek, dinas panjang, atau selama mobil Anda di bengkel. Makin lama, makin hemat.', wa: 'sewa mobil mingguan atau bulanan' },
];

export const LANGKAH = [
  { judul: 'Pilih mobil dan tanggal', teks: 'Lihat armada dan harga per hari di situs ini, lalu pesan lewat formulir atau langsung tanya lewat WhatsApp.' },
  { judul: 'Kirim data diri', teks: 'Foto KTP, Kartu Keluarga, SIM, ID card kerja, akun Instagram, dan satu nomor kontak lain selain penyewa. Verifikasi lewat WhatsApp sekitar 10 menit.' },
  { judul: 'Bayar', teks: 'Transfer bank, GoPay, OVO, DANA, atau tunai. Deposit dikembalikan setelah mobil kembali.' },
  { judul: 'Mobil diantar', teks: 'Ke hotel, bandara, atau alamat Anda, atau ambil sendiri di garasi. Mobil bersih dan tangki penuh saat diserahkan.' },
];

export const SYARAT = [
  { nama: 'KTP', teks: 'Kartu identitas penyewa yang masih berlaku.' },
  { nama: 'Kartu Keluarga', teks: 'Kartu Keluarga yang mencantumkan nama penyewa.' },
  { nama: 'SIM', teks: 'SIM A yang masih berlaku untuk pengemudi.' },
  { nama: 'ID card kerja', teks: 'Kartu karyawan atau tanda pengenal kantor.' },
  { nama: 'Akun Instagram', teks: 'Nama akun Instagram penyewa, untuk verifikasi identitas.' },
  { nama: 'Nomor kontak lain', teks: 'Satu nomor keluarga atau rekan selain penyewa.' },
];

export const FAQ = [
  { t: 'Berapa harga sewa mobil di TWH Rent Car?', j: `Mulai ${rupiah(450000)} per hari untuk Avanza dan Xenia, ${rupiah(700000)} untuk Innova Reborn, ${rupiah(1700000)} untuk Alphard, sampai ${rupiah(3500000)} per hari untuk bus besar. Harga akhir dikonfirmasi lewat WhatsApp sesuai tanggal, lama sewa, dan tujuan.` },
  { t: 'Di kota mana saja TWH Rent Car tersedia?', j: 'Jakarta (20 unit), Malang (15 unit), dan Surabaya (15 unit). Garasi kami di Pengadegan, Pancoran, Jakarta Selatan.' },
  { t: 'Dokumen apa saja yang dibutuhkan?', j: 'KTP, Kartu Keluarga, SIM, ID card kerja, akun Instagram, dan satu nomor kontak lain selain penyewa. Semuanya cukup dikirim lewat WhatsApp; verifikasinya sekitar 10 menit.' },
  { t: 'Apakah mobil bisa diantar ke bandara atau hotel?', j: 'Bisa, di ketiga kota. Biaya antar disampaikan di awal, sebelum Anda membayar.' },
  { t: 'Pembayaran bisa lewat apa saja?', j: 'Transfer bank, GoPay, OVO, DANA, atau tunai. Deposit dikembalikan setelah mobil kembali.' },
  { t: 'Jam berapa bisa memesan?', j: 'Kapan saja. TWH Rent Car melayani 24 jam, Senin sampai Minggu.' },
];

// ulasan Google (situs lama). Ulasan contoh dari template lama (Tesla, Range Rover, Lamborghini, Mercedes) tidak dipakai:
// mobil itu tidak ada di armada.
export const ULASAN = [
  { nama: 'Ryan Nugraha Ramadhan', mobil: 'Avanza dan Jazz', teks: 'Udah pernah sewa 2 kali dengan mobil Avanza dan Jazz. Mobil bersih, nyaman dan orangnya ramah, ga ribet. Tentunya no tipu-tipu.' },
];

// halaman. kunci = berkas src/halaman/<templat>.mjs. foto = mobil di gambar bagikan (og) halaman itu.
const H = [
  { kunci: 'beranda', templat: 'beranda', path: '/', nav: null, foto: 'toyota-alphard',
    judul: 'Sewa Mobil & Bus di Jakarta, Malang, Surabaya | TWH Rent Car',
    deskripsi: 'Rental mobil TWH Rent Car sejak 2017: Avanza, Innova, Alphard, Hiace, sampai bus pariwisata. Diantar ke hotel dan bandara, buka 24 jam. Pesan lewat WhatsApp.',
    og: 'Sewa mobil, diantar ke depan pintu.' },
  { kunci: 'armada', templat: 'armada', path: '/armada/', nav: 'Armada', foto: 'toyota-innova-zenix',
    judul: 'Armada & Harga Sewa Mobil per Hari | TWH Rent Car',
    deskripsi: 'Daftar lengkap armada TWH Rent Car dan harga sewa per hari: Avanza Rp450 rb, Innova, Fortuner, Alphard, Hiace, Elf, sampai bus 59 kursi.',
    og: 'Sepuluh pilihan, dari Avanza sampai bus.' },
  { kunci: 'layanan', templat: 'layanan', path: '/layanan/', nav: 'Layanan', foto: 'toyota-hiace',
    judul: 'Layanan Sewa Mobil: Bandara, Pengantin, Perusahaan | TWH Rent Car',
    deskripsi: 'Antar jemput bandara, mobil pengantin, sewa untuk perusahaan, wisata rombongan, antar kota, dan sewa mingguan atau bulanan di Jakarta, Malang, Surabaya.',
    og: 'Satu rental untuk semua perjalanan.' },
  { kunci: 'cara-sewa', templat: 'cara-sewa', path: '/cara-sewa/', nav: 'Cara Sewa', foto: 'toyota-avanza',
    judul: 'Cara & Syarat Sewa Mobil, Pembayaran, FAQ | TWH Rent Car',
    deskripsi: 'Empat langkah sewa mobil di TWH Rent Car, dokumen yang dibutuhkan (KTP, KK, SIM), cara bayar, dan jawaban untuk pertanyaan yang paling sering ditanyakan.',
    og: 'Empat langkah, sekitar sepuluh menit.' },
  { kunci: 'lokasi', templat: 'lokasi', path: '/lokasi/', nav: 'Kota', foto: 'toyota-innova-reborn',
    judul: 'Lokasi Rental Mobil TWH: Jakarta, Malang, Surabaya',
    deskripsi: 'TWH Rent Car tersedia di Jakarta (20 unit), Malang (15 unit), dan Surabaya (15 unit). Antar ke hotel, bandara, dan stasiun. Garasi di Pancoran, Jakarta Selatan.',
    og: 'Jakarta, Malang, Surabaya.' },
  { kunci: 'kontak', templat: 'kontak', path: '/kontak/', nav: 'Kontak', foto: 'toyota-alphard',
    judul: 'Kontak & Pesan Mobil Lewat WhatsApp | TWH Rent Car',
    deskripsi: 'Pesan mobil TWH Rent Car lewat WhatsApp 0812-9060-8190, buka 24 jam. Garasi: Jl. Pengadegan Timur III No.37, Pancoran, Jakarta Selatan.',
    og: 'Pesan sekarang, kami balas cepat.' },
];
const MOBIL = ARMADA.map((m) => ({
  kunci: 'mobil-' + m.slug, templat: 'mobil', path: `/armada/${m.slug}/`, nav: null, foto: m.slug, mobil: m, induk: 'armada',
  judul: `Sewa ${m.nama} ${m.kelas === 'bus' ? 'Pariwisata ' : ''}Jakarta, ${rupiahPendek(m.harga)}/hari | TWH Rent Car`,
  // deskripsi maks. sekitar 160 huruf (Google memotong yang lebih panjang)
  deskripsi: [`Sewa ${m.nama} ${m.trim} di Jakarta, Malang, dan Surabaya mulai ${rupiah(m.harga)} per hari. ${m.kursi} kursi, ${m.transmisi.toLowerCase()}. Diantar ke hotel dan bandara.`,
    `Sewa ${m.nama} di Jakarta, Malang, dan Surabaya mulai ${rupiah(m.harga)} per hari. ${m.kursi} kursi, ${m.transmisi.toLowerCase()}. Diantar ke hotel dan bandara.`].find((t) => t.length <= 160),
  og: `${m.nama}, ${rupiahPendek(m.harga)} per hari.`,
}));
const KOTA_H = KOTA.map((k) => ({
  kunci: 'kota-' + k.slug, templat: 'kota', path: `/sewa-mobil-${k.slug}/`, nav: null, foto: k.slug === 'jakarta' ? 'toyota-avanza' : k.slug === 'malang' ? 'toyota-hiace' : 'toyota-innova-zenix', kota: k, induk: 'lokasi',
  judul: `Sewa Mobil ${k.nama}, Antar Bandara & Hotel | TWH Rent Car`,
  deskripsi: `Rental mobil di ${k.nama}: ${k.unit} unit dari Avanza sampai bus, mulai ${rupiah(450000)} per hari. Diantar ke ${k.bandara[0].replace(/ \(.*\)/, '')}, hotel, dan alamat Anda. Buka 24 jam.`,
  og: `Sewa mobil di ${k.nama}.`,
}));
export const HALAMAN = [...H, ...MOBIL, ...KOTA_H];
