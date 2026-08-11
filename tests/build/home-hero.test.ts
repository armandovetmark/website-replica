import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

let doc: Document;
beforeAll(() => {
  doc = parseHTML(readFileSync('dist/index.html', 'utf8')).document as unknown as Document;
});

describe('homepage hero', () => {
  it('renders the hero section', () => {
    expect(doc.querySelector('.hero')).not.toBeNull();
  });

  it('reproduces the live heading structure', () => {
    // The live hero has NO <h1>: its only heading is an <h6> inside .hero-content
    // ("internal medicine consults & ultrasounds"), with "WELCOME TO" sitting in
    // .hero-tagline-home. Replicate as published; the missing h1 is a real SEO
    // gap on the live site, recorded for the owner rather than silently "fixed".
    expect(doc.querySelectorAll('.hero h1')).toHaveLength(0);
    expect(doc.querySelector('.hero h6')?.textContent).toContain('internal medicine consults');
  });

  it('renders a background video with a poster fallback', () => {
    const video = doc.querySelector('.hero-background video');
    expect(video).not.toBeNull();
    expect(video!.hasAttribute('poster')).toBe(true);
    expect(video!.hasAttribute('muted')).toBe(true);
    expect(video!.hasAttribute('playsinline')).toBe(true);
  });

  it('renders a primary hero CTA', () => {
    expect(doc.querySelector('.hero a.button')).not.toBeNull();
  });

  it('renders the collage section', () => {
    expect(doc.querySelector('.collage-container')).not.toBeNull();
  });
});
