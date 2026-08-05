import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    summary: z.string(),
    reference: z.string().optional(),
    /** 封面圖片路徑／URL；留空時會依 category 自動產生品牌插畫 */
    cover: z.string().optional(),
  }),
});

export const collections = {
  articles,
};
