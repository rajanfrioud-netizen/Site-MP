// Données de référence : programme de MP (réforme 2021), vacances zone C, coefficients indicatifs.

// Chaque chapitre : [intitulé, [points à savoir restituer sans notes]].
const ch = (prefix, list) => list.map(([title, points], i) => ({ id: `${prefix}-${String(i + 1).padStart(2, '0')}`, title, points: points || [] }));

/** Chapitres par matière, regroupés en blocs. Les identifiants sont stables. */
export const PROGRAMME = [
  {
    subject: 'Mathématiques',
    blocks: [
      { name: 'Algèbre (MP)', chapters: ch('mp-alg', [
        ['Groupes', ['Sous-groupe engendré par une partie, sous-groupes de ℤ', 'Morphismes : noyau, image, isomorphisme', 'Groupe ℤ/nℤ, générateurs', 'Groupes monogènes et cycliques : classification', 'Ordre d’un élément ; il divise le cardinal du groupe']],
        ['Anneaux, idéaux, arithmétique', ['Anneau produit, sous-anneau, morphisme d’anneaux', 'Idéal, noyau d’un morphisme, idéaux de ℤ et de 𝕂[X]', 'Anneau ℤ/nℤ : inversibles, corps si n premier', 'Théorème chinois, indicatrice d’Euler, théorème d’Euler', 'PGCD, Bézout, Gauss dans 𝕂[X] ; polynômes irréductibles de ℂ[X] et ℝ[X]', 'Algèbres, sous-algèbres, morphismes d’algèbres']],
        ['Compléments d’algèbre linéaire', ['Somme et somme directe de plusieurs sous-espaces, base adaptée', 'Matrices par blocs, déterminant triangulaire par blocs', 'Sous-espace stable, endomorphisme induit, traduction matricielle', 'Matrices semblables, trace d’un endomorphisme', 'Polynômes de Lagrange, déterminant de Vandermonde']],
        ['Éléments propres et polynôme caractéristique', ['Valeur propre, vecteur propre, sous-espace propre, spectre', 'Les sous-espaces propres sont en somme directe', 'Polynôme caractéristique : degré, coefficients, lien avec trace et déterminant', 'Multiplicité d’une valeur propre et dimension du sous-espace propre', 'Si u et v commutent, les sous-espaces propres de u sont stables par v']],
        ['Diagonalisation et trigonalisation', ['Définitions et caractérisations de la diagonalisabilité (somme des dimensions, χ scindé et multiplicités)', 'Cas de n valeurs propres distinctes', 'Trigonalisable si et seulement si χ est scindé ; toujours sur ℂ', 'Trace et déterminant en fonction des valeurs propres', 'Méthode pratique : diagonaliser, calculer Aⁿ, résoudre une récurrence linéaire']],
        ['Polynômes d’endomorphismes', ['Polynôme d’un endomorphisme, idéal annulateur, polynôme minimal', 'Les valeurs propres sont racines de tout polynôme annulateur', 'Lemme de décomposition des noyaux (énoncé et démonstration)', 'Diagonalisable si et seulement si annulé par un polynôme scindé à racines simples', 'Théorème de Cayley-Hamilton', 'Endomorphisme induit sur un sous-espace stable d’un diagonalisable']],
        ['Nilpotents et sous-espaces caractéristiques', ['Endomorphisme nilpotent, indice, majoration par la dimension', 'Nilpotent si et seulement si trigonalisable de seule valeur propre 0', 'Sous-espaces caractéristiques, décomposition de E quand χ est scindé', 'Réduction par blocs « λI + nilpotent »']],
        ['Espaces préhilbertiens et euclidiens', ['Produit scalaire, Cauchy-Schwarz, norme euclidienne, identités de polarisation', 'Orthogonal d’une partie, familles orthonormées, Gram-Schmidt', 'Projection orthogonale sur un sous-espace de dimension finie, distance, inégalité de Bessel', 'Supplémentaire orthogonal, représentation des formes linéaires']],
        ['Isométries et matrices orthogonales', ['Adjoint d’un endomorphisme, matrice dans une base orthonormée', 'Isométrie vectorielle : caractérisations, groupe O(E)', 'Matrices orthogonales, Oₙ(ℝ) et SOₙ(ℝ), orientation', 'Classification en dimension 2 ; rotations en dimension 3 (axe, angle)', 'Réduction d’une isométrie en base orthonormée']],
        ['Endomorphismes autoadjoints', ['Endomorphisme autoadjoint, matrice symétrique en base orthonormée', 'Théorème spectral (énoncé, démonstration, version matricielle)', 'Autoadjoints positifs et définis positifs : caractérisation par le spectre', 'Stabilité de l’orthogonal d’un sous-espace stable', 'Utilisation : quotient de Rayleigh, racine carrée d’une matrice symétrique positive']],
      ]) },
      { name: 'Analyse (MP)', chapters: ch('mp-ana', [
        ['Normes et espaces vectoriels normés', ['Norme, distance, boules, parties bornées, convexité des boules', 'Normes usuelles sur 𝕂ⁿ et sur les espaces de fonctions', 'Suites : convergence, valeurs d’adhérence, suites extraites', 'Normes équivalentes : définition, montrer que deux normes ne le sont pas']],
        ['Topologie d’un espace normé', ['Ouvert, fermé, voisinage ; stabilité par union et intersection', 'Intérieur, adhérence, frontière, densité', 'Caractérisation séquentielle des fermés et de l’adhérence', 'Topologie induite sur une partie']],
        ['Limites et continuité', ['Limite en un point adhérent, caractérisation séquentielle', 'Continuité, image réciproque d’un ouvert ou d’un fermé', 'Fonctions lipschitziennes, continuité uniforme', 'Application linéaire continue : critère ‖u(x)‖ ≤ C‖x‖, norme subordonnée', 'Applications multilinéaires et polynomiales continues']],
        ['Compacité, connexité par arcs, dimension finie', ['Compact par Bolzano-Weierstrass ; un compact est fermé borné', 'Image continue d’un compact, théorème des bornes atteintes, Heine', 'Connexité par arcs, image continue, théorème des valeurs intermédiaires', 'En dimension finie : équivalence des normes, compacts = fermés bornés', 'En dimension finie : toute application linéaire est continue, tout sous-espace est fermé']],
        ['Séries numériques et vectorielles', ['Convergence absolue implique convergence en dimension finie', 'Règle de d’Alembert, comparaison série-intégrale', 'Critère des séries alternées, majoration du reste', 'Sommation des relations de comparaison (restes, sommes partielles)', 'Formule de Stirling, développements asymptotiques de sommes']],
        ['Familles sommables', ['Ensembles dénombrables, exemples et contre-exemples', 'Famille sommable de réels positifs, puis de complexes', 'Sommation par paquets', 'Théorème de Fubini pour les séries doubles', 'Produit de Cauchy de deux séries absolument convergentes']],
        ['Suites et séries de fonctions', ['Convergence simple, uniforme, normale : définitions et implications', 'Continuité de la limite, théorème de la double limite', 'Interversion limite-intégrale sur un segment', 'Dérivation de la limite, extension à la classe 𝒞ᵏ', 'Méthodes pour prouver ou réfuter la convergence uniforme', 'Approximation uniforme : fonctions en escalier, théorème de Weierstrass']],
        ['Séries entières', ['Lemme d’Abel, rayon de convergence, disque ouvert de convergence', 'Calcul du rayon : d’Alembert, comparaison, somme et produit', 'Convergence normale sur tout compact du disque ouvert, continuité', 'Dérivation et intégration terme à terme, unicité du développement', 'Développements usuels : exp, cos, sin, ch, sh, ln(1+x), (1+x)^α, Arctan', 'Développer une fonction en série entière (équation différentielle, Taylor)']],
        ['Fonctions vectorielles et arcs paramétrés', ['Dérivabilité, opérations, dérivée de B(f, g) pour B bilinéaire', 'Intégrale sur un segment, inégalité triangulaire, sommes de Riemann', 'Inégalité des accroissements finis, formules de Taylor', 'Arc paramétré : point régulier, tangente']],
        ['Intégrales généralisées', ['Intégrale convergente sur un intervalle quelconque, intégrales de référence', 'Intégrabilité (convergence absolue), théorème de comparaison', 'Intégration par parties et changement de variable généralisés', 'Intégration des relations de comparaison', 'Exemple classique d’intégrale semi-convergente']],
        ['Convergence dominée et intégration terme à terme', ['Théorème de convergence dominée (hypothèses précises)', 'Extension à un paramètre continu', 'Intégration terme à terme d’une série de fonctions (hypothèse sur ∑∫|fₙ|)', 'Stratégie quand l’hypothèse échoue : convergence dominée sur les sommes partielles']],
        ['Intégrales à paramètre', ['Théorème de continuité sous le signe intégrale (domination locale)', 'Théorème de dérivation sous le signe intégrale, classe 𝒞ᵏ', 'Fonction Γ : définition, relation fonctionnelle, régularité', 'Limites et équivalents aux bornes du domaine']],
        ['Équations différentielles linéaires', ['Système X′ = A(t)X + B(t), théorème de Cauchy linéaire', 'Structure de l’ensemble des solutions, dimension, wronskien', 'Exponentielle d’une matrice, systèmes à coefficients constants', 'Méthode de variation des constantes', 'Équation scalaire d’ordre 2 : recherche de solutions (séries entières, abaissement de l’ordre)']],
        ['Calcul différentiel', ['Dérivée selon un vecteur, dérivées partielles', 'Différentielle en un point, lien avec les dérivées partielles, matrice jacobienne', 'Différentielle d’une composée, règle de la chaîne', 'Classe 𝒞¹ : caractérisation par les dérivées partielles', 'Gradient ; vecteurs tangents à une partie, à une ligne de niveau']],
        ['Optimisation', ['Point critique, condition nécessaire d’extremum local sur un ouvert', 'Existence d’un extremum par compacité', 'Classe 𝒞², théorème de Schwarz, matrice hessienne, Taylor-Young à l’ordre 2', 'Conditions d’ordre 2 : hessienne définie positive, cas de la dimension 2', 'Optimisation sous contrainte : condition de colinéarité des gradients']],
      ]) },
      { name: 'Probabilités (MP)', chapters: ch('mp-pro', [
        ['Espaces probabilisés', ['Tribu, probabilité, continuité croissante et décroissante, sous-additivité', 'Événements négligeables et presque sûrs', 'Probabilité conditionnelle, probabilités composées et totales, Bayes', 'Indépendance d’événements, d’une famille d’événements']],
        ['Variables aléatoires discrètes', ['Loi d’une variable, loi conjointe, lois marginales, loi conditionnelle', 'Indépendance de variables, lemme des coalitions', 'Lois géométrique et de Poisson : loi, espérance, variance, interprétation', 'Approximation de la loi binomiale par la loi de Poisson']],
        ['Espérance, variance, inégalités', ['Espérance : définition, linéarité, positivité, formule de transfert', 'Espérance d’un produit de variables indépendantes', 'Variance, écart-type, covariance, variance d’une somme', 'Inégalités de Markov, de Bienaymé-Tchebychev, de Cauchy-Schwarz', 'Loi faible des grands nombres']],
        ['Fonctions génératrices', ['Définition, rayon ≥ 1, la fonction génératrice caractérise la loi', 'Lien avec l’espérance et la variance (dérivées en 1)', 'Fonction génératrice d’une somme de variables indépendantes', 'Fonctions génératrices des lois usuelles']],
      ]) },
      { name: 'Révisions de MPSI', chapters: ch('sup-ma', [
        ['Calculs, complexes, trigonométrie', ['Sommes et produits, binôme, sommes télescopiques et géométriques', 'Formules de trigonométrie, linéarisation, factorisation par l’angle moitié', 'Racines n-ièmes, exponentielle complexe', 'Inégalités classiques, manipulation de valeurs absolues']],
        ['Suites, développements limités, équivalents', ['Théorèmes de convergence : monotone, encadrement, suites adjacentes', 'Suites récurrentes uₙ₊₁ = f(uₙ)', 'Développements limités usuels à connaître par cœur', 'Opérations sur les équivalents : ce qui est permis, ce qui ne l’est pas', 'Développement asymptotique d’une suite définie implicitement']],
        ['Continuité, dérivation, convexité', ['TVI, théorème des bornes atteintes, bijection continue', 'Rolle, accroissements finis, limite de la dérivée', 'Formules de Taylor (reste intégral, Lagrange, Young)', 'Fonctions convexes : inégalités de pente, de Jensen, position par rapport aux tangentes']],
        ['Intégration sur un segment', ['Primitives usuelles, intégration par parties, changement de variable', 'Sommes de Riemann', 'Fractions rationnelles simples, règles de Bioche', 'Inégalités sur les intégrales, Cauchy-Schwarz']],
        ['Polynômes et fractions rationnelles', ['Division euclidienne, racines et multiplicité, formule de Taylor', 'Relations coefficients-racines', 'Factorisation dans ℂ[X] et ℝ[X]', 'Décomposition en éléments simples', 'Polynômes classiques : Lagrange, Tchebychev']],
        ['Espaces vectoriels et applications linéaires', ['Famille libre, génératrice, base, dimension, théorème de la base incomplète', 'Théorème du rang, formule de Grassmann', 'Projecteurs et symétries', 'Formes linéaires, hyperplans']],
        ['Matrices, déterminants, systèmes', ['Changement de base, matrices équivalentes et semblables, rang', 'Déterminant : propriétés, développement, opérations élémentaires', 'Inversion d’une matrice, pivot de Gauss', 'Trace, transposition']],
        ['Arithmétique et dénombrement', ['Division euclidienne, PGCD, Bézout, Gauss dans ℤ', 'Nombres premiers, petit théorème de Fermat', 'Arrangements, combinaisons, formules sur les coefficients binomiaux']],
        ['Probabilités sur un univers fini', ['Lois uniforme, de Bernoulli, binomiale', 'Espérance, variance, indépendance', 'Formule des probabilités totales, Bayes']],
      ]) },
    ],
  },
  {
    subject: 'Physique-Chimie',
    blocks: [
      { name: 'Mécanique', chapters: ch('mp-mec', [
        ['Changements de référentiel', ['Référentiel en translation, en rotation uniforme autour d’un axe fixe', 'Composition des vitesses, vitesse d’entraînement', 'Composition des accélérations : entraînement et Coriolis']],
        ['Dynamique en référentiel non galiléen', ['Forces d’inertie d’entraînement et de Coriolis', 'Lois de la dynamique et théorèmes énergétiques avec les forces d’inertie', 'Énergie potentielle centrifuge', 'Référentiel terrestre : poids, déviation vers l’est, marées (qualitatif)']],
        ['Lois du frottement solide', ['Lois de Coulomb : glissement et non-glissement', 'Méthode : faire une hypothèse, résoudre, vérifier', 'Puissance des actions de contact, bilan énergétique']],
      ]) },
      { name: 'Traitement du signal', chapters: ch('mp-sig', [
        ['Signaux périodiques et filtrage', ['Décomposition en série de Fourier, spectre, valeur moyenne et efficace', 'Action d’un filtre linéaire sur un signal périodique', 'Caractère intégrateur, dérivateur, moyenneur d’un filtre', 'Diagrammes de Bode des filtres d’ordre 1 et 2']],
        ['Électronique numérique', ['Échantillonnage, critère de Nyquist-Shannon', 'Repliement de spectre, filtre anti-repliement', 'Analyse spectrale numérique : résolution et durée d’acquisition', 'Filtrage numérique : équation de récurrence d’un passe-bas']],
      ]) },
      { name: 'Optique ondulatoire', chapters: ch('mp-opt', [
        ['Modèle scalaire de la lumière', ['Chemin optique, retard de phase, surfaces d’onde, théorème de Malus', 'Onde plane, onde sphérique, effet d’une lentille', 'Trains d’onde, temps et longueur de cohérence, largeur spectrale', 'Éclairement, détecteurs']],
        ['Interférences à deux ondes', ['Conditions de cohérence, formule de Fresnel', 'Différence de marche, ordre d’interférence, contraste', 'Interférences constructives et destructives']],
        ['Trous d’Young', ['Calcul de la différence de marche, interfrange', 'Montage avec lentilles', 'Source étendue : brouillage, cohérence spatiale', 'Source non monochromatique : cohérence temporelle, lumière blanche']],
        ['Interféromètre de Michelson', ['Schéma équivalent : lame d’air, coin d’air', 'Lame d’air : anneaux d’égale inclinaison, localisation à l’infini', 'Coin d’air : franges d’égale épaisseur, localisation sur les miroirs', 'Applications : doublet du sodium, mesure d’épaisseur ou d’indice']],
      ]) },
      { name: 'Électromagnétisme', chapters: ch('mp-em', [
        ['Électrostatique', ['Symétries et invariances d’une distribution de charges', 'Théorème de Gauss : fil, plan, sphère, cylindre', 'Potentiel, énergie potentielle, lien champ-potentiel, lignes de champ', 'Condensateur plan : champ, capacité, énergie', 'Dipôle électrostatique : potentiel, champ, actions subies', 'Analogie avec la gravitation']],
        ['Magnétostatique', ['Symétries du champ magnétique (pseudo-vecteur)', 'Théorème d’Ampère : fil, solénoïde, tore', 'Flux conservatif, lignes de champ', 'Dipôle magnétique : moment, champ, actions subies']],
        ['Équations de Maxwell', ['Les quatre équations locales et leurs formes intégrales', 'Conservation de la charge', 'Relations de passage', 'ARQS magnétique, lien avec l’induction']],
        ['Énergie du champ électromagnétique', ['Densité d’énergie, vecteur de Poynting', 'Équation locale de Poynting, bilan de puissance', 'Loi d’Ohm locale, effet Joule']],
        ['Ondes électromagnétiques dans le vide', ['Équation de d’Alembert', 'Structure de l’onde plane progressive monochromatique', 'Polarisation rectiligne et circulaire', 'Aspects énergétiques, valeurs moyennes']],
        ['Dispersion et absorption', ['Relation de dispersion, vitesse de phase, vitesse de groupe', 'Plasma : pulsation plasma, onde évanescente', 'Conducteur ohmique : effet de peau', 'Paquet d’ondes, étalement']],
        ['Réflexion sur un conducteur parfait', ['Réflexion en incidence normale, onde stationnaire', 'Courants surfaciques, pression de radiation (qualitatif)', 'Cavité à une dimension : modes propres']],
        ['Rayonnement dipolaire', ['Dipôle oscillant, zone de rayonnement', 'Structure du champ rayonné, anisotropie', 'Puissance rayonnée, diffusion Rayleigh (couleur du ciel)']],
      ]) },
      { name: 'Thermodynamique et physique statistique', chapters: ch('mp-the', [
        ['Systèmes ouverts en régime stationnaire', ['Premier et second principes pour un fluide en écoulement', 'Détendeur, turbine, compresseur, échangeur, tuyère', 'Lecture des diagrammes (log P, h), cycles de machines réelles']],
        ['Diffusion thermique', ['Loi de Fourier, flux thermique', 'Équation de la chaleur, bilan local avec ou sans terme source', 'Régime stationnaire : résistance thermique, associations', 'Loi de Newton aux interfaces, analogie électrique', 'Temps caractéristique de diffusion']],
        ['Rayonnement thermique', ['Corps noir, loi de Wien, loi de Stefan', 'Bilans radiatifs simples, effet de serre']],
        ['Facteur de Boltzmann', ['Atmosphère isotherme, poids de Boltzmann', 'Probabilité d’occupation d’un état, fonction de partition', 'Système à deux niveaux : énergie moyenne, capacité thermique']],
        ['Capacités thermiques', ['Théorème d’équipartition', 'Gaz parfait monoatomique et diatomique, gel des degrés de liberté', 'Solides : loi de Dulong et Petit']],
      ]) },
      { name: 'Physique quantique', chapters: ch('mp-qua', [
        ['Fonction d’onde et équation de Schrödinger', ['Densité de probabilité, normalisation', 'Équation de Schrödinger, états stationnaires', 'Relations de Planck-Einstein et de de Broglie']],
        ['Particule libre', ['Onde plane, relation de dispersion', 'Paquet d’ondes, vitesse de groupe', 'Inégalité de Heisenberg spatiale', 'Courant de probabilité']],
        ['Puits de potentiel', ['Puits infini : niveaux d’énergie, fonctions d’onde', 'Énergie de confinement et inégalité de Heisenberg', 'Puits fini : états liés, onde évanescente (qualitatif)']],
        ['Barrière de potentiel et effet tunnel', ['Marche de potentiel : coefficients de réflexion et de transmission', 'Barrière : probabilité de transmission, approximation de barrière épaisse', 'Applications : microscope à effet tunnel, radioactivité α', 'Double puits, oscillations entre deux états']],
      ]) },
      { name: 'Chimie', chapters: ch('mp-chi', [
        ['Premier principe appliqué à la chimie', ['État standard, enthalpie standard de réaction', 'Loi de Hess, enthalpies de formation', 'Température de flamme, transfert thermique d’une réaction monobare']],
        ['Deuxième principe appliqué à la chimie', ['Potentiel chimique, enthalpie libre', 'Enthalpie libre de réaction, sens d’évolution', 'Constante d’équilibre, relation de Van ’t Hoff', 'Optimisation d’un procédé : effet de T, de P, de la composition']],
        ['Courbes courant-potentiel', ['Lien entre courant et vitesse de réaction', 'Systèmes rapides et lents, surtension', 'Palier de diffusion, mur du solvant', 'Lecture : potentiel mixte, réactions possibles']],
        ['Corrosion, piles, électrolyse', ['Corrosion humide : uniforme et différentielle', 'Protection : anode sacrificielle, passivation, revêtement', 'Pile : tension à vide, tension en charge, capacité', 'Électrolyse et accumulateurs : tension seuil, rendement']],
      ]) },
      { name: 'Révisions de MPSI', chapters: ch('sup-ph', [
        ['Électrocinétique et filtres', ['Régimes transitoires d’ordre 1 et 2', 'Régime sinusoïdal forcé, impédances, résonance', 'Fonction de transfert, diagrammes de Bode']],
        ['Mécanique du point', ['Lois de Newton, théorèmes énergétiques', 'Oscillateurs', 'Forces centrales, lois de Kepler', 'Particule chargée dans un champ']],
        ['Mécanique du solide', ['Moment cinétique, moment d’inertie (unité : kg·m²)', 'Solide en rotation autour d’un axe fixe, pendule pesant', 'Énergie cinétique, lien travail-puissance']],
        ['Optique géométrique', ['Lois de Descartes, réflexion totale', 'Lentilles minces : constructions, relations de conjugaison', 'Instruments : loupe, lunette, œil']],
        ['Thermodynamique', ['Premier principe, transformations usuelles (isochore : W = 0 donc ΔU = Q)', 'Second principe, bilans d’entropie', 'Machines thermiques, rendement et efficacité', 'Changements d’état']],
        ['Induction', ['Flux, loi de Faraday, loi de Lenz', 'Auto-induction et induction mutuelle (u = L di₁/dt + M di₂/dt)', 'Forces de Laplace, conversion électromécanique']],
        ['Ondes', ['Onde progressive, onde stationnaire', 'Interférences, diffraction']],
        ['Chimie de première année', ['Cinétique : ordres, loi d’Arrhenius', 'Cristallographie : conditions de tangence, sites, compacité', 'Acide-base, précipitation', 'Oxydoréduction : nombres d’oxydation, couples de l’eau, Nernst, diagrammes E-pH', 'Lewis, mésomérie, tableau périodique']],
      ]) },
    ],
  },
  {
    subject: 'Sciences Industrielles',
    blocks: [
      { name: 'Programme', chapters: ch('mp-si', [
        ['Cinématique', ['Torseur cinématique, composition des mouvements', 'Liaisons usuelles, graphe de liaisons', 'Loi entrée-sortie, roulement sans glissement (V = Rω)']],
        ['Statique', ['Torseurs d’actions mécaniques, liaisons parfaites', 'Principe fondamental de la statique, stratégie d’isolement', 'Frottement, arc-boutement']],
        ['Cinétique et dynamique', ['Matrice d’inertie, théorème de Huygens', 'Torseurs cinétique et dynamique', 'Principe fondamental de la dynamique, choix de l’équation utile']],
        ['Énergétique', ['Puissances extérieures et intérieures', 'Théorème de l’énergie cinétique', 'Inertie équivalente, rendement']],
        ['Modélisation des SLCI', ['Schéma-bloc, fonction de transfert', 'Systèmes d’ordre 1 et 2 : réponses temporelles', 'Diagrammes de Bode']],
        ['Performances des systèmes asservis', ['Stabilité : marges de gain et de phase', 'Précision : erreur statique, classe', 'Rapidité, bande passante']],
        ['Correction', ['Correcteurs P, PI, à avance de phase', 'Réglage pour respecter un cahier des charges']],
        ['Systèmes à événements discrets', ['Diagrammes d’états', 'Chronogrammes']],
      ]) },
    ],
  },
  {
    subject: 'Informatique',
    blocks: [
      { name: 'Tronc commun', chapters: ch('mp-inf', [
        ['Bases de Python et complexité', ['Boucles, listes, chaînes, fonctions', 'Terminaison (variant) et correction (invariant)', 'Complexité temporelle et spatiale']],
        ['Récursivité et tris', ['Fonctions récursives, pile d’appels', 'Tri fusion, tri rapide, diviser pour régner']],
        ['Graphes', ['Représentations : matrice et listes d’adjacence', 'Parcours en largeur et en profondeur', 'Plus courts chemins : Dijkstra, A*']],
        ['Dictionnaires et programmation dynamique', ['Dictionnaires, principe du hachage', 'Mémoïsation', 'Programmation dynamique : sous-problèmes, relation de récurrence, reconstruction']],
        ['Algorithmes gloutons', ['Principe, exemples où le glouton est optimal ou non']],
        ['Bases de données', ['Modèle relationnel, clés', 'SQL : SELECT, WHERE, JOIN, GROUP BY, HAVING, agrégats']],
        ['Algorithmes pour l’intelligence artificielle', ['k plus proches voisins', 'k-moyennes', 'Matrice de confusion']],
        ['Théorie des jeux', ['Jeux d’accessibilité, positions gagnantes, attracteurs', 'Algorithme min-max, heuristique']],
      ]) },
    ],
  },
  {
    subject: 'Français-Philosophie',
    blocks: [
      { name: 'Méthode et œuvres', chapters: ch('mp-fr', [
        ['Méthode du résumé', ['Repérer la structure argumentative', 'Reformuler sans citer, respecter le nombre de mots']],
        ['Méthode de la dissertation', ['Analyser le sujet, problématiser', 'Plan dialectique, exemples précis tirés des trois œuvres']],
        ['Œuvre 1', ['Lue en entier', 'Fiche faite', 'Dix citations sues']],
        ['Œuvre 2', ['Lue en entier', 'Fiche faite', 'Dix citations sues']],
        ['Œuvre 3', ['Lue en entier', 'Fiche faite', 'Dix citations sues']],
        ['Problématiques du thème', ['Grandes questions du thème', 'Exemples croisés entre les œuvres']],
      ]) },
    ],
  },
  {
    subject: 'Anglais',
    blocks: [
      { name: 'Épreuves', chapters: ch('mp-an', [
        ['Synthèse de documents', ['Méthode, problématique, plan', 'Respect du nombre de mots']],
        ['Version et thème', ['Temps, modaux, faux amis']],
        ['Expression écrite', ['Structures d’argumentation, mots de liaison']],
        ['Vocabulaire et civilisation', ['Vocabulaire de l’actualité', 'Repères : institutions américaines et britanniques']],
        ['Oral', ['Présentation d’un document, commentaire structuré']],
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
/** Causes de points perdus dans un devoir, avec le remède correspondant. */
export const LOSS = [
  ['cours', 'Cours non su', 'Le cours se récite : fais une interro de cours sur ces chapitres avant le prochain devoir.'],
  ['methode', 'Méthode inconnue', 'Refais les exercices types du TD sans regarder la correction, et mets chaque méthode en fiche.'],
  ['calcul', 'Erreurs de calcul', 'Dix minutes de calcul chronométré par jour ; vérifie homogénéité et cas limites à chaque résultat.'],
  ['redaction', 'Rédaction, justification', 'Lis les rapports de jury : cite les théorèmes avec leurs hypothèses, encadre les résultats.'],
  ['temps', 'Manque de temps', 'Lis tout le sujet en 10 minutes, commence par ce que tu sais faire, entraîne-toi en temps limité.'],
  ['enonce', 'Énoncé mal lu', 'Souligne les hypothèses et ce qui est demandé ; relis la question avant de conclure.'],
];

export const COEF_PRESETS = {
  'Centrale-Supélec MP (à vérifier)': { 'Mathématiques': 38, 'Physique-Chimie': 24, 'Français-Philosophie': 17, 'Anglais': 11, 'Informatique': 0, 'Sciences Industrielles': 10 },
  'Mines-Ponts (indicatif)': { 'Mathématiques': 9, 'Physique-Chimie': 9, 'Français-Philosophie': 5, 'Anglais': 3, 'Informatique': 2, 'Sciences Industrielles': 0 },
  'Tout à égalité': { 'Mathématiques': 1, 'Physique-Chimie': 1, 'Français-Philosophie': 1, 'Anglais': 1, 'Informatique': 1, 'Sciences Industrielles': 1 },
};
export const COEF_SUBJECTS = Object.keys(COEF_PRESETS['Tout à égalité']);

export const TASK_TYPES = ['TD', 'Cours', 'DM', 'Révisions', 'Annale', 'Khôlle', 'TIPE', 'Autre'];
export const PRIORITIES = ['Haute', 'Moyenne', 'Basse'];
