import { state, save } from '../store.js';
import { h, icon, today, addDays, fmtDate, fmtMin, weekStart, subjTag, uid, SUBJECTS, empty, toast } from '../util.js';
import { editTask } from '../forms.js';
import { TASK_TYPES } from '../data.js';

let showDone = false;

export function taches(root) {
  const t = today();
  const open = state.tasks.filter((x) => !x.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate) || ['Haute', 'Moyenne', 'Basse'].indexOf(a.priority) - ['Haute', 'Moyenne', 'Basse'].indexOf(b.priority));
  const endWeek = addDays(weekStart(t), 6);

  root.append(h('header.page-head', h('h1', 'Tâches'),
    h('button.btn.primary', { onclick: () => editTask() }, icon('plus', 16), 'Nouvelle tâche')));

  // ----- Ajout rapide -----
  const title = h('input', { placeholder: 'Ajout rapide : « TD 8 exos 3, 5, 12 »', 'aria-label': 'Intitulé de la tâche', required: true });
  const sub = h('select', { 'aria-label': 'Matière' }, SUBJECTS.map((s) => h('option', { value: s.id }, s.short)));
  const type = h('select', { 'aria-label': 'Type' }, TASK_TYPES.map((x) => h('option', x)));
  const when = h('select', { 'aria-label': 'Échéance' }, [['0', 'Aujourd’hui'], ['1', 'Demain'], ['2', 'Après-demain'], ['7', 'Dans 7 jours']].map(([v, l]) => h('option', { value: v, selected: v === '1' }, l)));
  const dur = h('select', { 'aria-label': 'Durée' }, [30, 60, 90, 120, 180, 240].map((m) => h('option', { value: m, selected: m === 60 }, fmtMin(m))));
  root.append(h('form.quick', { onsubmit: (e) => {
    e.preventDefault();
    state.tasks.push({ id: uid('t'), title: title.value.trim(), subject: sub.value, type: type.value, dueDate: addDays(t, +when.value), estMin: +dur.value, priority: 'Moyenne', done: false, doneAt: '' });
    save();
  } }, title, sub, type, when, dur, h('button.btn.primary', { type: 'submit' }, 'Ajouter')));

  // ----- Charge des 7 prochains jours -----
  const load = h('div.load');
  for (let i = 0; i < 7; i++) {
    const d = addDays(t, i);
    const min = open.filter((x) => x.dueDate === d || (i === 0 && x.dueDate < d)).reduce((a, x) => a + (x.estMin || 0), 0);
    load.append(h('div.load-day' + (min > 240 ? '.heavy' : ''), { title: `${fmtDate(d)} : ${fmtMin(min)}` },
      h('span.load-bar', h('i', { style: { height: Math.min(100, (min / 300) * 100) + '%' } })),
      h('small', i === 0 ? 'auj.' : fmtDate(d).slice(0, 3)), h('b', min ? fmtMin(min) : '·')));
  }
  root.append(h('section.card', h('header.card-head', h('h2', 'Charge prévue'), h('span.muted', 'Au-delà de 4 h de travail personnel par soir, déplace une tâche')), load));

  // ----- Listes -----
  const groups = [
    ['En retard', open.filter((x) => x.dueDate < t), 'bad'],
    ['Aujourd’hui', open.filter((x) => x.dueDate === t)],
    ['Cette semaine', open.filter((x) => x.dueDate > t && x.dueDate <= endWeek)],
    ['Plus tard', open.filter((x) => x.dueDate > endWeek)],
  ];
  if (!open.length) root.append(empty('Aucune tâche en cours. Note ici tes TD, DM et révisions avec une durée : la charge de la semaine se calcule toute seule.'));
  for (const [name, list, cls] of groups) {
    if (!list.length) continue;
    root.append(h('section.card', h('header.card-head', h('h2' + (cls ? '.' + cls : ''), name),
      h('span.muted', `${list.length} · ${fmtMin(list.reduce((a, x) => a + (x.estMin || 0), 0))}`)), list.map(row)));
  }

  const done = state.tasks.filter((x) => x.done).sort((a, b) => (b.doneAt || b.dueDate).localeCompare(a.doneAt || a.dueDate));
  if (done.length) {
    const wk = done.filter((x) => (x.doneAt || '') >= weekStart(t));
    root.append(h('section.card', h('header.card-head', h('h2', 'Terminées'),
      h('span.muted', `${done.length} au total · ${wk.length} cette semaine (${fmtMin(wk.reduce((a, x) => a + (x.estMin || 0), 0))})`),
      h('button.btn.small', { onclick: () => { showDone = !showDone; save({ touch: false }); } }, showDone ? 'Masquer' : 'Afficher')),
    showDone ? done.slice(0, 40).map(row) : null));
  }
}

function row(task) {
  const t = today();
  const toggle = () => {
    task.done = !task.done;
    task.doneAt = task.done ? t : '';
    save();
    if (task.done) toast('Fait ✓');
  };
  return h('div.item' + (task.done ? '.done' : ''),
    h('input.check', { type: 'checkbox', checked: task.done, onchange: toggle, 'aria-label': 'Terminer : ' + task.title }),
    h('button.item-main', { onclick: () => editTask(task) },
      h('b', task.title),
      h('small', subjTag(task.subject), ` ${task.type} · ${fmtMin(task.estMin || 0)} · ${task.done ? 'fait ' + fmtDate(task.doneAt || task.dueDate) : fmtDate(task.dueDate)}`)),
    task.priority === 'Haute' && !task.done ? h('span.pill.bad', 'Prioritaire') : null,
    !task.done && task.dueDate <= t ? h('button.btn.small', { title: 'Reporter à demain', onclick: () => { task.dueDate = addDays(t, 1); save(); } }, '→ demain') : null);
}
