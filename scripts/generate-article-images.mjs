#!/usr/bin/env node
/**
 * 分析一篇文章 → 用 SVG＋sharp 在本機產生莫蘭迪風格的「文字封面圖」（文章
 * 標題 + 系列配色 + 呼應品牌 Logo 的裝飾弧線）→ 存進 public/images/ →
 * 更新該文章的 frontmatter（cover）。
 *
 * 使用方式（在 repo 根目錄）：
 *   node scripts/generate-article-images.mjs <slug> [選項]
 *   或： npm run generate:images -- <slug> [選項]
 *
 * 選項：
 *   --dry-run   只把生成的 SVG 存到 /tmp 供預覽，不寫回 public/images/、不改文章
 *   --force     就算已經有 cover 也強制重新生成、覆蓋
 *
 * 不帶 slug 時，預設抓 src/content/articles/ 底下 frontmatter date 最新的文章。
 *
 * ---------------------------------------------------------------------------
 * 為什麼不用 AI 生圖 API 了（2026-08-06）：
 * 原本規劃串 OpenAI DALL-E 3 → 查證後改成 Google Gemini（Imagen 3 已下架、
 * Imagen 4 系列公告 2026-08-17 也要關）→ 實測發現 Gemini 圖片生成模型在
 * Free Tier 配額直接是 0，要用就得開計費。最後決定完全不依賴外部付費 API，
 * 改成本機純運算的 SVG 文字卡片，零成本、零外部依賴、也不會再因為哪個
 * 模型下架而突然壞掉。
 *
 * 因為這裡沒有用到任何生成式 AI 模型（純樣板＋程式排版），不會把文章的
 * aiGenerated 欄位設成 true——那個欄位跟 ArticleLayout 的「AI 配圖聲明」
 * 綁在一起，用在這裡顯示會失真。之後如果真的接了 AI 生圖 API，才需要
 * 把該篇文章的 aiGenerated 手動或另外寫程式設成 true。
 * ---------------------------------------------------------------------------
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import matter from 'gray-matter';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ARTICLES_DIR = join(ROOT, 'src/content/articles');
const IMAGES_DIR = join(ROOT, 'public/images');

const WIDTH = 1600;
const HEIGHT = 900;

// ---------- CLI 參數 ----------
const args = process.argv.slice(2);
const flags = new Set(
  args.filter((a) => a.startsWith('--') && !a.includes('=')).map((a) => a.slice(2))
);
const positional = args.find((a) => !a.startsWith('--'));

const isDryRun = flags.has('dry-run');
const force = flags.has('force');

// ---------- 品牌色票（跟 src/lib/series.ts 的六大系列對應） ----------
// 這裡刻意用純 JS 常數複製一份色票，不直接 import series.ts——這支腳本用
// node 直接執行（非 Astro/Vite pipeline），import .ts 檔案要另外處理型別
// 剝離，容易因 Node 版本而行為不同。若 series.ts 的系列色票有異動，記得
// 回來同步更新這裡。
const SERIES_HEX = {
  馬鈴薯嗑論文: '#8A9A86',
  沙發夜聊室: '#5B6C7D',
  情慾實驗室: '#A35D6A',
  心理急救包: '#D49B6A',
  耍廢自癒角: '#E6C594',
  翻頁餘溫: '#B5876D',
};
const DEFAULT_HEX = '#3C2A21'; // 未收錄的分類 fallback 回 chestnut

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 中文/日文/韓文一個字大致等寬，用字數估算換行就足夠準，不需要真的量測
// 字型寬度。最多顯示 4 行，避免超長標題把版面撐爆。
function wrapTitle(title, maxCharsPerLine = 11, maxLines = 4) {
  const lines = [];
  let current = '';
  for (const char of title) {
    current += char;
    if (current.length >= maxCharsPerLine) {
      lines.push(current);
      current = '';
    }
  }
  if (current) lines.push(current);

  if (lines.length > maxLines) {
    const truncated = lines.slice(0, maxLines);
    truncated[maxLines - 1] = truncated[maxLines - 1].slice(0, -1) + '…';
    return truncated;
  }
  return lines;
}

// ---------- 組出封面 SVG ----------
function buildCoverSvg({ title, category }) {
  const accentHex = SERIES_HEX[category] ?? DEFAULT_HEX;
  const titleLines = wrapTitle(title);
  const lineHeight = 92;
  const titleBlockHeight = (titleLines.length - 1) * lineHeight;
  const startY = HEIGHT / 2 - titleBlockHeight / 2 + 20;

  const titleTspans = titleLines
    .map((line, i) => `<tspan x="120" y="${startY + i * lineHeight}">${escapeXml(line)}</tspan>`)
    .join('');

  return `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#F9F6F0" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${accentHex}" fill-opacity="0.10" />

  <!-- 呼應品牌 Logo 的圓圈＋雙弧線意象。用巢狀 <svg> 直接搬 Logo.astro 原本
       的座標系統（viewBox 0 0 1000 800）等比縮放進右下角的框，不用自己重新
       算 transform/scale——手動算很容易把弧線算到畫布外面被裁掉（踩過這個坑）。 -->
  <svg x="1080" y="470" width="460" height="368" viewBox="0 0 1000 800" opacity="0.85">
    <circle cx="190" cy="190" r="80" fill="none" stroke="${accentHex}" stroke-width="20" />
    <path d="M 190,220 C 300,360 650,360 760,220" fill="none" stroke="#3C2A21" stroke-width="40" stroke-linecap="round" opacity="0.5" />
    <path d="M 310,420 C 420,560 770,560 880,420" fill="none" stroke="#3C2A21" stroke-width="40" stroke-linecap="round" opacity="0.5" />
  </svg>

  <!-- 分類標籤 -->
  <circle cx="128" cy="82" r="6" fill="${accentHex}" />
  <text x="150" y="90" font-family="'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif"
        font-size="26" font-weight="600" letter-spacing="3" fill="#C87D65">${escapeXml(category)}</text>

  <!-- 標題 -->
  <text font-family="'Noto Serif TC','Songti TC',serif" font-size="76" font-weight="700" fill="#3C2A21">${titleTspans}</text>
</svg>`;
}

// ---------- 找目標文章 ----------
function loadArticleFiles() {
  return readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((filename) => {
      const slug = filename.replace(/\.md$/, '');
      const fullPath = join(ARTICLES_DIR, filename);
      const raw = readFileSync(fullPath, 'utf-8');
      const parsed = matter(raw);
      return { slug, filename, fullPath, raw, parsed };
    });
}

function pickTargetArticle(slugArg) {
  const files = loadArticleFiles();
  if (files.length === 0) {
    throw new Error(`${ARTICLES_DIR} 底下沒有任何文章`);
  }

  if (slugArg) {
    const match = files.find((f) => f.slug === slugArg);
    if (!match) {
      const available = files.map((f) => f.slug).join(', ');
      throw new Error(`找不到 slug 為 "${slugArg}" 的文章。目前有：${available}`);
    }
    return match;
  }

  // 沒指定 slug：抓 frontmatter date 最新的
  return files.sort((a, b) => new Date(b.parsed.data.date) - new Date(a.parsed.data.date))[0];
}

// ---------- 主流程 ----------
async function main() {
  const article = pickTargetArticle(positional);
  const { data } = article.parsed;

  console.log(`\n目標文章：${article.filename}（category: ${data.category}）`);

  if (data.cover && !force) {
    console.log(
      `這篇已經有 cover（${data.cover}），沒有加 --force 就不會覆蓋。加上 --force 可強制重新生成。`
    );
    return;
  }

  const svg = buildCoverSvg(data);

  if (isDryRun) {
    const previewPath = join(tmpdir(), `cover-preview-${article.slug}.svg`);
    writeFileSync(previewPath, svg, 'utf-8');
    console.log(`\n--dry-run：不會寫回 public/images/、不會改文章。SVG 預覽已存到：${previewPath}`);
    return;
  }

  mkdirSync(IMAGES_DIR, { recursive: true });
  const outFilename = `cover-${article.slug}.webp`;
  const outPath = join(IMAGES_DIR, outFilename);
  await sharp(Buffer.from(svg)).webp({ quality: 90 }).toFile(outPath);
  const coverPath = `/images/${outFilename}`;
  console.log(`已存檔：public/images/${outFilename}`);

  const updatedFrontmatter = { ...data, cover: coverPath };
  const updatedFile = matter.stringify(`\n${article.parsed.content.trim()}\n`, updatedFrontmatter);
  writeFileSync(article.fullPath, updatedFile, 'utf-8');

  console.log(`\n已更新 ${article.filename}：cover 指向 ${coverPath}`);
  console.log(
    '因為圖片存在 public/images/ 底下（跟 vault 根目錄的 images/ 是 symlink），Obsidian 那邊會自動看到，不用額外同步。'
  );
}

main().catch((error) => {
  console.error('\n執行失敗：', error.message);
  process.exitCode = 1;
});
