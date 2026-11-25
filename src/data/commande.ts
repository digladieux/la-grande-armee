/**
 * Réglages des commandes d'affiches (pas de paiement en ligne : les commandes sont envoyées
 * à Elora, qui regroupe et fait imprimer).
 *
 * Deux façons de recevoir les commandes (l'une, l'autre, ou les deux) :
 *  - sheetUrl : un Google Sheet (une ligne par affiche, + un e-mail récapitulatif).
 *    Installation : voir sources/commandes/google-sheet.gs, puis coller ici l'URL « /exec ».
 *  - web3formsKey : un simple e-mail via Web3Forms (clé gratuite sur https://web3forms.com).
 * Les deux vides = bouton « Envoyer » désactivé (le reste du panier fonctionne).
 */
export const commande = {
  destinataire: 'Elora',
  sheetUrl: 'https://script.google.com/macros/s/AKfycby_NMjNGp7VIEDVjjdACV8sUIK2-PviYATBPQjUb9xu8O0g-Eh_9mCjNQAkHACMB_mX4A/exec',
  web3formsKey: '',
};
