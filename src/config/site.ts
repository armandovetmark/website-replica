export type NavItem = {
  label: string;
  href?: string;
  action?: 'referring-clinics' | 'howd-we-do';
  hidden?: boolean;
  children?: NavItem[];
};

export type CallbarItem = {
  kind: 'link' | 'phone' | 'action';
  label?: string;
  href?: string;
  icon?: string;
  action?: 'howd-we-do';
  /** Extra class on the cell's inner box. Declared here rather than inferred
   *  from href, so changing a link never silently drops its styling. */
  boxClass?: string;
};

export const site = {
  name: 'The Veterinary Internal Medicine Group',
  phone: '+17866735903',
  phoneHref: 'tel:+17866735903',
  // Display and dial numbers differ on the live site, confirmed intentional by
  // the project owner (2026-08-11). (305) 677-2015 is what visitors see;
  // +1 786-673-5903 is what tapping actually calls. Do not "reconcile" these.
  phoneDisplay: '(305) 677-2015',
  gtmId: 'GTM-WJZMPJ92',
  placeId: 'ChIJhw8-GA3X3ogRu7g-W6oUCQU',
  reviewsApi: 'https://vetmarketing.googlewidget.com/api/reviews',
  // Endpoint deferred by decision D6 — forms POST here once chosen.
  formAction: '',
  spanishBanner: 'Hablamos español!',
} as const;

export const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'About',
    children: [
      { label: 'Meet Our Team', href: '/meet-the-team' },
      { label: 'Conferences', href: '/conferences' },
      { label: "How'd We Do?", action: 'howd-we-do' },
      { label: 'Virtual Office Tour', href: '/photo-gallery', hidden: true },
    ],
  },
  // Children are injected at build time from the Services collection (Task 5).
  { label: 'Services', href: '/services', children: [] },
  { label: 'Pop-Up Ultrasound Clinics', href: '/clinic-schedule-locations' },
  {
    label: 'For Veterinary Clinics',
    children: [
      { label: 'For Clinics', href: '/clinic-schedule-locations' },
      { label: 'CT vs Ultrasound for Liver Enzymes', href: '/ct-vs-ultrasound-for-liver-enzymes' },
    ],
  },
  {
    label: 'For Pet Owners',
    children: [
      { label: 'Our Blog', href: '/blog' },
      { label: 'Gallery', href: '/gallery' },
    ],
  },
  { label: 'Careers', href: '/career-opportunity' },
  { label: 'Contact', href: '/general-information-request' },
];

export const callbarItems: CallbarItem[] = [
  { kind: 'link', label: 'Pop-up\nClinics', href: '/clinic-schedule-locations', icon: 'calendar2.svg' },
  { kind: 'link', label: 'Our\nTeam', href: '/meet-the-team', icon: 'about.svg' },
  { kind: 'phone', href: site.phoneHref, icon: 'phone.svg' },
  { kind: 'link', label: 'Contact\nUs', href: '/general-information-request', icon: 'map-pin.svg', boxClass: 'open-modal-contact' },
  { kind: 'action', label: "How'd\nWe Do", action: 'howd-we-do', icon: 'positive-review.png' },
];

export const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/theVIMG/', icon: 'facebook' },
  { label: 'Instagram', href: 'https://www.instagram.com/thevimg/', icon: 'instagram' },
];

// The live site's Services collection order (Webflow's own collection order,
// confirmed against tools/snapshots/home.html's footer service list — the
// exported CMS JSON doesn't preserve it). The header nav dropdown and the
// footer's Services column both sort by this instead of alphabetically.
export const serviceOrder: string[] = [
  'specialty-vet-care-education',
  'ultrasound-fine-needle-aspirates',
  'ultrasound',
  'thoracic-ultrasounds-non-cardiac',
  'pregnancy-checks',
  'internal-medicine-consults',
  'miscellaneous-diagnostic-procedures-abdominocentesis-thoracocentesis-pericardiocentesis',
  'advanced-imaging-options-ct-and-fluoroscopy-via-collaboration-with-mpi',
];

/** Sorts CMS collection entries (or anything slug-shaped) by serviceOrder. */
export function sortByServiceOrder<T extends { data: { slug: string } }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => serviceOrder.indexOf(a.data.slug) - serviceOrder.indexOf(b.data.slug),
  );
}

export const locations = [
  { label: 'Kendall Location', href: 'https://maps.app.goo.gl/MwK748Xikxh9QStp8' },
  { label: 'Bird Rd/Coral Gables Location', href: 'https://maps.app.goo.gl/Wk3D7aCcTtF5wjiv6' },
];

export const hoursHtml =
  '<p>Monday - Friday 8am to 5pm<br>Closed from 12pm-1pm for lunch</p>';

// Source site hardcoded 2025-09-18 → 2025-09-30 UTC; that window has passed.
export const scheduledPopup = {
  enabled: false,
  start: '2025-09-18T19:22:00Z',
  end: '2025-09-30T19:23:00Z',
};
