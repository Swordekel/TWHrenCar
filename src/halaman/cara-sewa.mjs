// /cara-sewa/: empat langkah (jalan yang terisi saat digulir), syarat dokumen, cara bayar, FAQ (data terstruktur
// FAQPage ada di bangun.mjs).
import { KONTAK, SYARAT } from '../data.mjs';
import { esc, faq, heroHalaman, ikon, langkah } from './bagian.mjs';

export default ({ fotoMobil, remah, mobilBySlug }) => `
${heroHalaman({ judul: 'Cara sewa, syarat, dan pembayaran.', teks: 'Empat langkah dari memilih mobil sampai kunci di tangan. Semua dokumen cukup dikirim lewat WhatsApp; verifikasinya sekitar sepuluh menit.', remah, mobil: mobilBySlug('toyota-avanza'), fotoMobil })}

<section class="bagian" data-bg="#EEF4F1" aria-labelledby="judul-langkah">
  <div class="wrap">
    <h2 class="h2" id="judul-langkah">Empat langkah.</h2>
    <div class="jalan-langkah" data-jalan>
      <div class="jalan-garis" aria-hidden="true"><i data-jalan-isi></i></div>
      ${langkah()}
    </div>
  </div>
</section>

<section class="bagian mint" id="syarat" data-bg="#90D0BF" aria-labelledby="judul-syarat">
  <div class="wrap">
    <div class="dua-kolom">
      <h2 class="h2" id="judul-syarat">Dokumen yang disiapkan.</h2>
      <p class="teks">Kirim fotonya lewat WhatsApp. Data hanya dipakai untuk verifikasi penyewaan.</p>
    </div>
    <ul class="syarat" id="syarat-daftar">
      ${SYARAT.map((s) => `<li><button type="button" class="syarat-cek" aria-pressed="false">${ikon('cek')}<span class="syarat-nama">${esc(s.nama)}</span><span class="syarat-teks">${esc(s.teks)}</span></button></li>`).join('\n      ')}
    </ul>
    <p class="syarat-status" id="syarat-status" aria-live="polite">Centang yang sudah Anda siapkan.</p>
  </div>
</section>

<section class="bagian" id="bayar" data-bg="#EEF4F1" aria-labelledby="judul-bayar">
  <div class="wrap dua-kolom bayar">
    <div class="teks-tumpuk">
      <h2 class="h2" id="judul-bayar">Bayar dengan cara Anda.</h2>
      <p class="teks">Deposit dikembalikan setelah mobil kembali. Biaya antar ke hotel, bandara, atau alamat Anda disampaikan di awal, sebelum membayar.</p>
    </div>
    <ul class="bayar-daftar">${KONTAK.bayar.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
  </div>
</section>

<section class="bagian" id="faq" data-bg="#EEF4F1" aria-labelledby="judul-faq">
  <div class="wrap faq-bungkus">
    <h2 class="h2" id="judul-faq">Pertanyaan yang sering ditanyakan.</h2>
    ${faq()}
  </div>
</section>`;
