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

Les personnages actuels sont **de faux personnages provisoires** (silhouettes SVG).

1. Déposer les PNG détourés dans `public/images/personnages/`.
2. Dans `src/data/characters.ts`, renseigner `image: 'images/personnages/<fichier>.png'`, le nom et la description.

La silhouette est remplacée automatiquement partout (hero, carousel, quiz, affiches).

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
