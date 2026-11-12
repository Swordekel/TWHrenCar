/* Panel admin TWH Rent Car (twhrentcar.arswordlab.com/admin/). Mesin panel dari panel Silibet Kreasi Indonesia.
 *
 * Satu halaman dengan hash router, di atas template dasbor "Kaca": NM.u (util), NM.ic (ikon), NM.ui / NM.f (komponen),
 * NM.sheet / NM.toast / NM.confirm, dan controls.js (dropdown + kalender). Semua data lewat Worker (/admin/api/*):
 * - Masuk: email → kode 6 angka dikirim ke email → sesi (cookie HttpOnly). Tidak ada kata sandi. Admin ARSWORD juga
 *   bisa masuk dari dashboard arswordlab.com (Panel situs) dengan tiket sekali pakai.
 * - Isi situs: draf per bagian (situs, beranda, armada, kota, …; lihat src/isi-awal.mjs). Setiap perubahan disimpan
 *   otomatis (PUT isi/<bagian> dengan nomor revisi; bentrok dengan admin lain dibalas 409), pratinjau di samping
 *   (/admin/pratinjau/…) dimuat ulang setelah tersimpan, dan pengunjung baru melihatnya setelah "Terbitkan".
 * - Foto: diperkecil di peramban (WebP, lebar 1600 + 640; foto mobil tanpa latar tetap transparan) lalu diunggah ke R2.
 * - Akun: hanya akun pembuat (ARSWORD) yang bisa menambah admin.
 */
(function () {
  'use strict';
  const NM = window.NM, u = NM.u, esc = u.esc, F = NM.f, UI = NM.ui;
  const $ = u.$, $$ = u.$$;

  // ------------------------------------------------------------------ HP: bagian bawah layar yang tertutup
  // Safari iOS 26 tidak menggambar elemen position: fixed yang jatuh di bawah bar Safari, padahal kotak fixed
  // (inset: 0) tetap memanjang ke sana; lembar, bar bawah, dan dropdown jadi terpotong. Tinggi yang tertutup diukur di
  // sini dan dipakai admin.css: --tutup-bawah (bar Safari + papan ketik, untuk lembar dan dropdown) dan --tutup-bar
  // (bar Safari saja, untuk bar bawah panel dan ruang di bawah halaman). Di peramban lain hasilnya 0px.
  const IOS = /iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const ukurFix = document.createElement('div'), ukurSvh = document.createElement('div');
  ukurFix.style.cssText = 'position:fixed;left:0;top:0;bottom:0;width:0;visibility:hidden;pointer-events:none';
  ukurSvh.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100svh;visibility:hidden;pointer-events:none';
  document.body.append(ukurFix, ukurSvh);
  let tUkur = 0;
  function ukurLayar() {
    tUkur = 0;
    const vv = window.visualViewport;
    if (vv && vv.scale > 1.01) return; // sedang diperbesar dengan dua jari
    const tinggi = ukurFix.getBoundingClientRect().height;
    let tutup = vv ? Math.max(0, tinggi - (vv.offsetTop + vv.height)) : 0;
    // bila visualViewport tidak menunjukkannya, kotak fixed yang lebih tinggi dari 100svh = ruang di bawah bar Safari
    if (IOS && tutup < 1) { const s = ukurSvh.getBoundingClientRect().height; if (s > 0 && s < tinggi) tutup = tinggi - s; }
    tutup = Math.round(tutup);
    const ketik = tutup > 140 && /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
    const r = document.documentElement;
    r.style.setProperty('--tutup-bawah', tutup + 'px');
    r.style.setProperty('--layar-h', Math.max(320, Math.round(tinggi - tutup)) + 'px');
    if (!ketik) r.style.setProperty('--tutup-bar', tutup + 'px');
    r.classList.toggle('papan-ketik', ketik);
  }
  const jadwalUkur = () => { if (!tUkur) tUkur = requestAnimationFrame(ukurLayar); };
  ukurLayar();
  if (window.visualViewport) { visualViewport.addEventListener('resize', jadwalUkur); visualViewport.addEventListener('scroll', jadwalUkur); }
  addEventListener('resize', jadwalUkur);
  addEventListener('orientationchange', () => setTimeout(ukurLayar, 350));
  document.addEventListener('focusin', () => setTimeout(jadwalUkur, 350));
  document.addEventListener('focusout', () => setTimeout(jadwalUkur, 350));

  // ------------------------------------------------------------------ ikon tambahan (gaya lucide, ISC)
  const IK = {
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    arrowUp: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
    arrowDown: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
    grip: '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
    ext: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
    smartphone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    network: '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
    star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  };
  const ic = (n, cls = '') => (IK[n] ? `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IK[n]}</svg>` : NM.ic(n, cls));

  // ------------------------------------------------------------------ teks dan format
  const LABEL = {
    situs: 'Identitas & kontak', angka: 'Angka di beranda', umum: 'Tulisan di semua halaman', halaman: 'Judul & Google',
    beranda: 'Beranda', armadaHal: 'Halaman Armada', layananHal: 'Halaman Layanan', caraHal: 'Halaman Cara sewa',
    lokasiHal: 'Halaman Lokasi', kontakHal: 'Halaman Kontak', mobilHal: 'Halaman mobil', kotaHal: 'Halaman kota',
    kaki: 'Ajakan di bawah halaman', kelas: 'Kelas mobil', armada: 'Armada & harga', kota: 'Kota', layanan: 'Layanan',
    langkah: 'Langkah sewa', syarat: 'Dokumen', faq: 'Pertanyaan (FAQ)', ulasan: 'Ulasan',
  };
  const NAV = [
    { id: 'beranda', l: 'Dasbor', ic: 'home' },
    { id: 'armada', l: 'Armada & harga', ic: 'car' },
    { id: 'halaman', l: 'Halaman', ic: 'file' },
    { id: 'kota', l: 'Kota', ic: 'pin' },
    { id: 'layanan', l: 'Layanan', ic: 'briefcase' },
    { id: 'cara', l: 'Cara sewa & FAQ', ic: 'list' },
    { id: 'ulasan', l: 'Ulasan & angka', ic: 'star' },
    { id: 'foto', l: 'Foto', ic: 'image' },
    { id: 'pengaturan', l: 'Pengaturan', ic: 'gear', sep: true },
    { id: 'riwayat', l: 'Riwayat', ic: 'history' },
    { id: 'akun', l: 'Akun admin', ic: 'shield', pembuat: true },
  ];
  const DOCK = ['beranda', 'armada', 'halaman', 'kota', 'layanan', 'cara', 'foto'];

  const dua = (n) => String(n).padStart(2, '0');
  const tglJam = (ms) => { if (!ms) return '–'; const d = new Date(ms); return `${d.getDate()} ${u.BLN[d.getMonth()]} ${d.getFullYear()}, ${dua(d.getHours())}.${dua(d.getMinutes())}`; };
  const relatif = (ms) => {
    if (!ms) return 'belum pernah';
    const s = (Date.now() - ms) / 1000;
    if (s < 60) return 'baru saja';
    if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
    if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
    if (s < 86400 * 7) return Math.floor(s / 86400) + ' hari lalu';
    return tglJam(ms);
  };
  const tglTeks = (s) => { if (!s) return ''; const [y, m, d] = s.split('-').map(Number); return `${d} ${u.BLN[m - 1]} ${y}`; };
  const rentang = (a, b) => (!a ? 'tanpa tanggal' : !b || b === a ? tglTeks(a) : `${tglTeks(a)} – ${tglTeks(b)}`);
  const idBaru = (p = 'x') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const slug = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' dan ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'baru';
  const namaDepan = (a) => (a.nama || a.email.split('@')[0]).split(' ')[0];
  const namaOrang = (email) => (email ? email.split('@')[0] : 'sistem');
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* mode privat */ } };
  const namaPerangkat = (ua = '') => {
    const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'perangkat lain';
    const br = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Peramban';
    return `${br} di ${os}`;
  };

  // ------------------------------------------------------------------ API
  async function api(jalur, o = {}) {
    const opt = { method: o.method || 'GET', headers: {}, credentials: 'same-origin', cache: 'no-store' };
    if (o.form) opt.body = o.form;
    else if (o.raw) { opt.body = o.raw; opt.headers['content-type'] = 'application/octet-stream'; }
    else if (o.body !== undefined) { opt.headers['content-type'] = 'application/json'; opt.body = JSON.stringify(o.body); }
    let r;
    try { r = await fetch('/admin/api/' + jalur, opt); } catch (e) {
      const g = new Error('Tidak tersambung ke internet. Periksa koneksi lalu coba lagi.'); g.kode = 'jaringan'; throw g;
    }
    let d = {};
    try { d = await r.json(); } catch (e) { d = {}; }
    if (!r.ok || d.ok === false) {
      const g = new Error(d.pesan || 'Terjadi kesalahan. Coba lagi sebentar.');
      g.status = r.status; g.kode = d.kode; g.data = d;
      if (r.status === 401 && !o.diam && S.akun) sesiHabis();
      throw g;
    }
    return d;
  }

  // ------------------------------------------------------------------ keadaan
  const S = { akun: null, isi: null, rev: {}, ubah: {}, berubah: [], terbit: null, media: [], bawaan: [], tempat: [] };
  const PETA = { media: {}, bawaan: {} };
  let LAYAR = {};
  let FOKUS = null;
  const pembuat = () => !!S.akun && S.akun.peran === 'pembuat';
  const indeksMedia = () => {
    PETA.media = Object.fromEntries(S.media.map((m) => [m.id, m]));
    PETA.bawaan = Object.fromEntries(S.bawaan.map((b) => [b.nama, b]));
  };
  function terapkanDraf(d) {
    S.isi = d.isi; S.rev = d.rev || {}; S.ubah = d.ubah || {}; S.berubah = d.berubah || []; S.terbit = d.terbit || null;
    Object.values(KERJA).forEach((k) => { clearTimeout(k.t); k.kotor = false; k.gagal = false; k.lagi = false; });
    perbaruiTombolTerbit(); statusSimpan();
  }

  // foto: nama bawaan (public/assets/foto) atau unggahan "m/<id>" (R2, /media/)
  function fotoUrl(nama, besar = false) {
    if (!nama) return '';
    if (nama.startsWith('m/')) { const m = PETA.media[nama.slice(2)]; return m ? `/media/${m.id}${!besar && m.w > 640 ? '-640' : ''}.${m.ext}` : ''; }
    const b = PETA.bawaan[nama];
    return b ? (besar ? b.url : b.kecil) : '';
  }
  function fotoNama(nama) {
    if (!nama) return '';
    if (nama.startsWith('m/')) { const m = PETA.media[nama.slice(2)]; return m ? m.nama || (m.video ? 'Video unggahan' : 'Foto unggahan') : 'Foto sudah dihapus'; }
    return nama.replace(/-/g, ' ');
  }
  // video unggahan: baris media dengan kolom video (sampulnya foto biasa dengan id yang sama)
  const mediaVideo = (nama) => (nama && nama.startsWith('m/') ? (PETA.media[nama.slice(2)] || {}).video : '') || '';
  const durasiTeks = (d) => (d >= 1 ? `${Math.floor(d / 60)}:${String(Math.round(d % 60)).padStart(2, '0')}` : '');
  const tandaVid = (m) => (m && m.video ? `<span class="tanda-vid"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9l7.5-4.5z" fill="currentColor"/></svg>${durasiTeks(m.durasi) || 'Video'}</span>` : '');
  const tandaVidNama = (nama) => (mediaVideo(nama) ? tandaVid(PETA.media[nama.slice(2)]) : '');
  const ukuranTeks = (m) => (m.video ? `Video${m.durasi ? ' ' + durasiTeks(m.durasi) : ''} · ${(m.ukuran / 1048576).toFixed(1)} MB` : `${m.w}×${m.h} · ${Math.round(m.ukuran / 1024)} KB`);
  const fotoDraf = () => {
    const out = new Set();
    const jalan = (v) => { if (typeof v === 'string') { if (v.startsWith('m/')) out.add(v.slice(2)); } else if (v && typeof v === 'object') Object.values(v).forEach(jalan); };
    jalan(S.isi);
    return out;
  };
  const rupiah = (n) => 'Rp' + String(Math.round(+n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const namaMobil = (m) => ((m.merek && m.merek !== 'Bus' ? `${m.merek} ${m.model}` : m.model) || '(mobil baru)');
  const kelasNama = (id) => ((S.isi.kelas.find((k) => k.id === id) || {}).label || 'Tanpa kelas');
  const mobilSlug = (sl) => S.isi.armada.find((m) => m.slug === sl);
  const namaSlug = (sl) => { const m = mobilSlug(sl); return m ? namaMobil(m) : 'mobil sudah dihapus'; };
  const fotoSlug = (sl) => (mobilSlug(sl) || {}).foto || '';

  // ------------------------------------------------------------------ jalur isi ("armada.3.harga")
  const bagianDari = (p) => p.split('.')[0];
  const ambil = (p) => (p ? p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), S.isi) : S.isi);
  function tetapkan(p, v) {
    const ks = p.split('.'), akhir = ks.pop();
    const o = ks.reduce((o, k) => o[k], S.isi);
    if (o[akhir] === v) return false;
    o[akhir] = v;
    tandai(bagianDari(p));
    return true;
  }
  const kunciItem = (p, x, i) => p + '#' + ((x && (x.id || x.kunci)) || i);

  // ------------------------------------------------------------------ simpan otomatis
  const KERJA = {};
  function tandai(b) {
    const k = KERJA[b] || (KERJA[b] = { t: 0, jalan: false, lagi: false, kotor: false, gagal: false });
    clearTimeout(k.t);
    k.kotor = true;
    k.t = setTimeout(() => simpan(b), 650);
    statusSimpan();
  }
  async function simpan(b) {
    const k = KERJA[b];
    clearTimeout(k.t);
    if (k.jalan) { k.lagi = true; return; }
    k.jalan = true; k.kotor = false; k.gagal = false;
    statusSimpan();
    try {
      const d = await api('isi/' + b, { method: 'PUT', body: { isi: S.isi[b], rev: S.rev[b] || 0 } });
      S.rev[b] = d.rev; S.berubah = d.berubah; S.ubah[b] = { oleh: S.akun.email, pada: Date.now() };
      perbaruiTombolTerbit();
      segarkanDraf();
      pratinjauSegarkan();
    } catch (e) {
      k.gagal = true; k.kotor = true;
      if (e.status === 409 && e.data && e.data.isi) bentrok(b, e.data);
      else if (e.status !== 401) NM.toast(e.message, 'bad');
    } finally {
      k.jalan = false;
      const ulang = k.lagi && !k.gagal;
      k.lagi = false;
      if (ulang) simpan(b);
      statusSimpan();
    }
  }
  function statusSimpan() {
    const el = $('#tb-status');
    if (!el) return;
    const ks = Object.values(KERJA);
    const s = ks.some((k) => k.jalan) ? 'menyimpan' : ks.some((k) => k.gagal) ? 'gagal' : ks.some((k) => k.kotor) ? 'menunggu' : 'tersimpan';
    el.dataset.s = s;
    el.querySelector('span').textContent = { menyimpan: 'Menyimpan…', gagal: 'Gagal menyimpan', menunggu: 'Belum tersimpan', tersimpan: 'Draf tersimpan' }[s];
    el.title = s === 'gagal' ? 'Ketuk untuk mencoba lagi' : '';
  }
  // tunggu semua perubahan tersimpan (sebelum terbit atau keluar)
  async function tuntaskan() {
    Object.entries(KERJA).forEach(([b, k]) => { if ((k.kotor || k.gagal) && !k.jalan) simpan(b); });
    for (let i = 0; i < 150 && Object.values(KERJA).some((k) => k.jalan || (k.kotor && !k.gagal)); i++) await new Promise((r) => setTimeout(r, 100));
    return !Object.values(KERJA).some((k) => k.jalan || k.kotor || k.gagal);
  }
  addEventListener('beforeunload', (e) => { if (Object.values(KERJA).some((k) => k.jalan || k.kotor)) { e.preventDefault(); e.returnValue = ''; } });

  let bentrokBuka = false;
  function bentrok(b, d) {
    if (bentrokBuka) return;
    bentrokBuka = true;
    const s = NM.sheet.open({
      title: 'Ada perubahan dari admin lain', size: 'sm',
      body: `<p class="lead">Bagian <b>${esc(LABEL[b] || b)}</b> baru saja diubah oleh <b>${esc(d.oleh || 'admin lain')}</b>. Pilih isi mana yang dipakai.</p><p class="hint" style="margin-top:10px">“Pakai punya saya” menimpa perubahan mereka di bagian ini.</p>`,
      foot: '<button type="button" class="btn ghost" data-k="mereka">Pakai versi mereka</button><button type="button" class="btn dark" data-k="saya">Pakai punya saya</button>',
      onClose: () => { bentrokBuka = false; },
    });
    s.querySelector('[data-k=mereka]').onclick = () => {
      S.isi[b] = d.isi; S.rev[b] = d.rev;
      Object.assign(KERJA[b], { kotor: false, gagal: false });
      NM.sheet.close(true); render(); statusSimpan(); pratinjauSegarkan();
    };
    s.querySelector('[data-k=saya]').onclick = () => { S.rev[b] = d.rev; KERJA[b].gagal = false; NM.sheet.close(); simpan(b); };
  }

  function perbaruiTombolTerbit() {
    const b = $('#tb-terbit');
    if (!b) return;
    const n = S.berubah.length;
    b.dataset.n = String(n);
    b.querySelector('em').textContent = String(n);
    b.setAttribute('aria-label', n ? `Terbitkan ${n} perubahan` : 'Tidak ada perubahan untuk diterbitkan');
  }
  // kartu yang menunjukkan isi draf (Dasbor, Riwayat) ikut segar setiap draf tersimpan, juga saat usulan asisten
  // diterapkan sementara Dasbor terbuka
  function segarkanDraf() {
    const a = $('[data-draf=status]');
    if (a) a.outerHTML = kartuStatus();
    const k = $('[data-draf=kartu]');
    if (k) k.outerHTML = kartuDraf();
  }

  // ------------------------------------------------------------------ pratinjau situs (draf) di samping isian
  const PV = { mode: lsGet('twh-admin-pv') === 'laptop' ? 'laptop' : 'hp', ke: '' };
  function pvHTML(path) {
    return `<div class="pv" data-pv="${esc(path)}">
      <div class="pv-bar"><b><i></i>Pratinjau draf</b><div class="pv-alat">
        <div class="seg sm" data-pv-mode>${[['hp', 'smartphone', 'HP'], ['laptop', 'monitor', 'Laptop']].map(([v, i, l]) => `<button type="button" class="${PV.mode === v ? 'on' : ''}" data-v="${v}" aria-pressed="${PV.mode === v}">${ic(i)}<span>${l}</span></button>`).join('')}</div>
        <button type="button" class="icon-btn sm" data-aksi="pv-muat" aria-label="Muat ulang pratinjau">${ic('refresh')}</button>
        <a class="icon-btn sm" href="/admin/pratinjau${esc(path)}" target="_blank" rel="noopener" aria-label="Buka pratinjau di tab baru">${ic('ext')}</a>
      </div></div>
      <div class="pv-layar memuat-ulang"><iframe src="/admin/pratinjau${esc(path)}" title="Pratinjau situs (draf, belum terbit)"></iframe></div>
    </div>`;
  }
  const roPv = new ResizeObserver((es) => es.forEach((e) => ukurPv(e.target)));
  function ukurPv(layar) {
    const f = layar.querySelector('iframe');
    if (!f) return;
    const W = layar.clientWidth, H = layar.clientHeight;
    if (!W || !H) return;
    const lebar = PV.mode === 'hp' ? 390 : 1280;
    const s = Math.min(1, W / lebar);
    f.style.width = lebar + 'px';
    f.style.height = Math.ceil(H / s) + 'px';
    f.style.transform = `translateX(-50%) scale(${s})`;
  }
  function pasangPv(root) {
    $$('.pv-layar', root).forEach((l) => {
      if (l._pasang) return;
      l._pasang = true;
      roPv.observe(l);
      ukurPv(l);
      const f = l.querySelector('iframe');
      // setelah dimuat ulang, posisi gulir dipulihkan oleh app.js situs (tidak ditarik ke bagian lagi)
      f.addEventListener('load', () => l.classList.remove('memuat-ulang'));
    });
  }
  let tPv = 0;
  function pratinjauSegarkan() {
    clearTimeout(tPv);
    tPv = setTimeout(() => {
      $$('.pv-layar iframe').forEach((f) => {
        f.parentNode.classList.add('memuat-ulang');
        try { f.contentWindow.location.reload(); } catch (e) { f.src = f.src; }
      });
    }, 250);
  }
  // gulirkan pratinjau ke bagian yang sedang diubah (pertama kali bagian itu disentuh)
  function pvKe(sel, paksa) {
    if (!sel || (!paksa && sel === PV.ke)) return;
    PV.ke = sel;
    $$('.pv-layar iframe').forEach((f) => { try { f.contentWindow.postMessage({ ke: sel }, location.origin); } catch (e) { /* belum siap */ } });
  }
  function bukaPratinjau(path, ke) {
    NM.sheet.open({
      title: 'Pratinjau draf', sub: 'Belum terlihat pengunjung sampai diterbitkan', size: 'lg', cls: 'lembar-pv', body: pvHTML(path),
      onMount: (s) => {
        pasangPv(s);
        if (ke) { const f = $('iframe', s); f.addEventListener('load', () => { try { f.contentWindow.postMessage({ ke }, location.origin); } catch (e) { /* abaikan */ } }, { once: true }); }
      },
    });
  }

  // ------------------------------------------------------------------ deskripsi isian
  const T = (p, l, o) => ({ t: 'teks', p, l, ...o });
  const P = (p, l, o) => ({ t: 'paragraf', p, l, ...o });
  const FT = (p, l = 'Foto', o) => ({ t: 'foto', p, l, ...o });
  const FS = (p, l = 'Foto', o) => ({ t: 'fotos', p, l, ...o });
  const PL = (p, l, opsi, o) => ({ t: 'pilih', p, l, opsi, ...o });
  const DF = (p, l, o) => ({ t: 'daftar', p, l, ...o });
  const TG = (p, l, o) => ({ t: 'tag', p, l, ...o });
  const SK = (p, l, o) => ({ t: 'sakelar', p, l, ...o });
  const TL = (p, l, o) => ({ t: 'tanggal', p, l, ...o });
  const BR = (...isi) => ({ t: 'baris', isi });
  const CT = (l, o) => ({ t: 'catatan', l, ...o });
  const KL = (p, l, isi) => ({ t: 'kelompok', p, l, isi });
  const N = (p, l, o) => ({ t: 'angka', p, l, ...o });

  const DL = {}; // jalur daftar → deskripsinya (dipakai tombol dan judul)
  const TERBUKA = new Set();
  const CARI = {};
  const jalur = (base, p) => (base ? base + '.' + p : p);
  const idDari = (p) => 'f-' + p.replace(/\./g, '-');
  const hitungHTML = (p, v, n) => { const l = String(v || '').length; return `<small class="hint hitung${l > n ? ' lebih' : ''}" data-hitung="${esc(p)}" data-n="${n}">${l} / ${n} huruf</small>`; };

  function isian(d, base = '') {
    if (d.jika && !d.jika(ambil(base))) return '';
    if (d.t === 'baris') return `<div class="grid2">${d.isi.map((x) => isian(x, base)).join('')}</div>`;
    if (d.t === 'catatan') return `<div class="catatan${d.warn ? ' warn' : ''}">${ic(d.warn ? 'alert' : 'info')}<span>${typeof d.l === 'function' ? d.l(ambil(base)) : d.l}</span></div>`;
    const p = jalur(base, d.p), v = ambil(p), id = idDari(p);
    const pil = { hint: d.hint, opt: d.opt };
    switch (d.t) {
      case 'teks': {
        const inp = `<input type="${d.jenis || 'text'}" id="${id}" data-p="${esc(p)}" value="${esc(v ?? '')}"${d.ph ? ` placeholder="${esc(d.ph)}"` : ''}${d.maks ? ` maxlength="${d.maks}"` : ''}${d.im ? ` inputmode="${d.im}"` : ''}${d.normal ? ` data-normal="${d.normal}"` : ''} autocomplete="off">`;
        return F.field(d.l, inp + (d.hitung ? hitungHTML(p, v, d.hitung) : ''), pil);
      }
      case 'paragraf':
        return F.field(d.l, `<textarea id="${id}" data-p="${esc(p)}" rows="${d.baris || 3}"${d.ph ? ` placeholder="${esc(d.ph)}"` : ''}${d.maks ? ` maxlength="${d.maks}"` : ''}>${esc(v ?? '')}</textarea>` + (d.hitung ? hitungHTML(p, v, d.hitung) : ''), pil);
      case 'pilih': {
        const ops = typeof d.opsi === 'function' ? d.opsi() : d.opsi;
        const ada = ops.some((o) => String(o.v) === String(v ?? ''));
        const semua = ada || v == null || v === '' ? ops : [{ v, l: `${v} (tidak ada di daftar)` }, ...ops];
        return F.field(d.l, `<div class="sel"><select id="${id}" data-p="${esc(p)}"${d.segar ? ' data-segar' : ''}>${semua.map((o) => `<option value="${esc(o.v)}"${String(o.v) === String(v ?? '') ? ' selected' : ''}>${esc(o.l)}</option>`).join('')}</select>${ic('down')}</div>`, pil);
      }
      case 'sakelar': {
        const on = v == null ? !!d.bawaan : !!v;
        return `<label class="sw-row"><span><b>${d.l}</b>${d.hint ? `<small>${d.hint}</small>` : ''}</span><input type="checkbox" class="sw" data-p="${esc(p)}"${on ? ' checked' : ''}${d.kunci && d.kunci() ? ' disabled' : ''}></label>`;
      }
      case 'tanggal':
        return `<div class="field"><label class="lbl" for="${id}">${d.l}${d.opt ? ' <em>(boleh kosong)</em>' : ''}</label><div class="tgl-baris"><input type="date" id="${id}" data-p="${esc(p)}" value="${esc(v || '')}">${d.opt ? `<button type="button" class="btn ghost sm" data-aksi="tgl-kosong" data-p="${esc(p)}">Kosongkan</button>` : ''}</div>${d.hint ? `<small class="hint">${d.hint}</small>` : ''}</div>`;
      case 'foto':
        return `<div class="field"><span class="lbl">${d.l}${d.opt ? ' <em>(boleh kosong)</em>' : ''}</span>${fotoKotak(p, v, d)}${d.hint ? `<small class="hint">${d.hint}</small>` : ''}</div>`;
      case 'fotos': {
        const xs = Array.isArray(v) ? v : [];
        return `<div class="field"><span class="lbl">${d.l}</span><div class="ffs">${xs.map((f, i) => `<div class="ffs-i">${fotoUrl(f) ? `<img src="${esc(fotoUrl(f))}" alt="${esc(fotoNama(f))}" loading="lazy">` : ''}${i === 0 ? '<span class="sampul">Sampul</span>' : ''}${tandaVidNama(f)}<div class="ffs-alat">${i > 0 ? `<button type="button" data-aksi="fotos-kiri" data-p="${esc(p)}" data-i="${i}" aria-label="Geser ke depan">${ic('left')}</button>` : ''}<button type="button" data-aksi="fotos-ganti" data-p="${esc(p)}" data-i="${i}" aria-label="Ganti foto ini">${ic('edit')}</button><button type="button" data-aksi="fotos-hapus" data-p="${esc(p)}" data-i="${i}" aria-label="Lepas foto ini">${ic('x')}</button></div></div>`).join('')}<button type="button" class="ffs-tambah" data-aksi="fotos-tambah" data-p="${esc(p)}">${ic('plus')}<span>Tambah foto/video</span></button></div>${d.hint ? `<small class="hint">${d.hint}</small>` : ''}</div>`;
      }
      case 'tag':
        return `<div class="field"><label class="lbl" for="${id}">${d.l}</label><div class="tg" data-tg="${esc(p)}">${chipTag(p, v)}<input type="text" id="${id}" data-tag="${esc(p)}" placeholder="${esc(d.ph || 'Ketik lalu tekan Enter')}" autocomplete="off" enterkeyhint="done"></div>${d.hint ? `<small class="hint">${d.hint}</small>` : ''}</div>`;
      case 'angka':
        return F.field(d.l, `<input type="text" inputmode="numeric" id="${id}" data-p="${esc(p)}" data-angka value="${esc(v ?? '')}"${d.ph ? ` placeholder="${esc(d.ph)}"` : ''}${d.segar ? ' data-segar' : ''} autocomplete="off">${d.rp ? `<small class="hint rp" data-rp="${esc(p)}">${esc(rupiah(v))} per hari</small>` : ''}`, pil);
      case 'lampu': {
        const m = ambil(base) || {}, url = fotoUrl(m.foto, true), xs = Array.isArray(v) ? v : [];
        return `<div class="field"><span class="lbl">${d.l}</span>${url ? `<div class="lampu" data-lampu="${esc(p)}"><img src="${esc(url)}" alt="" draggable="false">${xs.map((t, i) => `<i style="left:${t[0] * 100}%;top:${t[1] * 100}%">${i + 1}</i>`).join('')}</div><div class="lampu-bar"><small class="hint">${xs.length === 2 ? 'Dua titik lampu terpasang. Ketuk foto untuk memasang ulang.' : 'Ketuk lampu depan yang dekat, lalu yang jauh.'}</small>${xs.length ? `<button type="button" class="btn ghost sm" data-aksi="lampu-hapus" data-p="${esc(p)}">Hapus titik</button>` : ''}</div>` : '<small class="hint">Pasang fotonya dulu.</small>'}${d.hint ? `<small class="hint">${d.hint}</small>` : ''}</div>`;
      }
      case 'daftar':
        return daftarHTML(d, p);
      case 'kelompok':
        return `<div class="klp"><b>${d.l}</b>${d.isi.map((x) => isian(x, p)).join('')}</div>`;
    }
    return '';
  }
  const chipTag = (p, v) => (Array.isArray(v) ? v : []).map((t, i) => `<span class="tg-i"><span>${esc(t)}</span><button type="button" data-aksi="tag-hapus" data-p="${esc(p)}" data-i="${i}" aria-label="Hapus ${esc(t)}">${ic('x')}</button></span>`).join('');
  function fotoKotak(p, v, d = {}) {
    const url = fotoUrl(v);
    return `<div class="ff"><span class="ff-gb">${url ? `<img src="${esc(url)}" alt="" loading="lazy">` : ic('image', 'foto-kosong-ic')}${tandaVidNama(v)}</span><span class="ff-ket"><b>${v ? esc(fotoNama(v)) : 'Belum ada foto'}</b><small>${v ? (v.startsWith('m/') ? (mediaVideo(v) ? 'Video unggahan' : 'Foto unggahan') : 'Foto bawaan situs') : d.opt ? 'Boleh dibiarkan kosong' : 'Pilih satu foto'}</small></span><span class="ff-tb"><button type="button" class="btn light sm" data-aksi="foto-ganti" data-p="${esc(p)}">${ic('image')}<span>${v ? 'Ganti' : 'Pilih foto'}</span></button>${v && d.opt ? `<button type="button" class="btn ghost sm" data-aksi="foto-hapus" data-p="${esc(p)}">Kosongkan</button>` : ''}</span></div>`;
  }

  // daftar yang bisa dibuka-tutup: isi tiap butir baru digambar saat dibuka
  function cocokCari(d, x, i, q) {
    if (!q) return true;
    return `${d.judul(x, i) || ''} ${d.sub ? d.sub(x, i).replace(/<[^>]+>/g, '') : ''}`.toLowerCase().includes(q);
  }
  function daftarHTML(d, p) {
    DL[p] = d;
    const xs = ambil(p) || [];
    const urut = d.urut !== false;
    const urutan = d.susun ? d.susun(xs) : xs.map((_, i) => i);
    const q = (CARI[p] || '').toLowerCase();
    const items = urutan.map((i, pos) => {
      const x = xs[i], k = kunciItem(p, x, i), buka = TERBUKA.has(k);
      const gb = d.gambar ? d.gambar(x) : null, url = gb ? fotoUrl(gb) : '';
      const sub = d.sub ? d.sub(x, i) : '';
      return `<details class="dl-i" data-dl-i="${esc(p)}" data-i="${i}" data-kunci="${esc(k)}"${buka ? ' open' : ''}${cocokCari(d, x, i, q) ? '' : ' hidden'}>
        <summary>${urut ? `<span class="dl-seret" data-aksi="seret" data-p="${esc(p)}" data-i="${i}" role="button" tabindex="0" aria-label="Tarik untuk memindah ${esc(d.judul(x, i) || 'butir ini')} (atau panah atas/bawah)" title="Tarik untuk memindah">${ic('grip')}</span>` : ''}${d.gambar ? `<span class="dl-gb">${url ? `<img src="${esc(url)}" alt="" loading="lazy">` : ic('image')}</span>` : `<span class="dl-no">${pos + 1}</span>`}<span class="dl-t"><b>${esc(d.judul(x, i) || '(belum diisi)')}</b>${sub ? `<small>${sub}</small>` : ''}</span><span class="dl-alat">${urut ? `<button type="button" class="naik" data-aksi="naik" data-p="${esc(p)}" data-i="${i}" aria-label="Pindah ke atas"${i === 0 ? ' disabled' : ''}>${ic('arrowUp')}</button><button type="button" class="turun" data-aksi="turun" data-p="${esc(p)}" data-i="${i}" aria-label="Pindah ke bawah"${i === xs.length - 1 ? ' disabled' : ''}>${ic('arrowDown')}</button>` : ''}<button type="button" class="hapus-cepat" data-aksi="hapus" data-p="${esc(p)}" data-i="${i}" aria-label="Hapus ${esc(d.judul(x, i) || 'butir ini')}" title="Hapus">${ic('trash')}</button><span class="dl-buka" aria-hidden="true">${ic('down')}</span></span></summary>
        <div class="dl-isi">${buka ? isiItem(d, p, i) : ''}</div>
      </details>`;
    }).join('');
    const cari = d.cari ? `<div class="dl-cari cari-in">${ic('search')}<input type="search" data-cari="${esc(p)}" value="${esc(CARI[p] || '')}" placeholder="Cari di daftar ini" aria-label="Cari di daftar ini"></div>` : '';
    const tambah = d.maks && xs.length >= d.maks ? '' : `<button type="button" class="dl-tambah" data-aksi="tambah" data-p="${esc(p)}">${ic('plus')}<span>${d.tambah || 'Tambah'}</span></button>`;
    return `<div class="field dl-wrap">${d.l ? `<span class="lbl">${d.l}</span>` : ''}${cari}<div class="dl${urut && q ? ' dicari' : ''}" data-dl="${esc(p)}">${d.diAtas ? tambah : ''}${items || `<div class="dl-kosong">${d.kosong || 'Belum ada isi.'}</div>`}${d.diAtas ? '' : tambah}</div>${d.hint ? `<small class="hint">${d.hint}</small>` : ''}</div>`;
  }
  const isiItem = (d, p, i) => d.item.map((f) => isian(f, p + '.' + i)).join('') + `<div class="dl-kaki"><span class="hint">${d.ketItem ? d.ketItem(ambil(p)[i]) : ''}</span><button type="button" class="btn ghost sm danger" data-aksi="hapus" data-p="${esc(p)}" data-i="${i}">${ic('trash')}<span>Hapus</span></button></div>`;
  function perbaruiJudul(det) {
    const lp = det.dataset.dlI, i = +det.dataset.i, d = DL[lp], x = (ambil(lp) || [])[i];
    if (!d || !x) return;
    const sm = det.querySelector(':scope > summary');
    sm.querySelector('.dl-t b').textContent = d.judul(x, i) || '(belum diisi)';
    const s = sm.querySelector('.dl-t small');
    if (s && d.sub) s.innerHTML = d.sub(x, i);
    if (d.gambar) { const url = fotoUrl(d.gambar(x)); sm.querySelector('.dl-gb').innerHTML = url ? `<img src="${esc(url)}" alt="">` : ic('image'); }
  }

  // kartu kelompok isian (satu bagian halaman)
  const kartu = (g) => `<section class="card grp"${g.ke ? ` data-ke="${esc(g.ke)}"` : ''}${g.id ? ` id="${g.id}"` : ''}><header class="card-head"><div><h3>${g.j}</h3>${g.s ? `<p>${g.s}</p>` : ''}</div>${g.ke ? `<button type="button" class="grp-lihat" data-aksi="pv-ke" data-ke="${esc(g.ke)}">${ic('eye')}<span>Lihat di pratinjau</span></button>` : ''}</header><div class="grp-isi">${g.f.map((f) => isian(f)).join('')}</div></section>`;

  // ------------------------------------------------------------------ kerangka halaman
  function tabRute(base, opsi, sub) {
    return `<div class="seg tabs" role="tablist">${opsi.map((o) => `<button type="button" role="tab" aria-selected="${o.v === sub}" class="${o.v === sub ? 'on' : ''}" data-go="#/${base}/${o.v}">${o.ic ? ic(o.ic) : ''}<span>${o.l}</span>${o.n != null ? `<em class="cnt">${o.n}</em>` : ''}</button>`).join('')}</div>`;
  }
  // halaman penyunting: isian di kiri, pratinjau situs di kanan. Di layar sempit pratinjau tidak dimuat sama sekali
  // (situsnya berat untuk HP); tombol Pratinjau membukanya di lembar.
  const LEBAR_PV = matchMedia('(min-width: 1280px)');
  LEBAR_PV.addEventListener('change', () => { if (S.isi && $('#page') && !NM.sheet.open_) render(); });
  function halamanEd({ judul, sub, kanan = '', tab = '', form, pv }) {
    LAYAR.form = form;
    LAYAR.pv = pv;
    const samping = pv && LEBAR_PV.matches;
    const tombolPv = pv ? `<button type="button" class="btn light pv-tombol" data-aksi="pv-lembar" data-path="${esc(pv)}">${ic('eye')}<span>Pratinjau</span></button>` : '';
    return UI.head({ title: judul, sub, right: tombolPv + kanan }) + tab +
      `<div class="ed2${samping ? '' : ' tanpa-pv'}"><div class="ed-form form" id="ed-form">${form()}</div>${samping ? `<aside class="ed-pv" aria-label="Pratinjau situs">${pvHTML(pv)}</aside>` : ''}</div>`;
  }
  function segarkan(el) {
    const f = $('#ed-form');
    if (f && LAYAR.form) { f.innerHTML = LAYAR.form(); return; }
    render();
  }

  // ------------------------------------------------------------------ halaman & teks
  const ISIAN = 'Isian otomatis: {jumlah} = jumlah mobil yang tampil, {termurah} = harga termurah, {harga:toyota-avanza} = harga satu mobil (alamat halamannya), {unit:jakarta} = unit satu kota, {totalUnit} = unit semua kota.';
  const seo = (k) => ({ j: 'Judul tab & Google', s: 'Tampil di tab peramban, hasil Google, dan saat tautan dibagikan', f: [T(`halaman.${k}.judul`, 'Judul', { hitung: 60, maks: 140 }), P(`halaman.${k}.deskripsi`, 'Deskripsi', { hitung: 160, maks: 320, baris: 3, hint: ISIAN }), T(`halaman.${k}.og`, 'Kalimat gambar bagikan', { maks: 120, hint: 'Kalimat pendek tentang gambar saat tautan dibagikan (dibacakan pembaca layar).' })] });
  const opsiMobil = (kosong) => [...(kosong ? [{ v: '', l: kosong }] : []), ...S.isi.armada.map((m) => ({ v: m.slug, l: `${namaMobil(m)}${m.tampil === false ? ' (disembunyikan)' : ''}` }))];
  const pertamaTampil = (xs) => (xs.find((x) => x.tampil !== false) || xs[0] || {}).slug || '';

  const HAL = {
    beranda: { l: 'Beranda', pv: '/', g: () => [
      { j: 'Pembuka', s: 'Bagian paling atas, bersama panggung mobil', ke: '#atas', f: [T('beranda.label', 'Tulisan kecil di atas judul'), BR(T('beranda.judul1', 'Judul baris 1'), T('beranda.judul2', 'Judul baris 2')), P('beranda.teks', 'Teks pembuka', { baris: 3 }), T('beranda.tautan', 'Tautan ke halaman Armada'), T('beranda.petunjuk', 'Petunjuk di bawah mobil'), CT('Mobil di panggung dipilih di menu <a class="link" href="#/armada">Armada & harga</a> (isian “Urutan di panggung beranda”). Tombol pesan diatur di Pengaturan › Identitas.')] },
      { j: 'Kalimat besar', ke: '.pernyataan', f: [P('beranda.pernyataan', 'Kalimat', { baris: 3 })] },
      { j: 'Armada', s: 'Kartu mobil yang bisa digeser', ke: '#armada', f: [T('beranda.armadaJudul', 'Judul', { hint: ISIAN }), P('beranda.armadaTeks', 'Teks', { baris: 2 }), T('beranda.armadaTautan', 'Tulisan tautan'), T('beranda.armadaSemua', 'Tulisan kartu terakhir')] },
      { j: 'Layanan', ke: '#layanan', f: [T('beranda.layananJudul', 'Judul'), P('beranda.layananTeks', 'Teks', { baris: 2 }), CT('Daftar layanan diatur di menu <a class="link" href="#/layanan">Layanan</a>.')] },
      { j: 'Cara sewa singkat', ke: '#judul-cara', f: [T('beranda.caraJudul', 'Judul'), P('beranda.caraTeks', 'Teks', { baris: 2 }), T('beranda.caraTautan', 'Tulisan tautan'), CT('Langkah-langkahnya diatur di menu <a class="link" href="#/cara">Cara sewa & FAQ</a>.')] },
      { j: 'Kota', ke: '#kota', f: [T('beranda.kotaJudul', 'Judul', { hint: ISIAN }), P('beranda.kotaTeks', 'Teks', { baris: 2 })] },
      { j: 'Ulasan', ke: '#judul-ulasan', f: [T('beranda.ulasanJudul', 'Judul'), CT('Angka, rating, dan ulasan diatur di menu <a class="link" href="#/ulasan">Ulasan & angka</a>.')] },
      seo('beranda'),
    ] },
    armada: { l: 'Armada', pv: '/armada/', g: () => [
      { j: 'Bagian atas', ke: '#atas', f: [T('armadaHal.judul', 'Judul besar'), P('armadaHal.teks', 'Teks pembuka', { baris: 3, hint: ISIAN }), PL('armadaHal.mobil', 'Mobil di samping judul', () => opsiMobil('Tanpa mobil'))] },
      { j: 'Pemilih jumlah penumpang', ke: '#penumpang', f: [T('armadaHal.penumpangJudul', 'Judul'), T('armadaHal.penumpangTeks', 'Teks')] },
      { j: 'Daftar dan tabel harga', ke: '#daftar', f: [T('armadaHal.daftarJudul', 'Judul daftar'), T('armadaHal.hargaJudul', 'Judul tabel harga'), P('armadaHal.hargaKet', 'Keterangan tabel', { baris: 2 }), P('armadaHal.catatan1', 'Catatan di bawah tabel', { baris: 2 }), T('armadaHal.catatan2', 'Catatan kedua (bertanda centang)'), CT('Mobil dan harganya diatur di menu <a class="link" href="#/armada">Armada & harga</a>.')] },
      seo('armada'),
    ] },
    layanan: { l: 'Layanan', pv: '/layanan/', g: () => [
      { j: 'Bagian atas', ke: '#atas', f: [T('layananHal.judul', 'Judul besar'), P('layananHal.teks', 'Teks pembuka', { baris: 3 }), PL('layananHal.mobil', 'Mobil di samping judul', () => opsiMobil('Tanpa mobil')), CT('Daftar layanan diatur di menu <a class="link" href="#/layanan">Layanan</a>.')] },
      seo('layanan'),
    ] },
    'cara-sewa': { l: 'Cara sewa', pv: '/cara-sewa/', g: () => [
      { j: 'Bagian atas', ke: '#atas', f: [T('caraHal.judul', 'Judul besar'), P('caraHal.teks', 'Teks pembuka', { baris: 3 }), PL('caraHal.mobil', 'Mobil di samping judul', () => opsiMobil('Tanpa mobil'))] },
      { j: 'Judul bagian', ke: '#judul-langkah', f: [T('caraHal.langkahJudul', 'Judul langkah'), T('caraHal.syaratJudul', 'Judul dokumen'), P('caraHal.syaratTeks', 'Teks dokumen', { baris: 2 }), T('caraHal.bayarJudul', 'Judul cara bayar'), P('caraHal.bayarTeks', 'Teks cara bayar', { baris: 2 }), T('caraHal.faqJudul', 'Judul pertanyaan'), CT('Langkah, dokumen, cara bayar, dan pertanyaannya diatur di menu <a class="link" href="#/cara">Cara sewa & FAQ</a>.')] },
      seo('cara-sewa'),
    ] },
    lokasi: { l: 'Lokasi', pv: '/lokasi/', g: () => [
      { j: 'Bagian atas', ke: '#atas', f: [T('lokasiHal.judul', 'Judul besar'), P('lokasiHal.teks', 'Teks pembuka', { baris: 3, hint: ISIAN }), PL('lokasiHal.mobil', 'Mobil di samping judul', () => opsiMobil('Tanpa mobil'))] },
      { j: 'Peta dan garasi', ke: '#judul-peta', f: [T('lokasiHal.petaJudul', 'Judul peta'), T('lokasiHal.garasiJudul', 'Judul garasi'), T('lokasiHal.garasiTeks', 'Teks garasi', { hint: 'Ditulis setelah jam layanan.' }), BR(T('lokasiHal.tombolMaps', 'Tombol Google Maps'), T('lokasiHal.tautanKontak', 'Tautan ke Kontak')), CT('Kota diatur di menu <a class="link" href="#/kota">Kota</a>; alamat garasi di Pengaturan › Kontak.')] },
      seo('lokasi'),
    ] },
    kontak: { l: 'Kontak', pv: '/kontak/', g: () => [
      { j: 'Bagian atas', ke: '#atas', f: [T('kontakHal.judul', 'Judul besar', { hint: 'Juga judul lembar pesan di semua halaman.' }), P('kontakHal.teks', 'Teks pembuka', { baris: 3 }), T('kontakHal.petaJudul', 'Judul peta'), CT('Nomor, alamat, dan jam diatur di <a class="link" href="#/pengaturan/kontak">Pengaturan › Kontak</a>.')] },
      seo('kontak'),
    ] },
    mobil: { l: 'Halaman mobil', pv: () => `/armada/${pertamaTampil(S.isi.armada)}/`, g: () => [
      { j: 'Tulisan di setiap halaman mobil', s: '{nama} dan {model} = mobil halaman itu', ke: '#judul-spek', f: [T('mobilHal.tentangJudul', 'Judul penjelasan'), T('mobilHal.cocokJudul', 'Judul cocok untuk'), T('mobilHal.penyerahan', 'Penyerahan (di daftar spesifikasi)'), T('mobilHal.caraJudul', 'Judul cara sewa'), P('mobilHal.caraTeks', 'Teks cara sewa', { baris: 2 }), T('mobilHal.caraTautan', 'Tulisan tautan'), T('mobilHal.lainJudul', 'Judul pilihan lain'), CT('Judul dan deskripsi Google tiap mobil diatur di menu <a class="link" href="#/armada">Armada & harga</a>.')] },
    ] },
    kota: { l: 'Halaman kota', pv: () => `/sewa-mobil-${(S.isi.kota[0] || {}).slug || 'jakarta'}/`, g: () => [
      { j: 'Tulisan di setiap halaman kota', s: '{kota} dan {unit} = kota halaman itu', ke: '#judul-antar', f: [T('kotaHal.antarJudul', 'Judul antar'), T('kotaHal.biaya', 'Catatan biaya antar'), T('kotaHal.armadaJudul', 'Judul armada'), P('kotaHal.armadaTeks', 'Teks armada', { baris: 2 }), T('kotaHal.caraJudul', 'Judul cara sewa'), T('kotaHal.caraTautan', 'Tulisan tautan'), T('kotaHal.lainJudul', 'Judul kota lain'), CT('Isi tiap kota diatur di menu <a class="link" href="#/kota">Kota</a>.')] },
    ] },
    kaki: { l: 'Ajakan bawah', pv: '/kontak/', g: () => [
      { j: 'Ajakan di bawah setiap halaman', s: 'Bersama gantungan kunci yang bisa digoyang', ke: '#ajakan', f: [T('kaki.judul', 'Judul'), P('kaki.teks', 'Teks', { baris: 2 }), T('kaki.tautan', 'Tautan ke formulir'), T('kaki.petunjuk', 'Petunjuk kecil'), CT('Tombol WhatsApp diatur di Pengaturan › Identitas.')] },
    ] },
  };
  const pvDari = (h) => (typeof h.pv === 'function' ? h.pv() : h.pv);

  function pHalaman(sub) {
    const k = HAL[sub] ? sub : 'beranda', h = HAL[k];
    return halamanEd({
      judul: 'Halaman & teks', sub: 'Semua tulisan di tiap halaman. Tersimpan otomatis sebagai draf.',
      tab: tabRute('halaman', Object.entries(HAL).map(([v, x]) => ({ v, l: x.l })), k),
      pv: pvDari(h), form: () => h.g().map(kartu).join(''),
    });
  }

  // ------------------------------------------------------------------ armada
  async function tanya({ judul, label, ph = '', ok = 'Simpan', nilai = '', jenis = 'text', hint = '' }) {
    return new Promise((selesai) => {
      let hasil = null;
      const s = NM.sheet.open({
        title: judul, size: 'sm',
        body: `<form class="form" data-tanya novalidate>${F.field(label, `<input type="${jenis}" name="v" value="${esc(nilai)}" placeholder="${esc(ph)}" autocomplete="off" required autofocus>`, { hint })}</form>`,
        foot: `<button type="button" class="btn ghost" data-close>Batal</button><button type="button" class="btn dark" data-ok>${ok}</button>`,
        onClose: () => selesai(hasil),
      });
      const f = s.querySelector('form'), inp = f.querySelector('input');
      const kirim = () => { const v = inp.value.trim(); if (!v) return F.err(f, 'Isi dulu, ya.'); hasil = v; NM.sheet.close(); };
      f.onsubmit = (e) => { e.preventDefault(); kirim(); };
      s.querySelector('[data-ok]').onclick = kirim;
      setTimeout(() => inp.focus(), 80);
    });
  }
  const kunciUnik = (dasar, ada) => { let k = slug(dasar), n = 2; while (ada.has(k)) k = slug(dasar) + '-' + n++; return k; };
  async function tambahMobil() {
    const nama = await tanya({ judul: 'Mobil baru', label: 'Merek dan model', ph: 'cth. Toyota Veloz', ok: 'Tambah', hint: 'Alamat halamannya dibuat dari nama ini dan tidak berubah lagi.' });
    if (!nama) return null;
    const kata = nama.trim().split(/\s+/), dua = kata.length > 1;
    const k = kunciUnik(nama, new Set(S.isi.armada.map((x) => x.slug)));
    NM.toast('Mobil baru disembunyikan dulu. Pasang foto dan harga, lalu nyalakan “Tampilkan di situs”.');
    return { id: k, slug: k, tampil: false, merek: dua ? kata[0] : '', model: dua ? kata.slice(1).join(' ') : kata[0], trim: '', kelas: (S.isi.kelas[0] || {}).id || '', jenis: '', kursi: 7, transmisi: 'Otomatis', harga: 0, foto: '', arah: 'kiri', lampu: [], hero: 0, ringkas: '', isi: '', cocok: [], judulSeo: '', deskripsiSeo: '' };
  }
  const D_ARMADA = () => DF('armada', '', {
    judul: (x) => namaMobil(x),
    sub: (x) => `${esc(kelasNama(x.kelas))} · ${esc(rupiah(x.harga))}/hari${+x.hero > 0 ? ` · panggung ${+x.hero}` : ''}${x.tampil === false ? ' · <span class="t-bad">disembunyikan</span>' : ''}`,
    gambar: (x) => x.foto, ke: () => '#grid-mobil', cari: true,
    tambah: 'Tambah mobil', tambahFn: tambahMobil,
    hapusCek: async (x) => {
      const dipakai = [
        ...S.isi.layanan.filter((l) => l.mobil === x.slug).map((l) => `layanan ${l.judul}`),
        ...S.isi.kota.filter((k) => k.mobil === x.slug).map((k) => `halaman kota ${k.nama}`),
        ...['armadaHal', 'layananHal', 'caraHal', 'lokasiHal'].filter((b) => S.isi[b].mobil === x.slug).map((b) => LABEL[b]),
      ];
      return NM.confirm(`Hapus <b>${esc(namaMobil(x))}</b> dari situs? Halamannya (/armada/${esc(x.slug)}/) ikut hilang.${dipakai.length ? ` Mobil ini juga dipakai di ${esc(dipakai.join(', '))}; bagian itu jadi tanpa mobil sampai diganti.` : ''} Bila hanya ingin menyembunyikan, matikan “Tampilkan di situs”.`, { ok: 'Hapus', tone: 'danger' });
    },
    item: [
      SK('tampil', 'Tampilkan di situs', { bawaan: true, hint: 'Matikan untuk menyembunyikan tanpa menghapus. Halamannya ikut tersembunyi.' }),
      BR(T('merek', 'Merek', { ph: 'cth. Toyota', hint: 'Tulis Bus untuk bus: namanya jadi model saja.' }), T('model', 'Model', { ph: 'cth. Avanza' })),
      BR(T('trim', 'Varian', { ph: 'cth. 1.5 G CVT' }), T('jenis', 'Jenis', { ph: 'cth. MPV, SUV, Minibus' })),
      BR(PL('kelas', 'Kelas (tombol penyaring)', () => S.isi.kelas.map((k) => ({ v: k.id, l: k.label }))), T('transmisi', 'Transmisi', { ph: 'cth. Otomatis' })),
      BR(N('harga', 'Harga sewa per hari', { rp: true }), N('kursi', 'Jumlah kursi')),
      CT('Harga di kartu, tabel, halaman mobil, formulir pesan, dan Google ikut berubah. Teks yang menulis harga sendiri (seperti jawaban FAQ) tidak; tulis {harga:alamat-mobil} di sana supaya ikut.'),
      FT('foto', 'Foto mobil', { hint: 'Foto mobil tanpa latar (PNG transparan), dari samping, seperti foto lain di situs.', segar: true }),
      P('ringkas', 'Ringkasan satu kalimat', { baris: 2 }),
      P('isi', 'Penjelasan', { baris: 4 }),
      TG('cocok', 'Cocok untuk', { ph: 'cth. Liburan keluarga, lalu Enter' }),
      N('hero', 'Urutan di panggung beranda', { segar: true, hint: '0 = tidak tampil di panggung. 1 = mobil pertama yang terlihat. Sebaiknya 3 sampai 6 mobil.' }),
      { ...PL('arah', 'Bagian depan mobil di foto menghadap ke', [{ v: 'kiri', l: 'Kiri' }, { v: 'kanan', l: 'Kanan' }], { hint: 'Di panggung mobil keluar ke arah depannya.' }), jika: (x) => +x.hero > 0 },
      { t: 'lampu', p: 'lampu', l: 'Titik lampu depan', jika: (x) => +x.hero > 0 && !!x.foto, hint: 'Lampu ini berkedip saat mobil di panggung diklik.' },
      T('judulSeo', 'Judul di Google', { opt: true, hitung: 60, maks: 140, ph: 'Kosong = dibuat otomatis dari nama dan harga' }),
      P('deskripsiSeo', 'Deskripsi di Google', { opt: true, hitung: 155, maks: 320, baris: 2, ph: 'Kosong = dibuat otomatis' }),
    ],
    ketItem: (x) => `Halaman mobil ini: /armada/${esc(x.slug)}/`,
  });
  const D_KELAS = () => DF('kelas', '', {
    judul: (x) => x.label, sub: (x) => `${S.isi.armada.filter((m) => m.kelas === x.id).length} mobil`,
    item: [T('label', 'Nama kelas')], tambah: 'Tambah kelas',
    tambahFn: async () => { const nama = await tanya({ judul: 'Kelas baru', label: 'Nama kelas', ph: 'cth. Mobil listrik', ok: 'Tambah' }); return nama ? { id: kunciUnik(nama, new Set(S.isi.kelas.map((k) => k.id))), label: nama } : null; },
    hapusCek: async (x) => {
      const n = S.isi.armada.filter((m) => m.kelas === x.id).length;
      if (n) { NM.toast(`Masih ada ${n} mobil di kelas ini. Pindahkan dulu ke kelas lain.`, 'bad'); return false; }
      return NM.confirm(`Hapus kelas <b>${esc(x.label)}</b>?`, { ok: 'Hapus', tone: 'danger' });
    },
  });
  function pArmada() {
    const n = S.isi.armada.length, tampil = S.isi.armada.filter((x) => x.tampil !== false).length;
    return halamanEd({
      judul: 'Armada & harga', sub: `${tampil} dari ${n} mobil tampil di situs. Ketuk satu mobil untuk mengubah harga, foto, atau teksnya.`, pv: '/armada/',
      kanan: `<button type="button" class="btn dark" data-aksi="tambah" data-p="armada">${ic('plus')}<span>Tambah mobil</span></button>`,
      form: () => kartu({ j: 'Daftar mobil', s: 'Urutan di sini = urutan di situs. Tarik titik-titik di kiri untuk memindah.', ke: '#grid-mobil', f: [D_ARMADA()] }) + kartu({ j: 'Kelas', s: 'Tombol penyaring di halaman Armada', f: [D_KELAS()] }),
    });
  }

  // ------------------------------------------------------------------ kota, layanan, cara sewa, ulasan
  const D_KOTA = () => DF('kota', '', {
    judul: (x) => x.nama, sub: (x) => `${esc(x.unit)} unit${x.garasi ? ' · garasi' : ''}${S.tempat.includes(x.slug) ? '' : ' · tanpa titik di peta'}`,
    ke: () => '#kota', tambah: 'Tambah kota',
    tambahFn: async () => {
      const nama = await tanya({ judul: 'Kota baru', label: 'Nama kota', ph: 'cth. Bandung', ok: 'Tambah', hint: 'Halamannya /sewa-mobil-<nama>/. Titik di peta Jawa hanya ada untuk Jakarta, Malang, dan Surabaya; kota lain tetap punya halaman dan kartu.' });
      if (!nama) return null;
      const k = kunciUnik(nama, new Set(S.isi.kota.map((x) => x.slug)));
      return { id: k, slug: k, nama, unit: 0, garasi: false, mobil: pertamaTampil(S.isi.armada), judul: `Sewa mobil di ${nama}.`, pembuka: '', bandara: [], titik: [], cerita: '', judulSeo: '', deskripsiSeo: '' };
    },
    hapusCek: (x) => NM.confirm(`Hapus <b>${esc(x.nama)}</b>? Halamannya (/sewa-mobil-${esc(x.slug)}/) ikut hilang.`, { ok: 'Hapus', tone: 'danger' }),
    item: [
      BR(T('nama', 'Nama kota'), N('unit', 'Jumlah unit')),
      SK('garasi', 'Ada garasi di kota ini', { hint: 'Halaman kotanya menulis alamat garasi untuk ambil sendiri.' }),
      PL('mobil', 'Mobil di bagian atas halaman kota', () => opsiMobil('Tanpa mobil')),
      T('judul', 'Judul besar'), P('pembuka', 'Teks pembuka', { baris: 3 }),
      TG('bandara', 'Bandara', { ph: 'cth. Bandara Juanda (SUB), lalu Enter' }),
      TG('titik', 'Juga diantar ke', { ph: 'Ketik lalu Enter' }),
      P('cerita', 'Cerita kota', { baris: 4 }),
      T('judulSeo', 'Judul di Google', { opt: true, hitung: 60, maks: 140, ph: 'Kosong = dibuat otomatis' }),
      P('deskripsiSeo', 'Deskripsi di Google', { opt: true, hitung: 155, maks: 320, baris: 2, ph: 'Kosong = dibuat otomatis' }),
    ],
    ketItem: (x) => `Halaman kota ini: /sewa-mobil-${esc(x.slug)}/`,
  });
  function pKota() {
    const unit = S.isi.kota.reduce((n, k) => n + (+k.unit || 0), 0);
    return halamanEd({
      judul: 'Kota', sub: `${S.isi.kota.length} kota, ${unit} unit. Tiap kota punya halaman sendiri.`, pv: '/lokasi/',
      kanan: `<button type="button" class="btn dark" data-aksi="tambah" data-p="kota">${ic('plus')}<span>Tambah kota</span></button>`,
      form: () => kartu({ j: 'Daftar kota', s: 'Urutan di sini = urutan di situs', ke: '#atas', f: [D_KOTA()] }),
    });
  }

  const IKON_LAYANAN = [{ v: 'pesawat', l: 'Pesawat' }, { v: 'cincin', l: 'Cincin' }, { v: 'gedung', l: 'Gedung' }, { v: 'rombongan', l: 'Rombongan' }, { v: 'jalan', l: 'Jalan' }, { v: 'kalender', l: 'Kalender' }];
  const D_LAYANAN = () => DF('layanan', '', {
    judul: (x) => x.judul, sub: (x) => esc(x.mobil ? namaSlug(x.mobil) : 'tanpa mobil'), gambar: (x) => fotoSlug(x.mobil), ke: (x) => '#' + x.id,
    tambah: 'Tambah layanan',
    tambahFn: async () => {
      const judul = await tanya({ judul: 'Layanan baru', label: 'Nama layanan', ph: 'cth. Sewa dengan sopir', ok: 'Tambah' });
      if (!judul) return null;
      return { id: kunciUnik(judul, new Set(S.isi.layanan.map((l) => l.id))), ikon: 'jalan', judul, mobil: pertamaTampil(S.isi.armada), teks: '', wa: judul.toLowerCase() };
    },
    item: [
      T('judul', 'Nama layanan'), PL('ikon', 'Ikon', IKON_LAYANAN), PL('mobil', 'Mobil yang disarankan', () => opsiMobil('Tanpa mobil')),
      P('teks', 'Penjelasan', { baris: 3 }),
      T('wa', 'Kata di pesan WhatsApp', { hint: 'Pesannya: “Halo TWH Rent Car, saya ingin tanya <kata ini>. Untuk tanggal: ”' }),
    ],
  });
  function pLayanan() {
    return halamanEd({
      judul: 'Layanan', sub: `${S.isi.layanan.length} layanan, tampil di beranda dan halaman Layanan.`, pv: '/layanan/',
      kanan: `<button type="button" class="btn dark" data-aksi="tambah" data-p="layanan">${ic('plus')}<span>Tambah layanan</span></button>`,
      form: () => kartu({ j: 'Daftar layanan', s: 'Urutan di sini = urutan di situs', ke: '#atas', f: [D_LAYANAN()] }),
    });
  }

  const D_LANGKAH = () => DF('langkah', '', { judul: (x) => x.judul, item: [T('judul', 'Judul langkah'), P('teks', 'Teks', { baris: 3 })], baru: () => ({ id: idBaru('l'), judul: '', teks: '' }), tambah: 'Tambah langkah', ke: () => '.langkah' });
  const D_SYARAT = () => DF('syarat', '', { judul: (x) => x.nama, sub: (x) => esc(x.teks || ''), item: [T('nama', 'Dokumen'), P('teks', 'Keterangan', { baris: 2 })], baru: () => ({ id: idBaru('s'), nama: '', teks: '' }), tambah: 'Tambah dokumen', ke: () => '#syarat' });
  const D_FAQ = () => DF('faq', '', { judul: (x) => x.tanya, cari: true, item: [T('tanya', 'Pertanyaan'), P('jawab', 'Jawaban', { baris: 4, hint: ISIAN })], baru: () => ({ id: idBaru('q'), tanya: '', jawab: '' }), tambah: 'Tambah pertanyaan', ke: () => '#faq' });
  function pCara() {
    return halamanEd({
      judul: 'Cara sewa & FAQ', sub: 'Langkah sewa, dokumen, cara bayar, dan pertanyaan yang sering ditanyakan.', pv: '/cara-sewa/',
      form: () => kartu({ j: 'Langkah sewa', s: 'Tampil di beranda, halaman Cara sewa, dan setiap halaman mobil dan kota', ke: '#judul-langkah', f: [D_LANGKAH()] }) +
        kartu({ j: 'Dokumen yang disiapkan', ke: '#syarat', f: [D_SYARAT()] }) +
        kartu({ j: 'Cara bayar', ke: '#bayar', f: [TG('situs.bayar', 'Cara bayar', { ph: 'cth. QRIS, lalu Enter' })] }) +
        kartu({ j: 'Pertanyaan yang sering ditanyakan', s: 'Juga dibaca Google sebagai FAQ', ke: '#faq', f: [D_FAQ()] }),
    });
  }

  function pUlasan() {
    return halamanEd({
      judul: 'Ulasan & angka', sub: 'Angka di beranda, rating Google, dan kutipan ulasan pelanggan.', pv: '/',
      form: () => kartu({ j: 'Angka', s: 'Samakan rating dan jumlah ulasan dengan profil Google bisnis', ke: '.angka', f: [BR(N('angka.armada', 'Jumlah armada', { hint: 'Di beranda ditulis dengan tanda +.' }), N('angka.kota', 'Jumlah kota')), BR(T('angka.rating', 'Rating Google', { ph: 'cth. 5,0' }), N('angka.ulasan', 'Jumlah ulasan di Google'))] }) +
        kartu({ j: 'Ulasan pelanggan', s: 'Kutipan dari ulasan Google', ke: '#judul-ulasan', f: [DF('ulasan', '', { judul: (x) => x.nama, sub: (x) => esc(x.mobil ? 'Menyewa ' + x.mobil : ''), item: [T('nama', 'Nama'), T('mobil', 'Mobil yang disewa'), P('teks', 'Ulasan', { baris: 3 })], baru: () => ({ id: idBaru('u'), nama: '', mobil: '', teks: '' }), tambah: 'Tambah ulasan', ke: () => '#judul-ulasan' })] }),
    });
  }

  // ------------------------------------------------------------------ foto
  const zonaUnggah = () => `<label class="unggah" data-zona><input type="file" accept="image/*,.heic,.heif" multiple hidden data-berkas>${ic('upload')}<b>Pilih foto atau tarik ke sini</b><small>Foto JPG, PNG, WebP, atau HEIC (diperkecil otomatis). Foto mobil: PNG tanpa latar (transparan), dari samping, supaya tampil seperti foto lain di situs.</small></label><div class="antre-unggah" data-antre></div>`;
  function kartuMedia(m) {
    const dipakai = m.dipakai || fotoDraf().has(m.id);
    return `<button type="button" class="pf" data-aksi="media-buka" data-id="${esc(m.id)}"><span class="pf-gb pf-mobil"><img src="${esc(fotoUrl('m/' + m.id))}" alt="" loading="lazy"></span>${dipakai ? UI.badge('Dipakai', 'good') : ''}<b>${esc(m.nama || 'Foto unggahan')}</b><small>${ukuranTeks(m)}</small></button>`;
  }
  // ------------------------------------------------------------------ penyimpanan R2 (GET penyimpanan, worker/media.js)
  // ukuran semua berkas di bucket R2 situs ini dan perkiraan biayanya per bulan dalam rupiah (sama dengan kit panel ARSWORD)
  const ukuranBita = (b) => (b >= 1e9 ? `${(b / 1e9).toFixed(2).replace('.', ',')} GB` : b >= 1e6 ? `${(b / 1e6).toFixed(1).replace('.', ',')} MB` : `${Math.round(b / 1e3)} KB`);
  const rpR2 = (n) => 'Rp' + String(Math.round(+n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const rupiahKecil = (n) => (n > 0 && n < 1 ? 'kurang dari Rp1' : rpR2(n));
  async function muatSimpan(segar = false) {
    try { return await api('penyimpanan' + (segar ? '?segar=1' : ''), { diam: true }); } catch (e) { return null; }
  }
  const kartuSimpan = (d) => (d ? `<div class="simpan-r2">
      <div class="sr-angka"><span><small>Terpakai</small><b>${esc(ukuranBita(d.bita))}</b><em>${d.objek} berkas (foto besar dan kecil)</em></span><span><small>Perkiraan biaya</small><b>${esc(rupiahKecil(d.rupiah))}</b><em>per bulan</em></span></div>
      <div class="catatan">${ic('info')}<span>Tarif Cloudflare R2: $${String(d.usdPerGb).replace('.', ',')} per GB per bulan (sekitar ${esc(rpR2(d.rupiahPerGb))} per GB, ${esc(d.kursKet)}: ${esc(rpR2(d.kurs))} per dolar). ${d.gratisGb} GB pertama tiap bulan gratis untuk seluruh akun Cloudflare ARSWORD, dipakai bersama semua situs, jadi ${d.gb < d.gratisGb ? 'situs ini saat ini tidak menambah tagihan' : 'bagian di atas jatah gratis ditagih'}. Membuka foto (data keluar) tidak dikenai biaya.</span></div>
    </div>` : UI.empty('Penyimpanan belum bisa dihitung', 'Coba muat ulang halaman ini.'));
  function pFoto() {
    LAYAR.setelah = async (root) => {
      pasangUnggah(root, () => { const g = $('#pf-unggah'); if (g) g.innerHTML = gridMedia(); muatSimpan(true).then((d) => { const k = $('#pf-simpan'); if (k) k.innerHTML = kartuSimpan(d); }); });
      muatSimpan().then((d) => { const k = $('#pf-simpan'); if (k) k.innerHTML = kartuSimpan(d); });
      try { const d = await api('media'); S.media = d.media; indeksMedia(); const g = $('#pf-unggah'); if (g) g.innerHTML = gridMedia(); } catch (e) { /* daftar lama tetap tampil */ }
    };
    return UI.head({ title: 'Foto', sub: 'Semua foto yang diunggah. Yang masih dipakai tidak bisa dihapus.' }) +
      `<div class="ed-form">
        <section class="card"><header class="card-head"><div><h3>Penyimpanan (R2)</h3><p>Ruang yang dipakai unggahan situs ini dan biayanya</p></div></header><div id="pf-simpan"><div class="empty"><span class="putar"></span><b>Menghitung…</b></div></div></section>
        ${zonaUnggah()}
        <section class="card"><header class="card-head"><div><h3>Foto unggahan</h3><p>Ketuk untuk melihat, mengubah nama, atau menghapusnya</p></div></header><div class="pf-grid" id="pf-unggah">${gridMedia()}</div></section>
        <details class="card bawaan-foto"><summary><span><b>Foto mobil bawaan</b><small>${S.bawaan.length} foto tanpa latar, dipasang ARSWORD</small></span>${ic('down')}</summary><div class="pf-grid">${S.bawaan.map((b) => `<div class="pf"><span class="pf-gb pf-mobil"><img src="${esc(b.kecil)}" alt="" loading="lazy"></span><b>${esc(b.nama.replace(/-/g, ' '))}</b><small>${b.w}×${b.h}</small></div>`).join('')}</div></details>
      </div>`;
  }
  const gridMedia = () => (S.media.length ? S.media.map(kartuMedia).join('') : UI.empty('Belum ada unggahan', 'Foto yang diunggah dari panel ini muncul di sini.'));

  function bukaMedia(id) {
    const m = PETA.media[id];
    if (!m) return;
    const dipakai = m.dipakai || fotoDraf().has(m.id);
    const s = NM.sheet.open({
      title: 'Foto unggahan', size: 'md',
      body: `<div class="form"><img class="foto-besar pf-mobil" src="${esc(fotoUrl('m/' + id, true))}" alt="">
        ${F.field('Nama foto', `<input type="text" name="nama" value="${esc(m.nama || '')}" maxlength="120">`, { hint: 'Hanya untuk mencari di panel.' })}
        ${F.field('Keterangan foto', `<input type="text" name="alt" value="${esc(m.alt || '')}" maxlength="300">`, { opt: true, hint: 'Penjelasan isi foto untuk pembaca layar.' })}
        <dl class="meta-foto"><dt>Ukuran</dt><dd>${m.w}×${m.h} piksel, ${Math.round(m.ukuran / 1024)} KB${m.ext === 'png' ? ', PNG' : ''}</dd><dt>Diunggah</dt><dd>${esc(tglJam(m.pada))} oleh ${esc(namaOrang(m.oleh))}</dd><dt>Status</dt><dd>${dipakai ? 'Dipakai di situs atau draf' : 'Belum dipakai'}</dd></dl>
        ${dipakai ? `<div class="catatan">${ic('info')}<span>Foto yang masih dipakai tidak bisa dihapus. Ganti dulu di bagian yang memakainya, terbitkan, lalu hapus.</span></div>` : ''}</div>`,
      foot: `<button type="button" class="btn ghost danger" data-hapus${dipakai ? ' disabled' : ''}>${ic('trash')}<span>Hapus</span></button><button type="button" class="btn dark" data-simpan>Simpan</button>`,
    });
    s.querySelector('[data-simpan]').onclick = async (e) => {
      const b = e.currentTarget, nama = s.querySelector('[name=nama]').value.trim(), alt = s.querySelector('[name=alt]').value.trim();
      b.disabled = true;
      try { await api('media/' + id, { method: 'PATCH', body: { nama, alt } }); Object.assign(m, { nama, alt }); NM.sheet.close(); NM.toast('Keterangan foto disimpan'); segarkanMedia(); } catch (err) { NM.toast(err.message, 'bad'); b.disabled = false; }
    };
    s.querySelector('[data-hapus]').onclick = async () => {
      if (!(await NM.confirm('Hapus foto ini untuk selamanya? Tidak bisa dibatalkan.', { ok: 'Hapus foto', tone: 'danger' }))) return;
      try { await api('media/' + id, { method: 'DELETE' }); S.media = S.media.filter((x) => x.id !== id); indeksMedia(); NM.sheet.close(true); NM.toast('Foto dihapus'); segarkanMedia(); } catch (err) { NM.toast(err.message, 'bad'); }
    };
  }
  const segarkanMedia = () => { const g = $('#pf-unggah'); if (g) g.innerHTML = gridMedia(); };

  // unggah: perkecil di peramban (lebar 1600 + 640). WebP menyimpan bagian transparan; bila peramban tidak bisa membuat
  // WebP: PNG untuk foto yang tembus pandang (mobil tanpa latar), JPEG untuk yang lain
  async function bacaGambar(file) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { /* coba cara lama */ }
    return new Promise((ok, gagal) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => { URL.revokeObjectURL(url); ok(img); };
      img.onerror = () => { URL.revokeObjectURL(url); gagal(new Error(/\.(heic|heif)$/i.test(file.name) ? 'Foto HEIC belum bisa dibaca peramban ini. Unggah dari iPhone, atau ubah ke JPG dulu.' : 'Berkas ini tidak terbaca sebagai foto.')); };
      img.src = url;
    });
  }
  function tembus(g, w, h) {
    try { const d = g.getImageData(0, 0, w, h).data; for (let i = 3; i < d.length; i += 16) if (d[i] < 250) return true; } catch (e) { /* kanvas tidak bisa dibaca */ }
    return false;
  }
  async function kecilkan(gb, lebarMaks, tinggiMaks) {
    const w0 = gb.width, h0 = gb.height;
    const s = Math.min(1, lebarMaks / w0, tinggiMaks / h0);
    const w = Math.max(1, Math.round(w0 * s)), h = Math.max(1, Math.round(h0 * s));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(gb, 0, 0, w, h);
    let b = await new Promise((r) => c.toBlob(r, 'image/webp', 0.86));
    if (!b || b.type !== 'image/webp') b = await new Promise((r) => (tembus(g, w, h) ? c.toBlob(r, 'image/png') : c.toBlob(r, 'image/jpeg', 0.86)));
    if (!b) throw new Error('Foto gagal diperkecil.');
    return { b, w, h };
  }
  const EXT = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg' };
  async function unggahSatu(file, tulis) {
    if (file.size > 40 * 1024 * 1024) throw new Error('Berkasnya lebih dari 40 MB.');
    if (file.type && !file.type.startsWith('image/')) throw new Error('Ini bukan berkas foto.');
    tulis('mengecilkan…');
    const gb = await bacaGambar(file);
    const besar = await kecilkan(gb, 1600, 2400);
    const kecil = besar.w > 640 ? await kecilkan(gb, 640, 2400) : null;
    if (gb.close) gb.close();
    const ext = EXT[besar.b.type] || 'jpg';
    const fd = new FormData();
    fd.append('besar', besar.b, 'foto.' + ext);
    if (kecil && kecil.b.type === besar.b.type) fd.append('kecil', kecil.b, 'foto-640.' + ext);
    fd.append('w', besar.w); fd.append('h', besar.h);
    fd.append('nama', file.name.replace(/\.[^.]+$/, '').slice(0, 120));
    tulis('mengunggah…');
    const d = await api('media', { method: 'POST', form: fd });
    S.media.unshift(d.media);
    indeksMedia();
    return d.media;
  }
  async function prosesUnggah(files, antre) {
    const hasil = [];
    for (const file of files) {
      const row = document.createElement('div');
      row.innerHTML = `<span>${esc(file.name)}</span><span>menunggu…</span>`;
      if (antre) antre.appendChild(row);
      const tulis = (t) => { row.lastChild.textContent = t; };
      try { hasil.push(await unggahSatu(file, tulis)); tulis('selesai'); setTimeout(() => row.remove(), 2500); } catch (e) { row.classList.add('gagal'); tulis(e.message); }
    }
    if (hasil.length) NM.toast(`${hasil.length} foto terunggah`);
    return hasil;
  }
  function pasangUnggah(root, setelah) {
    const zona = $('[data-zona]', root), inp = $('[data-berkas]', root), antre = $('[data-antre]', root);
    if (!zona) return;
    const jalan = async (files) => { if (!files.length) return; const h = await prosesUnggah([...files], antre); if (setelah) setelah(h); };
    inp.onchange = () => { jalan(inp.files); inp.value = ''; };
    zona.ondragover = (e) => { e.preventDefault(); zona.classList.add('di-atas'); };
    zona.ondragleave = () => zona.classList.remove('di-atas');
    zona.ondrop = (e) => { e.preventDefault(); zona.classList.remove('di-atas'); jalan(e.dataTransfer.files); };
  }

  // pemilih foto: unggahan + foto mobil bawaan, cari, unggah langsung. banyak = pilih beberapa sekaligus
  function pilihFoto({ banyak = false, sekarang = '' } = {}) {
    return new Promise((selesai) => {
      let tab = S.media.length ? 'unggah' : 'bawaan', q = '', hasil = null;
      const dipilih = [];
      const daftar = () => (tab === 'unggah'
        ? S.media.map((m) => ({ v: 'm/' + m.id, nama: m.nama || 'Foto unggahan', url: fotoUrl('m/' + m.id), sub: tglJam(m.pada) }))
        : S.bawaan.map((b) => ({ v: b.nama, nama: b.nama.replace(/-/g, ' '), url: b.kecil, sub: `${b.w}×${b.h}` })));
      const grid = () => {
        const xs = daftar().filter((x) => !q || x.nama.toLowerCase().includes(q));
        return xs.length ? xs.map((x) => `<button type="button" class="pf${(banyak ? dipilih.includes(x.v) : x.v === sekarang) ? ' pilih' : ''}" data-v="${esc(x.v)}"><span class="pf-gb pf-mobil"><img src="${esc(x.url)}" alt="" loading="lazy"></span><b>${esc(x.nama)}</b><small>${esc(x.sub)}</small><span class="centang">${ic('check')}</span></button>`).join('')
          : UI.empty(q ? 'Tidak ada foto dengan nama itu' : 'Belum ada unggahan', q ? '' : 'Unggah foto di atas, atau pilih dari foto mobil bawaan.');
      };
      const tabs = () => `<div class="seg" data-pf-tab>${[['unggah', 'Unggahan', S.media.length], ['bawaan', 'Foto mobil bawaan', S.bawaan.length]].map(([v, l, n]) => `<button type="button" class="${tab === v ? 'on' : ''}" data-v="${v}"><span>${l}</span><em class="cnt">${n}</em></button>`).join('')}</div>`;
      const s = NM.sheet.open({
        title: banyak ? 'Pilih foto' : 'Pilih satu foto', sub: banyak ? 'Ketuk beberapa, lalu Tambahkan' : 'Ketuk untuk memakainya', size: 'lg', cls: 'lembar-foto',
        body: `${zonaUnggah()}<div class="pf-cari form">${tabs()}<div class="cari-in" style="flex:1">${ic('search')}<input type="search" placeholder="Cari nama foto" data-q aria-label="Cari nama foto"></div></div><div class="pf-grid" data-grid>${grid()}</div>`,
        foot: banyak ? '<button type="button" class="btn ghost" data-close>Batal</button><button type="button" class="btn dark" data-ok disabled>Tambahkan</button>' : '',
        onClose: () => selesai(hasil),
      });
      const g = $('[data-grid]', s), ok = $('[data-ok]', s);
      const gambar = () => { g.innerHTML = grid(); $('[data-pf-tab]', s).outerHTML = tabs(); if (ok) { ok.disabled = !dipilih.length; ok.textContent = dipilih.length ? `Tambahkan ${dipilih.length}` : 'Tambahkan'; } };
      s.addEventListener('click', (e) => {
        const t = e.target.closest('[data-pf-tab] button');
        if (t) { tab = t.dataset.v; gambar(); return; }
        const b = e.target.closest('.pf[data-v]');
        if (!b) return;
        const v = b.dataset.v;
        if (!banyak) { hasil = v; NM.sheet.close(); return; }
        const i = dipilih.indexOf(v);
        if (i >= 0) dipilih.splice(i, 1); else dipilih.push(v);
        gambar();
      });
      $('[data-q]', s).addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); g.innerHTML = grid(); });
      if (ok) ok.onclick = () => { hasil = dipilih.slice(); NM.sheet.close(); };
      pasangUnggah(s, (baru) => {
        if (!baru.length) return;
        tab = 'unggah';
        if (!banyak && baru.length === 1) { hasil = 'm/' + baru[0].id; NM.sheet.close(); return; }
        baru.forEach((m) => { if (!dipilih.includes('m/' + m.id)) dipilih.push('m/' + m.id); });
        gambar();
      });
    });
  }

  // ------------------------------------------------------------------ pengaturan situs
  const ATUR = {
    identitas: { l: 'Identitas', ic: 'home', g: () => [
      { j: 'Usaha', f: [T('situs.nama', 'Nama usaha'), T('situs.berdiri', 'Berdiri sejak (tahun)', { maks: 4, im: 'numeric' }), P('situs.deskripsi', 'Deskripsi usaha untuk Google', { baris: 3, hint: 'Tidak tampil di halaman; dibaca Google sebagai data usaha.' })] },
      { j: 'Tulisan di semua halaman', ke: '.kepala', f: [T('umum.tombolPesan', 'Tombol pesan', { hint: 'Di kepala halaman dan beranda.' }), T('umum.tombolWa', 'Tombol WhatsApp'), T('umum.buka', 'Jam buka di menu HP')] },
    ] },
    kontak: { l: 'Kontak & WhatsApp', ic: 'phone', g: () => [
      { j: 'WhatsApp & telepon', s: 'Semua tombol WhatsApp dan formulir pesan membuka nomor ini', f: [T('situs.wa', 'Nomor WhatsApp', { jenis: 'tel', normal: 'wa', ph: '62812…', hint: 'Diawali 62, tanpa spasi. Nomor 08… otomatis diubah.' }), T('situs.telepon', 'Nomor yang ditulis di situs', { ph: '0812-…', hint: 'Juga untuk tombol telepon.' }), T('situs.jam', 'Jam layanan')] },
      { j: 'Garasi', f: [T('situs.alamat', 'Alamat lengkap'), T('situs.alamatPendek', 'Alamat singkat', { hint: 'Di halaman kota yang punya garasi.' }), BR(T('situs.jalan', 'Jalan (untuk Google)'), T('situs.kodePos', 'Kode pos', { maks: 5, im: 'numeric' })), BR(T('situs.lat', 'Garis lintang', { ph: '-6.2471', im: 'decimal' }), T('situs.lng', 'Garis bujur', { ph: '106.8588', im: 'decimal' })), T('situs.maps', 'Tautan Google Maps', { jenis: 'url', hint: 'Buka Google Maps, Bagikan, lalu salin tautannya.' }), T('situs.mapsEmbed', 'Alamat peta tersemat', { jenis: 'url', hint: 'Google Maps › Bagikan › Sematkan peta: salin alamat di dalam src="…".' })] },
      { j: 'Media sosial', f: [T('situs.instagram', 'Instagram', { jenis: 'url', ph: 'https://www.instagram.com/…', opt: true })] },
    ] },
    google: { l: 'Judul & Google', ic: 'search', g: () => ['beranda', 'armada', 'layanan', 'cara-sewa', 'lokasi', 'kontak'].map((k) => ({ ...seo(k), j: HAL[k].l, s: '' })) },
    mesin: { l: 'Tampil di Google', ic: 'eye', g: () => [{ j: 'Mesin pencari', f: [SK('situs.indeks', 'Tampilkan situs di Google', { hint: 'Berlaku setelah diterbitkan. Situs ini sudah terdaftar di Google Search Console; mematikannya mengeluarkan situs dari hasil Google.', kunci: () => !pembuat() }), pembuat() ? CT('Biarkan menyala. Matikan hanya bila situs memang harus disembunyikan.', { warn: true }) : CT('Hanya akun pembuat (ARSWORD) yang bisa mengubah ini.', { warn: true })] }] },
  };
  function pPengaturan(sub) {
    const k = ATUR[sub] ? sub : 'identitas';
    LAYAR.form = () => ATUR[k].g().map(kartu).join('');
    return UI.head({ title: 'Pengaturan situs', sub: 'Identitas, kontak, dan cara situs tampil di Google.' }) +
      `<div class="settings"><nav class="set-nav" aria-label="Bagian pengaturan">${Object.entries(ATUR).map(([v, x]) => `<button type="button" class="${v === k ? 'on' : ''}" data-go="#/pengaturan/${v}">${ic(x.ic)}<span>${x.l}</span></button>`).join('')}</nav><div class="set-body form" id="ed-form">${LAYAR.form()}</div></div>`;
  }

  // ------------------------------------------------------------------ dasbor
  const tile = (o) => `<a class="m2-tile ${o.cls || ''}" href="${o.go}"><div class="mt-top"><span>${o.label}</span><span class="mt-ic">${ic(o.icon)}</span></div><b class="mt-val">${o.value}</b><div class="mt-sub"><span>${o.sub}</span></div></a>`;
  function kartuStatus() {
    const n = S.berubah.length;
    return `<section class="card m2-balance" data-draf="status">
      <div class="gb-top"><span>Perubahan belum terbit</span><span class="cur">${n ? 'draf' : 'sama dengan situs'}</span></div>
      <div class="gb-big">${n} bagian</div>
      <div class="gb-sub"><span>${S.terbit ? `Terakhir terbit ${esc(relatif(S.terbit.pada))} oleh ${esc(namaOrang(S.terbit.oleh))}` : 'Belum pernah diterbitkan dari panel ini'}</span></div>
      <div class="gb-btns"><button type="button" class="btn dark" data-aksi="terbit">${ic('send')}<span>Terbitkan</span></button><button type="button" class="btn light" data-aksi="pv-lembar" data-path="/">${ic('eye')}<span>Pratinjau</span></button></div>
      <div class="gb-wallets"><div class="gw-h"><b>Yang berubah</b></div><div class="db-ubah">${n ? S.berubah.map((b) => `<span>${esc(LABEL[b] || b)}</span>`).join('') : '<em>Belum ada. Mulai dari Armada & harga atau Halaman.</em>'}</div></div>
    </section>`;
  }
  function pDasbor() {
    const a = S.akun, t = u.today();
    const tampil = S.isi.armada.filter((x) => x.tampil !== false);
    const harga = tampil.map((m) => +m.harga || 0).filter(Boolean);
    const unit = S.isi.kota.reduce((n, k) => n + (+k.unit || 0), 0);
    const status = kartuStatus();
    const quad = `<div class="m2-quad">
      ${tile({ cls: 'teal', label: 'Armada', icon: 'car', value: `${tampil.length}`, sub: `tampil dari ${S.isi.armada.length} mobil`, go: '#/armada' })}
      ${tile({ label: 'Harga termurah', icon: 'tag', value: harga.length ? esc(rupiah(Math.min(...harga))) : '–', sub: 'per hari', go: '#/armada' })}
      ${tile({ label: 'Foto unggahan', icon: 'image', value: String(S.media.length), sub: `+ ${S.bawaan.length} foto mobil bawaan`, go: '#/foto' })}
      ${tile({ label: 'Kota', icon: 'pin', value: String(S.isi.kota.length), sub: `${unit} unit`, go: '#/kota' })}
    </div>`;
    const pintas = `<section class="card m2-auto"><div class="card-head"><div><h3>Pintasan</h3><p>Yang paling sering dikerjakan</p></div></div>
      <ul class="auto-list">
        <li><span class="al-ic">${ic('tag')}</span><div><b>Ubah harga</b><small>Harga sewa per hari tiap mobil</small></div><button type="button" class="al-go" data-go="#/armada">Ubah</button></li>
        <li><span class="al-ic">${ic('upload')}</span><div><b>Unggah foto</b><small>Foto mobil tanpa latar</small></div><button type="button" class="al-go light" data-aksi="cepat" data-j="unggah">Unggah</button></li>
        <li><span class="al-ic">${ic('file')}</span><div><b>Teks beranda</b><small>Judul, kalimat, ajakan</small></div><button type="button" class="al-go light" data-go="#/halaman/beranda">Ubah</button></li>
        <li><span class="al-ic">${ic('phone')}</span><div><b>WhatsApp & kontak</b><small>${esc(S.isi.situs.telepon || 'belum diisi')}</small></div><button type="button" class="al-go light" data-go="#/pengaturan/kontak">Ubah</button></li>
      </ul></section>`;
    const indeks = S.isi.situs.indeks !== false;
    const situs = `<section class="card m2-auto"><div class="card-head"><div><h3>Situs</h3><p>${esc(location.host)}</p></div><a class="btn light sm" href="/" target="_blank" rel="noopener">${ic('ext')}<span>Buka</span></a></div>
      <ul class="auto-list">
        <li><span class="al-ic ${indeks ? '' : 'warn'}">${ic('search')}</span><div><b>${indeks ? 'Tampil di Google' : 'Disembunyikan dari Google'}</b><small>${indeks ? 'Mesin pencari boleh memasukkan situs ini' : 'Nyalakan lagi di Pengaturan › Tampil di Google'}</small></div>${pembuat() ? '<button type="button" class="al-go light" data-go="#/pengaturan/mesin">Atur</button>' : ''}</li>
        <li><span class="al-ic">${ic('history')}</span><div><b>${S.terbit ? `Versi ${S.terbit.id} tayang` : 'Tayang dari isi awal'}</b><small>${S.terbit ? esc(tglJam(S.terbit.pada)) : 'Terbitkan sekali untuk memakai isi panel'}</small></div><button type="button" class="al-go light" data-go="#/riwayat">Riwayat</button></li>
        <li id="db-simpan"><span class="al-ic">${ic('database')}</span><div><b>Penyimpanan foto (R2)</b><small>Menghitung…</small></div><button type="button" class="al-go light" data-go="#C:/Program Files/Git/foto">Foto</button></li>
      </ul></section>`;
    LAYAR.setelah = async () => {
      muatSimpan().then((d) => { const el = $('#db-simpan'); if (el && d) el.querySelector('div').innerHTML = `<b>Penyimpanan foto: ${esc(ukuranBita(d.bita))}</b><small>${esc(rupiahKecil(d.rupiah))} per bulan · ${d.gb < d.gratisGb ? 'masih dalam jatah gratis' : 'di atas jatah gratis'}</small>`; else if (el) el.querySelector('small').textContent = 'Belum bisa dihitung'; });
      try {
        const d = await api('riwayat');
        const el = $('#db-akt');
        if (el) el.innerHTML = d.aktivitas.length ? `<ul class="auto-list akt-list">${d.aktivitas.slice(0, 7).map(aktLi).join('')}</ul>` : UI.empty('Belum ada aktivitas');
      } catch (e) { const el = $('#db-akt'); if (el) el.innerHTML = UI.empty('Aktivitas belum bisa dimuat'); }
    };
    return `<div class="m2-head"><div><h1>${u.sapaan()}, ${esc(namaDepan(a))}</h1><p>Panel situs TWH Rent Car · ${esc(u.tglPanjang(t))}</p></div></div>
      <div class="db-r1">${status}${quad}${pintas}</div>
      <div class="db-r2"><section class="card m2-auto"><div class="card-head"><div><h3>Aktivitas terbaru</h3><p>Siapa mengubah apa</p></div><a class="btn light sm" href="#/riwayat">Semua</a></div><div id="db-akt"><div class="empty"><span class="putar"></span></div></div></section>${situs}</div>`;
  }

  // ------------------------------------------------------------------ riwayat
  const AKSI = {
    simpan: (a) => `mengubah ${LABEL[a.bagian] || a.bagian || 'isi'}`,
    terbit: (a, d) => `menerbitkan versi ${d.versi || ''}`,
    buang_draf: (a) => (a.bagian ? `membuang draf ${LABEL[a.bagian] || a.bagian}` : 'membuang semua draf'),
    pulihkan: (a, d) => `memulihkan versi ${d.versi || ''} ke draf`,
    unggah: (a, d) => `mengunggah foto ${d.nama || ''}`,
    hapus_foto: (a, d) => `menghapus foto ${d.nama || ''}`,
    akun_tambah: (a, d) => `menambah akun ${d.email || ''}`,
    akun_ubah: (a, d) => `mengubah akun ${d.email || ''}`,
    akun_hapus: (a, d) => `menghapus akun ${d.email || ''}`,
    akun_keluarkan: () => 'mengeluarkan satu akun dari semua perangkat',
    masuk: (a, d) => (d.lewat === 'arswordlab' ? 'masuk dari dashboard ARSWORD' : 'masuk ke panel'),
  };
  const IK_AKSI = { simpan: 'edit', terbit: 'send', buang_draf: 'undo', pulihkan: 'history', unggah: 'upload', hapus_foto: 'trash', masuk: 'user' };
  function aktLi(a) {
    let d = {};
    try { d = a.detail ? JSON.parse(a.detail) : {}; } catch (e) { d = {}; }
    const teks = (AKSI[a.aksi] || (() => a.aksi))(a, d);
    return `<li><span class="al-ic">${ic(IK_AKSI[a.aksi] || 'user')}</span><div><b>${esc(namaOrang(a.oleh))}</b><small>${esc(teks)} · ${esc(relatif(a.pada))}</small></div></li>`;
  }
  function kartuDraf() {
    const n = S.berubah.length;
    return `<section class="card" data-draf="kartu"><header class="card-head"><div><h3>Draf yang belum terbit</h3><p>${n ? `${n} bagian berbeda dari situs` : 'Draf sama dengan yang tampil di situs'}</p></div>${n ? `<div class="ch-r"><button type="button" class="btn ghost sm danger" data-aksi="buang">${ic('undo')}<span>Buang semua</span></button><button type="button" class="btn dark sm" data-aksi="terbit">${ic('send')}<span>Terbitkan</span></button></div>` : ''}</header>
      ${n ? `<div class="set-list">${S.berubah.map((b) => { const x = S.ubah[b]; return `<div class="set-li"><div><b>${esc(LABEL[b] || b)}</b><small>${x ? `diubah ${esc(relatif(x.pada))} oleh ${esc(namaOrang(x.oleh))}` : 'diubah'}</small></div><button type="button" class="btn ghost sm" data-aksi="buang" data-b="${esc(b)}">Kembalikan</button></div>`; }).join('')}</div>` : UI.empty('Tidak ada perubahan', 'Perubahan baru akan muncul di sini sampai diterbitkan.')}</section>`;
  }
  function pRiwayat() {
    LAYAR.setelah = async () => {
      const el = $('#rw');
      try {
        const d = await api('riwayat');
        const atas = d.versi[0] && d.versi[0].id;
        if (!el) return;
        el.innerHTML = UI.card({ title: 'Versi terbit', sub: 'Pulihkan menyalin isi versi itu ke draf; situs baru berubah setelah diterbitkan lagi', cls: 'flush', body: UI.table({
          cols: [
            { l: 'Versi', f: (v) => `<span class="ver-no">${v.id}</span>${v.id === atas ? ' ' + UI.badge('Tayang', 'good') : ''}` },
            { l: 'Waktu', f: (v) => `${esc(tglJam(v.pada))}<span class="muted">${esc(namaOrang(v.oleh))}</span>` },
            { l: 'Yang berubah', f: (v) => { const bs = String(v.bagian || '').split(',').filter(Boolean); return esc(bs.length > 20 ? 'semua bagian' : bs.slice(0, 3).map((b) => LABEL[b] || b).join(', ') + (bs.length > 3 ? ` +${bs.length - 3}` : '')) + (v.catatan ? `<span class="muted">“${esc(v.catatan)}”</span>` : ''); } },
            { l: '', cls: 'act', f: (v) => `<button type="button" class="btn light sm" data-aksi="pulihkan" data-id="${v.id}">${ic('history')}<span>Pulihkan</span></button>` },
          ],
          rows: d.versi, empty: 'Belum ada versi terbit. Situs masih memakai isi awal.',
        }) }) + UI.card({ title: 'Aktivitas', sub: '150 kegiatan terakhir', body: d.aktivitas.length ? `<ul class="auto-list akt-list">${d.aktivitas.map(aktLi).join('')}</ul>` : UI.empty('Belum ada aktivitas') });
      } catch (e) { if (el) el.innerHTML = UI.card({ body: UI.empty('Riwayat belum bisa dimuat', esc(e.message)) }); }
    };
    return UI.head({ title: 'Riwayat', sub: 'Setiap terbitan tersimpan sebagai versi dan bisa dipulihkan.' }) +
      `<div class="ed-form rw-wrap">${kartuDraf()}<div id="rw" class="ed-form">${UI.card({ body: '<div class="empty"><span class="putar"></span><b>Memuat riwayat…</b></div>' })}</div></div>`;
  }

  // ------------------------------------------------------------------ akun admin (pembuat saja)
  let AKUN = [];
  function pAkun() {
    LAYAR.setelah = muatAkun;
    return UI.head({ title: 'Akun admin', sub: 'Siapa saja yang bisa masuk ke panel ini. Masuk selalu dengan kode yang dikirim ke email.', right: `<button type="button" class="btn dark" data-aksi="akun-tambah">${ic('plus')}<span>Tambah admin</span></button>` }) +
      `<div class="ed-form"><div class="catatan">${ic('info')}<span>Admin masuk di <b>${esc(location.host)}/admin</b> dengan emailnya sendiri. Kodenya dikirim ke email itu setiap kali masuk, jadi tidak ada kata sandi yang perlu dibagikan.</span></div><div id="akun-isi">${UI.card({ body: '<div class="empty"><span class="putar"></span><b>Memuat akun…</b></div>' })}</div></div>`;
  }
  async function muatAkun() {
    const el = $('#akun-isi');
    try {
      AKUN = (await api('akun')).akun;
      if (!el) return;
      el.innerHTML = UI.card({ cls: 'flush', body: UI.table({
        cols: [
          { l: 'Akun', f: (a) => `<div class="akun-nama"><span class="avatar">${esc(u.initials(a.nama || a.email))}</span><div><b>${esc(a.nama || a.email.split('@')[0])}${a.email === S.akun.email ? ' <span class="muted">(Anda)</span>' : ''}</b><small>${esc(a.email)}</small></div></div>` },
          { l: 'Peran', f: (a) => (a.peran === 'pembuat' ? UI.badge(a.tetap ? 'Pembuat utama' : 'Pembuat', 'dark') : UI.badge('Admin', 'good')) },
          { l: 'Status', f: (a) => (a.aktif ? UI.badge('Aktif', 'info') : UI.badge('Nonaktif', 'bad')) + (a.sesi ? `<span class="muted">${a.sesi} perangkat masuk</span>` : '') },
          { l: 'Terakhir masuk', f: (a) => esc(relatif(a.terakhir_masuk)) },
          { l: '', cls: 'act', f: (a) => (a.id && !a.tetap ? `<button type="button" class="btn light sm" data-aksi="akun-atur" data-id="${a.id}">${ic('more')}<span>Atur</span></button>` : '') },
        ],
        rows: AKUN,
      }) });
    } catch (e) { if (el) el.innerHTML = UI.card({ body: UI.empty('Akun belum bisa dimuat', esc(e.message)) }); }
  }
  function akunTambah() {
    const s = NM.sheet.open({
      title: 'Tambah admin', sub: 'Pemilik atau pengurus yang boleh mengubah situs', size: 'sm',
      body: `<form class="form" data-akun novalidate>
        ${F.field('Email', '<input type="email" name="email" autocomplete="off" placeholder="nama@gmail.com" required autofocus>', { hint: 'Email yang dipakai untuk menerima kode masuk.' })}
        ${F.field('Nama', '<input type="text" name="nama" autocomplete="off" placeholder="cth. Budi" maxlength="80">', { opt: true })}
        <div class="field"><span class="lbl">Peran</span>${F.chips('peran', [{ v: 'admin', l: 'Admin (pemilik situs)' }, { v: 'pembuat', l: 'Pembuat (ARSWORD)' }], 'admin')}<small class="hint">Pembuat juga bisa mengelola akun dan pengaturan Google.</small></div>
        ${F.check('undang', 'Kirim email pemberitahuan', true)}
      </form>`,
      foot: '<button type="button" class="btn ghost" data-close>Batal</button><button type="button" class="btn dark" data-ok>Tambah</button>',
    });
    const f = $('form', s), b = $('[data-ok]', s);
    const kirim = async () => {
      const v = F.read(f);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email || '')) return F.err(f, 'Tulis alamat email yang benar.');
      b.disabled = true;
      try {
        const d = await api('akun', { method: 'POST', body: { email: v.email, nama: v.nama, peran: v.peran || 'admin', undang: v.undang } });
        NM.sheet.close();
        NM.toast(v.undang ? (d.terkirim ? 'Akun ditambahkan, email pemberitahuan terkirim' : 'Akun ditambahkan. Email pemberitahuan gagal terkirim.') : 'Akun ditambahkan');
        muatAkun();
      } catch (e) { b.disabled = false; F.err(f, esc(e.message)); }
    };
    f.onsubmit = (e) => { e.preventDefault(); kirim(); };
    b.onclick = kirim;
  }
  function akunAtur(id) {
    const a = AKUN.find((x) => x.id === id);
    if (!a) return;
    const diri = a.email === S.akun.email;
    const opsi = [
      ['nama', 'edit', 'Ubah nama', ''],
      ...(diri ? [] : [
        ['peran', 'shield', a.peran === 'pembuat' ? 'Jadikan admin biasa' : 'Jadikan pembuat', a.peran === 'pembuat' ? 'Tidak bisa lagi mengelola akun' : 'Bisa mengelola akun dan pengaturan Google'],
        ['aktif', 'lock', a.aktif ? 'Nonaktifkan' : 'Aktifkan lagi', a.aktif ? 'Tidak bisa masuk sampai diaktifkan lagi' : 'Bisa masuk lagi dengan kode email'],
        ['keluarkan', 'logout', 'Keluarkan dari semua perangkat', 'Harus masuk lagi dengan kode email'],
        ['hapus', 'trash', 'Hapus akun', 'Riwayat perubahannya tetap tersimpan'],
      ]),
    ];
    const s = NM.sheet.open({
      title: esc(a.nama || a.email), sub: esc(a.email), size: 'sm',
      body: `<div class="menu-aksi">${opsi.map(([k, i, l, sub]) => `<button type="button" data-k="${k}"${k === 'hapus' ? ' class="bahaya"' : ''}>${ic(i)}<span>${l}${sub ? `<small>${sub}</small>` : ''}</span></button>`).join('')}</div>`,
    });
    s.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-k]');
      if (!b) return;
      const k = b.dataset.k;
      try {
        if (k === 'nama') {
          NM.sheet.close();
          const nama = await tanya({ judul: 'Ubah nama', label: 'Nama', nilai: a.nama || '' });
          if (!nama) return;
          await api('akun/' + id, { method: 'PATCH', body: { nama } });
          if (diri) { S.akun.nama = nama; kerangka(); render(); }
        } else if (k === 'peran') {
          await api('akun/' + id, { method: 'PATCH', body: { peran: a.peran === 'pembuat' ? 'admin' : 'pembuat' } });
          NM.sheet.close();
        } else if (k === 'aktif') {
          if (a.aktif && !(await NM.confirm(`Nonaktifkan <b>${esc(a.email)}</b>? Akun ini langsung keluar dari semua perangkat.`, { ok: 'Nonaktifkan', tone: 'danger' }))) return;
          await api('akun/' + id, { method: 'PATCH', body: { aktif: !a.aktif } });
          NM.sheet.close(true);
        } else if (k === 'keluarkan') {
          await api(`akun/${id}/keluarkan`, { method: 'POST', body: {} });
          NM.sheet.close();
        } else if (k === 'hapus') {
          if (!(await NM.confirm(`Hapus akun <b>${esc(a.email)}</b>? Email ini tidak bisa masuk lagi sampai ditambahkan ulang.`, { ok: 'Hapus akun', tone: 'danger' }))) return;
          await api('akun/' + id, { method: 'DELETE' });
          NM.sheet.close(true);
        }
        NM.toast('Akun diperbarui');
        muatAkun();
      } catch (err) { NM.toast(err.message, 'bad'); }
    });
  }

  // ------------------------------------------------------------------ akun saya
  function pSaya() {
    LAYAR.setelah = async () => {
      const el = $('#saya-sesi');
      try {
        const d = await api('saya');
        if (el) el.innerHTML = `<div class="set-list">${d.sesi.map((x) => `<div class="set-li"><div><b>${esc(namaPerangkat(x.perangkat))}${x.ini ? ' ' + UI.badge('perangkat ini', 'good') : ''}</b><small>Masuk ${esc(tglJam(x.dibuat))} · terakhir aktif ${esc(relatif(x.terakhir))}</small></div></div>`).join('')}</div>`;
      } catch (e) { if (el) el.innerHTML = UI.empty('Belum bisa dimuat'); }
    };
    const a = S.akun;
    return UI.head({ title: 'Akun saya', sub: `${esc(a.email)} · ${a.peran === 'pembuat' ? 'Pembuat' : 'Admin'}` }) +
      `<div class="ed2 tanpa-pv"><div class="ed-form">
        ${UI.card({ title: 'Nama', sub: 'Tampil di bar atas dan riwayat', body: `<form class="form" data-saya>${F.field('Nama Anda', `<input type="text" name="nama" value="${esc(a.nama || '')}" maxlength="80" autocomplete="name">`)}<div><button type="submit" class="btn dark">Simpan nama</button></div></form>` })}
        ${UI.card({ title: 'Perangkat yang sedang masuk', sub: 'Sesi berlaku 30 hari sejak terakhir dipakai', body: `<div id="saya-sesi"><div class="empty"><span class="putar"></span></div></div>`, foot: `<div class="ph-right"><button type="button" class="btn ghost" data-aksi="keluar">${ic('logout')}<span>Keluar</span></button><button type="button" class="btn ghost danger" data-aksi="keluar-semua">Keluar dari semua perangkat</button></div>` })}
      </div></div>`;
  }
  document.addEventListener('submit', async (e) => {
    const f = e.target.closest('[data-saya]');
    if (!f) return;
    e.preventDefault();
    const nama = f.querySelector('[name=nama]').value.trim();
    if (!nama) return F.err(f, 'Tulis nama Anda.');
    try { await api('saya', { method: 'PATCH', body: { nama } }); S.akun.nama = nama; kerangka(); render(); NM.toast('Nama disimpan'); } catch (err) { F.err(f, esc(err.message)); }
  });

  // ------------------------------------------------------------------ terbitkan, buang, pulihkan
  async function bukaTerbit() {
    const s = NM.sheet.open({ title: 'Terbitkan perubahan', sub: 'Pengunjung langsung melihat isi baru', size: 'sm', body: '<div class="empty"><span class="putar"></span><b>Menyimpan perubahan terakhir…</b></div>' });
    const body = $('.sheet-body', s);
    const ok = await tuntaskan();
    if (!body.isConnected) return;
    if (!ok) { body.innerHTML = `<div class="catatan warn">${ic('alert')}<span>Ada perubahan yang belum tersimpan. Periksa koneksi, tunggu tanda “Draf tersimpan”, lalu coba lagi.</span></div>`; return; }
    const n = S.berubah.length, pertama = !S.terbit;
    if (!n && !pertama) { body.innerHTML = UI.empty('Tidak ada yang perlu diterbitkan', 'Draf sudah sama dengan yang tampil di situs.'); return; }
    body.innerHTML = `<div class="form">
      ${pertama ? `<div class="catatan">${ic('info')}<span>Ini terbitan pertama dari panel admin. Mulai sekarang semua halaman situs diambil dari isi panel ini.</span></div>` : ''}
      ${n ? `<div class="field"><span class="lbl">Yang berubah</span><div class="db-ubah">${S.berubah.map((b) => `<span>${esc(LABEL[b] || b)}</span>`).join('')}</div></div>` : ''}
      ${F.field('Catatan', '<input type="text" name="catatan" maxlength="300" placeholder="cth. Harga baru Avanza">', { opt: true, hint: 'Membantu mencari versi ini di Riwayat.' })}
    </div>`;
    s.insertAdjacentHTML('beforeend', `<footer class="sheet-foot"><button type="button" class="btn ghost" data-aksi="pv-lembar" data-path="${esc(LAYAR.pv || '/')}">${ic('eye')}<span>Pratinjau</span></button><button type="button" class="btn dark" data-ok>${ic('send')}<span>Terbitkan sekarang</span></button></footer>`);
    const b = $('[data-ok]', s);
    b.onclick = async () => {
      b.disabled = true;
      try {
        if (!(await tuntaskan())) throw new Error('Ada perubahan yang belum tersimpan. Coba lagi sebentar.');
        const d = await api('terbit', { method: 'POST', body: { catatan: $('[name=catatan]', s).value.trim() } });
        terapkanDraf(d);
        NM.sheet.close(true);
        NM.toast(`Situs diperbarui (versi ${d.versi}). Muat ulang situs untuk melihatnya.`);
        render();
      } catch (e) { b.disabled = false; NM.toast(e.message, 'bad'); }
    };
  }
  async function buang(bagian) {
    const ok = await NM.confirm(bagian ? `Kembalikan <b>${esc(LABEL[bagian] || bagian)}</b> seperti yang tampil di situs? Perubahan draf di bagian ini hilang.` : 'Buang <b>semua</b> perubahan draf? Draf kembali sama dengan yang tampil di situs.', { ok: bagian ? 'Kembalikan' : 'Buang semua', tone: 'danger' });
    if (!ok) return;
    try {
      await tuntaskan();
      const d = await api('buang', { method: 'POST', body: bagian ? { bagian } : {} });
      terapkanDraf(d); render(); pratinjauSegarkan();
      NM.toast(bagian ? 'Bagian dikembalikan' : 'Semua draf dibuang');
    } catch (e) { NM.toast(e.message, 'bad'); }
  }
  async function pulihkan(id) {
    if (!(await NM.confirm(`Salin isi versi <b>${id}</b> ke draf? Draf sekarang tergantikan. Situs belum berubah sampai Anda menerbitkan lagi.`, { ok: 'Pulihkan ke draf' }))) return;
    try {
      await tuntaskan();
      const d = await api(`versi/${id}/pulihkan`, { method: 'POST', body: {} });
      terapkanDraf(d); render();
      NM.toast(`Versi ${id} disalin ke draf. Periksa pratinjau, lalu terbitkan.`);
    } catch (e) { NM.toast(e.message, 'bad'); }
  }

  // ------------------------------------------------------------------ menu, tambah cepat, cari
  function bukaMenu() {
    const nav = NAV.filter((n) => !n.pembuat || pembuat());
    NM.sheet.open({
      title: 'Menu', size: 'md',
      body: `<div class="menu-grid">${nav.map((n) => `<a href="#/${n.id}" class="menu-tile" data-close>${ic(n.ic)}<span>${n.l}</span></a>`).join('')}<a href="#/saya" class="menu-tile" data-close>${ic('user')}<span>Akun saya</span></a><a href="/" target="_blank" rel="noopener" class="menu-tile">${ic('ext')}<span>Lihat situs</span></a></div>`,
    });
  }
  function menuSaya() {
    const a = S.akun;
    NM.sheet.open({
      title: esc(a.nama || namaDepan(a)), sub: `${esc(a.email)} · ${a.peran === 'pembuat' ? 'Pembuat' : 'Admin'}`, size: 'sm',
      body: `<div class="menu-aksi"><button type="button" data-go="#/saya">${ic('user')}<span>Akun saya<small>Nama dan perangkat yang masuk</small></span></button>${pembuat() ? `<button type="button" data-go="#/akun">${ic('shield')}<span>Akun admin<small>Tambah atau atur admin</small></span></button>` : ''}${pembuat() ? `<a class="ma" href="https://arswordlab.com/studio/admin/situs/">${ic('grid')}<span>Dashboard ARSWORD<small>Panel situs klien yang lain</small></span></a>` : ''}<button type="button" data-aksi="keluar" class="bahaya">${ic('logout')}<span>Keluar</span></button></div>`,
    });
  }
  function tambahCepat() {
    const it = [['mobil', 'car', 'Mobil baru'], ['unggah', 'upload', 'Unggah foto'], ['layanan', 'briefcase', 'Layanan baru'], ['faq', 'list', 'Pertanyaan baru'], ['ulasan', 'star', 'Ulasan baru'], ['kota', 'pin', 'Kota baru']];
    if (pembuat()) it.push(['admin', 'shield', 'Admin baru']);
    NM.sheet.open({ title: 'Tambah', size: 'md', body: `<div class="menu-grid">${it.map(([j, i, l]) => `<button type="button" class="menu-tile" data-aksi="cepat" data-j="${j}">${ic(i)}<span>${l}</span></button>`).join('')}</div>` });
  }
  const pergi = (go, buka) => {
    if (buka) { TERBUKA.add(buka); FOKUS = buka; }
    NM.sheet.close(true);
    if (location.hash === go) render(); else location.hash = go;
  };
  async function cepat(j) {
    if (j === 'unggah') {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*,.heic,.heif'; inp.multiple = true;
      inp.onchange = async () => {
        const files = [...inp.files];
        pergi('#/foto/pustaka');
        await new Promise((r) => setTimeout(r, 60));
        await prosesUnggah(files, $('[data-antre]'));
        segarkanMedia();
      };
      inp.click();
      return;
    }
    if (j === 'admin') { pergi('#/akun'); setTimeout(akunTambah, 200); return; }
    NM.sheet.close(true);
    let x = null, p = j, go = '#/' + j;
    if (j === 'mobil') { x = await tambahMobil(); if (x) S.isi.armada.push(x); p = 'armada'; go = '#/armada'; }
    else if (j === 'faq') { x = { id: idBaru('q'), tanya: '', jawab: '' }; S.isi.faq.push(x); go = '#/cara'; }
    else if (j === 'ulasan') { x = { id: idBaru('u'), nama: '', mobil: '', teks: '' }; S.isi.ulasan.push(x); }
    else if (j === 'layanan' || j === 'kota') { const d = j === 'layanan' ? D_LAYANAN() : D_KOTA(); x = await d.tambahFn(); if (x) S.isi[j].push(x); }
    if (!x) return;
    tandai(p);
    pergi(go, kunciItem(p, x, 0));
  }

  function indeksCari() {
    const r = [];
    NAV.filter((n) => !n.pembuat || pembuat()).forEach((n) => r.push({ j: n.l, s: 'Menu', go: '#/' + n.id, ic: n.ic }));
    Object.entries(HAL).forEach(([k, h]) => h.g().forEach((g) => r.push({ j: g.j, s: 'Halaman ' + h.l, go: '#/halaman/' + k, ic: 'file' })));
    Object.entries(ATUR).forEach(([k, a]) => r.push({ j: a.l, s: 'Pengaturan', go: '#/pengaturan/' + k, ic: a.ic }));
    S.isi.armada.forEach((x) => r.push({ j: namaMobil(x), s: `Armada · ${rupiah(x.harga)}/hari`, go: '#/armada', buka: kunciItem('armada', x), ic: 'car' }));
    S.isi.kota.forEach((x) => r.push({ j: x.nama, s: `Kota · ${x.unit} unit`, go: '#/kota', buka: kunciItem('kota', x), ic: 'pin' }));
    S.isi.layanan.forEach((x) => r.push({ j: x.judul, s: 'Layanan', go: '#/layanan', buka: kunciItem('layanan', x), ic: 'briefcase' }));
    S.isi.faq.forEach((x) => r.push({ j: x.tanya || '(pertanyaan)', s: 'Pertanyaan (FAQ)', go: '#/cara', buka: kunciItem('faq', x), ic: 'list' }));
    S.isi.ulasan.forEach((x) => r.push({ j: x.nama || '(ulasan)', s: 'Ulasan', go: '#/ulasan', buka: kunciItem('ulasan', x), ic: 'star' }));
    return r;
  }
  function bukaCari() {
    const semua = indeksCari();
    let hasil = [];
    const s = NM.sheet.open({
      title: 'Cari', size: 'md',
      body: `<div class="form"><div class="cari-in">${ic('search')}<input type="search" data-cari-semua placeholder="Mobil, kota, halaman, pertanyaan…" autocomplete="off" autofocus aria-label="Cari"></div></div><ul class="hasil" data-hasil></ul>`,
    });
    const inp = $('[data-cari-semua]', s), ul = $('[data-hasil]', s);
    const tulis = () => {
      const q = inp.value.trim().toLowerCase();
      hasil = (q ? semua.filter((x) => `${x.j} ${x.s}`.toLowerCase().includes(q)) : semua.slice(0, 11)).slice(0, 40);
      ul.innerHTML = hasil.length ? hasil.map((x, i) => `<li><a href="${x.go}" data-i="${i}">${`<span class="al-ic">${ic(x.ic)}</span>`}<span><b>${esc(x.j)}</b><small>${esc(x.s)}</small></span></a></li>`).join('') : `<li>${UI.empty('Tidak ketemu', 'Coba kata lain.')}</li>`;
    };
    tulis();
    inp.addEventListener('input', tulis);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && hasil[0]) { e.preventDefault(); pergi(hasil[0].go, hasil[0].buka); } });
    ul.addEventListener('click', (e) => { const a = e.target.closest('a[data-i]'); if (!a) return; e.preventDefault(); const x = hasil[+a.dataset.i]; pergi(x.go, x.buka); });
    setTimeout(() => inp.focus(), 80);
  }

  // ------------------------------------------------------------------ rute dan kerangka panel
  const RUTE = { beranda: pDasbor, armada: pArmada, halaman: pHalaman, kota: pKota, layanan: pLayanan, cara: pCara, ulasan: pUlasan, foto: pFoto, pengaturan: pPengaturan, riwayat: pRiwayat, akun: pAkun, saya: pSaya };
  const ruteSekarang = () => { const [id = 'beranda', sub = ''] = location.hash.replace(/^#\/?/, '').split('/'); return { id: RUTE[id] ? id : 'beranda', sub: decodeURIComponent(sub || '') }; };
  function render(masuk = false) {
    const page = $('#page');
    if (!page || !S.isi) return;
    const r = ruteSekarang();
    if (r.id === 'akun' && !pembuat()) { location.hash = '#/beranda'; return; }
    const sama = LAYAR.id === r.id && LAYAR.sub === r.sub;
    if (!sama) PV.ke = '';
    LAYAR = { id: r.id, sub: r.sub };
    page.innerHTML = RUTE[r.id](r.sub);
    // animasi masuk hanya saat pindah halaman; pembaruan biasa (terbit, buang, ganti tata letak) tanpa animasi
    page.classList.remove('enter');
    if (masuk && !sama) { void page.offsetWidth; page.classList.add('enter'); scrollTo(0, 0); }
    $$('[data-nav]').forEach((a) => { const on = a.dataset.nav === r.id || (r.id === 'saya' && a.dataset.nav === 'akun'); a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    document.title = `${(NAV.find((n) => n.id === r.id) || { l: 'Akun saya' }).l} · Panel TWH`;
    pasangPv(page);
    if (LAYAR.setelah) LAYAR.setelah(page);
    if (FOKUS) {
      const k = FOKUS;
      FOKUS = null;
      requestAnimationFrame(() => {
        const el = document.querySelector(`.dl-i[data-kunci="${CSS.escape(k)}"]`);
        if (!el) return;
        el.scrollIntoView({ block: 'center', behavior: u.reducedMotion() ? 'auto' : 'smooth' });
        const f = el.querySelector('.dl-isi input:not([type=date]):not([type=checkbox]), .dl-isi textarea');
        if (f && !u.isMobile()) f.focus({ preventScroll: true });
      });
    }
  }
  addEventListener('hashchange', () => { if (S.isi) render(true); });

  function kerangka() {
    document.body.classList.remove('is-login');
    const a = S.akun, nav = NAV.filter((n) => !n.pembuat || pembuat());
    $('#app').innerHTML = `
      <header class="m2-top glass">
        <button type="button" class="m2-user" data-aksi="menu-saya" aria-label="Akun ${esc(a.email)}"><span class="av">${esc(u.initials(a.nama || a.email))}</span><span class="nm">Halo, <b>${esc(namaDepan(a))}</b></span></button>
        <button type="button" class="m2-ask" data-aksi="cari"><span class="orb" aria-hidden="true"></span><span class="typed">Cari mobil, kota, halaman…</span><kbd>/</kbd></button>
        <div class="m2-top-r">
          <button type="button" class="tb-status" id="tb-status" data-aksi="coba-simpan" data-s="tersimpan" aria-live="polite"><i></i><span>Draf tersimpan</span></button>
          <a class="m2-circ" href="/" target="_blank" rel="noopener" aria-label="Buka situs di tab baru">${ic('ext')}</a>
          <button type="button" class="tb-terbit" id="tb-terbit" data-aksi="terbit" data-n="0">${ic('send')}<span>Terbitkan</span><em>0</em></button>
        </div>
      </header>
      <aside class="m2-rail glass" aria-label="Menu">${nav.map((n) => (n.sep ? '<span class="sep"></span>' : '') + `<a href="#/${n.id}" data-nav="${n.id}" aria-label="${n.l}" data-label="${n.l}">${ic(n.ic)}</a>`).join('')}</aside>
      <main class="m2-panel"><div id="page" class="m2-page"></div></main>
      <nav class="m2-dock glass" aria-label="Menu utama"><div class="dock-tabs">${DOCK.map((id) => { const n = NAV.find((x) => x.id === id); return `<a href="#/${n.id}" data-nav="${n.id}">${n.l}</a>`; }).join('')}</div><button type="button" class="m2-plus" data-aksi="tambah-cepat" aria-label="Tambah">${ic('plus')}</button></nav>
      <nav class="bnav" aria-label="Menu bawah">
        <a href="#/beranda" data-nav="beranda">${ic('home')}<span>Dasbor</span></a>
        <a href="#/halaman" data-nav="halaman">${ic('file')}<span>Halaman</span></a>
        <button type="button" class="bnav-catat" data-aksi="tambah-cepat" aria-label="Tambah">${ic('plus')}<span>Tambah</span></button>
        <a href="#/armada" data-nav="armada">${ic('car')}<span>Armada</span></a>
        <button type="button" data-aksi="menu">${ic('grid')}<span>Menu</span></button>
      </nav>`;
    perbaruiTombolTerbit();
    statusSimpan();
  }

  // ------------------------------------------------------------------ peristiwa (satu pendengar untuk semua isian)
  function padaUbah(e) {
    const el = e.target;
    if (!el.matches) return;
    if (el.matches('[data-cari]')) {
      const p = el.dataset.cari, q = el.value.trim().toLowerCase(), d = DL[p];
      CARI[p] = el.value;
      const xs = ambil(p) || [];
      $$(`[data-dl="${CSS.escape(p)}"] > .dl-i`).forEach((det) => { const i = +det.dataset.i; det.hidden = !cocokCari(d, xs[i], i, q); });
      $$(`[data-dl="${CSS.escape(p)}"]`).forEach((w) => w.classList.toggle('dicari', !!q));
      return;
    }
    if (!el.matches('[data-p]')) return;
    const p = el.dataset.p;
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (e.type === 'change' && el.dataset.normal === 'wa' && v) {
      let n = String(v).replace(/\D/g, '');
      if (n.startsWith('0')) n = '62' + n.slice(1);
      else if (n.startsWith('8')) n = '62' + n;
      el.value = v = n;
    }
    if (el.hasAttribute('data-angka')) {
      const ang = String(v).replace(/\D/g, '');
      v = ang === '' ? 0 : Number(ang);
      if (e.type === 'change') el.value = String(v);
      const rp = document.querySelector(`[data-rp="${CSS.escape(el.dataset.p)}"]`);
      if (rp) rp.textContent = rupiah(v) + ' per hari';
    }
    if (ambil(p) !== v) {
      tetapkan(p, v);
      const h = document.querySelector(`[data-hitung="${CSS.escape(p)}"]`);
      if (h) { const n = +h.dataset.n, l = String(v).length; h.textContent = `${l} / ${n} huruf`; h.classList.toggle('lebih', l > n); }
      let det = el.closest('.dl-i');
      while (det) { perbaruiJudul(det); det = det.parentElement.closest('.dl-i'); }
    }
    if (e.type === 'change' && el.hasAttribute('data-segar')) segarkan(el);
  }
  document.addEventListener('input', padaUbah);
  document.addEventListener('change', padaUbah);

  // label: Enter atau koma menambah; keluar dari kolom juga menambah
  function tambahTag(el) {
    const p = el.dataset.tag, vs = el.value.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    el.value = '';
    if (!vs.length) return;
    let xs = ambil(p);
    if (!Array.isArray(xs)) { xs = []; tetapkan(p, xs); }
    vs.forEach((v) => { if (!xs.includes(v)) xs.push(v); });
    tandai(bagianDari(p));
    gambarTag(el.closest('.tg'), p);
  }
  function gambarTag(tg, p) {
    if (!tg) return;
    $$('.tg-i', tg).forEach((n) => n.remove());
    tg.querySelector('input').insertAdjacentHTML('beforebegin', chipTag(p, ambil(p)));
    let det = tg.closest('.dl-i');
    while (det) { perbaruiJudul(det); det = det.parentElement.closest('.dl-i'); }
  }
  document.addEventListener('keydown', (e) => {
    const el = e.target;
    if (el.matches && el.matches('[data-tag]') && (e.key === 'Enter' || e.key === ',')) { e.preventDefault(); tambahTag(el); return; }
    if (e.key === '/' && S.isi && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !NM.sheet.open_) { e.preventDefault(); bukaCari(); }
  });
  document.addEventListener('focusout', (e) => { const el = e.target; if (el.matches && el.matches('[data-tag]') && el.value.trim()) tambahTag(el); });

  // butir daftar: isinya digambar saat dibuka, pratinjau ikut bergulir ke bagiannya
  document.addEventListener('toggle', (e) => {
    const det = e.target;
    if (!det.matches || !det.matches('.dl-i')) return;
    const k = det.dataset.kunci, lp = det.dataset.dlI, i = +det.dataset.i, d = DL[lp];
    if (!det.open) { TERBUKA.delete(k); return; }
    TERBUKA.add(k);
    const isi = det.querySelector(':scope > .dl-isi');
    if (d && !isi.children.length) isi.innerHTML = isiItem(d, lp, i);
    if (d && d.ke) pvKe(d.ke((ambil(lp) || [])[i]));
  }, true);
  document.addEventListener('focusin', (e) => { const g = e.target.closest && e.target.closest('.grp[data-ke]'); if (g && !e.target.closest('.dl-i')) pvKe(g.dataset.ke); });

  // ------------------------------------------------------------------ tarik untuk mengubah urutan (jari dan tetikus)
  // Pegangan titik-titik di kiri setiap butir daftar berurutan. Butir mengikuti jari; butir lain bergeser saat jari
  // melewati titik tengahnya; layar menggulir sendiri di dekat tepi atas/bawah (daftar galeri bisa puluhan foto).
  // Dilepas: urutan baru disimpan sebagai draf. Keyboard: panah atas/bawah pada pegangan. Tidak aktif saat daftar
  // sedang disaring pencarian (urutan butir yang tersembunyi tidak terlihat).
  function gulirInduk(el) {
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      const o = getComputedStyle(n).overflowY;
      if ((o === 'auto' || o === 'scroll') && n.scrollHeight > n.clientHeight + 1) return n;
    }
    return null; // halaman itu sendiri
  }
  // bagian layar yang benar-benar terlihat saat halaman itu sendiri yang bergulir: di bawah bilah atas yang menempel dan
  // di atas menu bawah (ponsel), supaya gulir otomatis mulai sebelum jari masuk ke bawah menu
  function layarTerlihat() {
    const t = document.querySelector('.m2-top'), b = document.querySelector('.bnav');
    const rt = t && t.getBoundingClientRect(), rb = b && getComputedStyle(b).display !== 'none' ? b.getBoundingClientRect() : null;
    return { top: rt && rt.bottom > 0 && rt.bottom < innerHeight / 2 ? rt.bottom : 0, bottom: rb && rb.height && rb.top > innerHeight / 2 ? rb.top : innerHeight };
  }
  let SERET = null;
  function langkahSeret(t) {
    const s = SERET;
    if (!s) return;
    // gulir sendiri di dekat tepi: makin dekat tepi makin cepat (sampai ~1400 px/detik), dihitung per waktu supaya sama
    // di layar 60 Hz dan 120 Hz
    const dt = Math.min(50, s.t ? t - s.t : 16);
    s.t = t;
    const kotak = s.gulir ? s.gulir.getBoundingClientRect() : s.layar;
    const tepi = Math.min(96, (kotak.bottom - kotak.top) / 4);
    const dalam = s.y < kotak.top + tepi ? -(kotak.top + tepi - s.y) : s.y > kotak.bottom - tepi ? s.y - (kotak.bottom - tepi) : 0;
    const v = dalam ? Math.sign(dalam) * Math.max(1, Math.round(Math.min(1, Math.abs(dalam) / tepi) ** 2 * 1400 * dt / 1000)) : 0;
    // 'instant': html memakai scroll-behavior smooth, yang memperlambat gulir kecil setiap bingkai
    if (v) (s.gulir || window).scrollBy({ top: v, behavior: 'instant' });
    // tukar tempat dengan tetangga yang titik tengahnya sudah dilewati jari
    const tengah = (el) => { const b = el.getBoundingClientRect(); return b.top + b.height / 2; };
    for (let n = 0; n < 200; n++) {
      const sib = [...s.wadah.querySelectorAll(':scope > .dl-i')], k = sib.indexOf(s.det);
      const bawah = sib[k + 1], atas = sib[k - 1];
      const lewat = bawah && s.y > tengah(bawah) ? bawah : atas && s.y < tengah(atas) ? atas : null;
      if (!lewat) break;
      const dulu = lewat.getBoundingClientRect().top;
      if (lewat === bawah) lewat.after(s.det); else lewat.before(s.det);
      const geser = dulu - lewat.getBoundingClientRect().top;
      if (geser && lewat.animate) lewat.animate([{ transform: `translateY(${geser}px)` }, { transform: 'none' }], { duration: 160, easing: 'ease-out' });
    }
    // butir yang ditarik tetap di bawah jari
    const alami = s.det.getBoundingClientRect().top - s.geser;
    s.geser = s.y - s.pegang - alami;
    s.det.style.transform = `translateY(${s.geser}px)`;
    s.raf = requestAnimationFrame(langkahSeret);
  }
  function selesaiSeret() {
    const s = SERET;
    if (!s) return;
    SERET = null;
    cancelAnimationFrame(s.raf);
    try { s.h.releasePointerCapture(s.id); } catch (_) { /* sudah lepas */ }
    document.documentElement.classList.remove('sedang-seret');
    const urutan = [...s.wadah.querySelectorAll(':scope > .dl-i')].map((el) => +el.dataset.i);
    const pasang = () => {
      s.det.classList.remove('diseret');
      s.det.style.transform = '';
      const xs = ambil(s.p), lama = xs.slice();
      if (urutan.length !== lama.length || urutan.every((oi, n) => oi === n)) return;
      urutan.forEach((oi, n) => { xs[n] = lama[oi]; });
      tandai(bagianDari(s.p));
      segarkan(s.wadah);
    };
    // butir meluncur ke tempatnya dulu, baru daftar digambar ulang dengan urutan baru
    if (s.geser && s.det.animate) s.det.animate([{ transform: `translateY(${s.geser}px)` }, { transform: 'none' }], { duration: 140, easing: 'ease-out' }).onfinish = pasang;
    else pasang();
    s.det.style.transform = '';
  }
  document.addEventListener('pointerdown', (e) => {
    const h = e.target.closest && e.target.closest('.dl-seret');
    if (!h || SERET || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const det = h.closest('.dl-i'), wadah = det && det.parentElement;
    if (!det || !wadah) return;
    e.preventDefault();
    if (wadah.classList.contains('dicari')) { NM.toast('Kosongkan pencarian dulu untuk mengatur urutan'); return; }
    SERET = { h, det, wadah, p: det.dataset.dlI, id: e.pointerId, y: e.clientY, pegang: e.clientY - det.getBoundingClientRect().top, geser: 0, gulir: gulirInduk(wadah), layar: layarTerlihat(), raf: 0 };
    try { h.setPointerCapture(e.pointerId); } catch (_) { /* tetap jalan lewat pointermove di dokumen */ }
    det.classList.add('diseret');
    document.documentElement.classList.add('sedang-seret');
    SERET.raf = requestAnimationFrame(langkahSeret);
  });
  document.addEventListener('pointermove', (e) => { if (SERET && e.pointerId === SERET.id) { SERET.y = e.clientY; e.preventDefault(); } }, { passive: false });
  document.addEventListener('pointerup', (e) => { if (SERET && e.pointerId === SERET.id) selesaiSeret(); });
  document.addEventListener('pointercancel', (e) => { if (SERET && e.pointerId === SERET.id) selesaiSeret(); });
  document.addEventListener('keydown', (e) => {
    const h = e.target.closest && e.target.closest('.dl-seret');
    if (!h || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    if (h.closest('.dl.dicari')) return;
    const p = h.dataset.p, i = +h.dataset.i, xs = ambil(p), j = e.key === 'ArrowUp' ? i - 1 : i + 1;
    if (!xs || j < 0 || j >= xs.length) return;
    [xs[i], xs[j]] = [xs[j], xs[i]];
    const k = kunciItem(p, xs[j], j);
    tandai(bagianDari(p));
    segarkan(h);
    const b = document.querySelector(`.dl-i[data-kunci="${CSS.escape(k)}"] > summary .dl-seret`);
    if (b) b.focus({ preventScroll: false });
  });

  document.addEventListener('click', async (e) => {
    const go = e.target.closest('[data-go]');
    if (go) { e.preventDefault(); pergi(go.dataset.go); return; }
    const mode = e.target.closest('[data-pv-mode] button');
    if (mode) {
      PV.mode = mode.dataset.v; lsSet('twh-admin-pv', PV.mode);
      $$('[data-pv-mode] button').forEach((b) => { const on = b.dataset.v === PV.mode; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      $$('.pv-layar').forEach(ukurPv);
      return;
    }
    const lp = e.target.closest('.lampu[data-lampu]');
    if (lp && !e.target.closest('[data-aksi]')) {
      const r = lp.querySelector('img').getBoundingClientRect(), p = lp.dataset.lampu;
      const pt = [Math.round(((e.clientX - r.left) / r.width) * 1000) / 1000, Math.round(((e.clientY - r.top) / r.height) * 1000) / 1000];
      if (pt[0] < 0 || pt[0] > 1 || pt[1] < 0 || pt[1] > 1) return;
      const lama = Array.isArray(ambil(p)) ? ambil(p) : [];
      tetapkan(p, lama.length >= 2 ? [pt] : [...lama, pt]);
      segarkan(lp);
      return;
    }
    const a = e.target.closest('[data-aksi]');
    if (!a) return;
    if (a.closest('summary')) e.preventDefault();
    const p = a.dataset.p, i = +a.dataset.i;
    switch (a.dataset.aksi) {
      case 'seret': return;
      case 'naik': case 'turun': {
        const xs = ambil(p), j = a.dataset.aksi === 'naik' ? i - 1 : i + 1;
        if (j < 0 || j >= xs.length) return;
        [xs[i], xs[j]] = [xs[j], xs[i]];
        const k = kunciItem(p, xs[j], j);
        tandai(bagianDari(p));
        segarkan(a);
        const b = document.querySelector(`.dl-i[data-kunci="${CSS.escape(k)}"] > summary .${a.dataset.aksi}`);
        if (b && !b.disabled) b.focus({ preventScroll: false });
        return;
      }
      case 'hapus': {
        const d = DL[p], xs = ambil(p), x = xs[i];
        const ok = d.hapusCek ? await d.hapusCek(x) : await NM.confirm(`Hapus <b>${esc(d.judul(x, i) || 'butir ini')}</b>?`, { ok: 'Hapus', tone: 'danger' });
        if (!ok) return;
        xs.splice(i, 1);
        tandai(bagianDari(p));
        segarkan(a);
        NM.toast('Dihapus dari draf');
        return;
      }
      case 'tambah': {
        const d = DL[p];
        if (!d) return;
        const x = d.tambahFn ? await d.tambahFn() : d.baru();
        if (!x) return;
        const baru = Array.isArray(x) ? x : [x], xs = ambil(p);
        if (d.diAtas) xs.unshift(...baru); else xs.push(...baru);
        const k = kunciItem(p, baru[0], d.diAtas ? 0 : xs.length - baru.length);
        if (baru.length === 1) TERBUKA.add(k);
        tandai(bagianDari(p));
        FOKUS = k;
        segarkan(a);
        if (FOKUS) {
          FOKUS = null;
          const el = document.querySelector(`.dl-i[data-kunci="${CSS.escape(k)}"]`);
          if (el) { el.scrollIntoView({ block: 'center' }); const f = el.querySelector('.dl-isi input:not([type=date]):not([type=checkbox]), .dl-isi textarea'); if (f) f.focus({ preventScroll: true }); }
        }
        return;
      }
      case 'foto-ganti': { const f = await pilihFoto({ sekarang: ambil(p) }); if (f) { tetapkan(p, f); segarkan(a); } return; }
      case 'foto-hapus': tetapkan(p, ''); segarkan(a); return;
      case 'lampu-hapus': tetapkan(p, []); segarkan(a); return;
      case 'fotos-tambah': {
        const fs = await pilihFoto({ banyak: true });
        if (!fs || !fs.length) return;
        let xs = ambil(p);
        if (!Array.isArray(xs)) { xs = []; tetapkan(p, xs); }
        fs.forEach((f) => { if (!xs.includes(f)) xs.push(f); });
        tandai(bagianDari(p)); segarkan(a);
        return;
      }
      case 'fotos-ganti': { const xs = ambil(p), f = await pilihFoto({ sekarang: xs[i] }); if (f) { xs[i] = f; tandai(bagianDari(p)); segarkan(a); } return; }
      case 'fotos-hapus': ambil(p).splice(i, 1); tandai(bagianDari(p)); segarkan(a); return;
      case 'fotos-kiri': { const xs = ambil(p); [xs[i - 1], xs[i]] = [xs[i], xs[i - 1]]; tandai(bagianDari(p)); segarkan(a); return; }
      case 'tag-hapus': { const tg = a.closest('.tg'); ambil(p).splice(i, 1); tandai(bagianDari(p)); gambarTag(tg, p); return; }
      case 'tgl-kosong': {
        tetapkan(p, '');
        const inp = document.getElementById(idDari(p));
        if (inp) { inp.value = ''; inp.dispatchEvent(new Event('change', { bubbles: true })); }
        let det = a.closest('.dl-i');
        while (det) { perbaruiJudul(det); det = det.parentElement.closest('.dl-i'); }
        return;
      }
      case 'pv-muat': pratinjauSegarkan(); return;
      case 'pv-ke': pvKe(a.dataset.ke, true); if (!$('.ed-pv')) bukaPratinjau(LAYAR.pv || '/', a.dataset.ke); return;
      case 'pv-lembar': bukaPratinjau(a.dataset.path || '/'); return;
      case 'terbit': bukaTerbit(); return;
      case 'buang': buang(a.dataset.b || ''); return;
      case 'pulihkan': pulihkan(+a.dataset.id); return;
      case 'media-buka': bukaMedia(a.dataset.id); return;
      case 'akun-tambah': akunTambah(); return;
      case 'akun-atur': akunAtur(+a.dataset.id); return;
      case 'menu': bukaMenu(); return;
      case 'menu-saya': menuSaya(); return;
      case 'tambah-cepat': tambahCepat(); return;
      case 'cepat': cepat(a.dataset.j); return;
      case 'cari': bukaCari(); return;
      case 'coba-simpan': Object.entries(KERJA).forEach(([b, k]) => { if (k.gagal) simpan(b); }); return;
      case 'keluar': keluar(false); return;
      case 'keluar-semua': if (await NM.confirm('Keluar dari semua perangkat, termasuk yang ini?', { ok: 'Keluar dari semua' })) keluar(true); return;
    }
  });

  // ------------------------------------------------------------------ masuk dengan kode email
  const BRAND = '<div class="brand"><img src="/assets/logo/lencana.webp" alt="" width="36" height="40"><span>TWH Rent Car</span></div>';
  function tampilMasuk(pesan) {
    NM.sheet.close(true);
    S.akun = null;
    if (ASISTEN) { ASISTEN.lepas(); ASISTEN = null; }
    document.body.classList.add('is-login');
    document.title = 'Masuk · Panel TWH Rent Car';
    $('#app').innerHTML = `<div class="login">
      <section class="login-art" aria-hidden="true">${BRAND}
        <div class="la-copy"><h2>Kelola situs<br>TWH Rent Car.</h2><p>Ubah harga dan foto mobil, teks halaman, layanan, dan FAQ. Semua diperiksa dulu di pratinjau, lalu diterbitkan.</p></div>
        <div class="la-chips"><span>${ic('mail')} Masuk dengan kode email</span><span>${ic('eye')} Pratinjau sebelum terbit</span><span>${ic('history')} Versi lama bisa dipulihkan</span></div>
      </section>
      <section class="login-card"><div class="lc-brand">${BRAND}</div><div id="masuk" class="login-alt"></div><p class="hint center">Panel ini hanya untuk pemilik dan admin yang emailnya sudah didaftarkan ARSWORD.</p></section>
    </div>`;
    langkahEmail(pesan);
  }
  function langkahEmail(pesan, email = lsGet('twh-admin-email') || '') {
    const box = $('#masuk');
    box.innerHTML = `<h1>Masuk</h1><p class="sub">Kami kirim kode 6 angka ke email Anda. Tanpa kata sandi.</p>
      ${pesan ? `<div class="catatan">${ic('info')}<span>${esc(pesan)}</span></div>` : ''}
      <form class="form" data-email novalidate>${F.field('Email', `<input type="email" name="email" value="${esc(email)}" autocomplete="email" inputmode="email" placeholder="nama@email.com" required autofocus>`)}
        <button type="submit" class="btn primary big block">${ic('mail')}<span>Kirim kode</span></button></form>`;
    const f = $('form', box), inp = $('input', f);
    setTimeout(() => inp.focus(), 50);
    f.onsubmit = async (e) => {
      e.preventDefault();
      const em = inp.value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return F.err(f, 'Tulis alamat email yang benar.');
      const b = $('button[type=submit]', f);
      b.disabled = true;
      try {
        const d = await api('masuk/kode', { method: 'POST', body: { email: em }, diam: true });
        lsSet('twh-admin-email', em);
        langkahKode(em, d.devKode, d.devTerdaftar === false);
      } catch (err) { b.disabled = false; F.err(f, esc(err.message)); }
    };
  }
  function langkahKode(email, devKode, devTakTerdaftar) {
    const box = $('#masuk');
    box.innerHTML = `<h1>Cek email Anda</h1><p class="sub">Bila <span class="lc-email">${esc(email)}</span> terdaftar, kodenya sudah dikirim. Berlaku 10 menit. Periksa juga folder Spam.</p>
      ${devKode ? `<div class="kode-uji">Mode uji lokal: kodenya ${esc(devKode)}</div>` : devTakTerdaftar ? '<div class="kode-uji">Mode uji lokal: email ini belum terdaftar, jadi tidak ada kode.</div>' : ''}
      <form class="form" data-kode novalidate>${F.field('Kode 6 angka', '<input type="text" name="kode" class="kode-in" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]*" placeholder="······" required autofocus>')}
        <button type="submit" class="btn primary big block">${ic('check')}<span>Masuk</span></button></form>
      <div class="baris-link"><button type="button" class="link" data-ganti>Ganti email</button><button type="button" class="link" data-ulang disabled>Kirim ulang (60)</button></div>`;
    const f = $('form', box), inp = $('input', f), ulang = $('[data-ulang]', box);
    setTimeout(() => inp.focus(), 50);
    let sisa = 60;
    const t = setInterval(() => { if (!ulang.isConnected) return clearInterval(t); sisa--; ulang.textContent = sisa > 0 ? `Kirim ulang (${sisa})` : 'Kirim ulang'; ulang.disabled = sisa > 0; if (sisa <= 0) clearInterval(t); }, 1000);
    $('[data-ganti]', box).onclick = () => langkahEmail('', email);
    ulang.onclick = async () => {
      ulang.disabled = true;
      try { const d = await api('masuk/kode', { method: 'POST', body: { email }, diam: true }); NM.toast('Kode baru dikirim'); langkahKode(email, d.devKode, d.devTerdaftar === false); } catch (err) { F.err(f, esc(err.message)); ulang.disabled = false; }
    };
    let jalan = false;
    const kirim = async () => {
      const kode = inp.value.replace(/\D/g, '');
      if (kode.length !== 6) return F.err(f, 'Kodenya 6 angka.');
      if (jalan) return;
      jalan = true;
      const b = $('button[type=submit]', f);
      b.disabled = true;
      try {
        await api('masuk/verifikasi', { method: 'POST', body: { email, kode }, diam: true });
        clearInterval(t);
        mulai();
      } catch (err) { jalan = false; b.disabled = false; inp.select(); F.err(f, esc(err.message)); }
    };
    f.onsubmit = (e) => { e.preventDefault(); kirim(); };
    inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(0, 6); if (inp.value.length === 6) kirim(); });
  }
  let habis = false;
  function sesiHabis() {
    if (habis) return;
    habis = true;
    tampilMasuk('Sesi Anda sudah berakhir. Masuk lagi dengan kode email.');
  }
  async function keluar(semua) {
    await tuntaskan();
    try { await api(semua ? 'keluar-semua' : 'keluar', { method: 'POST', body: {}, diam: true }); } catch (e) { /* tetap ke halaman masuk */ }
    S.isi = null;
    tampilMasuk(semua ? 'Anda sudah keluar dari semua perangkat.' : 'Anda sudah keluar.');
  }

  // ------------------------------------------------------------------ mulai
  function gagalMuat(e) {
    $('#app').innerHTML = `<div class="memuat">${UI.empty('Panel belum bisa dimuat', esc(e.message), '<button type="button" class="btn dark" data-ulang-muat>Coba lagi</button>')}</div>`;
    $('[data-ulang-muat]').onclick = () => { $('#app').innerHTML = '<div class="memuat"><span class="putar"></span><span>Memuat panel admin…</span></div>'; mulai(); };
  }
  // tiket dari dashboard ARSWORD yang ditolak (worker/auth.js masukTiket) kembali ke sini dengan ?tiket=…
  const TIKET = { gagal: 'Tautan masuk dari dashboard ARSWORD sudah tidak berlaku (hanya satu menit dan sekali pakai). Buka lagi dari dashboard, atau masuk dengan kode email.', nonaktif: 'Akun ARSWORD ini dinonaktifkan di panel TWH Rent Car. Minta akun pembuat mengaktifkannya lagi.' };
  let pesanTiket = TIKET[new URLSearchParams(location.search).get('tiket')] || '';
  if (location.search) history.replaceState(null, '', location.pathname + location.hash);
  async function mulai() {
    habis = false;
    try { S.akun = await api('saya', { diam: true }); } catch (e) { if (e.status === 401) { const p = pesanTiket; pesanTiket = ''; return tampilMasuk(p); } return gagalMuat(e); }
    try {
      const [isi, media, bw] = await Promise.all([api('isi'), api('media'), api('bawaan')]);
      S.media = media.media; S.bawaan = bw.foto; S.tempat = bw.tempat || [];
      indeksMedia();
      kerangka();
      terapkanDraf(isi);
    } catch (e) { if (e.status !== 401) gagalMuat(e); return; }
    LAYAR = {};
    render(true);
    pasangAsisten();
  }

  // ------------------------------------------------------------------ asisten Claude (asisten.js), khusus admin ARSWORD
  // Server bertanya ke ARSWORD apakah akun ini admin ARSWORD; hanya bila ya maskotnya dipasang.
  let ASISTEN = null;
  async function pasangAsisten() {
    let boleh = false;
    try { boleh = !!(await api('asisten', { diam: true })).boleh; } catch (e) { boleh = false; }
    if (ASISTEN && (!boleh || !S.akun || ASISTEN.email !== S.akun.email)) { ASISTEN.lepas(); ASISTEN = null; }
    if (!boleh || ASISTEN || !S.akun || !window.TWHAsisten) return;
    ASISTEN = window.TWHAsisten.pasang({
      email: S.akun.email, esc, ic, NM, api, tuntaskan,
      layar: () => { const r = ruteSekarang(); return `${(NAV.find((n) => n.id === r.id) || { l: r.id }).l}${r.sub ? ' › ' + r.sub : ''} (${location.hash || '#/beranda'})`; },
      terapkan: terapkanUsulan,
      lihat: (u) => { const b = u.bagian[0]; if (b) { location.hash = b.letak; } },
    });
  }
  // usulan asisten ke draf: isi bagian diganti seperti diketik admin (tersimpan otomatis), hanya bila bagian itu tidak
  // berubah sejak usulannya dibuat (nomor revisi sama dan tidak ada yang belum tersimpan)
  async function terapkanUsulan(u) {
    await tuntaskan();
    const berubah = u.bagian.filter((x) => !S.isi || !Object.hasOwn(S.isi, x.kunci) || (S.rev[x.kunci] || 0) !== x.rev || (KERJA[x.kunci] && (KERJA[x.kunci].kotor || KERJA[x.kunci].jalan)));
    if (berubah.length) {
      NM.toast(`${berubah.map((x) => x.label).join(', ')} berubah sejak usulan ini dibuat. Minta asisten menyusunnya lagi.`, 'bad');
      return false;
    }
    for (const x of u.bagian) { S.isi[x.kunci] = x.data; tandai(x.kunci); }
    render();
    return true;
  }
  mulai();
})();
