import { state, save } from '../store.js';
import { h, icon, today, fmtRel, diffDays, subj, uid, formModal, SUBJECTS } from '../util.js';
import { PROGRAMME, LEVELS } from '../data.js';
import { editMistake } from '../forms.js';
import { interro } from './interro.js';

const open = new Set(['Mathématiques']);

const lvl = (id) => state.chapters[id]?.level || 0;

/** Un chapitre est « à reprendre » s'il est peu maîtrisé ou pas revu depuis longtemps. */
function stale(id) {
  const c = state.chapters[id];
  if (!c || !c.level) return false;
  return c.level < 4 && c.last && diffDays(today(), c.last) > [0, 14, 21, 35][c.level];
}

export function programme(root, sub, rerender) {
  if (sub === 'interro') return interro(root, rerender);
  const tree = PROGRAMME.map((p) => ({ ...p, blocks: p.blocks.map((b) => ({ ...b, chapters: b.chapters.map((c) => ({ ...c, subject: p.subject })) })) }));
  for (const c of state.customChapters) {
    let p = tree.find((x) => x.subject === c.subject);
    if (!p) tree.push((p = { subject: c.subject, blocks: [] }));
    let b = p.blocks.find((x) => x.custom);
    if (!b) p.blocks.push((b = { name: 'Mes chapitres', custom: true, chapters: [] }));
    b.chapters.push(c);
  }
  const all = tree.flatMap((p) => p.blocks.flatMap((b) => b.chapters));
  const total = all.reduce((a, c) => a + lvl(c.id), 0) / (all.length * 4);

  root.append(h('header.page-head', h('h1', 'Programme'),
    h('div.row', h('button.btn', { onclick: addChapter }, icon('plus', 16), 'Chapitre'), h('a.btn.primary', { href: '#/programme/interro' }, icon('mic', 16), 'Interro de cours'))),
  h('p.muted', 'Le concours porte sur les deux années. Note chaque chapitre de 0 à 4 après l’avoir travaillé ; ceux qui n’ont pas été revus depuis longtemps remontent tout seuls.'));

  if (state.legacy?.program && !Object.keys(state.chapters).length) {
    root.append(h('p.note', `Ton ancienne sauvegarde notait ${Object.keys(state.legacy.program).length} chapitres de MPSI avec d’autres intitulés : ils sont conservés dans tes données mais ne peuvent pas être rattachés automatiquement à cette liste. Dix minutes suffisent pour renoter le programme ci-dessous.`));
  }

  // ----- À reprendre -----
  const redo = all.filter((c) => stale(c.id)).sort((a, b) => state.chapters[a.id].last.localeCompare(state.chapters[b.id].last));
  if (redo.length) {
    root.append(h('section.card', h('header.card-head', h('h2', 'À reprendre'), h('span.muted', 'Pas revus depuis un moment')),
      redo.slice(0, 6).map((c) => chapterRow(c, rerender))));
  }

  root.append(h('section.card', h('header.card-head', h('h2', 'Avancement global'), h('span.muted', `${Math.round(total * 100)} %`)),
    h('div.progress', h('i', { style: { width: total * 100 + '%' } })),
    h('p.muted', `${all.reduce((a, c) => a + (state.checks[c.id]?.length || 0), 0)} points sus sur ${all.reduce((a, c) => a + (c.points?.length || 0), 0)}. Touche un chapitre pour afficher ses points de contrôle.`),
    h('div.legend', LEVELS.map((l, i) => h('span', h('i.lv.lv' + i), `${i} · ${l}`)))));

  for (const p of tree) {
    const chs = p.blocks.flatMap((b) => b.chapters);
    if (!chs.length) continue;
    const pct = chs.reduce((a, c) => a + lvl(c.id), 0) / (chs.length * 4);
    const errs = state.mistakes.filter((m) => m.subject === p.subject).length;
    const isOpen = open.has(p.subject);
    const sec = h('section.card.acc',
      h('button.acc-head', { 'aria-expanded': String(isOpen), onclick: () => { isOpen ? open.delete(p.subject) : open.add(p.subject); rerender(); } },
        h('i.dot', { style: { background: subj(p.subject).color } }), h('h2', p.subject),
        h('span.muted', `${chs.filter((c) => lvl(c.id) >= 3).length} / ${chs.length} maîtrisés${errs ? ` · ${errs} fiche${errs > 1 ? 's' : ''} d’erreur` : ''}`),
        h('span.grow'), h('span.progress.mini', h('i', { style: { width: pct * 100 + '%', background: subj(p.subject).color } })),
        icon(isOpen ? 'left' : 'right', 16)));
    if (isOpen) {
      for (const b of p.blocks) {
        if (!b.chapters.length) continue;
        sec.append(h('h3.block', b.name), ...b.chapters.map((c) => chapterRow(c, rerender, b.custom)));
      }
    }
    root.append(sec);
  }
}

const expanded = new Set();

function chapterRow(c, rerender, custom) {
  const cur = lvl(c.id);
  const st = state.chapters[c.id];
  const nb = state.mistakes.filter((m) => m.chapter && m.chapter === c.title).length;
  const pts = c.points || [];
  const known = new Set(state.checks[c.id] || []);
  const isOpen = expanded.has(c.id);
  const set = (l) => {
    state.chapters[c.id] = { level: l === cur ? Math.max(0, l - 1) : l, last: today() };
    save();
  };
  const row = h('div.chapter',
    h(pts.length ? 'button.chapter-title' : 'div.chapter-title', pts.length ? { 'aria-expanded': String(isOpen), onclick: () => { isOpen ? expanded.delete(c.id) : expanded.add(c.id); rerender(); } } : null,
      h('span', c.title),
      h('small.muted', [pts.length ? `${known.size} / ${pts.length} points sus` : null, st?.last ? 'travaillé ' + fmtRel(st.last) : null, nb ? `${nb} erreur${nb > 1 ? 's' : ''}` : null].filter(Boolean).join(' · '))),
    custom ? h('button.icon-btn', { 'aria-label': 'Supprimer le chapitre', onclick: () => { if (confirm('Supprimer ce chapitre ?')) { state.customChapters = state.customChapters.filter((x) => x.id !== c.id); delete state.chapters[c.id]; save(); } } }, icon('trash', 15)) : null,
    h('div.levels', { role: 'group', 'aria-label': 'Niveau de maîtrise' }, [1, 2, 3, 4].map((l) =>
      h('button.lv' + (l <= cur ? '.lv' + cur : ''), { title: LEVELS[l], 'aria-label': LEVELS[l], 'aria-pressed': String(l <= cur), onclick: () => set(l) }, String(l)))),
    cur ? h('button.btn.small', { title: 'Je viens de le retravailler', onclick: () => { state.chapters[c.id] = { level: cur, last: today() }; save(); } }, 'Revu') : null);
  if (!isOpen || !pts.length) return row;
  const toggle = (i) => {
    known.has(i) ? known.delete(i) : known.add(i);
    state.checks[c.id] = [...known].sort((x, y) => x - y);
    // Le niveau suit la part de points sus, sans jamais redescendre tout seul.
    const auto = known.size === pts.length ? 3 : known.size >= pts.length / 2 ? 2 : known.size ? 1 : 0;
    if (auto > cur) state.chapters[c.id] = { level: auto, last: today() };
    save();
  };
  return h('div.chapter-wrap', row,
    h('div.points',
      h('p.muted', 'Coche un point seulement si tu peux l’énoncer et l’utiliser sans tes notes.'),
      pts.map((pt, i) => h('label.point', h('input.check', { type: 'checkbox', checked: known.has(i), onchange: () => toggle(i) }), h('span', pt))),
      h('div.row',
        h('button.btn.small', { onclick: () => editMistake(null, { chapter: c.title, subject: c.subject }) }, '+ Fiche d’erreur sur ce chapitre'))));
}

function addChapter() {
  formModal('Ajouter un chapitre', [
    { name: 'subject', label: 'Matière', type: 'select', options: SUBJECTS.map((s) => s.id) },
    { name: 'title', label: 'Intitulé', required: true, placeholder: 'Œuvre 1 : …, TIPE : bibliographie…' },
  ], (v) => { state.customChapters.push({ id: uid('c'), ...v }); open.add(v.subject); save(); }, { submitLabel: 'Ajouter' });
}
