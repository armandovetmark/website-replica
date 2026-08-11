import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

let doc: Document;
beforeAll(() => {
  const { document } = parseHTML(readFileSync('dist/index.html', 'utf8'));
  doc = document as unknown as Document;
});

describe('Header', () => {
  it('renders the header and navbar', () => {
    expect(doc.querySelector('.header')).not.toBeNull();
    expect(doc.querySelector('.navbar')).not.toBeNull();
  });

  it('renders both logo variants for the scroll swap', () => {
    expect(doc.querySelector('.brand .logo-white')).not.toBeNull();
    expect(doc.querySelector('.brand .logo')).not.toBeNull();
  });

  it('renders the Spanish banner', () => {
    expect(doc.body.textContent).toContain('Hablamos español!');
  });

  it('renders 8 top-level nav entries', () => {
    expect(doc.querySelectorAll('.nav-menu > .line-animation-block')).toHaveLength(8);
  });

  it('renders the Services dropdown from the CMS with an All Services link', () => {
    const links = [...doc.querySelectorAll('.dropdown-link')].map((a) => a.getAttribute('href'));
    expect(links).toContain('/services');
    expect(links.some((h) => h?.startsWith('/services/'))).toBe(true);
  });

  it('uses a real button for the menu toggle', () => {
    const button = doc.querySelector('.menu-button');
    expect(button?.tagName.toLowerCase()).toBe('button');
    expect(button?.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders the scroll sentinel before the page content', () => {
    expect(doc.querySelector('[data-scroll-sentinel]')).not.toBeNull();
  });

  it('links the header phone icon to the practice number', () => {
    expect(doc.querySelector('.header a[href="tel:+17866735903"]')).not.toBeNull();
  });
});
