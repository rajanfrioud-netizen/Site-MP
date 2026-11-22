import { state, save, importData, exportData, reset, counts } from '../store.js';
import { h, icon, today, fmtDate, fmtRel, toast } from '../util.js';
import { sendToWidget, copyScript, SCRIPT_URL } from '../widget.js';

export async function downloadBackup() {
  const data = await exportData();
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  h('a', { href: URL.createObjectURL(blob), download: `Cockpit_MP_${today()}.json` }).click();
  state.lastBackup = today();
  save({ touch: false });
  toast('Sauvegarde téléchargée');
}

/** Lit un fichier de sauvegarde et remplace les données. */
export async function importFile(f, after) {
  if (!f) return;
  toast('Lecture de la sauvegarde…');
  let raw;
  try {
    const text = (await f.text()).replace(/^\uFEFF/, '');
    raw = JSON.parse(text);
  } catch {
    alert(`« ${f.name} » n’est pas un fichier JSON lisible. Choisis le fichier exporté par le cockpit (par exemple MPSI_Cockpit_2026-11-12.json).`);
    return;
  }
  try {
    const c = counts();
    if ((c.ds || c.kholles || c.mistakes || c.tasks) && !confirm('Remplacer toutes les données actuelles par celles du fichier ?')) return;
    const r = await importData(raw);
    toast(`Importé : ${r.ds} DS, ${r.kholles} khôlles, ${r.mistakes} fiches (${r.images} photos), ${r.tasks} tâches`);
    if (r.imagesLost) alert(`${r.imagesLost} photo(s) n’ont pas pu être enregistrées : ce navigateur bloque le stockage (navigation privée ?). Le reste est importé.`);
    after?.();
  } catch (e) {
    alert('Import impossible : ' + (e.message || e));
  }
}

// Le sélecteur de fichier doit rester dans la page : Safari ignore un champ détaché
// et ne déclenche jamais « change ».
let picker;
export function importPicker(after) {
  picker?.remove();
  picker = h('input', { type: 'file', 'aria-hidden': 'true', tabindex: '-1', style: { position: 'fixed', left: '-1000px', top: '0', opacity: '0' } });
  picker.addEventListener('change', () => {
    const f = picker.files && picker.files[0];
    picker.value = '';
    importFile(f, after);
  });
  document.body.append(picker);
  picker.click();
}

/** Accepte aussi un fichier glissé-déposé sur la page. */
export function enableDrop(after) {
  if (enableDrop.done) return;
  enableDrop.done = true;
  window.addEventListener('dragover', (e) => { if ([...(e.dataTransfer?.types || [])].includes('Files')) e.preventDefault(); });
  window.addEventListener('drop', (e) => {
    const f = e.dataTransfer?.files?.[0];
    if (!f) return;
    e.preventDefault();
    importFile(f, after);
  });
}

export function applyTheme() {
  const t = state.settings.theme;
  if (t === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
}

export function reglages(root, _sub, rerender) {
  const s = state.settings;
  const field = (label, key, type = 'text', hint) => h('label.field', h('span', label),
    h('input', { type, value: s[key] ?? '', onchange: (e) => { s[key] = type === 'number' ? Math.max(1, +e.target.value || 1) : e.target.value; save({ touch: false, silent: true }); } }),
    hint && h('small', hint));
  const c = counts();

  root.append(h('header.page-head', h('h1', 'Réglages')),
    h('section.card', h('h2', 'Profil'), h('div.form',
      field('Prénom', 'name'), field('Classe', 'classe'), field('Lycée', 'lycee'),
      field('Concours visé', 'concoursName'), field('Premier jour des écrits', 'concoursDate', 'date', 'Vérifie la date sur le site du concours'),
      field('Début de la préparation', 'anneeDebut', 'date'),
      field('Fiches d’erreur par séance', 'reviewLimit', 'number', '20 par jour résorbent un retard sans y passer la soirée'))),

    h('section.card', h('h2', 'Apparence'),
      h('div.seg', [['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']].map(([v, l]) =>
        h('button' + (s.theme === v ? '.on' : ''), { onclick: () => { s.theme = v; applyTheme(); save({ touch: false }); } }, l)))),

    h('section.card', h('h2', 'Sauvegarde'),
      h('p.muted', `${c.ds} DS · ${c.kholles} khôlles · ${c.mistakes} fiches d’erreur · ${c.tasks} tâches. Tout est stocké dans ce navigateur, sur cet appareil uniquement : rien n’est envoyé sur Internet.`),
      h('p.muted', state.lastBackup ? `Dernière sauvegarde : ${fmtDate(state.lastBackup, { year: true })}.` : 'Aucune sauvegarde faite depuis ce site.'),
      h('div.row',
        h('button.btn.primary', { onclick: downloadBackup }, icon('download', 16), 'Exporter mes données'),
        h('button.btn', { onclick: () => importPicker(rerender) }, icon('upload', 16), 'Importer une sauvegarde')),
      h('p.muted', 'L’import accepte les fichiers de ce site et ceux de l’ancien « MPSI Cockpit ». Pour passer de l’ordinateur à l’iPad : exporte ici, importe là-bas.')),

    h('section.card', h('h2', 'Installer sur l’iPad ou le téléphone'),
      h('p.muted', 'Dans Safari : bouton Partager, puis « Sur l’écran d’accueil ». Le site s’ouvre alors comme une application et fonctionne sans connexion.')),

    h('section.card', h('h2', 'Widgets sur l’iPad'),
      h('p.muted', 'Un site ne peut pas créer de widget lui-même. L’app gratuite Scriptable sert d’intermédiaire : elle affiche le compte à rebours, les fiches à revoir et les prochains DS et khôlles sur l’écran d’accueil et l’écran verrouillé.'),
      h('ol.steps-list',
        h('li', 'Installe ', h('a', { href: 'https://apps.apple.com/app/scriptable/id1405459188', target: '_blank', rel: 'noopener' }, 'Scriptable'), ' depuis l’App Store.'),
        h('li', h('button.btn.small', { onclick: copyScript }, 'Copier le script du widget'), ' puis, dans Scriptable : + en haut à droite, colle, et nomme le script « Cockpit MP ». ', h('a', { href: SCRIPT_URL, target: '_blank' }, 'Voir le code')),
        h('li', h('button.btn.small.primary', { onclick: sendToWidget }, 'Envoyer mes données au widget'), ' puis « Enregistrer dans Fichiers » → iCloud Drive → dossier Scriptable. Remplace l’ancien fichier.'),
        h('li', 'Ajoute le widget : appui long sur l’écran d’accueil (ou sur l’écran verrouillé → Personnaliser) → + → Scriptable → choisis la taille → touche le widget → Script : « Cockpit MP ».')),
      h('p.muted', s.widgetSync ? `Données envoyées ${fmtRel(s.widgetSync)}. Le widget recalcule chaque jour le compte à rebours et les fiches dues ; renvoie les données après avoir ajouté des DS, des khôlles ou des tâches.` : 'Aucune donnée envoyée pour l’instant.')),

    h('section.card', h('h2', 'Activité en direct pour le chrono'),
      h('p.muted', 'Le minuteur de l’app Horloge, lui, s’affiche en Activité en direct sur l’écran verrouillé. Un Raccourci permet au bouton Démarrer du site de le lancer en même temps.'),
      h('ol.steps-list',
        h('li', 'App Raccourcis → + → Ajouter une action → « Démarrer le minuteur ».'),
        h('li', 'Touche la durée, choisis la variable « Entrée du raccourci » et l’unité « minutes ».'),
        h('li', 'Nomme le raccourci exactement : ', h('b', s.shortcutName || 'Chrono MP'), '.'),
        h('li', 'Dans la page Chrono, coche « Lancer aussi le minuteur de l’Horloge ».')),
      field('Nom du raccourci', 'shortcutName', 'text', 'À changer seulement si tu l’as nommé autrement'),
      h('p.muted', 'Le site bascule un instant dans Raccourcis : reviens avec le lien en haut à gauche de l’écran. Le minuteur de l’Horloge est indépendant : mettre le chrono du site en pause ne le met pas en pause.')),

    h('section.card', h('h2.bad', 'Zone dangereuse'),
      h('button.btn.danger', { onclick: async () => {
        if (!confirm('Effacer toutes les données de cet appareil ? Exporte d’abord une sauvegarde.')) return;
        if (!confirm('Dernière confirmation : tout sera supprimé.')) return;
        await reset();
        location.hash = '#/';
        location.reload();
      } }, icon('trash', 16), 'Tout effacer')));
}
