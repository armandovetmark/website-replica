import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initSlider } from '../../src/scripts/slider';

beforeEach(() => {
  document.body.innerHTML = `
    <div data-slider>
      <div data-slider-track>
        <div class="slide">1</div><div class="slide">2</div><div class="slide">3</div>
      </div>
      <button data-slider-prev>prev</button>
      <button data-slider-next>next</button>
    </div>`;
  const track = document.querySelector('[data-slider-track]') as HTMLElement;
  Object.defineProperty(track, 'clientWidth', { value: 300, configurable: true });
  track.scrollBy = vi.fn();
  initSlider(document);
});

const track = () => document.querySelector('[data-slider-track]') as HTMLElement;

describe('initSlider', () => {
  it('scrolls forward by one slide width on next', () => {
    (document.querySelector('[data-slider-next]') as HTMLElement).click();
    expect(track().scrollBy).toHaveBeenCalledWith({ left: 300, behavior: 'smooth' });
  });

  it('scrolls backward on prev', () => {
    (document.querySelector('[data-slider-prev]') as HTMLElement).click();
    expect(track().scrollBy).toHaveBeenCalledWith({ left: -300, behavior: 'smooth' });
  });

  it('does not throw when there is no slider on the page', () => {
    document.body.innerHTML = '';
    expect(() => initSlider(document)).not.toThrow();
  });

  it('does not double-bind the next/prev listeners on a second init', () => {
    // Without the dataset guard, a second init() would attach a second
    // click handler to each control, so one click would call scrollBy twice.
    initSlider(document);
    (document.querySelector('[data-slider-next]') as HTMLElement).click();
    expect(track().scrollBy).toHaveBeenCalledTimes(1);
  });
});
