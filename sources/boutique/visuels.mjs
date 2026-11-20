// Visuels de la boutique, rendus avec Playwright (chemin du module dans PLAYWRIGHT) :
//   - une affiche par famille scotchée au mur → public/images/boutique/affiches/<famille>.webp (l'accueil en tire une au hasard)
//   - la grande affiche « La bande » → public/images/boutique/affiche-la-bande-vignette.webp
//   node sources/boutique/visuels.mjs
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const ici = fileURLToPath(new URL('.', import.meta.url));
const racine = fileURLToPath(new URL('../../', import.meta.url));
const familles = Object.keys(JSON.parse(readFileSync(racine + 'sources/affiches/familles/recettes.json')));
const { webkit } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const b = await webkit.launch();
const p = await b.newPage({ viewport: { width: 1000, height: 1000 } });
mkdirSync(racine + 'public/images/boutique/affiches', { recursive: true });
const rendre = async (query, sortie) => {
  await p.goto(new URL('affiche-famille.html?' + query, 'file://' + encodeURI(ici)).href);
  await p.waitForFunction(() => document.getElementById('a').complete && document.getElementById('a').naturalWidth > 0);
  await p.screenshot({ path: '/tmp/lga-visuel.png' });
  execFileSync('python3', ['-c', `from PIL import Image; Image.open('/tmp/lga-visuel.png').convert('RGB').save('${sortie}', quality=86, method=6)`]);
  console.log(sortie);
};
for (const f of familles) await rendre('f=' + f, racine + `public/images/boutique/affiches/${f}.webp`);
await rendre('src=' + encodeURIComponent(new URL('public/images/boutique/affiche-la-bande.jpg', 'file://' + encodeURI(racine)).href), racine + 'public/images/boutique/affiche-la-bande-vignette.webp');
await b.close();
