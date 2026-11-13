import { state, save } from '../store.js';
import { h, icon, today, addDays, weekStart, fmtDate, fmtMin, subj, subjTag, SUBJECTS, formModal, uid } from '../util.js';
import { timer, MODES, start, toggle, stop, remainingMs, elapsedMs, clock, onTick, mode } from '../timer.js';
import { stackedBars, hbars, legend } from '../charts.js';

let choice = { mode: 'p50', subject: 'Mathématiques' };
let off;

export function focus(root, _sub, rerender) {
  off?.();
  root.append(h('header.page-head', h('h1', 'Chrono'),
    h('button.btn', { onclick: addManual }, icon('plus', 16), 'Séance passée')));

  const panel = h('section.card.timer');
  if (!timer) {
    panel.append(
      h('div.seg', MODES.map((m) => h('button' + (choice.mode === m.id ? '.on' : ''), { onclick: () => { choice.mode = m.id; rerender(); } }, m.label))),
      h('div.seg.subjects', SUBJECTS.map((s) => h('button' + (choice.subject === s.id ? '.on' : ''), { style: { '--c': s.color }, onclick: () => { choice.subject = s.id; rerender(); } }, h('i.dot'), s.short))),
      h('div.clock', clock((MODES.find((m) => m.id === choice.mode).work || 0) * 6e4)),
      h('button.btn.primary.large', { onclick: () => { start(choice.mode, choice.subject); rerender(); } }, icon('play', 18), 'Démarrer'),
      h('p.muted', choice.mode.startsWith('e') ? 'Conditions de concours : sujet imprimé, téléphone dans une autre pièce, aucune pause.' : 'Une seule tâche par bloc. Le temps est enregistré automatiquement à la fin.'));
  } else {
    const face = h('div.clock');
    const sub = h('p.muted');
    const bar = h('i');
    const draw = () => {
      if (!timer) return rerender();
      const rem = remainingMs();
      face.textContent = clock(rem ?? elapsedMs());
      face.classList.toggle('rest', timer.phase === 'rest');
      const m = mode();
      const tot = (timer.phase === 'rest' ? m.rest : m.work) * 6e4;
      bar.style.width = (tot ? Math.min(1, elapsedMs() / tot) * 100 : 0) + '%';
      sub.textContent = timer.phase === 'rest' ? 'Pause — lève-toi, bois, ne touche pas au téléphone.' : timer.running ? `${m.label} · ${timer.subject}` : 'En pause';
      document.title = `${clock(rem ?? elapsedMs())} · Cockpit MP`;
    };
    off = onTick(draw);
    panel.append(h('div', subjTag(timer.subject)), face, h('div.progress.thin', bar), sub,
      h('div.row.center',
        h('button.btn.large', { onclick: () => { toggle(); rerender(); } }, icon(timer.running ? 'pause' : 'play', 18), timer.running ? 'Pause' : 'Reprendre'),
        h('button.btn.large.primary', { onclick: () => { const min = stop(); document.title = 'Cockpit MP'; if (!min) rerender(); } }, icon('stop', 18), 'Terminer et enregistrer'),
        h('button.btn.large', { onclick: () => { if (confirm('Abandonner sans enregistrer ?')) { stop({ log: false }); document.title = 'Cockpit MP'; rerender(); } } }, 'Annuler')));
    draw();
  }
  root.append(panel);

  // ----- Statistiques -----
  const t = today();
  const ws = weekStart(t);
  const weekS = state.sessions.filter((s) => s.date >= ws);
  const used = SUBJECTS.filter((s) => state.sessions.some((x) => x.subject === s.id));
  const sum = (l) => l.reduce((a, s) => a + s.minutes, 0);

  root.append(h('section.tiles',
    h('div.tile', h('span.tile-label', 'Aujourd’hui'), h('span.tile-value', fmtMin(sum(state.sessions.filter((s) => s.date === t)))), h('span.tile-sub', 'chronométré')),
    h('div.tile', h('span.tile-label', 'Cette semaine'), h('span.tile-value', fmtMin(sum(weekS))), h('span.tile-sub', `${weekS.length} séance${weekS.length > 1 ? 's' : ''}`)),
    h('div.tile', h('span.tile-label', 'Total'), h('span.tile-value', fmtMin(sum(state.sessions))), h('span.tile-sub', `${state.sessions.length} séances`))));

  if (state.sessions.length) {
    const cols = [];
    for (let i = 7; i >= 0; i--) {
      const s0 = addDays(ws, -7 * i), s1 = addDays(s0, 6);
      const l = state.sessions.filter((s) => s.date >= s0 && s.date <= s1);
      cols.push({ label: fmtDate(s0, { weekday: false }), title: `Semaine du ${fmtDate(s0, { weekday: false })}`,
        parts: used.map((u) => ({ name: u.short, color: u.color, value: sum(l.filter((s) => s.subject === u.id)) })) });
    }
    root.append(h('section.card', h('h2', 'Temps par semaine'), stackedBars(cols, { fmt: fmtMin }), used.length > 1 ? legend(used.map((u) => ({ name: u.short, color: u.color }))) : null));
    if (weekS.length) {
      root.append(h('section.card', h('h2', 'Répartition cette semaine'),
        hbars(used.map((u) => ({ label: u.short, color: u.color, value: sum(weekS.filter((s) => s.subject === u.id)), text: fmtMin(sum(weekS.filter((s) => s.subject === u.id))) })).filter((r) => r.value))));
    }
    root.append(h('section.card', h('h2', 'Dernières séances'),
      [...state.sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map((s) => h('div.item',
        h('span.date', fmtDate(s.date)), subjTag(s.subject), h('span.grow'), h('b', fmtMin(s.minutes)),
        h('button.icon-btn', { 'aria-label': 'Supprimer la séance', onclick: () => { state.sessions = state.sessions.filter((x) => x !== s); save(); } }, icon('trash', 15))))));
  }
}

function addManual() {
  formModal('Ajouter une séance passée', [
    { name: 'subject', label: 'Matière', type: 'select', options: SUBJECTS.map((s) => s.id) },
    { name: 'date', label: 'Date', type: 'date', value: today(), required: true, half: true },
    { name: 'minutes', label: 'Durée (min)', type: 'number', value: 60, min: 1, required: true, half: true },
  ], (v) => { state.sessions.push({ id: uid('s'), ...v }); save(); }, { submitLabel: 'Ajouter' });
}
