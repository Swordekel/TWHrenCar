// Beranda: panggung mobil (WebGL), bilah cek tanggal, kalimat bergulir dengan rute di belakangnya, angka, armada
// (geser samping), layanan, cara sewa singkat, tiga kota di peta, ulasan.
import { angka, kartuMobil, langkah, peta, ulasan } from './bagian.mjs';

export default (c) => {
  const { D, T, t, esc, ikon, fotoMobil, mobilBySlug, rupiah } = c, B = T.beranda;
  const m0 = D.HERO[0];
  return `
<section id="atas" class="hero hero-panggung" data-bg="#EEF4F1" aria-label="Pembuka">
  <div class="panggung" id="panggung">
    <div class="panggung-tempat" id="panggung-tempat">${m0 ? fotoMobil(m0, '(max-width: 760px) 92vw, 56vw', 'panggung-foto', 'awal', `${m0.nama} di panggung TWH Rent Car`) : ''}</div>
    <canvas class="panggung-kanvas" id="panggung-kanvas" aria-hidden="true"></canvas>
  </div>
  <div class="wrap hero-isi">
    <p class="hero-label"><span class="titik-hidup"></span>${t(B.label)}</p>
    <h1><span>${t(B.judul1)}</span> <span>${t(B.judul2)}</span></h1>
    <p class="hero-teks">${t(B.teks)}</p>
    <div class="tombol-kiri">
      <a class="pill pill-navy" href="/kontak/#pesan" data-pesan>${ikon('wa')} ${t(T.umum.tombolPesan)}</a>
      <a class="tautan-panah" href="/armada/">${t(B.tautan)} ${ikon('panah')}</a>
    </div>
  </div>
  <div class="wrap hero-pilih">
    <div class="hero-info" id="hero-info" aria-live="polite">
      ${m0 ? `<a class="hero-nama" id="hero-nama" href="/armada/${m0.slug}/">${esc(m0.nama)}</a>
      <span class="hero-detail" id="hero-detail">${m0.kursi} kursi · ${esc(m0.transmisi.replace(/ \(.*\)/, ''))}</span>
      <span class="hero-harga" id="hero-harga">${rupiah(m0.harga)}<small>/hari</small></span>` : ''}
    </div>
    <div class="hero-chips chips" data-chips="hero" role="group" aria-label="Ganti mobil di panggung">
      ${D.HERO.map((m, i) => `<button type="button" aria-pressed="${i === 0}" data-mobil="${m.slug}">${esc(m.model)}</button>`).join('\n      ')}
    </div>
    <p class="hero-petunjuk" aria-hidden="true">${t(B.petunjuk)}</p>
  </div>
</section>

<section class="bagian bagian-cek" data-bg="#EEF4F1" aria-label="Cek ketersediaan">
  <form class="wrap cek" id="cek" novalidate>
    <label class="cek-kolom"><span>Kota</span><select name="kota">${D.KOTA.map((k) => `<option>${esc(k.nama)}</option>`).join('')}</select></label>
    <label class="cek-kolom"><span>Ambil</span><input type="date" name="mulai" aria-label="Tanggal ambil"></label>
    <label class="cek-kolom"><span>Kembali</span><input type="date" name="selesai" aria-label="Tanggal kembali"></label>
    <label class="cek-kolom"><span>Kendaraan</span><select name="mobil"><option value="">Semua jenis</option>${D.ARMADA.map((m) => `<option value="${m.slug}">${esc(m.nama)}</option>`).join('')}</select></label>
    <button class="pill pill-navy" type="submit">Cek ketersediaan ${ikon('panah')}</button>
  </form>
</section>

<section class="bagian pernyataan" data-bg="#EEF4F1" data-words aria-label="Tentang TWH Rent Car">
  <div class="pernyataan-tempel">
    <canvas class="rute-kanvas" id="rute-kanvas" aria-hidden="true"></canvas>
    <p class="kata-teks h-kata">${t(B.pernyataan)}</p>
  </div>
</section>

<section class="bagian" data-bg="#EEF4F1" aria-label="TWH Rent Car dalam angka">
  <div class="wrap">${angka(c)}</div>
</section>

<section class="bagian armada-geser" id="armada" data-bg="#0D2331" data-hscroll aria-labelledby="judul-armada">
  <div class="geser-tempel">
    <div class="wrap geser-kepala">
      <h2 class="h2" id="judul-armada">${t(B.armadaJudul)}</h2>
      <div class="geser-kanan"><p class="teks">${t(B.armadaTeks)}</p><a class="tautan-panah" href="/armada/">${t(B.armadaTautan)} ${ikon('panah')}</a></div>
    </div>
    <div class="geser-jalur" data-track>
      ${D.ARMADA.map((m) => kartuMobil(c, m)).join('\n      ')}
      <a class="kartu-semua" href="/armada/"><span>${t(B.armadaSemua)}</span>${ikon('panah')}</a>
    </div>
    <div class="wrap geser-bilah"><i data-hbar></i></div>
  </div>
</section>

<section class="bagian mint" id="layanan" data-bg="#90D0BF" aria-labelledby="judul-layanan">
  <div class="wrap">
    <div class="dua-kolom">
      <h2 class="h2" id="judul-layanan">${t(B.layananJudul)}</h2>
      <p class="teks">${t(B.layananTeks)}</p>
    </div>
    <div class="layanan-grid">
      ${D.LAYANAN.map((l) => { const m = mobilBySlug(l.mobil); return `<a class="layanan-kartu" href="/layanan/#${esc(l.id)}">
        <span class="layanan-foto">${m ? fotoMobil(m, '(max-width: 700px) 70vw, 300px', '', 'lazy', '') : ''}</span>
        <h3>${t(l.judul)}</h3><p>${t(l.teks)}</p><span class="layanan-panah">${ikon('panah')}</span></a>`; }).join('\n      ')}
    </div>
  </div>
</section>

<section class="bagian" data-bg="#EEF4F1" aria-labelledby="judul-cara">
  <div class="wrap">
    <div class="dua-kolom">
      <h2 class="h2" id="judul-cara">${t(B.caraJudul)}</h2>
      <div class="teks-tumpuk"><p class="teks">${t(B.caraTeks)}</p><a class="tautan-panah" href="/cara-sewa/">${t(B.caraTautan)} ${ikon('panah')}</a></div>
    </div>
    ${langkah(c)}
  </div>
</section>

<section class="bagian gelap kota-bagian" id="kota" data-bg="#0D2331" aria-labelledby="judul-kota">
  <div class="wrap">
    <div class="dua-kolom">
      <h2 class="h2" id="judul-kota">${t(B.kotaJudul)}</h2>
      <p class="teks">${t(B.kotaTeks)}</p>
    </div>
    <div class="peta-bingkai">${peta(c)}</div>
    <div class="kota-daftar">
      ${D.KOTA.map((k) => `<a class="kota-kartu" href="/sewa-mobil-${k.slug}/" data-kota="${k.slug}"><span class="kota-nama">${esc(k.nama)}</span><span class="kota-unit">${esc(k.unit)} unit</span><span class="kota-bandara">${esc(k.bandara.join(' · '))}</span>${ikon('panah')}</a>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="bagian" data-bg="#EEF4F1" aria-labelledby="judul-ulasan">
  <div class="wrap">
    <h2 class="h2 tengah-teks" id="judul-ulasan">${t(B.ulasanJudul)}</h2>
    ${ulasan(c)}
  </div>
</section>`;
};
