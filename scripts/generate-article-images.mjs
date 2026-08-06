#!/usr/bin/env node
/**
 * 分析一篇文章 → 生成莫蘭迪風格 AI 配圖（DALL-E 3）→ 存進 public/images/
 * → 更新該文章的 frontmatter（cover、aiGenerated）→ 把內文插圖插回文章段落。
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
 *   --model=<name>  預設 dall-e-3
 *
 * 不帶 slug 時，預設抓 src/content/articles/ 底下 frontmatter date 最新的文章。
 *
 * 需要 OPENAI_API_KEY（見 .env.example 說明）。這支腳本只在本機/CI 手動執行，
 * 不會被排進網站的自動部署流程——DALL-E 3 是計費 API，不應該每次 push 就自動燒錢。
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import sharp from 'sharp';
import OpenAI from 'openai';

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
const model = kv.model ?? 'dall-e-3';

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

  const costPerImage = model === 'dall-e-3' ? { cover: 0.08, inline: 0.04 } : { cover: 0.04, inline: 0.04 };
  const estimatedCost = costPerImage.cover + inlinePrompts.length * costPerImage.inline;
  console.log(`\n預估花費：約 US$${estimatedCost.toFixed(2)}（${model}，standard quality）`);

  if (isDryRun) {
    console.log('\n--dry-run：不會呼叫 API、不會改動任何檔案。');
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      '缺少 OPENAI_API_KEY。請先在 .env 設定好（參考 .env.example），並用 ' +
        '`node --env-file=.env scripts/generate-article-images.mjs` 執行。'
    );
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  mkdirSync(IMAGES_DIR, { recursive: true });

  async function generateAndSave(prompt, size, outFilename) {
    console.log(`\n生成中：${outFilename} …`);
    const result = await client.images.generate({
      model,
      prompt,
      size,
      quality: 'standard',
      response_format: 'b64_json',
      n: 1,
    });
    const buffer = Buffer.from(result.data[0].b64_json, 'base64');
    const outPath = join(IMAGES_DIR, outFilename);
    await sharp(buffer).webp({ quality: 82 }).toFile(outPath);
    console.log(`已存檔：public/images/${outFilename}`);
    return `/images/${outFilename}`;
  }

  const coverPath = await generateAndSave(coverPrompt, '1792x1024', `cover-${article.slug}.webp`);

  const inlinePaths = [];
  for (let i = 0; i < inlinePrompts.length; i++) {
    const path = await generateAndSave(inlinePrompts[i], '1024x1024', `${article.slug}-section-${i + 1}.webp`);
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
