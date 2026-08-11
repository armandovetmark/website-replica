import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initReveal } from '../../src/scripts/reveal';

let callback: (entries: { isIntersecting: boolean; target: Element }[]) => void;
const unobserve = vi.fn();

beforeEach(() => {
  unobserve.mockClear();
  document.body.innerHTML = '<div class="reveal" id="a"></div>';
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: typeof callback) { callback = cb; }
    observe() {} unobserve = unobserve; disconnect() {}
  });
});

describe('initReveal', () => {
  it('adds is-visible when the element enters the viewport', () => {
    initReveal(document);
    const el = document.getElementById('a')!;
    callback([{ isIntersecting: true, target: el }]);
    expect(el.classList.contains('is-visible')).toBe(true);
  });

  it('stops observing once revealed', () => {
    initReveal(document);
    const el = document.getElementById('a')!;
    callback([{ isIntersecting: true, target: el }]);
    expect(unobserve).toHaveBeenCalledWith(el);
  });

  it('leaves elements alone until they intersect', () => {
    initReveal(document);
    const el = document.getElementById('a')!;
    callback([{ isIntersecting: false, target: el }]);
    expect(el.classList.contains('is-visible')).toBe(false);
  });

  it('does not construct a second observer on a repeated init call (idempotence guard)', () => {
    // Mirrors nav.ts / modal.ts / footer-accordion.ts: init* must be safe to
    // call more than once. Without the dataset guard, every call would
    // re-observe already-bound targets with a brand new IntersectionObserver.
    const ctorSpy = vi.fn();
    vi.stubGlobal('IntersectionObserver', class {
      constructor(cb: typeof callback) { ctorSpy(); callback = cb; }
      observe() {} unobserve = unobserve; disconnect() {}
    });
    initReveal(document);
    initReveal(document);
    expect(ctorSpy).toHaveBeenCalledTimes(1);
  });
});
