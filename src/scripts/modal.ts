const OPEN_CLASS = 'is-open';
const BODY_CLASS = 'has-modal-open';
const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Focusable descendants, skipping anything inside a hidden step. */
function focusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => !el.closest('[hidden]'),
  );
}

/** The element that had focus before the modal opened, restored on close. */
let lastFocused: HTMLElement | null = null;

function close(wrapper: HTMLElement, doc: Document): void {
  wrapper.classList.remove(OPEN_CLASS);
  wrapper.setAttribute('hidden', '');
  if (!doc.querySelector(`.${OPEN_CLASS}[data-modal]`)) {
    doc.body.classList.remove(BODY_CLASS);
  }
  lastFocused?.focus();
  lastFocused = null;
}

function open(wrapper: HTMLElement, doc: Document): void {
  lastFocused = doc.activeElement as HTMLElement | null;
  wrapper.removeAttribute('hidden');
  wrapper.classList.add(OPEN_CLASS);
  doc.body.classList.add(BODY_CLASS);
  // Lets widgets that share a modal (e.g. HowdWeDoWidget) reset their own
  // internal state before we compute which element gets initial focus.
  wrapper.dispatchEvent(new CustomEvent('modal:open'));
  focusables(wrapper)[0]?.focus();
}

/**
 * Wires every `[data-modal-open="<id>"]` trigger to the `[data-modal="<id>"]`
 * wrapper it opens, plus close-on-Escape, close-on-backdrop-click, and
 * `[data-modal-close]` buttons. Traps Tab inside the open dialog and restores
 * focus to whatever had it before the modal opened. Safe to call more than
 * once: triggers and wrappers are guarded with a `dataset` flag (mirrors
 * nav.ts / header-scroll.ts), and the document-level keydown listener is
 * bound only once.
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
      const e = event as KeyboardEvent;
      const openWrapper = doc.querySelector<HTMLElement>(`.${OPEN_CLASS}[data-modal]`);
      if (!openWrapper) return;

      if (e.key === 'Escape') {
        for (const w of doc.querySelectorAll<HTMLElement>(`.${OPEN_CLASS}[data-modal]`)) {
          close(w, doc);
        }
        return;
      }

      // Trap Tab inside the dialog, so background controls hidden behind the
      // overlay stay unreachable by keyboard while a modal is open.
      if (e.key !== 'Tab') return;
      const items = focusables(openWrapper);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && doc.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && doc.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }
}
