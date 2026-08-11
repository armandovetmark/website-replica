const OPEN_CLASS = 'is-open';
const BODY_CLASS = 'has-modal-open';

function close(wrapper: HTMLElement, doc: Document): void {
  wrapper.classList.remove(OPEN_CLASS);
  wrapper.setAttribute('hidden', '');
  if (!doc.querySelector(`.${OPEN_CLASS}[data-modal]`)) {
    doc.body.classList.remove(BODY_CLASS);
  }
}

function open(wrapper: HTMLElement, doc: Document): void {
  wrapper.removeAttribute('hidden');
  wrapper.classList.add(OPEN_CLASS);
  doc.body.classList.add(BODY_CLASS);
  wrapper.querySelector<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )?.focus();
}

/**
 * Wires every `[data-modal-open="<id>"]` trigger to the `[data-modal="<id>"]`
 * wrapper it opens, plus close-on-Escape, close-on-backdrop-click, and
 * `[data-modal-close]` buttons. Safe to call more than once: triggers and
 * wrappers are guarded with a `dataset` flag (mirrors nav.ts / header-scroll.ts),
 * and the document-level Escape listener is bound only once.
 */
export function initModals(doc: Document = document): void {
  for (const trigger of doc.querySelectorAll<HTMLElement>('[data-modal-open]')) {
    if (trigger.dataset.modalBound) continue;
    trigger.dataset.modalBound = 'true';
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      const id = trigger.dataset.modalOpen!;
      const wrapper = doc.querySelector<HTMLElement>(`[data-modal="${id}"]`);
      if (wrapper) open(wrapper, doc);
    });
  }

  for (const wrapper of doc.querySelectorAll<HTMLElement>('[data-modal]')) {
    if (wrapper.dataset.modalBound) continue;
    wrapper.dataset.modalBound = 'true';

    wrapper.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target === wrapper || target.closest('[data-modal-close]')) {
        close(wrapper, doc);
      }
    });
  }

  if (!doc.documentElement.dataset.modalEscBound) {
    doc.documentElement.dataset.modalEscBound = 'true';
    doc.addEventListener('keydown', (event) => {
      if ((event as KeyboardEvent).key !== 'Escape') return;
      for (const w of doc.querySelectorAll<HTMLElement>(`.${OPEN_CLASS}[data-modal]`)) {
        close(w, doc);
      }
    });
  }
}
