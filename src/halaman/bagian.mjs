// Potongan yang dipakai beberapa halaman: kartu mobil, peta titik Jawa, langkah sewa, FAQ, ulasan, hero halaman dalam.
import { readFileSync } from 'node:fs';
import { ARMADA, FAQ, KELAS, KOTA, KONTAK, LANGKAH, STATISTIK, ULASAN, rupiah } from '../data.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ikon = (id) => `<svg class="ik" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const kelasLabel = (id) => KELAS.find((k) => k.id === id).label;

export function kartuMobil(m, fotoMobil, judulTag = 'h3') {
  return `<article class="kartu-mobil${m.slug === 'isuzu-elf' ? ' kanan-terpotong' : ''}" data-kelas="${m.kelas}" data-kursi="${m.kursi}">
  <a class="kartu-panggung" href="/armada/${m.slug}/" tabindex="-1" aria-hidden="true">${fotoMobil(m, '(max-width: 700px) 86vw, 360px', 'kartu-foto')}</a>
  <div class="kartu-isi">
    <p class="kartu-jenis">${esc(m.jenis)}</p>
    <${judulTag} class="kartu-nama"><a href="/armada/${m.slug}/">${esc(m.nama)}</a></${judulTag}>
    <p class="kartu-trim">${esc(m.trim)}</p>
    <ul class="kartu-spek" aria-label="Spesifikasi">
      <li>${ikon('kursi')}${m.kursi} kursi</li>
      <li>${ikon('gigi')}${esc(m.transmisi.replace(/ \(.*\)/, ''))}</li>
    </ul>
    <div class="kartu-bawah">
      <p class="harga"><strong>${rupiah(m.harga)}</strong><span>/hari</span></p>
      <a class="pill pill-kecil pill-navy" href="/kontak/?mobil=${m.slug}#pesan" data-pesan="${m.slug}">Pesan</a>
    </div>
  </div>
</article>`;
}

// peta titik Pulau Jawa (alat/peta.py): daratan satu path titik bulat, rute antar kota, dan penanda tiap kota
const PETA = JSON.parse(readFileSync(new URL('../peta.json', import.meta.url), 'utf8'));
export function peta(dengan = true) {
  const d = PETA.titik.map(([x, y]) => `M${x} ${y}h0`).join('');
  const T = PETA.tempat;
  // rute melengkung: Jakarta -> Surabaya -> Malang
  const [j, s, m] = [T.jakarta, T.surabaya, T.malang];
  const rute = `M${j[0]} ${j[1]}Q${(j[0] + s[0]) / 2} ${Math.min(j[1], s[1]) - 120} ${s[0]} ${s[1]}Q${s[0] + 40} ${(s[1] + m[1]) / 2} ${m[0]} ${m[1]}`;
  const label = { jakarta: [0, -26, 'middle'], surabaya: [22, -6, 'start'], malang: [-22, 18, 'end'] };
  return `<svg class="peta" viewBox="0 0 ${PETA.lebar} ${PETA.tinggi}" role="img" aria-label="Peta Pulau Jawa: TWH Rent Car di Jakarta, Malang, dan Surabaya">
    <path class="peta-darat" d="${d}"/>
    <path class="peta-rute" d="${rute}" pathLength="1"/>
    ${KOTA.map((k) => { const [x, y] = T[k.slug], [lx, ly, ta] = label[k.slug]; return `<a class="peta-pin" href="/sewa-mobil-${k.slug}/" data-kota="${k.slug}" aria-label="Sewa mobil ${k.nama}, ${k.unit} unit">
      <circle class="peta-denyut" cx="${x}" cy="${y}" r="12"/><circle class="peta-titik" cx="${x}" cy="${y}" r="7"/>
      <text x="${x + lx}" y="${y + ly}" text-anchor="${ta}">${k.nama}${dengan ? `<tspan class="peta-unit" dx="8">${k.unit} unit</tspan>` : ''}</text></a>`; }).join('\n    ')}
  </svg>`;
}

export const langkah = (judulTag = 'h3') => `<ol class="langkah">
  ${LANGKAH.map((l, i) => `<li class="langkah-satu"><span class="langkah-no">${String(i + 1).padStart(2, '0')}</span><${judulTag}>${esc(l.judul)}</${judulTag}><p>${esc(l.teks)}</p></li>`).join('\n  ')}
</ol>`;

export const faq = (judulTag = 'h3') => `<div class="faq" id="faq-daftar">
  ${FAQ.map((f, i) => `<div class="tanya"><${judulTag}><button type="button" aria-expanded="${i === 0}" aria-controls="faq-${i}">${esc(f.t)}${ikon('tambah')}</button></${judulTag}>
    <div class="jawab${i === 0 ? ' buka' : ''}" id="faq-${i}" role="region"><div><p>${esc(f.j)}</p></div></div></div>`).join('\n  ')}
</div>`;

export const ulasan = () => `<div class="ulasan">
  <div class="ulasan-skor">
    <p class="ulasan-angka">${STATISTIK.rating}</p>
    <p class="bintang" aria-label="Rating ${STATISTIK.rating} dari 5">${ikon('bintang').repeat(5)}</p>
    <p class="ulasan-dari">dari ${STATISTIK.ulasan} ulasan di Google</p>
    <a class="tautan-panah" href="${KONTAK.maps}" target="_blank" rel="noopener">Baca ulasannya ${ikon('panah')}</a>
  </div>
  ${ULASAN.map((u) => `<figure class="ulasan-kutip"><blockquote><p>“${esc(u.teks)}”</p></blockquote><figcaption><strong>${esc(u.nama)}</strong><span>Menyewa ${esc(u.mobil)}</span></figcaption></figure>`).join('')}
</div>`;

// hero halaman dalam: judul besar, teks, remah roti; mobil halaman itu di panggung terang di kanan (desktop)
export const heroHalaman = ({ judul, teks, remah, mobil, fotoMobil, tombol = '' }) => `<section id="atas" class="hero hero-halaman" data-bg="#EEF4F1">
  <div class="wrap hero-halaman-isi">
    <div class="hero-halaman-teks">
      ${remah}
      <h1>${esc(judul)}</h1>
      <p class="hero-teks">${esc(teks)}</p>
      ${tombol}
    </div>
    ${mobil ? `<div class="hero-halaman-mobil${mobil.slug === 'isuzu-elf' ? ' kanan-terpotong' : ''}">${fotoMobil(mobil, '(max-width: 900px) 86vw, 46vw', 'hero-halaman-foto', 'awal')}</div>` : ''}
  </div>
</section>`;

export const angka = () => `<dl class="angka">
  <div><dt>Armada</dt><dd><span data-hitung="${STATISTIK.armada}">${STATISTIK.armada}</span>+</dd></div>
  <div><dt>Kota</dt><dd><span data-hitung="${STATISTIK.kota}">${STATISTIK.kota}</span></dd></div>
  <div><dt>Rating Google</dt><dd>${STATISTIK.rating}</dd></div>
  <div><dt>Melayani</dt><dd>24<small> jam</small></dd></div>
</dl>`;

export { esc, ikon, kelasLabel };
