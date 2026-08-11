import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

let doc: Document;
let html: string;
beforeAll(() => {
  html = readFileSync('dist/index.html', 'utf8');
  const { document } = parseHTML(html);
  doc = document as unknown as Document;
});

describe('modals', () => {
  it('renders both modals with dialog semantics', () => {
    for (const id of ['referring-clinics', 'howd-we-do']) {
      const el = doc.querySelector(`[data-modal="${id}"]`);
      expect(el, `missing modal ${id}`).not.toBeNull();
      expect(el!.getAttribute('role')).toBe('dialog');
      expect(el!.getAttribute('aria-modal')).toBe('true');
    }
  });

  it('starts hidden', () => {
    expect(doc.querySelector('[data-modal="howd-we-do"]')!.hasAttribute('hidden')).toBe(true);
  });

  it('points the review CTA at the practice Place ID', () => {
    const link = doc.querySelector('[data-modal="howd-we-do"] a[href*="writereview"]');
    expect(link?.getAttribute('href')).toContain('ChIJhw8-GA3X3ogRu7g-W6oUCQU');
  });

  it('does not render the expired scheduled popup', () => {
    expect(doc.querySelector('[data-modal="scheduled"]')).toBeNull();
  });

  it('ships no script referencing the scheduled popup when it is inactive', () => {
    // scheduledPopup.enabled is false, so ScheduledPopup.astro must emit
    // zero markup AND zero JavaScript - not just a hidden node.
    expect(html).not.toContain('scheduled-popup-seen');
  });

  it('gives every modal wrapper an accessible label target that exists in the document', () => {
    for (const id of ['referring-clinics', 'howd-we-do']) {
      const el = doc.querySelector(`[data-modal="${id}"]`)!;
      const labelledBy = el.getAttribute('aria-labelledby');
      expect(labelledBy, `${id} missing aria-labelledby`).toBeTruthy();
      expect(doc.getElementById(labelledBy!), `${id} aria-labelledby target missing`).not.toBeNull();
    }
  });

  it('exposes a close control in every modal', () => {
    for (const id of ['referring-clinics', 'howd-we-do']) {
      const el = doc.querySelector(`[data-modal="${id}"]`)!;
      expect(el.querySelector('[data-modal-close]')).not.toBeNull();
    }
  });
});
