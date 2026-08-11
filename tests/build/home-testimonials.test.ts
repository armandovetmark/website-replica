import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

let doc: Document;
beforeAll(() => {
  doc = parseHTML(readFileSync('dist/index.html', 'utf8')).document as unknown as Document;
});

describe('appointment CTA and testimonials', () => {
  it('renders the appointment CTA section', () => {
    expect(doc.querySelector('.book-appointment')).not.toBeNull();
  });

  it('links the CTA to the appointment request page', () => {
    expect(doc.querySelector('.book-appointment a[href="/appointment-request"]')).not.toBeNull();
  });

  it('renders the testimonial slider with labelled controls', () => {
    const slider = doc.querySelector('.testimonial-container [data-slider]');
    expect(slider).not.toBeNull();
    expect(slider!.querySelector('[data-slider-prev]')!.getAttribute('aria-label')).toBeTruthy();
    expect(slider!.querySelector('[data-slider-next]')!.getAttribute('aria-label')).toBeTruthy();
  });

  it('renders at least two testimonial slides', () => {
    const track = doc.querySelector('.testimonial-container [data-slider-track]');
    expect(track!.children.length).toBeGreaterThanOrEqual(2);
  });

  it('renders all 14 testimonials verbatim from the live site', () => {
    const track = doc.querySelector('.testimonial-container [data-slider-track]');
    expect(track!.children.length).toBe(14);
    const first = track!.querySelector('.testimonial-paragraph');
    expect(first!.textContent).toContain('excellent care for my senior dog');
  });

  it('links the first reviewer name to their Google Maps profile', () => {
    const link = doc.querySelector('.testimonial-container .link-2') as HTMLAnchorElement | null;
    expect(link).not.toBeNull();
    expect(link!.getAttribute('href')).toContain('google.com/maps/contrib');
  });

  it('renders a testimonial with two name lines (name + clinic)', () => {
    const names = [...doc.querySelectorAll('.testimonial-container .patients-name-testimonial')];
    const grouped = new Map<Element, number>();
    for (const h3 of names) {
      const parent = h3.closest('.testimonial')!;
      grouped.set(parent, (grouped.get(parent) ?? 0) + 1);
    }
    expect([...grouped.values()]).toContain(2);
  });
});
