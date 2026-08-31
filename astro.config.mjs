import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { remarkObsidianImagePaths } from './src/lib/remark-obsidian-image-paths.mjs';

export default defineConfig({
  // 2026-08-31 修正：GitHub Pages 的 CNAME 實際上是把 www 轉址到不加 www 的版本
  // （跟這裡原本假設的方向相反），導致 sitemap／canonical 網址跟真正能開啟的網址
  // 不一致，Google Search Console 因此回報「頁面會重新導向」且驗證失敗。改成不加
  // www，跟 public/CNAME、實際 301 方向保持一致。
  site: 'https://sexpsy.tw',
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
