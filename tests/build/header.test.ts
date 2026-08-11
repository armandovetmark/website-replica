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

  it('shows the live display number but still dials the confirmed tel: number (intentional mismatch)', () => {
    // Moved here from footer.test.ts (2026-08-11): the footer no longer has
    // its own PHONE box (that box only ever existed in the dead legacy
    // block), but this same display/dial split is real, owner-confirmed
    // behavior on .practice-info-navbar in the header — worth keeping
    // covered somewhere real rather than dropped along with the footer box.
    const phoneLink = doc.querySelector('.practice-info-navbar[href="tel:+17866735903"]');
    expect(phoneLink).not.toBeNull();
    expect(phoneLink!.textContent).toContain('(305) 677-2015');
  });

  it('renders the Services dropdown in the live Webflow collection order, not alphabetical', () => {
    const links = [...doc.querySelectorAll('.dropdown-link[href^="/services/"]')].map((a) =>
      a.getAttribute('href'),
    );
    expect(links).toEqual([
      '/services/specialty-vet-care-education',
      '/services/ultrasound-fine-needle-aspirates',
      '/services/ultrasound',
      '/services/thoracic-ultrasounds-non-cardiac',
      '/services/pregnancy-checks',
      '/services/internal-medicine-consults',
      '/services/miscellaneous-diagnostic-procedures-abdominocentesis-thoracocentesis-pericardiocentesis',
      '/services/advanced-imaging-options-ct-and-fluoroscopy-via-collaboration-with-mpi',
    ]);
  });

  it('renders real SVG social icons, not empty ci-font placeholders', () => {
    const links = [...doc.querySelectorAll('.social-icon-link')];
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link.querySelector('svg')).not.toBeNull();
    }
  });

  it('does not render the hidden Virtual Office Tour child', () => {
    expect(doc.body.textContent).not.toContain('Virtual Office Tour');
  });

  it("renders the How'd We Do trigger as a real button with the modal attribute", () => {
    const trigger = doc.querySelector('.dropdown-link[data-modal-open="howd-we-do"]');
    expect(trigger).not.toBeNull();
    expect(trigger?.tagName.toLowerCase()).toBe('button');
  });
});
