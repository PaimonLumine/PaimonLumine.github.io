import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig } from '../site.config';

export async function GET(context: { site: URL }) {
  const posts = (await getCollection('posts'))
    .filter((post) => !post.data.isSingleton)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      link: `/post/${post.data.number}/`,
      categories: post.data.labels,
    })),
    customData: `<language>zh-cn</language>`,
  });
}
