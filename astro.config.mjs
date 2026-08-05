import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import { remarkObsidianImagePaths } from './src/lib/remark-obsidian-image-paths.mjs';

export default defineConfig({
  site: 'https://sexpsy.tw',
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  markdown: {
    remarkPlugins: [remarkObsidianImagePaths],
  },
});
