import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

describe('build output', () => {
  it('produces dist/index.html', () => {
    expect(existsSync('dist/index.html')).toBe(true);
  });

  it('renders the page title', () => {
    const html = readFileSync('dist/index.html', 'utf8');
    expect(html).toContain('<title>');
  });
});
