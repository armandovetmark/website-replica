import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initLightbox } from '../../src/scripts/lightbox';

beforeEach(() => {
  delete document.documentElement.dataset.lightboxEscBound;
  document.body.innerHTML = `
    <a data-lightbox href="/a.jpg"><img src="/a-thumb.jpg" alt="A pug"></a>
    <a data-lightbox href="/b.jpg"><img src="/b-thumb.jpg" alt="A cat"></a>`;
  document.querySelector('.lightbox-overlay')?.remove();
  initLightbox(document);
});

const overlay = () => document.querySelector('.lightbox-overlay') as HTMLElement;

describe('initLightbox', () => {
  it('opens with the clicked image and its alt text', () => {
    (document.querySelectorAll('[data-lightbox]')[1] as HTMLElement).click();
    expect(overlay().classList.contains('is-open')).toBe(true);
    const img = overlay().querySelector('img')!;
    expect(img.getAttribute('src')).toBe('/b.jpg');
    expect(img.getAttribute('alt')).toBe('A cat');
  });

  it('closes on Escape', () => {
    (document.querySelector('[data-lightbox]') as HTMLElement).click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(overlay().classList.contains('is-open')).toBe(false);
  });

  it('closes when the backdrop is clicked', () => {
    (document.querySelector('[data-lightbox]') as HTMLElement).click();
    overlay().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay().classList.contains('is-open')).toBe(false);
  });

  it('prevents the anchor from navigating', () => {
    const link = document.querySelector('[data-lightbox]') as HTMLElement;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('does not create a second overlay on a repeated init call (idempotence guard)', () => {
    // beforeEach already called initLightbox(document) once above; this is
    // the second call on the same, unreset document.
    initLightbox(document);
    expect(document.querySelectorAll('.lightbox-overlay')).toHaveLength(1);
  });

  it('does not double-bind a link click listener on repeated init calls', () => {
    // Without the per-link dataset.lightboxBound guard, a second initLightbox()
    // call would attach a second click handler to the same link. Toggling
    // alone wouldn't catch that (open() isn't a toggle), so spy on
    // addEventListener directly, the same way nav.test.ts / modal.test.ts do.
    const link = document.querySelectorAll('[data-lightbox]')[0] as HTMLElement;
    const addEventListenerSpy = vi.spyOn(link, 'addEventListener');
    initLightbox(document);
    expect(addEventListenerSpy).not.toHaveBeenCalled();
    addEventListenerSpy.mockRestore();
  });

  it('binds the Escape listener only once across repeated init calls', () => {
    delete document.documentElement.dataset.lightboxEscBound;
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    initLightbox(document);
    initLightbox(document);
    const keydownCalls = addEventListenerSpy.mock.calls.filter(
      ([eventName]) => eventName === 'keydown'
    );
    expect(keydownCalls).toHaveLength(1);
    addEventListenerSpy.mockRestore();
  });
});
