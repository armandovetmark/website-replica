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

  it('renders the ADDRESS, EMAIL, and HOURS boxes', () => {
    const addressLinks = doc.querySelectorAll('footer a[href="https://maps.app.goo.gl/Kxfh8pL4dFhW4prdA"]');
    expect(addressLinks.length).toBe(2);
    expect(doc.body.textContent).toContain('12968 Southwest 132nd Avenue');
    expect(doc.body.textContent).toContain('Miami, FL 33186');

    expect(doc.querySelector('footer a[href="mailto:armstrongacvim@gmail.com"]')).not.toBeNull();

    const hoursBox = doc.querySelector('#office-hours');
    expect(hoursBox).not.toBeNull();
    expect(hoursBox!.textContent).toContain('Monday - Friday');
  });

  it('renders the Services column with all 8 CMS-driven service links', () => {
    const links = [...doc.querySelectorAll('footer a[href^="/services/"]')];
    expect(links).toHaveLength(8);
  });

  it('omits the draft Photo Gallery link (page is draft:true on the live site)', () => {
    expect(doc.body.textContent).not.toContain('Photo Gallery');
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
});
