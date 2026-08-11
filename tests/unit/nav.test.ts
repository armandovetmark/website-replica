import { describe, it, expect, beforeEach } from 'vitest';
import { initNav } from '../../src/scripts/nav';

beforeEach(() => {
  delete document.documentElement.dataset.navEscBound;
  document.body.innerHTML = `
    <div class="header">
      <button class="menu-button" aria-expanded="false"></button>
      <nav class="nav-menu">
        <div class="dropdown-wrapper w-dropdown">
          <button class="w-dropdown-toggle" aria-expanded="false">About</button>
          <nav class="dropdown-list w-dropdown-list"><a href="/a">A</a></nav>
        </div>
      </nav>
    </div>`;
  initNav(document);
});

const menuButton = () => document.querySelector('.menu-button') as HTMLElement;
const navMenu = () => document.querySelector('.nav-menu') as HTMLElement;
const toggle = () => document.querySelector('.w-dropdown-toggle') as HTMLElement;
const list = () => document.querySelector('.w-dropdown-list') as HTMLElement;

describe('initNav', () => {
  it('toggles the mobile menu open and closed', () => {
    menuButton().click();
    expect(navMenu().classList.contains('is-open')).toBe(true);
    expect(menuButton().getAttribute('aria-expanded')).toBe('true');
    menuButton().click();
    expect(navMenu().classList.contains('is-open')).toBe(false);
  });

  it('toggles a dropdown and reflects it in aria-expanded', () => {
    toggle().click();
    expect(list().classList.contains('is-open')).toBe(true);
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
  });

  it('closes an open dropdown on Escape', () => {
    toggle().click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(list().classList.contains('is-open')).toBe(false);
  });

  it('closes the mobile menu on Escape', () => {
    menuButton().click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(navMenu().classList.contains('is-open')).toBe(false);
  });

  it('closes an open dropdown when another opens', () => {
    document.querySelector('.nav-menu')!.insertAdjacentHTML('beforeend', `
      <div class="dropdown-wrapper w-dropdown">
        <button class="w-dropdown-toggle" aria-expanded="false">Services</button>
        <nav class="dropdown-list w-dropdown-list"><a href="/s">S</a></nav>
      </div>`);
    initNav(document);
    const toggles = document.querySelectorAll<HTMLElement>('.w-dropdown-toggle');
    const lists = document.querySelectorAll<HTMLElement>('.w-dropdown-list');
    toggles[0].click();
    toggles[1].click();
    expect(lists[0].classList.contains('is-open')).toBe(false);
    expect(lists[1].classList.contains('is-open')).toBe(true);
  });
});
