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

const KEY = 'lga-panier';
export const EVENT = 'lga-panier-change';

export function lirePanier(): ArticlePanier[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function ecrirePanier(items: ArticlePanier[]) {
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

export const nbArticles = (items: ArticlePanier[]) => items.reduce((n, i) => n + i.quantite, 0);
