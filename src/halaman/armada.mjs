// /armada/: pemilih menurut jumlah penumpang, filter kelas, kartu semua mobil, dan tabel daftar harga.
import { ARMADA, KELAS, rupiah } from '../data.mjs';
import { esc, heroHalaman, ikon, kartuMobil } from './bagian.mjs';

export default ({ fotoMobil, remah, mobilBySlug }) => `
${heroHalaman({ judul: 'Armada dan harga sewa.', teks: 'Sepuluh jenis kendaraan, dari MPV tujuh kursi sampai bus pariwisata 59 kursi. Harga per hari, diantar ke hotel dan bandara di Jakarta, Malang, dan Surabaya.', remah, mobil: mobilBySlug('toyota-innova-zenix'), fotoMobil })}

<section class="bagian penumpang-bagian" data-bg="#EEF4F1" aria-labelledby="judul-penumpang">
  <div class="wrap penumpang" id="penumpang">
    <div class="penumpang-kiri">
      <h2 class="h3" id="judul-penumpang">Berapa orang yang ikut?</h2>
      <p class="teks">Geser, lalu lihat kendaraan yang muat untuk rombongan Anda.</p>
      <div class="penumpang-angka"><output id="penumpang-n" for="penumpang-geser">4</output><span>orang</span></div>
      <input type="range" id="penumpang-geser" min="1" max="59" value="4" step="1" aria-label="Jumlah penumpang">
      <p class="penumpang-saran" id="penumpang-saran" aria-live="polite"></p>
    </div>
    <div class="penumpang-kursi" id="penumpang-kursi" aria-hidden="true"></div>
  </div>
</section>

<section class="bagian" id="daftar" data-bg="#EEF4F1" aria-labelledby="judul-daftar">
  <div class="wrap">
    <div class="daftar-kepala">
      <h2 class="h2" id="judul-daftar">Pilih kendaraannya.</h2>
      <div class="chips chips-filter" data-chips="kelas" role="group" aria-label="Saring menurut jenis">
        <button type="button" aria-pressed="true" data-kelas="semua">Semua</button>
        ${KELAS.map((k) => `<button type="button" aria-pressed="false" data-kelas="${k.id}">${esc(k.label)}</button>`).join('\n        ')}
      </div>
    </div>
    <div class="grid-mobil" id="grid-mobil">
      ${ARMADA.map((m) => kartuMobil(m, fotoMobil)).join('\n      ')}
    </div>
    <p class="grid-kosong" id="grid-kosong" hidden>Belum ada kendaraan yang muat. Untuk rombongan lebih dari 59 orang, <a class="tautan-polos" href="/kontak/#pesan" data-pesan>tanyakan kombinasi bus</a>.</p>
  </div>
</section>

<section class="bagian" data-bg="#EEF4F1" aria-labelledby="judul-harga">
  <div class="wrap">
    <h2 class="h3" id="judul-harga">Daftar harga sewa per hari</h2>
    <div class="tabel-bungkus">
      <table class="tabel-harga">
        <caption>Harga sewa kendaraan TWH Rent Car per hari. Harga akhir dikonfirmasi lewat WhatsApp sesuai tanggal, lama sewa, dan tujuan.</caption>
        <thead><tr><th scope="col">Kendaraan</th><th scope="col">Jenis</th><th scope="col">Kursi</th><th scope="col">Transmisi</th><th scope="col">Harga per hari</th></tr></thead>
        <tbody>
          ${ARMADA.map((m) => `<tr><th scope="row"><a href="/armada/${m.slug}/">${esc(m.nama)}</a> <span class="redup">${esc(m.trim)}</span></th><td>${esc(m.jenis)}</td><td>${m.kursi}</td><td>${esc(m.transmisi)}</td><td class="angka-kanan">${rupiah(m.harga)}</td></tr>`).join('\n          ')}
        </tbody>
      </table>
    </div>
    <p class="catatan-kecil">Antar ke hotel, bandara, atau alamat Anda dikenai biaya tambahan yang disampaikan di awal. ${ikon('cek')} Deposit dikembalikan setelah mobil kembali.</p>
  </div>
</section>`;
