import { state, save, imgGet } from '../store.js';
import { h, icon, today, fmtDate, fmtRel, subjTag, SUBJECTS, empty, diffDays } from '../util.js';
import { dueQueue, next, RATINGS, isLeech, isVague, levelLabel, MAX_LEVEL, isDue } from '../srs.js';
import { rich, formula } from '../math.js';
import { editMistake, showImage } from '../forms.js';

let filter = { subject: '', q: '', only: '' };
let session = null; // { queue, index, revealed, done, again }

function photoEl(card, side) {
  if (!card['has' + side]) return null;
  const img = h('img.card-photo', { alt: side === 'Front' ? 'Photo de l’énoncé' : 'Photo du corrigé', loading: 'lazy' });
  imgGet(`${card.id}:${side}`).then((src) => {
    if (!src) return img.remove();
    img.src = src;
    img.onclick = () => showImage(src);
  });
  return img;
}

export function erreurs(root, sub) {
  if (sub === 'revision') return review(root);
  session = null;
  if (sub === 'a-reecrire') filter = { subject: '', q: '', only: 'leech' };
  const cards = state.mistakes;
  const due = dueQueue(cards);

  root.append(h('header.page-head', h('h1', 'Carnet d’erreurs'),
    h('button.btn.primary', { onclick: () => editMistake() }, icon('plus', 16), 'Nouvelle fiche')));

  // ----- Bandeau de révision -----
  const n = Math.min(due.length, state.settings.reviewLimit);
  root.append(h('section.card.review-banner',
    h('div', h('span.big', String(due.length)), h('span', due.length > 1 ? ' fiches à revoir' : ' fiche à revoir'),
      h('p.muted', due.length ? `Séance du jour : ${n} fiches, les critiques et les plus en retard d’abord.` : nextDueText(cards))),
    due.length ? h('a.btn.primary.large', { href: '#/erreurs/revision' }, icon('play', 16), 'Réviser') : null));

  // ----- Répartition par niveau -----
  const levels = Array.from({ length: MAX_LEVEL + 1 }, (_, l) => cards.filter((c) => (c.srsLevel || 0) === l).length);
  if (cards.length) {
    root.append(h('section.card', h('header.card-head', h('h2', 'Mémorisation'), h('span.muted', 'De « ratée » à « acquise » : chaque bonne réponse fait monter la fiche d’une boîte')),
      h('div.boxes', levels.map((c, l) => h('div.box', { title: levelLabel(l) }, h('span.box-bar', h('i', { style: { height: (cards.length ? (c / cards.length) * 100 : 0) + '%' } })), h('b', String(c)), h('small', `N${l}`))))));
  }

  // ----- Filtres -----
  const subjects = SUBJECTS.filter((s) => cards.some((c) => c.subject === s.id));
  const redraw = () => save({ touch: false });
  const chip = (label, active, on) => h('button.chip' + (active ? '.on' : ''), { onclick: () => { on(); redraw(); } }, label);
  const search = h('input', { type: 'search', placeholder: 'Chercher dans les fiches…', value: filter.q, 'aria-label': 'Recherche' });
  search.addEventListener('change', () => { filter.q = search.value; redraw(); });
  root.append(h('div.filters',
    chip('Toutes', !filter.subject && !filter.only, () => (filter = { subject: '', q: filter.q, only: '' })),
    subjects.map((s) => chip(s.short, filter.subject === s.id, () => (filter.subject = filter.subject === s.id ? '' : s.id))),
    chip('Critiques', filter.only === 'crit', () => (filter.only = filter.only === 'crit' ? '' : 'crit')),
    chip(`À réécrire (${cards.filter((c) => isLeech(c) || isVague(c)).length})`, filter.only === 'leech', () => (filter.only = filter.only === 'leech' ? '' : 'leech')),
    search));

  const q = filter.q.toLowerCase();
  const list = cards.filter((c) =>
    (!filter.subject || c.subject === filter.subject) &&
    (filter.only !== 'crit' || c.gravity === 'Critique') &&
    (filter.only !== 'leech' || isLeech(c) || isVague(c)) &&
    (!q || [c.title, c.description, c.remedy, c.chapter, c.formula].join(' ').toLowerCase().includes(q)))
    .sort((a, b) => (a.nextReview || '').localeCompare(b.nextReview || '') || b.createdAt.localeCompare(a.createdAt));

  if (filter.only === 'leech' && list.length) {
    root.append(h('p.note', 'Ces fiches reviennent sans rentrer. Une bonne fiche pose une question précise au recto et donne la réponse complète au verso — « Apprendre » ou « voir la photo de l’iPad » ne s’apprend pas. Ouvre-les une par une et réécris-les.'));
  }
  if (!cards.length) root.append(empty('Chaque erreur de DS, de khôlle ou de TD mérite une fiche : la question au recto, la méthode au verso. Le site te les représente juste avant que tu les oublies.'));
  else if (!list.length) root.append(empty('Aucune fiche ne correspond.'));

  root.append(h('div.cards-grid', list.map((c) => h('article.mcard', { onclick: (e) => !e.target.closest('img') && editMistake(c), tabindex: 0, onkeydown: (e) => e.key === 'Enter' && editMistake(c) },
    h('header', subjTag(c.subject), c.gravity === 'Critique' ? h('span.pill.bad', 'Critique') : null,
      isLeech(c) ? h('span.pill.mid', `ratée ${c.lapses}×`) : null, isVague(c) ? h('span.pill.mid', 'réponse vague') : null,
      h('span.grow'), h('span.lvl', { title: levelLabel(c.srsLevel) }, `N${c.srsLevel || 0}`)),
    h('h3', c.title || 'Sans titre'),
    rich(c.description, 'rich.clamp'),
    h('footer', isDue(c) ? h('span.due', diffDays(today(), c.nextReview) > 0 ? `en retard de ${diffDays(today(), c.nextReview)} j` : 'à revoir aujourd’hui') : h('span.muted', 'revue ' + fmtRel(c.nextReview)),
      (c.hasFront || c.hasBack) ? h('span.muted', '📷') : null)))));
}

function nextDueText(cards) {
  if (!cards.length) return 'Ajoute ta première fiche.';
  const nx = cards.map((c) => c.nextReview).sort()[0];
  return `Tout est à jour. Prochaine fiche ${fmtRel(nx)} (${fmtDate(nx)}).`;
}

// ---------- Séance de révision ----------
function review(root) {
  if (!session) {
    const q = dueQueue(state.mistakes).slice(0, state.settings.reviewLimit);
    session = { queue: q, index: 0, revealed: false, stats: { again: 0, hard: 0, good: 0, easy: 0 }, total: q.length };
  }
  const s = session;
  const card = s.queue[s.index];
  document.onkeydown = null;

  if (!card) {
    const left = dueQueue(state.mistakes).length;
    const ok = s.stats.good + s.stats.easy;
    root.append(h('section.card.center',
      h('h1', s.total ? 'Séance terminée' : 'Rien à revoir'),
      s.total ? h('p', `${ok} sue${ok > 1 ? 's' : ''} sur ${s.total} · ${s.stats.hard} hésitante${s.stats.hard > 1 ? 's' : ''} · ${s.stats.again} ratée${s.stats.again > 1 ? 's' : ''}`) : h('p.muted', nextDueText(state.mistakes)),
      left ? h('p.muted', `Il reste ${left} fiche${left > 1 ? 's' : ''} en attente.`) : null,
      h('div.row.center',
        left ? h('button.btn.primary', { onclick: () => { session = null; save({ touch: false }); } }, 'Continuer') : null,
        h('a.btn', { href: '#/erreurs' }, 'Retour au carnet'), h('a.btn', { href: '#/' }, 'Accueil'))));
    return;
  }

  const rate = (rating) => {
    const r = next(card, rating);
    Object.assign(card, { srsLevel: r.srsLevel, lapses: r.lapses, reps: r.reps, lastReview: r.lastReview, nextReview: r.nextReview });
    s.stats[rating]++;
    s.index++;
    s.revealed = false;
    save();
  };
  const reveal = () => { s.revealed = true; save({ touch: false }); };

  root.append(h('header.page-head',
    h('a.btn', { href: '#/erreurs', onclick: () => (session = null) }, icon('left', 16), 'Quitter'),
    h('span.muted', `${s.index + 1} / ${s.queue.length}`),
    h('button.btn', { onclick: () => editMistake(card) }, icon('edit', 16), 'Corriger la fiche')),
  h('div.progress.thin', h('i', { style: { width: (s.index / s.queue.length) * 100 + '%' } })));

  const face = h('section.flash',
    h('header', subjTag(card.subject), card.gravity === 'Critique' ? h('span.pill.bad', 'Critique') : null,
      card.lapses ? h('span.muted', `ratée ${card.lapses}×`) : null, card.chapter ? h('span.muted', card.chapter) : null),
    h('h2', card.title),
    rich(card.description),
    formula(card.formula),
    photoEl(card, 'Front'));
  if (s.revealed) {
    face.append(h('div.answer', h('span.eyebrow', 'Réponse'),
      card.remedy ? rich(card.remedy) : (card.hasBack ? null : h('p.muted', 'Cette fiche n’a pas de réponse : complète-la avec « Corriger la fiche ».')),
      photoEl(card, 'Back')));
  }
  root.append(face);

  if (!s.revealed) {
    root.append(h('div.rate', h('button.btn.primary.large', { onclick: reveal }, 'Voir la réponse'), h('small.muted.kbd-hint', 'Réponds de tête, ou sur brouillon, avant de retourner · Espace')));
  } else {
    root.append(h('div.rate', RATINGS.map((r) =>
      h('button.btn.large.rate-' + r.cls, { onclick: () => rate(r.id) }, h('b', r.label), h('small', 'revoir dans ' + fmtDays(next(card, r.id).days))))));
  }
  document.onkeydown = (e) => {
    if (e.target.closest('input, textarea, select, dialog')) return;
    if (!s.revealed && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); reveal(); }
    else if (s.revealed) { const r = RATINGS.find((x) => x.key === e.key); if (r) rate(r.id); }
  };
}
const fmtDays = (d) => (d === 1 ? '1 jour' : d < 30 ? `${d} jours` : `${Math.round(d / 30)} mois`);
