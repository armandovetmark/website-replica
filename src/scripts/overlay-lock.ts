/**
 * Whether a modal wrapper or the lightbox overlay is currently open.
 *
 * modal.ts and lightbox.ts each lock body scroll (`has-modal-open`) while
 * their own overlay is open, but neither knows about the other's. Without a
 * shared check, closing one while the other is still open would unlock
 * scroll early. Both modules call this before deciding whether to clear the
 * class, so the lock only lifts once every overlay is closed.
 */
export function isAnyOverlayOpen(doc: Document): boolean {
  return doc.querySelector('.is-open[data-modal], .lightbox-overlay.is-open') !== null;
}
