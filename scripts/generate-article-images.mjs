#!/usr/bin/env node
/**
 * 分析一篇文章 → 生成莫蘭迪風格 AI 配圖（Google Gemini 圖片生成模型）→
 * 存進 public/images/ → 更新該文章的 frontmatter（cover、aiGenerated）→
 * 把內文插圖插回文章段落。
 *
 * 使用方式（在 repo 根目錄）：
 *   node --env-file=.env scripts/generate-article-images.mjs <slug> [選項]
 *   或設定好 .env 後： npm run generate:images -- <slug> [選項]
 *
 * 選項：
 *   --dry-run       只印出會用的 prompt 跟預估花費，不會真的呼叫 API、不會改檔案
 *   --cover-only    只生成封面，不生成內文插圖
 *   --inline=<n>    內文插圖張數（預設 1，最多 3）
 *   --force         就算已經有 cover 也強制重新生成
 *   --model=<name>  預設 gemini-2.5-flash-image（見下方「模型選擇」說明）
 *
 * 不帶 slug 時，預設抓 src/content/articles/ 底下 frontmatter date 最新的文章。
 *
 * 需要 GEMINI_API_KEY（見 .env.example 說明）。這支腳本只在本機/CI 手動執行，
 * 不會被排進網站的自動部署流程——這是計費 API，不應該每次 push 就自動燒錢。
 *
 * ---------------------------------------------------------------------------
 * 模型選擇說明（2026-08-06 查證）：
 * 原本規劃用「Imagen 3」，查證後發現 Imagen 3 已經下架、它的後繼者 Imagen 4
 * 系列也已公告會在 2026-08-17 關閉，兩者都不適合現在寫進腳本裡。目前 Google
 * 官方文件列為「建議用於新專案」的是 Gemini 圖片生成模型家族（俗稱 Nano
 * Banana），API 呼叫方式也跟 Imagen 系列不同——不是走專門的圖片生成端點，
 * 而是透過一般的 generateContent，用 responseModalities 要求模型回傳圖片。
 * 這裡預設用 gemini-2.5-flash-image（目前最便宜、文件仍列為推薦的一款）；
 * 如果之後想換更高品質的 gemini-3-pro-image 或更新的版本，改 --model 或
 * MODEL_PRICING 裡加一筆對照就好，不用動呼叫邏輯。
 * ---------------------------------------------------------------------------
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import sharp from 'sharp';
import { GoogleGenAI, Modality } from '@google/genai';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ARTICLES_DIR = join(ROOT, 'src/content/articles');
const IMAGES_DIR = join(ROOT, 'public/images');

// ---------- CLI 參數 ----------
const args = process.argv.slice(2);
const flags = new Set(
  args.filter((a) => a.startsWith('--') && !a.includes('=')).map((a) => a.slice(2))
);
const kv = Object.fromEntries(
  args.filter((a) => a.startsWith('--') && a.includes('=')).map((a) => {
    const [key, ...rest] = a.slice(2).split('=');
    return [key, rest.join('=')];
  })
);
const positional = args.find((a) => !a.startsWith('--'));

const isDryRun = flags.has('dry-run');
const coverOnly = flags.has('cover-only');
const force = flags.has('force');
const inlineCount = coverOnly ? 0 : Math.min(3, Math.max(0, parseInt(kv.inline ?? '1', 10) || 0));
const model = kv.model ?? 'gemini-2.5-flash-image';

// 每張圖的美金價格（2026-08-06 查證，Gemini API 官方定價頁）。查不到的模型
// 用 gemini-2.5-flash-image 的價格當保守估計，並在輸出裡註明是估計值。
const MODEL_PRICING = {
  'gemini-2.5-flash-image': 0.039,
  'gemini-3.1-flash-lite-image': 0.0336,
  'gemini-3.1-flash-image': 0.067,
  'gemini-3-pro-image': 0.134,
};

// ---------- 品牌視覺主題（跟 src/lib/series.ts 的六大系列對應） ----------
// 這裡刻意用純 JS 常數複製一份對應的英文主題描述，不直接 import series.ts——
// 這支腳本用 node 直接執行（非 Astro/Vite pipeline），import .ts 檔案要另外處理
// 型別剝離，容易因 Node 版本而行為不同。若 series.ts 的系列名稱或色票有異動，
// 記得回來同步更新這裡。
const THEME_BY_CATEGORY = {
  馬鈴薯嗑論文:
    'stacks of open books and academic papers softly scattered on a cozy desk, gentle sage green tones',
  沙發夜聊室:
    'two abstract soft silhouettes in quiet late-night conversation on a sofa, smoky indigo-blue tones',
  情慾實驗室:
    'soft abstract intertwined organic forms suggesting intimacy and vulnerability, wine burgundy tones',
  心理急救包:
    'a gentle glowing first-aid box, comforting open hands, warm caramel orange tones',
  耍廢自癒角:
    'a person curled up relaxing on a couch under a cozy blanket, soft flax yellow tones',
  翻頁餘溫:
    'an open book with warm golden light glowing softly from its pages, amber brown parchment tones',
};

const BASE_STYLE =
  'Minimalist Morandi-style editorial illustration, muted soft color palette, gentle diffused ' +
  'natural light, generous negative space, no text or letters anywhere in the image, warm and ' +
  'psychologically safe atmosphere, calm therapeutic mood, flat modern illustration style, subtle ' +
  'paper grain texture, gentle rounded shapes, editorial magazine illustration, high quality';

function buildPrompt({ category, title, summary }, variantHint) {
  const theme = THEME_BY_CATEGORY[category] ?? THEME_BY_CATEGORY['馬鈴薯嗑論文'];
  const context = `Editorial illustration for a Traditional Chinese psychology article titled "${title}". Article theme: ${summary}`;
  return [BASE_STYLE, theme, variantHint, context].filter(Boolean).join('. ');
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

// ---------- 插入內文插圖 ----------
function insertInlineImages(body, imagePaths, title) {
  if (imagePaths.length === 0) return body;

  const paragraphs = body.split(/\n\n+/);
  const insertAfter = imagePaths.map((_, i) =>
    Math.max(1, Math.round(((i + 1) * paragraphs.length) / (imagePaths.length + 1)))
  );

  let offset = 0;
  imagePaths.forEach((imagePath, i) => {
    const position = insertAfter[i] + offset;
    const markdown = `![${title} 插圖 ${i + 1}](${imagePath})`;
    paragraphs.splice(position, 0, markdown);
    offset += 1;
  });

  return paragraphs.join('\n\n');
}

// ---------- 主流程 ----------
async function main() {
  const article = pickTargetArticle(positional);
  const { data, content } = article.parsed;

  console.log(`\n目標文章：${article.filename}（category: ${data.category}）\n`);

  if (data.cover && !force && !isDryRun) {
    console.log(
      `這篇已經有 cover（${data.cover}），沒有加 --force 就不會覆蓋。加上 --force 可強制重新生成。`
    );
    return;
  }

  const coverPrompt = buildPrompt(data, 'Wide landscape composition suitable as an article cover banner.');
  const inlinePrompts = Array.from({ length: inlineCount }, (_, i) =>
    buildPrompt(data, `Square composition, section illustration variant ${i + 1}, slightly different framing from the cover.`)
  );

  console.log('=== 封面 Prompt ===');
  console.log(coverPrompt);
  inlinePrompts.forEach((p, i) => {
    console.log(`\n=== 內文插圖 ${i + 1} Prompt ===`);
    console.log(p);
  });

  const pricePerImage = MODEL_PRICING[model];
  const isEstimate = pricePerImage === undefined;
  const effectivePrice = pricePerImage ?? MODEL_PRICING['gemini-2.5-flash-image'];
  const estimatedCost = effectivePrice * (1 + inlinePrompts.length);
  console.log(
    `\n預估花費：約 US$${estimatedCost.toFixed(3)}（${model}${isEstimate ? '，價格未收錄，用 gemini-2.5-flash-image 價格粗估' : ''}）`
  );

  if (isDryRun) {
    console.log('\n--dry-run：不會呼叫 API、不會改動任何檔案。');
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      '缺少 GEMINI_API_KEY。請先在 .env 設定好（參考 .env.example），並用 ' +
        '`node --env-file=.env scripts/generate-article-images.mjs` 執行。'
    );
  }

  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  mkdirSync(IMAGES_DIR, { recursive: true });

  async function generateAndSave(prompt, aspectRatio, outFilename) {
    console.log(`\n生成中：${outFilename} …`);
    const response = await client.models.generateContent({
      model,
      contents: `${prompt} Aspect ratio: ${aspectRatio}.`,
      config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((part) => part.inlineData);
    if (!imagePart) {
      const textPart = parts.find((part) => part.text);
      throw new Error(
        `模型沒有回傳圖片（可能被安全過濾擋下）。${textPart ? `模型訊息：${textPart.text}` : ''}`
      );
    }

    const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
    const outPath = join(IMAGES_DIR, outFilename);
    // 用 sharp 統一裁切/縮放成需要的比例與尺寸，不依賴模型是否精準遵守
    // prompt 裡文字描述的構圖比例——封面走 16:9，內文插圖走 1:1。
    const [w, h] = aspectRatio === '16:9' ? [1600, 900] : [1024, 1024];
    await sharp(buffer).resize(w, h, { fit: 'cover' }).webp({ quality: 82 }).toFile(outPath);
    console.log(`已存檔：public/images/${outFilename}`);
    return `/images/${outFilename}`;
  }

  const coverPath = await generateAndSave(coverPrompt, '16:9', `cover-${article.slug}.webp`);

  const inlinePaths = [];
  for (let i = 0; i < inlinePrompts.length; i++) {
    const path = await generateAndSave(inlinePrompts[i], '1:1', `${article.slug}-section-${i + 1}.webp`);
    inlinePaths.push(path);
  }

  const newBody = insertInlineImages(content.trim(), inlinePaths, data.title);
  const updatedFrontmatter = { ...data, cover: coverPath, aiGenerated: true };
  const updatedFile = matter.stringify(`\n${newBody}\n`, updatedFrontmatter);

  writeFileSync(article.fullPath, updatedFile, 'utf-8');
  console.log(`\n已更新 ${article.filename}：cover 指向 ${coverPath}，aiGenerated: true`);
  if (inlinePaths.length > 0) {
    console.log(`已插入 ${inlinePaths.length} 張內文插圖。`);
  }
  console.log(
    '\n因為圖片存在 public/images/ 底下（跟 vault 根目錄的 images/ 是 symlink），Obsidian 那邊會自動看到，不用額外同步。'
  );
}

main().catch((error) => {
  console.error('\n執行失敗：', error.message);
  process.exitCode = 1;
});
