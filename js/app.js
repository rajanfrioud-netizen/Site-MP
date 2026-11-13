import { state, load, save, subscribe } from './store.js';
import { h, $, icon, formModal } from './util.js';
import { dueQueue } from './srs.js';
import { openTasks } from './stats.js';
import { timer, onTick, remainingMs, elapsedMs, clock } from './timer.js';
import { dashboard } from './views/dashboard.js';
import { taches } from './views/taches.js';
import { erreurs } from './views/erreurs.js';
import { notes } from './views/notes.js';
import { agenda } from './views/agenda.js';
import { programme } from './views/programme.js';
import { annales } from './views/annales.js';
import { focus } from './views/focus.js';
import { concours } from './views/concours.js';
import { reglages, applyTheme, importPicker } from './views/reglages.js';

const ROUTES = [
  { path: '', label: 'Aujourd’hui', icon: 'home', view: dashboard, main: true },
  { path: 'taches', label: 'Tâches', icon: 'check', view: taches, main: true },
  { path: 'erreurs', label: 'Erreurs', icon: 'cards', view: erreurs, main: true },
  { path: 'notes', label: 'Notes', icon: 'chart', view: notes, main: true },
  { path: 'agenda', label: 'Agenda', icon: 'cal', view: agenda },
  { path: 'programme', label: 'Programme', icon: 'book', view: programme },
  { path: 'annales', label: 'Annales', icon: 'target', view: annales },
  { path: 'focus', label: 'Chrono', icon: 'timer', view: focus },
  { path: 'concours', label: 'Concours', icon: 'flag', view: concours },
  { path: 'reglages', label: 'Réglages', icon: 'cog', view: reglages },
  { path: 'plus', label: 'Plus', icon: 'more', view: plus, mobileOnly: true, main: true },
];

function plus(root) {
  root.append(h('header.page-head', h('h1', 'Plus')),
    h('div.menu', ROUTES.filter((r) => !r.main).map((r) => h('a.menu-item', { href: '#/' + r.path }, icon(r.icon), r.label, icon('right', 16)))));
}

const current = () => {
  const [path = '', sub] = location.hash.replace(/^#\/?/, '').split('/');
  return { route: ROUTES.find((r) => r.path === path) || ROUTES[0], sub };
};

function badge(path) {
  if (path === 'erreurs') return dueQueue(state.mistakes).length;
  if (path === 'taches') return openTasks().filter((t) => t.dueDate <= new Date().toLocaleDateString('sv')).length;
  return 0;
}

function nav() {
  const { route } = current();
  const link = (r) => {
    const n = badge(r.path);
    const active = r === route || (r.path === 'plus' && !route.main);
    return h('a' + (active ? '.on' : ''), { href: '#/' + r.path, 'aria-current': active ? 'page' : null }, icon(r.icon), h('span', r.label), n ? h('b.count', String(n)) : null);
  };
  $('#side').replaceChildren(
    h('a.brand', { href: '#/' }, h('span.logo', 'MP'), h('span', h('b', 'Cockpit'), h('small', 'Michelet'))),
    h('nav', { 'aria-label': 'Navigation principale' }, ROUTES.filter((r) => !r.mobileOnly).map(link)),
    h('a.timer-chip', { id: 'timer-chip', href: '#/focus', hidden: true }));
  $('#tabs').replaceChildren(...ROUTES.filter((r) => r.main).map(link));
  drawChip();
}

function drawChip() {
  const chip = $('#timer-chip');
  if (!chip) return;
  chip.hidden = !timer;
  if (timer) chip.textContent = `${timer.phase === 'rest' ? 'Pause' : timer.subject} · ${clock(remainingMs() ?? elapsedMs())}`;
}

let lastHash;
function render() {
  if (!state.settings.onboarded) return onboarding();
  const { route, sub } = current();
  const main = $('#main');
  const keepScroll = lastHash === location.hash ? window.scrollY : 0;
  lastHash = location.hash;
  document.onkeydown = null;
  if (!timer) document.title = `${route.label} · Cockpit MP`;
  const root = h('div.page');
  try {
    route.view(root, sub, render);
  } catch (e) {
    console.error(e);
    root.append(h('section.card', h('h2', 'Une erreur est survenue'), h('pre', String(e.stack || e))));
  }
  main.replaceChildren(root);
  nav();
  window.scrollTo(0, keepScroll);
}

function onboarding() {
  $('#side').replaceChildren();
  $('#tabs').replaceChildren();
  const s = state.settings;
  $('#main').replaceChildren(h('div.page.onboard',
    h('span.logo.xl', 'MP'),
    h('h1', 'Cockpit MP'),
    h('p.lead', 'Ton tableau de bord de prépa : DS, khôlles, carnet d’erreurs à répétition espacée, tâches, programme et compte à rebours jusqu’aux écrits.'),
    h('div.row.center',
      h('button.btn.primary.large', { onclick: () => importPicker(render) }, icon('upload', 18), 'Importer ma sauvegarde'),
      h('button.btn.large', { onclick: () => formModal('Bienvenue', [
        { name: 'name', label: 'Prénom', required: true },
        { name: 'concoursName', label: 'Concours visé', value: s.concoursName },
        { name: 'concoursDate', label: 'Premier jour des écrits', type: 'date', hint: 'Tu pourras le changer dans les réglages' },
      ], (v) => { Object.assign(s, v, { onboarded: true }); save(); }, { submitLabel: 'Commencer' }) }, 'Partir de zéro')),
    h('p.muted', 'L’import reprend les fichiers « MPSI Cockpit » : notes, khôlles, fiches et photos, tâches. Tes données restent sur cet appareil.')));
}

load();
applyTheme();
subscribe(render);
onTick(drawChip);
window.addEventListener('hashchange', render);
render();

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
