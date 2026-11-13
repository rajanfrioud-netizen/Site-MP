import { state } from '../store.js';
import { h, icon, today, fmtDate, fmtRel, fmtNum, subj, subjTag, gradeClass, empty, schoolYearStart, mean, diffDays } from '../util.js';
import { graded, upcoming, ungraded, bySubject, avg, trend, weighted, dsAverages } from '../stats.js';
import { lineChart, hbars } from '../charts.js';
import { editDS, editKholle } from '../forms.js';

let period = 'year'; // 'year' | 'all'

export function notes(root, tab = 'ds', rerender) {
  const isDS = tab !== 'kholles';
  const list = isDS ? state.ds : state.kholles;
  const edit = isDS ? editDS : editKholle;
  const from = period === 'year' ? schoolYearStart() : '0000';
  const done = graded(list, from);

  root.append(h('header.page-head', h('h1', 'Notes'),
    h('button.btn.primary', { onclick: () => edit() }, icon('plus', 16), isDS ? 'Nouveau DS' : 'Nouvelle khôlle')),
  h('div.tabs', h('a' + (isDS ? '.on' : ''), { href: '#/notes/ds' }, 'Devoirs surveillés'), h('a' + (!isDS ? '.on' : ''), { href: '#/notes/kholles' }, 'Khôlles'),
    h('span.grow'),
    h('button.chip' + (period === 'year' ? '.on' : ''), { onclick: () => { period = 'year'; rerender(); } }, 'Cette année'),
    h('button.chip' + (period === 'all' ? '.on' : ''), { onclick: () => { period = 'all'; rerender(); } }, 'Depuis la sup')));

  // ----- Notes à saisir -----
  const todo = ungraded(list);
  if (todo.length) {
    root.append(h('section.card.todo', h('h2', `${todo.length} note${todo.length > 1 ? 's' : ''} à saisir`),
      todo.slice(0, 6).map((x) => h('button.item-main.rowlike', { onclick: () => edit(x) }, subjTag(x.subject), ` ${x.topic || x.examiner || ''} · ${fmtDate(x.date)}`, h('span.grow'), h('span.link', 'Saisir →')))));
  }

  // ----- Synthèse par matière -----
  const subs = bySubject(done);
  if (done.length) {
    const rows = subs.map(([s, l]) => {
      const tr = trend(l);
      const tgt = isDS ? mean(l.filter((x) => x.targetGrade != null).map((x) => x.targetGrade)) : null;
      return { label: subj(s).short, value: avg(l), color: subj(s).color, mark: tgt,
        text: `${fmtNum(avg(l))} · ${l.length} note${l.length > 1 ? 's' : ''}${tr != null ? ` · ${tr >= 0 ? '↗ +' : '↘ −'}${fmtNum(Math.abs(tr))}` : ''}` };
    });
    const w = isDS ? weighted(dsAverages(from)) : null;
    root.append(h('section.card',
      h('header.card-head', h('h2', 'Moyennes par matière'),
        h('span.muted', isDS ? `Générale ${fmtNum(avg(done))} · pondérée concours ${fmtNum(w)}` : `Générale ${fmtNum(avg(done))}`)),
      hbars(rows, { max: 20 }),
      isDS && rows.some((r) => r.mark != null) ? h('p.chart-note', '▏ objectif moyen que tu t’étais fixé') : null));

    const series = subs.map(([s, l]) => ({ name: s, short: subj(s).short, color: subj(s).color, points: l.map((x) => ({ date: x.date, y: x.grade, label: x.topic || x.examiner })) }));
    root.append(h('section.card', h('h2', 'Évolution'), lineChart(series)));
  }

  // ----- Colleurs -----
  if (!isDS && done.length) {
    const by = new Map();
    for (const k of graded(state.kholles, '0000')) if (k.examiner) (by.get(k.examiner) || by.set(k.examiner, []).get(k.examiner)).push(k);
    const nextBy = new Map(upcoming(state.kholles).map((k) => [k.examiner, k]).reverse());
    root.append(h('section.card', h('header.card-head', h('h2', 'Par colleur'), h('span.muted', 'Pour savoir à quoi t’attendre avant d’entrer')),
      h('div.table-wrap', h('table',
        h('thead', h('tr', h('th', 'Colleur'), h('th', 'Matière'), h('th.num', 'Notes'), h('th.num', 'Moyenne'), h('th', 'Prochain passage'))),
        h('tbody', [...by.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, l]) => h('tr',
          h('td', name), h('td', subjTag(l[0].subject)), h('td.num', l.map((x) => fmtNum(x.grade)).join(' · ')),
          h('td.num', h('b.' + gradeClass(avg(l)), fmtNum(avg(l)))),
          h('td', nextBy.get(name) ? fmtDate(nextBy.get(name).date) : '—'))))))));
  }

  // ----- À venir -----
  const next = upcoming(list);
  if (next.length) {
    root.append(h('section.card', h('header.card-head', h('h2', 'À venir'), h('span.muted', `${next.length} ${isDS ? 'DS' : 'khôlles'} d’ici le concours`)),
      next.slice(0, 8).map((x) => line(x, isDS, edit)),
      next.length > 8 ? h('a.link', { href: '#/agenda' }, `Voir les ${next.length - 8} suivants dans l’agenda →`) : null));
  }

  // ----- Historique -----
  const hist = [...done].sort((a, b) => b.date.localeCompare(a.date));
  if (hist.length) root.append(h('section.card', h('h2', 'Historique'), hist.map((x) => line(x, isDS, edit))));
  if (!list.length) root.append(empty(isDS ? 'Entre ton calendrier de DS : le site te prévient une semaine avant et suit tes notes par matière.' : 'Entre ton colloscope : tu verras tes moyennes par matière et par colleur.'));
}

function line(x, isDS, edit) {
  const t = today();
  const soon = x.grade == null && diffDays(x.date, t) <= (isDS ? 7 : 2);
  const delta = isDS && x.grade != null && x.targetGrade != null ? x.grade - x.targetGrade : null;
  return h('button.item-main.rowlike', { onclick: () => edit(x) },
    h('span.date', fmtDate(x.date), x.time ? h('small', ' ' + x.time.replace(':', ' h ')) : null),
    subjTag(x.subject),
    h('span.ellipsis', [isDS ? x.topic : x.examiner, isDS ? x.notes : x.topic || x.feedback].filter(Boolean).join(' — ')),
    h('span.grow'),
    x.grade == null
      ? h('span.pill' + (soon ? '.mid' : ''), fmtRel(x.date))
      : [delta != null ? h('small.' + (delta >= 0 ? 'good' : 'bad'), `${delta >= 0 ? '+' : '−'}${fmtNum(Math.abs(delta))} / objectif`) : null,
        isDS && x.classAvg != null ? h('small.muted', `classe ${fmtNum(x.classAvg)}`) : null,
        h('b.grade.' + gradeClass(x.grade), fmtNum(x.grade, 2))]);
}
