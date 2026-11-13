# Cockpit MP

Tableau de bord pour une année de MP (lycée Michelet, Vanves) : tout ce qu'il faut suivre d'ici les écrits, au même endroit, sans compte ni serveur.

## Ce que fait le site

- **Aujourd'hui** — compte à rebours jusqu'aux écrits, plan du jour (fiches à revoir, prochaine khôlle, prochain DS, tâches), moyennes, diagnostic tiré des données.
- **Tâches** — ajout rapide, charge de travail des sept prochains jours, report à demain.
- **Carnet d'erreurs** — fiches recto/verso avec photos et LaTeX, révision espacée sur sept niveaux, repérage des fiches à réécrire.
- **Notes** — DS et khôlles : moyennes par matière, tendance, écart à l'objectif, statistiques par colleur ; position dans la classe (moyenne, meilleure note, rang), analyse des points perdus par cause, plan de préparation en cinq étapes avant chaque DS.
- **Interro de cours** — tirage de points du programme à réciter comme en khôlle ; les points ratés ressortent en priorité.
- **Agenda** — mois, vacances de la zone C, export `.ics` vers le calendrier de l'iPad ou du téléphone.
- **Programme** — 103 chapitres de MP et de révisions de MPSI, chacun avec ses points de contrôle à cocher, notés de 0 à 4, avec rappel de ceux qui n'ont pas été revus.
- **Annales** — Mines-Ponts et Centrale-Supélec, maths et physique, sessions 2006 à 2025 : liens vers l'énoncé, le rapport du jury et un corrigé en ligne, suivi des épreuves faites et des notes ; liste de sites de DS et DM corrigés. Les sujets ne sont pas recopiés dans le dépôt.
- **Chrono** — Pomodoro, blocs de 50 minutes, épreuves de 2, 3 ou 4 heures ; temps par matière et par semaine.
- **Concours** — frise jusqu'aux écrits, simulateur de moyenne pondérée à coefficients modifiables.

## Données

Tout reste dans le navigateur (`localStorage` pour les données, `IndexedDB` pour les photos). Rien n'est envoyé sur Internet.
**Réglages → Exporter** produit un fichier JSON complet ; **Importer** le relit, ainsi que les sauvegardes de l'ancien « MPSI Cockpit » (version 3).

Ne dépose pas ta sauvegarde dans ce dépôt : elle contient tes notes et tes photos.

## Lancer le site

Aucune compilation. En local :

```sh
python3 -m http.server 8000
# puis http://localhost:8000
```

En ligne avec GitHub Pages : *Settings → Pages → Deploy from a branch*, racine du dépôt. Une fois ouvert en HTTPS, le site fonctionne hors connexion et peut être ajouté à l'écran d'accueil.

## À ajuster

- Les **coefficients** du simulateur (Centrale-Supélec par défaut) viennent de sites tiers : vérifie-les sur la notice officielle du concours.
- Les **vacances** (zone C, 2026-2027) et la liste des **chapitres** sont dans `js/data.js`.
- Après une modification des fichiers, incrémente `CACHE` dans `sw.js`.

## Organisation du code

```
index.html          coque de la page
css/app.css         styles, thèmes clair et sombre
js/app.js           navigation et rendu
js/store.js         état, migration des sauvegardes, photos
js/srs.js           répétition espacée
js/stats.js         moyennes, tendances, diagnostic
js/charts.js        graphiques SVG
js/data.js          programme, vacances, coefficients
js/views/           une page par fichier (annales.js : liste des épreuves et des liens)
vendor/katex/       rendu LaTeX (embarqué)
```
