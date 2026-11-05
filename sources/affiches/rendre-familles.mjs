// Rend les affiches par famille (sources/affiches/familles/recettes.json), ou par copain avec --copains
// (sources/affiches/copains/recettes.json), avec le moteur du site :
// page /commande/affiche, puis export JPEG A3 paysage 300 dpi → sources/affiches/familles/<famille>.jpg
// Prérequis : serveur local lancé (npm run dev) et Playwright (chemin du module dans PLAYWRIGHT si non installé ici).
//   node sources/affiches/rendre-familles.mjs [url du site] [famille ...]
import { readFileSync, writeFileSync } from 'node:fs';

const copains = process.argv.includes('--copains');
const dir = new URL(copains ? './copains/' : './familles/', import.meta.url);
const recettes = JSON.parse(readFileSync(new URL('recettes.json', dir)));
const [site = 'http://localhost:4321', ...seules] = process.argv.slice(2).filter((a) => a !== '--copains');
const encode = (r) => Buffer.from(JSON.stringify(r)).toString('base64url');
const liens = {};
const { webkit } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const b = await webkit.launch();
const page = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
for (const [fam, r] of Object.entries(recettes)) {
  liens[fam] = `${site}/commande/affiche?r=${encode(r)}&f=A3`;
  if (seules.length && !seules.includes(fam)) continue;
  await page.goto(liens[fam], { waitUntil: 'networkidle' });
  await page.waitForSelector('.bo__canvas');
  const data = await page.evaluate(async () => {
    const { dessinerAffiche } = await import('/src/features/commande/rendu.ts');
    const { decodeRecette } = await import('/src/features/commande/recette.ts');
    const r = decodeRecette(new URLSearchParams(location.search).get('r'));
    const c = document.createElement('canvas');
    await dessinerAffiche(c, r, 4961, '/'); // A3 paysage à 300 dpi
    return c.toDataURL('image/jpeg', 0.92);
  });
  writeFileSync(new URL(`${fam}.jpg`, dir), Buffer.from(data.split(',')[1], 'base64'));
  console.log(fam, 'ok');
}
writeFileSync(new URL('liens.json', dir), JSON.stringify(liens, null, 1));
await b.close();
