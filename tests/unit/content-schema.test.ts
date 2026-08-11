import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';

const COLLECTIONS = [
  'services', 'services-categories', 'doctors', 'staff', 'blog',
  'blog-categories', 'locations', 'dates', 'practice-information', 'social-links',
];

describe('exported content', () => {
  it('creates a directory per collection', () => {
    for (const c of COLLECTIONS) {
      expect(existsSync(`src/content/${c}`), `missing src/content/${c}`).toBe(true);
    }
  });

  it('exports at least one service and one doctor', () => {
    expect(readdirSync('src/content/services').length).toBeGreaterThan(0);
    expect(readdirSync('src/content/doctors').length).toBeGreaterThan(0);
  });
});
