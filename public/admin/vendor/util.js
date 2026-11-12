/* Nusa Mina — utilitas bersama (format angka, tanggal, DOM, foto, sheet, toast) */
(function () {
  const NM = (window.NM = window.NM || {});

  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const nf = {};
  const fmt = (d) => (nf[d] = nf[d] || new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: d }));

  const u = (NM.u = {
    BULAN, BLN, HARI,
    $: (s, r = document) => r.querySelector(s),
    $$: (s, r = document) => [...r.querySelectorAll(s)],
    esc: (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),

    // ---------- angka ----------
    num: (n, d = 0) => fmt(d).format(n || 0),
    rp(n) {
      n = Math.round(n || 0);
      return (n < 0 ? '−' : '') + 'Rp' + fmt(0).format(Math.abs(n));
    },
    rpS(n) {
      const a = Math.abs(n || 0), s = n < 0 ? '−' : '';
      if (a >= 1e9) return s + 'Rp' + u.num(a / 1e9, 1) + ' M';
      if (a >= 1e6) return s + 'Rp' + u.num(a / 1e6, a >= 1e8 ? 0 : 1) + ' jt';
      if (a >= 1e3) return s + 'Rp' + u.num(a / 1e3, 0) + ' rb';
      return s + 'Rp' + u.num(a);
    },
    kg: (n, d = 1) => u.num(n, d) + ' kg',
    pct: (n, d = 0) => (n == null || !isFinite(n) ? '–' : u.num(n * 100, d) + '%'),
    parseNum(v) {
      if (typeof v === 'number') return v;
      if (!v) return 0;
      const s = String(v).trim().replace(/\s/g, '');
      // "1.250.000" -> 1250000 ; "12,5" -> 12.5
      if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
      return parseFloat(s.replace(',', '.')) || 0;
    },
    parseMoney: (v) => parseInt(String(v || '').replace(/[^\d]/g, ''), 10) || 0,
    sum: (arr, f) => arr.reduce((a, x) => a + (f ? f(x) : x || 0), 0),
    groupBy(arr, f) {
      const m = {};
      arr.forEach((x) => { const k = f(x); (m[k] = m[k] || []).push(x); });
      return m;
    },
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),

    // ---------- tanggal (string ISO YYYY-MM-DD) ----------
    iso(d) {
      const z = (n) => String(n).padStart(2, '0');
      return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
    },
    parse(s) {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, m - 1, d);
    },
    today: () => u.iso(new Date()),
    add(s, n) {
      const d = u.parse(s);
      d.setDate(d.getDate() + n);
      return u.iso(d);
    },
    diff: (a, b) => Math.round((u.parse(b) - u.parse(a)) / 864e5),
    tgl(s) {
      if (!s) return '–';
      const d = u.parse(s);
      return d.getDate() + ' ' + BLN[d.getMonth()] + ' ' + d.getFullYear();
    },
    tglPendek(s) {
      if (!s) return '–';
      const d = u.parse(s);
      return d.getDate() + ' ' + BLN[d.getMonth()];
    },
    tglPanjang(s) {
      const d = u.parse(s);
      return HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
    },
    hariSingkat: (s) => HARI[u.parse(s).getDay()].slice(0, 3),
    mk: (s) => s.slice(0, 7),
    bulan(mk) {
      const [y, m] = mk.split('-').map(Number);
      return BULAN[m - 1] + ' ' + y;
    },
    blnPendek: (mk) => BLN[Number(mk.split('-')[1]) - 1],
    mkAdd(mk, n) {
      let [y, m] = mk.split('-').map(Number);
      m += n;
      while (m > 12) { m -= 12; y++; }
      while (m < 1) { m += 12; y--; }
      return y + '-' + String(m).padStart(2, '0');
    },
    mkRange(a, b) {
      const out = [];
      for (let m = a; m <= b; m = u.mkAdd(m, 1)) out.push(m);
      return out;
    },
    weekStart(s) {
      const d = u.parse(s);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      return u.iso(d);
    },
    sapaan() {
      const h = new Date().getHours();
      return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam';
    },

    uid: (p = 'x') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    rng(seed) {
      return function () {
        seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    debounce(fn, ms) {
      let t;
      return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
    },
    initials: (s) => String(s || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join(''),
    hp62(hp) {
      let d = String(hp || '').replace(/[^\d]/g, '');
      if (d.startsWith('0')) d = '62' + d.slice(1);
      return d;
    },

    terbilang(n) {
      const s = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
      const tb = (n) => {
        n = Math.floor(n);
        if (n < 12) return s[n];
        if (n < 20) return tb(n - 10) + ' belas';
        if (n < 100) return tb(n / 10) + ' puluh ' + tb(n % 10);
        if (n < 200) return 'seratus ' + tb(n - 100);
        if (n < 1000) return tb(n / 100) + ' ratus ' + tb(n % 100);
        if (n < 2000) return 'seribu ' + tb(n - 1000);
        if (n < 1e6) return tb(n / 1000) + ' ribu ' + tb(n % 1000);
        if (n < 1e9) return tb(n / 1e6) + ' juta ' + tb(n % 1e6);
        if (n < 1e12) return tb(n / 1e9) + ' miliar ' + tb(n % 1e9);
        return tb(n / 1e12) + ' triliun ' + tb(n % 1e12);
      };
      n = Math.round(Math.abs(n || 0));
      if (!n) return 'Nol rupiah';
      const t = tb(n).replace(/\s+/g, ' ').trim();
      return t.charAt(0).toUpperCase() + t.slice(1) + ' rupiah';
    },

    loadScript(src) {
      u._scripts = u._scripts || {};
      if (!u._scripts[src]) {
        u._scripts[src] = new Promise((res, rej) => {
          const el = document.createElement('script');
          el.src = src; el.onload = res; el.onerror = () => { delete u._scripts[src]; rej(new Error('Gagal memuat ' + src)); };
          document.head.appendChild(el);
        });
      }
      return u._scripts[src];
    },
    download(name, content, type = 'application/octet-stream') {
      const blob = content instanceof Blob ? content : new Blob([content], { type });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    },
    reducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    isMobile: () => window.matchMedia('(max-width: 759px)').matches,
  });

  // ---------- Foto (IndexedDB, supaya tidak memenuhi localStorage) ----------
  NM.foto = {
    _db: null,
    open() {
      if (!this._db) {
        this._db = new Promise((res, rej) => {
          const r = indexedDB.open('nusamina_foto', 1);
          r.onupgradeneeded = () => r.result.createObjectStore('f');
          r.onsuccess = () => res(r.result);
          r.onerror = () => rej(r.error);
        });
      }
      return this._db;
    },
    async put(dataUrl, id) {
      id = id || u.uid('f');
      const db = await this.open();
      await new Promise((res, rej) => {
        const tx = db.transaction('f', 'readwrite');
        tx.objectStore('f').put(dataUrl, id);
        tx.oncomplete = res;
        tx.onerror = () => rej(tx.error);
      });
      return id;
    },
    async get(id) {
      try {
        const db = await this.open();
        return await new Promise((res) => {
          const r = db.transaction('f').objectStore('f').get(id);
          r.onsuccess = () => res(r.result || null);
          r.onerror = () => res(null);
        });
      } catch (e) { return null; }
    },
    async all() {
      const db = await this.open();
      return new Promise((res) => {
        const out = {};
        const r = db.transaction('f').objectStore('f').openCursor();
        r.onsuccess = () => {
          const c = r.result;
          if (c) { out[c.key] = c.value; c.continue(); } else res(out);
        };
        r.onerror = () => res(out);
      });
    },
    async clear() {
      const db = await this.open();
      return new Promise((res) => { const tx = db.transaction('f', 'readwrite'); tx.objectStore('f').clear(); tx.oncomplete = res; });
    },
    compress(file, max = 1100, q = 0.72) {
      return new Promise((res, rej) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          const s = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * s);
          c.height = Math.round(img.height * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          res(c.toDataURL('image/jpeg', q));
        };
        img.onerror = rej;
        img.src = url;
      });
    },
  };

  // ---------- Toast ----------
  NM.toast = (msg, tone = 'ok') => {
    let box = u.$('#toasts');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toasts';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    const el = document.createElement('div');
    el.className = 'toast ' + tone;
    el.innerHTML = NM.ic(tone === 'bad' ? 'alert' : 'check') + '<span>' + u.esc(msg) + '</span>';
    box.appendChild(el);
    setTimeout(() => el.classList.add('out'), 2800);
    setTimeout(() => el.remove(), 3200);
  };

  // ---------- Sheet (modal / laci / layar penuh di HP) ----------
  const stack = [];
  NM.sheet = {
    open({ title, sub = '', body = '', foot = '', size = 'md', onMount, onClose, cls = '' }) {
      const wrap = document.createElement('div');
      wrap.className = 'sheet-wrap ' + cls;
      wrap.dataset.size = size;
      const tid = u.uid('t');
      wrap.innerHTML = `
        <div class="sheet-backdrop" data-close></div>
        <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="${tid}">
          <header class="sheet-head">
            <div><h2 id="${tid}">${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>
            <button type="button" class="icon-btn" data-close aria-label="Tutup">${NM.ic('x')}</button>
          </header>
          <div class="sheet-body">${body}</div>
          ${foot ? `<footer class="sheet-foot">${foot}</footer>` : ''}
        </section>`;
      document.body.appendChild(wrap);
      document.documentElement.classList.add('sheet-open');
      const entry = { wrap, onClose, prevFocus: document.activeElement };
      stack.push(entry);
      wrap.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) NM.sheet.close(); });
      requestAnimationFrame(() => wrap.classList.add('in'));
      if (onMount) onMount(wrap.querySelector('.sheet'), wrap);
      const f = wrap.querySelector('[autofocus]') || wrap.querySelector('.sheet-head .icon-btn');
      if (f && !u.isMobile()) setTimeout(() => f.focus(), 60);
      return wrap.querySelector('.sheet');
    },
    close(all) {
      do {
        const e = stack.pop();
        if (!e) break;
        e.wrap.classList.remove('in');
        e.wrap.classList.add('out');
        setTimeout(() => e.wrap.remove(), 260);
        if (e.onClose) e.onClose();
        if (e.prevFocus && e.prevFocus.focus) e.prevFocus.focus();
      } while (all && stack.length);
      if (!stack.length) document.documentElement.classList.remove('sheet-open');
    },
    get open_() { return stack.length; },
  };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && stack.length) NM.sheet.close(); });

  NM.confirm = (msg, { ok = 'Ya, lanjutkan', tone = 'dark' } = {}) =>
    new Promise((res) => {
      let done = false;
      const s = NM.sheet.open({
        title: 'Yakin?', size: 'sm', body: `<p class="lead">${msg}</p>`,
        foot: `<button class="btn ghost" data-close>Batal</button><button class="btn ${tone}" data-ok>${ok}</button>`,
        onClose: () => { if (!done) res(false); },
      });
      s.querySelector('[data-ok]').onclick = () => { done = true; NM.sheet.close(); res(true); };
    });

  // ---------- Tooltip grafik ----------
  const showTip = (e) => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    let tip = u.$('#tip');
    if (!t || !t.getAttribute('data-tip')) { if (tip) tip.classList.remove('on'); return; }
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'tip';
      tip.className = 'tip';
      document.body.appendChild(tip);
    }
    tip.innerHTML = t.getAttribute('data-tip');
    tip.classList.add('on');
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = e.clientX + 14, y = e.clientY - h - 12;
    if (x + w > innerWidth - 8) x = e.clientX - w - 14;
    if (y < 8) y = e.clientY + 16;
    tip.style.transform = `translate(${x}px, ${y}px)`;
  };
  document.addEventListener('pointermove', showTip);
  document.addEventListener('pointerdown', showTip);
  document.addEventListener('scroll', () => { const tip = u.$('#tip'); if (tip) tip.classList.remove('on'); }, true);
})();
