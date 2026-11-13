import { state, save } from '../store.js';
import { h, today, fmtDate, fmtNum, diffDays, subj, gradeClass, addDays, weekStart } from '../util.js';
import { countdown, dsAverages, weighted, coefs, upcoming, graded, avg } from '../stats.js';
import { COEF_PRESETS, COEF_SUBJECTS, VACANCES } from '../data.js';
import { hbars } from '../charts.js';

let sim = null; // notes simulées par matière

export function concours(root, _sub, rerender) {
  const cd = countdown();
  const t = today();
  root.append(h('header.page-head', h('h1', 'Concours')));

  if (!cd) {
    root.append(h('section.card', h('p', 'Indique la date de tes écrits dans les réglages pour afficher le compte à rebours.'), h('a.btn.primary', { href: '#/reglages' }, 'Réglages')));
  } else {
    const dsLeft = upcoming(state.ds).filter((x) => x.date <= state.settings.concoursDate).length;
    const khLeft = upcoming(state.kholles).filter((x) => x.date <= state.settings.concoursDate).length;
    root.append(h('section.card.hero-count',
      h('span.big', cd.days >= 0 ? `J−${cd.days}` : 'Passé'),
      h('div', h('b', state.settings.concoursName), h('p.muted', fmtDate(state.settings.concoursDate, { year: true }))),
      h('div.tiles.compact',
        h('div.tile', h('span.tile-value', String(cd.weeks)), h('span.tile-sub', 'semaines')),
        h('div.tile', h('span.tile-value', String(cd.work)), h('span.tile-sub', 'jours hors vacances')),
        h('div.tile', h('span.tile-value', String(cd.holiday)), h('span.tile-sub', 'jours de vacances')),
        h('div.tile', h('span.tile-value', String(dsLeft)), h('span.tile-sub', 'DS restants')),
        h('div.tile', h('span.tile-value', String(khLeft)), h('span.tile-sub', 'khôlles restantes')))));

    // ----- Frise jusqu'au concours -----
    const end = state.settings.concoursDate;
    const span = Math.max(1, diffDays(end, t));
    const pos = (d) => Math.min(100, Math.max(0, (diffDays(d, t) / span) * 100));
    const bar = h('div.timeline');
    for (const v of VACANCES) {
      if (v.end <= t || v.start >= end) continue;
      bar.append(h('span.tl-vac', { style: { left: pos(v.start) + '%', width: pos(v.end) - pos(v.start) + '%' }, title: `Vacances de ${v.name} : ${fmtDate(v.start)} → ${fmtDate(v.end)}` }, v.name));
    }
    for (const x of upcoming(state.ds)) if (x.date <= end) bar.append(h('i.tl-ds', { style: { left: pos(x.date) + '%', background: subj(x.subject).color }, title: `DS ${x.subject} ${x.topic} — ${fmtDate(x.date)}` }));
    const months = h('div.tl-months');
    for (let d = new Date(t.slice(0, 7) + '-01T00:00:00'); ; ) {
      d.setMonth(d.getMonth() + 1);
      const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      if (s >= end) break;
      months.append(h('span', { style: { left: pos(s) + '%' } }, d.toLocaleDateString('fr-FR', { month: 'short' })));
    }
    root.append(h('section.card', h('header.card-head', h('h2', 'D’ici les écrits'), h('span.muted', 'Zones grisées : vacances · traits : DS')), bar, months,
      h('p.muted', vacPlan(t, end))));
  }

  // ----- Simulateur -----
  const c = { ...coefs() };
  const base = dsAverages();
  sim ||= Object.fromEntries(COEF_SUBJECTS.map((s) => [s, base[s] != null ? Math.round(base[s] * 2) / 2 : null]));
  const result = weighted(sim, c);
  const real = weighted(base, c);
  const barre = state.settings.barre ?? 10;

  const table = h('div.sim');
  for (const s of COEF_SUBJECTS) {
    const val = sim[s];
    const out = h('b.' + gradeClass(val), val == null ? '—' : fmtNum(val));
    table.append(h('div.sim-row',
      h('span.sim-name', h('i.dot', { style: { background: subj(s).color } }), subj(s).short),
      h('label', h('small.muted', 'coef.'), h('input.coef', { type: 'number', min: 0, max: 30, step: 1, value: c[s] ?? 0, 'aria-label': `Coefficient ${s}`,
        onchange: (e) => { state.settings.coefs = { ...c, [s]: Math.max(0, +e.target.value || 0) }; save({ touch: false }); } })),
      h('input', { type: 'range', min: 0, max: 20, step: 0.5, value: val ?? 10, 'aria-label': `Note visée en ${s}`,
        oninput: (e) => { sim[s] = +e.target.value; out.textContent = fmtNum(sim[s]); out.className = gradeClass(sim[s]); },
        onchange: rerender }),
      out,
      h('small.muted', base[s] != null ? `DS : ${fmtNum(base[s])}` : 'pas de DS')));
  }
  const need = result != null ? barre - result : null;
  root.append(h('section.card',
    h('header.card-head', h('h2', 'Simulateur d’écrits'),
      h('select', { 'aria-label': 'Jeu de coefficients', onchange: (e) => { if (e.target.value) { state.settings.coefs = { ...COEF_PRESETS[e.target.value] }; save({ touch: false }); } } },
        h('option', { value: '' }, 'Coefficients…'), Object.keys(COEF_PRESETS).map((k) => h('option', k)))),
    h('p.muted', 'Déplace les curseurs pour voir ce que rapporte un point gagné dans chaque matière. Les coefficients fournis sont un ordre de grandeur : remplace-les par ceux de la notice du concours que tu vises.'),
    table,
    h('div.sim-result',
      h('div', h('span.tile-label', 'Moyenne simulée'), h('span.big.' + gradeClass(result), fmtNum(result, 2))),
      h('div', h('span.tile-label', 'Avec tes moyennes de DS'), h('span.big.muted', fmtNum(real, 2))),
      h('label', h('span.tile-label', 'Barre visée'), h('input.coef', { type: 'number', min: 0, max: 20, step: 0.1, value: barre, onchange: (e) => { state.settings.barre = +e.target.value || 0; save({ touch: false }); } })),
      need != null ? h('p.' + (need <= 0 ? 'good' : 'bad'), need <= 0 ? `Au-dessus de la barre de ${fmtNum(-need, 2)} pt.` : `Il manque ${fmtNum(need, 2)} pt de moyenne.`) : null),
    h('div.row', h('button.btn.small', { onclick: () => { sim = null; rerender(); } }, 'Revenir à mes moyennes'))));

  // ----- Où gagner des points -----
  const totalCoef = COEF_SUBJECTS.reduce((a, s) => a + (c[s] || 0), 0);
  if (totalCoef && Object.keys(base).length) {
    const rows = COEF_SUBJECTS.filter((s) => c[s] && base[s] != null)
      .map((s) => ({ label: subj(s).short, color: subj(s).color, value: (c[s] / totalCoef), gap: Math.max(0, 12 - base[s]), text: `+${fmtNum((c[s] / totalCoef), 2)} pt de moyenne par point gagné` }))
      .sort((a, b) => b.value * (1 + b.gap) - a.value * (1 + a.gap));
    root.append(h('section.card', h('header.card-head', h('h2', 'Où un point rapporte le plus'), h('span.muted', 'Classé par coefficient et marge de progression')), hbars(rows, { max: Math.max(...rows.map((r) => r.value)) })));
  }
}

function vacPlan(t, end) {
  const left = VACANCES.filter((v) => v.end > t && v.start < end);
  if (!left.length) return 'Plus de vacances avant les écrits : tout se joue sur les soirées et les week-ends.';
  const days = left.reduce((a, v) => a + diffDays(v.end, v.start > t ? v.start : t), 0);
  return `${left.length} période${left.length > 1 ? 's' : ''} de vacances d’ici là (${left.map((v) => v.name).join(', ')}), soit ${days} jours : c’est là que se font les annales et la reprise de la sup.`;
}
