import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initModals } from '../../src/scripts/modal';

beforeEach(() => {
  delete document.documentElement.dataset.modalEscBound;
  document.body.innerHTML = `
    <button data-modal-open="demo">open</button>
    <div class="modal-wrapper" data-modal="demo" hidden>
      <div class="modal"><button data-modal-close>close</button></div>
    </div>`;
  document.body.classList.remove('has-modal-open');
  initModals(document);
});

const wrapper = () => document.querySelector('[data-modal="demo"]') as HTMLElement;

describe('initModals', () => {
  it('opens the modal on trigger click', () => {
    (document.querySelector('[data-modal-open]') as HTMLElement).click();
    expect(wrapper().classList.contains('is-open')).toBe(true);
    expect(wrapper().hasAttribute('hidden')).toBe(false);
  });

  it('locks body scroll while open', () => {
    (document.querySelector('[data-modal-open]') as HTMLElement).click();
    expect(document.body.classList.contains('has-modal-open')).toBe(true);
  });

  it('closes on the close button and unlocks scroll', () => {
    (document.querySelector('[data-modal-open]') as HTMLElement).click();
    (document.querySelector('[data-modal-close]') as HTMLElement).click();
    expect(wrapper().classList.contains('is-open')).toBe(false);
    expect(document.body.classList.contains('has-modal-open')).toBe(false);
  });

  it('closes on Escape', () => {
    (document.querySelector('[data-modal-open]') as HTMLElement).click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(wrapper().classList.contains('is-open')).toBe(false);
  });

  it('closes when the backdrop is clicked', () => {
    (document.querySelector('[data-modal-open]') as HTMLElement).click();
    wrapper().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(wrapper().classList.contains('is-open')).toBe(false);
  });

  it('keeps the modal open when its inner panel is clicked', () => {
    (document.querySelector('[data-modal-open]') as HTMLElement).click();
    (wrapper().querySelector('.modal') as HTMLElement)
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(wrapper().classList.contains('is-open')).toBe(true);
  });

  it('moves focus into the modal on open', () => {
    (document.querySelector('[data-modal-open]') as HTMLElement).click();
    expect(document.activeElement).toBe(document.querySelector('[data-modal-close]'));
  });

  it('does not double-bind the trigger listener', () => {
    // The dataset.modalBound guard must stop a second initModals() call from
    // attaching a second click handler to the same trigger. open() itself is
    // idempotent (not a toggle), so the only reliable way to catch a missing
    // guard is to prove addEventListener is never called again on re-init.
    const trigger = document.querySelector('[data-modal-open]') as HTMLElement;
    const addEventListenerSpy = vi.spyOn(trigger, 'addEventListener');
    initModals(document);
    expect(addEventListenerSpy).not.toHaveBeenCalled();
    addEventListenerSpy.mockRestore();
  });

  it('does not double-bind the wrapper backdrop/close listener', () => {
    // Same guard, on the wrapper element. Without it, every initModals() call
    // adds another click listener that runs close() again - harmless the first
    // time, but the accumulation is real and this is what actually proves it.
    const addEventListenerSpy = vi.spyOn(wrapper(), 'addEventListener');
    initModals(document);
    expect(addEventListenerSpy).not.toHaveBeenCalled();
    addEventListenerSpy.mockRestore();
  });

  it('binds the Escape listener only once across repeated init calls', () => {
    delete document.documentElement.dataset.modalEscBound;
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    initModals(document);
    initModals(document);
    const keydownCalls = addEventListenerSpy.mock.calls.filter(
      ([eventName]) => eventName === 'keydown'
    );
    expect(keydownCalls).toHaveLength(1);
    addEventListenerSpy.mockRestore();
  });
});
