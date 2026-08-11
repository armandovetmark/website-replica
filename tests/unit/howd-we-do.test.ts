import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initModals } from '../../src/scripts/modal';
import { initHowdWeDo } from '../../src/scripts/howd-we-do';

function fixture(): void {
  document.body.innerHTML = `
    <button data-modal-open="howd-we-do">open</button>
    <div class="modal-wrapper" data-modal="howd-we-do" hidden>
      <div class="modal">
        <button data-modal-close>close</button>
        <div class="rm-modal">
          <div class="rm-step" data-rm-step="1">
            <h2 id="howd-we-do-title">Tell us how we are doing?</h2>
            <button type="button" data-rm-choice="like">Like</button>
            <button type="button" data-rm-choice="dislike">Dislike</button>
          </div>
          <div class="rm-step" data-rm-step="like" hidden>
            <h2>Wonderful!</h2>
            <a href="https://example.com/review">Leave a review</a>
          </div>
          <div class="rm-step" data-rm-step="dislike" hidden>
            <h2>Sorry.</h2>
            <a href="/howd-we-do">Send feedback</a>
          </div>
        </div>
      </div>
    </div>`;
}

const step = (name: string) =>
  document.querySelector(`[data-rm-step="${name}"]`) as HTMLElement;
const openTrigger = () => document.querySelector('[data-modal-open]') as HTMLElement;
const closeBtn = () => document.querySelector('[data-modal-close]') as HTMLElement;
const likeBtn = () => document.querySelector('[data-rm-choice="like"]') as HTMLElement;

beforeEach(() => {
  delete document.documentElement.dataset.modalEscBound;
  fixture();
  document.body.classList.remove('has-modal-open');
  initModals(document);
  initHowdWeDo(document);
});

describe('initHowdWeDo', () => {
  it('switches to the chosen step and hides the others', () => {
    openTrigger().click();
    likeBtn().click();
    expect(step('1').hidden).toBe(true);
    expect(step('like').hidden).toBe(false);
    expect(step('dislike').hidden).toBe(true);
  });

  it('resets to step 1 every time the modal reopens', () => {
    // Reproduces the reported bug: pick a choice, close, reopen - without the
    // modal:open reset this reopens mid-flow on the Google-review step
    // instead of the prompt.
    openTrigger().click();
    likeBtn().click();
    closeBtn().click();
    openTrigger().click();
    expect(step('1').hidden).toBe(false);
    expect(step('like').hidden).toBe(true);
  });

  it('keeps the aria-labelledby target visible on reopen (no stale accessible name)', () => {
    openTrigger().click();
    likeBtn().click();
    closeBtn().click();
    openTrigger().click();
    const heading = document.getElementById('howd-we-do-title')!;
    expect(heading.closest('[hidden]')).toBeNull();
  });

  it('does not double-bind the click/reset listeners', () => {
    const root = document.querySelector('[data-modal="howd-we-do"]') as HTMLElement;
    const addEventListenerSpy = vi.spyOn(root, 'addEventListener');
    initHowdWeDo(document);
    expect(addEventListenerSpy).not.toHaveBeenCalled();
    addEventListenerSpy.mockRestore();
  });
});
