import { describe, it, expect, beforeEach } from 'vitest';
import { initFooterAccordion } from '../../src/scripts/footer-accordion';

beforeEach(() => {
  document.body.innerHTML = `
    <div class="footer-grid-mobile">
      <div class="accordion-trigger footer-accordion">
        <button type="button" class="accordion-header-footer" aria-expanded="false" aria-controls="a">
          <span class="mobile-footer-heading-2">About Us</span>
        </button>
        <div class="accordion-content-footer" id="a"><a href="/x">X</a></div>
      </div>
      <div class="accordion-trigger footer-accordion">
        <button type="button" class="accordion-header-footer" aria-expanded="false" aria-controls="b">
          <span class="mobile-footer-heading-2">Services</span>
        </button>
        <div class="accordion-content-footer" id="b"><a href="/y">Y</a></div>
      </div>
    </div>`;
  initFooterAccordion(document);
});

const triggers = () => [...document.querySelectorAll<HTMLButtonElement>('.accordion-header-footer')];
const content = (i: number) => triggers()[i].nextElementSibling as HTMLElement;

describe('initFooterAccordion', () => {
  it('opens a section on click and reflects it in aria-expanded', () => {
    triggers()[0].click();
    expect(content(0).classList.contains('is-open')).toBe(true);
    expect(triggers()[0].getAttribute('aria-expanded')).toBe('true');
  });

  it('closes an open section on a second click', () => {
    triggers()[0].click();
    triggers()[0].click();
    expect(content(0).classList.contains('is-open')).toBe(false);
    expect(triggers()[0].getAttribute('aria-expanded')).toBe('false');
  });

  it('leaves other sections open — sections are independent, not mutually exclusive', () => {
    triggers()[0].click();
    triggers()[1].click();
    expect(content(0).classList.contains('is-open')).toBe(true);
    expect(content(1).classList.contains('is-open')).toBe(true);
  });

  it('does not double-bind the trigger listener', () => {
    // Without the dataset guard, a second init() would attach a second
    // click handler, so one click would open-then-close in the same tick
    // and the section would appear to never open.
    initFooterAccordion(document);
    triggers()[0].click();
    expect(content(0).classList.contains('is-open')).toBe(true);
  });
});
