import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

let doc: Document;
let html: string;
beforeAll(() => {
  html = readFileSync('dist/index.html', 'utf8');
  doc = parseHTML(html).document as unknown as Document;
});

describe('Footer', () => {
  it('renders a semantic footer', () => {
    expect(doc.querySelector('footer.footer')).not.toBeNull();
  });

  it('uses the real .container-2.container-footer wrapper, not .container', () => {
    // Corrected 2026-08-11: the live wrapper is .container-2.container-footer.
    // .container (this project's own shared base-layout class) was never the
    // real wrapper here.
    expect(doc.querySelector('footer .container-2.container-footer')).not.toBeNull();
  });

  it('contains the callbar', () => {
    expect(doc.querySelector('footer.footer .callbar')).not.toBeNull();
  });

  it('renders the practice phone and both social links', () => {
    // The phone link here comes from the CallBar (still rendered inside
    // <footer>), not a footer-owned PHONE box — that box never existed on
    // the real footer (see the desktop-grid describe block below).
    expect(doc.querySelector('footer a[href="tel:+17866735903"]')).not.toBeNull();
    expect(doc.querySelector('footer a[href*="facebook.com/theVIMG"]')).not.toBeNull();
    expect(doc.querySelector('footer a[href*="instagram.com/thevimg"]')).not.toBeNull();
  });

  it('renders the reviews container and write-review link', () => {
    expect(doc.querySelector('#reviews-container')).not.toBeNull();
    expect(doc.querySelector('a[href*="writereview"]')).not.toBeNull();
  });

  it('shows the Google reviews badge (live CSS leaves it unreachable; owner asked to surface it)', () => {
    // On the live site .google-reviews-widget-wrapper-2 is display:none above
    // 767px, and even where it flips to display:block at/below 767px, its
    // child .google-reviews-widget-1 (the actual visible pill) is
    // display:none there — so the badge is never shown at any width on the
    // live site. The project owner confirmed (2026-08-11) they want it
    // surfaced anyway, so neither element carries a display:none toggle here.
    const cssHref = doc.querySelector('link[rel="stylesheet"]')?.getAttribute('href');
    expect(cssHref).toBeTruthy();
    const css = readFileSync(`dist${cssHref}`, 'utf8');
    expect(css).not.toMatch(/\.google-reviews-widget-wrapper-2\{[^}]*display:none/);
    expect(css).not.toMatch(/\.google-reviews-widget-1\{[^}]*display:none/);
  });

  it('loads Vetstoria and UserWay', () => {
    expect(html).toContain('oabp-widget-floating-button.min.js');
    expect(html).toContain('cdn.userway.org/widget.js');
  });

  it('omits the dead legacy footer block', () => {
    expect(doc.querySelector('.old-footer-new-template')).toBeNull();
  });

  it('renders the footer-bottom copyright and signature line', () => {
    const bottom = doc.querySelector('.footer-bottom-2');
    expect(bottom).not.toBeNull();
    expect(bottom!.textContent).toContain('The Veterinary Internal Medicine Group (VIMG)');
    expect(bottom!.textContent).toContain('Made with love');
    const marketingLink = bottom!.querySelector('a[href="http://veterinarymarketing.com/"]');
    expect(marketingLink).not.toBeNull();
    expect(marketingLink!.getAttribute('rel')).toContain('noopener');
  });

  describe('desktop grid (.footer-grid-desktop, ≥768px)', () => {
    const grid = () => doc.querySelector('.footer-grid-desktop')!;

    it('exists, distinct from the mobile grid', () => {
      expect(grid()).not.toBeNull();
      expect(doc.querySelector('.footer-grid-mobile')).not.toBeNull();
      expect(grid()).not.toBe(doc.querySelector('.footer-grid-mobile'));
    });

    it('renders exactly 4 .footer-box-2 boxes (the 5-column grid has one intentionally empty trailing column)', () => {
      // Corrected 2026-08-11: an earlier pass rendered 7 boxes here (About
      // Us, Services, Resources, PHONE, ADDRESS, EMAIL, HOURS), mis-extracted
      // from .old-footer-new-template, a hidden dead block. The real
      // .footer-grid-desktop has exactly 4 .footer-box-2 children.
      expect(grid().querySelectorAll(':scope > .footer-box-2')).toHaveLength(4);
    });

    it('renders sentence-case box headings, not uppercase — the fourth box has none', () => {
      const headings = [...grid().querySelectorAll('.footer-heading-2')].map((h) => h.textContent);
      expect(headings).toEqual(['About Us', 'Services', 'Resources']);
    });

    it('renders all 8 CMS-driven service links in the live collection order, not alphabetical', () => {
      const links = [...grid().querySelectorAll('a[href^="/services/"]')];
      expect(links).toHaveLength(8);
      expect(links.map((a) => a.getAttribute('href'))).toEqual([
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

    it("renders the About Us and Resources links, and How'd we do? as a real button", () => {
      expect(grid().querySelector('a[href="/meet-the-team"]')).not.toBeNull();
      expect(grid().querySelector('a[href="/conferences"]')).not.toBeNull();
      const howd = grid().querySelector('[data-modal-open="howd-we-do"]');
      expect(howd).not.toBeNull();
      expect(howd!.tagName.toLowerCase()).toBe('button');
      expect(grid().querySelector('a[href="/general-information-request"]')).not.toBeNull();
      expect(grid().querySelector('a[href="/appointment-request"]')).not.toBeNull();
      expect(grid().querySelector('a[href="/blog"]')).not.toBeNull();
    });

    it('omits the PHONE, ADDRESS, EMAIL, and HOURS boxes entirely — they only ever existed in the dead legacy block', () => {
      expect(grid().querySelector('#office-hours')).toBeNull();
      expect(grid().querySelector('a[href^="mailto:"]')).toBeNull();
      expect(grid().querySelector('a[href="https://maps.app.goo.gl/Kxfh8pL4dFhW4prdA"]')).toBeNull();
      expect(grid().textContent).not.toContain('(305) 677-2015');
    });

    it('omits the draft Photo Gallery link (page is draft:true on the live site)', () => {
      expect(grid().textContent).not.toContain('Photo Gallery');
    });

    it('renders the ACVIM badge image and a real (non-empty) SVG for each social icon, Instagram before Facebook', () => {
      expect(grid().querySelector('img.image-8')).not.toBeNull();
      const links = [...grid().querySelectorAll('.social-icon-link-3')];
      expect(links).toHaveLength(2);
      expect(links.map((a) => a.getAttribute('href'))).toEqual([
        'https://www.instagram.com/thevimg/',
        'https://www.facebook.com/theVIMG/',
      ]);
      for (const link of links) {
        expect(link.querySelector('svg')).not.toBeNull();
      }
    });
  });

  describe('mobile grid (.footer-grid-mobile, ≤767px)', () => {
    const grid = () => doc.querySelector('.footer-grid-mobile')!;

    it('renders the real 3-section accordion (About Us / Services / Resources), not a flat link list', () => {
      // Regression guard for the bug this describe block exists to catch: an
      // earlier pass left .footer-grid-mobile with invented placeholder
      // content (1 generic /services link, plain-text social links) while
      // only .footer-grid-desktop got the real 7-box content. linkedom
      // doesn't evaluate CSS `display`, so a selector scoped to `footer`
      // alone can't tell which grid is actually visible at a given
      // breakpoint — these assertions are scoped to .footer-grid-mobile
      // specifically so a regression here fails even though the desktop
      // grid (checked above) still looks correct.
      const triggers = [...grid().querySelectorAll('.accordion-trigger.footer-accordion')];
      expect(triggers).toHaveLength(3);

      const buttons = [...grid().querySelectorAll('.accordion-header-footer')];
      expect(buttons).toHaveLength(3);
      for (const button of buttons) {
        expect(button.tagName.toLowerCase()).toBe('button');
        expect(button.getAttribute('aria-expanded')).toBe('false');
      }

      const headings = [...grid().querySelectorAll('.mobile-footer-heading-2')].map((h) => h.textContent);
      expect(headings).toEqual(['About Us', 'Services', 'Resources']);
    });

    it('renders all 8 CMS-driven service links in the live collection order, not alphabetical', () => {
      const links = [...grid().querySelectorAll('a[href^="/services/"]')];
      expect(links.map((a) => a.getAttribute('href'))).toEqual([
        '/services/specialty-vet-care-education',
        '/services/ultrasound-fine-needle-aspirates',
        '/services/ultrasound',
        '/services/thoracic-ultrasounds-non-cardiac',
        '/services/pregnancy-checks',
        '/services/internal-medicine-consults',
        '/services/miscellaneous-diagnostic-procedures-abdominocentesis-thoracocentesis-pericardiocentesis',
        '/services/advanced-imaging-options-ct-and-fluoroscopy-via-collaboration-with-mpi',
      ]);
      expect(grid().querySelector('a[href="/services"]')).toBeNull();
    });

    it("renders Conferences, How'd we do?, Request an Appointment, and Our Blog — present on the live site but missing from an earlier pass", () => {
      expect(grid().querySelector('a[href="/conferences"]')).not.toBeNull();
      expect(grid().querySelector('[data-modal-open="howd-we-do"]')).not.toBeNull();
      expect(grid().querySelector('a[href="/appointment-request"]')).not.toBeNull();
      expect(grid().querySelector('a[href="/blog"]')).not.toBeNull();
    });

    it('does NOT contain PHONE/ADDRESS/EMAIL/HOURS — verified absent from the live mobile accordion too', () => {
      // Not an oversight: tools/snapshots/home.html's real .footer-grid-mobile
      // block has no PHONE/ADDRESS/EMAIL/HOURS content at all — only About
      // Us / Services / Resources sections plus a trailing social row.
      expect(grid().querySelector('#office-hours')).toBeNull();
      expect(grid().querySelector('a[href^="mailto:"]')).toBeNull();
      expect(grid().querySelector('a[href="https://maps.app.goo.gl/Kxfh8pL4dFhW4prdA"]')).toBeNull();
      expect(grid().textContent).not.toContain('(305) 677-2015');
    });

    it('renders the trailing social row with real SVG icons, Instagram before Facebook', () => {
      // Corrected 2026-08-11: the live mobile row (.social-icon-link-4) is
      // also Instagram-then-Facebook, same as the desktop box — not
      // Facebook-first. Icons were empty .ci-font placeholders; now real SVGs.
      const links = [...grid().querySelectorAll('.social-icon-link-4')];
      expect(links).toHaveLength(2);
      expect(links.map((a) => a.getAttribute('href'))).toEqual([
        'https://www.instagram.com/thevimg/',
        'https://www.facebook.com/theVIMG/',
      ]);
      for (const link of links) {
        expect(link.querySelector('svg')).not.toBeNull();
      }
    });

    it('omits the draft Photo Gallery link (hidden on the live site in both grids)', () => {
      expect(grid().textContent).not.toContain('Photo Gallery');
    });
  });
});
