// /kontak/: formulir pesan (sama dengan lembar pesan) di halaman, cara menghubungi, alamat garasi dan peta.
import { KONTAK } from '../data.mjs';
import { esc, ikon } from './bagian.mjs';

export default ({ remah, formPesan, WA }) => `
<section id="atas" class="hero hero-halaman hero-kontak" data-bg="#EEF4F1">
  <div class="wrap kontak-atas">
    <div class="kontak-teks">
      ${remah}
      <h1>Pesan mobil.</h1>
      <p class="hero-teks">Isi formulir, pesan Anda terbuka di WhatsApp dan tinggal dikirim. Kami balas 24 jam, setiap hari.</p>
      <ul class="kontak-cara">
        <li><a data-wa="umum" href="${WA}" target="_blank" rel="noopener">${ikon('wa')}<span><strong>WhatsApp</strong>${KONTAK.telepon}</span></a></li>
        <li><a href="tel:${KONTAK.teleponLink}">${ikon('telepon')}<span><strong>Telepon</strong>${KONTAK.telepon}</span></a></li>
        <li><a href="${KONTAK.maps}" target="_blank" rel="noopener">${ikon('pin')}<span><strong>Garasi</strong>${esc(KONTAK.alamat)}</span></a></li>
        <li><span class="kontak-statis">${ikon('jam')}<span><strong>Jam layanan</strong>${esc(KONTAK.jam)}</span></span></li>
      </ul>
    </div>
    <div class="kontak-form" id="pesan">
      ${formPesan('pesan-kontak')}
    </div>
  </div>
</section>

<section class="bagian" data-bg="#EEF4F1" aria-labelledby="judul-peta">
  <div class="wrap">
    <h2 class="h3" id="judul-peta">Garasi kami di Pancoran.</h2>
    <div class="peta-google peta-lebar" id="peta" data-src="${KONTAK.mapsEmbed}">
      <button class="pill pill-garis-gelap" type="button" id="tampil-peta">${ikon('pin')} Tampilkan peta</button>
    </div>
  </div>
</section>`;
