// Répétition espacée des fiches d'erreurs (boîtes de Leitner à 7 niveaux).
import { today, addDays, diffDays } from './util.js';

export const INTERVALS = [1, 3, 7, 14, 30, 60, 120]; // jours avant la prochaine révision, par niveau
export const MAX_LEVEL = INTERVALS.length - 1;

export const RATINGS = [
  { id: 'again', label: 'Raté', key: '1', cls: 'bad' },
  { id: 'hard', label: 'Hésitant', key: '2', cls: 'mid' },
  { id: 'good', label: 'Su', key: '3', cls: 'good' },
  { id: 'easy', label: 'Facile', key: '4', cls: 'easy' },
];

/** Calcule l'état suivant d'une fiche sans la modifier. */
export function next(card, rating, on = today()) {
  let level = card.srsLevel || 0;
  let lapses = card.lapses || 0;
  let days;
  if (rating === 'again') {
    lapses++;
    level = Math.max(0, level - 2);
    days = 1;
  } else if (rating === 'hard') {
    days = Math.max(1, Math.round(INTERVALS[level] * 0.5)); // même niveau, délai raccourci
  } else {
    level = Math.min(MAX_LEVEL, level + (rating === 'easy' ? 2 : 1));
    days = INTERVALS[level];
  }
  // Une erreur « Critique » revient un peu plus vite.
  if (card.gravity === 'Critique' && days > 2) days = Math.round(days * 0.8);
  return { srsLevel: level, lapses, reps: (card.reps || 0) + 1, lastReview: on, nextReview: addDays(on, days), days };
}

export const isDue = (c, on = today()) => !c.nextReview || c.nextReview <= on;

/** Fiches à revoir, les plus urgentes d'abord : critiques, puis les plus en retard. */
export function dueQueue(cards, on = today()) {
  return cards
    .filter((c) => isDue(c, on))
    .sort((a, b) =>
      (b.gravity === 'Critique') - (a.gravity === 'Critique') ||
      diffDays(a.nextReview || on, b.nextReview || on) ||
      (b.lapses || 0) - (a.lapses || 0));
}

/** Fiche « sangsue » : ratée souvent, elle mérite d'être réécrite plutôt que re-révisée. */
export const isLeech = (c) => (c.lapses || 0) >= 4 && (c.srsLevel || 0) <= 1;

/** Fiche trop vague pour être utile (« Apprendre », réponse vide…). */
export function isVague(c) {
  const r = (c.remedy || '').trim().toLowerCase();
  const noAnswer = !r && !c.hasBack;
  const lazy = /^(apprendre|à apprendre|voir .*|tout apprendre)\.?$/.test(r) && !c.hasBack;
  return noAnswer || lazy;
}

export function levelLabel(l) {
  return l >= 5 ? 'Acquise' : l >= 3 ? 'En consolidation' : l >= 1 ? 'En apprentissage' : 'Nouvelle / ratée';
}
