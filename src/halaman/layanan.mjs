// /layanan/: enam layanan, masing-masing dengan mobil yang paling cocok dan tombol WhatsApp dengan pesan sendiri.
import { LAYANAN, rupiah } from '../data.mjs';
import { esc, heroHalaman, ikon } from './bagian.mjs';

const IKON = { bandara: 'pesawat', pengantin: 'cincin', perusahaan: 'gedung', wisata: 'rombongan', antarkota: 'jalan', bulanan: 'kalender' };

export default ({ fotoMobil, remah, mobilBySlug }) => `
${heroHalaman({ judul: 'Satu rental untuk semua perjalanan.', teks: 'Antar jemput bandara, mobil pengantin, kendaraan untuk perusahaan, wisata rombongan, antar kota, dan sewa bulanan. Di Jakarta, Malang, dan Surabaya.', remah, mobil: mobilBySlug('toyota-hiace'), fotoMobil })}

<section class="bagian" data-bg="#EEF4F1" aria-label="Daftar layanan">
  <div class="wrap layanan-daftar">
    ${LAYANAN.map((l, i) => { const m = mobilBySlug(l.mobil); return `<article class="layanan-baris" id="${l.id}">
      <div class="layanan-baris-teks">
        <span class="layanan-ikon">${`<svg class="ik" aria-hidden="true"><use href="#i-${IKON[l.id]}"/></svg>`}</span>
        <p class="layanan-no">${String(i + 1).padStart(2, '0')}</p>
        <h2 class="h3">${esc(l.judul)}.</h2>
        <p class="teks">${esc(l.teks)}</p>
        <p class="layanan-saran">Paling cocok: <a href="/armada/${m.slug}/">${esc(m.nama)}</a>, mulai ${rupiah(m.harga)}/hari</p>
        <div class="tombol-kiri"><a class="pill pill-navy" data-wa="layanan" data-layanan="${esc(l.wa)}" href="https://wa.me/" target="_blank" rel="noopener">${ikon('wa')} Tanya ${esc(l.judul.toLowerCase())}</a></div>
      </div>
      <a class="layanan-baris-foto${m.slug === 'isuzu-elf' ? ' kanan-terpotong' : ''}" href="/armada/${m.slug}/" tabindex="-1" aria-hidden="true">${fotoMobil(m, '(max-width: 900px) 86vw, 44vw', '', 'lazy', '')}</a>
    </article>`; }).join('\n    ')}
  </div>
</section>`;
