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
import { normalizePunctuation } from '../src/lib/normalize-punctuation.mjs';

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

// 分類 badge 的底色／文字色，直接複製 series.ts 的 badge 欄位（不是統一從
// SERIES_HEX 推規則）——因為「翻頁餘溫」的 badge 刻意用淺底色＋深棕字，
// 跟其他 5 個系列（實色底＋淺字）不是同一套規則，用查表才能保證跟網站
// 上實際看到的 badge 顏色一致。
const SERIES_BADGE = {
  馬鈴薯嗑論文: { bg: '#8A9A86', text: '#F9F6F0' },
  沙發夜聊室: { bg: '#5B6C7D', text: '#F9F6F0' },
  情慾實驗室: { bg: '#A35D6A', text: '#F9F6F0' },
  心理急救包: { bg: '#D49B6A', text: '#3C2A21' },
  耍廢自癒角: { bg: '#E6C594', text: '#3C2A21' },
  翻頁餘溫: { bg: '#F7F3EE', text: '#5A4335' },
};
const DEFAULT_BADGE = { bg: '#3C2A21', text: '#F9F6F0' };

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------- 色彩：算出每個系列色的對比色（互補色） ----------
// 保留原色的飽和度/明度，只把色相轉 180 度，這樣算出來的對比色還是柔和的
// 莫蘭迪色調，不會變成刺眼的高彩度撞色。
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h, s, l) {
  const hue = h / 360;
  const sat = s / 100;
  const light = l / 100;
  let r;
  let g;
  let b;
  if (sat === 0) {
    r = g = b = light;
  } else {
    const hue2rgb = (p, q, t) => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };
    const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
    const p = 2 * light - q;
    r = hue2rgb(p, q, hue + 1 / 3);
    g = hue2rgb(p, q, hue);
    b = hue2rgb(p, q, hue - 1 / 3);
  }
  const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function complementaryHex(hex) {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex((h + 180) % 360, s, l);
}

// ---------- 標題自動換行（含中文斷行禁則） ----------
// 中文/日文/韓文一個字大致等寬，用字數估算換行就足夠準，不需要真的量測
// 字型寬度。最多顯示 4 行，避免超長標題把版面撐爆。
const NO_LINE_START = new Set(['」', '』', '）', '，', '。', '、', '？', '！', '；', '：', '】', '》']);
const NO_LINE_END = new Set(['「', '『', '（', '【', '《']);

// 單純照字數斷行，「」『』（）這類成對符號常常被硬生生切成上下兩行
// （開符號留在行尾、閉符號被推到下一行開頭），中文排版稱為斷行禁則——
// 這裡做基本處理：閉符號不該出現在行首就往上一行尾巴挪，開符號不該出現
// 在行尾就往下一行開頭挪。
function applyLineBreakRules(lines) {
  const result = [...lines];
  for (let i = 0; i < result.length - 1; i++) {
    while (result[i + 1].length > 0 && NO_LINE_START.has(result[i + 1][0])) {
      result[i] += result[i + 1][0];
      result[i + 1] = result[i + 1].slice(1);
    }
    while (result[i].length > 0 && NO_LINE_END.has(result[i][result[i].length - 1])) {
      const char = result[i][result[i].length - 1];
      result[i] = result[i].slice(0, -1);
      result[i + 1] = char + result[i + 1];
    }
  }
  return result.filter((line) => line.length > 0);
}

function wrapTitle(title, maxCharsPerLine = 11, maxLines = 4) {
  const rawLines = [];
  let current = '';
  for (const char of title) {
    current += char;
    if (current.length >= maxCharsPerLine) {
      rawLines.push(current);
      current = '';
    }
  }
  if (current) rawLines.push(current);

  const lines = applyLineBreakRules(rawLines);

  if (lines.length > maxLines) {
    const truncated = lines.slice(0, maxLines);
    truncated[maxLines - 1] = truncated[maxLines - 1].slice(0, -1) + '…';
    return truncated;
  }
  return lines;
}

// 裝飾圈旁邊的小點點——呼應原始品牌 Logo（logo.png）弧線之間那排摩斯電碼
// 小點的意象，用對比色點綴，當作「跳色細節」而不是整片背景換色：背景／
// 圓圈／badge 都維持系列辨識色（識別度優先），對比色只在這裡出現。
const ACCENT_DOTS = [
  { x: 1000, y: 430, r: 5 },
  { x: 1032, y: 408, r: 3 },
  { x: 966, y: 456, r: 4 },
  { x: 1054, y: 446, r: 6 },
  { x: 938, y: 416, r: 3 },
  { x: 1010, y: 470, r: 3 },
];

// ---------- 組出封面 SVG ----------
function buildCoverSvg({ title, category }) {
  const identityHex = SERIES_HEX[category] ?? DEFAULT_HEX; // 系列本身的辨識色
  const accentHex = complementaryHex(identityHex); // 對比色，只用在小點點裝飾
  const badge = SERIES_BADGE[category] ?? DEFAULT_BADGE; // 跟網站上實際 badge 一致的底色/字色

  // Obsidian 打字習慣偶爾會混到半形標點（例如「路上,覺察」），緊鄰中文字
  // 的半形標點在這個字重、字級下會跟全形字擠在一起、留白很不平均，統一
  // 轉成全形再排版。
  const titleLines = wrapTitle(normalizePunctuation(title));
  const lineHeight = 118; // 拉大行距，原本 92 偏擠
  const titleBlockHeight = (titleLines.length - 1) * lineHeight;
  const startY = HEIGHT / 2 - titleBlockHeight / 2 + 20;

  const titleTspans = titleLines
    .map((line, i) => `<tspan x="120" y="${startY + i * lineHeight}">${escapeXml(line)}</tspan>`)
    .join('');

  // 分類 badge：做成跟網站上 ArticleCard 一樣的圓角膠囊，而不是單純文字＋
  // 色點——直接複用 badge 底色/字色查表，讓封面上的分類色跟文章頁滾下去
  // 就會看到的那個 badge 完全一致，不是另外算出來的顏色。
  const badgeFontSize = 28;
  const badgePaddingX = 28;
  const badgeTextWidth = [...category].length * badgeFontSize * 1.02;
  const badgeWidth = badgeTextWidth + badgePaddingX * 2;
  const badgeHeight = 58;
  const badgeX = 120;
  const badgeY = 64;

  const accentDots = ACCENT_DOTS.map(
    (dot) => `<circle cx="${dot.x}" cy="${dot.y}" r="${dot.r}" fill="${accentHex}" fill-opacity="0.7" />`
  ).join('');

  return `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#F9F6F0" />
  <!-- 背景維持系列辨識色打底，拉高一點透明度增加存在感，但不換成對比色——
       對比色在低透明度下彼此會被稀釋到很像，高透明度又容易跟別的系列
       撞色、也偏離全站燕麥白的暖色調，維持辨識色最不會混淆。 -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${identityHex}" fill-opacity="0.18" />

  <!-- 呼應品牌 Logo 的圓圈＋雙弧線意象。用巢狀 <svg> 直接搬 Logo.astro 原本
       的座標系統（viewBox 0 0 1000 800）等比縮放進右下角的框，不用自己重新
       算 transform/scale——手動算很容易把弧線算到畫布外面被裁掉（踩過這個坑）。 -->
  <svg x="1080" y="470" width="460" height="368" viewBox="0 0 1000 800" opacity="0.9">
    <circle cx="190" cy="190" r="80" fill="none" stroke="${identityHex}" stroke-width="22" />
    <path d="M 190,220 C 300,360 650,360 760,220" fill="none" stroke="#3C2A21" stroke-width="40" stroke-linecap="round" opacity="0.55" />
    <path d="M 310,420 C 420,560 770,560 880,420" fill="none" stroke="#3C2A21" stroke-width="40" stroke-linecap="round" opacity="0.55" />
  </svg>

  <!-- 對比色小點點，跳色細節 -->
  ${accentDots}

  <!-- 分類 badge -->
  <rect x="${badgeX}" y="${badgeY}" width="${badgeWidth}" height="${badgeHeight}" rx="${badgeHeight / 2}" fill="${badge.bg}" />
  <text x="${badgeX + badgeWidth / 2}" y="${badgeY + badgeHeight / 2 + badgeFontSize * 0.35}" text-anchor="middle"
        font-family="'PingFang TC',sans-serif"
        font-size="${badgeFontSize}" font-weight="600" letter-spacing="2" fill="${badge.text}">${escapeXml(category)}</text>

  <!-- 標題：字型只列本機（macOS）實際裝的「Songti TC」，不再列 Noto Serif TC——
       那個字型根本沒裝，讓 librsvg 去 fontconfig 解析一個不存在的字型再
       fallback，偶爾會導致個別字元（全形標點）解析到不對的替代字型，
       看起來像半形、間距也不對。同理 badge 那邊也只留有裝的 PingFang TC。 -->
  <text font-family="'Songti TC',serif" font-size="76" font-weight="700" fill="#3C2A21">${titleTspans}</text>
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
