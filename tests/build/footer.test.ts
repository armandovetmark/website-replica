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

  it('contains the callbar', () => {
    expect(doc.querySelector('footer.footer .callbar')).not.toBeNull();
  });

  it('renders the practice phone and both social links', () => {
    expect(doc.querySelector('footer a[href="tel:+17866735903"]')).not.toBeNull();
    expect(doc.querySelector('footer a[href*="facebook.com/theVIMG"]')).not.toBeNull();
    expect(doc.querySelector('footer a[href*="instagram.com/thevimg"]')).not.toBeNull();
  });

  it('shows the live display number but still dials the confirmed tel: number (intentional mismatch)', () => {
    const phoneLink = doc.querySelector('footer a[href="tel:+17866735903"]');
    expect(phoneLink).not.toBeNull();
    expect(phoneLink!.textContent).toContain('(305) 677-2015');
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

  describe('desktop grid (.footer-grid-desktop, ≥768px)', () => {
    const grid = () => doc.querySelector('.footer-grid-desktop')!;

    it('exists, distinct from the mobile grid', () => {
      expect(grid()).not.toBeNull();
      expect(doc.querySelector('.footer-grid-mobile')).not.toBeNull();
      expect(grid()).not.toBe(doc.querySelector('.footer-grid-mobile'));
    });

    it('renders all 8 CMS-driven service links', () => {
      const links = [...grid().querySelectorAll('a[href^="/services/"]')];
      expect(links).toHaveLength(8);
    });

    it('renders the ADDRESS, EMAIL, and HOURS boxes', () => {
      const addressLinks = grid().querySelectorAll('a[href="https://maps.app.goo.gl/Kxfh8pL4dFhW4prdA"]');
      expect(addressLinks.length).toBe(2);
      expect(grid().textContent).toContain('12968 Southwest 132nd Avenue');
      expect(grid().textContent).toContain('Miami, FL 33186');

      expect(grid().querySelector('a[href="mailto:armstrongacvim@gmail.com"]')).not.toBeNull();

      const hoursBox = grid().querySelector('#office-hours');
      expect(hoursBox).not.toBeNull();
      expect(hoursBox!.textContent).toContain('Monday - Friday');
    });

    it('omits the draft Photo Gallery link (page is draft:true on the live site)', () => {
      expect(grid().textContent).not.toContain('Photo Gallery');
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

    it('renders all 8 CMS-driven service links, not the single generic /services link from an earlier pass', () => {
      const links = [...grid().querySelectorAll('a[href^="/services/"]')];
      expect(links).toHaveLength(8);
      expect(grid().querySelector('a[href="/services"]')).toBeNull();
    });

    it('renders Conferences, How’d we do?, Request an Appointment, and Our Blog — present on the live site but missing from an earlier pass', () => {
      expect(grid().querySelector('a[href="/conferences"]')).not.toBeNull();
      expect(grid().querySelector('[data-modal-open="howd-we-do"]')).not.toBeNull();
      expect(grid().querySelector('a[href="/appointment-request"]')).not.toBeNull();
      expect(grid().querySelector('a[href="/blog"]')).not.toBeNull();
    });

    it('does NOT contain PHONE/ADDRESS/EMAIL/HOURS — verified absent from the live mobile accordion too', () => {
      // Not an oversight: tools/snapshots/home.html's real .footer-grid-mobile
      // block has no PHONE/ADDRESS/EMAIL/HOURS content at all — only About
      // Us / Services / Resources sections plus a trailing social row. The
      // desktop-only PHONE/ADDRESS/EMAIL/HOURS boxes are asserted above,
      // scoped to .footer-grid-desktop; this asserts the live site's mobile
      // footer genuinely omits them, so a future pass doesn't "fix" this by
      // inventing content the live site doesn't have either.
      expect(grid().querySelector('#office-hours')).toBeNull();
      expect(grid().querySelector('a[href="mailto:armstrongacvim@gmail.com"]')).toBeNull();
      expect(grid().querySelector('a[href="https://maps.app.goo.gl/Kxfh8pL4dFhW4prdA"]')).toBeNull();
      expect(grid().textContent).not.toContain('(305) 677-2015');
    });

    it('renders the trailing social row with both platforms', () => {
      const links = [...grid().querySelectorAll('.social-icon-link-4')];
      expect(links).toHaveLength(2);
      expect(links.map((a) => a.getAttribute('href'))).toEqual([
        'https://www.facebook.com/theVIMG/',
        'https://www.instagram.com/thevimg/',
      ]);
    });

    it('omits the draft Photo Gallery link (hidden on the live site in both grids)', () => {
      expect(grid().textContent).not.toContain('Photo Gallery');
    });
  });
});
