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
  }),
});

export const collections = {
  articles,
};
