// Rendu LaTeX (KaTeX embarqué, fonctionne hors ligne).
import { h } from './util.js';

function tex(src, display) {
  const span = document.createElement(display ? 'div' : 'span');
  if (display) span.className = 'math-block';
  let s = src.trim();
  // Les sauts de ligne « \\ » hors environnement ne passent pas en mode display.
  if (display && /\\\\/.test(s) && !/\\begin\{/.test(s)) s = `\\begin{gathered}${s}\\end{gathered}`;
  try {
    window.katex.render(s, span, { displayMode: display, throwOnError: true, strict: false });
  } catch {
    span.textContent = src;
    span.classList.add('math-raw');
  }
  return span;
}

/** Texte libre avec segments $…$ ou $$…$$ ; les retours à la ligne sont conservés. */
export function rich(text, cls = 'rich') {
  const el = h('div.' + cls);
  if (!text) return el;
  const parts = String(text).split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);
  for (const p of parts) {
    if (!p) continue;
    if (window.katex && p.startsWith('$$') && p.length > 4) el.append(tex(p.slice(2, -2), true));
    else if (window.katex && p.startsWith('$') && p.length > 2) el.append(tex(p.slice(1, -1), false));
    else el.append(p);
  }
  return el;
}

/** Champ « formule » : LaTeX avec ou sans $, ou simple texte (« V=R*omega »). */
export function formula(text) {
  const t = (text || '').trim();
  if (!t) return null;
  if (t.includes('$')) return rich(t, 'formula');
  if (window.katex && /\\[a-zA-Z]+|[_^]\{?/.test(t)) return h('div.formula', tex(t, true));
  return h('div.formula.plain', t);
}
