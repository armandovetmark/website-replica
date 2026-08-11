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

  it('renders the reviews container and write-review link', () => {
    expect(doc.querySelector('#reviews-container')).not.toBeNull();
    expect(doc.querySelector('a[href*="writereview"]')).not.toBeNull();
  });

  it('loads Vetstoria and UserWay', () => {
    expect(html).toContain('oabp-widget-floating-button.min.js');
    expect(html).toContain('cdn.userway.org/widget.js');
  });

  it('omits the dead legacy footer block', () => {
    expect(doc.querySelector('.old-footer-new-template')).toBeNull();
  });
});
