/**
 * Minimal image lightbox replacing Webflow's w-lightbox. Safe to call more
 * than once (mirrors nav.ts / modal.ts / footer-accordion.ts): the overlay
 * is a page-level singleton guarded by looking it up before creating one,
 * each `[data-lightbox]` link is guarded with a dataset flag so a repeated
 * call only binds newly-added links, and the document-level Escape listener
 * is bound once via a dataset flag on the root element.
 */
function close(doc: Document): void {
  doc.querySelector('.lightbox-overlay')?.classList.remove('is-open');
  doc.body.classList.remove('has-modal-open');
}

export function initLightbox(doc: Document = document): void {
  const links = doc.querySelectorAll<HTMLAnchorElement>('[data-lightbox]');
  if (links.length === 0) return;

  let overlay = doc.querySelector<HTMLElement>('.lightbox-overlay');

  if (!overlay) {
    overlay = doc.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<button type="button" class="lightbox-close" aria-label="Close">×</button><img alt="">';
    doc.body.appendChild(overlay);

    overlay.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target === overlay || target.closest('.lightbox-close')) close(doc);
    });
  }

  const image = overlay.querySelector('img')!;

  for (const link of links) {
    if (link.dataset.lightboxBound) continue;
    link.dataset.lightboxBound = 'true';
    link.addEventListener('click', (event) => {
      event.preventDefault();
      image.setAttribute('src', link.getAttribute('href') ?? '');
      image.setAttribute('alt', link.querySelector('img')?.getAttribute('alt') ?? '');
      overlay!.classList.add('is-open');
      doc.body.classList.add('has-modal-open');
      overlay!.querySelector<HTMLElement>('.lightbox-close')?.focus();
    });
  }

  if (!doc.documentElement.dataset.lightboxEscBound) {
    doc.documentElement.dataset.lightboxEscBound = 'true';
    doc.addEventListener('keydown', (event) => {
      if ((event as KeyboardEvent).key === 'Escape') close(doc);
    });
  }
}
