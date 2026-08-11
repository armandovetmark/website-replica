import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

let doc: Document;
beforeAll(() => {
  const { document } = parseHTML(readFileSync('dist/index.html', 'utf8'));
  doc = document as unknown as Document;
});

describe('CallBar', () => {
  it('renders exactly five cells', () => {
    const bar = doc.querySelector('.callbar');
    expect(bar).not.toBeNull();
    expect(bar!.children.length).toBe(5);
  });

  it('puts the phone CTA in the middle cell', () => {
    const third = doc.querySelector('.callbar')!.children[2];
    const phone = third.querySelector('.callbar-phone');
    expect(phone).not.toBeNull();
    expect(phone!.getAttribute('href')).toBe('tel:+17866735903');
  });

  it('gives the phone link an accessible name', () => {
    const phone = doc.querySelector('.callbar-phone')!;
    expect(phone.textContent!.trim() || phone.getAttribute('aria-label')).toBeTruthy();
  });

  it('renders the How\'d We Do trigger as a real button', () => {
    const trigger = doc.querySelector('.callbar [data-modal-open="howd-we-do"]');
    expect(trigger).not.toBeNull();
    expect(trigger!.tagName.toLowerCase()).toBe('button');
  });

  it('links the first two cells to their pages', () => {
    const cells = doc.querySelector('.callbar')!.children;
    expect(cells[0].getAttribute('href')).toBe('/clinic-schedule-locations');
    expect(cells[1].getAttribute('href')).toBe('/meet-the-team');
  });

  it('carries the open-modal-contact class on the Contact cell', () => {
    const cells = doc.querySelector('.callbar')!.children;
    const contactBox = cells[3].querySelector('.callbar-link-box');
    expect(contactBox!.className).toContain('open-modal-contact');
  });

  it('renders the How\'d We Do button with the modal trigger attribute', () => {
    const cells = doc.querySelector('.callbar')!.children;
    const button = cells[4] as HTMLButtonElement;
    expect(button.tagName.toLowerCase()).toBe('button');
    expect(button.getAttribute('data-modal-open')).toBe('howd-we-do');
  });

  it('renders label text without orphaned <br> elements', () => {
    const cells = doc.querySelector('.callbar')!.children;
    // The Contact cell label is "Contact\nUs" (two lines) - should have one <br>
    const contactText = cells[3].querySelector('.callbar-text')!;
    const brCount = contactText.querySelectorAll('br').length;
    expect(brCount).toBe(1);
  });
});
