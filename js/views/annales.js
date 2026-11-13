import { state, save } from '../store.js';
import { h, icon, today, fmtDate, fmtNum, subj, gradeClass, mean, formModal, modal } from '../util.js';
import { start } from '../timer.js';
import { editMistake } from '../forms.js';

// Vingt sessions. Les épreuves suivent la nomenclature de doc-solus.fr (MP_MATHS_MINES_1_2019…).
const YEARS = Array.from({ length: 20 }, (_, i) => 2025 - i);
const CONCOURS = [
  { id: 'MINES', name: 'Mines-Ponts', official: () => 'https://concoursminesponts.fr/' },
  { id: 'CENTRALE', name: 'Centrale-Supélec', official: (y) => `https://www.concours-centrale-supelec.fr/CentraleSupelec/${y}/MP` },
];
const EPREUVES = [
  { id: 'MATHS_1', label: 'Maths 1', subject: 'Mathématiques' },
  { id: 'MATHS_2', label: 'Maths 2', subject: 'Mathématiques' },
  { id: 'PHYSIQUE_1', label: 'Physique 1', subject: 'Physique-Chimie' },
  { id: 'PHYSIQUE_2', label: 'Physique 2', subject: 'Physique-Chimie' },
];
const key = (c, e, y) => { const [m, n] = e.id.split('_'); return `MP_${m}_${c.id}_${n}_${y}`; };
const DS = 'https://www.doc-solus.fr/prepa/sci/adc';

let filter = { concours: 'MINES', subject: '', todo: false };

export function annales(root, sub, rerender) {
  const isRes = sub === 'ressources';
  root.append(h('header.page-head', h('h1', 'Annales')),
    h('div.tabs', h('a' + (!isRes ? '.on' : ''), { href: '#/annales' }, 'Mines-Ponts et Centrale'), h('a' + (isRes ? '.on' : ''), { href: '#/annales/ressources' }, 'DS, DM et corrigés ailleurs')));
  if (isRes) return ressources(root);

  const total = YEARS.length * CONCOURS.length * EPREUVES.length;
  const done = Object.values(state.annales).filter((a) => a.done);
  const grades = done.map((a) => a.grade).filter((g) => g != null);
  root.append(h('section.tiles',
    h('div.tile', h('span.tile-label', 'Épreuves faites'), h('span.tile-value', `${done.length} / ${total}`), h('span.tile-sub', '2006 à 2025, maths et physique')),
    h('div.tile', h('span.tile-label', 'Note moyenne estimée'), h('span.tile-value.' + gradeClass(mean(grades)), fmtNum(mean(grades))), h('span.tile-sub', `${grades.length} épreuve${grades.length > 1 ? 's' : ''} notée${grades.length > 1 ? 's' : ''}`))));

  root.append(h('p.note', 'Chaque épreuve ouvre l’énoncé, le rapport du jury et un corrigé publié en ligne. Les sujets appartiennent aux concours : le site y renvoie sans les recopier. Fais l’épreuve en temps limité, compare au corrigé, note-toi, puis transforme tes erreurs en fiches.'));

  const chip = (label, on, fn) => h('button.chip' + (on ? '.on' : ''), { onclick: () => { fn(); rerender(); } }, label);
  root.append(h('div.filters',
    CONCOURS.map((c) => chip(c.name, filter.concours === c.id, () => (filter.concours = c.id))),
    chip('Maths', filter.subject === 'Mathématiques', () => (filter.subject = filter.subject === 'Mathématiques' ? '' : 'Mathématiques')),
    chip('Physique', filter.subject === 'Physique-Chimie', () => (filter.subject = filter.subject === 'Physique-Chimie' ? '' : 'Physique-Chimie')),
    chip('Pas encore faites', filter.todo, () => (filter.todo = !filter.todo)),
    h('span.grow'),
    h('button.btn.small', { onclick: () => {
      const pool = [];
      for (const y of YEARS.filter((y) => y >= 2015)) for (const c of CONCOURS) for (const e of EPREUVES) {
        if ((!filter.subject || e.subject === filter.subject) && c.id === filter.concours && !state.annales[key(c, e, y)]?.done) pool.push([c, e, y]);
      }
      if (pool.length) open(...pool[Math.floor(Math.random() * pool.length)]);
    }, title: 'Parmi les sessions 2015 à 2025, plus proches du programme actuel' }, 'Tirer un sujet au hasard')));

  const c = CONCOURS.find((x) => x.id === filter.concours);
  const card = h('section.card', h('header.card-head', h('h2', c.name + ' — filière MP'),
    h('span.muted', 'Nouveaux programmes aux concours 2015 puis 2023 : dans les sujets plus anciens, certaines parties sont hors programme')));
  for (const y of YEARS) {
    const list = EPREUVES.filter((e) => (!filter.subject || e.subject === filter.subject) && (!filter.todo || !state.annales[key(c, e, y)]?.done));
    if (!list.length) continue;
    card.append(h('div.ann-year', h('b', String(y)), h('div.ann-list', list.map((e) => {
      const a = state.annales[key(c, e, y)];
      return h('button.ann' + (a?.done ? '.done' : ''), { onclick: () => open(c, e, y) },
        h('i.dot', { style: { background: subj(e.subject).color } }), e.label,
        a?.done ? h('small.' + gradeClass(a.grade), a.grade != null ? fmtNum(a.grade) : '✓') : null);
    }))));
  }
  root.append(card);
}

function open(c, e, y) {
  const k = key(c, e, y);
  const a = state.annales[k] || {};
  const name = `${c.name} ${e.label} MP ${y}`;
  const q = encodeURIComponent(`corrigé ${name}`);
  const link = (href, label, sub) => h('a.btn', { href, target: '_blank', rel: 'noopener' }, h('span', h('b', label), sub ? h('small.muted', ' — ' + sub) : null));
  const m = modal(name, h('div.links',
    link(`${DS}/bin/view.corrige.html?q=${k}`, 'Énoncé et corrigé', 'doc-solus.fr : énoncé complet, corrigé en partie payant'),
    link(`${DS}/pdf/enonces.pdf/${y}/${k}.enonce.pdf`, 'Énoncé en PDF', 'à imprimer'),
    link(`${DS}/pdf/rapports.pdf/${y}/${k}.rapport.pdf`, 'Rapport du jury', 'ce que les correcteurs attendaient'),
    link(c.official(y), 'Site officiel du concours', c.id === 'CENTRALE' ? `sujets et rapports ${y}` : 'sujets et rapports récents'),
    link(`https://duckduckgo.com/?q=${q}`, 'Chercher d’autres corrigés', 'sites de professeurs, UPS, WikiPrépa'),
    h('div.row',
      h('button.btn.primary', { onclick: () => { start(c.id === 'CENTRALE' ? 'e4' : 'e3', e.subject); m.close(); location.hash = '#/focus'; } }, icon('timer', 16), c.id === 'CENTRALE' ? 'Lancer 4 h' : 'Lancer 3 h'),
      h('button.btn', { onclick: () => { m.close(); result(k, name); } }, icon('check', 16), a.done ? 'Modifier mon résultat' : 'J’ai fait cette épreuve'),
      h('button.btn', { onclick: () => { m.close(); editMistake(null, { subject: e.subject, title: `${name} — ` }); } }, '+ Fiche d’erreur')),
    h('p.muted', c.id === 'MINES' ? 'Vérifie la durée sur l’en-tête du sujet (3 h ou 4 h selon l’épreuve) et choisis le chrono correspondant.' : 'Épreuve de 4 heures.'),
    a.done ? h('p', `Faite le ${fmtDate(a.date, { year: true })}${a.grade != null ? ` · ${fmtNum(a.grade)} / 20` : ''}${a.notes ? ' · ' + a.notes : ''}`) : null));
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
