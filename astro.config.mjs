import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://sexpsy.tw',
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
  ],
});
