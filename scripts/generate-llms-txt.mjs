#!/usr/bin/env node
/**
 * 讀取 src/content/articles/ 與 src/content/self-study/ 的 frontmatter，
 * 產生 public/llms.txt（給 AI 搜尋引擎的網站導覽）與
 * public/llms-full.txt（完整文章清單，含摘要與關鍵字）。
 *
 * 使用方式（在 repo 根目錄）：
 *   node scripts/generate-llms-txt.mjs
 *   或： npm run generate:llms
 *
 * 已接在 npm run build（見 package.json）裡，每次 build 都會重新產生，
 * 不需要手動維護這兩個檔案。
 *
 * 六大專欄的名稱／slug／簡介直接對應 src/lib/series.ts 的 SERIES 常數。
 * 因為 series.ts 是 .ts 檔、這支腳本用純 Node 執行（沒有 ts-node/tsx），
 * 沒辦法直接 import，所以這裡手動複製一份——如果之後改了 series.ts
 * 的文案，記得同步更新下面的 SERIES 常數。
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ARTICLES_DIR = join(ROOT, 'src/content/articles');
const SELF_STUDY_DIR = join(ROOT, 'src/content/self-study');
const PUBLIC_DIR = join(ROOT, 'public');

// 2026-08-31：改成不加 www，跟 astro.config.mjs 的 site 設定與實際 301 方向一致
// （www 版本會被轉址到這個版本，見 astro.config.mjs 裡的說明）。
const SITE_URL = 'https://sexpsy.tw';

// 對應 src/lib/series.ts —— 六大專欄
const SERIES = [
  { name: '馬鈴薯嗑論文', slug: 'potato-thesis', tagline: '把厚重的學術論文，嗑成聽得懂的日常語言。' },
  { name: '沙發夜聊室', slug: 'couch-talk', tagline: '關係、依附，與那些說不出口的親密日常。' },
  { name: '情慾實驗室', slug: 'desire-lab', tagline: '誠實面對身體、慾望與性的每一種樣子。' },
  { name: '心理急救包', slug: 'psych-firstaid', tagline: '情緒炸裂的時候，先給自己一個急救箱。' },
  { name: '耍廢自癒角', slug: 'lazy-healing', tagline: '耍廢不是逃避，是一種溫柔的自我照顧。' },
  { name: '翻頁餘溫', slug: 'page-warmth', tagline: '那些閱讀過的書籍，都在生命裡活躍了起來。' },
];

// 對應 src/lib/self-study-rooms.ts —— 四間自學室
const STUDY_ROOMS = {
  'sex-and-addiction': '性與癮自學室',
  intimacy: '親密關係自學室',
  body: '身體與情感自學室',
  'sex-education': '性教育自學室',
};

function readMarkdownDir(dir) {
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const raw = readFileSync(join(dir, file), 'utf-8');
      const { data } = matter(raw);
      return { ...data, slug: basename(file, '.md') };
    });
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

function cleanTags(tags) {
  return (tags ?? []).map((tag) => String(tag).replace(/^#/, ''));
}

const articles = readMarkdownDir(ARTICLES_DIR).sort((a, b) => new Date(b.date) - new Date(a.date));
const selfStudyUnits = readMarkdownDir(SELF_STUDY_DIR);

// ---------- llms.txt ----------

const llmsTxt = `# 沙發上的性心理 Sexpsy.tw

> 「沙發上的性心理」是一個以心理學與性諮商專業為基礎的中文知識分享網站，
> 用溫柔、誠實又不失研究嚴謹的口吻，陪讀者梳理親密關係、身體、情慾與自我
> 覺察裡那些說不出口的困惑。

## 專業背景（E-E-A-T）

內容由一位執業心理師（諮商心理師）撰寫，同時是博士班研究生，研究領域聚焦
性成癮、藥癮復元與創傷知情實務。文章多半從實證研究、臨床實務觀察與真實
陪伴經驗出發，兼具學術文獻依據（Experience／Expertise）與可受公評的
專業執照身分（Authoritativeness）；網站保持長期更新與透明的作者揭露，
建立可信任（Trustworthiness）的內容關係。專長領域包含：性議題諮商、成癮
與復元、親密關係、創傷知情實務、生涯與自我探索。

## 六大專欄

${SERIES.map((s) => `- [${s.name}](${SITE_URL}/articles?series=${encodeURIComponent(s.name)}): ${s.tagline}`).join('\n')}

## 自學專區

不只是文章，網站也提供結構化的自我覺察練習單元，分為四間自學室：性與癮、
親密關係、身體與情感、性教育。

## 核心連結

- [網站首頁](${SITE_URL}/)
- [文章總覽](${SITE_URL}/articles)
- [自學專區](${SITE_URL}/self-study)
- [關於創辦人](${SITE_URL}/about)
- [聯絡我們](${SITE_URL}/contact)
- [完整文章清單（含摘要與關鍵字）](${SITE_URL}/llms-full.txt)
- [RSS 訂閱](${SITE_URL}/rss.xml)
- [Sitemap](${SITE_URL}/sitemap-index.xml)
`;

// ---------- llms-full.txt ----------

const articlesBySeries = SERIES.map((series) => {
  const items = articles.filter((a) => a.category === series.name);
  return { series, items };
}).filter((group) => group.items.length > 0);

const uncategorized = articles.filter((a) => !SERIES.some((s) => s.name === a.category));

function formatArticleEntry(article) {
  const url = `${SITE_URL}/articles/${article.slug}`;
  const keywords = cleanTags(article.tags).join(', ');
  const lines = [`### ${article.title}`, `- URL: ${url}`, `- 發布日期: ${formatDate(article.date)}`];
  if (keywords) lines.push(`- 心理學關鍵字: ${keywords}`);
  lines.push(`- 摘要: ${article.summary ?? ''}`);
  return lines.join('\n');
}

function formatSelfStudyEntry(unit) {
  const room = STUDY_ROOMS[unit.room] ?? unit.room;
  const url = `${SITE_URL}/self-study/${unit.room}/${unit.slug}`;
  const keywords = cleanTags(unit.tags).join(', ');
  const lines = [`### ${unit.title}`, `- 所屬自學室: ${room}`, `- URL: ${url}`];
  if (keywords) lines.push(`- 心理學關鍵字: ${keywords}`);
  lines.push(`- 摘要: ${unit.summary ?? ''}`);
  return lines.join('\n');
}

const llmsFullTxt = `# 沙發上的性心理 Sexpsy.tw — 完整內容索引

> 本頁列出網站所有文章與自學單元的標題、摘要、網址與對應的心理學關鍵字，
> 供 AI 搜尋引擎與語言模型檢索、引用。

${articlesBySeries
  .map(
    (group) =>
      `## ${group.series.name}\n\n${group.series.tagline}\n\n${group.items.map(formatArticleEntry).join('\n\n')}`
  )
  .join('\n\n')}${
  uncategorized.length > 0
    ? `\n\n## 未分類\n\n${uncategorized.map(formatArticleEntry).join('\n\n')}`
    : ''
}

## 自學專區單元

${selfStudyUnits.map(formatSelfStudyEntry).join('\n\n')}
`;

writeFileSync(join(PUBLIC_DIR, 'llms.txt'), llmsTxt.trimEnd() + '\n');
writeFileSync(join(PUBLIC_DIR, 'llms-full.txt'), llmsFullTxt.trimEnd() + '\n');

console.log(`已產生 public/llms.txt（${SERIES.length} 個專欄）與 public/llms-full.txt（${articles.length} 篇文章、${selfStudyUnits.length} 個自學單元）`);
