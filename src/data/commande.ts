/**
 * Réglages des commandes d'affiches (pas de paiement en ligne : les commandes sont envoyées
 * à Elora, qui regroupe et fait imprimer).
 *
 * Envoi par e-mail via Web3Forms (gratuit) : créer une clé sur https://web3forms.com avec
 * l'adresse qui doit recevoir les commandes, puis la coller ci-dessous.
 * Clé vide = bouton « Envoyer » désactivé (le reste du panier fonctionne).
 */
export const commande = {
  destinataire: 'Elora',
  web3formsKey: '',
};
