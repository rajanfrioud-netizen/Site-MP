// Outils communs : DOM, dates, formats.

export const $ = (s, r = document) => r.querySelector(s);

/** Petit constructeur de DOM : h('div.card', {onclick}, enfants…) */
export function h(spec, attrs, ...kids) {
  const [tag, ...cls] = spec.split('.');
  const el = document.createElement(tag || 'div');
  if (cls.length) el.className = cls.join(' ');
  if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) {
    kids.unshift(attrs);
    attrs = null;
  }
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className += (el.className ? ' ' : '') + v;
    else if (k === 'style' && typeof v === 'object') {
      for (const [p, x] of Object.entries(v)) p.startsWith('--') ? el.style.setProperty(p, x) : (el.style[p] = x);
    }
    else if (k === 'html') el.innerHTML = v;
    else if (k in el && !['list', 'form', 'type'].includes(k) && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  add(el, kids);
  return el;
}
function add(el, kids) {
  for (const k of kids) {
    if (k == null || k === false) continue;
    if (Array.isArray(k)) add(el, k);
    else el.append(k instanceof Node ? k : String(k));
  }
}

// ---------- Dates (toujours en heure locale, format AAAA-MM-JJ) ----------
const p2 = (n) => String(n).padStart(2, '0');
export const iso = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export const today = () => iso(new Date());
export const parse = (s) => new Date(s + 'T00:00:00');
export const addDays = (s, n) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};
export const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / 864e5);
export const weekStart = (s) => addDays(s, -((parse(s).getDay() + 6) % 7)); // lundi

const DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export const MONTHS_LONG = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export function fmtDate(s, { weekday = true, year = false } = {}) {
  if (!s) return '—';
  const d = parse(s);
  const y = year || d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : '';
  return `${weekday ? DAYS[d.getDay()] + ' ' : ''}${d.getDate()} ${MONTHS[d.getMonth()]}${y}`;
}
export function fmtRel(s) {
  const n = diffDays(s, today());
  if (n === 0) return 'aujourd’hui';
  if (n === 1) return 'demain';
  if (n === -1) return 'hier';
  return n > 0 ? `dans ${n} j` : `il y a ${-n} j`;
}
export function fmtMin(m) {
  m = Math.round(m);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h${m % 60 ? ' ' + p2(m % 60) : ''}`;
}
export const fmtNum = (n, d = 1) =>
  n == null || Number.isNaN(n) ? '—' : n.toLocaleString('fr-FR', { maximumFractionDigits: d, minimumFractionDigits: 0 });
export const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
export const uid = (p) => `${p}-${crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2)}`;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** Début de l'année scolaire en cours (1er septembre). */
export function schoolYearStart(ref = today()) {
  const d = parse(ref);
  const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-09-01`;
}

// ---------- Matières ----------
export const SUBJECTS = [
  { id: 'Mathématiques', short: 'Maths', color: 'var(--s1)' },
  { id: 'Physique-Chimie', short: 'Physique', color: 'var(--s2)' },
  { id: 'Sciences Industrielles', short: 'SI', color: 'var(--s3)' },
  { id: 'Anglais', short: 'Anglais', color: 'var(--s4)' },
  { id: 'Français-Philosophie', short: 'Français', color: 'var(--s5)' },
  { id: 'TIPE', short: 'TIPE', color: 'var(--s6)' },
  { id: 'Informatique', short: 'Info', color: 'var(--s7)' },
  { id: 'Autre', short: 'Autre', color: 'var(--muted)' },
];
const SUBJ = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));
export const subj = (id) => SUBJ[id] || SUBJ.Autre;
export const subjTag = (id) =>
  h('span.tag', { style: { '--c': subj(id).color } }, h('i.dot'), subj(id).short === 'Autre' && id !== 'Autre' ? id : subj(id).short);

// ---------- Icônes (traits simples) ----------
const ICONS = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  cal: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  check: 'M4 12l5 5L20 6',
  cards: 'M6 4h12v14H6zM9 21h9a3 3 0 003-3V8',
  chart: 'M4 20V4M4 20h16M8 16l4-5 3 3 5-7',
  book: 'M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 21V5M9 7h6',
  timer: 'M12 8v5l3 2M9 2h6M12 5a8 8 0 100 16 8 8 0 000-16z',
  flag: 'M5 21V4M5 4h12l-2 4 2 4H5',
  cog: 'M12 9a3 3 0 100 6 3 3 0 000-6zM19 12a7 7 0 00-.1-1.3l2-1.5-2-3.4-2.3.9a7 7 0 00-2.2-1.3L14 3h-4l-.4 2.4a7 7 0 00-2.2 1.3l-2.3-.9-2 3.4 2 1.5a7 7 0 000 2.6l-2 1.5 2 3.4 2.3-.9a7 7 0 002.2 1.3L10 21h4l.4-2.4a7 7 0 002.2-1.3l2.3.9 2-3.4-2-1.5c.1-.4.1-.9.1-1.3z',
  plus: 'M12 5v14M5 12h14',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  play: 'M7 4l13 8-13 8z',
  pause: 'M7 4v16M17 4v16',
  stop: 'M6 6h12v12H6z',
  fire: 'M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z',
  left: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  download: 'M12 4v11M7 11l5 5 5-5M4 20h16',
  upload: 'M12 16V5M7 9l5-5 5 5M4 20h16',
  warn: 'M12 4l9 16H3zM12 10v4M12 17h.01',
  target: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 8a4 4 0 100 8 4 4 0 000-8z',
  mic: 'M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3zM6 11a6 6 0 0012 0M12 17v4',
  sun: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19',
};
export function icon(name, size = 20) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('width', size);
  s.setAttribute('height', size);
  s.setAttribute('class', 'icon');
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = `<path d="${ICONS[name] || ''}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  return s;
}

// ---------- Boîtes de dialogue ----------
export function modal(title, body, { wide = false } = {}) {
  const dlg = h('dialog.modal' + (wide ? '.wide' : ''));
  const close = () => {
    dlg.close();
    dlg.remove();
  };
  dlg.append(
    h('header', h('h2', title), h('button.icon-btn', { type: 'button', 'aria-label': 'Fermer', onclick: close }, '✕')),
    h('div.modal-body', body),
  );
  dlg.addEventListener('click', (e) => e.target === dlg && close());
  dlg.addEventListener('close', () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
  return { dlg, close };
}

/**
 * Formulaire générique. fields: [{name,label,type,options,value,required,placeholder,half}]
 * onSubmit(values) ; onDelete optionnel.
 */
export function formModal(title, fields, onSubmit, { onDelete, submitLabel = 'Enregistrer' } = {}) {
  const form = h('form.form');
  for (const f of fields) {
    let input;
    const common = { name: f.name, required: f.required, placeholder: f.placeholder };
    if (f.type === 'select') {
      input = h('select', common, f.options.map((o) => {
        const [val, lab] = Array.isArray(o) ? o : [o, o];
        return h('option', { value: val, selected: String(val) === String(f.value ?? '') }, lab);
      }));
    } else if (f.type === 'textarea') {
      input = h('textarea', { ...common, rows: f.rows || 3 }, f.value ?? '');
    } else {
      input = h('input', { ...common, type: f.type || 'text', value: f.value ?? '', step: f.step, min: f.min, max: f.max, list: f.list, inputmode: f.type === 'number' ? 'decimal' : null });
    }
    form.append(h('label.field' + (f.half ? '.half' : ''), h('span', f.label), input, f.hint && h('small', f.hint)));
    if (f.datalist) form.append(h('datalist', { id: f.list }, f.datalist.map((v) => h('option', { value: v }))));
  }
  const m = modal(title, form);
  form.append(
    h('div.form-actions',
      onDelete && h('button.btn.danger', { type: 'button', onclick: () => { if (confirm('Supprimer définitivement ?')) { onDelete(); m.close(); } } }, 'Supprimer'),
      h('span.grow'),
      h('button.btn', { type: 'button', onclick: m.close }, 'Annuler'),
      h('button.btn.primary', { type: 'submit' }, submitLabel)),
  );
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = {};
    for (const f of fields) {
      const raw = form.elements[f.name].value;
      v[f.name] = f.type === 'number' ? (raw === '' ? null : Number(raw.replace(',', '.'))) : raw.trim();
    }
    if (onSubmit(v) !== false) m.close();
  });
  return m;
}

export function toast(msg) {
  const t = h('div.toast', { role: 'status' }, msg);
  document.body.append(t);
  setTimeout(() => t.classList.add('out'), 2600);
  setTimeout(() => t.remove(), 3000);
}

export function gradeClass(g) {
  if (g == null) return '';
  return g >= 12 ? 'good' : g >= 9 ? 'mid' : 'bad';
}
export const empty = (text, action) => h('div.empty', h('p', text), action);
