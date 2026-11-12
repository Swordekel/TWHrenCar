/* Komponen tampilan bersama. Markup sama untuk ketiga model; gaya dibedakan lewat CSS model. */
(function () {
  const NM = window.NM, u = NM.u, ic = NM.ic, esc = u.esc;
  const UI = (NM.ui = {});

  const attr = (o) => (o.act ? ` data-act="${o.act}"` : '') + (o.go ? ` data-go="${o.go}"` : '') + (o.attrs ? ' ' + o.attrs : '');
  UI.btn = (label, o = {}) =>
    `<button type="${o.type || 'button'}" class="btn ${o.kind || ''}"${attr(o)}${o.title ? ` data-hint="${esc(o.title)}"` : ''}>${o.icon ? ic(o.icon) : ''}${label ? `<span>${label}</span>` : ''}</button>`;
  UI.iconBtn = (icon, o = {}) =>
    `<button type="button" class="icon-btn ${o.cls || ''}"${attr(o)} aria-label="${esc(o.label || icon)}">${ic(icon)}${o.dot ? `<i class="dot-badge">${o.dot === true ? '' : o.dot}</i>` : ''}</button>`;

  UI.head = ({ title, sub = '', right = '', below = '', eyebrow = '' }) => `
    <div class="page-head">
      <div class="ph-text">${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''}<h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>
      ${right ? `<div class="ph-right">${right}</div>` : ''}
    </div>${below ? `<div class="ph-below">${below}</div>` : ''}`;

  UI.seg = (key, opts, val, cls = '') =>
    `<div class="seg ${cls}" role="tablist" data-seg="${key}">${opts
      .map((o) => `<button type="button" role="tab" aria-selected="${o.v === val}" class="${o.v === val ? 'on' : ''}" data-v="${esc(o.v)}">${o.icon ? ic(o.icon) : ''}<span>${o.l}</span>${o.n != null ? `<em class="cnt">${o.n}</em>` : ''}</button>`)
      .join('')}</div>`;

  UI.card = ({ title = '', sub = '', right = '', body = '', cls = '', id = '', foot = '', icon = '' }) => `
    <section class="card ${cls}"${id ? ` id="${id}"` : ''}>
      ${title || right ? `<header class="card-head"><div class="ch-t">${icon ? `<span class="ch-ic">${ic(icon)}</span>` : ''}<div><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div></div>${right ? `<div class="ch-r">${right}</div>` : ''}</header>` : ''}
      <div class="card-body">${body}</div>
      ${foot ? `<footer class="card-foot">${foot}</footer>` : ''}
    </section>`;

  UI.kpi = (o) => `
    <section class="kpi ${o.tone || ''} ${o.cls || ''}"${o.go ? ` data-go="${o.go}"` : ''}${o.act ? ` data-act="${o.act}"` : ''}${o.go || o.act ? ' tabindex="0" role="button"' : ''}>
      <div class="kpi-top">${o.icon ? `<span class="kpi-ic">${ic(o.icon)}</span>` : ''}<span class="kpi-label">${o.label}</span>${o.info ? `<span class="info" tabindex="0" data-tip="${esc(o.info)}">${ic('info')}</span>` : ''}${o.right || ''}</div>
      <div class="kpi-main"><div class="kpi-val">${o.value}</div>${o.viz ? `<div class="kpi-viz">${o.viz}</div>` : ''}</div>
      ${o.sub || o.delta != null ? `<div class="kpi-sub">${o.delta != null ? UI.delta(o.delta, o.inv) : ''}<span>${o.sub || ''}</span></div>` : ''}
      ${o.foot ? `<div class="kpi-foot">${o.foot}</div>` : ''}
    </section>`;

  UI.delta = (v, inv = false) => {
    if (v == null || !isFinite(v)) return '';
    const up = v >= 0, good = inv ? !up : up;
    return `<span class="delta ${good ? 'good' : 'bad'}">${ic(up ? 'up' : 'dn')}${u.num(Math.abs(v * 100), Math.abs(v) < 0.1 ? 1 : 0)}%</span>`;
  };
  UI.change = (now, prev) => (prev ? (now - prev) / Math.abs(prev) : null);

  UI.badge = (t, tone = 'neutral', icon = '') => `<span class="badge ${tone}">${icon ? ic(icon) : '<i class="bd"></i>'}${t}</span>`;
  const ST_KOLAM = { kosong: ['Kosong', 'neutral'], persiapan: ['Persiapan', 'info'], pemeliharaan: ['Pemeliharaan', 'good'], panen: ['Panen', 'accent'] };
  UI.stKolam = (s) => UI.badge(...ST_KOLAM[s]);
  UI.stKolamLabel = (s) => ST_KOLAM[s][0];
  const ST_BAYAR = { lunas: ['Lunas', 'good'], dp: ['DP', 'warn'], belum: ['Belum lunas', 'bad'] };
  UI.stBayar = (s) => UI.badge(...ST_BAYAR[s]);

  UI.bar = (p, tone = '', label = '') => `<div class="bar ${tone}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(u.clamp(p, 0, 1) * 100)}"${label ? ` aria-label="${esc(label)}"` : ''}><i style="width:${(u.clamp(p, 0, 1) * 100).toFixed(1)}%"></i></div>`;
  UI.split = (parts) => `<div class="split">${parts.map((p, i) => `<i class="sp${i + 1}" style="flex:${Math.max(p.value, 0.0001)}" data-tip="${esc(`<b>${p.label}</b><div>${p.tip || ''}</div>`)}"></i>`).join('')}</div>`;
  UI.avatar = (name, cls = '') => `<span class="avatar ${cls}">${esc(u.initials(name))}</span>`;
  UI.empty = (title, sub = '', action = '') => `<div class="empty">${ic('sparkle')}<b>${title}</b>${sub ? `<p>${sub}</p>` : ''}${action}</div>`;
  UI.legend = (items) => `<div class="legend">${items.map((it, i) => `<span><i class="sw s${it.s || i + 1}${it.dashed ? ' dash' : ''}"></i>${it.l}</span>`).join('')}</div>`;

  // Istilah teknis selalu disertai penjelasan singkat
  const TERM = {
    FCR: ['FCR (efisiensi pakan)', 'Berapa kg pakan untuk menghasilkan 1 kg ikan. Makin kecil makin hemat. Contoh: FCR 1,4 = 1,4 kg pakan jadi 1 kg ikan.'],
    SR: ['SR (tingkat hidup)', 'Persen ikan yang hidup sampai panen: ekor dipanen ÷ ekor ditebar. Makin besar makin bagus.'],
    HPP: ['HPP per kg', 'Harga pokok: total biaya siklus ÷ kg panen. Jual di atas angka ini supaya untung.'],
    HPPP: ['Harga pokok pakan', '(Nilai bahan + biaya produksi) ÷ kg pakan jadi.'],
    SUSUT: ['Susut produksi', 'Berat bahan yang hilang saat dibuat pakan (air menguap, tercecer).'],
  };
  UI.term = (k, short = false) => `<span class="term" tabindex="0" data-tip="${esc(`<b>${TERM[k][0]}</b><div>${TERM[k][1]}</div>`)}">${short ? k.replace('HPPP', 'HPP pakan') : TERM[k][0]}${ic('help')}</span>`;
  UI.termText = (k) => TERM[k][1];

  // Tabel: di HP berubah jadi kartu (pakai data-l sebagai label)
  UI.table = ({ cols, rows, empty = 'Belum ada data', rowAttrs, foot, cls = '', exportName = '' }) => {
    if (!rows.length) return UI.empty(empty);
    const th = cols.map((c) => `<th class="${c.num ? 'num' : ''} ${c.cls || ''}">${c.l}</th>`).join('');
    const tr = rows.map((r, i) => `<tr${rowAttrs ? ' ' + rowAttrs(r, i) : ''}>${cols.map((c) => `<td class="${c.num ? 'num' : ''} ${c.cls || ''}" data-l="${esc(c.l)}">${c.f ? c.f(r, i) : esc(r[c.k])}</td>`).join('')}</tr>`).join('');
    const tf = foot ? `<tfoot><tr>${cols.map((c, i) => `<td class="${c.num ? 'num' : ''} ${c.cls || ''}" data-l="${esc(c.l)}">${foot[i] ?? ''}</td>`).join('')}</tr></tfoot>` : '';
    return `<div class="tbl-wrap"><table class="tbl ${cls}"${exportName ? ` data-export="${esc(exportName)}"` : ''}><thead><tr>${th}</tr></thead><tbody>${tr}</tbody>${tf}</table></div>`;
  };

  // ---------- Isian form ----------
  const F = (NM.f = {});
  F.field = (label, input, o = {}) => `<label class="field ${o.cls || ''}"${o.id ? ` id="${o.id}"` : ''}><span class="lbl">${label}${o.opt ? ' <em>(boleh kosong)</em>' : ''}</span>${input}${o.hint ? `<small class="hint">${o.hint}</small>` : ''}</label>`;
  F.date = (name, val = u.today(), attrs = '') => `<input type="date" name="${name}" value="${val}" max="${u.add(u.today(), 400)}" ${attrs}>`;
  F.text = (name, val = '', ph = '', attrs = '') => `<input type="text" name="${name}" value="${esc(val)}" placeholder="${esc(ph)}" ${attrs}>`;
  F.num = (name, val = '', o = {}) => `<div class="inp ${o.suf ? 'has-suf' : ''} ${o.big ? 'big' : ''}"><input type="text" inputmode="decimal" autocomplete="off" data-num name="${name}" value="${val === '' || val == null ? '' : String(val).replace('.', ',')}" placeholder="${o.ph || '0'}" ${o.attrs || ''}>${o.suf ? `<span class="suf">${o.suf}</span>` : ''}</div>`;
  F.money = (name, val = '', o = {}) => `<div class="inp has-pre ${o.big ? 'big' : ''}"><span class="pre">Rp</span><input type="text" inputmode="numeric" autocomplete="off" data-money name="${name}" value="${val ? u.num(val) : ''}" placeholder="${o.ph || '0'}" ${o.attrs || ''}></div>`;
  F.select = (name, opts, val, attrs = '') => `<div class="sel"><select name="${name}" ${attrs}>${opts.map((o) => (o.group ? `<optgroup label="${esc(o.group)}">` : o.end ? '</optgroup>' : `<option value="${esc(o.v)}"${String(o.v) === String(val) ? ' selected' : ''}${o.dis ? ' disabled' : ''}>${esc(o.l)}</option>`)).join('')}</select>${ic('down')}</div>`;
  F.chips = (name, opts, val, cls = '') => `<div class="chips ${cls}" role="radiogroup">${opts.map((o) => `<label class="chip"><input type="radio" name="${name}" value="${esc(o.v)}"${String(o.v) === String(val) ? ' checked' : ''}><span>${o.icon ? ic(o.icon) : ''}${o.l}</span></label>`).join('')}</div>`;
  F.tempat = (name, val = 'tunai') => F.chips(name, NM.db.tempat.map((t) => ({ v: t.id, l: t.nama, icon: t.jenis === 'tunai' ? 'coins' : 'bank' })), val);
  F.textarea = (name, val = '', ph = '') => `<textarea name="${name}" rows="2" placeholder="${esc(ph)}">${esc(val)}</textarea>`;
  F.foto = (name, label = 'Foto nota') => `<div class="foto-in"><input type="file" accept="image/*" capture="environment" name="${name}" data-foto id="${name}-f" hidden><label for="${name}-f" class="foto-btn">${ic('camera')}<span>${label}</span><small>Ketuk untuk ambil foto atau pilih dari galeri</small></label><div class="foto-prev"></div></div>`;
  F.check = (name, label, checked = false) => `<label class="check"><input type="checkbox" name="${name}"${checked ? ' checked' : ''}><span class="box">${ic('check')}</span><span>${label}</span></label>`;
  F.read = (form) => {
    const o = {};
    u.$$('input,select,textarea', form).forEach((el) => {
      if (!el.name) return;
      if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; else if (!(el.name in o)) o[el.name] = undefined; return; }
      if (el.type === 'checkbox') { o[el.name] = el.checked; return; }
      if (el.type === 'file') { o[el.name] = el._data || null; return; }
      if (el.hasAttribute('data-money')) o[el.name] = u.parseMoney(el.value);
      else if (el.hasAttribute('data-num')) o[el.name] = u.parseNum(el.value);
      else o[el.name] = el.value.trim();
    });
    return o;
  };
  F.err = (form, msg) => {
    let b = u.$('.form-err', form);
    if (!b) { b = document.createElement('div'); b.className = 'form-err'; b.setAttribute('role', 'alert'); form.prepend(b); }
    b.innerHTML = ic('alert') + `<span>${msg}</span>`;
    b.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return false;
  };

  // Format Rupiah saat mengetik, dan pratinjau foto
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.matches && el.matches('[data-money]')) {
      const n = u.parseMoney(el.value);
      el.value = n ? u.num(n) : '';
    }
  });
  document.addEventListener('change', async (e) => {
    const el = e.target;
    if (!el.matches || !el.matches('[data-foto]') || !el.files[0]) return;
    try {
      el._data = await NM.foto.compress(el.files[0]);
      el.closest('.foto-in').querySelector('.foto-prev').innerHTML = `<img src="${el._data}" alt="Pratinjau foto"><button type="button" class="link" data-foto-clear>Hapus foto</button>`;
    } catch (err) { NM.toast('Foto tidak bisa dibaca', 'bad'); }
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-foto-clear]');
    if (!b) return;
    const box = b.closest('.foto-in'), inp = box.querySelector('[data-foto]');
    inp.value = ''; inp._data = null; box.querySelector('.foto-prev').innerHTML = '';
  });

  UI.lihatFoto = async (id) => {
    const src = await NM.foto.get(id);
    if (!src) return NM.toast('Foto tidak ditemukan di perangkat ini', 'bad');
    NM.sheet.open({ title: 'Foto', size: 'md', body: `<img class="foto-full" src="${src}" alt="Foto bukti">` });
  };
})();
