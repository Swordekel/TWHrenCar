// Beranda: panggung mobil (WebGL), bilah cek tanggal, kalimat bergulir dengan rute di belakangnya, angka, armada
// (geser samping), layanan, cara sewa singkat, tiga kota di peta, ulasan.
import { ARMADA, HERO, KOTA, LAYANAN, rupiah } from '../data.mjs';
import { angka, esc, ikon, kartuMobil, langkah, peta, ulasan } from './bagian.mjs';

export default ({ fotoMobil, mobilBySlug }) => {
  const m0 = HERO[0];
  return `
<section id="atas" class="hero hero-panggung" data-bg="#EEF4F1" aria-label="Pembuka">
  <div class="panggung" id="panggung">
    <div class="panggung-tempat${m0.slug === 'isuzu-elf' ? ' kanan-terpotong' : ''}" id="panggung-tempat">${fotoMobil(m0, '(max-width: 760px) 92vw, 56vw', 'panggung-foto', 'awal', `${m0.nama} di panggung TWH Rent Car`)}</div>
    <canvas class="panggung-kanvas" id="panggung-kanvas" aria-hidden="true"></canvas>
  </div>
  <div class="wrap hero-isi">
    <p class="hero-label"><span class="titik-hidup"></span>Buka 24 jam · Jakarta, Malang, Surabaya</p>
    <h1><span>Sewa mobil,</span> <span>diantar ke depan pintu.</span></h1>
    <p class="hero-teks">Rental mobil sejak 2017, dari Avanza sampai Alphard dan bus 59 kursi. Bersih, tangki penuh, diantar ke hotel, bandara, atau rumah Anda.</p>
    <div class="tombol-kiri">
      <a class="pill pill-navy" href="/kontak/#pesan" data-pesan>${ikon('wa')} Pesan mobil</a>
      <a class="tautan-panah" href="/armada/">Lihat armada dan harga ${ikon('panah')}</a>
    </div>
  </div>
  <div class="wrap hero-pilih">
    <div class="hero-info" id="hero-info" aria-live="polite">
      <a class="hero-nama" id="hero-nama" href="/armada/${m0.slug}/">${esc(m0.nama)}</a>
      <span class="hero-detail" id="hero-detail">${m0.kursi} kursi · ${esc(m0.transmisi.replace(/ \(.*\)/, ''))}</span>
      <span class="hero-harga" id="hero-harga">${rupiah(m0.harga)}<small>/hari</small></span>
    </div>
    <div class="hero-chips chips" data-chips="hero" role="group" aria-label="Ganti mobil di panggung">
      ${HERO.map((m, i) => `<button type="button" aria-pressed="${i === 0}" data-mobil="${m.slug}">${esc(m.model)}</button>`).join('\n      ')}
    </div>
    <p class="hero-petunjuk" aria-hidden="true">Klik mobilnya untuk menyalakan lampu</p>
  </div>
</section>

<section class="bagian bagian-cek" data-bg="#EEF4F1" aria-label="Cek ketersediaan">
  <form class="wrap cek" id="cek" novalidate>
    <label class="cek-kolom"><span>Kota</span><select name="kota">${KOTA.map((k) => `<option>${k.nama}</option>`).join('')}</select></label>
    <label class="cek-kolom"><span>Ambil</span><input type="date" name="mulai" aria-label="Tanggal ambil"></label>
    <label class="cek-kolom"><span>Kembali</span><input type="date" name="selesai" aria-label="Tanggal kembali"></label>
    <label class="cek-kolom"><span>Kendaraan</span><select name="mobil"><option value="">Semua jenis</option>${ARMADA.map((m) => `<option value="${m.slug}">${esc(m.nama)}</option>`).join('')}</select></label>
    <button class="pill pill-navy" type="submit">Cek ketersediaan ${ikon('panah')}</button>
  </form>
</section>

<section class="bagian pernyataan" data-bg="#EEF4F1" data-words aria-label="Tentang TWH Rent Car">
  <div class="pernyataan-tempel">
    <canvas class="rute-kanvas" id="rute-kanvas" aria-hidden="true"></canvas>
    <p class="kata-teks h-kata">Sejak 2017 kami menyerahkan kunci mobil yang bersih, bertangki penuh, dan datang tepat waktu: di depan rumah, di lobi hotel, atau di pintu kedatangan bandara.</p>
  </div>
</section>

<section class="bagian" data-bg="#EEF4F1" aria-label="TWH Rent Car dalam angka">
  <div class="wrap">${angka()}</div>
</section>

<section class="bagian armada-geser" id="armada" data-bg="#0D2331" data-hscroll aria-labelledby="judul-armada">
  <div class="geser-tempel">
    <div class="wrap geser-kepala">
      <h2 class="h2" id="judul-armada">Sepuluh pilihan, satu garasi.</h2>
      <div class="geser-kanan"><p class="teks">Harga sewa per hari. Geser untuk melihat semuanya, dari Avanza sampai bus 59 kursi.</p><a class="tautan-panah" href="/armada/">Semua armada ${ikon('panah')}</a></div>
    </div>
    <div class="geser-jalur" data-track>
      ${ARMADA.map((m) => kartuMobil(m, fotoMobil)).join('\n      ')}
      <a class="kartu-semua" href="/armada/"><span>Lihat semua armada, filter, dan pilih menurut jumlah penumpang</span>${ikon('panah')}</a>
    </div>
    <div class="wrap geser-bilah"><i data-hbar></i></div>
  </div>
</section>

<section class="bagian mint" id="layanan" data-bg="#90D0BF" aria-labelledby="judul-layanan">
  <div class="wrap">
    <div class="dua-kolom">
      <h2 class="h2" id="judul-layanan">Untuk perjalanan apa pun.</h2>
      <p class="teks">Dari jemput di bandara jam tiga pagi sampai bus untuk satu rombongan sekolah. Semua dipesan lewat satu nomor WhatsApp.</p>
    </div>
    <div class="layanan-grid">
      ${LAYANAN.map((l) => { const m = mobilBySlug(l.mobil); return `<a class="layanan-kartu" href="/layanan/#${l.id}">
        <span class="layanan-foto${m.slug === 'isuzu-elf' ? ' kanan-terpotong' : ''}">${fotoMobil(m, '(max-width: 700px) 70vw, 300px', '', 'lazy', '')}</span>
        <h3>${esc(l.judul)}</h3><p>${esc(l.teks)}</p><span class="layanan-panah">${ikon('panah')}</span></a>`; }).join('\n      ')}
    </div>
  </div>
</section>

<section class="bagian" data-bg="#EEF4F1" aria-labelledby="judul-cara">
  <div class="wrap">
    <div class="dua-kolom">
      <h2 class="h2" id="judul-cara">Empat langkah, kunci di tangan.</h2>
      <div class="teks-tumpuk"><p class="teks">Verifikasi data lewat WhatsApp sekitar sepuluh menit. Tidak perlu datang ke kantor.</p><a class="tautan-panah" href="/cara-sewa/">Syarat dan cara sewa lengkap ${ikon('panah')}</a></div>
    </div>
    ${langkah()}
  </div>
</section>

<section class="bagian gelap kota-bagian" id="kota" data-bg="#0D2331" aria-labelledby="judul-kota">
  <div class="wrap">
    <div class="dua-kolom">
      <h2 class="h2" id="judul-kota">Tiga kota, lima puluh mobil.</h2>
      <p class="teks">Garasi utama di Pancoran, Jakarta Selatan. Di Malang dan Surabaya mobil diantar ke bandara, stasiun, hotel, atau alamat Anda.</p>
    </div>
    <div class="peta-bingkai">${peta()}</div>
    <div class="kota-daftar">
      ${KOTA.map((k) => `<a class="kota-kartu" href="/sewa-mobil-${k.slug}/" data-kota="${k.slug}"><span class="kota-nama">${k.nama}</span><span class="kota-unit">${k.unit} unit</span><span class="kota-bandara">${esc(k.bandara.join(' · '))}</span>${ikon('panah')}</a>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="bagian" data-bg="#EEF4F1" aria-labelledby="judul-ulasan">
  <div class="wrap">
    <h2 class="h2 tengah-teks" id="judul-ulasan">Kata yang sudah menyewa.</h2>
    ${ulasan()}
  </div>
</section>`;
};
