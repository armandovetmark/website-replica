import { describe, it, expect, beforeEach } from 'vitest';
import { initLightbox } from '../../src/scripts/lightbox';

beforeEach(() => {
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
});
