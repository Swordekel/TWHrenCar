/* Asisten Claude di panel admin TWH Rent Car, khusus admin ARSWORD (pemilik ARSWORD, 2026-11-12: "ai claude sebagai ai
 * assistent di admin panel ... maskot ai assistent yang lucu untuk tiap admin panel tersebut mengikuti tema website nya
 * terbuat dari css/svg gitu yang interaktif dan beranimasi"). admin.js memasangnya hanya bila server bilang akun ini
 * admin ARSWORD (GET /admin/api/asisten), dan server menjawab hanya mereka (worker/asisten.js). Laci dan kartunya sama
 * dengan asisten panel Silibet.
 *
 * Maskotnya mobil kecil mint seperti armada di situs, dilihat dari depan: lampu depan jadi mata (mengikuti kursor atau
 * jari dan berkedip), gril jadi mulut, lencana segi enam TWH di hidung, spion jadi telinga. Digambar SVG dan digerakkan
 * CSS (asisten.css): mengayun di atas pegasnya; dengar (admin mengetik: spion tegak), pikir (lampu atap kuning
 * berkedip), bicara (gril membuka-menutup), susun (wiper menyapu kaca), senang (mata tersenyum, asap dan bintang), galat
 * (miring seperti ban kempis, uap dari atap). Ketuk: melompat dan lampu depannya menyala, seperti mobil di beranda situs.
 * Semua gerak berulang berhenti bila "kurangi gerak" menyala; matanya tetap melihat.
 *
 * Maskot di pojok membuka laci di samping panel. Usulan datang sebagai kartu (sebelum → sesudah per bagian) dan baru masuk
 * draf lewat "Terapkan ke draf" (o.terapkan di admin.js). Permintaan kode juga kartu, dikirim ke halaman Claude ARSWORD
 * hanya atas ketukan admin. Percakapan disimpan di tab ini (sessionStorage), per akun.
 */
(function () {
  'use strict';

  // ------------------------------------------------------------------ maskot mobil TWH
  // Mobil kecil mint dari depan: kaca navy, lampu depan = mata (biji matanya mengikuti kursor), gril = mulut, lencana
  // segi enam TWH di hidung, spion = telinga, lampu atap kuning (berkedip saat berpikir), wiper (bergerak saat menyusun).
  const HEKS = (x0, y0, w, h) => `${x0 + w / 2},${y0} ${x0 + w},${y0 + h * 0.25} ${x0 + w},${y0 + h * 0.75} ${x0 + w / 2},${y0 + h} ${x0},${y0 + h * 0.75} ${x0},${y0 + h * 0.25}`;
  const SVG = `
  <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <ellipse class="mk-bayang" cx="50" cy="93.5" rx="31" ry="3.6" fill="rgba(13,35,49,.2)"/>
    <g class="mk-tubuh">
      <g class="mk-sorot"><path d="M27 62L-2 49v26z"/><path d="M73 62L102 49v26z"/></g>
      <g class="mk-asap">
        <circle class="a1" cx="11" cy="82" r="3.8"/><circle class="a2" cx="89" cy="82" r="3.4"/>
        <path class="a3" d="M17 25l1.4 2.8 3 .4-2.2 2.1.5 3-2.7-1.4-2.7 1.4.5-3-2.2-2.1 3-.4z" fill="#90D0BF" stroke="var(--mk-garis)" stroke-width=".7"/>
        <path class="a4" d="M84 20l1.2 2.4 2.6.4-1.9 1.8.4 2.6-2.3-1.2-2.3 1.2.4-2.6-1.9-1.8 2.6-.4z" fill="#FFD66B" stroke="var(--mk-garis)" stroke-width=".7"/>
        <circle class="a5" cx="90" cy="42" r="1.9" fill="#1B4766"/>
      </g>
      <g class="mk-roda" fill="var(--mk-ban)"><rect x="19" y="77" width="16" height="14" rx="5"/><rect x="65" y="77" width="16" height="14" rx="5"/></g>
      <g class="mk-spion" fill="var(--mk-mint)" stroke="var(--mk-garis)" stroke-width="1.6" stroke-linejoin="round">
        <path class="s1" d="M20 50c-5.5-1.8-9.5.4-9.5 4.2s4 4.4 9.5 2.2z"/><path class="s2" d="M80 50c5.5-1.8 9.5.4 9.5 4.2s-4 4.4-9.5 2.2z"/>
      </g>
      <g class="mk-kabin">
        <g class="mk-lampu-atap"><path d="M45 21.8a5 5 0 0 1 10 0z" fill="var(--mk-sirene)" stroke="var(--mk-garis)" stroke-width="1.4"/><rect x="43.5" y="21" width="13" height="2.6" rx="1.3" fill="var(--mk-navy)"/></g>
        <path d="M23.5 55C23.5 32 35 22.5 50 22.5S76.5 32 76.5 55z" fill="var(--mk-mint)" stroke="var(--mk-garis)" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M30.5 53C30.5 37.5 38.5 29.5 50 29.5S69.5 37.5 69.5 53z" fill="var(--mk-kaca)" stroke="var(--mk-garis)" stroke-width="1.6"/>
        <path d="M36.5 47.5c1-7.5 5.5-12.4 11-14" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="2.6" stroke-linecap="round"/>
        <path class="mk-wiper" d="M50.5 52.4L37.5 42.6" fill="none" stroke="var(--mk-garis)" stroke-width="1.7" stroke-linecap="round"/>
      </g>
      <path d="M14 67c0-9.5 5.5-15 14.5-15.5h43c9 .5 14.5 6 14.5 15.5v9.5c0 4.2-3 7-7 7H21c-4 0-7-2.8-7-7z" fill="var(--mk-mint)" stroke="var(--mk-garis)" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M19.5 59.5c2.6-3.4 5.8-4.6 10-4.8" fill="none" stroke="rgba(255,255,255,.65)" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M17 78.5h66" stroke="var(--mk-navy)" stroke-width="3.2" stroke-linecap="round"/>
      <g class="mk-wajah">
        <path class="mk-alis" d="M26.5 52.8q6.5-3.6 13 0M60.5 52.8q6.5-3.6 13 0" fill="none" stroke="var(--mk-garis)" stroke-width="2.3" stroke-linecap="round"/>
        <g class="mk-mata">
          <circle cx="33" cy="62" r="7.6" fill="var(--mk-krem)" stroke="var(--mk-garis)" stroke-width="1.9"/>
          <circle cx="67" cy="62" r="7.6" fill="var(--mk-krem)" stroke="var(--mk-garis)" stroke-width="1.9"/>
          <g class="mk-bola" fill="var(--mk-garis)"><circle cx="33" cy="62.4" r="3.5"/><circle cx="67" cy="62.4" r="3.5"/>
            <circle cx="34.4" cy="60.9" r="1.25" fill="#fff"/><circle cx="68.4" cy="60.9" r="1.25" fill="#fff"/></g>
        </g>
        <g class="mk-mata-tutup" fill="none" stroke="var(--mk-garis)" stroke-width="2.3" stroke-linecap="round"><path d="M27.3 63.4q5.7-5.4 11.4 0"/><path d="M61.3 63.4q5.7-5.4 11.4 0"/></g>
        <ellipse cx="22.5" cy="71.5" rx="3.4" ry="2.1" fill="var(--mk-pipi)"/><ellipse cx="77.5" cy="71.5" rx="3.4" ry="2.1" fill="var(--mk-pipi)"/>
        <g class="mk-lencana"><polygon points="${HEKS(46.4, 56.6, 7.2, 7.9)}" fill="var(--mk-navy)"/><polygon points="${HEKS(47.7, 58, 4.6, 5.1)}" fill="var(--mk-mint)"/></g>
        <path class="mk-mulut senyum" d="M43.5 70.6q6.5 5.2 13 0" fill="none" stroke="var(--mk-garis)" stroke-width="2.1" stroke-linecap="round"/>
        <g class="mk-mulut buka"><rect x="43.5" y="68.6" width="13" height="7.4" rx="3.6" fill="var(--mk-garis)"/><path d="M46 72.3h8" stroke="rgba(255,255,255,.35)" stroke-width="1.1" stroke-linecap="round"/></g>
        <circle class="mk-mulut o" cx="50" cy="72.2" r="2.3" fill="var(--mk-garis)"/>
        <path class="mk-mulut lebar" d="M42.5 69.3h15q-.9 7.8-7.5 7.8t-7.5-7.8z" fill="var(--mk-garis)"/>
        <path class="mk-mulut datar" d="M44.3 72.6q2.85-1.9 5.7 0t5.7 0" fill="none" stroke="var(--mk-garis)" stroke-width="1.9" stroke-linecap="round"/>
      </g>
      <g class="mk-uap" fill="none" stroke="#9DB3BE" stroke-width="1.8" stroke-linecap="round"><path class="u1" d="M30 19q-3-3 0-6t0-6"/><path class="u2" d="M70 19q3-3 0-6t0-6"/></g>
    </g>
  </svg>`;

  const kurangiGerak = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const semua = new Set();
  let px = innerWidth / 2, py = innerHeight / 2, rafLihat = 0;
  const lihatSemua = () => { rafLihat = 0; semua.forEach((m) => m.lihat(px, py)); };
  const gerak = (e) => { px = e.clientX; py = e.clientY; if (!rafLihat) rafLihat = requestAnimationFrame(lihatSemua); };
  addEventListener('pointermove', gerak, { passive: true });
  addEventListener('pointerdown', gerak, { passive: true });

  function buatMaskot() {
    const el = document.createElement('span');
    el.className = 'maskot maskot-mobil';
    el.dataset.mode = 'diam';
    el.innerHTML = SVG;
    const bola = el.querySelector('.mk-bola');
    let mode = 'diam', tKedip = 0, tReaksi = 0;
    const api = {
      el,
      // biji mata menoleh ke kursor (sedikit saja, supaya tetap di dalam mata)
      lihat(x, y) {
        if (!el.isConnected) return;
        if (mode === 'pikir' || mode === 'susun') { bola.style.transform = 'translate(1.3px,-2px)'; return; }
        const r = el.getBoundingClientRect();
        if (!r.width) return;
        const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height * 0.62);
        const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 260);
        bola.style.transform = `translate(${((dx / d) * 2.8 * k).toFixed(2)}px,${((dy / d) * 2.8 * k).toFixed(2)}px)`;
      },
      mode(m) { mode = m; el.dataset.mode = m; api.lihat(px, py); },
      reaksi() {
        if (kurangiGerak()) return;
        clearTimeout(tReaksi);
        el.classList.remove('reaksi');
        void el.offsetWidth;
        el.classList.add('reaksi');
        tReaksi = setTimeout(() => el.classList.remove('reaksi'), 950);
      },
    };
    const kedip = () => {
      clearTimeout(tKedip);
      tKedip = setTimeout(() => {
        if (!el.isConnected) { semua.delete(api); return; }
        el.classList.add('kedip');
        setTimeout(() => el.classList.remove('kedip'), 150);
        kedip();
      }, 2200 + Math.random() * 3800);
    };
    semua.add(api);
    kedip();
    requestAnimationFrame(() => api.lihat(px, py));
    return api;
  }

  // ------------------------------------------------------------------ laci obrolan
  const MAKS_GILIRAN = 28; // pertanyaan dalam satu percakapan (worker/asisten.js MAKS_RIWAYAT)
  const SARAN = ['Berapa harga sewa semua mobil sekarang?', 'Mobil apa saja yang tampil di panggung beranda?', 'Teks mana yang masih menulis harga sendiri?', 'Apa saja yang berubah di draf sekarang?'];

  function pasang(o) {
    const { esc, ic, NM } = o;
    const KUNCI = `twh-asisten:${o.email}`;
    const kosong = () => ({ riwayat: [], tampil: [], hasil: {} });
    let P = kosong();
    try { const s = JSON.parse(sessionStorage.getItem(KUNCI) || 'null'); if (s && Array.isArray(s.riwayat) && Array.isArray(s.tampil)) P = { ...kosong(), ...s }; } catch (e) { /* mode privat */ }
    const simpanLokal = () => { try { sessionStorage.setItem(KUNCI, JSON.stringify(P)); } catch (e) { /* penuh atau mode privat */ } };
    let sibuk = null; // { henti, teks, status }

    const tombol = document.createElement('button');
    tombol.type = 'button';
    tombol.className = 'ai-buka';
    tombol.setAttribute('aria-label', 'Buka asisten Claude untuk TWH Rent Car');
    const mkTombol = buatMaskot();
    tombol.append(mkTombol.el);
    tombol.insertAdjacentHTML('beforeend', '<span class="ai-buka-label">Tanya asisten TWH</span>');

    const laci = document.createElement('aside');
    laci.className = 'ai-laci';
    laci.setAttribute('aria-label', 'Asisten Claude untuk TWH Rent Car');
    laci.innerHTML = `
      <header class="ai-kepala"><span data-mk-kepala></span>
        <div class="ai-kepala-t"><b>Asisten TWH</b><small>Claude · khusus admin ARSWORD</small></div>
        <button type="button" class="ai-ikon" data-ai="baru" aria-label="Mulai percakapan baru" title="Percakapan baru">${ic('plus')}</button>
        <button type="button" class="ai-ikon" data-ai="tutup" aria-label="Tutup asisten" title="Tutup">${ic('x')}</button></header>
      <div class="ai-isi" data-isi aria-live="polite"></div>
      <div class="ai-kaki">
        <form class="ai-tulis" data-form><textarea rows="1" data-tulis placeholder="Tanya, atau tempel revisi dari klien…" aria-label="Pesan untuk asisten" maxlength="8000"></textarea>
          <button type="submit" class="ai-kirim" data-kirim aria-label="Kirim">${ic('send')}</button></form>
        <div class="ai-catatan">Usulan baru masuk draf setelah Anda menekan Terapkan; situs berubah setelah Terbitkan.</div>
      </div>`;
    const mkKepala = buatMaskot();
    laci.querySelector('[data-mk-kepala]').replaceWith(mkKepala.el);
    document.body.append(tombol, laci);
    const isi = laci.querySelector('[data-isi]');
    const ta = laci.querySelector('[data-tulis]');
    const kirimB = laci.querySelector('[data-kirim]');
    let mkSambut = null;
    const mode = (m) => [mkTombol, mkKepala, mkSambut].filter(Boolean).forEach((x) => x.mode(m));
    let tSenang = 0;
    const senang = () => { mode('senang'); clearTimeout(tSenang); tSenang = setTimeout(() => { if (!sibuk) mode('diam'); }, 2200); };
    const html = document.documentElement;

    const buka = () => { html.classList.add('ai-laci-buka'); tombol.removeAttribute('data-baru'); gambar(); setTimeout(() => ta.focus({ preventScroll: true }), 120); };
    const tutup = () => { html.classList.remove('ai-laci-buka'); tombol.focus({ preventScroll: true }); };
    tombol.addEventListener('click', () => { mkTombol.reaksi(); buka(); });
    mkKepala.el.addEventListener('click', () => mkKepala.reaksi());
    const padaTombol = (e) => { if (e.key === 'Escape' && html.classList.contains('ai-laci-buka') && !document.querySelector('.sheet-wrap.in')) tutup(); };
    document.addEventListener('keydown', padaTombol);

    // sedikit Markdown, aman
    const sebaris = (s) => esc(s)
      .replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>')
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\bhttps?:\/\/[^\s<)]+/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
    function md(teks) {
      const out = [];
      let daftar = null, para = [];
      const tutupDaftar = () => { if (daftar) { out.push(`<${daftar.t}>${daftar.li.map((x) => `<li>${x}</li>`).join('')}</${daftar.t}>`); daftar = null; } };
      const tutupPara = () => { if (para.length) { out.push(`<p>${para.map(sebaris).join('<br>')}</p>`); para = []; } };
      for (const baris of String(teks || '').split('\n')) {
        const ul = baris.match(/^\s*[-*•]\s+(.*)$/), ol = baris.match(/^\s*\d+[.)]\s+(.*)$/), h = baris.match(/^#{1,4}\s+(.*)$/);
        if (ul || ol) {
          tutupPara();
          const t = ul ? 'ul' : 'ol';
          if (!daftar || daftar.t !== t) { tutupDaftar(); daftar = { t, li: [] }; }
          daftar.li.push(sebaris((ul || ol)[1]));
        } else if (!baris.trim()) { tutupPara(); tutupDaftar(); }
        else if (h) { tutupPara(); tutupDaftar(); out.push(`<p><b>${sebaris(h[1])}</b></p>`); }
        else { tutupDaftar(); para.push(baris); }
      }
      tutupPara(); tutupDaftar();
      return out.join('');
    }

    const potongTampil = (v) => (v == null ? '' : String(v).length > 400 ? String(v).slice(0, 397) + '…' : String(v));
    function kartuUsulan(x, i) {
      const u = x.u;
      const jumlah = u.bagian.length ? u.bagian.map((b) => b.label).join(' · ') : 'tidak ada perubahan yang bisa dipakai';
      const baris = u.bagian.map((b) => `<li><small>${esc(b.label)}</small>${b.perubahan.map((p) => (p.teks != null
        ? `<span class="ai-baru">${esc(potongTampil(p.teks))}</span>`
        : `<span class="ai-nama">${esc(p.nama)}</span><span class="ai-lama">${esc(potongTampil(p.lama))}</span><span class="ai-baru">${esc(potongTampil(p.baru))}</span>`)).join('')}</li>`);
      const aksi = x.status === 'diterapkan' ? `<div class="ai-hasil">${ic('check')}<span>Diterapkan ke draf · <a href="#" data-ai="lihat" data-i="${i}">Lihat di panel</a></span></div>`
        : x.status === 'dilewati' ? '<div class="ai-hasil lewat"><span>Tidak diterapkan</span></div>'
          : u.bagian.length ? `<div class="ai-aksi"><button type="button" class="btn dark sm" data-ai="terapkan" data-i="${i}">${ic('check')}<span>Terapkan ke draf</span></button><button type="button" class="btn ghost sm" data-ai="lewati" data-i="${i}">Lewati</button></div>` : '';
      return `<div class="ai-kartu"><div class="ai-kartu-h"><span class="al-ic">${ic('edit')}</span><div><b>${esc(u.ringkasan)}</b><small>Usulan · ${esc(jumlah)}</small></div></div>
        ${baris.length ? `<ul class="ai-ubah">${baris.join('')}</ul>` : ''}
        ${u.peringatan.length ? `<ul class="ai-peringatan">${u.peringatan.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}${aksi}</div>`;
    }
    function kartuKode(x, i) {
      const k = x.k;
      const aksi = x.status === 'dikirim' ? `<div class="ai-hasil">${ic('check')}<span>Terkirim ke halaman Claude · <a href="https://arswordlab.com/studio/admin/bug/" target="_blank" rel="noopener">Buka</a></span></div>`
        : x.status === 'dilewati' ? '<div class="ai-hasil lewat"><span>Tidak dikirim</span></div>'
          : `<div class="ai-aksi"><button type="button" class="btn dark sm" data-ai="kirim-kode" data-i="${i}">${ic('send')}<span>Kirim ke halaman Claude</span></button><button type="button" class="btn ghost sm" data-ai="lewati" data-i="${i}">Lewati</button></div>`;
      return `<div class="ai-kartu"><div class="ai-kartu-h"><span class="al-ic">${ic('board')}</span><div><b>${esc(k.judul)}</b><small>Permintaan kode untuk tim Claude</small></div></div><pre class="ai-kode">${esc(k.isi)}</pre>${aksi}</div>`;
    }
    const sambut = () => `<div class="ai-sambut"><span data-mk-sambut></span><h3>Halo, Kak! Saya asisten TWH.</h3>
      <p>Saya hafal isi situs TWH Rent Car: mobil, harga, kota, dan FAQ-nya. Tanyakan apa saja, atau tempel revisi dari klien: saya siapkan perubahannya, Kakak tinggal menerapkan.</p>
      <div class="ai-saran">${SARAN.map((s) => `<button type="button" data-ai="saran">${esc(s)}</button>`).join('')}</div></div>`;
    const alirHTML = () => `${sibuk.teks ? md(sibuk.teks) : ''}${sibuk.status ? `<div class="ai-status">${esc(sibuk.status)}</div>` : ''}${!sibuk.teks ? '<span class="ai-mengetik" aria-label="Asisten sedang berpikir"><i></i><i></i><i></i></span>' : ''}`;
    function gambar() {
      isi.innerHTML = P.tampil.length ? P.tampil.map((x, i) => (x.jenis === 'saya' ? `<div class="ai-pesan saya">${esc(x.teks)}</div>`
        : x.jenis === 'dia' ? `<div class="ai-pesan dia">${md(x.teks)}</div>`
          : x.jenis === 'usulan' ? kartuUsulan(x, i)
            : x.jenis === 'kode' ? kartuKode(x, i)
              : x.jenis === 'galat' ? `<div class="ai-pesan galat">${ic('alert')}<span>${esc(x.teks)}</span></div>` : '')).join('') : sambut();
      mkSambut = null;
      const t = isi.querySelector('[data-mk-sambut]');
      if (t) { mkSambut = buatMaskot(); t.replaceWith(mkSambut.el); mkSambut.el.addEventListener('click', () => mkSambut.reaksi()); mkSambut.mode(mkKepala.el.dataset.mode); }
      if (sibuk) isi.insertAdjacentHTML('beforeend', `<div class="ai-pesan dia" data-alir>${alirHTML()}</div>`);
      isi.scrollTop = isi.scrollHeight;
      perbaruiKirim();
    }
    function perbaruiAlir() {
      const el = isi.querySelector('[data-alir]');
      if (!el) { gambar(); return; }
      el.innerHTML = alirHTML();
      isi.scrollTop = isi.scrollHeight;
    }
    function perbaruiKirim() {
      kirimB.classList.toggle('henti', !!sibuk);
      kirimB.innerHTML = sibuk ? ic('x') : ic('send');
      kirimB.setAttribute('aria-label', sibuk ? 'Hentikan jawaban' : 'Kirim');
      kirimB.disabled = !sibuk && !ta.value.trim();
    }

    async function tanya(teks) {
      teks = String(teks || '').trim();
      if (!teks || sibuk) return;
      if (P.riwayat.filter((m) => m.role === 'user').length >= MAKS_GILIRAN) { NM.toast('Percakapan ini sudah panjang. Mulai percakapan baru supaya asisten tetap cepat.', 'bad'); return; }
      P.tampil.push({ jenis: 'saya', teks });
      simpanLokal();
      const henti = new AbortController();
      sibuk = { henti, teks: '', status: '' };
      ta.value = ''; ukurTa();
      mode('pikir');
      gambar();
      let selesai = null, galat = null;
      try {
        // (asisten membaca draf dari server: perubahan yang belum tersimpan disimpan dulu)
        await o.tuntaskan();
        const res = await fetch('/admin/api/asisten', {
          method: 'POST', credentials: 'same-origin', cache: 'no-store', signal: henti.signal,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ riwayat: P.riwayat, pesan: teks, hasil: P.hasil, layar: o.layar() }),
        });
        if (!res.ok || !res.body) {
          const d = await res.json().catch(() => ({}));
          galat = res.status === 401 ? 'Sesi Anda habis. Muat ulang halaman lalu masuk lagi.' : d.pesan || `Asisten belum bisa menjawab (${res.status}).`;
        } else {
          const baca = res.body.getReader(), dek = new TextDecoder();
          let sisa = '';
          for (;;) {
            const { value, done } = await baca.read();
            if (done) break;
            sisa += dek.decode(value, { stream: true });
            let i;
            while ((i = sisa.indexOf('\n\n')) >= 0) {
              const blok = sisa.slice(0, i);
              sisa = sisa.slice(i + 2);
              const ev = (blok.match(/^event: (.*)$/m) || [])[1], data = (blok.match(/^data: (.*)$/m) || [])[1];
              if (!ev || data == null) continue;
              let d = {};
              try { d = JSON.parse(data); } catch (e) { continue; }
              if (ev === 'teks') { sibuk.teks += d.t; sibuk.status = ''; mode('bicara'); perbaruiAlir(); }
              else if (ev === 'ulang') { sibuk.teks = ''; perbaruiAlir(); }
              else if (ev === 'alat') { sibuk.status = d.nama === 'tulis_permintaan_kode' ? 'Menulis permintaan kode…' : 'Menyusun usulan perubahan…'; mode('susun'); perbaruiAlir(); }
              else if (ev === 'selesai') selesai = d;
              else if (ev === 'galat') galat = d.pesan || 'Asisten sedang bermasalah.';
            }
          }
          if (!selesai && !galat) galat = 'Jawabannya terputus. Coba lagi.';
        }
      } catch (e) {
        galat = e && e.name === 'AbortError' ? 'Dihentikan.' : 'Tidak terhubung ke asisten. Periksa internet lalu coba lagi.';
      }
      sibuk = null;
      if (selesai) {
        P.riwayat.push(...selesai.tambah);
        P.hasil = {};
        if (selesai.teks) P.tampil.push({ jenis: 'dia', teks: selesai.teks + (selesai.terpotong ? '\n\n(Jawaban terpotong karena terlalu panjang.)' : '') });
        for (const u of selesai.usulan || []) P.tampil.push({ jenis: 'usulan', u, status: 'baru' });
        for (const k of selesai.kode || []) P.tampil.push({ jenis: 'kode', k, status: 'baru' });
        senang();
      } else {
        // (pertanyaan tanpa jawaban tidak masuk percakapan yang diingat Claude: boleh ditanyakan lagi)
        P.tampil.push({ jenis: 'galat', teks: galat });
        mode('galat');
        setTimeout(() => { if (!sibuk) mode('diam'); }, 2200);
      }
      simpanLokal();
      gambar();
      if (!html.classList.contains('ai-laci-buka')) tombol.setAttribute('data-baru', '');
    }

    laci.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-ai]');
      if (!b) return;
      const i = +b.dataset.i, x = P.tampil[i];
      switch (b.dataset.ai) {
        case 'tutup': tutup(); return;
        case 'baru':
          if (sibuk) return;
          if (P.tampil.length && !(await NM.confirm('Mulai percakapan baru? Percakapan ini dihapus dari layar; usulan yang sudah diterapkan tetap di draf.', { ok: 'Mulai baru' }))) return;
          P = kosong(); simpanLokal(); mode('diam'); gambar(); ta.focus();
          return;
        case 'saran': tanya(b.textContent); return;
        case 'terapkan': {
          if (!x || x.jenis !== 'usulan' || x.status !== 'baru') return;
          b.disabled = true;
          if (!(await o.terapkan(x.u))) { b.disabled = false; return; }
          x.status = 'diterapkan';
          P.hasil[x.u.id] = 'diterapkan';
          simpanLokal(); gambar(); senang();
          NM.toast('Usulan masuk draf. Periksa di pratinjau, lalu Terbitkan.');
          return;
        }
        case 'lewati':
          if (!x || x.status !== 'baru') return;
          x.status = 'dilewati';
          P.hasil[(x.u || x.k).id] = 'dilewati';
          simpanLokal(); gambar();
          return;
        case 'kirim-kode': {
          if (!x || x.jenis !== 'kode' || x.status !== 'baru') return;
          b.disabled = true;
          try {
            await o.api('asisten/kode', { method: 'POST', body: { judul: x.k.judul, isi: x.k.isi } });
            x.status = 'dikirim';
            P.hasil[x.k.id] = 'dikirim';
            simpanLokal(); gambar();
            NM.toast('Terkirim ke halaman Claude ARSWORD');
          } catch (err) { b.disabled = false; NM.toast(err.message, 'bad'); }
          return;
        }
        case 'lihat':
          e.preventDefault();
          if (x && x.u) o.lihat(x.u);
          if (matchMedia('(max-width: 759px)').matches) tutup();
          return;
      }
    });

    const ukurTa = () => { ta.style.height = 'auto'; ta.style.height = Math.min(180, ta.scrollHeight) + 'px'; };
    let tDengar = 0;
    ta.addEventListener('input', () => {
      ukurTa(); perbaruiKirim();
      if (sibuk) return;
      mode('dengar');
      clearTimeout(tDengar);
      tDengar = setTimeout(() => { if (!sibuk) mode('diam'); }, 1400);
    });
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && !matchMedia('(pointer: coarse)').matches) { e.preventDefault(); tanya(ta.value); }
    });
    laci.querySelector('[data-form]').addEventListener('submit', (e) => {
      e.preventDefault();
      if (sibuk) { sibuk.henti.abort(); return; }
      tanya(ta.value);
    });
    perbaruiKirim();

    return {
      email: o.email,
      buka, tutup,
      // akun keluar atau berganti: maskot dan lacinya dilepas (percakapannya tetap di tab untuk akun itu)
      lepas() {
        if (sibuk) sibuk.henti.abort();
        html.classList.remove('ai-laci-buka');
        document.removeEventListener('keydown', padaTombol);
        tombol.remove(); laci.remove();
      },
    };
  }

  window.TWHAsisten = { pasang, maskot: buatMaskot };
})();
