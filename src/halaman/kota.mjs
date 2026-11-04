// /sewa-mobil-<kota>/: halaman kota (kata kunci "sewa mobil <kota>"): pembuka, titik antar jemput, armada, cara sewa.
import { ARMADA, KONTAK, KOTA } from '../data.mjs';
import { esc, heroHalaman, ikon, kartuMobil, langkah } from './bagian.mjs';

export default ({ h, fotoMobil, remah, mobilBySlug }) => {
  const k = h.kota;
  const lain = KOTA.filter((x) => x.slug !== k.slug);
  return `
${heroHalaman({ judul: k.judul, teks: k.pembuka, remah, mobil: mobilBySlug(h.foto), fotoMobil,
    tombol: `<div class="tombol-kiri"><a class="pill pill-navy" href="/kontak/?kota=${k.nama}#pesan" data-pesan data-kota="${k.nama}">${ikon('wa')} Pesan di ${k.nama}</a><a class="tautan-panah" href="#armada-kota">${k.unit} unit tersedia ${ikon('panah')}</a></div>` })}

<section class="bagian" data-bg="#EEF4F1" aria-labelledby="judul-antar">
  <div class="wrap dua-kolom kota-antar">
    <div class="teks-tumpuk">
      <h2 class="h2" id="judul-antar">Diantar ke mana saja di ${k.nama}.</h2>
      <p class="teks">${esc(k.cerita)}</p>
    </div>
    <div class="antar-daftar">
      <h3 class="judul-kecil">Bandara</h3>
      <ul class="daftar-cek">${k.bandara.map((b) => `<li>${ikon('pesawat')}${esc(b)}</li>`).join('')}</ul>
      <h3 class="judul-kecil">Juga diantar ke</h3>
      <ul class="daftar-cek">${k.titik.map((b) => `<li>${ikon('pin')}${esc(b)}</li>`).join('')}</ul>
      <p class="catatan-kecil">Biaya antar disampaikan di awal. ${k.garasi ? `Ambil sendiri di garasi: ${esc(KONTAK.alamatPendek)}.` : ''}</p>
    </div>
  </div>
</section>

<section class="bagian gelap" id="armada-kota" data-bg="#0D2331" aria-labelledby="judul-armada-kota">
  <div class="wrap">
    <div class="dua-kolom"><h2 class="h2" id="judul-armada-kota">Armada di ${k.nama}.</h2><p class="teks">${k.unit} unit di ${k.nama}. Unit yang tersedia pada tanggal Anda dikonfirmasi lewat WhatsApp.</p></div>
    <div class="grid-mobil">${ARMADA.map((m) => kartuMobil(m, fotoMobil)).join('\n')}</div>
  </div>
</section>

<section class="bagian mint" data-bg="#90D0BF" aria-labelledby="judul-cara">
  <div class="wrap">
    <div class="dua-kolom">
      <h2 class="h2" id="judul-cara">Cara sewa mobil di ${k.nama}.</h2>
      <a class="tautan-panah" href="/cara-sewa/">Syarat dokumen dan FAQ ${ikon('panah')}</a>
    </div>
    ${langkah()}
  </div>
</section>

<section class="bagian" data-bg="#EEF4F1" aria-label="Kota lain">
  <div class="wrap kota-lain">
    <h2 class="h3">Juga tersedia di</h2>
    <div class="kota-daftar">${lain.map((x) => `<a class="kota-kartu kota-kartu-terang" href="/sewa-mobil-${x.slug}/"><span class="kota-nama">Sewa mobil ${x.nama}</span><span class="kota-unit">${x.unit} unit</span>${ikon('panah')}</a>`).join('')}</div>
  </div>
</section>`;
};
