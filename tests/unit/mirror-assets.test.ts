import { describe, it, expect } from 'vitest';
import { collectAssetUrls } from '../../scripts/mirror-assets.mjs';

const HTML = `
<img src="https://cdn.prod.website-files.com/abc/1_logo.png"/>
<img src="https://cdn.prod.website-files.com/abc/1_logo.png"/>
<img src="https://example.com/other.png"/>
<div style="background-image:url(https://cdn.prod.website-files.com/abc/2_phone.svg)"></div>
`;

describe('collectAssetUrls', () => {
  it('finds Webflow CDN assets', () => {
    const urls = collectAssetUrls(HTML);
    expect(urls).toContain('https://cdn.prod.website-files.com/abc/1_logo.png');
    expect(urls).toContain('https://cdn.prod.website-files.com/abc/2_phone.svg');
  });

  it('deduplicates', () => {
    expect(collectAssetUrls(HTML).filter((u) => u.endsWith('1_logo.png'))).toHaveLength(1);
  });

  it('ignores non-Webflow hosts', () => {
    expect(collectAssetUrls(HTML)).not.toContain('https://example.com/other.png');
  });
});

describe('collectAssetUrls edge cases (real homepage data)', () => {
  it('keeps a balanced trailing paren pair from a Webflow duplicate-upload suffix', () => {
    const html =
      '<img src="https://cdn.prod.website-files.com/abc/6965571c2a3cd71f3e9ea751_ACVIM_Diplomate_RGBL_H%20(1).png"/>';
    const urls = collectAssetUrls(html);
    expect(urls).toContain(
      'https://cdn.prod.website-files.com/abc/6965571c2a3cd71f3e9ea751_ACVIM_Diplomate_RGBL_H%20(1).png'
    );
  });

  it('strips the unbalanced trailing paren from an unquoted CSS url()', () => {
    const css = '.callbar-phone{background-image:url(https://cdn.prod.website-files.com/abc/phone.svg)}';
    const urls = collectAssetUrls(css);
    expect(urls).toContain('https://cdn.prod.website-files.com/abc/phone.svg');
    expect(urls).not.toContain('https://cdn.prod.website-files.com/abc/phone.svg)');
  });

  it('stops at the next CSS declaration when url() abuts it with no whitespace', () => {
    // Real shape from tools/snapshots/home.css: minified CSS puts no space between
    // the closing paren/semicolon and the next property, so a regex that only
    // excludes quotes/whitespace/comma would swallow the rest of the rule.
    const css =
      '.callbar-phone{background-image:url(https://cdn.prod.website-files.com/abc/phone.svg);background-position:50%;background-repeat:no-repeat;background-size:32px 32px}';
    const urls = collectAssetUrls(css);
    expect(urls).toContain('https://cdn.prod.website-files.com/abc/phone.svg');
    expect(urls.some((u) => u.includes('background-position'))).toBe(false);
  });

  it('stops at url(...)format(...) with no whitespace and balanced-but-misordered parens', () => {
    // Real shape from tools/snapshots/home.css's @font-face rule:
    // src:url(https://…icomoon.ttf)format("truetype") — "(" and ")" counts are
    // equal (1 each) so a simple count comparison doesn't catch this; the fix
    // must notice the ")" appears before any matching "(" within the match.
    const css =
      '@font-face{font-family:Custom Icons;src:url(https://cdn.prod.website-files.com/abc/icomoon.ttf)format("truetype");font-weight:400}';
    const urls = collectAssetUrls(css);
    expect(urls).toContain('https://cdn.prod.website-files.com/abc/icomoon.ttf');
    expect(urls.some((u) => u.includes('format'))).toBe(false);
  });

  it('splits a comma-joined data-video-urls attribute into two separate URLs', () => {
    const html =
      '<div data-video-urls="https://cdn.prod.website-files.com/abc/video_mp4.mp4,https://cdn.prod.website-files.com/abc/video_webm.webm"></div>';
    const urls = collectAssetUrls(html);
    expect(urls).toContain('https://cdn.prod.website-files.com/abc/video_mp4.mp4');
    expect(urls).toContain('https://cdn.prod.website-files.com/abc/video_webm.webm');
    expect(urls).toHaveLength(2);
  });

  it('decodes &quot; entities before matching so they do not leak into the URL', () => {
    const html =
      'data-json="{&quot;url&quot;:&quot;https://cdn.prod.website-files.com/abc/poster.jpg&quot;,&quot;other&quot;:1}"';
    const urls = collectAssetUrls(html);
    expect(urls).toContain('https://cdn.prod.website-files.com/abc/poster.jpg');
    expect(urls.some((u) => u.includes('&quot;'))).toBe(false);
  });
});
