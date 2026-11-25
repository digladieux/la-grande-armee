/**
 * Panier : affiches créées dans le configurateur, gardées dans le navigateur (localStorage)
 * jusqu'à l'envoi de la commande à Elora.
 */
import type { PrintFormat, Recette } from './recette';

export interface ArticlePanier {
  id: string;
  ajouteLe: string;
  recette: Recette;
  format: PrintFormat;
  quantite: number;
}

// ── Grande affiche « La bande » (image toute faite, pas de recette) ──
export interface ArticleBande {
  id: string;
  ajouteLe: string;
  /** Taille unique (fixée par Elora) : seul le titre se choisit. */
  bande: { titre: boolean };
  quantite: number;
}
export type Article = ArticlePanier | ArticleBande;
export const estBande = (a: Article): a is ArticleBande => 'bande' in a;
/** Image de la grande affiche, avec ou sans titre (chemin relatif à /public). */
export const imageBande = (titre: boolean) => `images/boutique/affiche-la-bande${titre ? '' : '-sans-titre'}.jpg`;

const KEY = 'lga-panier';
export const EVENT = 'lga-panier-change';

export function lirePanier(): Article[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function ecrirePanier(items: Article[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* navigation privée : le panier ne survivra pas au rechargement */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: items }));
}

export function ajouterAuPanier(recette: Recette, format: PrintFormat): ArticlePanier {
  const item: ArticlePanier = {
    id: Math.random().toString(36).slice(2, 10),
    ajouteLe: new Date().toISOString(),
    recette,
    format,
    quantite: 1,
  };
  ecrirePanier([...lirePanier(), item]);
  return item;
}

export function ajouterBande(titre: boolean): ArticleBande {
  const liste = lirePanier();
  // même affiche (même choix de titre) : on augmente la quantité
  const deja = liste.find((a): a is ArticleBande => estBande(a) && a.bande.titre === titre);
  if (deja) {
    deja.quantite = Math.min(20, deja.quantite + 1);
    ecrirePanier(liste);
    return deja;
  }
  const item: ArticleBande = { id: Math.random().toString(36).slice(2, 10), ajouteLe: new Date().toISOString(), bande: { titre }, quantite: 1 };
  ecrirePanier([...liste, item]);
  return item;
}

export const nbArticles = (items: Article[]) => items.reduce((n, i) => n + i.quantite, 0);

// ── Affiches sauvegardées (projets) : gardées à part du panier, à reprendre plus tard ──
export interface Projet {
  id: string;
  sauveLe: string;
  recette: Recette;
  format: PrintFormat;
}
const KEY_PROJETS = 'lga-projets';
export const EVENT_PROJETS = 'lga-projets-change';

export function lireProjets(): Projet[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY_PROJETS) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function ecrireProjets(items: Projet[]) {
  try {
    localStorage.setItem(KEY_PROJETS, JSON.stringify(items));
  } catch {
    /* navigation privée */
  }
  window.dispatchEvent(new CustomEvent(EVENT_PROJETS, { detail: items }));
}

/** Sauvegarde (ou remplace, si `id` existe déjà) une affiche ; renvoie son id. */
export function sauverProjet(recette: Recette, format: PrintFormat, id?: string): string {
  const liste = lireProjets();
  const projet: Projet = { id: id ?? Math.random().toString(36).slice(2, 10), sauveLe: new Date().toISOString(), recette, format };
  const i = liste.findIndex((p) => p.id === projet.id);
  ecrireProjets(i >= 0 ? liste.map((p) => (p.id === projet.id ? projet : p)) : [projet, ...liste]);
  return projet.id;
}
