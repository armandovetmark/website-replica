import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

let doc: Document;
beforeAll(() => {
  const { document } = parseHTML(readFileSync('dist/index.html', 'utf8'));
  doc = document as unknown as Document;
});

describe('BaseLayout', () => {
  it('sets lang and charset', () => {
    expect(doc.documentElement.getAttribute('lang')).toBe('en');
    expect(doc.querySelector('meta[charset]')).not.toBeNull();
  });

  it('sets a responsive viewport', () => {
    const v = doc.querySelector('meta[name="viewport"]');
    expect(v?.getAttribute('content')).toContain('width=device-width');
  });

  it('includes the GTM container script and noscript iframe', () => {
    const html = readFileSync('dist/index.html', 'utf8');
    expect(html).toContain('GTM-WJZMPJ92');
    expect(html).toContain('googletagmanager.com/ns.html');
  });

  it('renders a meta description', () => {
    expect(doc.querySelector('meta[name="description"]')).not.toBeNull();
  });
});
