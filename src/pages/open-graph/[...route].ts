import { getCollection } from 'astro:content';
import { OGImageRoute } from 'astro-og-canvas';

// Generate OG images for all posts in the collection
const collectionEntries = await getCollection('posts');

// Convert entries to an object keyed by post number (used in the image URL)
const pages = Object.fromEntries(
  collectionEntries.map(({ data }) => [
    String(data.number),
    {
      title: data.title,
      description: data.labels.join(', '),
    },
  ])
);

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  param: 'route',
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description,
    bgGradient: [[15, 15, 26]],
    color: [229, 231, 235],
    font: {
      title: {
        families: ['Noto Serif SC'],
        weight: 700,
      },
      description: {
        families: ['Noto Serif SC'],
      },
    },
    fonts: [
      'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap',
    ],
  }),
});
