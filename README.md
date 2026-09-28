# La Grande Armée — site web

Site de l'univers illustré **La Grande Armée**, construit avec [Astro](https://astro.build) et déployé sur GitHub Pages.

## Démarrer

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # génère dist/
npm run preview   # prévisualise le build
```

## Structure

```
src/
├── data/                 ← contenu éditable sans toucher à l'interface
│   ├── characters.ts     personnages (nom, couleur, illustration…)
│   ├── navigation.ts     menu, liens légaux, réseaux sociaux
│   ├── products.ts       emplacements boutique
│   └── theme.ts          palette pastel
├── components/
│   ├── layout/           Header (menu + burger), Footer, Logo
│   ├── characters/       CharacterFigure, CharacterCard, CharacterCarousel
│   ├── home/             sections de la home (Hero, QuizTeaser, BandSection, PosterSection, ShopTeaser)
│   └── ui/               CTA, PosterPreview, Annotation, Doodle
├── layouts/              BaseLayout, PageShell (pages internes)
├── features/             fonctionnalités à venir (voir features/README.md)
├── lib/url.ts            url() : préfixe les liens avec la base GitHub Pages
├── pages/                une route = un fichier
└── styles/global.css     tokens (couleurs, typos, bandes diagonales)
```

## Ajouter les vrais personnages

Un copain peut incarner plusieurs personnages du jeu, un par famille : ce sont ses **looks**.

1. Déposer les illustrations dans `public/images/personnages/<copain>/<famille>.png`
   (noms **sans accents ni espaces**, ex. `dim/botefragile.png`).
2. Dans `src/data/characters.ts`, ajouter un look : famille + cadrage `bust` (centre `cx`/`cy` en % de l'image, `zoom`)
   utilisé pour les vignettes tête + buste. Voir l'exemple de Dim.
3. Les familles sont définies dans `src/data/families.ts`.

Les copains sans `looks` sont de faux personnages provisoires (silhouettes SVG).
Pour le hero (composition de groupe), il faudra des PNG **détourés** (fond transparent) → champ `cutout`.

## Liens internes

Toujours passer par `url()` (ou le composant `CTA`) pour les liens internes, sinon ils cassent sur GitHub Pages :

```astro
<a href={url('/quiz')}>Quiz</a>
```

## Déploiement GitHub Pages

1. Créer le repo sur GitHub et pousser sur `main`.
2. Dans le repo : **Settings → Pages → Source : GitHub Actions**.
3. Le workflow `.github/workflows/deploy.yml` build et publie à chaque push sur `main`.

Le site est servi sur `https://<utilisateur>.github.io/<repo>/`. Pour un domaine personnalisé
(ou un repo `<utilisateur>.github.io`), mettre `BASE_PATH: /` dans le workflow.
