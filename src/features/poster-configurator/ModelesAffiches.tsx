/**
 * « T'as la flemme ? » : affiches toutes faites, une par famille (sources/affiches/familles.py),
 * à commander telles quelles. Discret : une petite bulle sous le configurateur ouvre une fenêtre
 * (le but de la page reste de créer son affiche).
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { encodeRecette, type Recette, type PrintFormat } from '../commande/recette';
import { ajouterAuPanier } from '../commande/panier';
import { FORMATS } from './types';
import './modeles.css';

export interface Modele {
  id: string;
  /** Affiche d'une famille, ou d'un copain dans toutes ses tenues. */
  kind: 'famille' | 'copain';
  /** Nom de la famille, ou prénom du copain. */
  name: string;
  /** Couleur des cartes de la famille (ou couleur d'accent pour un copain). */
  color: string;
  /** Aperçu (chemin avec base). */
  preview: string;
  recette: Recette;
}

export default function ModelesAffiches({ modeles }: { modeles: Modele[] }) {
  const [kind, setKind] = useState<Modele['kind']>('famille');
  const liste = modeles.filter((m) => m.kind === kind);
  const [id, setId] = useState(modeles[0]?.id);
  const [format, setFormat] = useState<PrintFormat>('A4');
  const [ajoute, setAjoute] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  // Lien « Retoucher ce modèle » : seulement pour Elora (page ouverte avec ?retouche)
  const [admin, setAdmin] = useState(false);
  useEffect(() => setAdmin(new URLSearchParams(location.search).has('retouche')), []);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (ouvert && !d.open) d.showModal();
    if (!ouvert && d.open) d.close();
  }, [ouvert]);
  const modele = liste.find((m) => m.id === id) ?? liste[0] ?? modeles[0];
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  if (!modele) return null;

  const choisir = (v: string) => {
    setId(v);
    setAjoute(false);
  };
  const changerKind = (k: Modele['kind']) => {
    setKind(k);
    setId(modeles.find((m) => m.kind === k)?.id);
    setAjoute(false);
  };

  return (
    <div class="flemme">
      <button type="button" class="flemme__bulle" onClick={() => setOuvert(true)} aria-haspopup="dialog">
        <span class="flemme__question hand">T'as la flemme de créer ton affiche ?</span>
        <span class="flemme__action">
          Voir les modèles
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </span>
      </button>
      <dialog
        ref={dialog}
        class="flemme__dialog"
        aria-labelledby="modeles-titre"
        onClose={() => setOuvert(false)}
        onClick={(e) => e.target === dialog.current && setOuvert(false)}
      >
    <section class="modeles" style={{ '--c': modele.color }}>
      <button type="button" class="modeles__close" onClick={() => setOuvert(false)} aria-label="Fermer">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" /></svg>
      </button>
      <div class="modeles__head">
        <p class="modeles__flemme hand">T'as la flemme de créer ton affiche ?</p>
        <h2 class="modeles__titre" id="modeles-titre">
          Choisis un modèle tout fait
        </h2>
      </div>

      <div class="modeles__body">
        <div class="modeles__controls">
          <div class="modeles__kinds" role="tablist" aria-label="Type d'affiche">
            {(['famille', 'copain'] as const).map((k) => (
              <button key={k} type="button" role="tab" aria-selected={kind === k} class={kind === k ? 'is-on' : ''} onClick={() => changerKind(k)}>
                {k === 'famille' ? 'Une famille' : 'Un copain'}
              </button>
            ))}
          </div>

          <label class="modeles__field">
            <span>{kind === 'famille' ? 'Famille' : 'Copain (toutes ses tenues)'}</span>
            <select value={modele.id} onChange={(e) => choisir((e.target as HTMLSelectElement).value)}>
              {liste.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.kind === 'famille' ? `Famille ${m.name}` : m.name}
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

        {admin && (
          <a class="modeles__retouche" href={`${base}creer-mon-affiche?retouche=${modele.id}&r=${encodeRecette(modele.recette)}`}>
            ✎ Retoucher ce modèle
          </a>
        )}
        <figure class="modeles__preview">
          {ouvert && <img src={modele.preview} alt={`Affiche toute faite : ${modele.kind === 'famille' ? `famille ${modele.name}` : `${modele.name} dans toutes ses familles`}`} width={1400} height={990} decoding="async" />}
        </figure>
      </div>
    </section>
      </dialog>
    </div>
  );
}
