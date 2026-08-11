/**
 * Toggles `.is-scrolled` on the header once the page scrolls past the top.
 * Uses a sentinel + IntersectionObserver so there is no scroll listener.
 */
export function initHeaderScroll(doc: Document = document): void {
  const header = doc.querySelector('.header');
  const sentinel = doc.querySelector<HTMLElement>('[data-scroll-sentinel]');
  if (!header || !sentinel) return;

  // Idempotence: a second call would attach a second, never-disconnected
  // observer to the same sentinel.
  if (sentinel.dataset.scrollObserved) return;
  sentinel.dataset.scrollObserved = 'true';

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        header.classList.toggle('is-scrolled', !entry.isIntersecting);
      }
    },
    { rootMargin: '0px', threshold: 0 },
  );

  observer.observe(sentinel);
}
