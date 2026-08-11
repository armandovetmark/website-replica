import { describe, it, expect, beforeEach } from 'vitest';
import { initModals } from '../../src/scripts/modal';
import { initLightbox } from '../../src/scripts/lightbox';
import { isAnyOverlayOpen } from '../../src/scripts/overlay-lock';

beforeEach(() => {
  delete document.documentElement.dataset.modalEscBound;
  delete document.documentElement.dataset.lightboxEscBound;
  document.body.innerHTML = `
    <button data-modal-open="demo">open modal</button>
    <div class="modal-wrapper" data-modal="demo" hidden>
      <div class="modal"><button data-modal-close>close</button></div>
    </div>
    <a data-lightbox href="/a.jpg"><img src="/a-thumb.jpg" alt="A pug"></a>`;
  document.querySelector('.lightbox-overlay')?.remove();
  document.body.classList.remove('has-modal-open');
  initModals(document);
  initLightbox(document);
});

const modalTrigger = () => document.querySelector('[data-modal-open]') as HTMLElement;
const modalClose = () => document.querySelector('[data-modal-close]') as HTMLElement;
const lightboxLink = () => document.querySelector('[data-lightbox]') as HTMLElement;
const lightboxOverlay = () => document.querySelector('.lightbox-overlay') as HTMLElement;
const lightboxClose = () => document.querySelector('.lightbox-close') as HTMLElement;

describe('shared overlay lock (modal.ts + lightbox.ts)', () => {
  it('keeps has-modal-open locked when the modal closes while the lightbox is still open', () => {
    // Without a shared predicate, modal.ts's own close() only checks other
    // `.is-open[data-modal]` wrappers, so it would unlock scroll here even
    // though the lightbox overlay is still open.
    lightboxLink().click();
    modalTrigger().click();
    modalClose().click();
    expect(document.body.classList.contains('has-modal-open')).toBe(true);
    expect(lightboxOverlay().classList.contains('is-open')).toBe(true);
  });

  it('keeps has-modal-open locked when the lightbox closes while the modal is still open', () => {
    // Mirror case: lightbox.ts's own close() used to clear the class
    // unconditionally, ignoring a still-open modal.
    modalTrigger().click();
    lightboxLink().click();
    lightboxClose().click();
    expect(document.body.classList.contains('has-modal-open')).toBe(true);
    expect(document.querySelector('[data-modal="demo"]')!.classList.contains('is-open')).toBe(true);
  });

  it('unlocks scroll once both overlays are closed', () => {
    lightboxLink().click();
    modalTrigger().click();
    modalClose().click();
    lightboxClose().click();
    expect(document.body.classList.contains('has-modal-open')).toBe(false);
  });

  it('isAnyOverlayOpen reflects the modal wrapper state', () => {
    expect(isAnyOverlayOpen(document)).toBe(false);
    modalTrigger().click();
    expect(isAnyOverlayOpen(document)).toBe(true);
  });

  it('isAnyOverlayOpen reflects the lightbox overlay state', () => {
    expect(isAnyOverlayOpen(document)).toBe(false);
    lightboxLink().click();
    expect(isAnyOverlayOpen(document)).toBe(true);
  });
});
