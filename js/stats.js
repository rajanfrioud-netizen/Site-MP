// Calculs dérivés des données : moyennes, tendances, diagnostic.
import { state } from './store.js';
import { today, addDays, diffDays, mean, schoolYearStart, weekStart, SUBJECTS, fmtNum } from './util.js';
import { dueQueue, isLeech, isVague } from './srs.js';
import { vacanceOf, COEF_PRESETS } from './data.js';

export const graded = (list, from = schoolYearStart()) => list.filter((x) => x.grade != null && x.date >= from);
export const upcoming = (list, on = today()) =>
  list.filter((x) => x.grade == null && x.date >= on).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
/** Passés mais sans note : à compléter. */
export const ungraded = (list, on = today()) => list.filter((x) => x.grade == null && x.date < on).sort((a, b) => b.date.localeCompare(a.date));

export function bySubject(list) {
  const out = new Map();
  for (const x of list) (out.get(x.subject) || out.set(x.subject, []).get(x.subject)).push(x);
  return [...out.entries()].sort((a, b) => SUBJECTS.findIndex((s) => s.id === a[0]) - SUBJECTS.findIndex((s) => s.id === b[0]));
}
export const avg = (list) => mean(list.map((x) => x.grade));

/** Écart entre la moyenne des 3 dernières notes et celle des précédentes. */
export function trend(list) {
  const g = [...list].sort((a, b) => a.date.localeCompare(b.date)).map((x) => x.grade);
  if (g.length < 4) return null;
  return mean(g.slice(-3)) - mean(g.slice(0, -3));
}

export const coefs = () => state.settings.coefs || Object.values(COEF_PRESETS)[0];

/** Moyenne pondérée par les coefficients de concours, à partir de notes par matière. */
export function weighted(grades, c = coefs()) {
  let sum = 0, w = 0;
  for (const [sub, k] of Object.entries(c)) {
    if (grades[sub] == null || !k) continue;
    sum += grades[sub] * k;
    w += k;
  }
  return w ? sum / w : null;
}
export function dsAverages(from = schoolYearStart()) {
  return Object.fromEntries(bySubject(graded(state.ds, from)).map(([s, l]) => [s, avg(l)]));
}

export function countdown() {
  const d = state.settings.concoursDate;
  if (!d) return null;
  const days = diffDays(d, today());
  let work = 0, holiday = 0;
  for (let i = 0, x = today(); i < Math.max(0, days); i++, x = addDays(x, 1)) vacanceOf(x) ? holiday++ : work++;
  const total = Math.max(1, diffDays(d, state.settings.anneeDebut || schoolYearStart()));
  return { days, weeks: Math.floor(days / 7), work, holiday, progress: Math.min(1, Math.max(0, 1 - days / total)) };
}

export function focusMinutes(from, to = today()) {
  return state.sessions.filter((s) => s.date >= from && s.date <= to).reduce((a, s) => a + s.minutes, 0);
}

export const openTasks = () => state.tasks.filter((t) => !t.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate) || prio(a) - prio(b));
const prio = (t) => ['Haute', 'Moyenne', 'Basse'].indexOf(t.priority);

/** Constats chiffrés et actions conseillées, du plus urgent au moins urgent. */
export function insights() {
  const out = [];
  const t = today();
  const due = dueQueue(state.mistakes);
  const late = due.filter((c) => diffDays(t, c.nextReview) > 14).length;
  if (due.length) {
    out.push({ level: late > 5 ? 'bad' : 'mid', href: '#/erreurs/revision',
      title: `${due.length} fiche${due.length > 1 ? 's' : ''} d’erreur à revoir`,
      text: late ? `dont ${late} en retard de plus de deux semaines. ${state.settings.reviewLimit} par jour suffisent à résorber le stock.` : 'Quelques minutes suffisent.' });
  }
  const leeches = state.mistakes.filter(isLeech);
  const vague = state.mistakes.filter(isVague);
  if (leeches.length >= 3) {
    out.push({ level: 'mid', href: '#/erreurs/a-reecrire', title: `${leeches.length} fiches ratées 4 fois ou plus`,
      text: `Les relire ne suffit plus : réécris-les avec une question précise et une réponse complète${vague.length ? ` (${vague.length} n’ont pas de vraie réponse)` : ''}.` });
  }
  const ds = graded(state.ds);
  const subs = bySubject(ds).map(([s, l]) => ({ s, a: avg(l), n: l.length, tr: trend(l) }));
  const weak = subs.filter((x) => x.n >= 2).sort((a, b) => a.a - b.a)[0];
  if (weak && weak.a < 10) {
    out.push({ level: 'bad', href: '#/notes/ds', title: `${weak.s} : ${fmtNum(weak.a)} de moyenne en DS`,
      text: `C’est ta matière la plus basse cette année sur ${weak.n} devoirs.` });
  }
  for (const x of subs) {
    if (x.tr != null && Math.abs(x.tr) >= 1.5) {
      out.push({ level: x.tr > 0 ? 'good' : 'bad', href: '#/notes/ds', title: `${x.s} : ${x.tr > 0 ? '+' : '−'}${fmtNum(Math.abs(x.tr))} pt sur les 3 derniers DS`,
        text: x.tr > 0 ? 'La tendance est bonne, garde le rythme.' : 'En baisse par rapport aux précédents : reprends les corrigés.' });
    }
  }
  const missed = ds.filter((x) => x.targetGrade != null);
  if (missed.length >= 3) {
    const hit = missed.filter((x) => x.grade >= x.targetGrade).length;
    out.push({ level: hit / missed.length >= 0.5 ? 'good' : 'mid', href: '#/notes/ds', title: `Objectif atteint sur ${hit} DS sur ${missed.length}`,
      text: hit / missed.length >= 0.5 ? 'Tes objectifs sont réalistes ; tu peux viser un cran au-dessus.' : 'Fixe un objectif par DS, à un ou deux points au-dessus de ta moyenne.' });
  }
  const todo = [...ungraded(state.ds), ...ungraded(state.kholles)];
  if (todo.length) {
    out.push({ level: 'mid', href: ungraded(state.ds).length ? '#/notes/ds' : '#/notes/kholles', title: `${todo.length} note${todo.length > 1 ? 's' : ''} à saisir`,
      text: 'Des DS ou khôlles passés n’ont pas encore de note.' });
  }
  const wk = focusMinutes(weekStart(t));
  if (!wk && state.sessions.length < 10) {
    out.push({ level: 'mid', href: '#/focus', title: 'Aucune séance chronométrée cette semaine',
      text: 'Lance le chrono pendant tes TD : tu verras où part vraiment ton temps.' });
  }
  if (state.lastBackup ? diffDays(t, state.lastBackup) > 14 : state.mistakes.length > 5) {
    out.push({ level: 'mid', href: '#/reglages', title: 'Sauvegarde à faire',
      text: state.lastBackup ? `Dernière exportation il y a ${diffDays(t, state.lastBackup)} jours.` : 'Tes données ne vivent que dans ce navigateur : exporte-les.' });
  }
  return out;
}
