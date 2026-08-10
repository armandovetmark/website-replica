import { describe, it, expect } from 'vitest';
import { site, navItems, callbarItems, socialLinks } from '../../src/config/site';

describe('site config', () => {
  it('exposes the practice phone number', () => {
    expect(site.phone).toBe('+17866735903');
    expect(site.phoneHref).toBe('tel:+17866735903');
  });

  it('exposes GTM and GMB identifiers', () => {
    expect(site.gtmId).toBe('GTM-WJZMPJ92');
    expect(site.placeId).toBe('ChIJhw8-GA3X3ogRu7g-W6oUCQU');
  });

  it('defines 8 top-level nav items', () => {
    expect(navItems).toHaveLength(8);
    expect(navItems[0]).toMatchObject({ label: 'Home', href: '/' });
  });

  it('defines 5 callbar cells with the phone in the middle', () => {
    expect(callbarItems).toHaveLength(5);
    expect(callbarItems[2].kind).toBe('phone');
  });

  it('defines both social links', () => {
    expect(socialLinks.map((s) => s.label)).toEqual(['Facebook', 'Instagram']);
  });
});
