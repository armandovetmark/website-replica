import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { parseHTML } from 'linkedom';

let doc: Document;
beforeAll(() => {
  doc = parseHTML(readFileSync('dist/meet-the-team/index.html', 'utf8')).document as unknown as Document;
});

describe('build output', () => {
  it('produces dist/meet-the-team/index.html', () => {
    expect(existsSync('dist/meet-the-team/index.html')).toBe(true);
  });
});

describe('About page metadata', () => {
  it('sets the live title and description', () => {
    expect(doc.title).toBe('Meet Our Doctor | Dr. Armstrong');
    expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Meet Dr. Pedro F. Armstrong, board-certified veterinary internal medicine specialist (DACVIM-SAIM) providing diagnostics and consultations in Miami, FL.',
    );
  });
});

describe('page header', () => {
  it('renders the page header with its eyebrow and title', () => {
    expect(doc.querySelector('.page-header')).not.toBeNull();
    expect(doc.querySelector('.page-header-content h2')?.textContent).toContain('About');
    expect(doc.querySelector('.page-header-content h1')?.textContent).toBe(
      'The veterinary internal medicine group',
    );
  });

  it('renders the background image and overlay', () => {
    expect(doc.querySelector('.page-header-overlay')).not.toBeNull();
    expect(doc.querySelector('.page-header-background-image')).not.toBeNull();
  });
});

describe('doctor profile', () => {
  it('renders the doctor from the CMS collection', () => {
    const heading = doc.querySelector('.heading-40.doctors-bio');
    expect(heading?.textContent).toBe('Pedro F. Armstrong, DVM, DACVIM(SAIM)');
  });

  it('renders the doctor bio as rich text', () => {
    const bio = doc.querySelector('.content-rt.doctors-bio');
    expect(bio?.querySelectorAll('p').length).toBeGreaterThan(0);
    expect(bio?.textContent).toContain('San Juan, Puerto Rico');
  });

  it('renders exactly one doctor image (not the hidden CMS-conditional duplicate)', () => {
    expect(doc.querySelectorAll('.doctor-box-image-wrapper img')).toHaveLength(1);
  });

  it('renders the bio-part-2 richtext block', () => {
    expect(doc.body.textContent).toContain('Comparative Gastrointestinal Society');
  });

  it('renders both call-to-action banners', () => {
    const banners = doc.querySelectorAll('.call-to-action-know-u-re-doctor');
    expect(banners).toHaveLength(2);
    expect(banners[0].textContent).toContain("Dr. Armstrong’s education");
    expect(banners[1].textContent).toContain('conferences attended');
  });

  it('opens the resume PDF safely in a new tab', () => {
    const link = [...doc.querySelectorAll('.call-to-action-know-u-re-doctor a')].find((a) =>
      a.textContent?.includes('View Resume'),
    );
    expect(link).toBeTruthy();
    expect(link!.getAttribute('target')).toBe('_blank');
    expect(link!.getAttribute('rel')).toContain('noopener');
    expect(link!.getAttribute('href')).toMatch(/\.pdf$/);
  });

  it('links the second banner to /conferences', () => {
    const link = [...doc.querySelectorAll('.call-to-action-know-u-re-doctor a')].find((a) =>
      a.textContent?.includes('View Conferences'),
    );
    expect(link?.getAttribute('href')).toBe('/conferences');
  });
});

describe('about us section', () => {
  it('renders the three mission cards', () => {
    const cards = doc.querySelectorAll('.about-us');
    expect(cards).toHaveLength(3);
    expect(doc.querySelector('.about-us.dark-color')).not.toBeNull();
    expect(doc.querySelector('.about-us.light-color')).not.toBeNull();
    expect(doc.querySelector('.about-us.main-color')).not.toBeNull();
  });

  it('copies the mission copy verbatim, typo included', () => {
    // Live copy reads "individualized car, not assembly-line diagnostics" —
    // a real typo on the live site ("car" for "care"), replicated per the
    // "never fix typos" rule rather than silently corrected.
    expect(doc.body.textContent).toContain('individualized car, not assembly-line diagnostics');
  });
});

describe('staff section', () => {
  it('renders the static Staff card (no CMS w-dyn-list)', () => {
    expect(doc.querySelector('.meet-the-team-stafff .w-dyn-list')).toBeNull();
    expect(doc.querySelector('.staff-name')?.textContent).toBe('Kathy G.');
    expect(doc.querySelector('.staff-position')?.textContent).toBe('Manager');
  });

  it('keeps the live triple-f typo in the section class', () => {
    expect(doc.querySelector('.meet-the-team-stafff')).not.toBeNull();
  });
});

describe('appointment CTA', () => {
  it('reuses the shared appointment CTA banner', () => {
    expect(doc.querySelector('.filled-section.overlay-image .book-appointment')).not.toBeNull();
    expect(doc.querySelector('.book-appointment a.emergency-button')?.getAttribute('href')).toBe(
      '/appointment-request',
    );
  });
});

describe('shared chrome', () => {
  it('renders the header, footer, and call bar', () => {
    expect(doc.querySelector('.header')).not.toBeNull();
    expect(doc.querySelector('.footer')).not.toBeNull();
    expect(doc.querySelector('.callbar')).not.toBeNull();
  });
});
