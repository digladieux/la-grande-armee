// @ts-check
import { defineConfig } from 'astro/config';

import preact from '@astrojs/preact';

// GitHub Pages : SITE et BASE_PATH sont injectés par le workflow de déploiement
// (.github/workflows/deploy.yml). En local, le site tourne à la racine "/".
export default defineConfig({
  site: process.env.SITE ?? 'http://localhost:4321',
  base: process.env.BASE_PATH ?? '/',
  trailingSlash: 'ignore',
  integrations: [preact()],
});