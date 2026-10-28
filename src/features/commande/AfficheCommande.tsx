/**
 * Page « back-office » d'une affiche commandée : ouverte depuis le lien reçu par Elora.
 * Redessine l'affiche en grand, indique la qualité d'impression de chaque dessin,
 * et produit le PDF au format commandé (300 dpi).
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { decodeRecette, PRINT_SIZES, titreAffiche, type PrintFormat, type Recette } from './recette';
import { dessinerAffiche, type QualiteMembre } from './rendu';
import './commande.css';

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
const DPI = 300;

export default function AfficheCommande() {
  const [recette, setRecette] = useState<Recette | null>(null);
  const [format, setFormat] = useState<PrintFormat>('A3');
  const [qualite, setQualite] = useState<QualiteMembre[]>([]);
  const [pdf, setPdf] = useState<'idle' | 'calcul' | 'erreur'>('idle');
  const [invalide, setInvalide] = useState(false);
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const r = decodeRecette(q.get('r') || '');
    const f = q.get('f') as PrintFormat;
    if (!r) return setInvalide(true);
    setRecette(r);
    if (f && f in PRINT_SIZES) setFormat(f);
  }, []);

  const [mmW, mmH] = recette ? (recette.orientation === 'paysage' ? [...PRINT_SIZES[format]].reverse() : PRINT_SIZES[format]) : [0, 0];

  useEffect(() => {
    if (!recette || !ref.current) return;
    dessinerAffiche(ref.current, recette, 1100, base, mmW).then(setQualite).catch(() => {});
  }, [recette, format]);

  const telecharger = async () => {
    if (!recette) return;
    setPdf('calcul');
    try {
      const { jsPDF } = await import('jspdf');
      const canvas = document.createElement('canvas');
      await dessinerAffiche(canvas, recette, Math.round((mmW / 25.4) * DPI), base);
      const doc = new jsPDF({ orientation: recette.orientation === 'paysage' ? 'landscape' : 'portrait', unit: 'mm', format: format.toLowerCase() });
      doc.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, mmW, mmH, undefined, 'FAST');
      const nom = titreAffiche(recette)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/gi, '-')
        .toLowerCase();
      doc.save(`affiche-${nom}-${format}.pdf`);
      setPdf('idle');
    } catch {
      setPdf('erreur');
    }
  };

  if (invalide) return <p class="cmd__alerte">Ce lien d'affiche est incomplet ou abîmé.</p>;
  if (!recette) return null;
  const min = qualite.length ? Math.min(...qualite.map((q) => q.dpi)) : 0;

  return (
    <div class="bo">
      <div class="bo__affiche">
        <canvas ref={ref} class="bo__canvas" />
      </div>
      <aside class="bo__infos">
        <p class="cmd__titre">{titreAffiche(recette)}</p>
        <dl class="bo__liste">
          <dt>Format</dt>
          <dd>
            <select value={format} onChange={(e) => setFormat((e.target as HTMLSelectElement).value as PrintFormat)}>
              {(Object.keys(PRINT_SIZES) as PrintFormat[]).map((f) => (
                <option value={f}>
                  {f} — {PRINT_SIZES[f][0] / 10} × {PRINT_SIZES[f][1] / 10} cm
                </option>
              ))}
            </select>
          </dd>
          <dt>Orientation</dt>
          <dd>{recette.orientation}</dd>
          <dt>Cadre</dt>
          <dd>Affiche seule, sans cadre</dd>
          {recette.showSubtitle && recette.subtitle && (
            <>
              <dt>Sous-titre</dt>
              <dd>{recette.subtitle}</dd>
            </>
          )}
        </dl>

        <p class="bo__label">Qualité d'impression des dessins</p>
        <ul class="bo__qualite">
          {qualite.map((q) => (
            <li class={q.dpi >= 250 ? 'is-ok' : q.dpi >= 150 ? 'is-moyen' : 'is-faible'}>
              <span>{q.name}</span>
              <strong>{q.dpi} dpi</strong>
            </li>
          ))}
        </ul>
        <p class="cmd__note">
          {min >= 250
            ? 'Parfait pour l’impression.'
            : min >= 150
              ? 'Correct, légèrement doux à l’impression : idéalement, utiliser les dessins en haute définition.'
              : 'Trop faible pour une impression nette : remplacer ces dessins par leur version haute définition.'}
        </p>

        <button type="button" class="cmd__btn" onClick={telecharger} disabled={pdf === 'calcul'}>
          {pdf === 'calcul' ? 'Préparation du PDF…' : `Télécharger le PDF ${format} (300 dpi)`}
        </button>
        {pdf === 'erreur' && <p class="cmd__alerte">Le PDF n'a pas pu être créé.</p>}
      </aside>
    </div>
  );
}
