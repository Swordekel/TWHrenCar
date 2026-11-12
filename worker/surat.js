// Email dari panel admin (kode masuk dan undangan admin), lewat Cloudflare Email Service: binding send_email EMAIL, sama
// seperti situs ARSWORD (domain arswordlab.com sudah terdaftar di Compute > Email Service > Email Sending).
// Pengembangan lokal (DEV_MAIL=1 di .dev.vars) mencetak email ke terminal, tidak mengirim.
import { gagal } from './http.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

async function kirim(env, { ke, subjek, teks, html }) {
  if (env.DEV_MAIL === '1') {
    console.log(`[surat] ke ${ke} · ${subjek}\n${teks}`);
    return;
  }
  if (!env.EMAIL) gagal(503, 'surat_mati', 'Pengiriman email belum aktif. Hubungi ARSWORD lewat WhatsApp.');
  try {
    await env.EMAIL.send({
      to: ke,
      from: { email: env.MAIL_FROM || 'masuk@arswordlab.com', name: 'Admin TWH Rent Car' },
      subject: subjek,
      text: teks,
      html,
    });
  } catch (err) {
    console.error('surat gagal', err && err.code, err && err.message);
    gagal(503, 'surat_gagal', 'Email belum bisa dikirim. Coba lagi sebentar, atau hubungi ARSWORD lewat WhatsApp.');
  }
}

// satu pesan polos dan terang: kode besar, lalu untuk apa, lalu dari siapa
function tata(baris, kode) {
  return `<!doctype html><html lang="id"><body style="margin:0;padding:32px 20px;background:#ffffff;color:#0D2331;font:16px/1.55 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<div style="max-width:460px;margin:0 auto">
<p style="margin:0 0 24px;font-size:13px;letter-spacing:.2em;font-weight:700;color:#1B4766">TWH RENT CAR</p>
${kode ? `<p style="margin:0 0 8px;color:#4a4a4a">Kode masuk panel admin:</p><p style="margin:0 0 24px;font-size:36px;font-weight:700;letter-spacing:.18em;font-variant-numeric:tabular-nums">${esc(kode)}</p>` : ''}
${baris.map((l) => `<p style="margin:0 0 12px;color:#4a4a4a;overflow-wrap:anywhere">${esc(l).replace(/\n/g, '<br>')}</p>`).join('')}
<p style="margin:28px 0 0;padding-top:16px;border-top:1px solid #e7e7e7;font-size:13px;color:#6b6b6b">Panel admin situs TWH Rent Car · dibuat oleh ARSWORD</p>
</div></body></html>`;
}

export function kirimKode(env, ke, kode) {
  const baris = [
    'Ketik kode ini di halaman masuk panel admin. Kode berlaku 10 menit dan hanya bisa dipakai sekali.',
    'Kalau Anda tidak sedang masuk ke panel admin, abaikan email ini. Akun Anda tetap aman.',
  ];
  return kirim(env, {
    ke,
    subjek: `Kode masuk admin TWH Rent Car: ${kode}`,
    teks: `Kode masuk panel admin: ${kode}\n\n${baris.join('\n\n')}`,
    html: tata(baris, kode),
  });
}

export function kirimUndangan(env, ke, { nama, oleh, situs }) {
  const url = `${situs || 'https://twhrentcar.com'}/admin/`;
  const baris = [
    `Halo${nama ? ' ' + nama : ''}, ${oleh || 'ARSWORD'} menambahkan email ini sebagai admin situs TWH Rent Car.`,
    `Buka ${url}, ketik email ini, lalu masukkan kode 6 angka yang kami kirim. Tidak perlu kata sandi.`,
    'Di panel admin Anda bisa mengganti harga, foto, dan teks, menambah mobil, layanan, dan pertanyaan, lalu menerbitkannya ke situs.',
  ];
  return kirim(env, { ke, subjek: 'Anda sekarang admin situs TWH Rent Car', teks: baris.join('\n\n'), html: tata(baris) });
}
