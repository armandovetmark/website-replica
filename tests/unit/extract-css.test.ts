import { describe, it, expect } from 'vitest';
import { extractRules } from '../../tools/extract-css.mjs';

const CSS = `
.callbar{display:none;background:red}
.other{color:blue}
@media screen and (max-width:991px){.callbar{display:flex}}
`;

describe('extractRules', () => {
  it('returns rules matching the requested class', () => {
    const out = extractRules(CSS, ['callbar']);
    expect(out).toContain('display:none');
    expect(out).toContain('display:flex');
  });

  it('excludes unrelated rules', () => {
    expect(extractRules(CSS, ['callbar'])).not.toContain('color:blue');
  });

  it('annotates rules with their media query', () => {
    expect(extractRules(CSS, ['callbar'])).toContain('max-width:991px');
  });
});
