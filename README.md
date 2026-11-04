# TWH Rent Car

Situs rental mobil dan bus **TWH Rent Car** (Jakarta, Malang, Surabaya, sejak 2017): https://twhrentcar.vercel.app
Dibuat ulang oleh ARSWORD pada November 2026 dengan gaya situs ARSWORD lain (Nila Merah, Bengkel Nusantara):
satu huruf (Archivo), warna dari lencana klien (mint `#90D0BF`, navy `#1B4766`), efek WebGL, dan SEO lengkap.

## Halaman

| Alamat | Isi |
|---|---|
| `/` | Panggung mobil (WebGL), cek ketersediaan, kalimat bergulir dengan rute, angka, armada geser samping, layanan, cara sewa, peta tiga kota, ulasan |
| `/armada/` | Pemilih jumlah penumpang, filter jenis, kartu semua kendaraan, tabel daftar harga |
| `/armada/<mobil>/` | Satu halaman per kendaraan (10): harga, spesifikasi, cocok untuk, cara sewa, mobil lain |
| `/layanan/` | Antar jemput bandara, mobil pengantin, perusahaan, wisata, antar kota, mingguan/bulanan |
| `/cara-sewa/` | Empat langkah, daftar dokumen (bisa dicentang), cara bayar, FAQ |
| `/lokasi/` | Peta titik Pulau Jawa, tiga kota, garasi Jakarta |
| `/sewa-mobil-jakarta/`, `/sewa-mobil-malang/`, `/sewa-mobil-surabaya/` | Halaman kota (kata kunci "sewa mobil <kota>") |
| `/kontak/` | Formulir pesan ke WhatsApp, kontak, peta Google (dimuat saat diklik) |

Semua tombol "Pesan" membuka lembar pesan: pilih mobil, kota, tanggal, jam, tempat serah; perkiraan harga dihitung
otomatis (lama x harga per hari), lalu pesan lengkap terbuka di WhatsApp 0812-9060-8190. Tidak ada data yang disimpan.

## Efek

- **Intro** (sekali per sesi): lencana TWH muncul, garis segi enam tergambar, petir berkilat, lalu layar navy menyusut
  menjadi segi enam yang terbang ke logo di kepala.
- **Panggung mobil** (hero beranda): studio foto terang, pantulan di lantai, bayangan kontak. Ganti mobil = mobil lama
  melaju keluar ke arah depannya, mobil baru masuk dan mengerem (kabur searah gerak). Sesekali pita cahaya softbox menyapu
  bodi. Klik mobil = lampu depan menyala dua kali (titik lampu per foto di `src/data.mjs`, `lampu`).
- **Latar**: warna antarbagian berganti seperti mobil yang menyalip, dengan garis cahaya mint di tepinya.
- **Rute**: jalan berliku dari garasi ke tujuan terisi bersama kalimat yang menyala.
- **Gantungan kunci** (kaki semua halaman): lencana akrilik, ring besi, dan kunci mobil berayun seperti bandul; kursor
  mendorong, klik lencana memutar, klik kunci = lampu hazard berkedip.
- Menu HP terbuka sebagai segi enam dari tombol menu.

Loop animasi tidur saat tidak ada yang bergerak; resolusi kanvas turun sendiri di perangkat lemah; kanvas WebGL diganti
dengan aman di WebKit (Safari iPhone). Gerak dikurangi dan hemat data dihormati.

## Membangun

```bash
node bangun.mjs                 # src/ -> public/**/index.html, sitemap.xml, robots.txt, 404.html, site.webmanifest
python -I alat/foto.py --cek    # foto armada -> public/assets/armada/*.webp (+ sumber-foto/cek-armada.png)
python -I alat/logo.py          # lencana, favicon, apple-touch-icon dari sumber-foto/logo/twh-asli.png
python -I alat/peta.py          # peta titik Jawa -> src/peta.json
python -I alat/og.py            # gambar bagikan 1200x630 per halaman (jalankan node bangun.mjs lagi sesudahnya)
```

Hasil di `public/` ikut di-commit. Vercel (proyek `driveelite`) menyajikan `public/` apa adanya (`vercel.json`:
`outputDirectory`, URL tanpa `.html`, garis miring di akhir, header keamanan dan cache). Push ke `main` = tayang.

### Foto armada

Foto asli klien berlatar putih ada di `sumber-foto/armada/*.jpeg`; `alat/foto.py` membuang latarnya. Foto yang latarnya
sudah bening (PNG) bisa diletakkan sebagai `sumber-foto/armada/<slug>.png` (mis. `toyota-alphard.png`) dan dipakai apa
adanya. Setelah mengganti foto: jalankan `alat/foto.py`, periksa titik lampu depan (`lampu` di `src/data.mjs`, pecahan
lebar dan tinggi gambar hasil), lalu `alat/og.py` dan `node bangun.mjs`.

## SEO

- Judul (maks. ~60 huruf) dan deskripsi (maks. ~160 huruf) unik di setiap halaman, satu H1, kanonis absolut,
  `robots: index, follow, max-image-preview:large`.
- Data terstruktur JSON-LD di setiap halaman: `WebSite`, `AutoRental`/`LocalBusiness` (alamat, koordinat, jam 24/7,
  rentang harga, cara bayar, kota yang dilayani), `WebPage` + `BreadcrumbList`; `Product`/`Car` dengan `Offer`
  harga per hari (`LeaseOut`) di halaman mobil; `FAQPage` di Cara Sewa; `Service` di halaman kota dan layanan;
  `ItemList` armada. Rating 4,9 hanya tampil sebagai teks (ulasan dari situs sendiri tidak boleh jadi rich result).
- `sitemap.xml` (19 halaman + gambar mobil) dan `robots.txt` yang mengizinkan semua (situs lama memblokir CSS, JS, dan
  foto, sehingga Google tidak bisa merender halaman).
- Gambar bagikan Open Graph/Twitter 1200x630 per halaman, `site.webmanifest`, ikon.
- Kinerja: gambar WebP dengan `srcset`, gambar terbesar di-preload, font sendiri di-preload, JS `defer`, peta Google baru
  dimuat saat diklik. Situs tidak memuat skrip pihak ketiga.
- Verifikasi Google Search Console memakai meta tag (tetap ada di setiap halaman). Berkas `googledcb66fdccfa9a7aa.html`
  tetap ada, tetapi dengan URL tanpa `.html` alamatnya dialihkan; pakai metode meta tag.

### Langkah setelah tayang (pemilik)

1. Search Console: kirim `https://twhrentcar.vercel.app/sitemap.xml`, minta pengindeksan ulang beranda.
2. Google Business Profile: pastikan nama, alamat, nomor sama persis dengan situs, isi tautan situs, unggah foto armada.
3. Sangat disarankan domain sendiri (mis. `twhrentcar.com` atau `.id`): ganti `SITUS` di `src/data.mjs`, tambahkan domain
   di Vercel, dan alihkan `twhrentcar.vercel.app` ke domain baru.

## Pertanyaan untuk klien

1. Foto armada yang lebih tajam dan berlatar bening (foto saat ini kecil, Fortuner hanya 312 px; Elf terpotong dan
   latarnya abu-abu).
2. Tersedia **lepas kunci** dan/atau **dengan sopir**? Bus dan minibus pasti dengan sopir? Harga termasuk sopir dan BBM?
3. Harga: situs lama menulis "mulai Rp350.000" dan "bus besar Rp2.500.000" di FAQ, padahal daftar harga Avanza Rp450.000
   dan Big Bus Rp3.500.000. Situs baru memakai daftar harga per mobil.
4. Mobil apa saja yang tersedia di Malang dan Surabaya? Alamat titik ambil di kedua kota?
5. Tautan Google Business Profile, Instagram, TikTok (situs lama berisi tautan media sosial kosong; sekarang dihapus).
6. Jumlah ulasan dan rating Google terbaru (situs memakai 4,9 dari 23 ulasan). Ulasan contoh dari template lama (Tesla,
   Range Rover, Lamborghini, Mercedes) sudah dihapus karena mobil itu tidak ada di armada.
7. Besar deposit, biaya antar per kota, dan koordinat garasi yang tepat (dari Google Maps).
