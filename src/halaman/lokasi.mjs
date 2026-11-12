// /lokasi/: peta tiga kota dan kartu tiap kota (ke halaman /sewa-mobil-<kota>/), garasi Jakarta.
import { heroHalaman, peta } from './bagian.mjs';

export default (c) => {
  const { D, T, t, esc, ikon, href, mobilBySlug } = c, L = T.lokasiHal, K = D.KONTAK;
  return `
${heroHalaman(c, { judul: L.judul, teks: L.teks, mobil: mobilBySlug(L.mobil) })}

<section class="bagian gelap kota-bagian" data-bg="#0D2331" aria-labelledby="judul-peta">
  <div class="wrap">
    <h2 class="h2" id="judul-peta">${t(L.petaJudul)}</h2>
    <div class="peta-bingkai">${peta(c)}</div>
    <div class="kota-daftar kota-daftar-besar">
      ${D.KOTA.map((k) => `<a class="kota-kartu" href="/sewa-mobil-${k.slug}/" data-kota="${k.slug}"><span class="kota-nama">${esc(c.Kc.sewaMobil)} ${esc(k.nama)}</span><span class="kota-unit">${esc(k.unit)} ${esc(c.Kc.unit)}${k.garasi ? ` · ${esc(c.Kc.garasiUtama)}` : ''}</span><span class="kota-bandara">${esc(k.bandara.join(' · '))}</span>${ikon('panah')}</a>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="bagian" data-bg="#EEF4F1" aria-labelledby="judul-garasi">
  <div class="wrap dua-kolom garasi">
    <div class="teks-tumpuk">
      <h2 class="h2" id="judul-garasi">${t(L.garasiJudul)}</h2>
      <address class="alamat-besar">${esc(K.alamat)}</address>
      <p class="teks">${esc(K.jam)}. ${t(L.garasiTeks)}</p>
      <div class="tombol-kiri"><a class="pill pill-navy" href="${href(K.maps)}" target="_blank" rel="noopener">${ikon('pin')} ${t(L.tombolMaps)}</a><a class="tautan-panah" href="/kontak/">${t(L.tautanKontak)} ${ikon('panah')}</a></div>
    </div>
    <div class="peta-google" id="peta" data-src="${href(K.mapsEmbed)}">
      <button class="pill pill-garis-gelap" type="button" id="tampil-peta">${ikon('pin')} ${esc(c.Kc.tampilPeta)}</button>
    </div>
  </div>
</section>`;
};
