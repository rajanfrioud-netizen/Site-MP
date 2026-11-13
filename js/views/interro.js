// Interro de cours : restitution active des points du programme, comme en khôlle.
import { state, save } from '../store.js';
import { h, icon, today, subj, SUBJECTS, fmtDate } from '../util.js';
import { PROGRAMME } from '../data.js';
import { editMistake } from '../forms.js';

let setup = { subject: 'Mathématiques', scope: 'seen', chapter: '', count: 10 };
let run = null; // { items:[{c, i}], index, shown, results:[bool] }

const chaptersOf = (subject) => (PROGRAMME.find((p) => p.subject === subject)?.blocks || []).flatMap((b) => b.chapters.map((c) => ({ ...c, subject, block: b.name })));
const known = (c, i) => (state.checks[c.id] || []).includes(i);

function draw() {
  let chs = chaptersOf(setup.subject);
  if (setup.scope === 'chapter') chs = chs.filter((c) => c.id === setup.chapter);
  else if (setup.scope === 'seen') {
    const seen = chs.filter((c) => state.chapters[c.id]?.level);
    if (seen.length) chs = seen;
  }
  const pool = chs.flatMap((c) => c.points.map((_, i) => ({ c, i })));
  // Les points pas encore sus sortent trois fois plus souvent.
  const weighted = pool.map((x) => ({ x, r: Math.random() * (known(x.c, x.i) ? 1 : 3) })).sort((a, b) => b.r - a.r);
  return weighted.slice(0, setup.count).map((w) => w.x);
}

export function interro(root, rerender) {
  document.onkeydown = null;
  if (run) return session(root, rerender);
  const chs = chaptersOf(setup.subject);
  const seen = chs.filter((c) => state.chapters[c.id]?.level).length;
  const chip = (label, on, fn) => h('button.chip' + (on ? '.on' : ''), { onclick: () => { fn(); rerender(); } }, label);

  root.append(h('header.page-head', h('a.btn', { href: '#/programme' }, icon('left', 16), 'Programme'), h('h1', 'Interro de cours')),
    h('p.muted', 'Le site tire des points du programme. Pour chacun : énonce la définition ou le théorème avec ses hypothèses, à voix haute ou sur brouillon, comme devant un colleur. Puis sois honnête.'),
    h('section.card',
      h('h2', 'Matière'),
      h('div.filters', SUBJECTS.filter((s) => chaptersOf(s.id).length).map((s) => chip(s.short, setup.subject === s.id, () => { setup.subject = s.id; setup.chapter = ''; }))),
      h('h2', 'Sur quoi'),
      h('div.filters',
        chip(seen ? `Chapitres déjà travaillés (${seen})` : 'Chapitres déjà travaillés', setup.scope === 'seen', () => (setup.scope = 'seen')),
        chip('Tout le programme', setup.scope === 'all', () => (setup.scope = 'all')),
        chip('Un seul chapitre', setup.scope === 'chapter', () => { setup.scope = 'chapter'; setup.chapter ||= chs[0]?.id; })),
      setup.scope === 'chapter' ? h('select', { 'aria-label': 'Chapitre', onchange: (e) => (setup.chapter = e.target.value) },
        chs.map((c) => h('option', { value: c.id, selected: c.id === setup.chapter }, `${c.block} — ${c.title}`))) : null,
      setup.scope === 'seen' && !seen ? h('p.muted', 'Aucun chapitre noté dans cette matière : l’interro portera sur tout le programme.') : null,
      h('h2', 'Nombre de questions'),
      h('div.filters', [5, 10, 20].map((n) => chip(String(n), setup.count === n, () => (setup.count = n)))),
      h('button.btn.primary.large', { onclick: () => { const items = draw(); if (items.length) { run = { items, index: 0, shown: false, results: [] }; rerender(); } } }, icon('play', 16), 'Commencer')));

  if (state.interros.length) {
    const last = [...state.interros].slice(-8).reverse();
    root.append(h('section.card', h('h2', 'Dernières interros'), last.map((x) => h('div.item',
      h('span.date', fmtDate(x.date)), h('i.dot', { style: { background: subj(x.subject).color } }), h('span', subj(x.subject).short), h('span.grow'),
      h('b.' + (x.ok / x.total >= 0.8 ? 'good' : x.ok / x.total >= 0.5 ? 'mid' : 'bad'), `${x.ok} / ${x.total}`)))));
  }
}

function session(root, rerender) {
  const r = run;
  const it = r.items[r.index];
  if (!it) return summary(root, rerender);
  const answer = (ok) => {
    const set = new Set(state.checks[it.c.id] || []);
    ok ? set.add(it.i) : set.delete(it.i);
    state.checks[it.c.id] = [...set].sort((a, b) => a - b);
    const cur = state.chapters[it.c.id]?.level || 0;
    state.chapters[it.c.id] = { level: Math.max(cur, 1), last: today() };
    r.results.push(ok);
    r.index++;
    r.shown = false;
    if (r.index >= r.items.length) state.interros.push({ date: today(), subject: setup.subject, total: r.items.length, ok: r.results.filter(Boolean).length });
    save();
  };
  root.append(h('header.page-head',
    h('button.btn', { onclick: () => { run = null; rerender(); } }, icon('left', 16), 'Arrêter'),
    h('span.muted', `${r.index + 1} / ${r.items.length}`)),
  h('div.progress.thin', h('i', { style: { width: (r.index / r.items.length) * 100 + '%' } })),
  h('section.flash',
    h('header', h('span.tag', { style: { '--c': subj(it.c.subject).color } }, h('i.dot'), it.c.block), h('span.muted', it.c.title)),
    h('h2', it.c.points[it.i]),
    h('p.muted', r.shown ? 'Compare avec ton cours si tu as un doute. Su = énoncé complet, hypothèses comprises, sans hésiter.' : 'Énonce, donne les hypothèses, un exemple ou l’idée de la preuve. Prends le temps qu’il faut.')));
  if (!r.shown) {
    root.append(h('div.rate', h('button.btn.primary.large', { onclick: () => { r.shown = true; rerender(); } }, 'J’ai répondu'), h('small.muted.kbd-hint', 'Espace')));
  } else {
    root.append(h('div.rate',
      h('button.btn.large.rate-bad', { onclick: () => answer(false) }, h('b', 'Je séchais'), h('small', 'à revoir · 1')),
      h('button.btn.large.rate-good', { onclick: () => answer(true) }, h('b', 'Su'), h('small', 'sans hésiter · 2'))));
  }
  document.onkeydown = (e) => {
    if (e.target.closest('input, textarea, select, dialog')) return;
    if (!r.shown && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); r.shown = true; rerender(); }
    else if (r.shown && e.key === '1') answer(false);
    else if (r.shown && e.key === '2') answer(true);
  };
}

function summary(root, rerender) {
  const r = run;
  const ok = r.results.filter(Boolean).length;
  const missed = r.items.filter((_, i) => !r.results[i]);
  root.append(h('section.card.center',
    h('h1', `${ok} / ${r.items.length}`),
    h('p.muted', ok === r.items.length ? 'Tout est su. Passe aux exercices.' : 'Les points ratés sont décochés dans le programme et ressortiront en priorité.'),
    h('div.row.center',
      h('button.btn.primary', { onclick: () => { run = null; rerender(); } }, 'Nouvelle interro'),
      h('a.btn', { href: '#/programme', onclick: () => (run = null) }, 'Programme'), h('a.btn', { href: '#/', onclick: () => (run = null) }, 'Accueil'))));
  if (missed.length) {
    root.append(h('section.card', h('h2', 'À reprendre dans le cours'), missed.map((m) => h('div.item',
      h('span.item-main', h('b', m.c.points[m.i]), h('small', m.c.title)),
      h('button.btn.small', { onclick: () => editMistake(null, { subject: m.c.subject, chapter: m.c.title, title: m.c.points[m.i], description: 'Énoncer précisément, avec les hypothèses.' }) }, '+ Fiche')))));
  }
}
