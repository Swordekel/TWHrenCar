// Potongan yang dipakai beberapa halaman: kartu mobil, peta titik Jawa, langkah sewa, FAQ, ulasan, hero halaman dalam.
// Semua menerima c (konteks dari src/rakit.mjs): c.D = data dari isi panel, c.T = teks, c.t = teks siap tulis (isian
// otomatis + escape), c.href = alamat luar yang aman untuk atribut, c.peta = src/peta.json.
import { titikKota, letakLabel, rute } from '../kota-peta.mjs';

export function kartuMobil(c, m, judulTag = 'h3') {
  const { esc, ikon, fotoMobil, rupiah } = c;
  return `<article class="kartu-mobil" data-kelas="${esc(m.kelas)}" data-kursi="${m.kursi}">
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

// peta titik Pulau Jawa (alat/peta.py): daratan satu path titik bulat, rute antar kota, dan penanda tiap kota. Setiap kota
// yang punya titik tergambar: titik dari panel, dari src/peta.json, atau titik bawaan kota di Jawa (src/kota-peta.mjs).
export function peta(c, dengan = true) {
  const { D, esc, peta: PETA } = c;
  const d = PETA.titik.map(([x, y]) => `M${x} ${y}h0`).join('');
  const kota = D.KOTA.map((k) => ({ k, t: titikKota(k, PETA) })).filter((x) => x.t);
  const nama = kota.map(({ k }) => k.nama);
  const daftar = nama.length > 1 ? `${nama.slice(0, -1).join(', ')}, dan ${nama[nama.length - 1]}` : nama.join('');
  return `<svg class="peta" viewBox="0 0 ${PETA.lebar} ${PETA.tinggi}" role="img" aria-label="Peta Pulau Jawa: TWH Rent Car di ${esc(daftar)}">
    <path class="peta-darat" d="${d}"/>
    <path class="peta-rute" d="${rute(kota.map(({ t }) => t.xy))}" pathLength="1"/>
    ${kota.map(({ k, t }) => { const [x, y] = t.xy, [lx, ly, ta] = letakLabel(k); return `<a class="peta-pin" href="/sewa-mobil-${k.slug}/" data-kota="${k.slug}" aria-label="Sewa mobil ${esc(k.nama)}, ${esc(k.unit)} unit">
      <circle class="peta-denyut" cx="${x}" cy="${y}" r="12"/><circle class="peta-titik" cx="${x}" cy="${y}" r="7"/>
      <text x="${x + lx}" y="${y + ly}" text-anchor="${ta}">${esc(k.nama)}${dengan ? `<tspan class="peta-unit" dx="8">${esc(k.unit)} unit</tspan>` : ''}</text></a>`; }).join('\n    ')}
  </svg>`;
}

export const langkah = (c, judulTag = 'h3') => `<ol class="langkah">
  ${c.D.LANGKAH.map((l, i) => `<li class="langkah-satu"><span class="langkah-no">${String(i + 1).padStart(2, '0')}</span><${judulTag}>${c.t(l.judul)}</${judulTag}><p>${c.t(l.teks)}</p></li>`).join('\n  ')}
</ol>`;

export const faq = (c, judulTag = 'h3') => `<div class="faq" id="faq-daftar">
  ${c.D.FAQ.map((f, i) => `<div class="tanya"><${judulTag}><button type="button" aria-expanded="${i === 0}" aria-controls="faq-${i}">${c.t(f.tanya)}${c.ikon('tambah')}</button></${judulTag}>
    <div class="jawab${i === 0 ? ' buka' : ''}" id="faq-${i}" role="region"><div><p>${c.t(f.jawab)}</p></div></div></div>`).join('\n  ')}
</div>`;

export const ulasan = (c) => {
  const { D, esc, ikon, href } = c, A = D.ANGKA;
  return `<div class="ulasan">
  <div class="ulasan-skor">
    <p class="ulasan-angka">${esc(A.rating)}</p>
    <p class="bintang" aria-label="Rating ${esc(A.rating)} dari 5">${ikon('bintang').repeat(5)}</p>
    <p class="ulasan-dari">dari ${esc(A.ulasan)} ulasan di Google</p>
    <a class="tautan-panah" href="${href(D.KONTAK.maps)}" target="_blank" rel="noopener">Baca ulasannya ${ikon('panah')}</a>
  </div>
  ${D.ULASAN.map((u) => `<figure class="ulasan-kutip"><blockquote><p>“${c.t(u.teks)}”</p></blockquote><figcaption><strong>${esc(u.nama)}</strong><span>Menyewa ${esc(u.mobil)}</span></figcaption></figure>`).join('')}
</div>`;
};

// hero halaman dalam: judul besar, teks, remah roti; mobil halaman itu di panggung terang di kanan (desktop)
export const heroHalaman = (c, { judul, teks, mobil, tombol = '' }) => `<section id="atas" class="hero hero-halaman" data-bg="#EEF4F1">
  <div class="wrap hero-halaman-isi">
    <div class="hero-halaman-teks">
      ${c.remah}
      <h1>${c.t(judul)}</h1>
      <p class="hero-teks">${c.t(teks)}</p>
      ${tombol}
    </div>
    ${mobil ? `<div class="hero-halaman-mobil">${c.fotoMobil(mobil, '(max-width: 900px) 86vw, 46vw', 'hero-halaman-foto', 'awal')}</div>` : ''}
  </div>
</section>`;

export const angka = (c) => {
  const A = c.D.ANGKA, esc = c.esc;
  return `<dl class="angka">
  <div><dt>Armada</dt><dd><span data-hitung="${esc(A.armada)}">${esc(A.armada)}</span>+</dd></div>
  <div><dt>Kota</dt><dd><span data-hitung="${esc(A.kota)}">${esc(A.kota)}</span></dd></div>
  <div><dt>Rating Google</dt><dd>${esc(A.rating)}</dd></div>
  <div><dt>Melayani</dt><dd>24<small> jam</small></dd></div>
</dl>`;
};
