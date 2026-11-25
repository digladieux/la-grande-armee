/**
 * Réception des commandes du site La Grande Armée dans un Google Sheet.
 *
 * Installation (une seule fois, environ 5 minutes) :
 *   1. Créer un Google Sheet vide (par ex. « Commandes La Grande Armée »).
 *   2. Menu Extensions → Apps Script. Effacer le contenu, coller TOUT ce fichier, enregistrer.
 *   3. Bouton « Déployer » → « Nouveau déploiement » → type « Application Web » :
 *        - Exécuter en tant que : Moi
 *        - Qui a accès : Tout le monde
 *      → « Déployer », autoriser l'accès (compte Google), puis copier l'URL qui finit par /exec.
 *   4. Coller cette URL dans src/data/commande.ts (champ sheetUrl).
 *
 * Chaque commande ajoute une ligne par affiche dans l'onglet « Commandes »,
 * et un e-mail récapitulatif est envoyé au propriétaire du Sheet (mettre NOTIFIER à false pour l'éviter).
 */
const ONGLET = 'Commandes';
const NOTIFIER = true;
const COLONNES = [
  'Reçue le', 'N° commande', 'Prénom', 'Contact', 'Message',
  'Affiche', 'Type', 'Titre', 'Détail', 'Format', 'Quantité', 'Fichier à imprimer', 'Statut',
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const c = JSON.parse(e.postData.contents);
    const sheet = onglet_();
    const maintenant = new Date();
    c.affiches.forEach(function (a, i) {
      sheet.appendRow([
        maintenant, c.numero, c.prenom, c.contact, c.message || '',
        (i + 1) + ' / ' + c.affiches.length, a.type, a.titre, a.detail, a.format, a.quantite, a.lien, 'À imprimer',
      ]);
    });
    if (NOTIFIER) {
      const total = c.affiches.reduce(function (n, a) { return n + a.quantite; }, 0);
      MailApp.sendEmail({
        to: Session.getEffectiveUser().getEmail(),
        subject: 'Nouvelle commande La Grande Armée — ' + c.prenom + ' (' + total + ' affiche' + (total > 1 ? 's' : '') + ')',
        body: c.texte + '\n\nToutes les commandes : ' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      });
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Test (à lancer depuis l'éditeur : choisir « tester » dans la liste des fonctions, puis « Exécuter ») :
 * ajoute une fausse commande dans le Sheet et envoie l'e-mail — et fait accepter les autorisations Google.
 * Ne PAS exécuter doPost à la main : c'est le site qui l'appelle (sinon « Cannot read properties of undefined »).
 */
function tester() {
  doPost({
    postData: {
      contents: JSON.stringify({
        numero: 'TEST',
        prenom: 'Test',
        contact: '—',
        message: 'Commande de test, à supprimer',
        affiches: [{ type: 'Test', titre: 'La Grande Armée', detail: 'Dim, Guigui', format: 'A4 portrait', quantite: 1, lien: 'https://lagrandearmee.elora-le-breton.com' }],
        texte: 'Commande de test',
      }),
    },
  });
}

function onglet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(ONGLET);
  if (!sheet) {
    sheet = ss.insertSheet(ONGLET);
    sheet.appendRow(COLONNES);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, COLONNES.length).setFontWeight('bold').setBackground('#f8df7e');
    sheet.setColumnWidth(12, 260);
  }
  return sheet;
}
