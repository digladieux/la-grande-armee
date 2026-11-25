import { useEffect, useRef, useState } from 'preact/hooks';
import { commande } from '@/data/commande';
import {
  ajouterAuPanier,
  ecrirePanier,
  ecrireProjets,
  estBande,
  EVENT,
  EVENT_PROJETS,
  imageBande,
  lirePanier,
  lireProjets,
  type Article,
  type ArticleBande,
  type ArticlePanier,
  type Projet,
} from './panier';
import { encodeRecette, PRINT_SIZES, titreAffiche, type PrintFormat, type Recette } from './recette';
import { dessinerAffiche } from './rendu';
import './commande.css';

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
const FORMATS: PrintFormat[] = ['A5', 'A4', 'A3'];

function Apercu({ item, largeur = 360, classe = 'cmd__apercu' }: { item: ArticlePanier; largeur?: number; classe?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) dessinerAffiche(ref.current, item.recette, largeur, base).catch(() => {});
  }, [item.recette, largeur]);
  return <canvas ref={ref} class={classe} aria-label={`Aperçu : ${titreAffiche(item.recette)}`} />;
}

/** Grande affiche « La bande » : image toute faite. */
function ApercuBande({ item, classe = 'cmd__apercu' }: { item: ArticleBande; classe?: string }) {
  return (
    <img
      class={`${classe} cmd__apercu--bande`}
      src={`${base}${imageBande(item.bande.titre)}`}
      alt={`Aperçu : La bande, ${item.bande.titre ? 'avec' : 'sans'} titre`}
      decoding="async"
    />
  );
}

/** Copains de l'affiche, sans répétition (« Turquet · 8 tenues » pour une affiche d'un seul copain). */
const copains = (r: Recette) => {
  const noms = [...new Set(r.members.map((m) => m.name))];
  return noms.length === 1 && r.members.length > 1 ? `${noms[0]} · ${r.members.length} tenues` : noms.join(', ');
};

const nomArticle = (it: Article) => (estBande(it) ? 'La bande' : titreAffiche(it.recette));

/** Dernier coup d'œil avant de commander : l'affiche en grand, avec quantité et « Retirer ». */
function Revoir({
  item,
  fermer,
  quantite,
  retirer,
}: {
  item: Article;
  fermer: () => void;
  quantite: (q: number) => void;
  retirer: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      class="cmd__revoir"
      onClose={fermer}
      onClick={(e) => e.target === ref.current && fermer()}
      aria-label={`Affiche « ${nomArticle(item)} »`}
    >
      <div class="cmd__revoir-boite">
        <button type="button" class="cmd__revoir-fermer" onClick={fermer} aria-label="Fermer">
          ✕
        </button>
        {estBande(item) ? (
          <ApercuBande item={item} classe="cmd__revoir-affiche cmd__revoir-affiche--bande" />
        ) : (
          <Apercu item={item} largeur={1400} classe={`cmd__revoir-affiche cmd__revoir-affiche--${item.recette.orientation}`} />
        )}
        <div class="cmd__revoir-pied">
          <p>
            {estBande(item) ? (
              <>
                <strong>La bande</strong> · {item.bande.titre ? 'avec titre' : 'sans titre'}
              </>
            ) : (
              <>
                <strong>{titreAffiche(item.recette)}</strong> · {item.format} · {item.recette.orientation}
              </>
            )}
          </p>
          <div class="cmd__reglages">
            <div class="cmd__qte" aria-label="Quantité">
              <button type="button" onClick={() => quantite(Math.max(1, item.quantite - 1))} aria-label="Moins">
                −
              </button>
              <span>{item.quantite}</span>
              <button type="button" onClick={() => quantite(Math.min(20, item.quantite + 1))} aria-label="Plus">
                +
              </button>
            </div>
            {!estBande(item) && (
              <a class="cmd__modifier" href={`${base}creer-mon-affiche?modifier=${item.id}`}>
                ✎ Modifier
              </a>
            )}
            <button type="button" class="cmd__retirer" onClick={retirer}>
              Retirer du panier
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

/** Affiches sauvegardées (bouton « ♡ Sauvegarder » du configurateur) : à reprendre ou à mettre au panier. */
function Sauvegardes() {
  const [projets, setProjets] = useState<Projet[]>([]);
  useEffect(() => {
    setProjets(lireProjets());
    const sync = () => setProjets(lireProjets());
    window.addEventListener(EVENT_PROJETS, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT_PROJETS, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  if (!projets.length) return null;
  const supprimer = (id: string) => {
    const next = projets.filter((p) => p.id !== id);
    setProjets(next);
    ecrireProjets(next);
  };
  return (
    <section class="cmd__sauvegardes" id="sauvegardes">
      <p class="cmd__titre">♡ Mes affiches sauvegardées</p>
      <p class="cmd__note">Gardées sur ce téléphone ou cet ordinateur : reprends-les quand tu veux, ou ajoute-les au panier.</p>
      <ul class="cmd__projets">
        {projets.map((p) => (
          <li key={p.id} class="cmd__projet">
            <a href={`${base}creer-mon-affiche?projet=${p.id}`} aria-label="Reprendre cette affiche">
              <Apercu
                item={{
                  id: p.id,
                  ajouteLe: p.sauveLe,
                  recette: p.recette,
                  format: p.format,
                  quantite: 1,
                }}
                largeur={900}
              />
            </a>
            <p class="cmd__nom">{titreAffiche(p.recette)}</p>
            <p class="cmd__detail">{copains(p.recette)}</p>
            <div class="cmd__projet-actions">
              <a class="cmd__modifier" href={`${base}creer-mon-affiche?projet=${p.id}`}>
                ✎ Reprendre
              </a>
              <button
                type="button"
                class="cmd__mettre"
                onClick={() => {
                  // Mise au panier : l'affiche quitte les sauvegardes (elle est dans le panier juste au-dessus)
                  ajouterAuPanier(p.recette, p.format);
                  supprimer(p.id);
                }}
              >
                + Panier
              </button>
              <button type="button" class="cmd__retirer" onClick={() => supprimer(p.id)}>
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Fichier haute définition (6000 px) de la grande affiche, pour l'imprimeur. */
const lienBandeHD = (it: ArticleBande) =>
  `${location.origin}${base}images/boutique/impression/la-bande-hd${it.bande.titre ? '' : '-sans-titre'}.jpg`;

/** Lien vers la page qui redessine l'affiche en grand et produit le PDF d'impression. */
const lienAffiche = (item: ArticlePanier) => `${location.origin}${base}commande/affiche?f=${item.format}&r=${encodeRecette(item.recette)}`;

export default function PagePanier() {
  const [items, setItems] = useState<Article[]>([]);
  const [prenom, setPrenom] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [envoi, setEnvoi] = useState<'idle' | 'envoi' | 'ok' | 'erreur'>('idle');
  const [revu, setRevu] = useState<string | null>(null);

  useEffect(() => {
    setItems(lirePanier());
    const sync = () => setItems(lirePanier());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const maj = (id: string, patch: Partial<ArticlePanier> | Partial<ArticleBande>) => {
    const next = items.map((i) => (i.id === id ? ({ ...i, ...patch } as Article) : i));
    setItems(next);
    ecrirePanier(next);
  };
  const retirer = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    ecrirePanier(next);
  };

  const actif = !!(commande.sheetUrl || commande.web3formsKey);
  const pret = items.length > 0 && prenom.trim() && contact.trim();

  const envoyer = async (e: Event) => {
    e.preventDefault();
    if (!pret || !actif) return;
    setEnvoi('envoi');
    // Une ligne par affiche pour le Google Sheet
    const affiches = items.map((it) =>
      estBande(it)
        ? {
            type: 'Grande affiche « La bande »',
            titre: it.bande.titre ? 'Avec titre' : 'Sans titre',
            detail: 'Toute la Grande Armée',
            format: 'Taille fixe',
            quantite: it.quantite,
            lien: lienBandeHD(it),
          }
        : {
            type: 'Affiche personnalisée',
            titre: titreAffiche(it.recette) + (it.recette.showSubtitle && it.recette.subtitle ? ` — ${it.recette.subtitle}` : ''),
            detail:
              it.recette.members.map((m) => `${m.name} (${m.family})`).join(', ') +
              (it.recette.accessories?.length ? ` + ${it.recette.accessories.map((a) => a.name).join(', ')}` : ''),
            format: `${it.format} ${it.recette.orientation}`,
            quantite: it.quantite,
            lien: lienAffiche(it),
          },
    );
    const lignes = items.map((it, n) => {
      if (estBande(it))
        return [
          `Affiche ${n + 1} — Grande affiche « La bande » (${it.bande.titre ? 'avec' : 'sans'} titre)`,
          `  Quantité : ${it.quantite}`,
          `  Fichier haute définition à imprimer : ${lienBandeHD(it)}`,
        ].join('\n');
      const r = it.recette;
      return [
        `Affiche ${n + 1} — « ${titreAffiche(r)} »`,
        `  Format : ${it.format} (${PRINT_SIZES[it.format].join(' × ')} mm), ${r.orientation} — affiche seule, sans cadre`,
        `  Quantité : ${it.quantite}`,
        `  Copains : ${r.members.map((m) => `${m.name} (${m.family})`).join(', ')}`,
        r.accessories?.length ? `  Accessoires : ${r.accessories.map((a) => a.name).join(', ')}` : '',
        r.showSubtitle && r.subtitle ? `  Sous-titre : ${r.subtitle}` : '',
        `  Voir l'affiche et télécharger le PDF : ${lienAffiche(it)}`,
      ]
        .filter(Boolean)
        .join('\n');
    });
    const corps = [
      `Commande de ${prenom.trim()}`,
      `Contact : ${contact.trim()}`,
      message.trim() ? `Message : ${message.trim()}` : '',
      '',
      ...lignes,
    ]
      .filter((l) => l !== null)
      .join('\n');
    const numero = new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    try {
      if (commande.sheetUrl) {
        // Apps Script : pas de lecture de la réponse possible (no-cors), on considère l'envoi réussi s'il part
        await fetch(commande.sheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            numero,
            prenom: prenom.trim(),
            contact: contact.trim(),
            message: message.trim(),
            affiches,
            texte: `Commande ${numero}\n${corps}`,
          }),
        });
      }
      if (commande.web3formsKey) {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            access_key: commande.web3formsKey,
            subject: `Commande d'affiches — ${prenom.trim()} (${items.reduce((n, i) => n + i.quantite, 0)})`,
            from_name: `La Grande Armée — ${prenom.trim()}`,
            message: corps,
          }),
        });
        if (!res.ok) throw new Error(String(res.status));
      }
      setEnvoi('ok');
      ecrirePanier([]);
      setItems([]);
    } catch {
      setEnvoi('erreur');
    }
  };

  if (envoi === 'ok') {
    return (
      <div class="cmd cmd--merci">
        <p class="cmd__titre">Merci {prenom} !</p>
        <p class="hand cmd__sous">Ta commande est partie chez {commande.destinataire}. Elle te recontacte très vite.</p>
        <a class="cmd__btn" href={`${base}creer-mon-affiche`}>
          Créer une autre affiche
        </a>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div class="cmd cmd--vide">
        <p class="cmd__titre">Ton panier est vide</p>
        <p class="hand cmd__sous">Compose ton affiche avec la bande, puis ajoute-la ici.</p>
        <a class="cmd__btn" href={`${base}creer-mon-affiche`}>
          Créer mon affiche
        </a>
        <Sauvegardes />
      </div>
    );
  }

  return (
    <div class="cmd">
      <ul class="cmd__liste">
        {items.map((it) =>
          estBande(it) ? (
            <li key={it.id} class="cmd__article cmd__article--bande">
              <button type="button" class="cmd__voir" onClick={() => setRevu(it.id)} aria-label="Revoir l'affiche en grand">
                <ApercuBande item={it} />
                <span class="cmd__voir-badge">⤢ Revoir</span>
              </button>
              <div class="cmd__infos">
                <p class="cmd__nom">La bande</p>
                <p class="cmd__detail">La grande affiche avec toute la Grande Armée</p>
                <div class="cmd__reglages">
                  <label>
                    <span>Titre</span>
                    <select
                      value={it.bande.titre ? 'avec' : 'sans'}
                      onChange={(e) =>
                        maj(it.id, {
                          bande: {
                            titre: (e.target as HTMLSelectElement).value === 'avec',
                          },
                        })
                      }
                    >
                      <option value="avec">Avec le titre</option>
                      <option value="sans">Sans titre</option>
                    </select>
                  </label>
                  <div class="cmd__qte" aria-label="Quantité">
                    <button type="button" onClick={() => maj(it.id, { quantite: Math.max(1, it.quantite - 1) })} aria-label="Moins">
                      −
                    </button>
                    <span>{it.quantite}</span>
                    <button type="button" onClick={() => maj(it.id, { quantite: Math.min(20, it.quantite + 1) })} aria-label="Plus">
                      +
                    </button>
                  </div>
                  <button type="button" class="cmd__retirer" onClick={() => retirer(it.id)}>
                    Retirer
                  </button>
                </div>
              </div>
            </li>
          ) : (
            <li key={it.id} class="cmd__article">
              <button type="button" class="cmd__voir" onClick={() => setRevu(it.id)} aria-label="Revoir l'affiche en grand">
                <Apercu item={it} />
                <span class="cmd__voir-badge">⤢ Revoir</span>
              </button>
              <div class="cmd__infos">
                <p class="cmd__nom">{titreAffiche(it.recette)}</p>
                <p class="cmd__detail">
                  {copains(it.recette) || 'Sans copain'}
                  {it.recette.accessories?.length ? ` + ${it.recette.accessories.map((a) => a.name).join(', ')}` : ''} ·{' '}
                  {it.recette.orientation}
                </p>
                <div class="cmd__reglages">
                  <label>
                    <span>Format</span>
                    <select
                      value={it.format}
                      onChange={(e) =>
                        maj(it.id, {
                          format: (e.target as HTMLSelectElement).value as PrintFormat,
                        })
                      }
                    >
                      {FORMATS.map((f) => (
                        <option value={f}>
                          {f} — {PRINT_SIZES[f][0] / 10} × {PRINT_SIZES[f][1] / 10} cm
                        </option>
                      ))}
                    </select>
                  </label>
                  <div class="cmd__qte" aria-label="Quantité">
                    <button type="button" onClick={() => maj(it.id, { quantite: Math.max(1, it.quantite - 1) })} aria-label="Moins">
                      −
                    </button>
                    <span>{it.quantite}</span>
                    <button type="button" onClick={() => maj(it.id, { quantite: Math.min(20, it.quantite + 1) })} aria-label="Plus">
                      +
                    </button>
                  </div>
                  <button type="button" class="cmd__retirer" onClick={() => retirer(it.id)}>
                    Retirer
                  </button>
                </div>
              </div>
            </li>
          ),
        )}
      </ul>

      {(() => {
        const it = items.find((i) => i.id === revu);
        return it ? (
          <Revoir
            item={it}
            fermer={() => setRevu(null)}
            quantite={(q) => maj(it.id, { quantite: q })}
            retirer={() => {
              setRevu(null);
              retirer(it.id);
            }}
          />
        ) : null;
      })()}

      <Sauvegardes />

      <form class="cmd__form" onSubmit={envoyer}>
        <p class="cmd__titre">Valider ma commande</p>
        <p class="cmd__note">
          Pas de paiement en ligne : ta commande est envoyée à {commande.destinataire}, qui regroupe les commandes de la bande et te
          recontacte pour la suite.
        </p>
        <label>
          <span>Ton prénom *</span>
          <input type="text" required maxLength={40} value={prenom} onInput={(e) => setPrenom((e.target as HTMLInputElement).value)} />
        </label>
        <label>
          <span>Téléphone ou e-mail *</span>
          <input type="text" required maxLength={80} value={contact} onInput={(e) => setContact((e.target as HTMLInputElement).value)} />
        </label>
        <label>
          <span>Un petit message (facultatif)</span>
          <textarea rows={3} maxLength={500} value={message} onInput={(e) => setMessage((e.target as HTMLTextAreaElement).value)} />
        </label>
        <button type="submit" class="cmd__btn" disabled={!pret || !actif || envoi === 'envoi'}>
          {envoi === 'envoi' ? 'Envoi…' : `Envoyer ma commande à ${commande.destinataire}`}
        </button>
        {!actif && <p class="cmd__alerte">L'envoi des commandes sera activé très bientôt.</p>}
        {envoi === 'erreur' && <p class="cmd__alerte">Oups, l'envoi n'a pas marché. Réessaie dans un instant.</p>}
      </form>
    </div>
  );
}
