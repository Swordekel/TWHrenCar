// /armada/<mobil>/: satu halaman per kendaraan (kata kunci "sewa <mobil> jakarta"): foto besar, harga, spesifikasi,
// cocok untuk, cara sewa singkat, mobil lain di kelas yang sama.
import { ARMADA, KOTA, rupiah } from '../data.mjs';
import { esc, ikon, kartuMobil, langkah } from './bagian.mjs';

export default ({ h, fotoMobil, remah }) => {
  const m = h.mobil;
  const lain = ARMADA.filter((x) => x.slug !== m.slug && x.kelas === m.kelas).concat(ARMADA.filter((x) => x.kelas !== m.kelas)).slice(0, 3);
  return `
<section id="atas" class="hero hero-mobil" data-bg="#EEF4F1">
  <div class="wrap hero-mobil-isi">
    <div class="hero-mobil-teks">
      ${remah}
      <p class="hero-label">${esc(m.jenis)} · ${m.kursi} kursi</p>
      <h1>Sewa ${esc(m.nama)}</h1>
      <p class="hero-trim">${esc(m.trim)}</p>
      <p class="hero-teks">${esc(m.ringkas)} Tersedia di ${KOTA.map((k) => k.nama).join(', ').replace(/, ([^,]*)$/, ', dan $1')}.</p>
      <p class="harga harga-besar"><span class="harga-mulai">Mulai</span><strong>${rupiah(m.harga)}</strong><span>/hari</span></p>
      <div class="tombol-kiri">
        <a class="pill pill-navy" href="/kontak/?mobil=${m.slug}#pesan" data-pesan="${m.slug}">${ikon('wa')} Pesan ${esc(m.model)}</a>
        <a class="tautan-panah" href="/armada/">Bandingkan armada ${ikon('panah')}</a>
      </div>
    </div>
    <div class="hero-mobil-panggung">${fotoMobil(m, '(max-width: 900px) 92vw, 52vw', 'hero-mobil-foto', 'awal')}</div>
  </div>
</section>

<section class="bagian" data-bg="#EEF4F1" aria-labelledby="judul-spek">
  <div class="wrap mobil-detail">
    <div class="mobil-cerita">
      <h2 class="h3" id="judul-spek">Tentang ${esc(m.nama)} ini.</h2>
      <p class="teks">${esc(m.isi)}</p>
      <h3 class="judul-kecil">Cocok untuk</h3>
      <ul class="daftar-cek">${m.cocok.map((c) => `<li>${ikon('cek')}${esc(c)}</li>`).join('')}</ul>
    </div>
    <dl class="spek">
      <div><dt>Kendaraan</dt><dd>${esc(m.nama)}</dd></div>
      <div><dt>Varian</dt><dd>${esc(m.trim)}</dd></div>
      <div><dt>Jenis</dt><dd>${esc(m.jenis)}</dd></div>
      <div><dt>Kapasitas</dt><dd>${m.kursi} penumpang</dd></div>
      <div><dt>Transmisi</dt><dd>${esc(m.transmisi)}</dd></div>
      <div><dt>Harga sewa</dt><dd>${rupiah(m.harga)} per hari</dd></div>
      <div><dt>Kota</dt><dd>${KOTA.map((k) => `<a href="/sewa-mobil-${k.slug}/">${k.nama}</a>`).join(', ')}</dd></div>
      <div><dt>Penyerahan</dt><dd>Garasi, hotel, bandara, atau alamat Anda</dd></div>
    </dl>
  </div>
</section>

<section class="bagian mint" data-bg="#90D0BF" aria-labelledby="judul-cara">
  <div class="wrap">
    <div class="dua-kolom">
      <h2 class="h2" id="judul-cara">Cara menyewa ${esc(m.model)}.</h2>
      <div class="teks-tumpuk"><p class="teks">Siapkan KTP, Kartu Keluarga, SIM, ID card kerja, akun Instagram, dan satu nomor kontak lain.</p><a class="tautan-panah" href="/cara-sewa/">Syarat lengkap dan FAQ ${ikon('panah')}</a></div>
    </div>
    ${langkah()}
  </div>
</section>

<section class="bagian" data-bg="#EEF4F1" aria-labelledby="judul-lain">
  <div class="wrap">
    <div class="dua-kolom"><h2 class="h2" id="judul-lain">Pilihan lain.</h2><a class="tautan-panah" href="/armada/">Semua armada ${ikon('panah')}</a></div>
    <div class="grid-mobil grid-tiga">${lain.map((x) => kartuMobil(x, fotoMobil)).join('\n')}</div>
  </div>
</section>`;
};
