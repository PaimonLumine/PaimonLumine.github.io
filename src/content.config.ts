import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    number: z.number(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    state: z.enum(['open', 'closed']).default('open'),
    labels: z.array(z.string()).default([]),
    milestone: z.string().nullable().default(null),
    isSingleton: z.boolean().default(false),
    draft: z.boolean().default(false),
    cover: z.string().optional(),
  }),
});

export const collections = { posts };
