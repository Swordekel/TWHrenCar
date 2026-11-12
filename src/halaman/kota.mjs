// /sewa-mobil-<kota>/: halaman kota (kata kunci "sewa mobil <kota>"): pembuka, titik antar jemput, armada, cara sewa.
import { heroHalaman, kartuMobil, langkah } from './bagian.mjs';

export default (c) => {
  const { h, D, T, esc, ikon, mobilBySlug } = c, K = T.kotaHal;
  const k = h.kota;
  const t = (s) => c.t(s, { kota: k.nama, unit: k.unit });
  const lain = D.KOTA.filter((x) => x.slug !== k.slug);
  return `
${heroHalaman({ ...c, t }, { judul: k.judul, teks: k.pembuka, mobil: mobilBySlug(k.mobil),
    tombol: `<div class="tombol-kiri"><a class="pill pill-navy" href="/kontak/?kota=${encodeURIComponent(k.nama)}#pesan" data-pesan data-kota="${esc(k.nama)}">${ikon('wa')} ${esc(c.Kc.pesanDi)} ${esc(k.nama)}</a><a class="tautan-panah" href="#armada-kota">${esc(k.unit)} ${esc(c.Kc.unitTersedia)} ${ikon('panah')}</a></div>` })}

<section class="bagian" data-bg="#EEF4F1" aria-labelledby="judul-antar">
  <div class="wrap dua-kolom kota-antar">
    <div class="teks-tumpuk">
      <h2 class="h2" id="judul-antar">${t(K.antarJudul)}</h2>
      <p class="teks">${t(k.cerita)}</p>
    </div>
    <div class="antar-daftar">
      <h3 class="judul-kecil">${esc(c.Kc.bandara)}</h3>
      <ul class="daftar-cek">${k.bandara.map((b) => `<li>${ikon('pesawat')}${esc(b)}</li>`).join('')}</ul>
      <h3 class="judul-kecil">${esc(c.Kc.jugaDiantar)}</h3>
      <ul class="daftar-cek">${k.titik.map((b) => `<li>${ikon('pin')}${esc(b)}</li>`).join('')}</ul>
      <p class="catatan-kecil">${t(K.biaya)} ${k.garasi ? `${esc(c.Kc.ambilSendiri)} ${esc(D.KONTAK.alamatPendek)}.` : ''}</p>
    </div>
  </div>
</section>

<section class="bagian gelap" id="armada-kota" data-bg="#0D2331" aria-labelledby="judul-armada-kota">
  <div class="wrap">
    <div class="dua-kolom"><h2 class="h2" id="judul-armada-kota">${t(K.armadaJudul)}</h2><p class="teks">${t(K.armadaTeks)}</p></div>
    <div class="grid-mobil">${D.ARMADA.map((m) => kartuMobil(c, m)).join('\n')}</div>
  </div>
</section>

<section class="bagian mint" data-bg="#90D0BF" aria-labelledby="judul-cara">
  <div class="wrap">
    <div class="dua-kolom">
      <h2 class="h2" id="judul-cara">${t(K.caraJudul)}</h2>
      <a class="tautan-panah" href="/cara-sewa/">${t(K.caraTautan)} ${ikon('panah')}</a>
    </div>
    ${langkah(c)}
  </div>
</section>

<section class="bagian" data-bg="#EEF4F1" aria-label="Kota lain">
  <div class="wrap kota-lain">
    <h2 class="h3">${t(K.lainJudul)}</h2>
    <div class="kota-daftar">${lain.map((x) => `<a class="kota-kartu kota-kartu-terang" href="/sewa-mobil-${x.slug}/"><span class="kota-nama">Sewa mobil ${esc(x.nama)}</span><span class="kota-unit">${esc(x.unit)} unit</span>${ikon('panah')}</a>`).join('')}</div>
  </div>
</section>`;
};
