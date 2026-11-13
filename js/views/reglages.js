import { state, save, importData, exportData, reset, counts } from '../store.js';
import { h, icon, today, fmtDate, toast } from '../util.js';

export async function downloadBackup() {
  const data = await exportData();
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  h('a', { href: URL.createObjectURL(blob), download: `Cockpit_MP_${today()}.json` }).click();
  state.lastBackup = today();
  save({ touch: false });
  toast('Sauvegarde téléchargée');
}

export function importPicker(after) {
  const input = h('input', { type: 'file', accept: '.json,application/json', onchange: async () => {
    const f = input.files[0];
    if (!f) return;
    try {
      const raw = JSON.parse(await f.text());
      const c = counts();
      if ((c.ds || c.kholles || c.mistakes || c.tasks) && !confirm('Remplacer toutes les données actuelles par celles du fichier ?')) return;
      const r = await importData(raw);
      toast(`Importé : ${r.ds} DS, ${r.kholles} khôlles, ${r.mistakes} fiches (${r.images} photos), ${r.tasks} tâches`);
      after?.();
    } catch (e) {
      alert('Import impossible : ' + (e.message || e));
    }
  } });
  input.click();
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

    h('section.card', h('h2.bad', 'Zone dangereuse'),
      h('button.btn.danger', { onclick: async () => {
        if (!confirm('Effacer toutes les données de cet appareil ? Exporte d’abord une sauvegarde.')) return;
        if (!confirm('Dernière confirmation : tout sera supprimé.')) return;
        await reset();
        location.hash = '#/';
        location.reload();
      } }, icon('trash', 16), 'Tout effacer')));
}
