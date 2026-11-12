// TWH Rent Car: semua gerak dan isian situs, dipakai semua halaman (dirakit oleh bangun.mjs). Tanpa framework, seperti
// situs ARSWORD lain (Nila Merah, Bengkel Nusantara): tiga kanvas WebGL (panggung mobil di hero beranda, warna latar per
// bagian, gantungan kunci di kaki), rute di kanvas 2D, intro lencana, lembar pesan ke WhatsApp, pemilih penumpang,
// filter armada, daftar syarat, gulir halus, adegan gulir. Setiap bagian hanya berjalan bila elemennya ada.
(() => {
'use strict';

// nomor WhatsApp dan telepon dari halaman (diatur di panel admin, src/rakit.mjs menulisnya di <body>)
const KONFIG = { wa: document.body.dataset.waNomor || '6281290608190', telepon: document.body.dataset.telepon || '0812-9060-8190' };
// pratinjau draf di panel admin (/admin/pratinjau/…, di dalam bingkai): tanpa intro, posisi gulir bertahan saat dimuat
// ulang setelah draf tersimpan, dan panel bisa meminta gulir ke satu bagian (postMessage { ke: selektor })
const PRATINJAU = location.pathname.startsWith('/admin/pratinjau');

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const coarse = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
const hemat = !!(navigator.connection && navigator.connection.saveData);
let kualitas = 1;
document.documentElement.classList.add('siap');
const tahun = $('#tahun'); if (tahun) tahun.textContent = String(new Date().getFullYear());
// loop animasi tidur saat tidak ada yang perlu digambar; dibangunkan oleh gulir, kursor, sentuhan, tombol, ukuran layar
let berjalan = false, tLalu = 0;
// keadaan bersama yang dipakai bagian-bagian di bawah (dideklarasikan di sini supaya bisa dipanggil sejak awal)
let sm = null, B = null, S = null, P = null, srPending = 0, ukurPending = 0, menuBuka = false;
function bangun() { if (!berjalan && !document.hidden) { berjalan = true; tLalu = 0; requestAnimationFrame(loop); } }
['scroll', 'wheel', 'pointermove', 'pointerdown', 'pointerup', 'touchstart', 'touchmove', 'keydown', 'resize'].forEach((ev) => addEventListener(ev, bangun, { passive: true }));
document.addEventListener('visibilitychange', bangun);
const json = (id) => { const el = document.getElementById(id); try { return el ? JSON.parse(el.textContent) : null; } catch (e) { return null; } };
const ARMADA = json('armada-data') || [];
const mobil = (slug) => ARMADA.find((m) => m.slug === slug);
const rupiah = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID');

// ---------- WhatsApp ----------
const waUrl = (msg) => `https://wa.me/${KONFIG.wa}?text=${encodeURIComponent(msg)}`;
const SALAM = 'Halo TWH Rent Car, ';
const PESAN = {
  umum: () => SALAM + 'saya ingin tanya sewa mobil.',
  layanan: (a) => `${SALAM}saya ingin tanya ${a.dataset.layanan}. Untuk tanggal: `,
};
function setWa() { $$('[data-wa]').forEach((a) => { const f = PESAN[a.dataset.wa]; if (f) a.href = waUrl(f(a)); }); }
setWa();

if (PRATINJAU) {
  const kunci = 'twh-pv-gulir:' + location.pathname;
  let y = 0; try { y = +sessionStorage.getItem(kunci) || 0; } catch (e) { /* mode privat */ }
  if (y) { history.scrollRestoration = 'manual'; addEventListener('load', () => scrollTo(0, y), { once: true }); }
  addEventListener('pagehide', () => { try { sessionStorage.setItem(kunci, String(Math.round(scrollY))); } catch (e) { /* mode privat */ } });
  addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || typeof e.data.ke !== 'string') return;
    let el = null; try { el = document.querySelector(e.data.ke); } catch (err) { /* selektor salah */ }
    if (el) scrollTo(0, Math.max(0, el.getBoundingClientRect().top + scrollY - 90));
  });
}

// ---------- intro beranda (sekali per sesi) ----------
// Lencana TWH muncul di layar navy, garis segi enam mint tergambar mengelilinginya, petir di lencana berkilat. Lalu
// layar navy menyusut menjadi segi enam yang terbang ke tanda TWH di kepala, membuka panggung mobil. Sekitar 2,4 detik;
// klik, gulir, atau tombol apa pun mempercepatnya.
let mulaiHero = () => {};
(function intro() {
  const el = $('#intro'); if (!el) return;
  const root = document.documentElement;
  let parkir = false, beres = false;
  const selesai = () => {
    if (beres) return; beres = true;
    el.remove(); root.classList.remove('intro-jalan', 'intro-tahan');
    try { sessionStorage.setItem('twh-intro', '1'); } catch (e) { /* mode privat */ }
  };
  let sudah = false; try { sudah = sessionStorage.getItem('twh-intro') === '1'; } catch (e) { /* mode privat */ }
  if (reduced || hemat || sudah || PRATINJAU || !el.animate) { selesai(); return; }
  root.classList.add('intro-jalan', 'intro-tahan');
  const darurat = setTimeout(selesai, 6000);
  const KELUAR = 'cubic-bezier(.16,1,.3,1)', lapis = $('.intro-lapis', el), tanda = $('.intro-tanda', el);
  $('.intro-lencana', el).animate([{ opacity: 0, transform: 'scale(.84)' }, { opacity: 1, transform: 'none' }], { duration: 900, easing: KELUAR, fill: 'forwards' });
  $('.intro-garis polygon', el).animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 1100, delay: 150, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'forwards' });
  $('.intro-kilat', el).animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 0.1, offset: 0.3 }, { opacity: 0.9, offset: 0.45 }, { opacity: 0 }], { duration: 650, delay: 950, fill: 'forwards' });
  const tParkir = setTimeout(parkirkan, 1650);
  // segi enam runcing atas-bawah (rasio 1,1) berpusat di (cx, cy) dengan lebar w, sebagai clip-path polygon piksel
  const heks = (cx, cy, w) => { const h = w * 1.1; return `polygon(${cx}px ${cy - h / 2}px, ${cx + w / 2}px ${cy - h / 4}px, ${cx + w / 2}px ${cy + h / 4}px, ${cx}px ${cy + h / 2}px, ${cx - w / 2}px ${cy + h / 4}px, ${cx - w / 2}px ${cy - h / 4}px)`; };
  function parkirkan() {
    if (parkir) return; parkir = true; clearTimeout(tParkir);
    const logo = $('.kepala .logo-tanda').getBoundingClientRect(), t = tanda.getBoundingClientRect();
    const lx = logo.left + logo.width / 2, ly = logo.top + logo.height / 2, tx = t.left + t.width / 2, ty = t.top + t.height / 2;
    const besar = Math.hypot(innerWidth, innerHeight) * 2.2;
    const opsi = { duration: 950, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' };
    lapis.animate([{ clipPath: heks(lx, ly, besar) }, { clipPath: heks(lx, ly, logo.width) }], opsi);
    tanda.animate([{ transform: 'none' }, { transform: `translate(${lx - tx}px, ${ly - ty}px) scale(${logo.width / t.width})` }], opsi);
    setTimeout(() => { root.classList.remove('intro-tahan'); mulaiHero(); }, 380);
    setTimeout(() => { el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }); }, 900);
    setTimeout(() => { clearTimeout(darurat); selesai(); }, 1140);
  }
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((ev) => addEventListener(ev, parkirkan, { once: true, passive: true }));
})();

// ---------- chips: satu pilihan per grup ----------
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-chips] button'); if (!b) return;
  const grup = b.closest('[data-chips]');
  $$('button', grup).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  grup.dispatchEvent(new CustomEvent('pilih', { detail: b, bubbles: true }));
});

// ---------- formulir pesan (lembar di semua halaman dan formulir di /kontak/) ----------
// Tanggal memakai WIB (UTC+7). Lama sewa = selisih hari (minimal 1). Perkiraan harga = lama x harga per hari; biaya
// antar dan harga akhir dikonfirmasi lewat WhatsApp. Tidak ada yang dikirim ke server: pesannya dibuka di WhatsApp.
const HARI = 864e5;
const wib = () => new Date(Date.now() + 7 * 3600e3);
const iso = (d) => d.toISOString().slice(0, 10);
const tanggalTeks = (v) => { const d = new Date(v + 'T00:00:00'); return isNaN(d) ? v : d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); };
const lamaHari = (a, b) => { const x = new Date(a + 'T00:00:00'), y = new Date(b + 'T00:00:00'); return isNaN(x) || isNaN(y) ? 0 : Math.round((y - x) / HARI); };
const FORM = new Map();
function siapkanForm(form) {
  const fld = (n) => form.elements[n];
  const chip = (grup) => $(`[data-chips="${grup}"] [aria-pressed="true"]`, form);
  const alamatEl = $('[data-alamat]', form), estEl = $('[data-estimasi]', form), catatan = $('[data-catatan]', form);
  const besok = new Date(wib().getTime() + HARI);
  fld('mulai').min = iso(wib()); fld('selesai').min = iso(wib());
  if (!fld('mulai').value) fld('mulai').value = iso(besok);
  if (!fld('selesai').value) fld('selesai').value = iso(new Date(besok.getTime() + HARI));
  let galat = {}, terkirim = false;
  const perluAlamat = () => (chip('tempat') || {}).dataset?.nilai !== 'Garasi kami';
  function estimasi() {
    const m = mobil(fld('mobil').value), n = lamaHari(fld('mulai').value, fld('selesai').value);
    if (!m || n < 1) { estEl.innerHTML = n < 1 && fld('selesai').value && fld('mulai').value ? '' : ''; return; }
    estEl.innerHTML = `${n} hari × ${rupiah(m.harga)} = <strong>${rupiah(n * m.harga)}</strong><small>Perkiraan harga sewa ${m.nama}. Biaya antar dan harga akhir dikonfirmasi lewat WhatsApp.</small>`;
  }
  function tampil() {
    ['nama', 'mulai', 'selesai', 'alamat'].forEach((k) => {
      const el = fld(k), sp = el.parentElement.querySelector('.salah');
      if (galat[k]) { el.setAttribute('aria-invalid', 'true'); sp.textContent = galat[k]; sp.hidden = false; } else { el.removeAttribute('aria-invalid'); sp.hidden = true; }
    });
    alamatEl.hidden = !perluAlamat();
    const ada = Object.keys(galat).some((k) => galat[k]);
    catatan.className = 'form-catatan' + (ada ? ' galat' : terkirim ? ' terkirim' : '');
    catatan.textContent = ada ? 'Periksa kolom yang ditandai merah.'
      : terkirim ? `WhatsApp terbuka di tab baru. Tidak terbuka? Salin pesan, lalu kirim ke ${KONFIG.telepon}.`
      : 'Tidak ada data yang disimpan di server. Pesan terbuka di WhatsApp dan Anda yang mengirimnya.';
    estimasi();
  }
  function pesan() {
    const v = (n) => fld(n).value.trim(), m = mobil(v('mobil')), n = lamaHari(v('mulai'), v('selesai'));
    const tempat = (chip('tempat') || {}).dataset?.nilai || 'Garasi kami';
    return [SALAM + 'saya ingin pesan mobil.', '',
      `Mobil: ${m ? `${m.nama} ${m.trim} (${rupiah(m.harga)}/hari)` : 'belum tahu, mohon sarannya'}`,
      `Kota: ${(chip('kota') || {}).dataset?.nilai || 'Jakarta'}`,
      `Ambil: ${tanggalTeks(v('mulai'))}, pukul ${fld('jam').value} WIB`,
      `Kembali: ${tanggalTeks(v('selesai'))}`,
      `Lama: ${n} hari${m && n > 0 ? ` (perkiraan ${rupiah(n * m.harga)})` : ''}`,
      `Diserahkan di: ${tempat}${tempat !== 'Garasi kami' && v('alamat') ? `, ${v('alamat')}` : ''}`,
      `Nama: ${v('nama')}`, ...(v('catatan') ? [`Catatan: ${v('catatan')}`] : []), '',
      'Mohon info ketersediaannya. Terima kasih.'].join('\n');
  }
  function periksa() {
    const er = {};
    if (!fld('nama').value.trim()) er.nama = 'Wajib diisi';
    if (!fld('mulai').value) er.mulai = 'Pilih tanggal';
    if (!fld('selesai').value) er.selesai = 'Pilih tanggal';
    else if (fld('mulai').value && lamaHari(fld('mulai').value, fld('selesai').value) < 1) er.selesai = 'Setelah tanggal ambil';
    if (perluAlamat() && !fld('alamat').value.trim()) er.alamat = 'Tulis alamat, hotel, atau bandara';
    galat = er;
    if (Object.keys(er).length) { terkirim = false; tampil(); fld(Object.keys(er)[0]).focus(); return false; }
    return true;
  }
  form.addEventListener('pilih', () => { galat.alamat = ''; terkirim = false; tampil(); });
  form.addEventListener('input', (e) => {
    const nm = e.target.name; if (!nm) return;
    galat[nm] = ''; terkirim = false;
    // tanggal kembali ikut maju bila tanggal ambil dipindah melewatinya
    if (nm === 'mulai' && fld('mulai').value && lamaHari(fld('mulai').value, fld('selesai').value) < 1) {
      fld('selesai').value = iso(new Date(new Date(fld('mulai').value + 'T00:00:00Z').getTime() + HARI)); galat.selesai = '';
    }
    tampil();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault(); if (!periksa()) return;
    window.open(waUrl(pesan()), '_blank', 'noopener');
    terkirim = true; tampil();
  });
  const salin = $('[data-salin]', form), labelSalin = salin.textContent;
  salin.addEventListener('click', () => {
    (navigator.clipboard ? navigator.clipboard.writeText(pesan()) : Promise.reject()).then(() => {
      salin.textContent = 'Tersalin'; setTimeout(() => { salin.textContent = labelSalin; }, 1800);
    }).catch(() => {});
  });
  // isi awal dari tombol atau alamat: { mobil, kota, mulai, selesai }
  function isi(o = {}) {
    if (o.mobil !== undefined && (o.mobil === '' || mobil(o.mobil))) fld('mobil').value = o.mobil;
    if (o.kota) $$('[data-chips="kota"] button', form).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.nilai === o.kota)));
    if (o.mulai) fld('mulai').value = o.mulai;
    if (o.selesai) fld('selesai').value = o.selesai;
    galat = {}; terkirim = false; tampil();
  }
  tampil();
  FORM.set(form.id, { isi, fld });
}
$$('[data-form-pesan]').forEach(siapkanForm);

const lembar = $('#lembar-pesan'), formKontak = FORM.get('pesan-kontak');
function bukaLembar(o) {
  if (formKontak) { // di /kontak/: isi formulir di halaman dan gulir ke sana
    formKontak.isi(o); pergiKe('pesan'); setTimeout(() => formKontak.fld(o.mobil ? 'mulai' : 'mobil').focus({ preventScroll: true }), 500); return;
  }
  if (!lembar || !lembar.showModal) { location.href = '/kontak/' + (o.mobil ? `?mobil=${o.mobil}` : '') + '#pesan'; return; }
  FORM.get('lembar-form').isi(o);
  setMenu(false);
  lembar.classList.remove('tutup'); lembar.showModal();
  document.documentElement.classList.add('lembar-terbuka');
}
function tutupLembar() {
  if (!lembar || !lembar.open) return;
  lembar.classList.add('tutup');
  setTimeout(() => { lembar.close(); lembar.classList.remove('tutup'); }, reduced ? 0 : 200);
}
if (lembar) {
  lembar.addEventListener('close', () => document.documentElement.classList.remove('lembar-terbuka'));
  lembar.addEventListener('cancel', (e) => { e.preventDefault(); tutupLembar(); });
  lembar.addEventListener('click', (e) => { if (e.target === lembar || e.target.closest('[data-tutup]')) tutupLembar(); });
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-pesan]'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
  e.preventDefault();
  bukaLembar({ mobil: a.dataset.pesan || undefined, kota: a.dataset.kota });
});
// /kontak/?mobil=...&kota=...
if (formKontak) {
  const q = new URLSearchParams(location.search);
  if (q.get('mobil') || q.get('kota')) formKontak.isi({ mobil: q.get('mobil') || undefined, kota: q.get('kota') || undefined });
}
// bilah cek ketersediaan di beranda: buka lembar pesan berisi pilihan bilah
const cek = $('#cek');
if (cek) {
  const besok = new Date(wib().getTime() + HARI);
  cek.elements.mulai.min = cek.elements.selesai.min = iso(wib());
  cek.elements.mulai.value = iso(besok); cek.elements.selesai.value = iso(new Date(besok.getTime() + HARI));
  cek.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = (n) => cek.elements[n].value;
    bukaLembar({ kota: v('kota'), mulai: v('mulai'), selesai: lamaHari(v('mulai'), v('selesai')) >= 1 ? v('selesai') : undefined, mobil: v('mobil') });
  });
}

// ---------- armada: filter jenis dan pemilih penumpang ----------
const grid = $('#grid-mobil');
if (grid) {
  const kartu = $$('.kartu-mobil', grid), kosong = $('#grid-kosong');
  let kelas = 'semua', minKursi = 1;
  const saring = () => {
    let ada = 0;
    kartu.forEach((k) => {
      const ok = (kelas === 'semua' || k.dataset.kelas === kelas) && +k.dataset.kursi >= minKursi;
      const tadi = !k.classList.contains('tersaring');
      k.classList.toggle('tersaring', !ok);
      if (ok && !tadi && !reduced) { k.classList.remove('muncul'); void k.offsetWidth; k.classList.add('muncul'); }
      if (ok) ada++;
    });
    kosong.hidden = ada > 0;
    jadwalUkur();
  };
  const fk = $('[data-chips="kelas"]');
  if (fk) fk.addEventListener('pilih', (e) => { kelas = e.detail.dataset.kelas; saring(); });
  const geser = $('#penumpang-geser');
  if (geser) {
    const out = $('#penumpang-n'), saran = $('#penumpang-saran'), kursiEl = $('#penumpang-kursi');
    const KELAS_KURSI = [...new Set(ARMADA.map((m) => m.kursi))].sort((a, b) => a - b);
    const tautan = (m) => `<a href="/armada/${m.slug}/">${m.nama}</a>`;
    let kapasitasTadi = 0;
    const perbaruiPenumpang = () => {
      const n = +geser.value; out.value = out.textContent = String(n);
      const kap = KELAS_KURSI.find((k) => k >= n) || KELAS_KURSI[KELAS_KURSI.length - 1];
      const pas = ARMADA.filter((m) => m.kursi === kap);
      let t;
      const alphard = mobil('toyota-alphard');
      if (n <= 7) t = `Muat di satu mobil tujuh kursi: ${pas.slice(0, 3).map(tautan).join(', ')}${alphard ? `, atau ${tautan(alphard)} untuk yang paling nyaman` : ''}.`;
      else if (kap === 15) t = `${tautan(pas[0])} muat 15 orang. Bisa juga dua mobil tujuh kursi.`;
      else t = `${pas.map(tautan).join(' atau ')} muat ${kap} orang${n > 15 && kap > 19 ? `, atau gabungan beberapa minibus` : ''}.`;
      saran.innerHTML = t;
      // kursi kendaraan yang disarankan, terisi sebanyak penumpang
      if (kap !== kapasitasTadi) { kursiEl.innerHTML = '<i></i>'.repeat(kap); kapasitasTadi = kap; }
      $$('i', kursiEl).forEach((s, i) => s.classList.toggle('isi', i < n));
      minKursi = n; saring();
    };
    geser.addEventListener('input', perbaruiPenumpang);
    perbaruiPenumpang();
  }
}

// ---------- daftar syarat: centang dokumen yang sudah siap ----------
const syarat = $('#syarat-daftar');
if (syarat) {
  const tombol = $$('.syarat-cek', syarat), status = $('#syarat-status');
  const hitung = () => {
    const n = tombol.filter((b) => b.getAttribute('aria-pressed') === 'true').length;
    status.innerHTML = n === tombol.length ? `Lengkap. <a class="tautan-polos" data-pesan href="/kontak/#pesan">Pesan mobil sekarang</a> dan kirim fotonya lewat WhatsApp.`
      : n ? `${n} dari ${tombol.length} sudah siap.` : 'Centang yang sudah Anda siapkan.';
  };
  tombol.forEach((b) => b.addEventListener('click', () => { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); hitung(); }));
}

// ---------- FAQ: satu jawaban terbuka ----------
$$('#faq-daftar .tanya button').forEach((b) => b.addEventListener('click', () => {
  const buka = b.getAttribute('aria-expanded') !== 'true';
  $$('#faq-daftar .tanya button').forEach((x) => {
    const on = x === b && buka; x.setAttribute('aria-expanded', String(on));
    document.getElementById(x.getAttribute('aria-controls')).classList.toggle('buka', on);
  });
}));

// ---------- angka menghitung naik, peta, muncul saat terlihat ----------
const lihat = (el, f, opsi = { threshold: 0.4 }) => {
  if (!('IntersectionObserver' in window)) { f(el); return; }
  const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); f(e.target); } }), opsi);
  io.observe(el);
};
if (!reduced) $$('[data-hitung]').forEach((el) => {
  if (el.getBoundingClientRect().top < innerHeight) return;
  const akhir = +el.dataset.hitung; el.textContent = '0';
  lihat(el, () => { const t0 = performance.now(); (function langkah(now) { const k = clamp((now - t0) / 1300, 0, 1); el.textContent = String(Math.round(akhir * (1 - Math.pow(1 - k, 4)))); if (k < 1) requestAnimationFrame(langkah); })(t0); }, { threshold: 0.6 });
});
$$('.peta').forEach((p) => lihat(p, () => p.classList.add('peta-tampil'), { threshold: 0.3 }));
// pin peta dan kartu kota saling menyorot
$$('[data-kota]').forEach((el) => {
  const k = el.dataset.kota; if (!k || !el.closest('.kota-bagian')) return;
  const sama = () => $$(`.kota-bagian [data-kota="${k}"]`);
  el.addEventListener('pointerenter', () => sama().forEach((x) => x.classList.add('aktif')));
  el.addEventListener('pointerleave', () => sama().forEach((x) => x.classList.remove('aktif')));
});
if (!reduced && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); e.target.classList.add('tampak'); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.grid-mobil .kartu-mobil, .layanan-kartu, .langkah-satu, .kota-kartu, .layanan-baris, .syarat li, .ulasan>*, .spek, .mobil-cerita, .bayar-daftar li').forEach((el, i) => {
    if (el.getBoundingClientRect().top < innerHeight * 0.92) return;
    el.setAttribute('data-muncul', ''); el.style.transitionDelay = `${(i % 4) * 70}ms`; io.observe(el);
  });
}

// ---------- peta Google: iframe baru dibuat saat pengunjung menekan "Tampilkan peta" ----------
const petaG = $('#peta'), tombolPeta = $('#tampil-peta');
if (petaG && tombolPeta) tombolPeta.addEventListener('click', () => {
  const f = document.createElement('iframe');
  f.title = 'Peta garasi TWH Rent Car di Pengadegan, Pancoran, Jakarta Selatan'; f.src = petaG.dataset.src; f.referrerPolicy = 'no-referrer-when-downgrade'; f.allowFullscreen = true; f.loading = 'lazy';
  petaG.append(f); petaG.classList.add('aktif'); f.focus();
});

// ---------- warna bilah status (Safari iPhone: latar html; HP lain: theme-color) ----------
const TERANG = '#EEF4F1', GELAP = '#0D2331', metaTema = $('meta[name="theme-color"]'); let warnaAtas = '';
function setWarnaAtas(hex) {
  if (hex === warnaAtas) return; warnaAtas = hex;
  document.documentElement.style.backgroundColor = hex; if (metaTema) metaTema.content = hex;
}

// ---------- kepala, menu, navigasi ----------
const kepala = $('#kepala'), burger = $('#burger'), menu = $('#menu'), fab = $('#fab');
let kepalaTerang = null, kepalaDiHero = null, lewat = false;
menu.hidden = false; menu.inert = true;
function setMenu(on) {
  if (on === menuBuka) return;
  menuBuka = on;
  // lapisan menu membesar sebagai segi enam dari tengah tombol menu
  const r = burger.getBoundingClientRect();
  menu.style.setProperty('--mx', `${r.left + r.width / 2}px`); menu.style.setProperty('--my', `${r.top + r.height / 2}px`);
  $('.menu-latar', menu).style.setProperty('--mx', `${r.left + r.width / 2}px`); $('.menu-latar', menu).style.setProperty('--my', `${r.top + r.height / 2}px`);
  menu.classList.toggle('buka', on); menu.inert = !on;
  document.documentElement.classList.toggle('menu-terbuka', on);
  burger.setAttribute('aria-expanded', String(on)); burger.setAttribute('aria-label', on ? 'Tutup menu' : 'Buka menu');
  kepala.classList.toggle('terang', kepalaTerang && !menuBuka);
  if (on) setWarnaAtas(GELAP); else perbarui();
}
burger.addEventListener('click', () => setMenu(!menuBuka));
if (window.matchMedia) matchMedia('(min-width: 1100px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuBuka) { setMenu(false); burger.focus(); } });
function pergiKe(id) {
  const el = document.getElementById(id); setMenu(false); if (!el) return;
  scrollToY(el.getBoundingClientRect().top + scrollY - (id === 'atas' ? 0 : 96));
}
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const id = a.getAttribute('href').slice(1); if (id && document.getElementById(id)) { e.preventDefault(); pergiKe(id); } }));
kepala.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; const r = kepala.getBoundingClientRect(); kepala.style.setProperty('--kx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%'); }, { passive: true });

// ---------- gulir halus (mouse/trackpad saja) ----------
if (!reduced && !coarse) {
  sm = { cur: scrollY, tgt: scrollY, on: false };
  addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.defaultPrevented) return;
    const cl = document.documentElement.classList;
    if (cl.contains('intro-jalan') || menuBuka) { e.preventDefault(); return; }
    if (cl.contains('lembar-terbuka')) return;
    const t = e.target; if (t && t.closest && t.closest('textarea,select,iframe,.menu,.tabel-bungkus,[data-native-scroll]')) return;
    e.preventDefault(); if (!sm.on) { sm.cur = scrollY; sm.tgt = scrollY; }
    const max = document.documentElement.scrollHeight - innerHeight;
    sm.tgt = clamp(sm.tgt + (e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY), 0, max); sm.on = true;
  }, { passive: false });
  addEventListener('scroll', () => { if (!sm.on) sm.cur = sm.tgt = scrollY; }, { passive: true });
}
function tickSmooth(dt) {
  if (!sm || !sm.on) return;
  sm.cur += (sm.tgt - sm.cur) * (1 - Math.pow(1 - 0.085, dt / 16.667));
  if (Math.abs(sm.tgt - sm.cur) < 0.4) { sm.cur = sm.tgt; sm.on = false; }
  scrollTo(0, sm.cur);
}
function scrollToY(y) {
  y = clamp(y, 0, document.documentElement.scrollHeight - innerHeight);
  if (sm) { sm.cur = scrollY; sm.tgt = y; sm.on = true; bangun(); } else scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
}

// ---------- kalimat: pecah jadi kata ----------
$$('.kata-teks').forEach((p) => {
  const kata = p.textContent.trim().split(/\s+/); p.textContent = '';
  kata.forEach((w) => { const s = document.createElement('span'); s.dataset.w = ''; s.textContent = w + ' '; p.append(s); });
});

// ---------- rute di belakang kalimat (kanvas 2D) ----------
// Jalan berliku dari garasi (segi enam navy di kiri bawah) ke tujuan (pin mint di kanan atas): marka putus-putus tipis
// sepanjang jalan, lalu garis rute yang terisi bersama kata-kata yang menyala, dengan mobil kecil di ujungnya. Hanya
// digambar ulang bila kemajuannya berubah.
const ruteEl = $('#rute-kanvas');
const RT = ruteEl ? { c: ruteEl, ctx: ruteEl.getContext('2d'), p: reduced ? 1 : 0, digambar: -1, w: 0, h: 0, dpr: 1, titik: null } : null;
function ruteTitik(w, h) {
  // kurva dalam pecahan layar, disampel jadi 240 titik dengan panjang kumulatif
  const P = [[0.06, 0.86], [0.2, 0.92], [0.3, 0.7], [0.18, 0.52], [0.3, 0.3], [0.52, 0.16], [0.72, 0.3], [0.86, 0.5], [0.8, 0.72], [0.94, 0.84]];
  const cr = (a, b, c, d, t) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  const out = []; const N = 24;
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], d = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < N; k++) { const t = k / N; out.push([cr(a[0], b[0], c[0], d[0], t) * w, cr(a[1], b[1], c[1], d[1], t) * h]); }
  }
  out.push([P[P.length - 1][0] * w, P[P.length - 1][1] * h]);
  let L = 0; const pj = [0]; for (let i = 1; i < out.length; i++) { L += Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]); pj.push(L); }
  return { pt: out, pj, L };
}
function drawRute() {
  if (!RT) return;
  const r = RT.c.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  if (RT.w !== r.width || RT.h !== r.height || RT.dpr !== dpr) {
    RT.w = r.width; RT.h = r.height; RT.dpr = dpr; RT.c.width = Math.round(r.width * dpr); RT.c.height = Math.round(r.height * dpr);
    RT.titik = ruteTitik(r.width, r.height); RT.digambar = -1;
  }
  const p = Math.round(RT.p * 600) / 600; if (p === RT.digambar) return; RT.digambar = p;
  const { ctx } = RT, { pt, pj, L } = RT.titik;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, RT.w, RT.h);
  const jalur = (sampai) => { ctx.beginPath(); ctx.moveTo(pt[0][0], pt[0][1]); for (let i = 1; i < pt.length && pj[i] <= sampai; i++) ctx.lineTo(pt[i][0], pt[i][1]); };
  // badan jalan dan marka
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  jalur(L); ctx.strokeStyle = 'rgba(15,36,51,.045)'; ctx.lineWidth = 34; ctx.stroke();
  ctx.setLineDash([10, 14]); jalur(L); ctx.strokeStyle = 'rgba(15,36,51,.16)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
  // rute yang sudah ditempuh
  const s = p * L; let i = 1; while (i < pt.length - 1 && pj[i] < s) i++;
  const f = (s - pj[i - 1]) / ((pj[i] - pj[i - 1]) || 1), x = pt[i - 1][0] + (pt[i][0] - pt[i - 1][0]) * f, y = pt[i - 1][1] + (pt[i][1] - pt[i - 1][1]) * f;
  if (s > 1) { jalur(s); ctx.lineTo(x, y); ctx.strokeStyle = 'rgba(34,111,92,.5)'; ctx.lineWidth = 4; ctx.stroke(); }
  // garasi (segi enam) dan tujuan (pin)
  const heks = (cx, cy, rr, isi) => { ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + k * Math.PI / 3; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 1.05); } ctx.closePath(); ctx.fillStyle = isi; ctx.fill(); };
  heks(pt[0][0], pt[0][1], 13, '#1B4766');
  const [ex, ey] = pt[pt.length - 1];
  ctx.beginPath(); ctx.arc(ex, ey - 16, 11, Math.PI * 0.85, Math.PI * 2.15); ctx.lineTo(ex, ey); ctx.closePath(); ctx.fillStyle = p > 0.995 ? '#226F5C' : 'rgba(34,111,92,.35)'; ctx.fill();
  ctx.beginPath(); ctx.arc(ex, ey - 16, 4, 0, Math.PI * 2); ctx.fillStyle = '#EEF4F1'; ctx.fill();
  // mobil kecil (kapsul mint) di ujung rute, menghadap arah jalan
  if (s > 1 && p < 0.995) {
    const j = Math.min(i, pt.length - 1), a = Math.atan2(pt[j][1] - pt[j - 1][1], pt[j][0] - pt[j - 1][0]);
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = 'rgba(15,36,51,.18)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-13, -6, 28, 15, 6) : ctx.rect(-13, -6, 28, 15); ctx.fill();
    ctx.fillStyle = '#90D0BF'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-14, -8, 28, 16, 6) : ctx.rect(-14, -8, 28, 16); ctx.fill();
    ctx.fillStyle = '#0F2433'; ctx.fillRect(2, -6, 6, 12); ctx.fillStyle = '#FFF6D8'; ctx.fillRect(12, -6, 2, 4); ctx.fillRect(12, 2, 2, 4);
    ctx.restore();
  }
}

// ---------- adegan gulir ----------
// Posisi bagian diukur sekali (ukur) dan setiap kali ukuran halaman berubah; saat gulir, perbarui hanya memakai scrollY
// dan angka tersimpan lalu menulis gaya yang berubah saja.
const hero = $('.hero'), heroIsi = $('.hero-isi'), heroPilih = $('.hero-pilih');
const L = { gelap: $$('section.gelap, .armada-geser, .kaki'), words: $$('[data-words]'), h: $$('[data-hscroll]'), bg: $$('section[data-bg]'), jalan: $$('[data-jalan]') };
const TL = { hh: 800, words: [], h: [], bg: [], gelap: [], jalan: [], kaki: null };
let heroTulis = '', lastY = scrollY, laju = 0;
const atasAbs = (el) => el.getBoundingClientRect().top + scrollY;
const tulisGaya = (o, prop, nilai) => { if (o[prop] !== nilai) { o[prop] = nilai; o.el.style[prop] = nilai; } };
function ukur() {
  ukurPending = 0;
  const ih = innerHeight;
  L.h.forEach((sec) => { // geser samping: tinggi bagian = panjang jalur + satu layar
    const tr = $('[data-track]', sec); if (!tr) return;
    const need = Math.max(0, tr.scrollWidth - innerWidth) + ih;
    if (Math.abs(sec.offsetHeight - need) > 2) sec.style.height = need + 'px';
  });
  TL.hh = (hero && hero.offsetHeight) || 800;
  if (B) { B.cw = B.c.clientWidth; B.ch = B.c.clientHeight; bangun(); }
  TL.words = L.words.map((el) => ({ el, top: atasAbs(el), tot: el.offsetHeight - ih, ws: $$('[data-w]', el).map((w) => ({ el: w, opacity: '' })), rute: !!(ruteEl && el.contains(ruteEl)) }));
  TL.h = L.h.map((sec) => { const tr = $('[data-track]', sec); return tr ? { el: tr, bar: $('[data-hbar]', sec), top: atasAbs(sec), h: sec.offsetHeight, dist: Math.max(0, tr.scrollWidth - innerWidth), transform: '', barT: '' } : null; }).filter(Boolean);
  TL.bg = L.bg.map((el) => ({ top: atasAbs(el), hex: el.dataset.bg }));
  TL.gelap = L.gelap.map((el) => { const t = atasAbs(el); return { top: t, bot: t + el.offsetHeight }; });
  TL.jalan = L.jalan.map((el) => ({ top: atasAbs(el), h: el.offsetHeight, isi: $('[data-jalan-isi]', el), t: '' }));
  const aj = $('#ajakan'); TL.kaki = aj ? { top: atasAbs(aj), h: aj.offsetHeight, w: aj.offsetWidth } : null;
  if (S) S.ukurUlang = true;
  perbarui();
}
function jadwalUkur() { if (!ukurPending) ukurPending = requestAnimationFrame(ukur); }
function onScroll() { if (!srPending) srPending = requestAnimationFrame(perbarui); }
function perbarui() {
  srPending = 0;
  const y = scrollY, ih = innerHeight, hh = TL.hh, g = Math.min(1, y / hh);
  laju += (y - lastY); lastY = y;
  if (!reduced) {
    // hero beranda: teks naik dan memudar, panggung meredup sedikit
    const tulis = `${Math.min(y, hh * 1.2).toFixed(0)}`;
    if (tulis !== heroTulis && heroIsi && heroPilih) {
      heroTulis = tulis; const yy = Math.min(y, hh * 1.2);
      heroIsi.style.transform = `translate3d(0,${(-yy * 0.18).toFixed(1)}px,0)`; heroIsi.style.opacity = String(Math.max(0, 1 - yy / (hh * 0.5)));
      heroPilih.style.opacity = String(Math.max(0, 1 - yy / (hh * 0.3)));
      if (S) { S.gulir = g; S.perlu = true; }
    }
    TL.words.forEach((w) => {
      const top = w.top - y; if (top > ih * 1.5 || top + w.tot + ih < -ih * 0.5) return;
      const p = clamp(-top / (w.tot || 1), 0, 1), n = w.ws.length;
      w.ws.forEach((s, i) => tulisGaya(s, 'opacity', (i + 1) / n <= p * 1.15 + 0.03 ? '1' : '.14'));
      if (w.rute && RT) RT.p = clamp((ih * 0.2 - top) / (w.tot * 0.9 + ih * 0.2 || 1), 0, 1);
    });
  }
  TL.h.forEach((o) => {
    const top = o.top - y; if (top > ih || top + o.h < 0) return;
    const p = clamp(-top / ((o.h - ih) || 1), 0, 1);
    tulisGaya(o, 'transform', `translate3d(${(-p * o.dist).toFixed(1)}px,0,0)`);
    if (o.bar) { const t = `scaleX(${p.toFixed(3)})`; if (o.barT !== t) { o.barT = t; o.bar.style.transform = t; } }
  });
  TL.jalan.forEach((o) => {
    const top = o.top - y; if (top > ih || top + o.h < 0) return;
    const p = reduced ? 1 : clamp((ih * 0.85 - top) / (o.h * 0.9), 0, 1), t = `scaleX(${p.toFixed(3)})`;
    if (o.t !== t) { o.t = t; o.isi.style.transform = t; }
  });
  let bgHex = null; for (const o of TL.bg) { if (o.top - y < ih * 0.42) bgHex = o.hex; else break; }
  if (bgHex) setBg(bgHex);
  if (!menuBuka) {
    let atas = TERANG;
    for (const o of TL.bg) { if (o.top <= y + 2) atas = o.hex; else break; }
    if (TL.kaki && y + 2 >= TL.kaki.top) atas = GELAP;
    setWarnaAtas(atas);
  }
  // kaca kepala: gelap di atas bagian gelap dan kaki, terang di tempat lain
  const yk = y + 42, terang = !TL.gelap.some((o) => o.top <= yk && o.bot > yk);
  const diHero = y + 76 < Math.min(hh, 400);
  if (diHero !== kepalaDiHero) { kepalaDiHero = diHero; kepala.classList.toggle('di-hero', diHero); }
  if (terang !== kepalaTerang) { kepalaTerang = terang; kepala.classList.toggle('terang', kepalaTerang && !menuBuka); }
  const ps = y > Math.min(hh, 600) * 0.8;
  if (ps !== lewat) { lewat = ps; fab.classList.toggle('tampil', ps); fab.tabIndex = ps ? 0 : -1; }
  bangun();
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', jadwalUkur);
if ('ResizeObserver' in window) new ResizeObserver(jadwalUkur).observe(document.body);

// ---------- WebGL ----------
const VS = 'attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
const PRESISI = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
const NOISE = 'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*f*(f*(f*6.-15.)+10.);return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}';
function program(gl, fs) {
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(o)); return o; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(pr)); return null; }
  gl.useProgram(pr);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  return pr;
}
function konteks(c, opt) { try { return c.getContext('webgl', opt); } catch (e) { return null; } }
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
const seragam = (gl, pr, nama) => { const U = {}; nama.forEach((n) => { U[n] = gl.getUniformLocation(pr, n); }); return U; };
function tekstur(gl, gambar, mip) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, gambar);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  if (mip) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); } else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  return t;
}
const muatGambar = (src) => new Promise((ok, gagal) => { const im = new Image(); im.decoding = 'async'; im.onload = () => ok(im); im.onerror = gagal; im.src = src; });
// WebKit (Safari di iPhone dan Mac) tidak menampilkan lagi kanvas WebGL yang ukurannya diubah setelah pernah menggambar,
// jadi di WebKit ukuran baru = elemen kanvas baru dengan konteks baru, disiapkan di luar halaman lalu ditukar setelah
// ukurannya tenang 0,3 detik. Kanvas yang konteksnya hilang dibuat ulang dengan cara yang sama. Sesudahnya kanvas
// digambar paling sedikit tiga kali (X.ulang). Sama dengan situs ARSWORD lain (lihat README).
const WEBKIT = /AppleWebKit/.test(navigator.userAgent) && !/Chrome\/|Chromium\/|Edg\//.test(navigator.userAgent);
function ukuranGL(X, w, h, opt, buat, pasang) {
  const lama = X.c, hilang = X.gl.isContextLost();
  if (lama.width === w && lama.height === h && !hilang) { X.calon = null; X.tunggu = ''; return false; }
  if (hilang || (WEBKIT && X.pernah)) {
    const ukuran = w + 'x' + h, now = performance.now();
    if (X.tunggu !== ukuran) { X.tunggu = ukuran; X.tungguSejak = now; }
    if (!hilang && now - X.tungguSejak < 300) return false;
    if (!X.calon) { const c = lama.cloneNode(false), gl = konteks(c, opt); X.calon = { c, gl, isi: gl && buat(gl) }; }
    const n = X.calon; if (!n.isi || (n.isi.siap && !n.isi.siap())) return false;
    X.calon = null; X.tunggu = '';
    lama.replaceWith(n.c);
    if (!hilang) { const ext = X.gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); }
    X.c = n.c; X.gl = n.gl; X.pernah = false; pasang(n.isi);
  }
  X.c.width = w; X.c.height = h; X.gl.viewport(0, 0, w, h); X.ulang = 3; return true;
}

// ---------- latar: warna bagian berganti seperti mobil yang menyalip ----------
// Warna baru masuk dari kanan dengan tepi miring yang kabur searah gerak (makin kabur saat paling cepat), dengan garis
// cahaya mint tipis di tepinya seperti jejak lampu, dan jejak samar di belakangnya.
const FS_LATAR = PRESISI + `varying vec2 vUv;uniform vec2 uRes;uniform float uTime;uniform vec3 uFrom;uniform vec3 uTo;uniform float uProg;${NOISE}
void main(){float asp=uRes.x/uRes.y;float y=vUv.y-.5;
float e=mix(1.18,-.18,uProg)+y*.16/asp;float laju=sin(clamp(uProg,0.,1.)*3.14159);
float lunak=.003+.05*laju;float x=vUv.x+(noise(vec2(vUv.y*40.,uTime*.5))-.5)*.004*laju;
float m=smoothstep(e-lunak,e+lunak,x);vec3 col=mix(uFrom,uTo,m);
float d=x-e;float garis=exp(-pow(d/.0028,2.))*laju;float jejak=exp(-max(d,0.)*22.)*step(0.,d)*laju*.09;
float lum=dot(col,vec3(.299,.587,.114));vec3 cahaya=lum>.5?vec3(.12,.44,.36):vec3(.56,.82,.75);
col=mix(col,cahaya,clamp(garis*.55+jejak,0.,1.));
col+=(hash(vUv*uRes+fract(uTime))-.5)*.012;gl_FragColor=vec4(col,1.);}`;
const OPT_LATAR = { antialias: false, alpha: false };
const buatLatar = (gl) => { const pr = program(gl, FS_LATAR); return pr && { U: seragam(gl, pr, ['uRes', 'uTime', 'uFrom', 'uTo', 'uProg']) }; };
(function initBG() {
  if (hemat) return;
  const c = $('#latar'), gl = konteks(c, OPT_LATAR); if (!gl) return;
  const isi = buatLatar(gl); if (!isi) return;
  B = { gl, U: isi.U, c, t0: performance.now(), hex: TERANG, from: rgb(TERANG), to: rgb(TERANG), tS: 0, pr: 1, perlu: true };
  L.bg.forEach((el) => { el.style.background = 'transparent'; });
})();
function setBg(hex) { if (!B || hex === B.hex) return; B.from = B.pr >= 0.5 ? B.to : B.from; B.to = rgb(hex); B.hex = hex; B.tS = performance.now(); B.perlu = true; bangun(); }
function drawBG() {
  if (!B) return;
  if (ukuranGL(B, Math.round((B.cw || innerWidth) * 0.6), Math.round((B.ch || innerHeight) * 0.6), OPT_LATAR, buatLatar, (isi) => { B.U = isi.U; })) B.perlu = true;
  if (!B.perlu) return;
  const { gl, U, c } = B, w = c.width, h = c.height;
  const now = performance.now(); let q = reduced ? 1 : Math.min(1, (now - B.tS) / 1000); if (q >= 1) B.perlu = false; q = q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2; B.pr = q;
  gl.uniform2f(U.uRes, w, h); gl.uniform1f(U.uTime, (now - B.t0) / 1000); gl.uniform3fv(U.uFrom, B.from); gl.uniform3fv(U.uTo, B.to);
  gl.uniform1f(U.uProg, q); gl.drawArrays(gl.TRIANGLES, 0, 3); B.pernah = true;
  if (B.ulang > 0 && --B.ulang > 0) B.perlu = true;
}

// ---------- panggung mobil (hero beranda) ----------
// Studio foto terang: dinding mint pucat yang melengkung ke lantai mengilap, cahaya mint di belakang mobil, bayangan
// kontak di lantai, dan pantulan mobil yang memudar. Foto mobil klien (tanpa latar, alat/foto.py) jadi tekstur.
// Ganti mobil: mobil lama melaju keluar ke arah depannya (kabur searah gerak), mobil baru masuk dari belakang dan
// mengerem. Sesekali pita cahaya softbox menyapu bodi mobil. Klik mobil = lampu depannya menyala dua kali (titik lampu
// diukur per foto, src/data.mjs). Kursor menggeser mobil dan dinding sedikit (paralaks). Hanya digambar bila berubah.
const FS_PANGGUNG = PRESISI + `uniform vec2 uRes;uniform float uTime;uniform float uLantai;uniform vec4 uKA;uniform vec4 uKB;uniform sampler2D uTA;uniform sampler2D uTB;
uniform float uBlurA;uniform float uBlurB;uniform float uTampakA;uniform float uTampakB;uniform float uSapu;uniform float uKilat;uniform vec4 uLampu;uniform vec2 uGeser;uniform float uGelap;${NOISE}
vec4 mobil(sampler2D t,vec4 k,float blur,vec2 p){
  vec2 uv=(p-k.xy)/k.zw;uv.y=1.-uv.y;
  if(uv.x<-.2||uv.x>1.2||uv.y<0.||uv.y>1.)return vec4(0.);
  vec4 s=vec4(0.);
  for(int i=0;i<14;i++){float f=float(i)/13.-.5;vec2 u=uv+vec2(f*blur/k.z,0.);
    vec4 c=texture2D(t,u);float di=step(0.,u.x)*step(u.x,1.);c.a*=di;s+=vec4(c.rgb*c.a,c.a);}
  return s/14.;
}
float bayang(vec4 k,vec2 p,float tampak){
  vec2 d=(p-vec2(k.x+k.z*.5,uLantai))/vec2(k.z*.47,k.z*.03);
  return exp(-dot(d,d))*.32*tampak;
}
void main(){
  vec2 p=gl_FragCoord.xy;float H=uRes.y;
  // dinding dan lantai studio
  float atas=smoothstep(uLantai,H,p.y);
  vec3 col=mix(vec3(.902,.937,.922),vec3(.968,.98,.975),atas);
  float lantai=1.-smoothstep(uLantai-2.,uLantai+H*.05,p.y);
  vec3 lt=mix(vec3(.875,.914,.898),vec3(.935,.957,.948),clamp((uLantai-p.y)/(H*.4),0.,1.));
  col=mix(col,lt,lantai);
  // cahaya mint di belakang mobil
  vec2 c=vec2(uKA.x+uKA.z*.5,uLantai+uKA.w*.38)+uGeser*1.6;
  float g=exp(-pow(length((p-c)/vec2(uKA.z*.62,uKA.w*.85)),2.)*1.5)*max(uTampakA,.6);
  col=mix(col,vec3(.565,.816,.749),g*.5);
  // kolam cahaya di lantai
  vec2 cl=(p-vec2(c.x,uLantai))/vec2(uKA.z*.7,uKA.z*.09);col+=vec3(.06,.08,.07)*exp(-dot(cl,cl))*lantai;
  // bayangan kontak
  col*=1.-bayang(uKA,p,uTampakA)-bayang(uKB,p,uTampakB);
  // pantulan di lantai (cermin di garis lantai, memudar)
  if(p.y<uLantai){
    float jarak=uLantai-p.y;vec2 q=vec2(p.x,uLantai+jarak);
    vec4 ra=mobil(uTA,uKA,uBlurA+jarak*.12,q)*uTampakA;vec4 rb=mobil(uTB,uKB,uBlurB+jarak*.12,q)*uTampakB;
    float f=exp(-jarak/(uKA.w*.22))*.2;
    col=mix(col,ra.rgb/max(ra.a,.001),ra.a*f);col=mix(col,rb.rgb/max(rb.a,.001),rb.a*f);
  }
  // mobil: yang keluar (B) di belakang yang masuk (A)
  vec4 b=mobil(uTB,uKB,uBlurB,p)*uTampakB;col=col*(1.-b.a)+b.rgb;
  vec4 a=mobil(uTA,uKA,uBlurA,p)*uTampakA;
  // pita cahaya softbox menyapu bodi (hanya mobil A)
  vec2 uv=(p-uKA.xy)/uKA.zw;float s=uv.x+(uv.y)*.42;
  float pita=exp(-pow((s-uSapu)/.06,2.))+exp(-pow((s-uSapu+.14)/.025,2.))*.6;
  vec3 ca=a.rgb/max(a.a,.001);float lum=dot(ca,vec3(.299,.587,.114));
  ca+=vec3(1.)*pita*smoothstep(.25,.9,lum)*.5*step(.6,a.a);
  col=col*(1.-a.a)+ca*a.a;
  // lampu depan menyala
  if(uKilat>.001){
    for(int i=0;i<2;i++){vec2 L=i==0?uLampu.xy:uLampu.zw;vec2 d=p-L;float r=uKA.z*.028;
      float inti=exp(-dot(d,d)/(r*r*.35));float pendar=exp(-dot(d,d)/(r*r*5.));float garis=exp(-abs(d.y)/(r*.16))*exp(-abs(d.x)/(r*10.));
      col+=vec3(1.,.97,.9)*(inti*1.1+pendar*.45+garis*.55)*uKilat;}
    col=mix(col,col*vec3(.94,.97,.96),uKilat*.25);
  }
  col*=1.-uGelap*.35;
  col+=(hash(p+fract(uTime))-.5)*.01;
  gl_FragColor=vec4(col,1.);
}`.replace('uniform vec2 uRes;', 'varying vec2 vUv;uniform vec2 uRes;');
const OPT_PANGGUNG = { antialias: false, alpha: false };
const U_PANGGUNG = ['uRes', 'uTime', 'uLantai', 'uKA', 'uKB', 'uTA', 'uTB', 'uBlurA', 'uBlurB', 'uTampakA', 'uTampakB', 'uSapu', 'uKilat', 'uLampu', 'uGeser', 'uGelap'];
(function initPanggung() {
  const host = $('#panggung'), c = $('#panggung-kanvas'), tempat = $('#panggung-tempat'); if (!host || !c || hemat) return;
  const DAFTAR = $$('[data-chips="hero"] button').map((b) => mobil(b.dataset.mobil)).filter(Boolean);
  if (!DAFTAR.length) return;
  const gl = konteks(c, OPT_PANGGUNG); if (!gl) return;
  const buat = (g) => { const pr = program(g, FS_PANGGUNG); if (!pr) return null; const U = seragam(g, pr, U_PANGGUNG); g.uniform1i(U.uTA, 0); g.uniform1i(U.uTB, 1); return { U, tex: new Map() }; };
  const isi = buat(gl); if (!isi) return;
  const kecil = innerWidth < 800;
  S = { gl, c, host, tempat, U: isi.U, tex: isi.tex, gambar: new Map(), daftar: DAFTAR, kini: 0, dari: -1, tGanti: 0, geser: [0, 0], geserT: [0, 0], sapu: -9, tSapu: 0, kilat: 0, tKilat: -1,
    auto: !reduced, tAuto: performance.now() + 6500, perlu: true, gulir: 0, kotak: null, ukurUlang: true, siap: false, terlihat: true, offA: 0, offB: 0, blurA: 0, blurB: 0, offLalu: [0, 0] };
  // tekstur mobil: yang pertama sekarang, sisanya di waktu senggang
  // foto bawaan (/assets/armada/…) atau unggahan panel (/media/…): alamatnya ditulis src/rakit.mjs di #armada-data
  const src = (m) => (kecil && m.src7) || m.src;
  const pasangTekstur = (X, m) => { const im = S.gambar.get(m.slug); if (im) X.tex.set(m.slug, tekstur(X.gl, im, false)); };
  const muat = (m) => S.gambar.has(m.slug) ? Promise.resolve() : muatGambar(src(m)).then((im) => { S.gambar.set(m.slug, im); pasangTekstur(S, m); S.perlu = true; bangun(); });
  muat(DAFTAR[0]).then(() => {
    S.siap = true; host.classList.add('gl'); document.body.classList.add('panggung-siap');
    // tanpa intro: mobil sudah di tempat, disapu cahaya sekali; dengan intro: mobil masuk saat layar navy menyusut
    if ($('#intro')) { S.masukAwal = true; S.tGanti = Infinity; mulaiHero = () => masuk(); } else { S.tSapu = performance.now() + 500; }
    const sisa = () => DAFTAR.slice(1).reduce((p, m) => p.then(() => muat(m)), Promise.resolve());
    if ('requestIdleCallback' in window) requestIdleCallback(sisa, { timeout: 2500 }); else setTimeout(sisa, 1200);
    bangun();
  }).catch(() => {});
  function masuk() { S.dari = -1; S.tGanti = performance.now(); S.masukAwal = true; S.perlu = true; bangun(); }
  S.buatUlang = (g) => buat(g);
  S.pasangUlang = (baru) => { S.U = baru.U; S.tex = baru.tex; DAFTAR.forEach((m) => pasangTekstur(S, m)); };
  // ganti mobil
  const chips = $('[data-chips="hero"]'), nama = $('#hero-nama'), detail = $('#hero-detail'), harga = $('#hero-harga');
  function ganti(i, olehPengguna) {
    if (i === S.kini || !S.siap) return;
    const m = DAFTAR[i];
    if (!S.gambar.has(m.slug)) { muat(m).then(() => ganti(i, olehPengguna)); return; }
    S.dari = S.kini; S.kini = i; S.tGanti = performance.now(); S.masukAwal = false; S.sapu = -9; S.tSapu = S.tGanti + 1500;
    if (olehPengguna) S.auto = false; else S.tAuto = S.tGanti + 6500;
    $$('button', chips).forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    nama.textContent = m.nama; nama.href = `/armada/${m.slug}/`;
    detail.textContent = `${m.kursi} kursi · ${m.transmisi.replace(/ \(.*\)/, '')}`;
    harga.innerHTML = `${rupiah(m.harga)}<small>/hari</small>`;
    if (!reduced && nama.animate) [nama, detail, harga].forEach((x, k) => x.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: 250 + k * 60, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
    S.perlu = true; bangun();
  }
  S.ganti = ganti;
  chips.addEventListener('pilih', (e) => ganti(DAFTAR.findIndex((m) => m.slug === e.detail.dataset.mobil), true));
  // paralaks kursor dan klik lampu
  const hero = $('.hero-panggung');
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || reduced) return;
    const r = hero.getBoundingClientRect();
    S.geserT = [((e.clientX - r.left) / r.width - 0.5) * -16, ((e.clientY - r.top) / r.height - 0.5) * 6]; S.perlu = true;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { S.geserT = [0, 0]; S.perlu = true; });
  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a,button,input,select') || !S.kotak) return;
    const r = hero.getBoundingClientRect(), k = S.kotakCss, x = e.clientX - r.left, y = e.clientY - r.top;
    if (x > k.x && x < k.x + k.w && y > k.y && y < k.y + k.h && S.dari < 0) { S.tKilat = performance.now(); S.perlu = true; bangun(); }
  });
  if ('IntersectionObserver' in window) new IntersectionObserver((en) => { S.terlihat = en[0].isIntersecting; if (S.terlihat) { S.perlu = true; bangun(); } }).observe(host);
  addEventListener('resize', () => { S.ukurUlang = true; S.perlu = true; });
})();
const mulusKeluar = (t) => 1 - Math.pow(1 - t, 3), mulusMasuk = (t) => t * t * t;
// kedipan lampu: [detik, terang]
const KEDIP = [[0, 0], [0.05, 1], [0.16, 0.15], [0.26, 1], [0.5, 0.85], [0.9, 0]];
const nilaiKedip = (t) => { if (t < 0 || t > 0.9) return 0; for (let i = 1; i < KEDIP.length; i++) if (t <= KEDIP[i][0]) { const [a, va] = KEDIP[i - 1], [b, vb] = KEDIP[i]; return va + (vb - va) * (t - a) / (b - a); } return 0; };
function drawPanggung(now) {
  if (!S || !S.siap) return;
  if (!S.terlihat && !S.ukurUlang) return;
  const W = S.host.clientWidth, Hh = S.host.clientHeight;
  const dpr = Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2) * kualitas * (W * Hh > 2.2e6 ? 0.8 : 1);
  const baru = ukuranGL(S, Math.round(W * dpr), Math.round(Hh * dpr), OPT_PANGGUNG, S.buatUlang, S.pasangUlang);
  if (baru || S.ukurUlang) {
    S.ukurUlang = false;
    const r = S.tempat.getBoundingClientRect(), h = S.host.getBoundingClientRect();
    S.kotakDasar = { x: r.left - h.left, bawah: r.bottom - h.top, w: r.width, cx: r.left - h.left + r.width / 2 };
    S.perlu = true;
  }
  // ganti otomatis setiap 6,5 detik sampai pengunjung memilih sendiri
  if (S.auto && S.dari < 0 && !S.masukAwal && now > S.tAuto && scrollY < 50 && !document.documentElement.classList.contains('intro-jalan')) S.ganti((S.kini + 1) % S.daftar.length, false);
  // paralaks
  S.geser[0] += (S.geserT[0] - S.geser[0]) * 0.08; S.geser[1] += (S.geserT[1] - S.geser[1]) * 0.08;
  const geserGerak = Math.abs(S.geserT[0] - S.geser[0]) + Math.abs(S.geserT[1] - S.geser[1]) > 0.05;
  // transisi: mobil lama keluar ke arah depannya, mobil baru masuk dari belakang dan mengerem
  const K = S.kotakDasar, jauh = W * 0.85;
  let offA = 0, offB = 0, tampakA = 1, tampakB = 0, transisi = false;
  const mA = S.daftar[S.kini], mB = S.dari >= 0 ? S.daftar[S.dari] : null;
  const arah = (m) => m.arah === 'kanan' ? 1 : -1;
  if (S.dari >= 0 || S.masukAwal) {
    const t = (now - S.tGanti) / 1000; transisi = true;
    const tMasuk = clamp((t - (S.masukAwal ? 0 : 0.28)) / 1.0, 0, 1);
    offA = -arah(mA) * (1 - mulusKeluar(tMasuk)) * jauh; tampakA = clamp(tMasuk * 3, 0, 1);
    if (mB) { const tk = clamp(t / 0.75, 0, 1); offB = arah(mB) * mulusMasuk(tk) * jauh; tampakB = 1 - clamp((tk - 0.6) / 0.4, 0, 1); }
    if (tMasuk >= 1 && (!mB || t >= 0.75)) { S.dari = -1; S.masukAwal = false; transisi = false; S.tSapu = now + 200; }
  }
  if (reduced) { offA = offB = 0; tampakB = 0; }
  const blurA = clamp(Math.abs(offA - S.offLalu[0]) * 1.8, 0, 90), blurB = clamp(Math.abs(offB - S.offLalu[1]) * 1.8, 0, 90);
  S.offLalu = [offA, offB];
  // pita cahaya: sesekali menyapu (sekitar 1,6 detik)
  let sapu = -9;
  if (!transisi && !reduced) {
    if (now > S.tSapu + 1700) S.tSapu = now + 5200 + Math.random() * 2500;
    const ts = (now - S.tSapu) / 1600; if (ts >= 0 && ts <= 1) sapu = -0.4 + ts * 2.1;
  }
  const kilat = nilaiKedip((now - S.tKilat) / 1000);
  const aktif = transisi || sapu > -9 || kilat > 0 || geserGerak || S.perlu || S.ulang > 0 || (S.tKilat > 0 && now - S.tKilat < 1000);
  S.aktif = aktif;
  if (!aktif) {
    // diam: loop boleh tidur; pengatur waktu membangunkannya untuk sapuan cahaya atau ganti mobil berikutnya
    const berikut = Math.min(S.tSapu > now ? S.tSapu : Infinity, S.auto ? S.tAuto : Infinity);
    if (isFinite(berikut) && !S.pewaktu) S.pewaktu = setTimeout(() => { S.pewaktu = 0; S.perlu = false; bangun(); }, berikut - now + 20);
    return;
  }
  S.perlu = false;
  const { gl, U, c } = S, w = c.width, h = c.height, k = w / W;
  const kotak = (m, off) => {
    const tw = K.w * (m.kelas === 'bus' ? 1.02 : 1), th = tw * m.h / m.w;
    const x = K.cx - tw / 2 + off + S.geser[0], bawah = K.bawah + S.geser[1];
    return { x, y: bawah - th, w: tw, h: th };
  };
  const ka = kotak(mA, offA), kb = mB ? kotak(mB, offB) : ka;
  S.kotak = ka; S.kotakCss = ka;
  const gl4 = (o) => [o.x * k, h - (o.y + o.h) * k, o.w * k, o.h * k];
  const lantai = h - (K.bawah - K.w * 0.035) * k;
  gl.uniform2f(U.uRes, w, h); gl.uniform1f(U.uTime, now / 1000); gl.uniform1f(U.uLantai, lantai);
  gl.uniform4fv(U.uKA, gl4(ka)); gl.uniform4fv(U.uKB, gl4(kb));
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, S.tex.get(mA.slug) || null);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, mB ? S.tex.get(mB.slug) || null : S.tex.get(mA.slug) || null);
  gl.uniform1f(U.uBlurA, blurA * k); gl.uniform1f(U.uBlurB, blurB * k);
  gl.uniform1f(U.uTampakA, S.tex.get(mA.slug) ? tampakA : 0); gl.uniform1f(U.uTampakB, mB && S.tex.get(mB.slug) ? tampakB : 0);
  gl.uniform1f(U.uSapu, sapu); gl.uniform1f(U.uKilat, kilat); gl.uniform2f(U.uGeser, S.geser[0] * k, -S.geser[1] * k);
  const lp = mA.lampu || [[-9, -9], [-9, -9]];
  const titikLampu = (q) => [(ka.x + q[0] * ka.w) * k, h - (ka.y + q[1] * ka.h) * k];
  gl.uniform4fv(U.uLampu, [...titikLampu(lp[0]), ...titikLampu(lp[1])]);
  gl.uniform1f(U.uGelap, reduced ? 0 : S.gulir || 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3); S.pernah = true; if (S.ulang) S.ulang--;
}

// ---------- kaki: gantungan kunci ----------
// Paku kecil di dinding navy; dari situ tergantung ring besi, lencana TWH (akrilik tebal, tekstur dari berkas klien)
// dan kunci mobil hitam dengan tiga tombol. Semuanya berayun sebagai bandul: gerak kursor di dekatnya mendorong, gulir
// menggoyang sedikit, klik lencana memutar, klik kunci = lampu hazard berkedip kuning di dinding dan LED kunci menyala.
// Digambar 2,5D dalam satu shader: bentuk dari tekstur dan SDF, tepi bevel memberi normal untuk kilap.
const FS_KUNCI = PRESISI + `varying vec2 vUv;uniform vec2 uRes;uniform float uTime;uniform vec2 uPaku;uniform float uSkala;uniform float uSudut;uniform float uPutar;
uniform float uA1;uniform float uA2;uniform sampler2D uLencana;uniform float uKedip;uniform vec2 uLampu;uniform float uTekan;${NOISE}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float sdBox(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
vec3 L;vec3 V;
// kilap: diffuse + spekular dari normal permukaan; arah pandang V berubah per piksel (perspektif), jadi permukaan datar
// hanya berkilau di sebagian, tidak putih seluruhnya
vec3 terangi(vec3 alb,vec3 n,float kilap,float kuat){float df=.55+.45*max(dot(n,L),0.);vec3 h=normalize(L+V);
  float sp=pow(max(dot(n,h),0.),kilap)*kuat;return alb*df+vec3(sp);}
void main(){
  vec2 p=gl_FragCoord.xy;vec2 u=(p-uPaku)/uSkala;
  L=normalize(vec3(uLampu,1.1));V=normalize(vec3((uPaku+vec2(0.,-2.4)*uSkala-p)/(uSkala*2.6),1.));
  // dinding navy dengan sorot lampu lembut di sekitar gantungan
  vec2 sp=(p-(uPaku+vec2(-.6,-2.6)*uSkala))/(uSkala*5.2);
  vec3 col=mix(vec3(.043,.118,.165),vec3(.09,.2,.27),exp(-dot(sp,sp)*1.4));
  col+=(noise(p*.6)-.5)*.012;
  // lampu hazard di dinding
  vec2 hz=(p-(uPaku+vec2(1.2,-3.4)*uSkala))/(uSkala*6.);col+=vec3(1.,.66,.2)*exp(-dot(hz,hz)*1.2)*uKedip*.35;
  // rangka: ring berpusat di bawah paku, berayun uSudut
  float cp=cos(uPutar);
  vec2 q=rot(uSudut)*u;            // koordinat ring (paku di 0,0; ring tergantung ke bawah)
  vec2 cr=vec2(0.,-.62);
  // titik gantung lencana (kiri bawah ring) dan kunci (kanan bawah ring)
  vec2 g1=cr+vec2(-.3,-.42),g2=cr+vec2(.34,-.4);
  vec2 q1=rot(uA1)*(q-g1);q1.x/=max(cp,.3);   // lencana: puncak di 0,0, tergantung ke bawah
  vec2 q2=rot(uA2)*(q-g2);q2.x/=max(cos(uPutar*1.3+.35),.3);
  // ukuran lencana (satuan): lebar 2,1, tinggi 2,31 (rasio 1,1); kunci: 1,05 x 2
  vec2 uvL=vec2(q1.x/2.1+.5,(-q1.y-.12)/2.31);vec2 tL=.06+uvL*.88;
  vec2 bk=q2-vec2(0.,-1.18);
  // --- bayangan di dinding (geser ke kanan bawah, kabur) ---
  vec2 sh=vec2(.22,-.3);
  vec2 q1s=rot(uA1)*(q-sh-g1);q1s.x/=max(cp,.3);vec2 uvS=vec2(q1s.x/2.1+.5,(-q1s.y-.12)/2.31);
  float aS=texture2D(uLencana,.06+clamp(uvS,-.07,1.07)*.88,4.).a;
  vec2 q2s=rot(uA2)*(q-sh-g2)-vec2(0.,-1.18);float kS=1.-smoothstep(-.12,.16,sdBox(q2s,vec2(.52,1.),.42));
  float rS=1.-smoothstep(.0,.14,abs(length(q-sh-cr)-.5)-.05);
  col*=1.-.55*clamp(aS*.9+kS*.9+rS*.6,0.,1.);
  // --- kunci mobil (di belakang lencana) ---
  float dk=sdBox(bk,vec2(.52,1.),.42);
  if(dk<.02){
    float e=clamp(-dk/.14,0.,1.);vec2 gr=normalize(vec2(sdBox(bk+vec2(.01,0.),vec2(.52,1.),.42)-sdBox(bk-vec2(.01,0.),vec2(.52,1.),.42),sdBox(bk+vec2(0.,.01),vec2(.52,1.),.42)-sdBox(bk-vec2(0.,.01),vec2(.52,1.),.42))+1e-5);
    vec3 n=normalize(vec3(-gr*(1.-e)*1.6,1.));
    vec3 alb=vec3(.035,.045,.055);
    // lis krom di tepi
    float lis=smoothstep(.0,.03,-dk)*(1.-smoothstep(.05,.08,-dk));
    alb=mix(alb,vec3(.55,.6,.64),lis);
    // tiga tombol
    for(int i=0;i<3;i++){vec2 b=bk-vec2(0.,.42-float(i)*.42);float db=length(b)-.2;
      float tekan=i==0?uTekan:0.;
      if(db<0.){alb=vec3(.07,.08,.09)-tekan*.03;vec2 gb=normalize(b+1e-5);float tepi=smoothstep(-.05,0.,db);n=normalize(vec3(gb*tepi*.9*(1.-2.*tekan),1.));}
      // ikon kecil di tombol: gembok, gembok terbuka, bagasi
      // ikon garis tipis: gembok, gembok terbuka, bagasi
      float ik=0.;vec2 bb=b*1.6;
      float badan=1.-smoothstep(.0,.012,abs(sdBox(bb-vec2(0.,-.035),vec2(.06,.045),.01))-.008);
      if(i==0)ik=max(badan,(1.-smoothstep(.0,.012,abs(length(bb-vec2(0.,.01))-.04)-.008))*step(.012,bb.y));
      if(i==1)ik=max(badan,(1.-smoothstep(.0,.012,abs(length(bb-vec2(.035,.03))-.04)-.008))*step(.035,bb.y));
      if(i==2)ik=1.-smoothstep(.0,.012,abs(sdBox(bb,vec2(.08,.045),.025))-.008);
      alb=mix(alb,vec3(.5,.54,.58),ik*.8*step(db,0.));
    }
    // LED merah di atas
    float led=length(bk-vec2(0.,.82))-.045;alb=mix(alb,mix(vec3(.25,.05,.05),vec3(1.,.25,.2),uKedip),1.-smoothstep(0.,.02,led));
    vec3 ck=terangi(alb,n,60.,.55);
    ck+=vec3(.12,.16,.18)*exp(-pow((bk.x*.8+bk.y*.25-uPutar*1.4-.15)/.12,2.))*(1.-lis); // pantulan softbox
    col=mix(col,ck,1.-smoothstep(-.015,.015,dk));
    col+=vec3(1.,.3,.2)*exp(-pow(max(led,0.)/.08,2.))*uKedip*.6;
  }
  // gelang logam kecil di atas kunci
  float dg=abs(length(bk-vec2(0.,1.12))-.16)-.035;
  if(dg<.02){vec2 rr=bk-vec2(0.,1.12);float t=clamp((length(rr)-.16)/.035,-1.,1.);vec3 n=normalize(vec3(normalize(rr+1e-5)*t,sqrt(1.-t*t)));
    col=mix(col,terangi(vec3(.6,.64,.68),n,40.,.9),1.-smoothstep(-.01,.01,dg));}
  // --- lencana akrilik ---
  if(uvL.x>-.02&&uvL.x<1.02&&uvL.y>-.02&&uvL.y<1.02){
    vec4 t=texture2D(uLencana,tL);
    if(t.a>.01){
      // normal dari alfa yang dikaburkan (tepi tebal membulat) + timbul halus dari terang warna
      float e=.006;
      float ax=texture2D(uLencana,tL+vec2(e,0.),2.).a-texture2D(uLencana,tL-vec2(e,0.),2.).a;
      float ay=texture2D(uLencana,tL+vec2(0.,e),2.).a-texture2D(uLencana,tL-vec2(0.,e),2.).a;
      float lx=dot(texture2D(uLencana,tL+vec2(.002,0.)).rgb-texture2D(uLencana,tL-vec2(.002,0.)).rgb,vec3(.33));
      float ly=dot(texture2D(uLencana,tL+vec2(0.,.002)).rgb-texture2D(uLencana,tL-vec2(0.,.002)).rgb,vec3(.33));
      vec3 n=normalize(vec3(-ax*2.2-lx*.6,ay*2.2+ly*.6,1.));
      n.xy=rot(-uA1-uSudut)*n.xy;n.x+=sin(uPutar)*.5;n=normalize(n);
      vec3 cl=terangi(t.rgb,n,90.,.75);
      // lapisan bening: pita kilap yang bergeser saat lencana berputar
      cl+=vec3(1.)*exp(-pow((uvL.x*.9+uvL.y*.5-.55-uPutar*.9)/.07,2.))*.22;
      col=mix(col,cl,smoothstep(.05,.6,t.a));
    }
  }
  // lubang lencana: mata ayam logam di puncak
  float dm=abs(length(q1-vec2(0.,-.22))-.09)-.03;
  if(dm<.02){vec2 rr=q1-vec2(0.,-.22);float t=clamp((length(rr)-.09)/.03,-1.,1.);vec3 n=normalize(vec3(normalize(rr+1e-5)*t,sqrt(1.-t*t)));
    col=mix(col,terangi(vec3(.66,.7,.72),n,50.,.9),1.-smoothstep(-.01,.01,dm));}
  // --- ring besi (di depan semuanya) ---
  vec2 rq=q-cr;rq.x/=max(cos(uPutar*.6),.4);
  float dr=abs(length(rq)-.5)-.055;
  if(dr<.02){float t=clamp((length(rq)-.5)/.055,-1.,1.);vec3 n=normalize(vec3(normalize(rq+1e-5)*t,sqrt(max(1.-t*t,0.))));
    vec3 cm=terangi(vec3(.58,.62,.66),n,70.,1.1);cm*=.85+.25*noise(vec2(atan(rq.y,rq.x)*14.,1.));
    col=mix(col,cm,1.-smoothstep(-.012,.012,dr));}
  // paku
  float dp=length(u)-.11;
  if(dp<.03){vec3 n=normalize(vec3(u/.11*.8,1.));col=mix(col,terangi(vec3(.5,.54,.58),n,30.,.8),1.-smoothstep(-.015,.015,dp));}
  col+=(hash(p+fract(uTime))-.5)*.012;
  gl_FragColor=vec4(col,1.);
}`;
const OPT_KUNCI = { antialias: false, alpha: false, powerPreference: 'low-power' };
const U_KUNCI = ['uRes', 'uTime', 'uPaku', 'uSkala', 'uSudut', 'uPutar', 'uA1', 'uA2', 'uLencana', 'uKedip', 'uLampu', 'uTekan'];
let kakiMulai = false;
function buatKunci(gl, gambar) {
  const pr = program(gl, FS_KUNCI); if (!pr) return null;
  const U = seragam(gl, pr, U_KUNCI); gl.uniform1i(U.uLencana, 0);
  // lencana dipasang di kanvas 512x512 (ukuran pangkat dua supaya mipmap bisa dipakai untuk bayangan dan tepi yang kabur)
  // (margin bening 6% supaya contoh di luar lencana, juga yang dikaburkan mipmap, tetap bening)
  const cv = document.createElement('canvas'); cv.width = cv.height = 512;
  cv.getContext('2d').drawImage(gambar, 512 * 0.06, 512 * 0.06, 512 * 0.88, 512 * 0.88);
  gl.activeTexture(gl.TEXTURE0); tekstur(gl, cv, true);
  return { U };
}
function initKaki() {
  if (P || hemat || kakiMulai) return;
  kakiMulai = true;
  const host = $('#ajakan'), c = $('#kaki-kanvas'); if (!host || !c) return;
  muatGambar('/assets/logo/lencana.webp').then((gambar) => {
    const gl = konteks(c, OPT_KUNCI); if (!gl) return;
    const isi = buatKunci(gl, gambar); if (!isi) return;
    P = { gl, U: isi.U, c, host, gambar, t0: performance.now(), sudut: 0.35, w: 0, a1: -0.2, w1: 0, a2: 0.25, w2: 0, putar: 0, wp: 0, kedip: -9, tekan: 0, lampu: [-0.5, 0.8], akhir: 0, sekali: false, x0: null, y0: null };
    // dorongan kursor: kecepatan mendatar di dekat gantungan
    host.addEventListener('pointermove', (e) => {
      if (reduced) return;
      const r = host.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (P.x0 !== null && P.tata) {
        const dx = x - P.x0, dekat = Math.exp(-Math.pow(Math.hypot(x - P.tata.px, y - (P.tata.py + P.tata.s * 2.2)) / (P.tata.s * 3.2), 2));
        P.w += clamp(dx, -60, 60) * 0.0016 * dekat; P.wp += clamp(dx, -60, 60) * 0.0012 * dekat;
      }
      P.x0 = x; P.y0 = y;
      P.lampu = [((x / r.width) - 0.5) * 1.2 - 0.3, (0.5 - (y / r.height)) * 1.2 + 0.6];
    }, { passive: true });
    host.addEventListener('pointerleave', () => { P.x0 = null; });
    host.addEventListener('pointerdown', (e) => {
      if (e.target.closest('a,button') || !P.tata) return;
      const r = host.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, T = P.tata;
      const dKunci = Math.hypot(x - (T.px + T.s * 0.6), y - (T.py + T.s * 2.4)), dLencana = Math.hypot(x - (T.px - T.s * 0.4), y - (T.py + T.s * 2.3));
      if (dKunci < T.s * 1.1 && dKunci < dLencana) { P.kedip = performance.now(); P.w += 0.6; }
      else if (dLencana < T.s * 1.5) { P.wp += 2.6 * (x < T.px - T.s * 0.4 ? -1 : 1); P.w -= 0.4; }
      else return;
      bangun();
    });
    c.classList.add('siap'); bangun();
  }).catch(() => {});
}
if ($('#ajakan') && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { initKaki(); io.disconnect(); } }, { rootMargin: '1000px 0px' });
  io.observe($('#ajakan'));
  addEventListener('load', () => { const r = () => initKaki(); if ('requestIdleCallback' in window) requestIdleCallback(r, { timeout: 5000 }); else setTimeout(r, 2000); });
}
function kakiTerlihat() { return P && TL.kaki && TL.kaki.top - scrollY < innerHeight && TL.kaki.top + TL.kaki.h - scrollY > 0; }
function drawKaki(dt) {
  const lajuIni = laju; laju = 0;
  if (!kakiTerlihat() || !TL.kaki.w) return;
  const W = TL.kaki.w, Hh = TL.kaki.h;
  const dpr = Math.min(devicePixelRatio || 1, coarse ? 1 : 1.5, Math.sqrt(2.2e6 / Math.max(1, W * Hh))) * kualitas;
  const baru = ukuranGL(P, Math.round(W * dpr), Math.round(Hh * dpr), OPT_KUNCI, (g) => buatKunci(g, P.gambar), (isi) => { P.U = isi.U; });
  const now = performance.now(), d = Math.min(dt, 40) / 1000;
  // fisika bandul: rangka (sudut, laju), lencana dan kunci relatif terhadap ring, putaran pada sumbu tegak
  if (!reduced) {
    const t = (now - P.t0) / 1000;
    // gulir mengguncang sedikit; angin pelan supaya tidak pernah benar-benar mati
    P.w += clamp(lajuIni, -300, 300) * 0.0015;
    const ang = -22 * Math.sin(P.sudut) - 1.1 * P.w + Math.sin(t * 0.8) * 0.05;
    P.w += ang * d; P.sudut += P.w * d;
    // lencana dan kunci ikut terayun relatif terhadap ring (percepatan ring mendorong ke arah sebaliknya)
    const a1 = -48 * (P.a1 + 0.22) - 2.2 * P.w1 - ang * 0.9, a2 = -56 * (P.a2 - 0.42) - 2.4 * P.w2 - ang * 0.95;
    P.w1 += a1 * d; P.a1 += P.w1 * d; P.w2 += a2 * d; P.a2 += P.w2 * d;
    const ap = -9 * P.putar - 1.3 * P.wp; P.wp += ap * d; P.putar = clamp(P.putar + P.wp * d, -1.1, 1.1);
  }
  const kedip = P.kedip > 0 ? (() => { const tk = (now - P.kedip) / 1000; if (tk > 1.6) return 0; const f = tk % 0.8; return f < 0.35 ? Math.sin(f / 0.35 * Math.PI) : 0; })() : 0;
  const tekan = P.kedip > 0 && now - P.kedip < 180 ? 1 : 0;
  const gerak = Math.abs(P.w) + Math.abs(P.w1) + Math.abs(P.w2) + Math.abs(P.wp) > 0.08;
  // bergerak: 60 fps; hampir diam: 30 fps
  if (!baru && P.sekali && !P.ulang && !gerak && !kedip && lajuIni === 0 && now - P.akhir < 33) return;
  P.akhir = now;
  const { gl, U, c } = P, w = c.width, h = c.height, k = w / W;
  // tata letak: desktop gantungan di kanan, HP di atas judul
  const lebar = W > 900;
  const s = lebar ? Math.min(W, Hh) * 0.13 : Math.min(W * 0.2, Hh * 0.11);
  const px = lebar ? W * 0.7 : W * 0.5, py = lebar ? Hh * 0.2 : Hh * 0.12;
  P.tata = { px, py, s };
  gl.uniform2f(U.uRes, w, h); gl.uniform1f(U.uTime, (now - P.t0) / 1000);
  gl.uniform2f(U.uPaku, px * k, h - py * k); gl.uniform1f(U.uSkala, s * k);
  gl.uniform1f(U.uSudut, P.sudut); gl.uniform1f(U.uPutar, P.putar); gl.uniform1f(U.uA1, P.a1); gl.uniform1f(U.uA2, P.a2);
  gl.uniform1f(U.uKedip, kedip); gl.uniform1f(U.uTekan, tekan); gl.uniform2f(U.uLampu, P.lampu[0], P.lampu[1]);
  gl.activeTexture(gl.TEXTURE0);
  gl.drawArrays(gl.TRIANGLES, 0, 3); P.pernah = true; if (P.ulang) P.ulang--;
  P.sekali = true;
}

// ---------- mulai ----------
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { jadwalUkur(); if (RT) RT.digambar = -1; bangun(); });
addEventListener('load', jadwalUkur);
kepala.style.transition = 'none';
const pulihkanTransisi = () => { kepala.style.transition = ''; };
['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach((ev) => addEventListener(ev, pulihkanTransisi, { once: true, passive: true }));
addEventListener('load', () => setTimeout(pulihkanTransisi, 400));
ukur();
// Satu loop untuk semuanya. Bila kanvas yang terlihat membuat frame rata-rata lebih dari ~24 ms selama 1,5 detik,
// resolusi kanvas diturunkan (0,75, lalu 0,55).
let rataFrame = 16.7, lambatSejak = 0;
function adaKerja() {
  const ganti = (x, lihat) => x && lihat && (x.tunggu || x.calon || x.gl.isContextLost());
  const kaki = kakiTerlihat() && !(reduced && P.sekali);
  const panggung = S && S.siap && S.terlihat && (S.aktif || S.dari >= 0 || S.masukAwal || S.perlu || S.ulang > 0);
  return !!((sm && sm.on) || (B && B.perlu) || kaki || panggung || (RT && RT.digambar !== Math.round(RT.p * 600) / 600)
    || ganti(B, true) || ganti(S, S && S.terlihat) || ganti(P, kakiTerlihat()));
}
function loop(now) {
  const dt = tLalu ? Math.min(100, now - tLalu) : 16.7; tLalu = now;
  if (document.hidden) { berjalan = false; return; }
  tickSmooth(dt); drawBG(); drawRute(); drawPanggung(now); drawKaki(dt);
  if (kualitas > 0.55) {
    const aktif = (S && S.terlihat && S.dari >= 0) || kakiTerlihat();
    rataFrame += (dt - rataFrame) * 0.05;
    if (aktif && rataFrame > 24) {
      if (!lambatSejak) lambatSejak = now;
      else if (now - lambatSejak > 1500) { kualitas = kualitas === 1 ? 0.75 : 0.55; lambatSejak = 0; rataFrame = 16.7; }
    } else lambatSejak = 0;
  }
  if (adaKerja()) requestAnimationFrame(loop); else berjalan = false;
}
bangun();
})();
