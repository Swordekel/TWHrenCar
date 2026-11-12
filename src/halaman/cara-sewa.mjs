// /cara-sewa/: empat langkah (jalan yang terisi saat digulir), syarat dokumen, cara bayar, FAQ (data terstruktur
// FAQPage ada di src/rakit.mjs).
import { faq, heroHalaman, langkah } from './bagian.mjs';

export default (c) => {
  const { D, T, t, esc, ikon, mobilBySlug } = c, C = T.caraHal;
  return `
${heroHalaman(c, { judul: C.judul, teks: C.teks, mobil: mobilBySlug(C.mobil) })}

<section class="bagian" data-bg="#EEF4F1" aria-labelledby="judul-langkah">
  <div class="wrap">
    <h2 class="h2" id="judul-langkah">${t(C.langkahJudul)}</h2>
    <div class="jalan-langkah" data-jalan>
      <div class="jalan-garis" aria-hidden="true"><i data-jalan-isi></i></div>
      ${langkah(c)}
    </div>
  </div>
</section>

<section class="bagian mint" id="syarat" data-bg="#90D0BF" aria-labelledby="judul-syarat">
  <div class="wrap">
    <div class="dua-kolom">
      <h2 class="h2" id="judul-syarat">${t(C.syaratJudul)}</h2>
      <p class="teks">${t(C.syaratTeks)}</p>
    </div>
    <ul class="syarat" id="syarat-daftar">
      ${D.SYARAT.map((s) => `<li><button type="button" class="syarat-cek" aria-pressed="false">${ikon('cek')}<span class="syarat-nama">${esc(s.nama)}</span><span class="syarat-teks">${t(s.teks)}</span></button></li>`).join('\n      ')}
    </ul>
    <p class="syarat-status" id="syarat-status" aria-live="polite">Centang yang sudah Anda siapkan.</p>
  </div>
</section>

<section class="bagian" id="bayar" data-bg="#EEF4F1" aria-labelledby="judul-bayar">
  <div class="wrap dua-kolom bayar">
    <div class="teks-tumpuk">
      <h2 class="h2" id="judul-bayar">${t(C.bayarJudul)}</h2>
      <p class="teks">${t(C.bayarTeks)}</p>
    </div>
    <ul class="bayar-daftar">${D.KONTAK.bayar.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
  </div>
</section>

<section class="bagian" id="faq" data-bg="#EEF4F1" aria-labelledby="judul-faq">
  <div class="wrap faq-bungkus">
    <h2 class="h2" id="judul-faq">${t(C.faqJudul)}</h2>
    ${faq(c)}
  </div>
</section>`;
};
