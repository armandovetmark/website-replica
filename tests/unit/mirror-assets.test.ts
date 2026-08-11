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
