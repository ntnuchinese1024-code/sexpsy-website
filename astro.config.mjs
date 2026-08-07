import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { remarkObsidianImagePaths } from './src/lib/remark-obsidian-image-paths.mjs';

export default defineConfig({
  // 用 www 版本（非 www 會 301 轉址過來），讓 sitemap 裡的網址都是最終版本，
  // 不用讓爬蟲多轉一手。
  site: 'https://www.sexpsy.tw',
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap(),
  ],
  markdown: {
    remarkPlugins: [remarkObsidianImagePaths],
  },
});
