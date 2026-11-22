// Cockpit MP — widget pour l'app Scriptable (iPhone, iPad).
// Écran d'accueil : petit, moyen, grand. Écran verrouillé : rectangle, cercle, ligne.
//
// Données : le fichier « cockpit-widget.json » envoyé depuis le site
// (Réglages → Widgets → Envoyer au widget), rangé dans Fichiers → iCloud Drive → Scriptable.
// Le widget recalcule lui-même le compte à rebours, les fiches à revoir et les prochains devoirs.

const FILE = 'cockpit-widget.json';
const DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const ink = Color.dynamic(new Color('#0b0b0b'), new Color('#f0efec'));
const muted = Color.dynamic(new Color('#6b6a64'), new Color('#a3a29a'));
const accent = Color.dynamic(new Color('#2a78d6'), new Color('#3987e5'));
const bad = Color.dynamic(new Color('#b92d2d'), new Color('#f07b7b'));
const bg = Color.dynamic(new Color('#fcfcfb'), new Color('#1a1a19'));

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const days = (a, b) => Math.round((parse(a) - parse(b)) / 864e5);
const fmt = (s) => { const d = parse(s); return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const rel = (s, t) => { const n = days(s, t); return n === 0 ? 'aujourd’hui' : n === 1 ? 'demain' : `dans ${n} j`; };

async function load() {
  for (const fm of [safeICloud(), FileManager.local()]) {
    if (!fm) continue;
    const path = fm.joinPath(fm.documentsDirectory(), FILE);
    if (!fm.fileExists(path)) continue;
    if (fm.isFileStoredIniCloud && fm.isFileStoredIniCloud(path) && !fm.isFileDownloaded(path)) await fm.downloadFileFromiCloud(path);
    try { return JSON.parse(fm.readString(path)); } catch (e) { return null; }
  }
  return null;
}
function safeICloud() { try { return FileManager.iCloud(); } catch (e) { return null; } }

function summary(data) {
  const t = iso(new Date());
  const due = (data.reviews || []).filter((d) => d <= t).length;
  const events = [
    ...(data.ds || []).map((x) => ({ d: x.d, label: `DS ${x.s}`, detail: x.t || '' })),
    ...(data.kh || []).map((x) => ({ d: x.d, label: `Khôlle ${x.s}`, detail: [x.h, x.e].filter(Boolean).join(' · ') })),
  ].filter((e) => e.d >= t).sort((a, b) => (a.d + a.detail).localeCompare(b.d + b.detail));
  const tasks = (data.tasks || []).filter((x) => x.d <= t);
  const j = data.concours && data.concours.date ? days(data.concours.date, t) : null;
  const stale = data.generated ? days(t, data.generated.slice(0, 10)) : 99;
  return { t, due, events, tasks, j, stale };
}

function text(stack, s, size, color = ink, bold = false) {
  const x = stack.addText(s);
  x.font = bold ? Font.boldSystemFont(size) : Font.systemFont(size);
  x.textColor = color;
  x.lineLimit = 1;
  x.minimumScaleFactor = 0.7;
  return x;
}

function build(data, family) {
  const w = new ListWidget();
  if (data && data.url) w.url = data.url;
  const next = new Date();
  next.setHours(24, 1, 0, 0);
  w.refreshAfterDate = new Date(Math.min(+next, Date.now() + 3600e3));

  if (!data) {
    if (family.startsWith('accessory')) { text(w, 'Cockpit MP : pas de données', 12, ink, true); return w; }
    w.backgroundColor = bg;
    text(w, 'Cockpit MP', 15, ink, true);
    w.addSpacer(6);
    const m = w.addText('Ouvre le site → Réglages → Widgets → « Envoyer au widget », puis range le fichier dans iCloud Drive → Scriptable.');
    m.font = Font.systemFont(12); m.textColor = muted;
    return w;
  }

  const s = summary(data);
  const jTxt = s.j == null ? '' : s.j >= 0 ? `J−${s.j}` : 'Concours passé';
  const ev = s.events[0];

  if (family === 'accessoryInline') {
    text(w, [jTxt, s.due ? `${s.due} fiches` : null, ev ? `${ev.label} ${rel(ev.d, s.t)}` : null].filter(Boolean).join(' · '), 12);
    return w;
  }
  if (family === 'accessoryCircular') {
    w.addSpacer();
    const a = text(w, s.j == null ? '—' : String(Math.max(0, s.j)), 20, ink, true); a.centerAlignText();
    const b = text(w, s.due ? `${s.due} fiches` : 'jours', 10, ink); b.centerAlignText();
    w.addSpacer();
    return w;
  }
  if (family === 'accessoryRectangular') {
    text(w, [jTxt, s.due ? `${s.due} fiche${s.due > 1 ? 's' : ''} à revoir` : 'fiches à jour'].filter(Boolean).join(' · '), 13, ink, true);
    if (ev) text(w, `${ev.label} ${rel(ev.d, s.t)}`, 12);
    if (s.events[1]) text(w, `${s.events[1].label} ${rel(s.events[1].d, s.t)}`, 12);
    return w;
  }

  // Écran d'accueil
  w.backgroundColor = bg;
  w.setPadding(14, 14, 14, 14);
  const head = w.addStack();
  head.centerAlignContent();
  text(head, jTxt || 'Cockpit MP', family === 'small' ? 26 : 22, ink, true);
  head.addSpacer();
  if (family !== 'small') text(head, data.concours ? data.concours.name : '', 12, muted);
  if (family === 'small') text(w, data.concours ? data.concours.name : '', 11, muted);
  w.addSpacer(8);

  const line = (label, value, color = ink) => {
    const r = w.addStack();
    r.centerAlignContent();
    text(r, label, 12, muted);
    r.addSpacer();
    text(r, value, 12, color, true);
  };
  line('Fiches à revoir', String(s.due), s.due > 20 ? bad : ink);
  if (family !== 'small') line('Tâches pour aujourd’hui', String(s.tasks.length), s.tasks.some((x) => x.d < s.t) ? bad : ink);
  w.addSpacer(8);

  const max = family === 'small' ? 1 : family === 'medium' ? 2 : 7;
  if (!s.events.length) text(w, 'Aucun DS ni khôlle à venir', 12, muted);
  for (const e of s.events.slice(0, max)) {
    const r = w.addStack();
    r.layoutVertically();
    text(r, `${e.label} · ${rel(e.d, s.t)}`, 13, days(e.d, s.t) <= 2 ? accent : ink, true);
    text(r, [fmt(e.d), e.detail].filter(Boolean).join(' · '), 11, muted);
    w.addSpacer(4);
  }
  if (family === 'large' && s.tasks.length) {
    w.addSpacer(4);
    text(w, 'À faire', 12, muted, true);
    for (const x of s.tasks.slice(0, 4)) text(w, `• ${x.t}`, 12);
  }
  w.addSpacer();
  if (s.stale >= 3) text(w, `Données du ${fmt(data.generated.slice(0, 10))} : renvoie-les depuis le site`, 10, bad);
  return w;
}

const data = await load();
const family = config.widgetFamily || 'medium';
const widget = build(data, family);
if (config.runsInWidget || config.runsInAccessoryWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentMedium();
}
Script.complete();
