/** Mobile menu toggle + dropdown behavior, replacing Webflow's w-nav runtime. */
export function initNav(doc: Document = document): void {
  const menuButton = doc.querySelector<HTMLElement>('.menu-button');
  const navMenu = doc.querySelector<HTMLElement>('.nav-menu');
  const toggles = [...doc.querySelectorAll<HTMLElement>('.w-dropdown-toggle')];

  const closeAllDropdowns = (except?: HTMLElement) => {
    for (const t of toggles) {
      if (t === except) continue;
      t.setAttribute('aria-expanded', 'false');
      t.nextElementSibling?.classList.remove('is-open');
    }
  };

  const closeMenu = () => {
    navMenu?.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  };

  if (menuButton && navMenu && !menuButton.dataset.navBound) {
    menuButton.dataset.navBound = 'true';
    menuButton.addEventListener('click', () => {
      const open = navMenu.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(open));
      if (!open) closeAllDropdowns();
    });
  }

  for (const t of toggles) {
    if (t.dataset.navBound) continue;
    t.dataset.navBound = 'true';
    t.addEventListener('click', (event) => {
      event.preventDefault();
      const list = t.nextElementSibling;
      if (!list) return;
      const willOpen = !list.classList.contains('is-open');
      closeAllDropdowns(t);
      list.classList.toggle('is-open', willOpen);
      t.setAttribute('aria-expanded', String(willOpen));
    });
  }

  if (!doc.documentElement.dataset.navEscBound) {
    doc.documentElement.dataset.navEscBound = 'true';
    doc.addEventListener('keydown', (event) => {
      if ((event as KeyboardEvent).key !== 'Escape') return;
      closeAllDropdowns();
      closeMenu();
    });
  }
}
