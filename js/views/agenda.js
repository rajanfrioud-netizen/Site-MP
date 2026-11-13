import { state } from '../store.js';
import { h, icon, today, iso, parse, addDays, fmtDate, fmtRel, subj, subjTag, MONTHS_LONG, toast } from '../util.js';
import { vacanceOf } from '../data.js';
import { editDS, editKholle, editTask } from '../forms.js';

let month = null; // 'AAAA-MM'
let selected = null;

function eventsByDay() {
  const map = new Map();
  const push = (d, e) => (map.get(d) || map.set(d, []).get(d)).push(e);
  for (const x of state.ds) push(x.date, { kind: 'ds', label: `DS ${subj(x.subject).short}`, detail: [x.topic, x.grade != null ? `${x.grade}/20` : ''].filter(Boolean).join(' · '), subject: x.subject, open: () => editDS(x) });
  for (const x of state.kholles) push(x.date, { kind: 'kh', label: `Khôlle ${subj(x.subject).short}`, time: x.time, detail: [x.examiner, x.topic, x.grade != null ? `${x.grade}/20` : ''].filter(Boolean).join(' · '), subject: x.subject, open: () => editKholle(x) });
  for (const x of state.tasks) if (!x.done) push(x.dueDate, { kind: 'task', label: x.title, detail: x.type, subject: x.subject, open: () => editTask(x) });
  if (state.settings.concoursDate) push(state.settings.concoursDate, { kind: 'concours', label: state.settings.concoursName, detail: 'Concours', subject: 'Autre', open: () => (location.hash = '#/concours') });
  for (const l of map.values()) l.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  return map;
}

export function agenda(root, _sub, rerender) {
  const t = today();
  month ||= t.slice(0, 7);
  selected ||= t;
  const ev = eventsByDay();
  const [y, m] = month.split('-').map(Number);
  const shift = (n) => { const d = new Date(y, m - 1 + n, 1); month = iso(d).slice(0, 7); rerender(); };

  root.append(h('header.page-head', h('h1', 'Agenda'),
    h('div.row', h('button.btn', { onclick: exportICS, title: 'Pour Calendrier (iPad, iPhone), Google Agenda…' }, icon('download', 16), 'Exporter .ics'),
      h('button.btn.primary', { onclick: () => editTask(null, { dueDate: selected }) }, icon('plus', 16), 'Tâche'))));

  // ----- Grille du mois -----
  const first = new Date(y, m - 1, 1);
  const start = addDays(iso(first), -((first.getDay() + 6) % 7));
  const grid = h('div.month');
  for (const d of ['L', 'M', 'M', 'J', 'V', 'S', 'D']) grid.append(h('span.dow', d));
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i);
    if (i >= 35 && d.slice(0, 7) !== month) break;
    const list = ev.get(d) || [];
    const vac = vacanceOf(d);
    grid.append(h('button.day' + (d.slice(0, 7) !== month ? '.out' : '') + (d === t ? '.today' : '') + (d === selected ? '.sel' : '') + (vac ? '.vac' : ''),
      { onclick: () => { selected = d; rerender(); }, 'aria-label': `${fmtDate(d)}${list.length ? `, ${list.length} événement(s)` : ''}`, title: vac ? `Vacances de ${vac.name}` : null },
      h('span.num', String(parse(d).getDate())),
      h('span.marks', list.slice(0, 4).map((e) => h('i.mark.' + e.kind, { style: { '--c': subj(e.subject).color } })))));
  }
  root.append(h('section.card',
    h('header.card-head', h('button.icon-btn', { onclick: () => shift(-1), 'aria-label': 'Mois précédent' }, icon('left', 18)),
      h('h2.center.grow', `${MONTHS_LONG[m - 1]} ${y}`),
      h('button.btn.small', { onclick: () => { month = t.slice(0, 7); selected = t; rerender(); } }, 'Aujourd’hui'),
      h('button.icon-btn', { onclick: () => shift(1), 'aria-label': 'Mois suivant' }, icon('right', 18))),
    grid,
    h('div.legend', h('span', h('i.mark.ds'), 'DS'), h('span', h('i.mark.kh'), 'Khôlle'), h('span', h('i.mark.task'), 'Tâche'), h('span', h('i.mark.vacleg'), 'Vacances (zone C)'))));

  // ----- Jour sélectionné -----
  const dayList = ev.get(selected) || [];
  const vac = vacanceOf(selected);
  root.append(h('section.card', h('header.card-head', h('h2', fmtDate(selected, { year: true })), h('span.muted', [fmtRel(selected), vac && `vacances de ${vac.name}`].filter(Boolean).join(' · '))),
    dayList.length ? dayList.map(evRow) : h('p.muted', 'Rien de prévu.'),
    h('div.row', h('button.btn.small', { onclick: () => editDS(null, { date: selected }) }, '+ DS'), h('button.btn.small', { onclick: () => editKholle(null, { date: selected }) }, '+ Khôlle'), h('button.btn.small', { onclick: () => editTask(null, { dueDate: selected }) }, '+ Tâche'))));

  // ----- Les 14 prochains jours -----
  const soon = [];
  for (let i = 0; i < 14; i++) {
    const d = addDays(t, i);
    const l = (ev.get(d) || []).filter((e) => e.kind !== 'task');
    if (l.length) soon.push(h('div.soon-day', h('span.date', fmtDate(d), h('small', ' ' + fmtRel(d))), h('div.grow', l.map(evRow))));
  }
  root.append(h('section.card', h('h2', 'DS et khôlles des 14 prochains jours'), soon.length ? soon : h('p.muted', 'Aucun DS ni khôlle dans les deux semaines.')));
}

const evRow = (e) => h('button.item-main.rowlike', { onclick: e.open },
  h('i.mark.' + e.kind, { style: { '--c': subj(e.subject).color } }), e.time ? h('span.date', e.time.replace(':', ' h ')) : null,
  h('b', e.label), h('span.muted.ellipsis', e.detail || ''));

function exportICS() {
  const esc = (s) => String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const stamp = new Date().toISOString().replace(/[-:]|\.\d+/g, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cockpit MP//FR', 'CALSCALE:GREGORIAN'];
  const add = (id, summary, date, time, mins, desc) => {
    lines.push('BEGIN:VEVENT', `UID:${id}@cockpit-mp`, `DTSTAMP:${stamp}`, `SUMMARY:${esc(summary)}`);
    const d = date.replace(/-/g, '');
    if (time) {
      const s = parse(date);
      const [hh, mm] = time.split(':').map(Number);
      s.setHours(hh, mm);
      const e = new Date(+s + mins * 6e4);
      const f = (x) => `${iso(x).replace(/-/g, '')}T${String(x.getHours()).padStart(2, '0')}${String(x.getMinutes()).padStart(2, '0')}00`;
      lines.push(`DTSTART:${f(s)}`, `DTEND:${f(e)}`);
    } else lines.push(`DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${addDays(date, 1).replace(/-/g, '')}`);
    if (desc) lines.push(`DESCRIPTION:${esc(desc)}`);
    lines.push('END:VEVENT');
  };
  const from = today();
  for (const x of state.ds) if (x.date >= from) add(x.id, `DS ${x.subject}${x.topic ? ' — ' + x.topic : ''}`, x.date, '', 0, x.notes);
  for (const x of state.kholles) if (x.date >= from) add(x.id, `Khôlle ${x.subject}${x.examiner ? ' — ' + x.examiner : ''}`, x.date, x.time, 60, x.topic);
  lines.push('END:VCALENDAR');
  const a = h('a', { href: URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' })), download: 'ds-et-kholles.ics' });
  a.click();
  toast('Fichier .ics téléchargé : ouvre-le pour l’ajouter à ton calendrier');
}
