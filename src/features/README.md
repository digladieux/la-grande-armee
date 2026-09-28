# Fonctionnalités à venir

Chaque grosse fonctionnalité vivra dans son propre dossier, avec ses composants,
ses données et sa logique, puis sera montée dans la page correspondante de `src/pages/`.

| Dossier (à créer)        | Page                      | Notes                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------ |
| `poster-configurator/` ✅ | `/creer-mon-affiche`      | Prototype Preact : bande, tenue, style, texte, format.      |
| `quiz/`                  | `/quiz`                   | Questions/résultats en données ; résultat → `characters.ts`. |
| `game/`                  | `/jeu` (nouvelle route)   | Mini-jeu (canvas), chargé seulement sur sa page.             |
| `shop/`                  | `/boutique`               | Catalogue dans `src/data/products.ts` → service externe.     |
| `animations/`            | —                         | Animations des personnages, branchées sur `CharacterFigure`. |

Le site étant statique (GitHub Pages), paiement et panier passeront par un
service tiers (Stripe Payment Links, Shopify Buy Button, Snipcart…).
