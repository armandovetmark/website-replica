import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initHeaderScroll } from '../../src/scripts/header-scroll';

let callback: (entries: { isIntersecting: boolean }[]) => void;

beforeEach(() => {
  document.body.innerHTML = `
    <div class="header"><div class="navbar"></div></div>
    <main><div data-scroll-sentinel></div></main>`;
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: typeof callback) { callback = cb; }
    observe() {} disconnect() {}
  });
});

describe('initHeaderScroll', () => {
  it('adds is-scrolled when the sentinel leaves the viewport', () => {
    initHeaderScroll(document);
    callback([{ isIntersecting: false }]);
    expect(document.querySelector('.header')!.classList.contains('is-scrolled')).toBe(true);
  });

  it('removes is-scrolled when the sentinel is visible again', () => {
    initHeaderScroll(document);
    callback([{ isIntersecting: false }]);
    callback([{ isIntersecting: true }]);
    expect(document.querySelector('.header')!.classList.contains('is-scrolled')).toBe(false);
  });

  it('does nothing when there is no sentinel', () => {
    document.body.innerHTML = '<div class="header"></div>';
    expect(() => initHeaderScroll(document)).not.toThrow();
  });
});
