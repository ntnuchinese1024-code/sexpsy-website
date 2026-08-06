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

export const collections = {
  articles,
};
