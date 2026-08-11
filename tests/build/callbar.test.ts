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
});
