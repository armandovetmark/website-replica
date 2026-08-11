/**
 * Wires the How'd We Do widget's Like/Dislike step switching, and resets it
 * back to the initial prompt every time the modal controller dispatches
 * `modal:open` on the wrapper (see open() in modal.ts).
 *
 * Two triggers share this one modal (CallBar + About dropdown), so a second
 * open must not resume mid-flow. It matters for accessibility too: step 1's
 * heading is the modal's only `aria-labelledby` target, so leaving a later
 * step visible on reopen would leave the dialog with no accessible name for
 * screen readers.
 */
export function initHowdWeDo(doc: Document = document): void {
  const root = doc.querySelector<HTMLElement>('[data-modal="howd-we-do"]');
  if (!root) return;
  if (root.dataset.howdWeDoBound) return;
  root.dataset.howdWeDoBound = 'true';

  const showStep = (name: string) => {
    for (const step of root.querySelectorAll<HTMLElement>('.rm-step')) {
      step.hidden = step.dataset.rmStep !== name;
    }
  };

  root.addEventListener('click', (event) => {
    const choice = (event.target as HTMLElement).closest<HTMLElement>('[data-rm-choice]');
    if (!choice) return;
    showStep(choice.dataset.rmChoice!);
  });

  root.addEventListener('modal:open', () => showStep('1'));
}
