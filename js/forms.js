// Formulaires de création / modification, partagés entre les vues.
import { state, save, imgGet, imgPut, imgDel, compressImage } from './store.js';
import { h, formModal, modal, today, uid, SUBJECTS, toast } from './util.js';
import { TASK_TYPES, PRIORITIES, PROGRAMME } from './data.js';

const subjOpts = (extra = []) => [...SUBJECTS.map((s) => s.id), ...extra];
const known = (key, list) => [...new Set(list.map((x) => x[key]).filter(Boolean))].sort();

function upsert(list, item, values) {
  if (item) Object.assign(item, values);
  else list.push(values);
  save();
}
const remove = (key, item) => () => {
  state[key] = state[key].filter((x) => x !== item);
  save();
};

export function editTask(task, preset = {}) {
  const t = task || { subject: 'Mathématiques', type: 'TD', dueDate: today(), estMin: 60, priority: 'Moyenne', ...preset };
  formModal(task ? 'Modifier la tâche' : 'Nouvelle tâche', [
    { name: 'title', label: 'Intitulé', value: t.title, required: true, placeholder: 'TD 7 : exercices 3, 5, 12' },
    { name: 'subject', label: 'Matière', type: 'select', options: subjOpts(), value: t.subject, half: true },
    { name: 'type', label: 'Type', type: 'select', options: TASK_TYPES, value: t.type, half: true },
    { name: 'dueDate', label: 'Pour le', type: 'date', value: t.dueDate, required: true, half: true },
    { name: 'estMin', label: 'Durée estimée (min)', type: 'number', value: t.estMin, min: 5, step: 5, half: true },
    { name: 'priority', label: 'Priorité', type: 'select', options: PRIORITIES, value: t.priority },
  ], (v) => upsert(state.tasks, task, task ? v : { id: uid('t'), done: false, doneAt: '', ...v }),
  { onDelete: task && remove('tasks', task) });
}

export function editDS(ds, preset = {}) {
  const d = ds || { subject: 'Mathématiques', date: today(), ...preset };
  formModal(ds ? 'Modifier le DS' : 'Nouveau DS', [
    { name: 'subject', label: 'Matière', type: 'select', options: subjOpts(), value: d.subject, half: true },
    { name: 'date', label: 'Date', type: 'date', value: d.date, required: true, half: true },
    { name: 'topic', label: 'Intitulé', value: d.topic, placeholder: 'DS5 — 3 h' },
    { name: 'grade', label: 'Note / 20', type: 'number', value: d.grade, min: 0, max: 20, step: 0.01, half: true, hint: 'Vide tant que non rendu' },
    { name: 'targetGrade', label: 'Objectif / 20', type: 'number', value: d.targetGrade, min: 0, max: 20, step: 0.5, half: true },
    { name: 'classAvg', label: 'Moyenne de classe', type: 'number', value: d.classAvg, min: 0, max: 20, step: 0.01, half: true },
    { name: 'notes', label: 'Programme / bilan', type: 'textarea', value: d.notes, placeholder: 'Ce qui tombe, puis ce que j’ai raté et pourquoi' },
  ], (v) => upsert(state.ds, ds, ds ? v : { id: uid('ds'), ...v }), { onDelete: ds && remove('ds', ds) });
}

export function editKholle(k, preset = {}) {
  const d = k || { subject: 'Mathématiques', date: today(), time: '17:00', ...preset };
  formModal(k ? 'Modifier la khôlle' : 'Nouvelle khôlle', [
    { name: 'subject', label: 'Matière', type: 'select', options: subjOpts(), value: d.subject, half: true },
    { name: 'examiner', label: 'Colleur', value: d.examiner, half: true, list: 'dl-colleurs', datalist: known('examiner', state.kholles) },
    { name: 'date', label: 'Date', type: 'date', value: d.date, required: true, half: true },
    { name: 'time', label: 'Heure', type: 'time', value: d.time, half: true },
    { name: 'topic', label: 'Programme / sujet tombé', value: d.topic, placeholder: 'Réduction, question de cours : lemme des noyaux' },
    { name: 'grade', label: 'Note / 20', type: 'number', value: d.grade, min: 0, max: 20, step: 0.5, hint: 'Vide tant que non passée' },
    { name: 'feedback', label: 'Remarques du colleur', type: 'textarea', value: d.feedback, placeholder: 'Ce qu’il a dit, ce qu’il attendait' },
  ], (v) => upsert(state.kholles, k, k ? v : { id: uid('k'), ...v }), { onDelete: k && remove('kholles', k) });
}

/** Fiche d'erreur : question au recto, réponse au verso, photos facultatives. */
export async function editMistake(card, preset = {}) {
  const c = card || { subject: 'Mathématiques', gravity: 'Moyenne', ...preset };
  const id = card?.id || uid('m');
  const imgs = { Front: card?.hasFront ? await imgGet(`${id}:Front`) : null, Back: card?.hasBack ? await imgGet(`${id}:Back`) : null };
  const chapters = PROGRAMME.flatMap((p) => p.blocks.flatMap((b) => b.chapters.map((x) => x.title))).concat(state.customChapters.map((x) => x.title));

  const photo = (side, label) => {
    const box = h('div.photo');
    const draw = () => {
      box.replaceChildren(...[
        h('span', label),
        imgs[side] ? h('img', { src: imgs[side], alt: '' }) : null,
        h('label.btn.small', imgs[side] ? 'Remplacer' : 'Ajouter une photo',
          h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: async (e) => {
            if (!e.target.files[0]) return;
            try { imgs[side] = await compressImage(e.target.files[0]); draw(); } catch { toast('Image illisible'); }
          } })),
        imgs[side] ? h('button.btn.small', { type: 'button', onclick: () => { imgs[side] = null; draw(); } }, 'Retirer') : null,
      ].filter(Boolean));
    };
    draw();
    return box;
  };

  const m = formModal(card ? 'Modifier la fiche' : 'Nouvelle fiche d’erreur', [
    { name: 'title', label: 'Titre', value: c.title, required: true, placeholder: 'Matrices équivalentes et semblables' },
    { name: 'subject', label: 'Matière', type: 'select', options: subjOpts(), value: c.subject, half: true },
    { name: 'gravity', label: 'Gravité', type: 'select', options: ['Critique', 'Moyenne'], value: c.gravity, half: true },
    { name: 'chapter', label: 'Chapitre', value: c.chapter, list: 'dl-chapitres', datalist: chapters, placeholder: 'Facultatif' },
    { name: 'description', label: 'Recto — la question, ou ce que j’ai raté', type: 'textarea', value: c.description, placeholder: 'Une vraie question à laquelle répondre de tête' },
    { name: 'formula', label: 'Énoncé / formule (LaTeX accepté)', type: 'textarea', rows: 2, value: c.formula, placeholder: '$I_n = P P^{-1}$' },
    { name: 'remedy', label: 'Verso — la réponse, la méthode', type: 'textarea', rows: 4, value: c.remedy, placeholder: 'La réponse complète, pas « apprendre »' },
  ], (v) => {
    const sync = async () => {
      for (const side of ['Front', 'Back']) imgs[side] ? await imgPut(`${id}:${side}`, imgs[side]) : await imgDel(`${id}:${side}`);
      const flags = { hasFront: !!imgs.Front, hasBack: !!imgs.Back };
      if (card) Object.assign(card, v, flags);
      else state.mistakes.push({ id, createdAt: new Date().toISOString(), srsLevel: 0, nextReview: today(), lastReview: '', reps: 0, lapses: 0, ...v, ...flags });
      save();
    };
    sync();
  }, { onDelete: card && (() => { imgDel(`${id}:Front`); imgDel(`${id}:Back`); remove('mistakes', card)(); }) });
  m.dlg.querySelector('.form-actions').before(h('div.photos', photo('Front', 'Photo recto (énoncé)'), photo('Back', 'Photo verso (corrigé)')));
}

export function showImage(src) {
  modal('Photo', h('img.full', { src, alt: '' }), { wide: true });
}
