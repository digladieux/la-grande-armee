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
