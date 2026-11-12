// /layanan/: layanan, masing-masing dengan mobil yang paling cocok dan tombol WhatsApp dengan pesan sendiri.
import { heroHalaman } from './bagian.mjs';

// ikon yang bisa dipilih di panel (simbol #i-<nama> di sprite src/rakit.mjs)
export const IKON_LAYANAN = ['pesawat', 'cincin', 'gedung', 'rombongan', 'jalan', 'kalender'];

export default (c) => {
  const { D, T, t, esc, ikon, mobilBySlug, rupiah } = c, L = T.layananHal;
  return `
${heroHalaman(c, { judul: L.judul, teks: L.teks, mobil: mobilBySlug(L.mobil) })}

<section class="bagian" data-bg="#EEF4F1" aria-label="Daftar layanan">
  <div class="wrap layanan-daftar">
    ${D.LAYANAN.map((l, i) => { const m = mobilBySlug(l.mobil); return `<article class="layanan-baris" id="${esc(l.id)}">
      <div class="layanan-baris-teks">
        <span class="layanan-ikon">${`<svg class="ik" aria-hidden="true"><use href="#i-${IKON_LAYANAN.includes(l.ikon) ? l.ikon : 'jalan'}"/></svg>`}</span>
        <p class="layanan-no">${String(i + 1).padStart(2, '0')}</p>
        <h2 class="h3">${t(l.judul)}.</h2>
        <p class="teks">${t(l.teks)}</p>
        ${m ? `<p class="layanan-saran">Paling cocok: <a href="/armada/${m.slug}/">${esc(m.nama)}</a>, mulai ${rupiah(m.harga)}/hari</p>` : ''}
        <div class="tombol-kiri"><a class="pill pill-navy" data-wa="layanan" data-layanan="${esc(l.wa)}" href="https://wa.me/" target="_blank" rel="noopener">${ikon('wa')} Tanya ${t(l.judul.toLowerCase())}</a></div>
      </div>
      ${m ? `<a class="layanan-baris-foto" href="/armada/${m.slug}/" tabindex="-1" aria-hidden="true">${c.fotoMobil(m, '(max-width: 900px) 86vw, 44vw', '', 'lazy', '')}</a>` : ''}
    </article>`; }).join('\n    ')}
  </div>
</section>`;
};
