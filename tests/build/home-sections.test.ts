import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

let doc: Document;
beforeAll(() => {
  doc = parseHTML(readFileSync('dist/index.html', 'utf8')).document as unknown as Document;
});

describe('homepage content sections', () => {
  it('renders the practice information section', () => {
    expect(doc.querySelector('.practice-information-container')).not.toBeNull();
  });

  it('renders at least one doctor card', () => {
    const section = doc.querySelector('.doctors-section-home');
    expect(section).not.toBeNull();
    expect(section!.querySelectorAll('a, article').length).toBeGreaterThan(0);
  });

  it('renders the services grid with links into /services/', () => {
    const grid = doc.querySelector('.services-homepage-grid');
    expect(grid).not.toBeNull();
    const hrefs = [...grid!.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs.some((h) => h?.startsWith('/services/'))).toBe(true);
  });

  it('gives every section image a decodable alt attribute', () => {
    for (const img of doc.querySelectorAll('.services-homepage-grid img, .doctors-section-home img')) {
      expect(img.hasAttribute('alt')).toBe(true);
    }
  });

  it('uses h2 for section headings and adds no h1', () => {
    // The brief's version of this test assumes a single existing <h1> and
    // asserts a count of 1. The live homepage has none at all (see the
    // comment in Hero.astro / the task-13 report) and this task's own
    // instructions say not to add one, so the correct assertion here is 0,
    // not 1 — verified against the actual `astro build` output.
    expect(doc.querySelectorAll('h1')).toHaveLength(0);
    expect(doc.querySelectorAll('h2').length).toBeGreaterThan(0);
  });
});
