/**
 * Titre de l'affiche avec la typographie « gonflée » de la marque.
 * - « La Grande Armée » : le titre dessiné exact, sur une ligne (SVG vectorisé par scripts/titre-svg.py) ;
 * - autre texte : police display du site, lettres plus hautes au centre de chaque ligne (même effet).
 */
const GONFLE = 0.16; // les extrémités d'une ligne font (1 - GONFLE) de la hauteur du centre
const ARC = 0.05; // remontée du pied des lettres aux extrémités (en hauteur de lettre)

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Découpe en lignes d'au plus `max` caractères (sans couper les mots). */
function lignes(text: string, max: number): string[] {
  const out: string[] = [];
  for (const word of text.trim().split(/\s+/)) {
    const last = out[out.length - 1];
    if (last && (last + ' ' + word).length <= max) out[out.length - 1] = last + ' ' + word;
    else out.push(word);
  }
  return out;
}

interface Props {
  title: string;
  base: string; // préfixe des URL (BASE_URL)
  maxChars: number;
}

export default function PosterTitle({ title, base, maxChars }: Props) {
  const text = title.trim() || 'La Grande Armée';
  if (norm(text) === 'la grande armee') {
    return (
      <strong class="poster-title poster-title--logo" aria-label="La Grande Armée">
        <img src={`${base}images/titre-la-grande-armee.svg`} alt="" draggable={false} />
      </strong>
    );
  }
  return (
    <strong class="poster-title" aria-label={text}>
      {lignes(text.toUpperCase(), maxChars).map((line, li) => {
        const chars = [...line];
        return (
          <span class="poster-title__line" key={li} aria-hidden="true">
            {chars.map((c, i) => {
              const u = chars.length > 1 ? (2 * i) / (chars.length - 1) - 1 : 0;
              const s = 1 - GONFLE * u * u;
              return (
                <span key={i} style={{ transform: `translateY(${-ARC * u * u}em) scaleY(${s})` }}>
                  {c === ' ' ? ' ' : c}
                </span>
              );
            })}
          </span>
        );
      })}
    </strong>
  );
}
