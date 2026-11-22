// Chrono hors de la page : écran verrouillé (lecteur « À l'écoute » d'iOS), son de fin, écran allumé.
//
// Un site ne peut pas créer d'« Activité en direct » (réservée aux apps natives).
// On utilise donc ce que Safari permet : une piste audio en boucle (silence ou bruit brun)
// décrite par l'API Media Session. iOS l'affiche sur l'écran verrouillé avec la matière,
// l'heure de fin, une barre de progression et les boutons Lecture / Pause.
import { state } from './store.js';
import { timer, mode, remainingMs, elapsedMs, onTick, toggle, stop, events } from './timer.js';

export const AMBIENT = [
  ['off', 'Désactivé'],
  ['silence', 'Silencieux'],
  ['brown', 'Bruit brun'],
];
export const ambientKind = () => state.settings.ambient || 'silence';

let audio = null;
let ctx = null;
let chime = null; // { nodes, at } son de fin programmé sur l'horloge audio
let lastChimeAt = 0;
let wake = null;
let lastKey = '';
let engaged = false; // la piste a été lancée pour ce chrono
const urls = {};

// ---------- Pistes audio générées (aucun fichier à télécharger) ----------
function wav(kind) {
  if (urls[kind]) return urls[kind];
  const rate = kind === 'silence' ? 8000 : 22050;
  const n = rate * 30; // boucle de 30 s
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVEfmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, n * 2, true);
  if (kind === 'brown') {
    let last = 0;
    const fade = rate * 0.05;
    for (let i = 0; i < n; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      const env = Math.min(1, i / fade, (n - 1 - i) / fade); // évite le clic à la boucle
      v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, last * 3.5 * 0.35 * env)) * 32767, true);
    }
  }
  urls[kind] = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  return urls[kind];
}

function audioCtx() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** Trois notes douces, jouées à l'instant `when` de l'horloge audio. */
function playChime(when) {
  const c = audioCtx();
  if (!c) return null;
  const at = Math.max(c.currentTime + 0.01, when ?? 0);
  const nodes = [0, 0.28, 0.56].map((dt, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = [660, 880, 1320][i];
    g.gain.setValueAtTime(0.0001, at + dt);
    g.gain.exponentialRampToValueAtTime(0.25, at + dt + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dt + 0.6);
    o.connect(g).connect(c.destination);
    o.start(at + dt);
    o.stop(at + dt + 0.65);
    return o;
  });
  return { nodes, at };
}
function cancelChime() {
  chime?.nodes.forEach((o) => { try { o.stop(); o.disconnect(); } catch { /* déjà fini */ } });
  chime = null;
}

// ---------- Fin de phase : son + notification ----------
events.onEnd = (text) => {
  // Si le son programmé à l'avance vient de sonner, on ne le rejoue pas.
  const c = ctx;
  const scheduledJustNow = chime && c && Math.abs(c.currentTime - chime.at) < 3;
  if (!scheduledJustNow && Date.now() - lastChimeAt > 3000) playChime();
  lastChimeAt = Date.now();
  chime = null;
  notifyEnd(text);
};
function notifyEnd(body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const opts = { body, icon: 'icons/icon-192.png', tag: 'chrono' };
  navigator.serviceWorker?.getRegistration()
    .then((r) => (r ? r.showNotification('Cockpit MP', opts) : new Notification('Cockpit MP', opts)))
    .catch(() => { try { new Notification('Cockpit MP', opts); } catch { /* non pris en charge */ } });
}

// ---------- Écran verrouillé ----------
const hm = (d) => `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
const short = (s) => ({ 'Mathématiques': 'Maths', 'Physique-Chimie': 'Physique', 'Sciences Industrielles': 'SI', 'Français-Philosophie': 'Français', 'Informatique': 'Info' })[s] || s;

function setHandlers() {
  const ms = navigator.mediaSession;
  if (!ms) return;
  const set = (a, fn) => { try { ms.setActionHandler(a, fn); } catch { /* action inconnue */ } };
  set('play', () => { if (timer && !timer.running) toggle(); audio?.play().catch(() => {}); });
  set('pause', () => { if (timer?.running) toggle(); });
  set('stop', () => stop());
  for (const a of ['previoustrack', 'nexttrack', 'seekbackward', 'seekforward', 'seekto']) set(a, null);
}

function describe() {
  const ms = navigator.mediaSession;
  if (!ms || !timer) return;
  const m = mode();
  const rem = remainingMs();
  const rest = timer.phase === 'rest';
  const title = rest ? 'Pause' : `${short(timer.subject)} — ${m.work ? 'travail' : 'chrono libre'}`;
  const artist = !timer.running ? 'En pause'
    : rem != null ? `Fin à ${hm(new Date(Date.now() + rem))} · reste ${Math.max(1, Math.ceil(rem / 6e4))} min`
      : `Depuis ${Math.floor(elapsedMs() / 6e4)} min`;
  try {
    ms.metadata = new MediaMetadata({
      title, artist, album: `Cockpit MP · ${m.label}`,
      artwork: [192, 512].map((s) => ({ src: new URL(`icons/icon-${s}.png`, location.href).href, sizes: `${s}x${s}`, type: 'image/png' })),
    });
    ms.playbackState = timer.running ? 'playing' : 'paused';
    const total = rem != null ? elapsedMs() + rem : Math.max(4 * 3600e3, elapsedMs() + 3600e3);
    ms.setPositionState?.({ duration: total / 1000, position: Math.min(total, elapsedMs()) / 1000, playbackRate: timer.running ? 1 : 0.000001 });
  } catch { /* API partielle */ }
}

function release() {
  audio?.pause();
  cancelChime();
  if (navigator.mediaSession) {
    try { navigator.mediaSession.metadata = null; navigator.mediaSession.playbackState = 'none'; } catch { /* rien */ }
  }
  lastKey = '';
  engaged = false;
}

async function keepAwake(on) {
  if (!('wakeLock' in navigator)) return;
  if (on && !wake && document.visibilityState === 'visible') {
    try {
      wake = await navigator.wakeLock.request('screen');
      wake.addEventListener('release', () => (wake = null));
    } catch { /* refusé */ }
  } else if (!on && wake) {
    wake.release().catch(() => {});
    wake = null;
  }
}

/** Met à jour l'écran verrouillé et le son programmé ; appelé à chaque seconde du chrono. */
function update() {
  keepAwake(!!(timer?.running && state.settings.keepAwake));
  if (!timer) return release();
  if (!timer.running) audio?.pause();
  const rem = remainingMs();
  const key = [timer.phase, timer.mode, timer.subject, timer.running, rem != null ? Math.ceil(rem / 6e4) : Math.floor(elapsedMs() / 6e4)].join('|');
  if (key === lastKey) return;
  const phaseChanged = lastKey.split('|')[0] !== timer.phase || lastKey.split('|')[3] !== String(timer.running);
  lastKey = key;
  if (engaged) describe();
  // Son de fin calé sur l'horloge audio : il sonne même si la page est ralentie en arrière-plan.
  if (phaseChanged || !chime) {
    cancelChime();
    if (timer.running && rem != null && rem > 1500 && ctx && ctx.state === 'running') chime = playChime(ctx.currentTime + rem / 1000);
  }
}

/** À appeler depuis un clic (Démarrer, Reprendre) : iOS n'autorise le son qu'après un geste. */
export function engage() {
  audioCtx(); // débloque le son de fin
  if ('audioSession' in navigator) { try { navigator.audioSession.type = 'playback'; } catch { /* rien */ } }
  const kind = ambientKind();
  if (kind !== 'off' && timer) {
    if (!audio) {
      audio = new Audio();
      audio.loop = true;
      audio.setAttribute('playsinline', '');
    }
    if (audio.dataset.kind !== kind) {
      audio.src = wav(kind);
      audio.dataset.kind = kind;
    }
    audio.play().catch(() => {});
    engaged = true;
    setHandlers();
  } else {
    audio?.pause();
    engaged = false;
  }
  lastKey = '';
  update();
}

/** La piste tourne-t-elle (donc le chrono est-il visible sur l'écran verrouillé) ? */
export const isActive = () => !!audio && !audio.paused;

onTick(update);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { lastKey = ''; update(); }
});
