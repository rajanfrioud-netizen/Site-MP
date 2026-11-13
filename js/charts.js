// Graphiques SVG faits main : courbe de notes, barres, calendrier d'activité.
import { h, parse, fmtDate, fmtNum, addDays, today, weekStart } from './util.js';

const NS = 'http://www.w3.org/2000/svg';
function s(tag, attrs = {}, ...kids) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
  el.append(...kids.filter((k) => k != null));
  return el;
}

function tooltip(wrap) {
  const tip = h('div.tip', { hidden: true });
  wrap.append(tip);
  return {
    show(x, y, nodes) {
      tip.replaceChildren(...nodes);
      tip.hidden = false;
      const w = wrap.clientWidth;
      const tw = tip.offsetWidth;
      tip.style.left = Math.min(Math.max(4, x - tw / 2), w - tw - 4) + 'px';
      tip.style.top = Math.max(0, y - tip.offsetHeight - 12) + 'px';
    },
    hide() { tip.hidden = true; },
  };
}

export function legend(series) {
  return h('div.legend', series.map((x) => h('span', h('i.dot', { style: { background: x.color } }), x.name)));
}

/**
 * Courbe de notes sur 20. series: [{name,color,points:[{date,y,label}]}]
 * Une seule échelle (0–20), repère pointillé sur `ref` (10 par défaut).
 */
export function lineChart(series, { height = 240, ref = 10, refLabel = 'moyenne 10' } = {}) {
  series = series.filter((x) => x.points.length);
  const wrap = h('div.chart');
  if (!series.length) return h('div.empty', h('p', 'Pas encore de note à tracer.'));
  const W = innerWidth < 600 ? 400 : 720, H = height, m = { l: 26, r: 68, t: 12, b: 26 };
  const all = series.flatMap((x) => x.points);
  let t0 = Math.min(...all.map((p) => +parse(p.date)));
  let t1 = Math.max(...all.map((p) => +parse(p.date)));
  if (t1 - t0 < 14 * 864e5) { t0 -= 7 * 864e5; t1 += 7 * 864e5; }
  const X = (d) => m.l + ((+parse(d) - t0) / (t1 - t0)) * (W - m.l - m.r);
  const Y = (v) => m.t + (1 - v / 20) * (H - m.t - m.b);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Évolution des notes sur 20' });

  for (const g of [0, 5, 10, 15, 20]) {
    svg.append(s('line', { x1: m.l, x2: W - m.r, y1: Y(g), y2: Y(g), class: 'grid' }),
      s('text', { x: m.l - 6, y: Y(g) + 4, 'text-anchor': 'end', class: 'axis' }, String(g)));
  }
  if (ref != null) {
    svg.append(s('line', { x1: m.l, x2: W - m.r, y1: Y(ref), y2: Y(ref), class: 'refline' }));
  }
  // Graduations mensuelles
  const d = new Date(t0);
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  const span = (t1 - t0) / 864e5;
  const step = span > 500 ? 3 : span > 240 ? 2 : 1;
  for (let i = 0; +d <= t1; d.setMonth(d.getMonth() + 1), i++) {
    if (i % step) continue;
    const x = m.l + ((+d - t0) / (t1 - t0)) * (W - m.l - m.r);
    svg.append(s('text', { x, y: H - 6, 'text-anchor': 'middle', class: 'axis' },
      d.toLocaleDateString('fr-FR', { month: 'short' }) + (d.getMonth() === 0 ? ' ' + String(d.getFullYear()).slice(2) : '')));
  }

  const dots = [];
  const ends = [];
  for (const sr of series) {
    const pts = [...sr.points].sort((a, b) => a.date.localeCompare(b.date));
    svg.append(s('polyline', { points: pts.map((p) => `${X(p.date)},${Y(p.y)}`).join(' '), fill: 'none', stroke: sr.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    for (const p of pts) {
      const c = s('circle', { cx: X(p.date), cy: Y(p.y), r: 4, fill: sr.color, class: 'pt' });
      svg.append(c);
      dots.push({ x: X(p.date), y: Y(p.y), p, sr, c });
    }
    const last = pts.at(-1);
    ends.push({ y: Y(last.y), sr });
  }
  // Étiquettes directes en bout de courbe, écartées pour ne pas se chevaucher.
  ends.sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13;
  for (const e of ends) {
    svg.append(s('circle', { cx: W - m.r + 8, cy: e.y, r: 3.5, fill: e.sr.color }),
      s('text', { x: W - m.r + 15, y: e.y + 4, class: 'endlabel' }, e.sr.short || e.sr.name));
  }

  wrap.append(svg);
  const tip = tooltip(wrap);
  let active;
  const pick = (ev) => {
    const r = svg.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * W;
    const py = ((ev.clientY - r.top) / r.height) * H;
    let best, bd = 900;
    for (const d of dots) {
      const dist = (d.x - px) ** 2 + (d.y - py) ** 2;
      if (dist < bd) { bd = dist; best = d; }
    }
    active?.c.setAttribute('r', 4);
    active = best;
    if (!best) return tip.hide();
    best.c.setAttribute('r', 6);
    tip.show((best.x / W) * r.width, (best.y / H) * r.height, [
      h('b', fmtNum(best.p.y, 2) + ' / 20'),
      h('span', h('i.dot', { style: { background: best.sr.color } }), best.sr.name),
      h('span.muted', [fmtDate(best.p.date), best.p.label].filter(Boolean).join(' · ')),
    ]);
  };
  svg.addEventListener('pointermove', pick);
  svg.addEventListener('pointerdown', pick);
  svg.addEventListener('pointerleave', () => { active?.c.setAttribute('r', 4); active = null; tip.hide(); });
  if (series.length > 1) wrap.append(legend(series));
  if (ref != null) wrap.append(h('div.chart-note', '┄ ' + refLabel));
  return wrap;
}

/** Barres horizontales. rows: [{label, value, color, text, max}] */
export function hbars(rows, { max, unit = '' } = {}) {
  max ||= Math.max(1, ...rows.map((r) => r.value || 0));
  return h('div.hbars', rows.map((r) =>
    h('div.hbar', { title: `${r.label} : ${r.text ?? fmtNum(r.value)}${unit}` },
      h('span.hbar-label', r.label),
      h('span.hbar-track', h('i', { style: { width: Math.max(r.value ? 2 : 0, ((r.value || 0) / max) * 100) + '%', background: r.color || 'var(--accent)' } }),
        r.mark != null && h('b.hbar-mark', { style: { left: (r.mark / max) * 100 + '%' }, title: 'Objectif' })),
      h('span.hbar-val', r.text ?? fmtNum(r.value) + unit))));
}

/** Barres verticales empilées par catégorie. cols: [{label, parts:[{name,color,value}]}] */
export function stackedBars(cols, { height = 160, fmt = (v) => fmtNum(v) } = {}) {
  const wrap = h('div.chart');
  const W = innerWidth < 600 ? 400 : 720, H = height, m = { l: 44, r: 8, t: 10, b: 22 };
  const totals = cols.map((c) => c.parts.reduce((a, p) => a + p.value, 0));
  const max = Math.max(1, ...totals);
  const nice = Math.ceil(max / 60) * 60 || 60;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Temps de travail par semaine' });
  const Y = (v) => m.t + (1 - v / nice) * (H - m.t - m.b);
  for (const g of [0, nice / 2, nice]) {
    svg.append(s('line', { x1: m.l, x2: W - m.r, y1: Y(g), y2: Y(g), class: 'grid' }),
      s('text', { x: m.l - 6, y: Y(g) + 4, 'text-anchor': 'end', class: 'axis' }, fmt(g)));
  }
  const bw = (W - m.l - m.r) / cols.length;
  const tip = tooltip(wrap);
  cols.forEach((c, i) => {
    let acc = 0;
    const x = m.l + i * bw + bw * 0.2;
    const g = s('g', { class: 'bar' });
    c.parts.filter((p) => p.value > 0).forEach((p, j, arr) => {
      const y1 = Y(acc + p.value), y0 = Y(acc);
      g.append(s('rect', { x, y: y1 + (j < arr.length - 1 ? 2 : 0), width: bw * 0.6, height: Math.max(1, y0 - y1 - (j < arr.length - 1 ? 2 : 0)), rx: j === arr.length - 1 ? 4 : 0, fill: p.color }));
      acc += p.value;
    });
    g.append(s('rect', { x: m.l + i * bw, y: m.t, width: bw, height: H - m.t - m.b, fill: 'transparent' }));
    g.addEventListener('pointerenter', () => {
      const r = svg.getBoundingClientRect();
      tip.show(((x + bw * 0.3) / W) * r.width, (Y(totals[i]) / H) * r.height, [
        h('b', fmt(totals[i])), h('span.muted', c.title || c.label),
        ...c.parts.filter((p) => p.value > 0).map((p) => h('span', h('i.dot', { style: { background: p.color } }), `${p.name} · ${fmt(p.value)}`)),
      ]);
    });
    g.addEventListener('pointerleave', tip.hide);
    svg.append(g, s('text', { x: m.l + i * bw + bw / 2, y: H - 6, 'text-anchor': 'middle', class: 'axis' }, c.label));
  });
  wrap.append(svg);
  return wrap;
}

/** Calendrier d'activité sur n semaines (une case par jour). */
export function activityGrid(activity, weeks = 20) {
  const end = today();
  const start = addDays(weekStart(end), -7 * (weeks - 1));
  const grid = h('div.heat', { role: 'img', 'aria-label': 'Jours travaillés ces dernières semaines' });
  for (let w = 0; w < weeks; w++) {
    const col = h('div.heat-col');
    for (let d = 0; d < 7; d++) {
      const day = addDays(start, w * 7 + d);
      col.append(h('i' + (day > end ? '.future' : activity[day] ? '.on' : ''), { title: fmtDate(day) + (activity[day] ? ' — actif' : '') }));
    }
    grid.append(col);
  }
  return grid;
}
