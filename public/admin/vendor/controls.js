/* Kontrol buatan sendiri, pengganti tampilan bawaan browser:
   dropdown (pengganti <select>), kalender (pengganti <input type=date>), dan petunjuk tombol (pengganti title).
   Elemen asli tetap ada tapi tersembunyi, jadi isian form dan event change tetap jalan seperti biasa. */
(function () {
  const NM = window.NM, u = NM.u, ic = NM.ic, esc = u.esc;
  const asSheet = () => matchMedia('(max-width: 759px)').matches;

  const labelOf = (el) => {
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
    const f = el.closest('.field'), l = f && f.querySelector('.lbl');
    if (l) return l.textContent.replace('(boleh kosong)', '').trim();
    const fl = el.closest('.filter'), s = fl && fl.querySelector(':scope > span');
    return s ? s.textContent.trim() : '';
  };
  const fire = (el) => {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };

  // ---------- popover bersama: melayang di laptop, lembar bawah di HP ----------
  let cur = null, swallow = 0;
  const P = (NM.pop = {
    open({ trigger, anchor, el, title, focus }) {
      P.close(false);
      const sheet = asSheet();
      el.classList.add('pop');
      if (sheet) {
        el.classList.add('as-sheet');
        el.insertAdjacentHTML('afterbegin', `<div class="pop-title"><b>${esc(title || 'Pilih')}</b><button type="button" class="icon-btn sm" data-pop-x aria-label="Tutup">${ic('x')}</button></div>`);
      }
      const scrim = sheet ? document.body.appendChild(Object.assign(document.createElement('div'), { className: 'pop-scrim' })) : null;
      document.body.appendChild(el);
      cur = { trigger, anchor: anchor || trigger, el, scrim, sheet };
      trigger.setAttribute('aria-expanded', 'true');
      P.place();
      requestAnimationFrame(() => { el.classList.add('in'); if (scrim) scrim.classList.add('in'); });
      if (focus) focus(sheet);
    },
    close(refocus = true) {
      if (!cur) return;
      const c = cur;
      cur = null;
      c.trigger.setAttribute('aria-expanded', 'false');
      c.el.classList.remove('in');
      c.el.classList.add('out');
      setTimeout(() => c.el.remove(), 200);
      if (c.scrim) { c.scrim.classList.remove('in'); setTimeout(() => c.scrim.remove(), 220); }
      if (refocus && c.trigger.isConnected) c.trigger.focus({ preventScroll: true });
    },
    place() {
      if (!cur || cur.sheet) return;
      const { el, anchor } = cur;
      const r = anchor.getBoundingClientRect();
      if (!anchor.isConnected || r.bottom < 0 || r.top > innerHeight) return P.close(false);
      const vw = document.documentElement.clientWidth, gap = 6, pad = 8;
      const w = Math.min(el.dataset.w ? +el.dataset.w : Math.max(r.width, 230), vw - pad * 2);
      el.style.width = w + 'px';
      el.style.maxHeight = 'none';
      const h = el.offsetHeight, below = innerHeight - r.bottom - gap - pad, above = r.top - gap - pad;
      const down = h <= below || below >= above, room = Math.max(180, down ? below : above);
      el.style.maxHeight = room + 'px';
      el.style.left = Math.round(Math.min(Math.max(pad, r.left), vw - pad - w)) + 'px';
      el.style.top = Math.round(down ? r.bottom + gap : r.top - gap - Math.min(h, room)) + 'px';
      el.dataset.side = down ? 'bottom' : 'top';
    },
    get el() { return cur && cur.el; },
  });

  // Klik di luar menutup popover, dan klik itu tidak diteruskan (seperti dropdown asli)
  document.addEventListener('pointerdown', (e) => {
    if (!cur || cur.el.contains(e.target) || cur.trigger.contains(e.target)) return;
    P.close(false);
    swallow = Date.now();
  }, true);
  document.addEventListener('click', (e) => {
    if (swallow && Date.now() - swallow < 700) { e.stopPropagation(); e.preventDefault(); }
    swallow = 0;
  }, true);
  window.addEventListener('keydown', (e) => {
    if (cur && e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); P.close(); }
  }, true);
  document.addEventListener('scroll', (e) => { if (cur && !cur.el.contains(e.target)) P.place(); }, true);
  addEventListener('resize', () => { if (cur) (cur.sheet !== asSheet() ? P.close(false) : P.place()); });
  addEventListener('hashchange', () => P.close(false));

  // ---------- dropdown ----------
  let seq = 0;
  const split = (t) => { const m = t.match(/^(.+?) · (.+)$/) || t.match(/^(.+?) \((.+)\)$/); return m ? [m[1], m[2]] : [t, '']; };
  const isPh = (o) => !!o && o.value === '' && /…$/.test(o.text);

  const sync = (s) => {
    const b = s._dd;
    if (!b) return;
    const o = s.options[s.selectedIndex], t = o ? o.text : '', [m, sub] = split(t);
    b.innerHTML = `<span class="dd-main">${esc(m)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}`;
    b.classList.toggle('ph', isPh(o));
    b.disabled = s.disabled;
    const lb = labelOf(s);
    b.setAttribute('aria-label', (lb ? lb + ': ' : '') + t);
  };

  const DD = (NM.dd = {
    enhance(s) {
      if (s._dd) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dd-btn';
      b.setAttribute('aria-haspopup', 'listbox');
      b.setAttribute('aria-expanded', 'false');
      s.tabIndex = -1;
      s.setAttribute('aria-hidden', 'true');
      s.dataset.dd = '';
      s.parentNode.classList.add('is-dd');
      s.parentNode.insertBefore(b, s);
      s._dd = b;
      b._sel = s;
      sync(s);
      s.addEventListener('change', () => sync(s));
      new MutationObserver(() => sync(s)).observe(s, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['disabled'] });
    },

    open(s) {
      const b = s._dd, id = 'dd' + ++seq;
      sync(s);
      const opt = (o) => {
        if (isPh(o)) return '';
        const i = o.index, on = i === s.selectedIndex, add = /^\+ /.test(o.text), [m, sub] = split(add ? o.text.slice(2) : o.text);
        return `<div class="dd-opt${on ? ' on' : ''}${add ? ' add' : ''}" role="option" id="${id}-${i}" data-i="${i}" aria-selected="${on}"${o.disabled ? ' aria-disabled="true"' : ''}>${add ? ic('plus', 'dd-plus') : ''}<span class="dd-t"><span>${esc(m)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</span>${ic('check', 'dd-ck')}</div>`;
      };
      const html = [...s.children].map((c) => (c.tagName === 'OPTGROUP' ? `<div class="dd-grp" role="presentation">${esc(c.label)}</div>${[...c.children].map(opt).join('')}` : opt(c))).join('');
      const many = s.options.length > 8;
      const el = document.createElement('div');
      el.className = 'dd-pop';
      el.innerHTML = `${many ? `<div class="dd-search">${ic('search')}<input type="text" placeholder="Cari…" aria-label="Cari pilihan" autocomplete="off" role="combobox" aria-controls="${id}" aria-expanded="true"></div>` : ''}<div class="dd-list" role="listbox" id="${id}" tabindex="-1" aria-label="${esc(labelOf(s) || 'Pilihan')}">${html}<div class="dd-none" hidden>Tidak ada yang cocok</div></div>`;
      b.setAttribute('aria-controls', id);
      const list = el.querySelector('.dd-list'), q = el.querySelector('.dd-search input');
      const vis = () => [...list.querySelectorAll('.dd-opt:not([hidden]):not([aria-disabled])')];
      let act = null, buf = '', bufT = 0;
      const setAct = (o, scroll) => {
        if (act) act.classList.remove('act');
        act = o || null;
        [list, q].forEach((x) => x && (act ? x.setAttribute('aria-activedescendant', act.id) : x.removeAttribute('aria-activedescendant')));
        if (act) { act.classList.add('act'); if (scroll) act.scrollIntoView({ block: 'nearest' }); }
      };
      const choose = (o) => {
        if (!o || o.hasAttribute('aria-disabled')) return;
        const i = +o.dataset.i;
        P.close(true);
        if (i !== s.selectedIndex) { s.selectedIndex = i; sync(s); fire(s); }
      };

      el.addEventListener('pointermove', (e) => { const o = e.target.closest('.dd-opt'); if (o && o !== act && !o.hasAttribute('aria-disabled')) setAct(o); });
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-pop-x]')) return P.close();
        const o = e.target.closest('.dd-opt');
        if (o) choose(o);
      });
      el.addEventListener('keydown', (e) => {
        const v = vis(), i = v.indexOf(act);
        if (e.key === 'ArrowDown') { e.preventDefault(); setAct(v[Math.min(v.length - 1, i + 1)], true); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setAct(v[Math.max(0, i - 1)], true); }
        else if ((e.key === 'Home' || e.key === 'End') && !q) { e.preventDefault(); setAct(e.key === 'Home' ? v[0] : v[v.length - 1], true); }
        else if (e.key === 'Enter' || (e.key === ' ' && !q)) { e.preventDefault(); choose(act); }
        else if (e.key === 'Tab') P.close(true);
        else if (!q && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          buf += e.key.toLowerCase();
          clearTimeout(bufT);
          bufT = setTimeout(() => (buf = ''), 600);
          const from = i + (buf.length === 1 ? 1 : 0), ord = [...v.slice(from), ...v.slice(0, from)];
          const hit = ord.find((o) => o.textContent.trim().toLowerCase().startsWith(buf));
          if (hit) setAct(hit, true);
        }
      });
      if (q) q.addEventListener('input', () => {
        const t = q.value.trim().toLowerCase();
        let grp = null, shown = 0;
        [...list.children].forEach((c) => {
          if (c.classList.contains('dd-grp')) { if (grp) grp.hidden = !shown; grp = c; shown = 0; return; }
          if (!c.classList.contains('dd-opt')) return;
          c.hidden = !!t && !c.textContent.toLowerCase().includes(t);
          if (!c.hidden) shown++;
        });
        if (grp) grp.hidden = !shown;
        el.querySelector('.dd-none').hidden = vis().length > 0;
        setAct(vis()[0]);
        P.place();
      });

      P.open({
        trigger: b, anchor: b.closest('.filter') || b, el, title: labelOf(s),
        focus(sheet) {
          const on = list.querySelector('.dd-opt.on');
          setAct(on || vis()[0]);
          if (on) list.scrollTop = on.offsetTop - list.clientHeight / 2 + on.offsetHeight / 2;
          (q && !sheet ? q : list).focus({ preventScroll: true });
        },
      });
    },
  });

  // ---------- kalender ----------
  const HR = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const rel = (v) => { const d = u.diff(u.today(), v); return d === 0 ? 'Hari ini' : d === -1 ? 'Kemarin' : d === 1 ? 'Besok' : ''; };
  const lastDay = (mk) => new Date(+mk.slice(0, 4), +mk.slice(5, 7), 0).getDate();
  const inMonth = (mk, day) => mk + '-' + String(Math.min(day, lastDay(mk))).padStart(2, '0');

  const syncD = (inp) => {
    const b = inp._dp;
    if (!b) return;
    const v = inp.value, r = v ? rel(v) : '';
    b.innerHTML = `${ic('calendar', 'dp-ic')}<span class="dd-main">${v ? `${u.hariSingkat(v)}, ${u.tgl(v)}` : 'Pilih tanggal'}</span>${r ? `<em class="dp-rel">${r}</em>` : ''}${ic('down', 'dp-chev')}`;
    b.classList.toggle('ph', !v);
    const lb = labelOf(inp);
    b.setAttribute('aria-label', (lb ? lb + ': ' : '') + (v ? u.tglPanjang(v) : 'belum dipilih'));
  };

  const DP = (NM.dp = {
    enhance(inp) {
      if (inp._dp) return;
      const w = document.createElement('div'), b = document.createElement('button');
      w.className = 'dp';
      b.type = 'button';
      b.className = 'dp-btn';
      b.setAttribute('aria-haspopup', 'dialog');
      b.setAttribute('aria-expanded', 'false');
      inp.parentNode.insertBefore(w, inp);
      w.append(b, inp);
      inp.tabIndex = -1;
      inp.setAttribute('aria-hidden', 'true');
      inp.dataset.dp = '';
      inp._dp = b;
      b._inp = inp;
      syncD(inp);
      inp.addEventListener('change', () => syncD(inp));
    },

    open(inp) {
      const b = inp._dp, min = inp.min || '', max = inp.max || '';
      const ok = (s) => (!min || s >= min) && (!max || s <= max);
      let foc = inp.value || u.today(), view = foc.slice(0, 7), mode = 'd';
      const el = document.createElement('div');
      el.className = 'dp-pop';
      el.dataset.w = 320;
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', labelOf(inp) || 'Pilih tanggal');
      const quick = [[-1, 'Kemarin'], [0, 'Hari ini']].filter(([n]) => ok(u.add(u.today(), n)));
      el.innerHTML = `<div class="dp-body"></div>${quick.length ? `<div class="dp-foot">${quick.map(([n, l]) => `<button type="button" data-q="${n}">${l}</button>`).join('')}</div>` : ''}`;

      const draw = (focusIt) => {
        const [y, m] = view.split('-').map(Number), today = u.today();
        let head, body;
        if (mode === 'd') {
          const first = view + '-01', start = u.add(first, -((u.parse(first).getDay() + 6) % 7));
          let cells = '';
          for (let i = 0; i < 42; i++) {
            const s = u.add(start, i), on = s === inp.value;
            cells += `<button type="button" class="dp-d${s.slice(0, 7) !== view ? ' out' : ''}${s === today ? ' now' : ''}${on ? ' on' : ''}${i % 7 === 6 ? ' we' : ''}" data-d="${s}" tabindex="${s === foc ? 0 : -1}"${ok(s) ? '' : ' disabled'} aria-label="${u.tglPanjang(s)}${s === today ? ', hari ini' : ''}"${on ? ' aria-pressed="true"' : ''}>${+s.slice(8)}</button>`;
          }
          head = u.BULAN[m - 1] + ' ' + y;
          body = `<div class="dp-wk" aria-hidden="true">${HR.map((h, i) => `<span${i === 6 ? ' class="we"' : ''}>${h}</span>`).join('')}</div><div class="dp-days">${cells}</div>`;
        } else {
          head = String(y);
          body = `<div class="dp-months">${u.BLN.map((n, i) => {
            const mk = y + '-' + String(i + 1).padStart(2, '0');
            const off = (min && mk < min.slice(0, 7)) || (max && mk > max.slice(0, 7));
            return `<button type="button" class="dp-m${mk === (inp.value || '').slice(0, 7) ? ' on' : ''}${mk === today.slice(0, 7) ? ' now' : ''}" data-m="${mk}"${off ? ' disabled' : ''} aria-label="${u.BULAN[i]} ${y}">${n}</button>`;
          }).join('')}</div>`;
        }
        const unit = mode === 'd' ? 'Bulan' : 'Tahun';
        el.querySelector('.dp-body').innerHTML = `
          <div class="dp-head">
            <button type="button" class="dp-nav" data-nav="-1" aria-label="${unit} sebelumnya">${ic('left')}</button>
            <button type="button" class="dp-title${mode === 'm' ? ' up' : ''}" data-mode aria-label="${mode === 'd' ? 'Pilih bulan lain' : 'Kembali ke tanggal'}">${head}${ic('down')}</button>
            <button type="button" class="dp-nav" data-nav="1" aria-label="${unit} berikutnya">${ic('right')}</button>
          </div>${body}`;
        if (focusIt) {
          const f = el.querySelector(mode === 'd' ? '.dp-d[tabindex="0"]' : '.dp-m.on, .dp-m.now') || el.querySelector('.dp-title');
          f.focus({ preventScroll: true });
        }
      };
      const pick = (s) => {
        if (!ok(s)) return;
        P.close(true);
        if (s !== inp.value) { inp.value = s; syncD(inp); fire(inp); }
      };

      el.addEventListener('click', (e) => {
        const t = e.target.closest('button');
        if (!t) return;
        if (t.hasAttribute('data-pop-x')) return P.close();
        if (t.dataset.d) return pick(t.dataset.d);
        if (t.dataset.q != null) return pick(u.add(u.today(), +t.dataset.q));
        if (t.dataset.nav) {
          const n = +t.dataset.nav;
          if (mode === 'd') { view = u.mkAdd(view, n); foc = inMonth(view, +foc.slice(8)); }
          else view = +view.slice(0, 4) + n + view.slice(4);
        } else if (t.hasAttribute('data-mode')) mode = mode === 'd' ? 'm' : 'd';
        else if (t.dataset.m) { view = t.dataset.m; foc = inMonth(view, +foc.slice(8)); mode = 'd'; }
        else return;
        draw(!t.dataset.nav);
        if (t.dataset.nav) el.querySelector(`[data-nav="${t.dataset.nav}"]`).focus({ preventScroll: true });
        P.place();
      });
      el.addEventListener('keydown', (e) => {
        const t = e.target;
        if (t.classList.contains('dp-d')) {
          const d = t.dataset.d, dow = (u.parse(d).getDay() + 6) % 7;
          const mv = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -dow, End: 6 - dow }[e.key];
          let n = mv != null ? u.add(d, mv) : null;
          if (e.key === 'PageUp' || e.key === 'PageDown') n = inMonth(u.mkAdd(d.slice(0, 7), e.key === 'PageUp' ? -1 : 1), +d.slice(8));
          if (n) { e.preventDefault(); foc = n; view = n.slice(0, 7); draw(true); return; }
        }
        if (e.key === 'Tab') {
          const f = [...el.querySelectorAll('button:not([disabled])')].filter((x) => x.tabIndex !== -1);
          const i = f.indexOf(document.activeElement);
          if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
          else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
        }
      });

      draw(false);
      P.open({ trigger: b, anchor: b.closest('.filter') || b, el, title: labelOf(inp) || 'Tanggal', focus: () => draw(true) });
    },
  });

  // Buka dari tombol pemicu (klik, panah atas/bawah)
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.dd-btn, .dp-btn');
    if (!b || (!b._sel && !b._inp)) return;
    e.preventDefault();
    if (cur && cur.trigger === b) return P.close();
    b._sel ? DD.open(b._sel) : DP.open(b._inp);
  });
  document.addEventListener('keydown', (e) => {
    if (cur || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    const b = e.target.closest && e.target.closest('.dd-btn, .dp-btn');
    if (b) { e.preventDefault(); b.click(); }
  });

  // ---------- petunjuk untuk tombol ikon (pengganti tooltip title bawaan) ----------
  let hintEl = null, hintT = 0, hintFor = null;
  const hintText = (el) => el.dataset.hint || (!el.textContent.trim() && el.getAttribute('aria-label')) || '';
  const hintTarget = (t) => {
    const el = t && t.closest && t.closest('button, a');
    if (!el || el.closest('[data-label], .bnav, .pop, .dd-btn, .dp-btn')) return null;
    return hintText(el) ? el : null;
  };
  const showHint = (el) => {
    if (!el.isConnected) return;
    if (!hintEl) { hintEl = document.createElement('div'); hintEl.className = 'hint'; hintEl.setAttribute('role', 'tooltip'); document.body.appendChild(hintEl); }
    hintEl.textContent = hintText(el);
    const r = el.getBoundingClientRect(), w = hintEl.offsetWidth, h = hintEl.offsetHeight, vw = document.documentElement.clientWidth;
    let x, y, side;
    if (r.left < 110 && r.height < 80) { side = 'r'; x = r.right + 10; y = r.top + r.height / 2 - h / 2; }
    else if (r.bottom + h + 14 < innerHeight) { side = 'b'; x = r.left + r.width / 2 - w / 2; y = r.bottom + 8; }
    else { side = 't'; x = r.left + r.width / 2 - w / 2; y = r.top - h - 8; }
    hintEl.dataset.side = side;
    hintEl.style.transform = `translate(${Math.round(Math.max(8, Math.min(x, vw - w - 8)))}px, ${Math.round(y)}px)`;
    hintEl.classList.add('on');
  };
  const hideHint = () => { clearTimeout(hintT); hintFor = null; if (hintEl) hintEl.classList.remove('on'); };
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = hintTarget(e.target);
    if (el === hintFor) return;
    hideHint();
    if (el) { hintFor = el; hintT = setTimeout(() => showHint(el), 400); }
  });
  document.addEventListener('pointerdown', hideHint, true);
  document.addEventListener('scroll', hideHint, true);
  document.addEventListener('focusin', (e) => { const el = hintTarget(e.target); if (el && el.matches(':focus-visible')) { hintFor = el; showHint(el); } });
  document.addEventListener('focusout', hideHint);

  // ---------- baris tab yang bisa digeser: tepi memudar, tab aktif digeser ke tengah ----------
  const ROW = '.m1-tabs, .m3-nav, .seg, .set-nav';
  const ovSet = (el) => {
    const v = [el.scrollLeft > 2 && 'l', el.scrollLeft + el.clientWidth < el.scrollWidth - 2 && 'r'].filter(Boolean).join(' ');
    if ((el.dataset.ov || '') !== v) el.dataset.ov = v;
  };
  const center = (el) => {
    const on = el.querySelector('.on, [aria-selected=true]');
    if (!on || el.scrollWidth <= el.clientWidth) return;
    const a = el.getBoundingClientRect(), b = on.getBoundingClientRect();
    el.scrollLeft += b.left - a.left - (el.clientWidth - b.width) / 2;
  };
  const ro = new ResizeObserver((es) => es.forEach((e) => (e.target.isConnected ? ovSet(e.target) : ro.unobserve(e.target))));
  const rowInit = (el) => {
    el.dataset.ov = '';
    el.addEventListener('scroll', () => ovSet(el), { passive: true });
    ro.observe(el);
    center(el);
    ovSet(el);
  };
  addEventListener('hashchange', () => setTimeout(() => document.querySelectorAll('.m1-tabs, .m3-nav').forEach(center), 60));

  // ---------- pasang otomatis pada setiap isian baru ----------
  const scan = () => {
    document.querySelectorAll('.sel > select:not([data-dd])').forEach(DD.enhance);
    document.querySelectorAll('input[type=date]:not([data-dp])').forEach(DP.enhance);
    document.querySelectorAll(ROW).forEach((el) => { if (el.dataset.ov == null) rowInit(el); });
  };
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  scan();
})();
