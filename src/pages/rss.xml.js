import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const articles = (await getCollection('articles')).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );

  return rss({
    title: '沙發上的性心理',
    description: '用心理學視角談性、談愛、談自己。',
    site: context.site,
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.summary,
      pubDate: article.data.date,
      link: `/articles/${article.slug}`,
      categories: [article.data.category, ...article.data.tags.map((tag) => tag.replace(/^#/, ''))],
    })),
    customData: '<language>zh-tw</language>',
  });
}
