#!/usr/bin/env node
/**
 * 產生網站預設的社群分享圖（Open Graph / Twitter Card 用），給沒有自己
 * cover 的頁面（首頁、關於、聯絡、自學專區…）當 fallback。
 *
 * 跟 generate-article-images.mjs 同一套 SVG＋sharp 手法，但不含分類 badge，
 * 只有品牌 Logo 弧線＋站名＋標語，尺寸用 OG 建議的 1200x630。
 *
 * 使用方式（在 repo 根目錄，品牌識別視覺調整後手動重跑即可，不需要每次
 * build 都重新產生）：
 *   node scripts/generate-og-default.mjs
 *   或： npm run generate:og
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const IMAGES_DIR = join(ROOT, 'public/images');

const WIDTH = 1200;
const HEIGHT = 630;

const CREAM = '#F9F6F0';
const CHESTNUT = '#3C2A21';
const TERRACOTTA = '#C87D65';
const SERIES_DOTS = ['#8A9A86', '#5B6C7D', '#A35D6A', '#D49B6A', '#E6C594', '#B5876D'];

function buildSvg() {
  const dotsStartX = 100;
  const dotsY = HEIGHT - 90;
  const dotSpacing = 28;
  const dots = SERIES_DOTS.map(
    (hex, i) => `<circle cx="${dotsStartX + i * dotSpacing}" cy="${dotsY}" r="7" fill="${hex}" />`
  ).join('');

  return `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${CREAM}" />

  <!-- 品牌 Logo：圓圈＋雙弧線（等比縮放自 Logo.astro 原始 viewBox 0 0 1000 800） -->
  <svg x="90" y="115" width="260" height="208" viewBox="0 0 1000 800">
    <circle cx="190" cy="190" r="80" fill="none" stroke="${TERRACOTTA}" stroke-width="22" />
    <path d="M 190,220 C 300,360 650,360 760,220" fill="none" stroke="${CHESTNUT}" stroke-width="40" stroke-linecap="round" opacity="0.55" />
    <path d="M 310,420 C 420,560 770,560 880,420" fill="none" stroke="${CHESTNUT}" stroke-width="40" stroke-linecap="round" opacity="0.55" />
  </svg>

  <text x="100" y="410" font-family="'Songti TC',serif" font-size="72" font-weight="700" fill="${CHESTNUT}">沙發上的性心理</text>
  <text x="100" y="465" font-family="'PingFang TC',sans-serif" font-size="30" fill="${CHESTNUT}" opacity="0.7">窩在沙發上，聊性、聊愛，也聊回自己。</text>

  ${dots}
</svg>`;
}

async function main() {
  mkdirSync(IMAGES_DIR, { recursive: true });
  const outPath = join(IMAGES_DIR, 'og-default.jpg');
  await sharp(Buffer.from(buildSvg())).jpeg({ quality: 90 }).toFile(outPath);
  console.log(`已存檔：public/images/og-default.jpg（${WIDTH}x${HEIGHT}）`);
}

main().catch((error) => {
  console.error('\n執行失敗：', error.message);
  process.exitCode = 1;
});
