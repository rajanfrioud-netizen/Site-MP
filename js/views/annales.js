import { state, save } from '../store.js';
import { h, icon, today, fmtDate, fmtRel, fmtNum, subj, gradeClass, mean, formModal, modal, diffDays } from '../util.js';
import { start } from '../timer.js';
import { engage } from '../ambient.js';
import { launchClockTimer } from '../widget.js';
import { editMistake, editDS } from '../forms.js';
import { PROGRAMME } from '../data.js';
import { THEMES, KEYWORDS } from '../annales-data.js';

// Vingt sessions. Les épreuves suivent la nomenclature de doc-solus.fr (MP_MATHS_MINES_1_2019…).
const YEARS = Array.from({ length: 20 }, (_, i) => 2025 - i);
const CONCOURS = [
  { id: 'MINES', name: 'Mines-Ponts', official: () => 'https://concoursminesponts.fr/' },
  { id: 'CENTRALE', name: 'Centrale-Supélec', official: (y) => `https://www.concours-centrale-supelec.fr/CentraleSupelec/${y}/MP` },
];
const EPREUVES = [
  { id: 'MATHS_1', label: 'Maths 1', subject: 'Mathématiques', kind: 'maths' },
  { id: 'MATHS_2', label: 'Maths 2', subject: 'Mathématiques', kind: 'maths' },
  { id: 'PHYSIQUE_1', label: 'Physique 1', subject: 'Physique-Chimie', kind: 'physique' },
  { id: 'PHYSIQUE_2', label: 'Physique 2', subject: 'Physique-Chimie', kind: 'physique' },
  { id: 'CHIMIE_1', label: 'Chimie', subject: 'Physique-Chimie', kind: 'chimie', only: 'MINES' },
  { id: 'SI_1', label: 'Sciences industrielles', subject: 'Sciences Industrielles', kind: 'si' },
];
const KINDS = [['maths', 'Maths'], ['physique', 'Physique'], ['chimie', 'Chimie'], ['si', 'SI']];
const CHEM = /^(mp-chi-|sup-ph-(08|09|10)$)/;
const kindOfChapter = (id) => (CH[id]?.subject === 'Sciences Industrielles' ? 'si' : CHEM.test(id) ? 'chimie' : CH[id]?.subject === 'Mathématiques' ? 'maths' : 'physique');
const kindOfSubject = (s) => (s === 'Mathématiques' ? 'maths' : s === 'Sciences Industrielles' ? 'si' : 'physique');
/** Durée et chrono de chaque épreuve. */
function duration(c, e) {
  if (e.kind === 'chimie') return ['e15', '1 h 30'];
  if (c.id === 'CENTRALE') return ['e4', '4 h'];
  if (e.kind === 'si') return ['e4', '4 h'];
  return ['e3', '3 h'];
}
const key = (c, e, y) => { const [m, n] = e.id.split('_'); return `MP_${m}_${c.id}_${n}_${y}`; };
const DS = 'https://www.doc-solus.fr/prepa/sci/adc';
const ALL = YEARS.flatMap((y) => CONCOURS.flatMap((c) => EPREUVES.filter((e) => !e.only || e.only === c.id).map((e) => ({ c, e, y, k: key(c, e, y) }))));

// ---------- Chapitres ----------
const CHAPTERS = PROGRAMME.filter((p) => ['Mathématiques', 'Physique-Chimie', 'Sciences Industrielles'].includes(p.subject))
  .flatMap((p) => p.blocks.flatMap((b) => b.chapters.map((c) => ({ ...c, subject: p.subject, block: b.name }))));
const CH = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));
export const chapterTitle = (id) => CH[id]?.title || id;

/** Chapitres d'une épreuve : ceux corrigés par l'élève, sinon ceux de la table. */
export const tagsOf = (k) => state.annaleTags?.[k] ?? THEMES[k]?.c ?? [];
const themeOf = (k) => THEMES[k]?.t || '';
/** Épreuves qui portent sur au moins un des chapitres, les plus pertinentes d'abord. */
export function annalesFor(ids) {
  const want = new Set(ids);
  const si = ids.length && ids.every((id) => kindOfChapter(id) === 'si');
  return ALL.map((a) => ({ ...a, hits: tagsOf(a.k).filter((id) => want.has(id)) }))
    .filter((a) => a.hits.length || (si && a.e.kind === 'si'))
    .sort((a, b) => b.hits.length - a.hits.length || b.y - a.y);
}
const chapterOptions = (subject) => CHAPTERS.filter((c) => !subject || c.subject === subject || (subject === 'Physique-Chimie' && c.subject === 'Physique-Chimie')).map((c) => [c.id, c.title, `${subj(c.subject).short} · ${c.block}`]);

let filter = { concours: 'MINES', kind: '', todo: false, chapters: [] };

/** Prochain DS de maths ou de physique, dans les trois semaines. */
function nextDS() {
  const t = today();
  return state.ds.filter((x) => x.grade == null && x.date >= t && diffDays(x.date, t) <= 21 && ['Mathématiques', 'Physique-Chimie', 'Sciences Industrielles'].includes(x.subject))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function annales(root, sub, rerender) {
  const isRes = sub === 'ressources';
  if (sub === 'chapitre') {
    const id = decodeURIComponent(location.hash.split('/')[3] || '');
    if (CH[id]) filter = { ...filter, chapters: [id], kind: kindOfChapter(id) };
    history.replaceState(null, '', '#/annales');
  } else if (sub === 'ds') {
    const ds = nextDS().find((x) => x.chapters?.length);
    if (ds) filter = { ...filter, chapters: [...ds.chapters], kind: kindOfSubject(ds.subject) };
    history.replaceState(null, '', '#/annales');
  }
  root.append(h('header.page-head', h('h1', 'Annales')),
    h('div.tabs', h('a' + (!isRes ? '.on' : ''), { href: '#/annales' }, 'Mines-Ponts et Centrale'), h('a' + (isRes ? '.on' : ''), { href: '#/annales/ressources' }, 'DS, DM et corrigés ailleurs')));
  if (isRes) return ressources(root);

  const total = ALL.length;
  const done = Object.values(state.annales).filter((a) => a.done);
  const grades = done.map((a) => a.grade).filter((g) => g != null);
  root.append(h('section.tiles',
    h('div.tile', h('span.tile-label', 'Épreuves faites'), h('span.tile-value', `${done.length} / ${total}`), h('span.tile-sub', '2006 à 2025 : maths, physique, chimie, SI')),
    h('div.tile', h('span.tile-label', 'Note moyenne estimée'), h('span.tile-value.' + gradeClass(mean(grades)), fmtNum(mean(grades))), h('span.tile-sub', `${grades.length} épreuve${grades.length > 1 ? 's' : ''} notée${grades.length > 1 ? 's' : ''}`))));

  // ----- Prochain DS -----
  const upcomingDS = nextDS();
  if (upcomingDS.length) {
    const card = h('section.card.next-ds', h('header.card-head', h('h2', 'Pour tes prochains DS'), h('span.muted', 'Entraîne-toi sur les sujets de concours qui portent sur les mêmes chapitres')));
    for (const ds of upcomingDS.slice(0, 3)) {
      const chs = ds.chapters || [];
      const n = annalesFor(chs).length;
      card.append(h('div.ds-row',
        h('span.date', fmtDate(ds.date), h('small', ' ' + fmtRel(ds.date))),
        h('span.grow', h('b', `${ds.topic || 'DS'} · ${subj(ds.subject).short}`),
          chs.length ? h('span.chips', chs.map((id) => h('span.chip-s', chapterTitle(id)))) : h('small.muted', ' — chapitres non renseignés')),
        chs.length
          ? h('button.btn.small.primary', { onclick: () => { filter = { ...filter, chapters: [...chs], kind: kindOfSubject(ds.subject) }; rerender(); } }, `${n} sujet${n > 1 ? 's' : ''}`)
          : h('button.btn.small', { onclick: () => editDS(ds) }, 'Indiquer les chapitres')));
    }
    root.append(card);
  }

  // ----- Filtres -----
  const chip = (label, on, fn) => h('button.chip' + (on ? '.on' : ''), { onclick: () => { fn(); rerender(); } }, label);
  const groups = [['maths', 'Mathématiques'], ['physique', 'Physique-Chimie'], ['chimie', 'Physique-Chimie'], ['si', 'Sciences Industrielles']]
    .filter(([k]) => !filter.kind || k === filter.kind)
    .flatMap(([k, s]) => PROGRAMME.find((p) => p.subject === s).blocks.map((b) => ({ k, s, b, chs: b.chapters.filter((c) => kindOfChapter(c.id) === k) })))
    .filter((g) => g.chs.length);
  const sel = h('select.chapter-select', { 'aria-label': 'Chapitre', onchange: (e) => { filter.chapters = e.target.value ? [e.target.value] : []; if (e.target.value) filter.kind = kindOfChapter(e.target.value); rerender(); } },
    h('option', { value: '' }, 'Tous les chapitres'),
    groups.map((g) => h('optgroup', { label: `${KINDS.find(([k]) => k === g.k)[1]} · ${g.b.name}` },
      g.chs.map((c) => { const n = annalesFor([c.id]).length; return h('option', { value: c.id, selected: filter.chapters.length === 1 && filter.chapters[0] === c.id, disabled: !n }, `${c.title} (${n})`); }))));
  root.append(h('div.filters',
    KINDS.map(([k, label]) => chip(label, filter.kind === k, () => { filter.kind = filter.kind === k ? '' : k; filter.chapters = filter.chapters.filter((id) => !filter.kind || kindOfChapter(id) === filter.kind); })),
    sel,
    chip('Pas encore faites', filter.todo, () => (filter.todo = !filter.todo)),
    h('span.grow'),
    h('button.btn.small', { onclick: () => {
      const pool = (filter.chapters.length ? annalesFor(filter.chapters) : ALL.filter((a) => a.y >= 2015 && a.c.id === filter.concours))
        .filter((a) => (filter.chapters.length || !filter.kind || a.e.kind === filter.kind) && !state.annales[a.k]?.done);
      if (pool.length) { const a = pool[Math.floor(Math.random() * Math.min(pool.length, filter.chapters.length ? 6 : pool.length))]; open(a.c, a.e, a.y); }
    }, title: filter.chapters.length ? 'Parmi les sujets les plus proches de tes chapitres' : 'Parmi les sessions 2015 à 2025, plus proches du programme actuel' }, 'Tirer un sujet au hasard')));

  if (filter.chapters.length) return byChapter(root, rerender);

  root.append(h('p.note', 'Choisis un chapitre pour voir les sujets qui le travaillent, ou parcours par année. Chaque épreuve ouvre l’énoncé, le rapport du jury et un corrigé en ligne : fais-la en temps limité, compare, note-toi, puis transforme tes erreurs en fiches.'));
  root.append(h('div.filters', CONCOURS.map((c) => chip(c.name, filter.concours === c.id, () => (filter.concours = c.id)))));
  const c = CONCOURS.find((x) => x.id === filter.concours);
  const card = h('section.card', h('header.card-head', h('h2', c.name + ' — filière MP'),
    h('span.muted', 'Nouveaux programmes aux concours 2015 puis 2023 : dans les sujets plus anciens, certaines parties sont hors programme')));
  for (const y of YEARS) {
    const list = EPREUVES.filter((e) => (!e.only || e.only === c.id) && (!filter.kind || e.kind === filter.kind) && (!filter.todo || !state.annales[key(c, e, y)]?.done));
    if (!list.length) continue;
    card.append(h('div.ann-year', h('b', String(y)), h('div.ann-list', list.map((e) => {
      const k = key(c, e, y);
      const a = state.annales[k];
      return h('button.ann' + (a?.done ? '.done' : ''), { onclick: () => open(c, e, y), title: themeOf(k) || null },
        h('i.dot', { style: { background: subj(e.subject).color } }),
        h('span.ann-txt', h('span', e.label), themeOf(k) ? h('small', themeOf(k)) : null),
        a?.done ? h('small.ann-grade.' + gradeClass(a.grade), a.grade != null ? fmtNum(a.grade) : '✓') : null);
    }))));
  }
  root.append(card);
}

function byChapter(root, rerender) {
  const list = annalesFor(filter.chapters).filter((a) => !filter.todo || !state.annales[a.k]?.done);
  const siOnly = filter.chapters.every((id) => kindOfChapter(id) === 'si');
  const want = new Set(filter.chapters);
  root.append(h('section.card',
    h('header.card-head', h('h2', filter.chapters.length === 1 ? chapterTitle(filter.chapters[0]) : `${filter.chapters.length} chapitres`),
      h('button.btn.small', { onclick: () => { filter.chapters = []; rerender(); } }, 'Tout afficher')),
    filter.chapters.length > 1 ? h('span.chips', filter.chapters.map((id) => h('button.chip-s.removable', { title: 'Retirer ce chapitre', onclick: () => { filter.chapters = filter.chapters.filter((x) => x !== id); rerender(); } }, chapterTitle(id), ' ✕'))) : null,
    siOnly ? h('p.note', 'En sciences industrielles, chaque sujet parcourt presque tout le programme (cinématique, dynamique, énergétique, asservissements) autour d’un système réel : tous les sujets de SI sont donc proposés, ceux dont les chapitres sont connus en premier.') : null,
    h('p.muted', `${list.length} épreuve${list.length > 1 ? 's' : ''} de Mines-Ponts ou Centrale, classées par nombre de chapitres en commun puis par année. Le classement vient du thème de chaque sujet : un sujet mélange toujours plusieurs chapitres, lis l’énoncé avant de te lancer.`),
    list.length ? list.map((a) => {
      const done = state.annales[a.k];
      return h('button.item-main.rowlike.ann-row', { onclick: () => open(a.c, a.e, a.y) },
        h('span.date', String(a.y)),
        h('i.dot', { style: { background: subj(a.e.subject).color } }),
        h('span.grow.ann-row-main',
          h('b', `${a.c.name} · ${a.e.label}`),
          h('small', themeOf(a.k)),
          h('span.chips', tagsOf(a.k).map((id) => h('span.chip-s' + (want.has(id) ? '.hit' : ''), chapterTitle(id))))),
        done?.done ? h('b.grade.' + gradeClass(done.grade), done.grade != null ? fmtNum(done.grade) : '✓') : (a.y < 2015 ? h('span.pill', 'ancien programme') : null));
    }) : h('p.muted', 'Aucun sujet classé sur ce chapitre parmi ceux dont le thème est connu.'),
    h('div.links-inline',
      h('span.muted', 'Chercher d’autres sujets (CCINP, X, e3a…) : '),
      siOnly
        ? [h('a.link', { href: 'https://www.upsti.fr/espace-etudiants/annales-de-concours', target: '_blank', rel: 'noopener' }, 'UPSTI : sujets et corrigés de SI (CCINP, e3a…)')]
        : filter.chapters.filter((id) => kindOfChapter(id) !== 'si').map((id) => h('a.link', { href: `https://www.doc-solus.fr/main.html?filiere=MP&words=${encodeURIComponent(KEYWORDS[id] || chapterTitle(id))}`, target: '_blank', rel: 'noopener' }, `« ${KEYWORDS[id] || chapterTitle(id)} » sur Doc Solus`)),
      h('a.link', { href: 'https://wikiprepa.fr/concours/chapitres', target: '_blank', rel: 'noopener' }, 'WikiPrépa par chapitre'))));
}

function open(c, e, y) {
  const k = key(c, e, y);
  const a = state.annales[k] || {};
  const name = `${c.name} ${e.label} MP ${y}`;
  const q = encodeURIComponent(`corrigé ${name}`);
  const link = (href, label, sub) => h('a.btn', { href, target: '_blank', rel: 'noopener' }, h('span', h('b', label), sub ? h('small.muted', ' — ' + sub) : null));
  const tags = tagsOf(k);
  const dur = duration(c, e);
  const m = modal(name, h('div.links',
    themeOf(k) ? h('p', h('b', 'Thème : '), themeOf(k)) : h('p.muted', 'Thème non répertorié ici : ouvre l’énoncé pour le découvrir.'),
    h('div.chips', tags.map((id) => h('a.chip-s', { href: `#/annales/chapitre/${id}`, onclick: () => m.close() }, chapterTitle(id))),
      h('button.btn.small', { onclick: () => { m.close(); editTags(k, e.subject, name); } }, tags.length ? 'Modifier les chapitres' : 'Indiquer les chapitres')),
    e.kind === 'si' ? [
      link('https://www.upsti.fr/espace-etudiants/annales-de-concours', 'Sujet et corrigé UPSTI', 'corrigés rédigés par des professeurs de SI ; cherche le système'),
      link(c.id === 'CENTRALE' ? `https://www.hadamard.fr/annales/s2i-centrale-supelec-mp/${y}` : 'https://www.hadamard.fr/annales/s2i-mines-ponts-mp', 'Sujet et rapport du jury', 'hadamard.fr'),
      link(c.id === 'CENTRALE' ? 'https://groupe-reussite.fr/ressources/annales-si-centrale-supelec/' : 'https://groupe-reussite.fr/ressources/annales-si-mines-pont/', 'Autres corrigés', 'Groupe Réussite'),
    ] : [
      link(`${DS}/bin/view.corrige.html?q=${k}`, 'Énoncé et corrigé', 'doc-solus.fr : énoncé complet, corrigé en partie payant'),
      link(`${DS}/pdf/enonces.pdf/${y}/${k}.enonce.pdf`, 'Énoncé en PDF', 'à imprimer'),
      link(`${DS}/pdf/rapports.pdf/${y}/${k}.rapport.pdf`, 'Rapport du jury', 'ce que les correcteurs attendaient'),
    ],
    link(c.official(y), 'Site officiel du concours', c.id === 'CENTRALE' ? `sujets et rapports ${y}` : 'sujets et rapports récents'),
    link(`https://duckduckgo.com/?q=${q}`, 'Chercher d’autres corrigés', 'sites de professeurs, UPS, WikiPrépa'),
    h('div.row',
      h('button.btn.primary', { onclick: () => { start(dur[0], e.subject); engage(); launchClockTimer(); m.close(); location.hash = '#/focus'; } }, icon('timer', 16), `Lancer ${dur[1]}`),
      h('button.btn', { onclick: () => { m.close(); result(k, name); } }, icon('check', 16), a.done ? 'Modifier mon résultat' : 'J’ai fait cette épreuve'),
      h('button.btn', { onclick: () => { m.close(); editMistake(null, { subject: e.subject, title: `${name} — `, chapter: tags[0] ? chapterTitle(tags[0]) : '' }); } }, '+ Fiche d’erreur')),
    h('p.muted', 'Vérifie la durée sur l’en-tête du sujet, elle a pu changer selon les sessions ; le chrono propose aussi 2 h, 3 h et 4 h.'),
    a.done ? h('p', `Faite le ${fmtDate(a.date, { year: true })}${a.grade != null ? ` · ${fmtNum(a.grade)} / 20` : ''}${a.notes ? ' · ' + a.notes : ''}`) : null));
}

function editTags(k, subject, name) {
  formModal(`Chapitres — ${name}`, [
    { name: 'tags', label: 'Chapitres travaillés par ce sujet', type: 'checks', value: tagsOf(k), options: () => chapterOptions(subject),
      hint: THEMES[k] ? 'Proposition faite d’après le thème du sujet ; corrige-la après l’avoir lu ou fait.' : null },
  ], (v) => { state.annaleTags = { ...(state.annaleTags || {}), [k]: v.tags }; save(); });
}

function result(k, name) {
  const a = state.annales[k] || {};
  formModal(name, [
    { name: 'date', label: 'Faite le', type: 'date', value: a.date || today(), required: true, half: true },
    { name: 'grade', label: 'Note estimée / 20', type: 'number', min: 0, max: 20, step: 0.5, value: a.grade, half: true, hint: 'Avec le barème du rapport si possible' },
    { name: 'notes', label: 'Bilan', type: 'textarea', value: a.notes, placeholder: 'Questions traitées, où j’ai bloqué, ce qu’il faut revoir' },
  ], (v) => { state.annales[k] = { done: true, ...v }; save(); },
  { onDelete: a.done && (() => { delete state.annales[k]; save(); }) });
}

const RESSOURCES = [
  ['Maths — DS et DM de MP avec corrigés', [
    ['http://philippe.skler.free.fr/ds.htm', 'Philippe Skler — devoirs surveillés de MP', 'DS de l’année avec corrigés ; TD et DM sur la page d’archives du même site.'],
    ['http://prepa.blois.free.fr/SITEMP/maths/crbst_6.html', 'Prépa de Blois — maths MP', 'DS numérotés avec corrigé et rapport, archives par année.'],
    ['https://joffre-mp2.fr/d-s/', 'Lycée Joffre, MP2 — D.S. de maths', 'Sujets et corrigés, souvent tirés de Mines-Ponts et Centrale.'],
    ['https://mp-montesquieu.fr/', 'Lycée Montesquieu (Le Mans) — MP', 'Rubrique « Sujets DS » ; corrigés à vérifier sur place.'],
    ['https://www.bibmath.net/pbs/', 'BibM@th — bibliothèque de problèmes', 'Problèmes classés par thème et par concours.'],
  ]],
  ['Physique — devoirs et corrigés', [
    ['http://pikeroen.free.fr/wordpress/index.php/devoirs-problemes-et-corriges/devoirs-et-corriges/', 'Pikeroen — devoirs et corrigés', 'DS, DM et concours blancs corrigés en PDF ; vérifie la filière de chaque sujet.'],
    ['http://benjamin.mollier.free.fr/index.php?page=DS&annee=2023', 'Benjamin Mollier — devoirs surveillés', 'Sujets et corrigés ; niveau à vérifier (plusieurs thèmes de première année).'],
    ['https://wikiprepa.fr/concours?filiere=mp&matiere=physique', 'WikiPrépa — physique MP', 'Sujets de concours avec corrigés détaillés question par question quand ils existent.'],
  ]],
  ['Annales et corrigés de concours', [
    ['https://www.concours-centrale-supelec.fr/sujets-rapports', 'Centrale-Supélec — sujets et rapports', 'Site officiel, toutes les sessions.'],
    ['https://concoursminesponts.fr/', 'Mines-Ponts — site officiel', 'Sujets et rapports des dernières sessions.'],
    ['https://doc-solus.fr/main.html?filiere=MP', 'Doc Solus — annales MP', 'Tous les énoncés ; début de chaque corrigé en accès libre, la suite est payante.'],
    ['https://groupe-reussite.fr/ressources/annales-maths-mines-pont/', 'Groupe Réussite — maths Mines-Ponts', 'Sujets et corrigés annoncés gratuits, 2011 à 2022.'],
    ['https://groupe-reussite.fr/ressources/annales-maths-centrale-supelec', 'Groupe Réussite — maths Centrale', 'Sujets et corrigés, 2011 à 2022.'],
    ['https://major-prepa.com/annales/annales-du-concours-commun-mines-ponts/annales-mp-du-concours-mines-ponts/', 'Major Prépa — annales Mines-Ponts MP', 'Sujets de maths et de physique depuis 2014.'],
  ]],
  ['Ton lycée', [
    ['https://cahier-de-prepa.fr/', 'Cahier de prépa', 'Cherche la page de ta classe à Michelet : c’est là que tes professeurs déposent DS, DM et corrigés. Les pages d’autres lycées sont souvent publiques.'],
  ]],
];

function ressources(root) {
  root.append(h('p.note', 'Liens trouvés par recherche en novembre 2026. Je n’ai pas pu ouvrir ces sites depuis l’environnement de développement : si un lien est mort, cherche le nom du site.'));
  for (const [title, list] of RESSOURCES) {
    root.append(h('section.card', h('h2', title), list.map(([href, name, desc]) =>
      h('a.res', { href, target: '_blank', rel: 'noopener' }, h('b', name), h('small', desc)))));
  }
}
