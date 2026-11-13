import { state, save, streak } from '../store.js';
import { h, icon, today, fmtDate, fmtRel, fmtNum, fmtMin, diffDays, weekStart, subj, subjTag, uid, formModal, gradeClass, schoolYearStart, addDays } from '../util.js';
import { countdown, graded, upcoming, bySubject, avg, insights, openTasks, focusMinutes, weighted, dsAverages, coursKnown } from '../stats.js';
import { dueQueue } from '../srs.js';
import { lineChart, activityGrid } from '../charts.js';
import { vacanceOf, VACANCES } from '../data.js';
import { editTask } from '../forms.js';

export function dashboard(root) {
  const t = today();
  const cd = countdown();
  const hour = new Date().getHours();
  const name = state.settings.name ? ` ${state.settings.name}` : '';

  // ----- En-tête : compte à rebours -----
  const vac = vacanceOf(t);
  const nextVac = VACANCES.find((v) => v.start > t);
  root.append(h('section.hero',
    h('div',
      h('p.eyebrow', `${state.settings.classe} · ${state.settings.lycee} · ${fmtDate(t, { year: true })}`),
      h('h1', `${hour < 18 ? 'Bonjour' : 'Bonsoir'}${name}.`),
      h('p.muted', vac ? `Vacances de ${vac.name} : reprise ${fmtDate(vac.end)}.`
        : nextVac ? `Vacances de ${nextVac.name} ${fmtRel(nextVac.start)}.` : 'Dernière ligne droite.')),
    cd ? h('a.countdown', { href: '#/concours' },
      h('span.big', cd.days >= 0 ? `J−${cd.days}` : 'Passé'),
      h('span', state.settings.concoursName),
      h('span.muted', `${fmtDate(state.settings.concoursDate, { year: true })} · ${cd.work} jours de cours, ${cd.holiday} de vacances`),
      h('span.progress', h('i', { style: { width: cd.progress * 100 + '%' } })))
      : h('a.countdown', { href: '#/reglages' }, h('span', 'Renseigne la date de ton concours'), h('span.muted', 'Réglages →'))));

  // ----- Plan du jour -----
  const due = dueQueue(state.mistakes);
  const tasks = openTasks();
  const late = tasks.filter((x) => x.dueDate < t);
  const todayTasks = tasks.filter((x) => x.dueDate === t);
  const nextK = upcoming(state.kholles)[0];
  const nextDS = upcoming(state.ds)[0];
  const lastWith = nextK && state.kholles.filter((k) => k.examiner === nextK.examiner && k.grade != null).sort((a, b) => b.date.localeCompare(a.date))[0];

  const step = (ic, title, text, href, cls = '') => h('a.step' + cls, { href }, h('span.step-ic', icon(ic)), h('span', h('b', title), h('small', text)), icon('right', 16));
  const ck = coursKnown();
  const plan = h('section.card', h('h2', 'Aujourd’hui'));
  const steps = h('div.steps');
  if (due.length) {
    const n = Math.min(due.length, state.settings.reviewLimit);
    steps.append(step('cards', `Revoir ${n} fiche${n > 1 ? 's' : ''} d’erreur`, due.length > n ? `${due.length} en attente — ${n} aujourd’hui, environ ${Math.ceil(n * 0.75)} min` : `Environ ${Math.max(1, Math.ceil(n * 0.75))} min`, '#/erreurs/revision', '.accent'));
  }
  const lastI = state.interros.at(-1)?.date;
  if (lastI !== t) steps.append(step('book', 'Interro de cours : 10 points', lastI ? `Dernière ${fmtRel(lastI)} · ${ck.ok} points sus sur ${ck.total}` : `Récite ton cours comme en khôlle · ${ck.ok} points sus sur ${ck.total}`, '#/programme/interro'));
  if (nextK) {
    const n = diffDays(nextK.date, t);
    steps.append(step('mic', `Khôlle de ${subj(nextK.subject).short.toLowerCase()} ${fmtRel(nextK.date)}${nextK.time ? ' à ' + nextK.time.replace(':', ' h ') : ''}`,
      [nextK.examiner, lastWith && `dernière note avec ce colleur : ${fmtNum(lastWith.grade)}`, nextK.topic].filter(Boolean).join(' · ') || 'Prépare les questions de cours', '#/notes/kholles', n <= 1 ? '.warn' : ''));
  }
  if (nextDS) {
    const n = diffDays(nextDS.date, t);
    const same = upcoming(state.ds).filter((x) => x.date === nextDS.date);
    steps.append(step('flag', `DS ${same.map((x) => subj(x.subject).short.toLowerCase()).join(' + ')} ${fmtRel(nextDS.date)}`,
      [fmtDate(nextDS.date), same.map((x) => x.topic).filter(Boolean).join(', '), nextDS.notes].filter(Boolean).join(' · '), '#/notes/ds', n <= 3 ? '.warn' : ''));
  }
  if (late.length) steps.append(step('warn', `${late.length} tâche${late.length > 1 ? 's' : ''} en retard`, late.slice(0, 2).map((x) => x.title).join(' · '), '#/taches', '.warn'));
  if (todayTasks.length) steps.append(step('check', `${todayTasks.length} tâche${todayTasks.length > 1 ? 's' : ''} pour aujourd’hui`, `${fmtMin(todayTasks.reduce((a, x) => a + (x.estMin || 0), 0))} prévues · ${todayTasks.slice(0, 2).map((x) => x.title).join(' · ')}`, '#/taches'));
  if (!steps.children.length) steps.append(h('p.muted', 'Rien d’urgent. Profites-en pour avancer un chapitre du programme.'));
  plan.append(steps, h('div.row',
    h('button.btn', { onclick: () => editTask() }, icon('plus', 16), 'Tâche'),
    h('a.btn', { href: '#/focus' }, icon('timer', 16), 'Lancer le chrono')));
  root.append(plan);

  // ----- Chiffres clés -----
  const from = schoolYearStart();
  const ds = graded(state.ds);
  const kh = graded(state.kholles);
  const w = weighted(dsAverages());
  const wkMin = focusMinutes(weekStart(t));
  const tile = (label, value, sub, cls = '') => h('div.tile', h('span.tile-label', label), h('span.tile-value' + cls, value), h('span.tile-sub', sub));
  root.append(h('section.tiles',
    tile('Moyenne DS', fmtNum(avg(ds)), `${ds.length} devoirs depuis septembre`, '.' + gradeClass(avg(ds))),
    tile('Pondérée concours', fmtNum(w), 'selon tes coefficients', '.' + gradeClass(w)),
    tile('Moyenne khôlles', fmtNum(avg(kh)), `${kh.length} khôlles notées`, '.' + gradeClass(avg(kh))),
    tile('Cours su', `${Math.round((ck.ok / ck.total) * 100)} %`, `${ck.ok} points sur ${ck.total}`, ''),
    tile('Série', `${streak()} j`, 'jours d’affilée', ''),
    tile('Chrono cette semaine', wkMin ? fmtMin(wkMin) : '0 min', 'temps de travail mesuré')));

  // ----- Diagnostic -----
  const ins = insights();
  if (ins.length) {
    root.append(h('section.card', h('h2', 'Ce que disent tes données'),
      h('div.insights', ins.slice(0, 6).map((i) => h('a.insight.' + i.level, { href: i.href },
        h('span.badge.' + i.level, i.level === 'good' ? '↗' : i.level === 'bad' ? '!' : '→'),
        h('span', h('b', i.title), h('small', i.text)))))));
  }

  // ----- Notes -----
  const series = bySubject(ds).map(([s, l]) => ({ name: s, short: subj(s).short, color: subj(s).color, points: l.map((x) => ({ date: x.date, y: x.grade, label: x.topic })) }));
  root.append(h('section.card', h('header.card-head', h('h2', 'DS depuis septembre'), h('a.link', { href: '#/notes/ds' }, 'Toutes les notes →')), lineChart(series)));

  // ----- Objectifs de la semaine -----
  const ws = weekStart(t);
  if (state.goalsWeek !== ws) {
    // Nouvelle semaine : on repart de zéro sur les compteurs, les objectifs restent.
    state.goalsWeek = ws;
    state.goals.forEach((g) => (g.current = 0));
    save({ touch: false });
    return;
  }
  const goals = h('section.card', h('header.card-head', h('h2', 'Objectifs de la semaine'),
    h('button.btn.small', { onclick: () => editGoal() }, icon('plus', 14), 'Objectif')));
  if (!state.goals.length) goals.append(h('p.muted', 'Deux ou trois objectifs chiffrés, pas plus : « 3 annales de physique », « 40 fiches revues ».'));
  for (const g of state.goals) {
    const done = g.current >= g.target;
    goals.append(h('div.goal' + (done ? '.done' : ''),
      h('button.goal-title', { onclick: () => editGoal(g) }, g.title),
      h('span.progress', h('i', { style: { width: Math.min(100, (g.current / g.target) * 100) + '%' } })),
      h('span.goal-count', `${fmtNum(g.current)} / ${fmtNum(g.target)} ${g.unit}`),
      h('button.icon-btn', { 'aria-label': 'Retirer un', onclick: () => { g.current = Math.max(0, g.current - 1); save(); } }, '−'),
      h('button.icon-btn', { 'aria-label': 'Ajouter un', onclick: () => { g.current++; save(); } }, '+')));
  }
  root.append(goals);

  // ----- Régularité -----
  const days30 = Object.keys(state.activity).filter((d) => d > addDays(t, -30) && d >= from).length;
  root.append(h('section.card', h('header.card-head', h('h2', 'Régularité'), h('span.muted', `${days30} jours actifs sur les 30 derniers`)), activityGrid(state.activity)));
}

function editGoal(g) {
  formModal(g ? 'Modifier l’objectif' : 'Nouvel objectif de la semaine', [
    { name: 'title', label: 'Objectif', value: g?.title, required: true, placeholder: 'Annales de physique' },
    { name: 'target', label: 'Cible', type: 'number', value: g?.target ?? 3, min: 1, half: true },
    { name: 'unit', label: 'Unité', value: g?.unit, placeholder: 'sujets', half: true },
  ], (v) => {
    if (g) Object.assign(g, v);
    else state.goals.push({ id: uid('wg'), current: 0, ...v });
    save();
  }, { onDelete: g && (() => { state.goals = state.goals.filter((x) => x !== g); save(); }) });
}
