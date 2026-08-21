import { defineCollection, reference, z } from 'astro:content';
import { normalizeImagePath } from '../lib/normalize-image-path.mjs';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    /**
     * Obsidian 留空的欄位（例如 `reference:` 後面沒接值）會被 YAML 解析成
     * null，不是 undefined，`.optional()` 不吃 null 會讓整個網站 build 失敗。
     * 這裡全部改用 `.nullish()`（同時接受 null 和 undefined）避免這個問題。
     */
    tags: z
      .array(z.string())
      .nullish()
      .transform((value) => value ?? []),
    summary: z.string(),
    reference: z
      .string()
      .nullish()
      .transform((value) => value ?? undefined),
    /**
     * 封面圖片路徑／URL；留空時會依 category 自動產生品牌插畫。
     * 同樣的路徑寫法問題（缺開頭 /、多了 public/ 前綴）在這裡也自動修正，
     * 邏輯跟文章內文圖片共用，見 normalize-image-path.mjs。
     */
    cover: z
      .string()
      .nullish()
      .transform((value) => normalizeImagePath(value) ?? undefined),
    /**
     * 這篇文章的圖（cover 和／或內文插圖）是否由 AI 生成。由
     * scripts/generate-article-images.mjs 自動寫入，用來決定要不要顯示
     * AI 配圖聲明；不是所有文章都用 AI 配圖（例如書封照片），所以不能
     * 寫死全站顯示，要靠這個欄位判斷。
     */
    aiGenerated: z.boolean().default(false),
    /**
     * 這篇文章要在文末掛哪一份簡報（對應 src/content/decks/<slug>.json 的檔名）。
     * 留空就完全不顯示簡報區塊，所以沒有簡報的文章不受任何影響。
     */
    deck: z
      .string()
      .nullish()
      .transform((value) => value ?? undefined),
  }),
});

const selfStudy = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    /** 對應 src/lib/self-study-rooms.ts 的房間 slug，決定這篇單元歸在哪個自學室 */
    room: z.enum(['sex-and-addiction', 'intimacy', 'body', 'sex-education']),
    /** 房間內的排序，數字小的排前面 */
    order: z.number().default(0),
    summary: z.string(),
    downloadPdf: z
      .string()
      .nullish()
      .transform((value) => value ?? undefined),
    downloadWord: z
      .string()
      .nullish()
      .transform((value) => value ?? undefined),
    /** AI 探索陪伴 Prompt；沒填就不顯示複製卡片區塊 */
    aiPrompt: z
      .string()
      .nullish()
      .transform((value) => value ?? undefined),
    /** 免責提醒目前是「自學專區總則 + 房間專屬提醒」兩層結構（見
     * self-study-rooms.ts 的 disclaimer 欄位），單元本身不需要另外指定。
     * 保留這個欄位是為了未來如果某篇單元需要跳脫房間預設、換一段完全不同
     * 的免責文案時可以覆蓋，目前還沒有任何單元用到覆蓋邏輯。 */
    disclaimerType: z.string().default('standard-healing'),
    tags: z
      .array(z.string())
      .nullish()
      .transform((value) => value ?? []),
    /** 預計完成時間（分鐘），顯示在單元標題旁邊 */
    estimatedMinutes: z
      .number()
      .positive()
      .nullish()
      .transform((value) => value ?? undefined),
    /** 難易度；先開放兩級，之後真的需要更多層再擴充 */
    difficulty: z
      .enum(['入門', '進階'])
      .nullish()
      .transform((value) => value ?? undefined),
    /** 延伸閱讀：對應 src/content/articles/ 的文章 slug，會做成連結卡片 */
    relatedArticles: z.array(reference('articles')).default([]),
  }),
});


/**
 * 文末簡報（目前用於「馬鈴薯嗑論文」系列）。
 *
 * 內容來源是沛辰在 NotebookLM 產生的簡報，但 NotebookLM 匯出的 pptx/pdf 每一頁
 * 都是「整頁壓平的點陣圖」、沒有任何可抽取的文字，所以這裡不是把原檔嵌進來，
 * 而是把逐頁文字重新輸入成結構化資料，再用網站自己的視覺重新排版。好處是手機
 * 上字不會縮到看不見、簡報文字能被搜尋引擎索引，也不會每篇多扛十幾 MB 的圖。
 */
/** Obsidian／手寫 JSON 常留空值，統一把 null 收斂成 undefined */
const nullableString = z
  .string()
  .nullish()
  .transform((value) => value ?? undefined);

/** 條列項目：label 是粗體前綴（例如「典範現狀」），沒有就整句一般字重 */
const bulletSchema = z.object({
  label: nullableString,
  text: z.string(),
});

/** 右側／背景的示意圖。原簡報是點陣圖，這裡改成用 inline SVG 重畫的幾何圖形 */
const figureSchema = z
  .object({
    type: z.enum(['venn3', 'ripple', 'waves', 'target', 'strands']),
    /** 只有 venn3 需要：三個圓的字母與標籤 */
    items: z.array(z.object({ letter: z.string(), label: z.string() })).default([]),
  })
  .nullish()
  .transform((value) => value ?? undefined);

const slideSchema = z.object({
  layout: z.enum([
    'cover',
    'feature',
    'bullets',
    'columns',
    'grid4',
    'flow',
    'spectrum',
    'quote',
    'converge',
    'closing',
  ]),
  /** 標題上方的小標 */
  kicker: nullableString,
  heading: nullableString,
  /** 主標下方的次級標題（feature 版面用） */
  subheading: nullableString,
  /** 封面的英文／文獻原名 */
  subtitle: nullableString,
  /** 段落文字；用 [[雙中括號]] 包住的片段會套系列強調色 */
  lead: z.array(z.string()).default([]),
  bullets: z.array(bulletSchema).default([]),
  columns: z
    .array(
      z.object({
        heading: z.string(),
        /** 欄內的次級標籤（例如「無可辯駁的收據」） */
        label: nullableString,
        lead: z.array(z.string()).default([]),
        bullets: z.array(bulletSchema).default([]),
        /** true 時這一欄套淡色底，對應原簡報的色塊欄 */
        tinted: z.boolean().default(false),
      })
    )
    .default([]),
  /** grid4／flow／spectrum 共用的項目清單 */
  items: z
    .array(
      z.object({
        title: z.string(),
        /** 英文對照或次標 */
        subtitle: nullableString,
        text: nullableString,
        figure: figureSchema,
      })
    )
    .default([]),
  /** converge 版面中央那個匯聚方塊的文字 */
  focus: nullableString,
  quote: nullableString,
  /** 引言的中文對照翻譯 */
  translation: nullableString,
  attribution: nullableString,
  /** closing 頁的大字宣言 */
  statement: nullableString,
  /** 頁面底部的一句話（原簡報的色塊橫幅或註腳提問） */
  note: nullableString,
  figure: figureSchema,
});

const decks = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    /** 副標／英文標題，通常是文獻原名 */
    subtitle: nullableString,
    /** 文獻出處（APA7），顯示在簡報下方的附註區 */
    source: nullableString,
    /** 產製方式聲明（AI 協作、使用限制等），逐條列出 */
    disclaimers: z.array(z.string()).default([]),
    /** 原始匯出檔的下載路徑，沒有就不顯示對應的下載鍵 */
    downloadPdf: nullableString,
    downloadPptx: nullableString,
    slides: z.array(slideSchema).min(1),
  }),
});

export const collections = {
  articles,
  // key 必須跟 src/content/ 底下的資料夾名稱一模一樣（self-study，不是 selfStudy）
  'self-study': selfStudy,
  decks,
};
