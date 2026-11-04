// /lokasi/: peta tiga kota dan kartu tiap kota (ke halaman /sewa-mobil-<kota>/), garasi Jakarta.
import { KONTAK, KOTA } from '../data.mjs';
import { esc, heroHalaman, ikon, peta } from './bagian.mjs';

export default ({ fotoMobil, remah, mobilBySlug }) => `
${heroHalaman({ judul: 'Jakarta, Malang, Surabaya.', teks: 'Lima puluh kendaraan di tiga kota. Diantar ke bandara, stasiun, hotel, atau alamat Anda, buka 24 jam.', remah, mobil: mobilBySlug('toyota-innova-reborn'), fotoMobil })}

<section class="bagian gelap kota-bagian" data-bg="#0D2331" aria-labelledby="judul-peta">
  <div class="wrap">
    <h2 class="h2" id="judul-peta">Di mana kami ada.</h2>
    <div class="peta-bingkai">${peta()}</div>
    <div class="kota-daftar kota-daftar-besar">
      ${KOTA.map((k) => `<a class="kota-kartu" href="/sewa-mobil-${k.slug}/" data-kota="${k.slug}"><span class="kota-nama">Sewa mobil ${k.nama}</span><span class="kota-unit">${k.unit} unit${k.garasi ? ' · garasi utama' : ''}</span><span class="kota-bandara">${esc(k.bandara.join(' · '))}</span>${ikon('panah')}</a>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="bagian" data-bg="#EEF4F1" aria-labelledby="judul-garasi">
  <div class="wrap dua-kolom garasi">
    <div class="teks-tumpuk">
      <h2 class="h2" id="judul-garasi">Garasi Jakarta.</h2>
      <address class="alamat-besar">${esc(KONTAK.alamat)}</address>
      <p class="teks">${esc(KONTAK.jam)}. Ambil sendiri di garasi atau minta diantar.</p>
      <div class="tombol-kiri"><a class="pill pill-navy" href="${KONTAK.maps}" target="_blank" rel="noopener">${ikon('pin')} Buka di Google Maps</a><a class="tautan-panah" href="/kontak/">Kontak dan formulir pesan ${ikon('panah')}</a></div>
    </div>
    <div class="peta-google" id="peta" data-src="${KONTAK.mapsEmbed}">
      <button class="pill pill-garis-gelap" type="button" id="tampil-peta">${ikon('pin')} Tampilkan peta</button>
    </div>
  </div>
</section>`;
