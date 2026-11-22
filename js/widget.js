// Pont vers l'iPad : données pour le widget Scriptable, minuteur Horloge via Raccourcis.
import { state, save } from './store.js';
import { h, today, toast, subj } from './util.js';
import { timer, remainingMs } from './timer.js';

export const WIDGET_FILE = 'cockpit-widget.json';
export const SCRIPT_URL = 'widget/Cockpit-MP.js';

/** Instantané compact : le widget recalcule seul compte à rebours, fiches dues et prochains devoirs. */
export function widgetData() {
  const t = today();
  const short = (s) => subj(s).short;
  return {
    v: 1,
    generated: new Date().toISOString(),
    url: location.href.split('#')[0],
    name: state.settings.name,
    concours: state.settings.concoursDate ? { name: state.settings.concoursName, date: state.settings.concoursDate } : null,
    ds: state.ds.filter((x) => x.date >= t && x.grade == null).map((x) => ({ d: x.date, s: short(x.subject), t: x.topic })),
    kh: state.kholles.filter((x) => x.date >= t && x.grade == null).map((x) => ({ d: x.date, h: x.time, s: short(x.subject), e: x.examiner })),
    reviews: state.mistakes.map((m) => m.nextReview).filter(Boolean),
    tasks: state.tasks.filter((x) => !x.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 40).map((x) => ({ d: x.dueDate, t: x.title, s: short(x.subject) })),
  };
}

/** Partage le fichier (iPad : « Enregistrer dans Fichiers » → iCloud Drive → Scriptable), sinon le télécharge. */
export async function sendToWidget() {
  const json = JSON.stringify(widgetData());
  const file = new File([json], WIDGET_FILE, { type: 'application/json' });
  state.settings.widgetSync = today();
  save({ touch: false, silent: true });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: WIDGET_FILE });
      return toast('Range le fichier dans iCloud Drive → Scriptable');
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  h('a', { href: URL.createObjectURL(file), download: WIDGET_FILE }).click();
  toast('Fichier téléchargé : déplace-le dans iCloud Drive → Scriptable');
}

export async function copyScript() {
  const code = await (await fetch(SCRIPT_URL)).text();
  try {
    await navigator.clipboard.writeText(code);
    toast('Script copié : colle-le dans un nouveau script Scriptable');
  } catch {
    location.href = SCRIPT_URL; // repli : affiche le code pour un copier-coller manuel
  }
}

/**
 * Lance le Raccourci qui démarre le minuteur de l'app Horloge (Activité en direct sur l'écran verrouillé).
 * À appeler depuis un clic, au démarrage ou à la reprise d'une phase de travail.
 */
export function launchClockTimer() {
  const s = state.settings;
  if (!s.clockShortcut || !timer || timer.phase !== 'work') return;
  const rem = remainingMs();
  if (rem == null || rem < 60e3) return;
  const min = Math.round(rem / 6e4);
  const url = `shortcuts://run-shortcut?name=${encodeURIComponent(s.shortcutName || 'Chrono MP')}&input=text&text=${min}`;
  // Lien inséré dans la page (Safari ignore parfois un lien détaché) ; petit délai pour laisser la piste audio démarrer.
  setTimeout(() => {
    const a = h('a', { href: url, hidden: true });
    document.body.append(a);
    a.click();
    a.remove();
  }, 250);
}
