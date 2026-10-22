# Fonctionnalités à venir

Chaque grosse fonctionnalité vivra dans son propre dossier, avec ses composants,
ses données et sa logique, puis sera montée dans la page correspondante de `src/pages/`.

| Dossier (à créer)        | Page                      | Notes                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------ |
| `poster-configurator/` ✅ | `/creer-mon-affiche`      | Prototype Preact : bande, tenue, style, texte, format.      |
| `quiz/`                  | `/jeux/quiz`              | Questions/résultats en données ; résultat → `characters.ts`. |
| `la-grande-course/` ✅    | `/jeux/la-grande-course`  | Jeu de course (canvas), images : scripts/jeu-sprites.py.     |
| `shop/`                  | `/boutique`               | Catalogue dans `src/data/products.ts` → service externe.     |
| `animations/`            | —                         | Animations des personnages, branchées sur `CharacterFigure`. |

Le site étant statique (GitHub Pages), paiement et panier passeront par un
service tiers (Stripe Payment Links, Shopify Buy Button, Snipcart…).
