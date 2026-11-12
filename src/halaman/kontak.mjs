// /kontak/: formulir pesan (sama dengan lembar pesan) di halaman, cara menghubungi, alamat garasi dan peta.
export default (c) => {
  const { D, T, t, esc, ikon, href, remah, formPesan, WA } = c, K = D.KONTAK, H = T.kontakHal;
  return `
<section id="atas" class="hero hero-halaman hero-kontak" data-bg="#EEF4F1">
  <div class="wrap kontak-atas">
    <div class="kontak-teks">
      ${remah}
      <h1>${t(H.judul)}</h1>
      <p class="hero-teks">${t(H.teks)}</p>
      <ul class="kontak-cara">
        <li><a data-wa="umum" href="${WA}" target="_blank" rel="noopener">${ikon('wa')}<span><strong>${esc(c.Kc.kontakWa)}</strong>${esc(K.telepon)}</span></a></li>
        <li><a href="tel:${K.teleponLink}">${ikon('telepon')}<span><strong>${esc(c.Kc.kontakTelepon)}</strong>${esc(K.telepon)}</span></a></li>
        <li><a href="${href(K.maps)}" target="_blank" rel="noopener">${ikon('pin')}<span><strong>${esc(c.Kc.kontakGarasi)}</strong>${esc(K.alamat)}</span></a></li>
        <li><span class="kontak-statis">${ikon('jam')}<span><strong>${esc(c.Kc.kontakJam)}</strong>${esc(K.jam)}</span></span></li>
      </ul>
    </div>
    <div class="kontak-form" id="pesan">
      ${formPesan('pesan-kontak')}
    </div>
  </div>
</section>

<section class="bagian" data-bg="#EEF4F1" aria-labelledby="judul-peta">
  <div class="wrap">
    <h2 class="h3" id="judul-peta">${t(H.petaJudul)}</h2>
    <div class="peta-google peta-lebar" id="peta" data-src="${href(K.mapsEmbed)}">
      <button class="pill pill-garis-gelap" type="button" id="tampil-peta">${ikon('pin')} ${esc(c.Kc.tampilPeta)}</button>
    </div>
  </div>
</section>`;
};
