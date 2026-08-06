import { defineCollection, z } from 'astro:content';
import { normalizeImagePath } from '../lib/normalize-image-path.mjs';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    summary: z.string(),
    reference: z.string().optional(),
    /**
     * 封面圖片路徑／URL；留空時會依 category 自動產生品牌插畫。
     * 同樣的路徑寫法問題（缺開頭 /、多了 public/ 前綴）在這裡也自動修正，
     * 邏輯跟文章內文圖片共用，見 normalize-image-path.mjs。
     */
    cover: z
      .string()
      .optional()
      .transform((value) => normalizeImagePath(value)),
    /**
     * 這篇文章的圖（cover 和／或內文插圖）是否由 AI 生成。由
     * scripts/generate-article-images.mjs 自動寫入，用來決定要不要顯示
     * AI 配圖聲明；不是所有文章都用 AI 配圖（例如書封照片），所以不能
     * 寫死全站顯示，要靠這個欄位判斷。
     */
    aiGenerated: z.boolean().default(false),
  }),
});

const selfStudy = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    /** 對應 src/lib/self-study-rooms.ts 的房間 slug，決定這篇單元歸在哪個自學室 */
    room: z.enum(['sex-and-addiction', 'intimacy', 'body']),
    /** 房間內的排序，數字小的排前面 */
    order: z.number().default(0),
    summary: z.string(),
    downloadPdf: z.string().optional(),
    downloadWord: z.string().optional(),
    /** AI 探索陪伴 Prompt；沒填就不顯示複製卡片區塊 */
    aiPrompt: z.string().optional(),
    /** 目前只有 standard-healing 一種免責文案，先寫死在 SelfStudyUnitPanel，
     * 保留這個欄位是為了未來如果需要不同性質單元（例如涉及更高風險內容）
     * 可以切換不同免責提醒，不用改 schema。 */
    disclaimerType: z.string().default('standard-healing'),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = {
  articles,
  // key 必須跟 src/content/ 底下的資料夾名稱一模一樣（self-study，不是 selfStudy）
  'self-study': selfStudy,
};
