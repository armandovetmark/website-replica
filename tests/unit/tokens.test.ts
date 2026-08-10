import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const EXPECTED: Record<string, string> = {
  '--text': '#333',
  '--main': '#616065',
  '--main-light': '#e6e6e8',
  '--white': 'white',
  '--main-soft': '#9a99a0',
  '--main-dark': '#3f3e42',
  '--cta': '#0ca4ac',
  '--cta-hover': '#08777d',
  '--secondary': '#616065',
  '--secodary-dark': '#3f3e42',
  '--main-soft-o50': '#eff5ff80',
  '--white-o85': '#ffffffd9',
  '--shadow': '#0000001a',
  '--overlay-color': '#00000080',
  '--main-o50': '#447cdb80',
  '--light-grey': '#d1d1d1',
};

describe('design tokens', () => {
  // Strip comments first: token names are mentioned in prose above the block,
  // and a bare regex would match there and capture the wrong value.
  const css = readFileSync('src/styles/tokens.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  it('defines all 16 Webflow Base variables with exact values', () => {
    for (const [name, value] of Object.entries(EXPECTED)) {
      const match = css.match(new RegExp(`\\${name}\\s*:\\s*([^;]+);`));
      expect(match, `missing ${name}`).not.toBeNull();
      expect(match![1].trim(), `wrong value for ${name}`).toBe(value);
    }
  });

  it('keeps the Webflow misspelling and adds a corrected alias', () => {
    expect(css).toContain('--secodary-dark');
    expect(css).toContain('--secondary-dark');
  });

  it('--font-body includes Montserrat Variable for self-hosted font', () => {
    const match = css.match(/--font-body\s*:\s*([^;]+);/);
    expect(match, 'missing --font-body').not.toBeNull();
    expect(match![1], '--font-body must include Montserrat Variable').toContain('Montserrat Variable');
  });
});
