// /armada/<mobil>/: satu halaman per kendaraan (kata kunci "sewa <mobil> jakarta"): foto besar, harga, spesifikasi,
// cocok untuk, cara sewa singkat, mobil lain di kelas yang sama.
import { kartuMobil, langkah } from './bagian.mjs';

export default (c) => {
  const { h, D, T, esc, ikon, fotoMobil, remah, rupiah } = c, M = T.mobilHal;
  const m = h.mobil;
  const t = (s) => c.t(s, { nama: m.nama, model: m.model });
  const lain = D.ARMADA.filter((x) => x.slug !== m.slug && x.kelas === m.kelas).concat(D.ARMADA.filter((x) => x.kelas !== m.kelas)).slice(0, 3);
  const kota = D.KOTA.map((k) => k.nama).join(', ').replace(/, ([^,]*)$/, ', dan $1');
  return `
<section id="atas" class="hero hero-mobil" data-bg="#EEF4F1">
  <div class="wrap hero-mobil-isi">
    <div class="hero-mobil-teks">
      ${remah}
      <p class="hero-label">${esc(m.jenis)} · ${m.kursi} ${esc(c.Kc.kursi)}</p>
      <h1>${esc(c.Kc.sewa)} ${esc(m.nama)}</h1>
      <p class="hero-trim">${esc(m.trim)}</p>
      <p class="hero-teks">${t(m.ringkas)} ${esc(c.Kc.tersediaDi)} ${esc(kota)}.</p>
      <p class="harga harga-besar"><span class="harga-mulai">${esc(c.Kc.mulai)}</span><strong>${rupiah(m.harga)}</strong><span>${esc(c.Kc.hari)}</span></p>
      <div class="tombol-kiri">
        <a class="pill pill-navy" href="/kontak/?mobil=${m.slug}#pesan" data-pesan="${m.slug}">${ikon('wa')} ${esc(c.Kc.pesan)} ${esc(m.model)}</a>
        <a class="tautan-panah" href="/armada/">${esc(c.Kc.bandingkan)} ${ikon('panah')}</a>
      </div>
    </div>
    <div class="hero-mobil-panggung">${fotoMobil(m, '(max-width: 900px) 92vw, 52vw', 'hero-mobil-foto', 'awal')}</div>
  </div>
</section>

<section class="bagian" data-bg="#EEF4F1" aria-labelledby="judul-spek">
  <div class="wrap mobil-detail">
    <div class="mobil-cerita">
      <h2 class="h3" id="judul-spek">${t(M.tentangJudul)}</h2>
      <p class="teks">${t(m.isi)}</p>
      <h3 class="judul-kecil">${t(M.cocokJudul)}</h3>
      <ul class="daftar-cek">${m.cocok.map((x) => `<li>${ikon('cek')}${esc(x)}</li>`).join('')}</ul>
    </div>
    <dl class="spek">
      <div><dt>${esc(c.Kc.kendaraan)}</dt><dd>${esc(m.nama)}</dd></div>
      <div><dt>${esc(c.Kc.varian)}</dt><dd>${esc(m.trim)}</dd></div>
      <div><dt>${esc(c.Kc.jenis)}</dt><dd>${esc(m.jenis)}</dd></div>
      <div><dt>${esc(c.Kc.kapasitas)}</dt><dd>${m.kursi} ${esc(c.Kc.penumpang)}</dd></div>
      <div><dt>${esc(c.Kc.transmisi)}</dt><dd>${esc(m.transmisi)}</dd></div>
      <div><dt>${esc(c.Kc.hargaSewa)}</dt><dd>${rupiah(m.harga)} ${esc(c.Kc.perHari)}</dd></div>
      <div><dt>${esc(c.Kc.kotaLabel)}</dt><dd>${D.KOTA.map((k) => `<a href="/sewa-mobil-${k.slug}/">${esc(k.nama)}</a>`).join(', ')}</dd></div>
      <div><dt>${esc(c.Kc.penyerahan)}</dt><dd>${t(M.penyerahan)}</dd></div>
    </dl>
  </div>
</section>

<section class="bagian mint" data-bg="#90D0BF" aria-labelledby="judul-cara">
  <div class="wrap">
    <div class="dua-kolom">
      <h2 class="h2" id="judul-cara">${t(M.caraJudul)}</h2>
      <div class="teks-tumpuk"><p class="teks">${t(M.caraTeks)}</p><a class="tautan-panah" href="/cara-sewa/">${t(M.caraTautan)} ${ikon('panah')}</a></div>
    </div>
    ${langkah(c)}
  </div>
</section>

<section class="bagian" data-bg="#EEF4F1" aria-labelledby="judul-lain">
  <div class="wrap">
    <div class="dua-kolom"><h2 class="h2" id="judul-lain">${t(M.lainJudul)}</h2><a class="tautan-panah" href="/armada/">${esc(c.Kc.semuaArmada)} ${ikon('panah')}</a></div>
    <div class="grid-mobil grid-tiga">${lain.map((x) => kartuMobil(c, x)).join('\n')}</div>
  </div>
</section>`;
};
