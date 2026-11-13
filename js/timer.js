// Chronomètre global : survit aux changements de page et aux rechargements.
import { state, save } from './store.js';
import { today, uid } from './util.js';

const KEY = 'mp-cockpit-timer';
export const MODES = [
  { id: 'p25', label: 'Pomodoro 25 / 5', work: 25, rest: 5 },
  { id: 'p50', label: 'Bloc 50 / 10', work: 50, rest: 10 },
  { id: 'free', label: 'Libre', work: 0 },
  { id: 'e2', label: 'Épreuve 2 h', work: 120 },
  { id: 'e3', label: 'Épreuve 3 h', work: 180 },
  { id: 'e4', label: 'Épreuve 4 h', work: 240 },
];

// { mode, subject, phase:'work'|'rest', startedAt, elapsed (ms accumulés), running }
export let timer = JSON.parse(localStorage.getItem(KEY) || 'null');
const persist = () => (timer ? localStorage.setItem(KEY, JSON.stringify(timer)) : localStorage.removeItem(KEY));
const listeners = new Set();
export const onTick = (fn) => (listeners.add(fn), () => listeners.delete(fn));
const emit = () => listeners.forEach((fn) => fn());

export const mode = () => MODES.find((m) => m.id === timer?.mode) || MODES[0];
export const elapsedMs = () => (timer ? timer.elapsed + (timer.running ? Date.now() - timer.startedAt : 0) : 0);
export function remainingMs() {
  const m = mode();
  const target = (timer?.phase === 'rest' ? m.rest : m.work) * 6e4;
  return target ? target - elapsedMs() : null;
}

export function start(modeId, subject) {
  timer = { mode: modeId, subject, phase: 'work', startedAt: Date.now(), elapsed: 0, running: true };
  persist();
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  emit();
}
export function toggle() {
  if (!timer) return;
  if (timer.running) { timer.elapsed = elapsedMs(); timer.running = false; }
  else { timer.startedAt = Date.now(); timer.running = true; }
  persist();
  emit();
}
/** Arrête et enregistre le temps de travail effectué (au moins une minute). */
export function stop({ log = true } = {}) {
  if (!timer) return 0;
  const min = timer.phase === 'work' ? Math.round(elapsedMs() / 6e4) : 0;
  if (log && min >= 1) {
    state.sessions.push({ id: uid('s'), date: today(), minutes: min, subject: timer.subject });
    save();
  }
  timer = null;
  persist();
  emit();
  return min;
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.15, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.2);
    });
  } catch { /* son indisponible */ }
}
function notify(text) {
  beep();
  if ('Notification' in window && Notification.permission === 'granted') new Notification('Cockpit MP', { body: text });
}

setInterval(() => {
  if (!timer?.running) return;
  const rem = remainingMs();
  if (rem != null && rem <= 0) {
    const m = mode();
    if (timer.phase === 'work') {
      state.sessions.push({ id: uid('s'), date: today(), minutes: m.work, subject: timer.subject });
      save();
      if (m.rest) {
        timer = { ...timer, phase: 'rest', startedAt: Date.now(), elapsed: 0 };
        notify(`${m.work} min terminées. Pause de ${m.rest} min.`);
      } else {
        timer = null;
        notify('Temps écoulé : pose le stylo.');
      }
    } else {
      timer = { ...timer, phase: 'work', startedAt: Date.now(), elapsed: 0 };
      notify('Pause terminée, on reprend.');
    }
    persist();
  }
  emit();
}, 1000);

export function clock(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
  return `${hh ? hh + ':' : ''}${String(mm).padStart(hh ? 2 : 1, '0')}:${String(ss).padStart(2, '0')}`;
}
