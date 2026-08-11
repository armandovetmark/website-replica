/**
 * Mobile footer accordion (About Us / Services / Resources). The live site
 * drives open/close with a Webflow IX2 "toggle" interaction that has no
 * static representation in the exported CSS/HTML snapshot, so this is
 * authored to match the project's existing toggle convention
 * (src/scripts/nav.ts's dropdown-toggle / dropdown-list pair): a real
 * <button> trigger, `aria-expanded` reflects state, the sibling content
 * panel gets `.is-open` toggled. Unlike the nav's dropdowns, footer
 * sections are independent — opening one does not close the others (no
 * IX2 data to say otherwise, and that's the more common accordion
 * behavior for a footer, as opposed to a single floating popover).
 */
export function initFooterAccordion(doc: Document = document): void {
  const triggers = [...doc.querySelectorAll<HTMLButtonElement>('.accordion-header-footer')];

  for (const trigger of triggers) {
    if (trigger.dataset.footerAccordionBound) continue;
    trigger.dataset.footerAccordionBound = 'true';

    trigger.addEventListener('click', () => {
      const content = trigger.nextElementSibling as HTMLElement | null;
      if (!content) return;
      const open = content.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', String(open));
    });
  }
}
