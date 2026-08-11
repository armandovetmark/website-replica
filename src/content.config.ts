import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const base = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    lastPublished: z.string().nullable().optional(),
  })
  .passthrough();

const make = (dir: string) =>
  defineCollection({
    loader: glob({ pattern: '**/*.json', base: `./src/content/${dir}` }),
    schema: base,
  });

export const collections = {
  services: make('services'),
  servicesCategories: make('services-categories'),
  doctors: make('doctors'),
  staff: make('staff'),
  blog: make('blog'),
  blogCategories: make('blog-categories'),
  locations: make('locations'),
  dates: make('dates'),
  practiceInformation: make('practice-information'),
  socialLinks: make('social-links'),
};
