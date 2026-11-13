// État de l'application : localStorage pour les données, IndexedDB pour les photos.
import { today, addDays, uid } from './util.js';

const KEY = 'mp-cockpit';
export const VERSION = 4;

export const defaults = () => ({
  version: VERSION,
  settings: {
    name: '',
    lycee: 'Lycée Michelet (Vanves)',
    classe: 'MP',
    concoursName: 'Écrits Mines-Ponts',
    concoursDate: '',
    anneeDebut: today(),
    onboarded: false,
    theme: 'auto',
    reviewLimit: 20,
    coefs: null,
    barre: 10,
  },
  kholles: [],
  ds: [],
  mistakes: [],
  tasks: [],
  goals: [],
  goalsWeek: '',
  sessions: [],
  chapters: {}, // id -> { level: 0..4, last: 'AAAA-MM-JJ' }
  customChapters: [], // { id, subject, title }
  checks: {}, // id de chapitre -> indices des points sus
  annales: {}, // id d'épreuve -> { done, date, grade, notes }
  interros: [], // { date, subject, total, ok }
  activity: {},
  legacy: {},
  lastBackup: '',
});

export let state = defaults();
const listeners = new Set();
export const subscribe = (fn) => listeners.add(fn);

export function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw) state = normalize(raw).state;
  } catch (e) {
    console.error('Lecture des données impossible', e);
  }
  return state;
}

export function save({ touch = true, silent = false } = {}) {
  if (touch) state.activity[today()] = true;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    alert('Enregistrement impossible : le stockage du navigateur est plein ou bloqué.');
  }
  if (!silent) listeners.forEach((fn) => fn());
}

/** Accepte une sauvegarde v3 (ancien « MPSI Cockpit ») ou v4 et renvoie { state, images }. */
export function normalize(raw) {
  if (!raw || typeof raw !== 'object' || !('settings' in raw || 'mistakes' in raw || 'ds' in raw)) {
    throw new Error('Ce fichier ne ressemble pas à une sauvegarde du cockpit.');
  }
  const d = defaults();
  const s = { ...d, ...raw, settings: { ...d.settings, ...(raw.settings || {}) } };
  const images = [];
  const num = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));

  s.kholles = (raw.kholles || []).map((k) => ({
    id: k.id || uid('k'), subject: k.subject || 'Autre', date: k.date || today(), time: k.time || '',
    examiner: k.examiner || '', topic: k.topic || '', feedback: k.feedback || '', grade: num(k.grade),
  }));
  s.ds = (raw.ds || []).map((x) => ({
    id: x.id || uid('ds'), subject: x.subject || 'Autre', date: x.date || today(), topic: x.topic || '',
    grade: num(x.grade), targetGrade: num(x.targetGrade), classAvg: num(x.classAvg), notes: x.notes || '',
    rank: num(x.rank), classSize: num(x.classSize), best: num(x.best), loss: x.loss && typeof x.loss === 'object' ? x.loss : null,
  }));
  s.mistakes = (raw.mistakes || []).map((m) => {
    const id = m.id || uid('m');
    for (const side of ['Front', 'Back']) {
      const v = m['img' + side];
      if (typeof v === 'string' && v.startsWith('data:')) images.push({ key: `${id}:${side}`, data: v });
    }
    return {
      id, subject: m.subject || 'Autre', title: (m.title || '').trim(), description: m.description || '',
      formula: m.formula || '', remedy: m.remedy || '', gravity: m.gravity || 'Moyenne', chapter: m.chapter || '',
      createdAt: m.createdAt || new Date().toISOString(),
      srsLevel: num(m.srsLevel) ?? 0, nextReview: m.nextReview || today(), lastReview: m.lastReview || '',
      reps: num(m.reps) ?? 0, lapses: num(m.lapses) ?? 0,
      hasFront: m.hasFront || (typeof m.imgFront === 'string' && m.imgFront.startsWith('data:')),
      hasBack: m.hasBack || (typeof m.imgBack === 'string' && m.imgBack.startsWith('data:')),
    };
  });
  s.tasks = (raw.tasks || []).map((t) => ({
    id: t.id || uid('t'), title: t.title || '', subject: t.subject || 'Autre', type: t.type || 'Autre',
    dueDate: t.dueDate || today(), estMin: num(t.estMin) ?? 60, priority: t.priority || 'Moyenne',
    done: !!t.done, doneAt: t.doneAt || '',
  }));
  s.goals = (raw.goals || []).map((g) => ({ id: g.id || uid('wg'), title: g.title || '', target: num(g.target) ?? 1, current: num(g.current) ?? 0, unit: g.unit || '' }));
  s.sessions = (raw.sessions || []).map((x) => ({ id: x.id || uid('s'), date: x.date, minutes: num(x.minutes) ?? 0, subject: x.subject || 'Autre' }));
  s.activity = { ...(raw.activity || {}) };
  s.chapters = { ...(raw.chapters || {}) };
  s.customChapters = [...(raw.customChapters || [])];
  s.checks = { ...(raw.checks || {}) };
  s.annales = { ...(raw.annales || {}) };
  s.interros = [...(raw.interros || [])];

  // v3 : l'avancement du programme utilisait d'autres identifiants de chapitres (MPSI).
  // On le conserve tel quel pour ne rien perdre, sans prétendre le faire correspondre.
  s.legacy = { ...(raw.legacy || {}) };
  if ((raw.version || 0) < 4) {
    if (raw.program) s.legacy.program = raw.program;
    if (raw.resDone) s.legacy.resDone = raw.resDone;
  }
  delete s.program;
  delete s.resDone;
  s.version = VERSION;
  return { state: s, images };
}

export async function importData(raw) {
  const { state: s, images } = normalize(raw);
  // Les photos vont dans IndexedDB ; si le navigateur le refuse (navigation privée…),
  // on importe quand même tout le reste.
  let saved = 0;
  try {
    await imgClear();
    for (const im of images) { await imgPut(im.key, im.data); saved++; }
  } catch (e) {
    console.warn('Photos non importées', e);
  }
  if (saved < images.length) {
    for (const m of s.mistakes) { m.hasFront = false; m.hasBack = false; }
    for (const im of images.slice(0, saved)) {
      const [id, side] = im.key.split(':');
      const m = s.mistakes.find((x) => x.id === id);
      if (m) m['has' + side] = true;
    }
  }
  state = s;
  state.settings.onboarded = true;
  save({ touch: false });
  return { ...counts(), images: saved, imagesLost: images.length - saved };
}

export const counts = () => ({
  ds: state.ds.length, kholles: state.kholles.length, mistakes: state.mistakes.length, tasks: state.tasks.length,
});

/** Sauvegarde complète, photos comprises (même forme que l'ancien export : imgFront / imgBack). */
export async function exportData() {
  const imgs = await imgAll();
  const out = JSON.parse(JSON.stringify(state));
  out.exportedAt = new Date().toISOString();
  out.mistakes = out.mistakes.map((m) => ({
    ...m, imgFront: imgs[`${m.id}:Front`] || null, imgBack: imgs[`${m.id}:Back`] || null,
  }));
  return out;
}

export function reset() {
  state = defaults();
  localStorage.removeItem(KEY);
  return imgClear();
}

// ---------- Séries de jours actifs ----------
export function streak() {
  let d = today();
  if (!state.activity[d]) d = addDays(d, -1);
  let n = 0;
  while (state.activity[d]) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

// ---------- IndexedDB (photos des fiches d'erreurs) ----------
let dbp;
function db() {
  dbp ||= new Promise((res, rej) => {
    const r = indexedDB.open('mp-cockpit', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('img');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbp;
}
async function tx(mode, fn) {
  const d = await db();
  return new Promise((res, rej) => {
    const t = d.transaction('img', mode);
    const out = fn(t.objectStore('img'));
    t.oncomplete = () => res(out?.result);
    t.onerror = () => rej(t.error);
  });
}
export const imgGet = (key) => tx('readonly', (s) => s.get(key));
export const imgPut = (key, data) => tx('readwrite', (s) => s.put(data, key));
export const imgDel = (key) => tx('readwrite', (s) => s.delete(key));
export const imgClear = () => tx('readwrite', (s) => s.clear());
export async function imgAll() {
  const d = await db();
  return new Promise((res, rej) => {
    const out = {};
    const c = d.transaction('img').objectStore('img').openCursor();
    c.onsuccess = () => {
      const cur = c.result;
      if (!cur) return res(out);
      out[cur.key] = cur.value;
      cur.continue();
    };
    c.onerror = () => rej(c.error);
  });
}

/** Réduit une photo (appareil photo d'iPad = plusieurs Mo) avant stockage. */
export function compressImage(file, max = 1400, quality = 0.72) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = rej;
    img.src = url;
  });
}
