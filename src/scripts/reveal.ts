/**
 * Replaces Webflow IX2 scroll-reveal interactions with a CSS-transition
 * trigger. Safe to call more than once: already-bound `.reveal` targets are
 * skipped (mirrors nav.ts / modal.ts / footer-accordion.ts), so a repeated
 * call only picks up targets added to the DOM since the last call instead of
 * attaching a second IntersectionObserver to everything again.
 */
export function initReveal(doc: Document = document): void {
  const targets = [...doc.querySelectorAll<HTMLElement>('.reveal')].filter(
    (el) => !el.dataset.revealBound,
  );
  if (targets.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
  );

  for (const target of targets) {
    target.dataset.revealBound = 'true';
    observer.observe(target);
  }
}
