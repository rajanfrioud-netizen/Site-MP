// Données de référence : programme de MP (réforme 2021), vacances zone C, coefficients indicatifs.

const ch = (prefix, titles) => titles.map((t, i) => ({ id: `${prefix}-${String(i + 1).padStart(2, '0')}`, title: t }));

/** Chapitres par matière, regroupés en blocs. Les identifiants sont stables. */
export const PROGRAMME = [
  {
    subject: 'Mathématiques',
    blocks: [
      { name: 'Algèbre (MP)', chapters: ch('mp-alg', [
        'Groupes, sous-groupes, ordre d’un élément',
        'Anneaux, idéaux, ℤ/nℤ, arithmétique des polynômes',
        'Compléments d’algèbre linéaire : sommes, sous-espaces stables, matrices par blocs',
        'Éléments propres, polynôme caractéristique',
        'Diagonalisation et trigonalisation',
        'Polynômes d’endomorphismes, lemme des noyaux, Cayley-Hamilton',
        'Endomorphismes nilpotents, sous-espaces caractéristiques',
        'Espaces préhilbertiens : projection orthogonale, familles orthonormées',
        'Endomorphismes des espaces euclidiens : isométries, matrices orthogonales',
        'Endomorphismes autoadjoints, théorème spectral, positivité',
      ]) },
      { name: 'Analyse (MP)', chapters: ch('mp-ana', [
        'Espaces vectoriels normés : normes, suites, équivalence',
        'Topologie : ouverts, fermés, adhérence, intérieur',
        'Limites et continuité, applications linéaires continues',
        'Compacité, connexité par arcs, dimension finie',
        'Séries numériques et vectorielles (compléments)',
        'Familles sommables, produit de Cauchy',
        'Suites et séries de fonctions : CVS, CVU, CVN, interversions',
        'Séries entières : rayon, régularité, développements usuels',
        'Fonctions vectorielles, arcs paramétrés',
        'Intégrales généralisées, intégrabilité',
        'Convergence dominée, intégration terme à terme',
        'Intégrales à paramètre : continuité, dérivation',
        'Équations différentielles linéaires',
        'Calcul différentiel : différentielle, classe 𝒞¹, règle de la chaîne',
        'Optimisation : points critiques, ordre 2, extrema sous contrainte',
      ]) },
      { name: 'Probabilités (MP)', chapters: ch('mp-pro', [
        'Espaces probabilisés, dénombrabilité, conditionnement',
        'Variables aléatoires discrètes, lois usuelles',
        'Espérance, variance, covariance, inégalités',
        'Fonctions génératrices, loi faible des grands nombres',
      ]) },
      { name: 'Révisions de MPSI', chapters: ch('sup-ma', [
        'Calculs : sommes, trigonométrie, complexes, inégalités',
        'Suites réelles, développements limités, équivalents',
        'Continuité, dérivation, convexité, Taylor',
        'Intégration sur un segment, primitives',
        'Polynômes et fractions rationnelles',
        'Espaces vectoriels, applications linéaires, dimension',
        'Matrices, déterminants, systèmes',
        'Arithmétique, dénombrement',
        'Probabilités sur un univers fini',
      ]) },
    ],
  },
  {
    subject: 'Physique-Chimie',
    blocks: [
      { name: 'Mécanique', chapters: ch('mp-mec', [
        'Référentiels non galiléens, forces d’inertie',
        'Lois du frottement solide (Coulomb)',
      ]) },
      { name: 'Traitement du signal', chapters: ch('mp-sig', [
        'Signaux périodiques, filtrage linéaire',
        'Électronique numérique : échantillonnage, filtrage numérique',
      ]) },
      { name: 'Optique ondulatoire', chapters: ch('mp-opt', [
        'Modèle scalaire, chemin optique, cohérence',
        'Interférences à deux ondes, trous d’Young',
        'Interféromètre de Michelson',
      ]) },
      { name: 'Électromagnétisme', chapters: ch('mp-em', [
        'Électrostatique : Gauss, potentiel, dipôle, condensateur',
        'Magnétostatique : Ampère, dipôle magnétique',
        'Équations de Maxwell, ARQS',
        'Énergie électromagnétique, vecteur de Poynting',
        'Ondes électromagnétiques dans le vide, polarisation',
        'Ondes dans un plasma et un conducteur, dispersion',
        'Réflexion sur un conducteur parfait, cavité',
        'Rayonnement dipolaire',
      ]) },
      { name: 'Thermodynamique et physique statistique', chapters: ch('mp-the', [
        'Systèmes ouverts en régime stationnaire, machines',
        'Diffusion thermique, résistance thermique',
        'Rayonnement thermique',
        'Facteur de Boltzmann, systèmes à niveaux discrets',
        'Capacités thermiques des gaz et des solides',
      ]) },
      { name: 'Physique quantique', chapters: ch('mp-qua', [
        'Fonction d’onde, équation de Schrödinger',
        'Particule libre, paquet d’ondes, inégalité de Heisenberg',
        'Puits de potentiel, états stationnaires',
        'Barrière de potentiel, effet tunnel',
      ]) },
      { name: 'Chimie', chapters: ch('mp-chi', [
        'Premier principe : enthalpie de réaction',
        'Deuxième principe : potentiel chimique, équilibres, optimisation',
        'Courbes courant-potentiel',
        'Corrosion, piles, électrolyse',
      ]) },
      { name: 'Révisions de MPSI', chapters: ch('sup-ph', [
        'Électrocinétique, filtres, régimes transitoires',
        'Mécanique du point, énergie, forces centrales',
        'Mécanique du solide, moment cinétique',
        'Optique géométrique',
        'Thermodynamique : principes, machines thermiques',
        'Induction, forces de Laplace',
        'Ondes, propagation',
        'Chimie : cinétique, cristallographie, acide-base, oxydoréduction, précipitation',
      ]) },
    ],
  },
  {
    subject: 'Sciences Industrielles',
    blocks: [
      { name: 'Programme', chapters: ch('mp-si', [
        'Cinématique, liaisons, loi entrée-sortie',
        'Statique, actions mécaniques',
        'Cinétique et dynamique : PFD',
        'Énergétique : puissances, théorème de l’énergie cinétique',
        'Modélisation des SLCI, schémas-blocs',
        'Stabilité, marges, précision, rapidité',
        'Correction : P, PI, avance de phase',
        'Systèmes à événements discrets, diagrammes d’états',
      ]) },
    ],
  },
  {
    subject: 'Informatique',
    blocks: [
      { name: 'Tronc commun', chapters: ch('mp-inf', [
        'Python : boucles, listes, complexité, terminaison',
        'Récursivité, tris, diviser pour régner',
        'Graphes : parcours, plus courts chemins',
        'Dictionnaires, programmation dynamique',
        'Algorithmes gloutons',
        'Bases de données, SQL',
        'Algorithmes pour l’IA : k plus proches voisins, k-moyennes',
        'Théorie des jeux : min-max, jeux d’accessibilité',
      ]) },
    ],
  },
  {
    subject: 'Français-Philosophie',
    blocks: [
      { name: 'Méthode et œuvres', chapters: ch('mp-fr', [
        'Méthode du résumé', 'Méthode de la dissertation',
        'Œuvre 1 : lecture, fiche, citations', 'Œuvre 2 : lecture, fiche, citations', 'Œuvre 3 : lecture, fiche, citations',
        'Problématiques du thème, exemples croisés',
      ]) },
    ],
  },
  {
    subject: 'Anglais',
    blocks: [
      { name: 'Épreuves', chapters: ch('mp-an', [
        'Synthèse de documents', 'Version, thème', 'Expression écrite, essai', 'Vocabulaire et civilisation', 'Oral : commentaire de document',
      ]) },
    ],
  },
];

export const LEVELS = ['Pas vu', 'Vu en cours', 'Cours su', 'Exos maîtrisés', 'Prêt concours'];

/** Vacances scolaires, zone C (académie de Versailles) — fin exclue = jour de reprise. */
export const VACANCES = [
  { name: 'Toussaint', start: '2026-10-17', end: '2026-11-02' },
  { name: 'Noël', start: '2026-12-19', end: '2027-01-04' },
  { name: 'Hiver', start: '2027-02-06', end: '2027-02-22' },
  { name: 'Printemps', start: '2027-04-03', end: '2027-04-19' },
];
export const vacanceOf = (d) => VACANCES.find((v) => d >= v.start && d < v.end);

/**
 * Coefficients d'écrit par matière — ordre de grandeur pour la filière MP,
 * à ajuster d'après la notice officielle du concours visé.
 */
export const COEF_PRESETS = {
  'Mines-Ponts (indicatif)': { 'Mathématiques': 9, 'Physique-Chimie': 9, 'Français-Philosophie': 5, 'Anglais': 3, 'Informatique': 2, 'Sciences Industrielles': 0 },
  'Tout à égalité': { 'Mathématiques': 1, 'Physique-Chimie': 1, 'Français-Philosophie': 1, 'Anglais': 1, 'Informatique': 1, 'Sciences Industrielles': 1 },
};
export const COEF_SUBJECTS = Object.keys(COEF_PRESETS['Tout à égalité']);

export const TASK_TYPES = ['TD', 'Cours', 'DM', 'Révisions', 'Annale', 'Khôlle', 'TIPE', 'Autre'];
export const PRIORITIES = ['Haute', 'Moyenne', 'Basse'];
