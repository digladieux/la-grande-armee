import { useEffect, useRef, useState } from 'preact/hooks';
import { commande } from '@/data/commande';
import { ajouterAuPanier, ecrirePanier, ecrireProjets, EVENT, EVENT_PROJETS, lirePanier, lireProjets, type ArticlePanier, type Projet } from './panier';
import { encodeRecette, PRINT_SIZES, titreAffiche, type PrintFormat } from './recette';
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

/** Dernier coup d'œil avant de commander : l'affiche en grand, avec quantité et « Retirer ». */
function Revoir({ item, fermer, quantite, retirer }: { item: ArticlePanier; fermer: () => void; quantite: (q: number) => void; retirer: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} class="cmd__revoir" onClose={fermer} onClick={(e) => e.target === ref.current && fermer()} aria-label={`Affiche « ${titreAffiche(item.recette)} »`}>
      <div class="cmd__revoir-boite">
        <button type="button" class="cmd__revoir-fermer" onClick={fermer} aria-label="Fermer">
          ✕
        </button>
        <Apercu item={item} largeur={1400} classe={`cmd__revoir-affiche cmd__revoir-affiche--${item.recette.orientation}`} />
        <div class="cmd__revoir-pied">
          <p>
            <strong>{titreAffiche(item.recette)}</strong> · {item.format} · {item.recette.orientation}
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
            <a class="cmd__modifier" href={`${base}creer-mon-affiche?modifier=${item.id}`}>
              ✎ Modifier
            </a>
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
  const [mis, setMis] = useState<string | null>(null);
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
              <Apercu item={{ id: p.id, ajouteLe: p.sauveLe, recette: p.recette, format: p.format, quantite: 1 }} largeur={300} />
            </a>
            <p class="cmd__nom">{titreAffiche(p.recette)}</p>
            <p class="cmd__detail">{p.recette.members.map((m) => m.name).join(', ')}</p>
            <div class="cmd__projet-actions">
              <a class="cmd__modifier" href={`${base}creer-mon-affiche?projet=${p.id}`}>
                ✎ Reprendre
              </a>
              <button
                type="button"
                class="cmd__mettre"
                onClick={() => {
                  ajouterAuPanier(p.recette, p.format);
                  setMis(p.id);
                  setTimeout(() => setMis(null), 1800);
                }}
              >
                {mis === p.id ? '✓ Ajoutée' : '+ Panier'}
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

/** Lien vers la page qui redessine l'affiche en grand et produit le PDF d'impression. */
const lienAffiche = (item: ArticlePanier) =>
  `${location.origin}${base}commande/affiche?f=${item.format}&r=${encodeRecette(item.recette)}`;

export default function PagePanier() {
  const [items, setItems] = useState<ArticlePanier[]>([]);
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

  const maj = (id: string, patch: Partial<ArticlePanier>) => {
    const next = items.map((i) => (i.id === id ? { ...i, ...patch } : i));
    setItems(next);
    ecrirePanier(next);
  };
  const retirer = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    ecrirePanier(next);
  };

  const actif = !!commande.web3formsKey;
  const pret = items.length > 0 && prenom.trim() && contact.trim();

  const envoyer = async (e: Event) => {
    e.preventDefault();
    if (!pret || !actif) return;
    setEnvoi('envoi');
    const lignes = items.map((it, n) => {
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
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: commande.web3formsKey,
          subject: `Commande d'affiches — ${prenom.trim()} (${items.reduce((n, i) => n + i.quantite, 0)})`,
          from_name: `La Grande Armée — ${prenom.trim()}`,
          message: corps,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
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
        {items.map((it) => (
          <li key={it.id} class="cmd__article">
            <button type="button" class="cmd__voir" onClick={() => setRevu(it.id)} aria-label="Revoir l'affiche en grand">
              <Apercu item={it} />
              <span class="cmd__voir-badge">⤢ Revoir</span>
            </button>
            <div class="cmd__infos">
              <p class="cmd__nom">{titreAffiche(it.recette)}</p>
              <p class="cmd__detail">
                {it.recette.members.map((m) => m.name).join(', ') || 'Sans copain'}
                {it.recette.accessories?.length ? ` + ${it.recette.accessories.map((a) => a.name).join(', ')}` : ''} · {it.recette.orientation}
              </p>
              <div class="cmd__reglages">
                <label>
                  <span>Format</span>
                  <select value={it.format} onChange={(e) => maj(it.id, { format: (e.target as HTMLSelectElement).value as PrintFormat })}>
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
        ))}
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
