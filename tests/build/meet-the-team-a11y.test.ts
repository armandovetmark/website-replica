import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

let doc: Document;
beforeAll(() => {
  doc = parseHTML(readFileSync('dist/meet-the-team/index.html', 'utf8')).document as unknown as Document;
});

describe('About page structure', () => {
  it('has exactly one main landmark', () => {
    expect(doc.querySelectorAll('main')).toHaveLength(1);
  });

  it('has exactly TWO h1 elements — a real, deliberately-replicated live oddity', () => {
    // Unlike the homepage (which the brief for that page confirmed has ZERO
    // <h1>s), this page has TWO: the page header's "The veterinary internal
    // medicine group" (.display-1.banner-title) and the staff card's
    // "Kathy G." (.staff-name). Both are genuine <h1> elements on the live
    // site — confirmed directly in tools/snapshots/meet-the-team.html — not
    // an artifact of this port. Replicated as published rather than
    // "fixed" by demoting one to an h2; flagged here for the owner as a
    // real accessibility/SEO issue on the live page.
    const h1s = [...doc.querySelectorAll('h1')];
    expect(h1s).toHaveLength(2);
    expect(h1s[0].textContent).toBe('The veterinary internal medicine group');
    expect(h1s[1].textContent).toBe('Kathy G.');
  });

  it('gives every image an alt attribute', () => {
    const missing = [...doc.querySelectorAll('img')]
      .filter((img) => !img.hasAttribute('alt'))
      .map((img) => img.getAttribute('src'));
    expect(missing).toEqual([]);
  });

  it('gives every link an accessible name', () => {
    const unnamed = [...doc.querySelectorAll('a')].filter(
      (a) =>
        !a.textContent!.trim() &&
        !a.getAttribute('aria-label') &&
        !a.querySelector('img[alt]:not([alt=""])'),
    );
    expect(unnamed).toHaveLength(0);
  });

  it('ships no jQuery and no webflow.js', () => {
    const html = readFileSync('dist/meet-the-team/index.html', 'utf8');
    expect(html).not.toContain('jquery');
    expect(html).not.toContain('webflow.js');
  });

  it('opens every external link safely', () => {
    for (const a of doc.querySelectorAll('a[target="_blank"]')) {
      expect(a.getAttribute('rel') ?? '').toContain('noopener');
    }
  });
});
