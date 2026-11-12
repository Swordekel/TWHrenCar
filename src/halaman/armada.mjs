// /armada/: pemilih menurut jumlah penumpang, filter kelas, kartu semua mobil, dan tabel daftar harga.
import { heroHalaman, kartuMobil } from './bagian.mjs';

export default (c) => {
  const { D, T, t, esc, ikon, mobilBySlug, rupiah } = c, A = T.armadaHal;
  const maks = Math.max(1, ...D.ARMADA.map((m) => +m.kursi || 0));
  return `
${heroHalaman(c, { judul: A.judul, teks: A.teks, mobil: mobilBySlug(A.mobil) })}

<section class="bagian penumpang-bagian" data-bg="#EEF4F1" aria-labelledby="judul-penumpang">
  <div class="wrap penumpang" id="penumpang">
    <div class="penumpang-kiri">
      <h2 class="h3" id="judul-penumpang">${t(A.penumpangJudul)}</h2>
      <p class="teks">${t(A.penumpangTeks)}</p>
      <div class="penumpang-angka"><output id="penumpang-n" for="penumpang-geser">4</output><span>${esc(c.Kc.orang)}</span></div>
      <input type="range" id="penumpang-geser" min="1" max="${maks}" value="4" step="1" aria-label="Jumlah penumpang">
      <p class="penumpang-saran" id="penumpang-saran" aria-live="polite"></p>
    </div>
    <div class="penumpang-kursi" id="penumpang-kursi" aria-hidden="true"></div>
  </div>
</section>

<section class="bagian" id="daftar" data-bg="#EEF4F1" aria-labelledby="judul-daftar">
  <div class="wrap">
    <div class="daftar-kepala">
      <h2 class="h2" id="judul-daftar">${t(A.daftarJudul)}</h2>
      <div class="chips chips-filter" data-chips="kelas" role="group" aria-label="Saring menurut jenis">
        <button type="button" aria-pressed="true" data-kelas="semua">${esc(c.Kc.semua)}</button>
        ${D.KELAS.map((k) => `<button type="button" aria-pressed="false" data-kelas="${esc(k.id)}">${esc(k.label)}</button>`).join('\n        ')}
      </div>
    </div>
    <div class="grid-mobil" id="grid-mobil">
      ${D.ARMADA.map((m) => kartuMobil(c, m)).join('\n      ')}
    </div>
    <p class="grid-kosong" id="grid-kosong" hidden>${esc(String(c.Kc.kosong).replace('{maks}', maks))} <a class="tautan-polos" href="/kontak/#pesan" data-pesan>${esc(c.Kc.kosongTautan)}</a>.</p>
  </div>
</section>

<section class="bagian" data-bg="#EEF4F1" aria-labelledby="judul-harga">
  <div class="wrap">
    <h2 class="h3" id="judul-harga">${t(A.hargaJudul)}</h2>
    <div class="tabel-bungkus">
      <table class="tabel-harga">
        <caption>${t(A.hargaKet)}</caption>
        <thead><tr><th scope="col">${esc(c.Kc.kendaraan)}</th><th scope="col">${esc(c.Kc.jenis)}</th><th scope="col">${esc(c.Kc.kursiKolom)}</th><th scope="col">${esc(c.Kc.transmisi)}</th><th scope="col">${esc(c.Kc.hargaHari)}</th></tr></thead>
        <tbody>
          ${D.ARMADA.map((m) => `<tr><th scope="row"><a href="/armada/${m.slug}/">${esc(m.nama)}</a> <span class="redup">${esc(m.trim)}</span></th><td>${esc(m.jenis)}</td><td>${m.kursi}</td><td>${esc(m.transmisi)}</td><td class="angka-kanan">${rupiah(m.harga)}</td></tr>`).join('\n          ')}
        </tbody>
      </table>
    </div>
    <p class="catatan-kecil">${t(A.catatan1)} ${ikon('cek')} ${t(A.catatan2)}</p>
  </div>
</section>`;
};
