/**
 * « T'as la flemme ? » : affiches toutes faites, une par famille (sources/affiches/familles.py),
 * à commander telles quelles. Petit encart sous le configurateur.
 */
import { useState } from 'preact/hooks';
import type { Recette, PrintFormat } from '../commande/recette';
import { ajouterAuPanier } from '../commande/panier';
import { FORMATS } from './types';
import './modeles.css';

export interface Modele {
  id: string;
  /** Nom de la famille. */
  name: string;
  /** Couleur des cartes de la famille. */
  color: string;
  /** Aperçu (chemin avec base). */
  preview: string;
  recette: Recette;
}

export default function ModelesAffiches({ modeles }: { modeles: Modele[] }) {
  const [id, setId] = useState(modeles[0]?.id);
  const [format, setFormat] = useState<PrintFormat>('A4');
  const [ajoute, setAjoute] = useState(false);
  const modele = modeles.find((m) => m.id === id) ?? modeles[0];
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  if (!modele) return null;

  const choisir = (v: string) => {
    setId(v);
    setAjoute(false);
  };

  return (
    <section class="modeles" style={{ '--c': modele.color }} aria-labelledby="modeles-titre">
      <div class="modeles__head">
        <p class="modeles__flemme hand">T'as la flemme de créer ton affiche ?</p>
        <h2 class="modeles__titre" id="modeles-titre">
          Choisis un modèle tout fait
        </h2>
      </div>

      <div class="modeles__body">
        <div class="modeles__controls">
          <label class="modeles__field">
            <span>Famille</span>
            <select value={id} onChange={(e) => choisir((e.target as HTMLSelectElement).value)}>
              {modeles.map((m) => (
                <option key={m.id} value={m.id}>
                  Famille {m.name}
                </option>
              ))}
            </select>
          </label>

          <div class="modeles__field">
            <span>Format</span>
            <div class="modeles__formats" role="radiogroup" aria-label="Format">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={format === f.id}
                  class={format === f.id ? 'is-on' : ''}
                  onClick={() => {
                    setFormat(f.id as PrintFormat);
                    setAjoute(false);
                  }}
                  title={f.size}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {ajoute ? (
            <p class="modeles__ok">
              ✓ Affiche ajoutée au panier · <a href={`${base}panier`}>Voir le panier →</a>
            </p>
          ) : (
            <button
              type="button"
              class="modeles__cart"
              onClick={() => {
                ajouterAuPanier(modele.recette, format);
                setAjoute(true);
              }}
            >
              Ajouter au panier
            </button>
          )}
        </div>

        <figure class="modeles__preview">
          <img src={modele.preview} alt={`Affiche toute faite : famille ${modele.name}`} width={1400} height={990} loading="lazy" decoding="async" />
        </figure>
      </div>
    </section>
  );
}
