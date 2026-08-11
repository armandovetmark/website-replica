# VIMG Astro Rebuild — Milestone 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Astro project scaffold, design tokens, base layout, Header/Footer/CallBar components, and a complete replica of the veterinaryimgroup.com homepage.

**Architecture:** Static Astro site, no UI framework. We author our own global CSS derived from Webflow's compiled stylesheets while preserving Webflow's class names, so markup lifts 1:1 from the live site. Webflow's runtime (jQuery + `webflow.js`) is replaced by small hand-written ES modules. CMS content is exported once into Astro content collections; assets are mirrored locally.

**Tech Stack:** Astro 7.x, TypeScript (strict), Vitest + jsdom (unit tests), linkedom (built-HTML assertions), Sharp via `astro:assets`.

**Spec:** `docs/superpowers/specs/2026-08-10-vimg-astro-rebuild-design.md`

## Global Constraints

Every task's requirements implicitly include this section.

- **The Webflow site is READ-ONLY.** No tool call may mutate site `6952729d2807a37cc07c2e29`. Only read actions are permitted. Never call any Webflow MCP `create_*`, `update_*`, `delete_*`, or `publish_*` action.
- **Astro 7.2.0 or later**, `output: 'static'`. No React/Vue/Svelte/Solid. (The plan originally said 5.x; that line has unpatched high-severity advisories, so the project targets 7.x. `npm audit` must report 0 vulnerabilities.)
- **No jQuery, no `webflow.js`.** No runtime dependency may be added without it being named in this plan.
- **All CSS is global**, never Astro-scoped — Webflow class names are shared across pages. Use `<style is:global>` or plain `.css` files imported from `global.css`.
- **Preserve Webflow class names** exactly (`.general-section`, `.callbar-link`, `.nav-link`, …).
- **Breakpoints:** max-width `991px`, `767px`, `479px`; min-width `1280px`, `1440px`, `1920px`.
- **Design tokens** are copied verbatim from the spec §5, including the `--secodary-dark` misspelling.
- **Phone number:** `+17866735903`. **GTM ID:** `GTM-WJZMPJ92`. **GMB Place ID:** `ChIJhw8-GA3X3ogRu7g-W6oUCQU`.
- **Commit after every task.** Never use `--no-verify`.
- Source of truth for CSS values is the compiled stylesheet captured in Task 4. When this plan and the live site disagree, the live site wins — flag the discrepancy rather than silently deviating.

---

### Task 1: Project scaffold and test harness

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`
- Create: `src/pages/index.astro`
- Test: `tests/build/smoke.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `npm run build` (Astro static build to `dist/`), `npm test` (Vitest unit run), `npm run test:build` (build then assert on `dist/`), `npm run verify` (both).

- [ ] **Step 1: Initialize the project**

```bash
cd "C:/Users/arman/Desktop/Veterinary Marketing AI Development/Prototypes/vimg"
npm init -y
npm install astro
npm install -D typescript vitest jsdom linkedom @types/node
```

- [ ] **Step 2: Write `package.json` scripts**

Replace the `"scripts"` block in `package.json`:

```json
{
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run --dir tests/unit --passWithNoTests",
    "test:build": "astro build && vitest run --dir tests/build --passWithNoTests",
    "verify": "npm test && npm run test:build"
  }
}
```

- [ ] **Step 3: Write `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.veterinaryimgroup.com',
  output: 'static',
  build: { format: 'directory' },
});
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 5: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

- [ ] **Step 6: Write the failing smoke test**

Create `tests/build/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

describe('build output', () => {
  it('produces dist/index.html', () => {
    expect(existsSync('dist/index.html')).toBe(true);
  });

  it('renders the page title', () => {
    const html = readFileSync('dist/index.html', 'utf8');
    expect(html).toContain('<title>');
  });
});
```

- [ ] **Step 7: Run it to verify it fails**

Run: `npm run test:build`
Expected: FAIL — the build errors because `src/pages/index.astro` does not exist.

- [ ] **Step 8: Create the minimal page**

Create `src/pages/index.astro`:

```astro
---
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>The Veterinary Internal Medicine Group</title>
  </head>
  <body></body>
</html>
```

- [ ] **Step 9: Run the test to verify it passes**

Run: `npm run test:build`
Expected: PASS, 2 tests.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro project with Vitest harness"
```

---

### Task 2: Design tokens and base stylesheet

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/reset.css`, `src/styles/base.css`, `src/styles/global.css`
- Test: `tests/unit/tokens.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `src/styles/global.css` — the single stylesheet entry point imported by `BaseLayout.astro` (Task 7). Exposes the 16 `--*` custom properties on `:root`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/tokens.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const EXPECTED: Record<string, string> = {
  '--text': '#333',
  '--main': '#616065',
  '--main-light': '#e6e6e8',
  '--white': 'white',
  '--main-soft': '#9a99a0',
  '--main-dark': '#3f3e42',
  '--cta': '#0ca4ac',
  '--cta-hover': '#08777d',
  '--secondary': '#616065',
  '--secodary-dark': '#3f3e42',
  '--main-soft-o50': '#eff5ff80',
  '--white-o85': '#ffffffd9',
  '--shadow': '#0000001a',
  '--overlay-color': '#00000080',
  '--main-o50': '#447cdb80',
  '--light-grey': '#d1d1d1',
};

describe('design tokens', () => {
  // Strip comments first: token names are mentioned in prose above the block,
  // and a bare regex would match there and capture the wrong value.
  const css = readFileSync('src/styles/tokens.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  it('defines all 16 Webflow Base variables with exact values', () => {
    for (const [name, value] of Object.entries(EXPECTED)) {
      const match = css.match(new RegExp(`\\${name}\\s*:\\s*([^;]+);`));
      expect(match, `missing ${name}`).not.toBeNull();
      expect(match![1].trim(), `wrong value for ${name}`).toBe(value);
    }
  });

  it('keeps the Webflow misspelling and adds a corrected alias', () => {
    expect(css).toContain('--secodary-dark');
    expect(css).toContain('--secondary-dark');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test`
Expected: FAIL — `ENOENT: no such file or directory, open 'src/styles/tokens.css'`.

- [ ] **Step 3: Write `src/styles/tokens.css`**

```css
/* Webflow variable collection "Base" (collection-6f9730ba-f7de-c628-3449-45efd96997d9).
   Values copied verbatim from the published site. Do not "fix" --secodary-dark:
   ported Webflow rules reference that spelling. */
:root {
  --text: #333;
  --main: #616065;
  --main-light: #e6e6e8;
  --white: white;
  --main-soft: #9a99a0;
  --main-dark: #3f3e42;
  --cta: #0ca4ac;
  --cta-hover: #08777d;
  --secondary: #616065;
  --secodary-dark: #3f3e42;
  --secondary-dark: #3f3e42;
  --main-soft-o50: #eff5ff80;
  --white-o85: #ffffffd9;
  --shadow: #0000001a;
  --overlay-color: #00000080;
  --main-o50: #447cdb80;
  --light-grey: #d1d1d1;

  /* @fontsource-variable/montserrat registers the family as 'Montserrat Variable'.
     'Montserrat' stays as the fallback for machines with it installed locally. */
  --font-body: 'Montserrat Variable', 'Montserrat', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --header-height: 5rem;
  --callbar-height: 4.5rem;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS, 2 tests.

- [ ] **Step 5: Write `src/styles/reset.css`**

```css
/* Webflow normalize equivalent — only the rules the ported CSS depends on. */
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; min-height: 100vh; }
img, svg, video { max-width: 100%; display: inline-block; }
img, video { height: auto; }
h1, h2, h3, h4, h5, h6, p, figure, blockquote { margin: 0; }
ul[class], ol[class] { margin: 0; padding: 0; list-style: none; }
a { color: inherit; text-decoration: none; }
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
input, textarea, select { font: inherit; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 6: Write `src/styles/base.css`**

Breakpoints are documented here as constants; CSS custom properties cannot be used inside media query conditions, so the literals appear in each query.

```css
/* Breakpoints (match Webflow):
   max-width: 991px | 767px | 479px
   min-width: 1280px | 1440px | 1920px */

body {
  font-family: var(--font-body);
  color: var(--text);
  font-size: 1rem;
  line-height: 1.6;
  background-color: var(--white);
}

.container {
  width: 100%;
  max-width: 940px;
  margin-inline: auto;
  padding-inline: 1rem;
}

@media screen and (min-width: 1280px) { .container { max-width: 1200px; } }
@media screen and (min-width: 1440px) { .container { max-width: 1300px; } }

.general-section { padding-block: 4rem; }
.general-section.no-margin { margin: 0; }
.general-section.new-padding { padding-block: 5rem; }
.gray-bg { background-color: var(--main-light); }
.light-blue-bg, .light-blue-bg-copy { background-color: var(--main-soft-o50); }
.dark-color-bg { background-color: var(--main-dark); }

.text-center { text-align: center; }
.hide { display: none !important; }

.visually-hidden {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

/* Reveal utility — replaces Webflow IX2 scroll animations (see scripts/reveal.ts) */
.reveal { opacity: 0; transform: translateY(1.25rem); transition: opacity .6s ease, transform .6s ease; }
.reveal.is-visible { opacity: 1; transform: none; }
```

- [ ] **Step 7: Self-host Montserrat**

The live site loads Montserrat through Google's render-blocking WebFont loader. Replace it with
a self-hosted variable font.

```bash
npm install @fontsource-variable/montserrat
```

- [ ] **Step 8: Write `src/styles/global.css`**

```css
@import '@fontsource-variable/montserrat/index.css';
@import './reset.css';
@import './tokens.css';
@import './base.css';
```

- [ ] **Step 9: Verify the font resolves**

Run: `npm run build`
Expected: build succeeds and `dist/_astro/` contains at least one `montserrat`-named `.woff2` file.
Confirm with `ls dist/_astro | grep -i montserrat`.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add design tokens, base stylesheet, and self-hosted Montserrat"
```

---

### Task 3: Site configuration

**Files:**
- Create: `src/config/site.ts`
- Test: `tests/unit/site-config.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: named exports from `src/config/site.ts`:
  - `site: { name: string; phone: string; phoneHref: string; phoneDisplay: string; gtmId: string; placeId: string; reviewsApi: string; formAction: string; spanishBanner: string }`
  - `navItems: NavItem[]` where `type NavItem = { label: string; href?: string; action?: 'referring-clinics' | 'howd-we-do'; hidden?: boolean; children?: NavItem[] }`
  - `callbarItems: CallbarItem[]` where `type CallbarItem = { kind: 'link' | 'phone' | 'action'; label?: string; href?: string; icon?: string; action?: 'howd-we-do' }`
  - `socialLinks: { label: string; href: string; icon: string }[]`
  - `locations: { label: string; href: string }[]`
  - `hoursHtml: string`
  - `scheduledPopup: { enabled: boolean; start: string; end: string }`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/site-config.test.ts`:

```ts
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

  it('leaves the Services entry ready for build-time CMS injection', () => {
    // Task 10 finds this entry by label and replaces children with CMS items.
    // If it is renamed or removed, that injection silently produces an empty menu.
    const services = navItems.find((i) => i.label === 'Services');
    expect(services, 'no nav item labelled Services').toBeDefined();
    expect(services!.href).toBe('/services');
    expect(services!.children).toEqual([]);
  });

  it('defines 5 callbar cells with the phone in the middle', () => {
    expect(callbarItems).toHaveLength(5);
    expect(callbarItems[2].kind).toBe('phone');
  });

  it('defines both social links', () => {
    expect(socialLinks.map((s) => s.label)).toEqual(['Facebook', 'Instagram']);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `../../src/config/site`.

- [ ] **Step 3: Write `src/config/site.ts`**

```ts
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
};

export const site = {
  name: 'The Veterinary Internal Medicine Group',
  phone: '+17866735903',
  phoneHref: 'tel:+17866735903',
  phoneDisplay: '(786) 673-5903',
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
  { kind: 'link', label: 'Contact\nUs', href: '/general-information-request', icon: 'map-pin.svg' },
  { kind: 'action', label: "How'd\nWe Do", action: 'howd-we-do', icon: 'positive-review.png' },
];

export const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/theVIMG/', icon: 'facebook' },
  { label: 'Instagram', href: 'https://www.instagram.com/thevimg/', icon: 'instagram' },
];

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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add site configuration with nav and callbar models"
```

---

### Task 4: Snapshot capture toolkit

Downstream tasks port markup and CSS from the live site. This toolkit makes that mechanical and repeatable instead of ad-hoc.

**Files:**
- Create: `tools/capture.mjs`, `tools/extract-css.mjs`
- Create: `.gitignore` entry for `tools/snapshots/`
- Test: `tests/unit/extract-css.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `node tools/capture.mjs <slug> <url>` → writes `tools/snapshots/<slug>.html` plus every linked stylesheet as `tools/snapshots/<slug>.css`.
  - `extractRules(css: string, classNames: string[]): string` exported from `tools/extract-css.mjs` — returns all rules whose selector references any of the given class names, each annotated with its media query context.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/extract-css.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { extractRules } from '../../tools/extract-css.mjs';

const CSS = `
.callbar{display:none;background:red}
.other{color:blue}
@media screen and (max-width:991px){.callbar{display:flex}}
`;

describe('extractRules', () => {
  it('returns rules matching the requested class', () => {
    const out = extractRules(CSS, ['callbar']);
    expect(out).toContain('display:none');
    expect(out).toContain('display:flex');
  });

  it('excludes unrelated rules', () => {
    expect(extractRules(CSS, ['callbar'])).not.toContain('color:blue');
  });

  it('annotates rules with their media query', () => {
    expect(extractRules(CSS, ['callbar'])).toContain('max-width:991px');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `../../tools/extract-css.mjs`.

- [ ] **Step 3: Write `tools/extract-css.mjs`**

```js
/**
 * Return every rule whose selector references one of `classNames`,
 * annotated with the media query it sits inside.
 */
export function extractRules(css, classNames) {
  const wanted = classNames.map((c) => c.replace(/^\./, ''));
  const hits = [];

  const collect = (block, context) => {
    const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = ruleRe.exec(block))) {
      const selector = m[1].trim();
      if (wanted.some((c) => new RegExp(`\\.${c}(?![\\w-])`).test(selector))) {
        hits.push(`${context ? `/* ${context} */\n` : ''}${selector}{${m[2].trim()}}`);
      }
    }
  };

  let i = 0;
  let plain = '';
  while (i < css.length) {
    if (css.startsWith('@media', i)) {
      const open = css.indexOf('{', i);
      const context = css.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
        j++;
      }
      collect(css.slice(open + 1, j - 1), context);
      i = j;
    } else {
      plain += css[i];
      i++;
    }
  }
  collect(plain, '');

  return hits.join('\n\n');
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS, 3 tests.

- [ ] **Step 5: Write `tools/capture.mjs`**

```js
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const OUT = 'tools/snapshots';
const UA = 'Mozilla/5.0 (compatible; vimg-replica/1.0)';

const [slug, url] = process.argv.slice(2);
if (!slug || !url) {
  console.error('Usage: node tools/capture.mjs <slug> <url>');
  process.exit(1);
}

await mkdir(OUT, { recursive: true });

const html = await (await fetch(url, { headers: { 'user-agent': UA } })).text();
await writeFile(join(OUT, `${slug}.html`), html, 'utf8');

const hrefs = [...html.matchAll(/href="([^"]+\.css[^"]*)"/g)].map((m) => m[1]);
let css = '';
for (const href of hrefs) {
  const abs = href.startsWith('http') ? href : new URL(href, url).toString();
  css += `\n/* ===== ${abs} ===== */\n`;
  css += await (await fetch(abs, { headers: { 'user-agent': UA } })).text();
}
await writeFile(join(OUT, `${slug}.css`), css, 'utf8');

console.log(`Captured ${slug}: ${html.length} bytes HTML, ${css.length} bytes CSS from ${hrefs.length} stylesheet(s)`);
```

- [ ] **Step 6: Capture the homepage and verify**

```bash
node tools/capture.mjs home https://www.veterinaryimgroup.com/
```

Expected: prints a line reporting roughly 66,000 bytes of HTML and roughly 93,000 bytes of CSS from 2 stylesheets.

- [ ] **Step 7: Ignore snapshots in git**

Append to `.gitignore`:

```
# captured reference snapshots (regenerate with tools/capture.mjs)
tools/snapshots/
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add snapshot capture and CSS extraction toolkit"
```

---

### Task 5: Content export and collection schemas

**Files:**
- Create: `scripts/export-webflow-content.mjs`
- Create: `src/content.config.ts`
- Create: `src/content/` (populated by the script)
- Test: `tests/unit/content-schema.test.ts`

**Interfaces:**
- Consumes: `WEBFLOW_TOKEN` environment variable (export script only; the build never reads it).
- Produces: Astro content collections named `services`, `servicesCategories`, `doctors`, `staff`, `blog`, `blogCategories`, `locations`, `dates`, `practiceInformation`, `socialLinks`. Each collection item exposes at minimum `{ name: string; slug: string }`.

**NOTE:** The export script performs **read-only** GET requests against the Webflow Data API. It must never issue POST, PATCH, PUT, or DELETE.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/content-schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';

const COLLECTIONS = [
  'services', 'services-categories', 'doctors', 'staff', 'blog',
  'blog-categories', 'locations', 'dates', 'practice-information', 'social-links',
];

describe('exported content', () => {
  it('creates a directory per collection', () => {
    for (const c of COLLECTIONS) {
      expect(existsSync(`src/content/${c}`), `missing src/content/${c}`).toBe(true);
    }
  });

  it('exports at least one service and one doctor', () => {
    expect(readdirSync('src/content/services').length).toBeGreaterThan(0);
    expect(readdirSync('src/content/doctors').length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test`
Expected: FAIL — `src/content/services` does not exist.

- [ ] **Step 3: Write `scripts/export-webflow-content.mjs`**

```js
import { mkdir, writeFile } from 'node:fs/promises';

const TOKEN = process.env.WEBFLOW_TOKEN;
if (!TOKEN) {
  console.error('Set WEBFLOW_TOKEN to a Webflow API token with read access.');
  process.exit(1);
}

const API = 'https://api.webflow.com/v2';

const COLLECTIONS = {
  'services':             '6952729d2807a37cc07c2ee6',
  'services-categories':  '6952729d2807a37cc07c2e54',
  'doctors':              '6952729d2807a37cc07c2e95',
  'staff':                '6952729d2807a37cc07c2ede',
  'blog':                 '6952729d2807a37cc07c2eb2',
  'blog-categories':      '6952729d2807a37cc07c2ec9',
  'locations':            '69836ad140ba845d94864ae5',
  'dates':                '69836ac7b9df763ecc149105',
  'practice-information': '6952729d2807a37cc07c2e80',
  'social-links':         '6952729d2807a37cc07c2e3a',
};

/** READ-ONLY. Never send a non-GET request to the Webflow API. */
async function getJson(path) {
  const res = await fetch(`${API}${path}`, {
    method: 'GET',
    headers: { authorization: `Bearer ${TOKEN}`, accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

async function listAll(collectionId) {
  const items = [];
  let offset = 0;
  for (;;) {
    const page = await getJson(`/collections/${collectionId}/items?limit=100&offset=${offset}`);
    items.push(...page.items);
    offset += 100;
    if (offset >= (page.pagination?.total ?? items.length)) break;
  }
  return items;
}

for (const [name, id] of Object.entries(COLLECTIONS)) {
  const dir = `src/content/${name}`;
  await mkdir(dir, { recursive: true });
  const items = await listAll(id);
  for (const item of items) {
    if (item.isArchived || item.isDraft) continue;
    const data = { id: item.id, lastPublished: item.lastPublished ?? null, ...item.fieldData };
    await writeFile(`${dir}/${data.slug}.json`, JSON.stringify(data, null, 2), 'utf8');
  }
  console.log(`${name}: ${items.length} item(s)`);
}
```

- [ ] **Step 4: Populate `src/content/` via the Webflow MCP**

No `WEBFLOW_TOKEN` is available in this environment, and the project owner chose (2026-08-10)
to populate content through the read-only Webflow MCP instead of provisioning one.
`scripts/export-webflow-content.mjs` still ships as the documented re-sync path for whoever
has a token later; it is **not executed** in this milestone, and the report must say so
plainly rather than implying it ran.

Use the MCP tool `data_cms_tool` with the `list_collection_items` action, once per collection,
against site `6952729d2807a37cc07c2e29`. Load the tool first via ToolSearch
(`select:mcp__1da52548-6a2d-4480-98a7-6c56a2b690ef__data_cms_tool`).

Rules:

- **READ ONLY.** Only `list_collection_items` and `get_collection_details` are permitted. Never
  call `create_*`, `update_*`, `delete_*`, `publish_*`, or `unpublish_*` against this site.
- Page with `limit: 100` and `offset`, continuing until you have every item.
- Skip items where `isArchived` or `isDraft` is true.
- Write one file per item at `src/content/<collection>/<slug>.json`, shaped exactly as the
  script would produce: `{ id, lastPublished, ...fieldData }`.
- Create the directory for every collection, including any that legitimately return zero items
  — the test asserts all ten directories exist.

Collection IDs are the same map the script uses (see Step 3).

Expected: ten directories under `src/content/`, with `services` and `doctors` non-empty.
Report the item count per collection. Do not fabricate, summarise, or invent content — every
field value must come from the API response.

- [ ] **Step 5: Write `src/content.config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const base = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  lastPublished: z.string().nullable().optional(),
});

const make = (dir: string, extra: z.ZodRawShape = {}) =>
  defineCollection({
    loader: glob({ pattern: '**/*.json', base: `./src/content/${dir}` }),
    schema: base.extend(extra).passthrough(),
  });

export const collections = {
  services: make('services'),
  servicesCategories: make('services-categories'),
  doctors: make('doctors'),
  staff: make('staff'),
  blog: make('blog'),
  blogCategories: make('blog-categories'),
  locations: make('locations'),
  dates: make('dates'),
  practiceInformation: make('practice-information'),
  socialLinks: make('social-links'),
};
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test`
Expected: PASS, 2 tests.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: export Webflow CMS content into Astro collections"
```

---

### Task 6: Asset mirroring

**Files:**
- Create: `scripts/mirror-assets.mjs`
- Create: `src/assets/`, `public/icons/`
- Test: `tests/unit/mirror-assets.test.ts`

**Interfaces:**
- Consumes: `tools/snapshots/*.html` (Task 4), `src/content/**/*.json` (Task 5).
- Produces:
  - `collectAssetUrls(text: string): string[]` exported from `scripts/mirror-assets.mjs` — every `cdn.prod.website-files.com` URL in the input, deduplicated.
  - Downloaded files under `src/assets/` (raster images) and `public/icons/` (SVG).
  - `tools/snapshots/asset-map.json` mapping original URL → local path.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/mirror-assets.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { collectAssetUrls } from '../../scripts/mirror-assets.mjs';

const HTML = `
<img src="https://cdn.prod.website-files.com/abc/1_logo.png"/>
<img src="https://cdn.prod.website-files.com/abc/1_logo.png"/>
<img src="https://example.com/other.png"/>
<div style="background-image:url(https://cdn.prod.website-files.com/abc/2_phone.svg)"></div>
`;

describe('collectAssetUrls', () => {
  it('finds Webflow CDN assets', () => {
    const urls = collectAssetUrls(HTML);
    expect(urls).toContain('https://cdn.prod.website-files.com/abc/1_logo.png');
    expect(urls).toContain('https://cdn.prod.website-files.com/abc/2_phone.svg');
  });

  it('deduplicates', () => {
    expect(collectAssetUrls(HTML).filter((u) => u.endsWith('1_logo.png'))).toHaveLength(1);
  });

  it('ignores non-Webflow hosts', () => {
    expect(collectAssetUrls(HTML)).not.toContain('https://example.com/other.png');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `../../scripts/mirror-assets.mjs`.

- [ ] **Step 3: Write `scripts/mirror-assets.mjs`**

```js
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';

const CDN = 'https://cdn.prod.website-files.com';
const UA = 'Mozilla/5.0 (compatible; vimg-replica/1.0)';

export function collectAssetUrls(text) {
  const re = new RegExp(`${CDN.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}/[^"')\\s\\\\]+`, 'g');
  return [...new Set((text.match(re) ?? []).map((u) => u.replace(/&amp;/g, '&')))];
}

/** Webflow prefixes uploads with a 24-char hex id; strip it for readable filenames. */
export function localNameFor(url) {
  const raw = decodeURIComponent(basename(new URL(url).pathname));
  return raw.replace(/^[0-9a-f]{24}_/, '');
}

async function main() {
  const sources = [];
  for (const f of await readdir('tools/snapshots').catch(() => [])) {
    if (f.endsWith('.html')) sources.push(await readFile(join('tools/snapshots', f), 'utf8'));
  }
  for (const dir of await readdir('src/content').catch(() => [])) {
    for (const f of await readdir(join('src/content', dir))) {
      sources.push(await readFile(join('src/content', dir, f), 'utf8'));
    }
  }

  const urls = collectAssetUrls(sources.join('\n'));
  await mkdir('src/assets', { recursive: true });
  await mkdir('public/icons', { recursive: true });

  const map = {};
  for (const url of urls) {
    const name = localNameFor(url);
    const isVector = extname(name).toLowerCase() === '.svg';
    const dest = isVector ? join('public/icons', name) : join('src/assets', name);
    const res = await fetch(url, { headers: { 'user-agent': UA } });
    if (!res.ok) { console.warn(`SKIP ${url} → ${res.status}`); continue; }
    await writeFile(dest, Buffer.from(await res.arrayBuffer()));
    map[url] = isVector ? `/icons/${name}` : `~/assets/${name}`;
  }

  await writeFile('tools/snapshots/asset-map.json', JSON.stringify(map, null, 2), 'utf8');
  console.log(`Mirrored ${Object.keys(map).length} of ${urls.length} asset(s)`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS, 3 tests.

- [ ] **Step 5: Run the mirror and confirm the CallBar icons landed**

```bash
node scripts/mirror-assets.mjs
ls public/icons | grep -E 'calendar2|about|map-pin|phone'
```

Expected: `calendar2.svg`, `about.svg`, `map-pin.svg`, `phone.svg` present.

- [ ] **Step 6: Add the `~` alias so `~/assets/...` resolves**

In `tsconfig.json`, add inside `compilerOptions`:

```json
"baseUrl": ".",
"paths": { "~/*": ["src/*"] }
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: mirror Webflow CDN assets locally"
```

---

### Task 7: BaseLayout

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/build/layout.test.ts`

**Interfaces:**
- Consumes: `src/styles/global.css` (Task 2), `site` from `src/config/site.ts` (Task 3).
- Produces: `BaseLayout.astro` with props `{ title: string; description?: string; bodyClass?: string }` and a default `<slot />` for page content.

- [ ] **Step 1: Write the failing test**

Create `tests/build/layout.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

let doc: Document;
beforeAll(() => {
  const { document } = parseHTML(readFileSync('dist/index.html', 'utf8'));
  doc = document as unknown as Document;
});

describe('BaseLayout', () => {
  it('sets lang and charset', () => {
    expect(doc.documentElement.getAttribute('lang')).toBe('en');
    expect(doc.querySelector('meta[charset]')).not.toBeNull();
  });

  it('sets a responsive viewport', () => {
    const v = doc.querySelector('meta[name="viewport"]');
    expect(v?.getAttribute('content')).toContain('width=device-width');
  });

  it('includes the GTM container script and noscript iframe', () => {
    const html = readFileSync('dist/index.html', 'utf8');
    expect(html).toContain('GTM-WJZMPJ92');
    expect(html).toContain('googletagmanager.com/ns.html');
  });

  it('renders a meta description', () => {
    expect(doc.querySelector('meta[name="description"]')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:build`
Expected: FAIL — no viewport meta, no GTM.

- [ ] **Step 3: Write `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css';
import { site } from '../config/site';

interface Props {
  title: string;
  description?: string;
  bodyClass?: string;
}

const { title, description = '', bodyClass = '' } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site).toString();
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    <link rel="canonical" href={canonical} />

    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonical} />

    <!-- Google Tag Manager -->
    <script is:inline define:vars={{ gtmId: site.gtmId }}>
      (function (w, d, s, l, i) {
        w[l] = w[l] || [];
        w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
        var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s),
          dl = l != 'dataLayer' ? '&l=' + l : '';
        j.async = true;
        j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
        f.parentNode.insertBefore(j, f);
      })(window, document, 'script', 'dataLayer', gtmId);
    </script>
  </head>
  <body class={bodyClass}>
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${site.gtmId}`}
        height="0" width="0" style="display:none;visibility:hidden"
        title="Google Tag Manager"></iframe>
    </noscript>

    <slot />
  </body>
</html>
```

- [ ] **Step 4: Use the layout from the homepage**

Replace `src/pages/index.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout
  title="The Veterinary Internal Medicine Group | Board Certified Vet Specialist in Miami, FL"
  description="Board-certified vet internal medicine in Miami. Expert ultrasound, diagnostics & consults for complex pet health. Serving South Florida pets."
>
</BaseLayout>
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test:build`
Expected: PASS — 2 smoke tests plus 4 layout tests.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add BaseLayout with GTM and SEO metadata"
```

---

### Task 8: CallBar component

**Files:**
- Create: `src/components/layout/CallBar.astro`, `src/styles/layout/callbar.css`
- Modify: `src/styles/global.css`
- Test: `tests/build/callbar.test.ts`

**Interfaces:**
- Consumes: `callbarItems`, `site` from `src/config/site.ts` (Task 3); mirrored icons in `public/icons/` (Task 6).
- Produces: `CallBar.astro`, no props. Emits `<div class="callbar">` with exactly 5 children. The 5th child is `<button class="callbar-link-2" data-modal-open="howd-we-do">`.

- [ ] **Step 1: Write the failing test**

Create `tests/build/callbar.test.ts`:

```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:build`
Expected: FAIL — `.callbar` is null.

- [ ] **Step 3: Write `src/styles/layout/callbar.css`**

Values ported verbatim from the compiled site CSS. CallBar is hidden above 991px.

```css
.callbar {
  background-color: var(--main-light);
  border-top: 2px solid #6b8c3b;
  padding: .625em .625em .375em;
  display: none;
}

.callbar-link,
.callbar-link-2 {
  width: 20%;
  color: var(--white);
  text-decoration: none;
}

.callbar-link-box {
  flex-direction: column;
  align-items: center;
  margin-inline: auto;
  display: flex;
}

.callbar-link-box.open-modal-contact { padding-left: 9px; }

.callbar-icon-image {
  width: 1.3125em;
  height: 1.3125em;
  margin-bottom: .5em;
  line-height: 1;
  object-fit: contain;
}

.callbar-text {
  font-size: .75em;
  font-weight: 400;
  line-height: 1;
  text-align: center;
  text-transform: uppercase;
}

.callbar-phone {
  background-color: var(--main);
  background-image: url('/icons/phone.svg');
  background-position: 50%;
  background-repeat: no-repeat;
  background-size: 32px 32px;
  width: 3.75em;
  height: 3.75em;
  border-radius: 100%;
  margin-inline: auto;
  display: flex;
}

@media screen and (max-width: 991px) {
  .callbar {
    z-index: 50;
    background-color: var(--cta);
    align-items: center;
    display: flex;
    position: fixed;
    inset: auto 0 0;
  }
}
```

- [ ] **Step 4: Import the stylesheet**

Append to `src/styles/global.css`:

```css
@import './layout/callbar.css';
```

- [ ] **Step 5: Write `src/components/layout/CallBar.astro`**

```astro
---
import { callbarItems } from '../../config/site';
---
<div class="callbar">
  {callbarItems.map((item) => {
    if (item.kind === 'phone') {
      return (
        <div class="callbar-link">
          <a href={item.href} class="callbar-phone" aria-label="Call us">
            <span class="visually-hidden">Call us</span>
          </a>
        </div>
      );
    }

    const label = item.label!.split('\n');
    const box = (
      <div class={`callbar-link-box${item.href === '/general-information-request' ? ' open-modal-contact' : ''}`}>
        <img src={`/icons/${item.icon}`} alt="" class="callbar-icon-image" width="21" height="21" loading="lazy" />
        <p class="callbar-text">{label[0]}<br />{label[1]}</p>
      </div>
    );

    return item.kind === 'action' ? (
      <button type="button" class="callbar-link-2" data-modal-open={item.action}>{box}</button>
    ) : (
      <a href={item.href} class="callbar-link w-inline-block">{box}</a>
    );
  })}
</div>
```

- [ ] **Step 6: Render it from the homepage**

In `src/pages/index.astro`, import and place it inside `<BaseLayout>`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import CallBar from '../components/layout/CallBar.astro';
---
<BaseLayout
  title="The Veterinary Internal Medicine Group | Board Certified Vet Specialist in Miami, FL"
  description="Board-certified vet internal medicine in Miami. Expert ultrasound, diagnostics & consults for complex pet health. Serving South Florida pets."
>
  <CallBar />
</BaseLayout>
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm run test:build`
Expected: PASS — 5 CallBar tests green.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add CallBar component"
```

---

### Task 9: Header behavior scripts

Written before the Header markup so the behavior is test-driven against a known DOM contract.

**Files:**
- Create: `src/scripts/header-scroll.ts`, `src/scripts/nav.ts`
- Test: `tests/unit/header-scroll.test.ts`, `tests/unit/nav.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `initHeaderScroll(doc?: Document): void` from `src/scripts/header-scroll.ts` — observes `[data-scroll-sentinel]` and toggles `is-scrolled` on `.header`.
  - `initNav(doc?: Document): void` from `src/scripts/nav.ts` — wires `.menu-button` to toggle `is-open` on `.nav-menu`, and `.w-dropdown-toggle` to toggle `is-open` on its sibling `.w-dropdown-list`. Escape closes any open dropdown and the mobile menu.

- [ ] **Step 1: Write the failing header-scroll test**

Create `tests/unit/header-scroll.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initHeaderScroll } from '../../src/scripts/header-scroll';

let callback: (entries: { isIntersecting: boolean }[]) => void;

beforeEach(() => {
  document.body.innerHTML = `
    <div class="header"><div class="navbar"></div></div>
    <main><div data-scroll-sentinel></div></main>`;
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: typeof callback) { callback = cb; }
    observe() {} disconnect() {}
  });
});

describe('initHeaderScroll', () => {
  it('adds is-scrolled when the sentinel leaves the viewport', () => {
    initHeaderScroll(document);
    callback([{ isIntersecting: false }]);
    expect(document.querySelector('.header')!.classList.contains('is-scrolled')).toBe(true);
  });

  it('removes is-scrolled when the sentinel is visible again', () => {
    initHeaderScroll(document);
    callback([{ isIntersecting: false }]);
    callback([{ isIntersecting: true }]);
    expect(document.querySelector('.header')!.classList.contains('is-scrolled')).toBe(false);
  });

  it('does nothing when there is no sentinel', () => {
    document.body.innerHTML = '<div class="header"></div>';
    expect(() => initHeaderScroll(document)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `../../src/scripts/header-scroll`.

- [ ] **Step 3: Write `src/scripts/header-scroll.ts`**

```ts
/**
 * Toggles `.is-scrolled` on the header once the page scrolls past the top.
 * Uses a sentinel + IntersectionObserver so there is no scroll listener.
 */
export function initHeaderScroll(doc: Document = document): void {
  const header = doc.querySelector('.header');
  const sentinel = doc.querySelector('[data-scroll-sentinel]');
  if (!header || !sentinel) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        header.classList.toggle('is-scrolled', !entry.isIntersecting);
      }
    },
    { rootMargin: '0px', threshold: 0 },
  );

  observer.observe(sentinel);
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test`
Expected: PASS, 3 tests.

- [ ] **Step 5: Write the failing nav test**

Create `tests/unit/nav.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { initNav } from '../../src/scripts/nav';

beforeEach(() => {
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
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `../../src/scripts/nav`.

- [ ] **Step 7: Write `src/scripts/nav.ts`**

```ts
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
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — 3 header-scroll tests and 5 nav tests.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add header scroll and nav interaction modules"
```

---

### Task 10: Header component

**Files:**
- Create: `src/components/layout/Header.astro`, `src/components/layout/Nav.astro`
- Create: `src/styles/layout/header.css`, `src/styles/layout/nav.css`
- Modify: `src/styles/global.css`, `src/pages/index.astro`
- Test: `tests/build/header.test.ts`

**Interfaces:**
- Consumes: `navItems`, `site`, `socialLinks`, `locations`, `hoursHtml` (Task 3); `initHeaderScroll`, `initNav` (Task 9); `services` collection (Task 5).
- Produces: `Header.astro`, no props. Emits `<div class="header">` containing `.navbar > .container.navbar-container > .nav-wrapper`, and a `<div data-scroll-sentinel>` as the first child of `<main>` (rendered by the page, not the header).

**Reference:** run `node tools/capture.mjs home https://www.veterinaryimgroup.com/` then
`node -e "import('./tools/extract-css.mjs').then(m=>console.log(m.extractRules(require('fs').readFileSync('tools/snapshots/home.css','utf8'),['header','navbar','nav-link','nav-menu','brand','logo','dropdown-link','dropdown-menu','dropdown-list','menu-button','nav-actions'])))"`
to dump the authoritative rules before writing the stylesheets.

- [ ] **Step 1: Write the failing test**

Create `tests/build/header.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

let doc: Document;
beforeAll(() => {
  const { document } = parseHTML(readFileSync('dist/index.html', 'utf8'));
  doc = document as unknown as Document;
});

describe('Header', () => {
  it('renders the header and navbar', () => {
    expect(doc.querySelector('.header')).not.toBeNull();
    expect(doc.querySelector('.navbar')).not.toBeNull();
  });

  it('renders both logo variants for the scroll swap', () => {
    expect(doc.querySelector('.brand .logo-white')).not.toBeNull();
    expect(doc.querySelector('.brand .logo')).not.toBeNull();
  });

  it('renders the Spanish banner', () => {
    expect(doc.body.textContent).toContain('Hablamos español!');
  });

  it('renders 8 top-level nav entries', () => {
    expect(doc.querySelectorAll('.nav-menu > .line-animation-block')).toHaveLength(8);
  });

  it('renders the Services dropdown from the CMS with an All Services link', () => {
    const links = [...doc.querySelectorAll('.dropdown-link')].map((a) => a.getAttribute('href'));
    expect(links).toContain('/services');
    expect(links.some((h) => h?.startsWith('/services/'))).toBe(true);
  });

  it('uses a real button for the menu toggle', () => {
    const button = doc.querySelector('.menu-button');
    expect(button?.tagName.toLowerCase()).toBe('button');
    expect(button?.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders the scroll sentinel before the page content', () => {
    expect(doc.querySelector('[data-scroll-sentinel]')).not.toBeNull();
  });

  it('links the header phone icon to the practice number', () => {
    expect(doc.querySelector('.header a[href="tel:+17866735903"]')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:build`
Expected: FAIL — `.header` is null.

- [ ] **Step 3: Write `src/components/layout/Nav.astro`**

```astro
---
import type { NavItem } from '../../config/site';

interface Props { items: NavItem[] }
const { items } = Astro.props;
---
<nav class="nav-menu w-nav-menu">
  {items.filter((i) => !i.hidden).map((item) => (
    <div class="line-animation-block">
      {item.children && item.children.length > 0 ? (
        <div class="dropdown-wrapper w-dropdown">
          <button type="button" class="nav-link dropdown-nav-link w-dropdown-toggle" aria-expanded="false">
            <span class="dropdown-nav-link-icon" aria-hidden="true"></span>
            <span>{item.label}</span>
          </button>
          <nav class="dropdown-list w-dropdown-list">
            <div class="dropdown-menu">
              {item.children.filter((c) => !c.hidden).map((child) => (
                child.action
                  ? <button type="button" class="dropdown-link" data-modal-open={child.action}>{child.label}</button>
                  : <a class="dropdown-link" href={child.href}>{child.label}</a>
              ))}
              {item.href && <a class="dropdown-link" href={item.href}>All {item.label}</a>}
            </div>
          </nav>
        </div>
      ) : (
        <a class="nav-link w-nav-link" href={item.href}>{item.label}</a>
      )}
      <div class="line-animation-navbar"></div>
    </div>
  ))}
</nav>
```

- [ ] **Step 4: Write `src/components/layout/Header.astro`**

```astro
---
import { getCollection } from 'astro:content';
import { navItems, site, socialLinks, locations, hoursHtml } from '../../config/site';
import Nav from './Nav.astro';
import logoWhite from '~/assets/vimg-logowhite3.png';
import logoColor from '~/assets/vimg-logo5.png';
import { Image } from 'astro:assets';

const services = await getCollection('services');
const items = navItems.map((item) =>
  item.label === 'Services'
    ? {
        ...item,
        children: services.map((s) => ({
          label: String(s.data.name),
          href: `/services/${s.data.slug}`,
        })),
      }
    : item,
);
---
<div class="header">
  <div class="div-block-20">
    <p class="paragraph-9">{site.spanishBanner}</p>
  </div>

  <div class="navbar">
    <div class="container navbar-container">
      <div class="nav-wrapper">
        <a href="/" class="brand" aria-label={site.name}>
          <Image src={logoWhite} alt={site.name} class="logo-white" loading="eager" />
          <Image src={logoColor} alt={site.name} class="logo" loading="eager" />
        </a>

        <div class="div-block-17">
          <button type="button" class="menu-button" aria-expanded="false" aria-label="Open menu">
            <span class="new-icon" aria-hidden="true"></span>
          </button>
          <a href={site.phoneHref} class="header-phone-mobile" aria-label={`Call ${site.phoneDisplay}`}>
            <span class="header-icon phone-icon" aria-hidden="true"></span>
          </a>
        </div>

        <div class="div-block">
          <div class="nav-actions">
            <div class="nav-actions-top">
              <div class="navbar-grid location-block">
                {locations.map((l) => (
                  <a class="practice-info-navbar align-left" href={l.href} target="_blank" rel="noopener">
                    <span>- {l.label}</span>
                  </a>
                ))}
              </div>
              <div class="navbar-grid hours">
                <div class="practice-info-navbar schedule" set:html={hoursHtml} />
              </div>
              <div class="navbar-grid">
                <a class="practice-info-navbar" href={site.phoneHref}>{site.phoneDisplay}</a>
              </div>
              <div class="navbar-social-media-icons">
                {socialLinks.map((s) => (
                  <a class="social-icon-link" href={s.href} target="_blank" rel="noopener" aria-label={s.label}>
                    <span class={`social-icon ci-font ${s.icon}`} aria-hidden="true"></span>
                  </a>
                ))}
              </div>
            </div>

            <div class="nav-actions-contact nav-actions-contact-desktop">
              <a href="/clinic-schedule-locations" class="button navbar-button">
                <div class="text-button-navbar">Pop-up clinics</div>
              </a>
              <button type="button" class="button navbar-button secondary" data-modal-open="referring-clinics">
                <div class="text-button-navbar">Referring Clinics</div>
              </button>
            </div>
          </div>

          <Nav items={items} />

          <div class="nav-actions-contact nav-actions-contact-mobile">
            <a href="/clinic-schedule-locations" class="button button-inline-block herader">
              <div>Pop-Up Clinics</div>
            </a>
            <button type="button" class="button button-inline-block herader secondary" data-modal-open="referring-clinics">
              <div>Referring Clinics</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
  import { initHeaderScroll } from '../../scripts/header-scroll';
  import { initNav } from '../../scripts/nav';
  initHeaderScroll();
  initNav();
</script>
```

- [ ] **Step 5: Write `src/styles/layout/header.css`**

Base values are ported from the compiled CSS. The `.is-scrolled` block is new — it implements the transparent-to-solid switch that exists only as an IX2 interaction on the live site.

```css
.header {
  z-index: 999;
  position: fixed;
  inset: 0 0 auto;
}

.navbar {
  background-color: transparent;
  padding-block: .5em;
  transition: background-color .3s ease, box-shadow .3s ease;
}

.div-block-20 { background-color: var(--cta); text-align: center; padding: .25rem 1rem; }
.paragraph-9 { color: var(--white); font-size: .8125rem; margin: 0; }

.nav-wrapper { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }

.brand { display: inline-flex; align-items: center; }
.brand .logo-white { display: block; }
.brand .logo { display: none; }

/* Scrolled state — authored, not present in Webflow's compiled CSS. */
.header.is-scrolled .navbar {
  background-color: var(--white);
  box-shadow: 0 2px 12px var(--shadow);
}
.header.is-scrolled .nav-link { color: var(--text); }
.header.is-scrolled .brand .logo-white { display: none; }
.header.is-scrolled .brand .logo { display: block; }

.header-icon { width: 35px; color: var(--white); margin-right: 0; }
.header-icon.phone-icon { width: 30px; }

.div-block-17 { display: none; align-items: center; gap: .75rem; }

@media screen and (max-width: 991px) {
  .header { flex-flow: column; justify-content: center; display: flex; }
  .navbar { width: 100%; padding-block: 0; }
  .div-block-17 { display: flex; }
  .header-icon { width: 30px; }
  .header-icon.phone-icon { align-items: center; width: 28px; display: flex; }
}
```

- [ ] **Step 6: Write `src/styles/layout/nav.css`**

```css
.nav-menu { display: flex; align-items: center; gap: 1.25rem; }
.line-animation-block { position: relative; }

.nav-link {
  color: var(--white);
  font-size: .875rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: .5rem 0;
  display: inline-flex;
  align-items: center;
  gap: .35rem;
}
.nav-link:hover { color: var(--cta); }

.line-animation-navbar {
  height: 2px;
  width: 0;
  background-color: var(--cta);
  transition: width .3s ease;
}
.line-animation-block:hover .line-animation-navbar { width: 100%; }

.dropdown-wrapper { position: relative; }
.dropdown-nav-link-icon { width: .5rem; height: .5rem; border-right: 2px solid currentColor; border-bottom: 2px solid currentColor; transform: rotate(45deg); }

.dropdown-list {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 15rem;
  z-index: 10;
}
.dropdown-list.is-open { display: block; }

.dropdown-menu { background-color: var(--white); box-shadow: 0 4px 16px var(--shadow); padding: .5rem 0; }
.dropdown-link {
  display: block;
  width: 100%;
  text-align: left;
  color: var(--text);
  font-size: .875rem;
  padding: .5rem 1rem;
}
.dropdown-link:hover { background-color: var(--main-light); color: var(--cta); }

@media screen and (max-width: 991px) {
  .nav-menu {
    display: none;
    flex-direction: column;
    align-items: stretch;
    background-color: var(--white);
    padding: 1rem;
  }
  .nav-menu.is-open { display: flex; }
  .nav-link { color: var(--text); }
  .dropdown-list { position: static; min-width: 0; }
}
```

- [ ] **Step 7: Import both stylesheets**

Append to `src/styles/global.css`:

```css
@import './layout/header.css';
@import './layout/nav.css';
```

- [ ] **Step 8: Render Header and the sentinel from the homepage**

Update `src/pages/index.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/layout/Header.astro';
import CallBar from '../components/layout/CallBar.astro';
---
<BaseLayout
  title="The Veterinary Internal Medicine Group | Board Certified Vet Specialist in Miami, FL"
  description="Board-certified vet internal medicine in Miami. Expert ultrasound, diagnostics & consults for complex pet health. Serving South Florida pets."
>
  <Header />
  <main class="content">
    <div data-scroll-sentinel aria-hidden="true"></div>
  </main>
  <CallBar />
</BaseLayout>
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `npm run test:build`
Expected: PASS — 8 Header tests green.

If the logo filenames differ from `vimg-logowhite3.png` / `vimg-logo5.png`, check `ls src/assets` and update the imports; do not invent filenames.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add Header with nav, dropdowns, and scroll state"
```

---

### Task 11: Modal controller and modal components

**Files:**
- Create: `src/scripts/modal.ts`
- Create: `src/components/modals/Modal.astro`, `ReferringClinicsModal.astro`, `HowdWeDoWidget.astro`, `ScheduledPopup.astro`
- Create: `src/styles/components/modal.css`
- Modify: `src/styles/global.css`, `src/pages/index.astro`
- Test: `tests/unit/modal.test.ts`, `tests/build/modals.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks except `site` (Task 3).
- Produces:
  - `initModals(doc?: Document): void` from `src/scripts/modal.ts` — binds every `[data-modal-open="<id>"]` to the element with `[data-modal="<id>"]`, toggling `is-open`, locking body scroll, closing on Escape, backdrop click, and `[data-modal-close]`.
  - `Modal.astro` with props `{ id: string; labelledBy: string }` and a `<slot />`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/modal.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { initModals } from '../../src/scripts/modal';

beforeEach(() => {
  document.body.innerHTML = `
    <button data-modal-open="demo">open</button>
    <div class="modal-wrapper" data-modal="demo" hidden>
      <div class="modal"><button data-modal-close>close</button></div>
    </div>`;
  document.body.classList.remove('has-modal-open');
  initModals(document);
});

const wrapper = () => document.querySelector('[data-modal="demo"]') as HTMLElement;

describe('initModals', () => {
  it('opens the modal on trigger click', () => {
    (document.querySelector('[data-modal-open]') as HTMLElement).click();
    expect(wrapper().classList.contains('is-open')).toBe(true);
    expect(wrapper().hasAttribute('hidden')).toBe(false);
  });

  it('locks body scroll while open', () => {
    (document.querySelector('[data-modal-open]') as HTMLElement).click();
    expect(document.body.classList.contains('has-modal-open')).toBe(true);
  });

  it('closes on the close button and unlocks scroll', () => {
    (document.querySelector('[data-modal-open]') as HTMLElement).click();
    (document.querySelector('[data-modal-close]') as HTMLElement).click();
    expect(wrapper().classList.contains('is-open')).toBe(false);
    expect(document.body.classList.contains('has-modal-open')).toBe(false);
  });

  it('closes on Escape', () => {
    (document.querySelector('[data-modal-open]') as HTMLElement).click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(wrapper().classList.contains('is-open')).toBe(false);
  });

  it('closes when the backdrop is clicked', () => {
    (document.querySelector('[data-modal-open]') as HTMLElement).click();
    wrapper().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(wrapper().classList.contains('is-open')).toBe(false);
  });

  it('keeps the modal open when its inner panel is clicked', () => {
    (document.querySelector('[data-modal-open]') as HTMLElement).click();
    (wrapper().querySelector('.modal') as HTMLElement)
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(wrapper().classList.contains('is-open')).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `../../src/scripts/modal`.

- [ ] **Step 3: Write `src/scripts/modal.ts`**

```ts
const OPEN_CLASS = 'is-open';
const BODY_CLASS = 'has-modal-open';

function close(wrapper: HTMLElement, doc: Document): void {
  wrapper.classList.remove(OPEN_CLASS);
  wrapper.setAttribute('hidden', '');
  if (!doc.querySelector(`.${OPEN_CLASS}[data-modal]`)) {
    doc.body.classList.remove(BODY_CLASS);
  }
}

function open(wrapper: HTMLElement, doc: Document): void {
  wrapper.removeAttribute('hidden');
  wrapper.classList.add(OPEN_CLASS);
  doc.body.classList.add(BODY_CLASS);
  wrapper.querySelector<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )?.focus();
}

/** Wires [data-modal-open="id"] triggers to [data-modal="id"] wrappers. */
export function initModals(doc: Document = document): void {
  for (const trigger of doc.querySelectorAll<HTMLElement>('[data-modal-open]')) {
    if (trigger.dataset.modalBound) continue;
    trigger.dataset.modalBound = 'true';
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      const id = trigger.dataset.modalOpen!;
      const wrapper = doc.querySelector<HTMLElement>(`[data-modal="${id}"]`);
      if (wrapper) open(wrapper, doc);
    });
  }

  for (const wrapper of doc.querySelectorAll<HTMLElement>('[data-modal]')) {
    if (wrapper.dataset.modalBound) continue;
    wrapper.dataset.modalBound = 'true';

    wrapper.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target === wrapper || target.closest('[data-modal-close]')) {
        close(wrapper, doc);
      }
    });
  }

  if (!doc.documentElement.dataset.modalEscBound) {
    doc.documentElement.dataset.modalEscBound = 'true';
    doc.addEventListener('keydown', (event) => {
      if ((event as KeyboardEvent).key !== 'Escape') return;
      for (const w of doc.querySelectorAll<HTMLElement>(`.${OPEN_CLASS}[data-modal]`)) {
        close(w, doc);
      }
    });
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test`
Expected: PASS, 6 tests.

- [ ] **Step 5: Write `src/styles/components/modal.css`**

```css
.modal-wrapper {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: none;
  align-items: center;
  justify-content: center;
  background-color: var(--overlay-color);
  padding: 1rem;
}
.modal-wrapper.is-open { display: flex; }

.modal {
  background-color: var(--white);
  border-radius: .5rem;
  max-width: 40rem;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  padding: 2rem;
}

.modal-close-2 {
  position: absolute;
  top: .75rem;
  right: 1rem;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--main);
}

body.has-modal-open { overflow: hidden; }

/* How'd We Do widget */
.rm-modal { text-align: center; }
.rm-title { font-size: 1.25rem; color: var(--main-dark); margin-bottom: 1.5rem; }
.rm-options-flex { display: flex; gap: 1rem; justify-content: center; }
.rm-options-link-block { display: flex; flex-direction: column; align-items: center; gap: .5rem; padding: 1rem; border-radius: .5rem; }
.rm-options-link-block:hover { background-color: var(--main-light); }
.rm-options-image { width: 3rem; height: 3rem; }
.rm-step[hidden] { display: none; }
```

- [ ] **Step 6: Write `src/components/modals/Modal.astro`**

```astro
---
interface Props { id: string; labelledBy: string }
const { id, labelledBy } = Astro.props;
---
<div class="modal-wrapper" data-modal={id} role="dialog" aria-modal="true" aria-labelledby={labelledBy} hidden>
  <div class="modal">
    <button type="button" class="modal-close-2" data-modal-close aria-label="Close">×</button>
    <slot />
  </div>
</div>
```

- [ ] **Step 7: Write `src/components/modals/ReferringClinicsModal.astro`**

```astro
---
import Modal from './Modal.astro';
import { site } from '../../config/site';
---
<Modal id="referring-clinics" labelledBy="referring-clinics-title">
  <div class="modal-popup-content">
    <h2 id="referring-clinics-title" class="rm-title">Referring Clinics</h2>
    <p>
      Refer a patient to {site.name}. Call
      <a href={site.phoneHref}>{site.phoneDisplay}</a> or submit a request and our team
      will follow up with scheduling details.
    </p>
    <p class="mt-1">
      <a class="button" href="/general-information-request">Send a referral request</a>
    </p>
  </div>
</Modal>
```

Copy for this modal is not recoverable from the homepage snapshot (the live modal body is populated by an interaction). Use the text above and flag it to the user for review.

- [ ] **Step 8: Write `src/components/modals/HowdWeDoWidget.astro`**

```astro
---
import Modal from './Modal.astro';
import { site } from '../../config/site';

const reviewUrl = `https://search.google.com/local/writereview?placeid=${site.placeId}`;
---
<Modal id="howd-we-do" labelledBy="howd-we-do-title">
  <div class="rm-modal">
    <div class="rm-step" data-rm-step="1">
      <h2 id="howd-we-do-title" class="rm-title">Tell us how we are doing?</h2>
      <div class="rm-options-flex">
        <button type="button" class="rm-options-link-block like" data-rm-choice="like">
          <img src="/icons/paw-like.svg" alt="" class="rm-options-image" />
          <span class="rm-options-description">Like</span>
        </button>
        <button type="button" class="rm-options-link-block dislike" data-rm-choice="dislike">
          <img src="/icons/paw-dislike.svg" alt="" class="rm-options-image" />
          <span class="rm-options-description">Dislike</span>
        </button>
      </div>
    </div>

    <div class="rm-step" data-rm-step="like" hidden>
      <h2 class="rm-title">Wonderful! Would you share that with others?</h2>
      <a class="button" href={reviewUrl} target="_blank" rel="noopener">Leave a Google review</a>
    </div>

    <div class="rm-step" data-rm-step="dislike" hidden>
      <h2 class="rm-title">We're sorry. Tell us what went wrong.</h2>
      <a class="button" href="/howd-we-do">Send private feedback</a>
    </div>
  </div>
</Modal>

<script>
  const root = document.querySelector('[data-modal="howd-we-do"]');
  root?.addEventListener('click', (event) => {
    const choice = (event.target as HTMLElement).closest<HTMLElement>('[data-rm-choice]');
    if (!choice) return;
    for (const step of root.querySelectorAll<HTMLElement>('.rm-step')) {
      step.hidden = step.dataset.rmStep !== choice.dataset.rmChoice;
    }
  });
</script>
```

If `paw-like.svg` / `paw-dislike.svg` are absent from `public/icons/`, list the directory and use the actual mirrored filenames.

- [ ] **Step 9: Write `src/components/modals/ScheduledPopup.astro`**

The source hardcodes a UTC window in a client-side script and removes the element when the
window has passed. We evaluate the window at **build time** instead, so an expired popup ships
zero markup and zero JavaScript.

```astro
---
import Modal from './Modal.astro';
import { scheduledPopup } from '../../config/site';

const now = Date.now();
const active =
  scheduledPopup.enabled &&
  now >= Date.parse(scheduledPopup.start) &&
  now <= Date.parse(scheduledPopup.end);
---
{active && (
  <Modal id="scheduled" labelledBy="scheduled-title">
    <div class="modal-popup-content">
      <h2 id="scheduled-title" class="rm-title"><slot name="title">Announcement</slot></h2>
      <div class="modal-popup-text"><slot /></div>
    </div>
  </Modal>
)}

<script>
  // Auto-open a scheduled popup once per browser session.
  const popup = document.querySelector('[data-modal="scheduled"]');
  if (popup && !sessionStorage.getItem('scheduled-popup-seen')) {
    sessionStorage.setItem('scheduled-popup-seen', '1');
    popup.removeAttribute('hidden');
    popup.classList.add('is-open');
    document.body.classList.add('has-modal-open');
  }
</script>
```

With `scheduledPopup.enabled` currently `false` (the source window expired 2025-09-30), this
renders nothing. The build test in the next step asserts exactly that.

- [ ] **Step 10: Write the build test**

Create `tests/build/modals.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

let doc: Document;
beforeAll(() => {
  const { document } = parseHTML(readFileSync('dist/index.html', 'utf8'));
  doc = document as unknown as Document;
});

describe('modals', () => {
  it('renders both modals with dialog semantics', () => {
    for (const id of ['referring-clinics', 'howd-we-do']) {
      const el = doc.querySelector(`[data-modal="${id}"]`);
      expect(el, `missing modal ${id}`).not.toBeNull();
      expect(el!.getAttribute('role')).toBe('dialog');
      expect(el!.getAttribute('aria-modal')).toBe('true');
    }
  });

  it('starts hidden', () => {
    expect(doc.querySelector('[data-modal="howd-we-do"]')!.hasAttribute('hidden')).toBe(true);
  });

  it('points the review CTA at the practice Place ID', () => {
    const link = doc.querySelector('[data-modal="howd-we-do"] a[href*="writereview"]');
    expect(link?.getAttribute('href')).toContain('ChIJhw8-GA3X3ogRu7g-W6oUCQU');
  });

  it('does not render the expired scheduled popup', () => {
    expect(doc.querySelector('[data-modal="scheduled"]')).toBeNull();
  });
});
```

- [ ] **Step 11: Wire modals into the homepage and initialize them**

Append the imports and markup to `src/pages/index.astro` inside `<BaseLayout>`, after `<CallBar />`:

```astro
<ReferringClinicsModal />
<HowdWeDoWidget />
<ScheduledPopup />
<script>
  import { initModals } from '../scripts/modal';
  initModals();
</script>
```

Add to the frontmatter:

```ts
import ReferringClinicsModal from '../components/modals/ReferringClinicsModal.astro';
import HowdWeDoWidget from '../components/modals/HowdWeDoWidget.astro';
import ScheduledPopup from '../components/modals/ScheduledPopup.astro';
```

Append to `src/styles/global.css`:

```css
@import './components/modal.css';
```

- [ ] **Step 12: Run the tests to verify they pass**

Run: `npm run verify`
Expected: PASS — all unit tests plus 4 modal build tests.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: add modal controller with referring clinics, how'd we do, and scheduled popup"
```

---

### Task 12: Footer and third-party widgets

**Files:**
- Create: `src/components/layout/Footer.astro`
- Create: `src/components/widgets/GoogleReviews.astro`, `VetstoriaButton.astro`, `UserWay.astro`
- Create: `src/styles/layout/footer.css`, `src/styles/components/widgets.css`
- Modify: `src/styles/global.css`, `src/pages/index.astro`
- Test: `tests/build/footer.test.ts`

**Interfaces:**
- Consumes: `site`, `socialLinks`, `locations`, `hoursHtml` (Task 3); `CallBar` (Task 8); modals (Task 11).
- Produces: `Footer.astro`, no props. Renders `<footer class="footer">` containing the footer grids, `<CallBar />`, `<GoogleReviews />`, and the widget scripts — matching the source DOM where CallBar lives inside the footer.

**Reference:** dump the authoritative footer rules first:
`node -e "import('./tools/extract-css.mjs').then(m=>console.log(m.extractRules(require('fs').readFileSync('tools/snapshots/home.css','utf8'),['footer','footer-grid-desktop','footer-grid-mobile','footer-bottom-2','google-reviews-widget-wrapper-2','grw-google'])))"`

- [ ] **Step 1: Write the failing test**

Create `tests/build/footer.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

let doc: Document;
let html: string;
beforeAll(() => {
  html = readFileSync('dist/index.html', 'utf8');
  doc = parseHTML(html).document as unknown as Document;
});

describe('Footer', () => {
  it('renders a semantic footer', () => {
    expect(doc.querySelector('footer.footer')).not.toBeNull();
  });

  it('contains the callbar', () => {
    expect(doc.querySelector('footer.footer .callbar')).not.toBeNull();
  });

  it('renders the practice phone and both social links', () => {
    expect(doc.querySelector('footer a[href="tel:+17866735903"]')).not.toBeNull();
    expect(doc.querySelector('footer a[href*="facebook.com/theVIMG"]')).not.toBeNull();
    expect(doc.querySelector('footer a[href*="instagram.com/thevimg"]')).not.toBeNull();
  });

  it('renders the reviews container and write-review link', () => {
    expect(doc.querySelector('#reviews-container')).not.toBeNull();
    expect(doc.querySelector('a[href*="writereview"]')).not.toBeNull();
  });

  it('loads Vetstoria and UserWay', () => {
    expect(html).toContain('oabp-widget-floating-button.min.js');
    expect(html).toContain('cdn.userway.org/widget.js');
  });

  it('omits the dead legacy footer block', () => {
    expect(doc.querySelector('.old-footer-new-template')).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:build`
Expected: FAIL — `footer.footer` is null.

- [ ] **Step 3: Write `src/components/widgets/GoogleReviews.astro`**

The upstream endpoint returns raw HTML. The source site assigns it straight to `innerHTML`; we strip scripts and event-handler attributes first.

```astro
---
import { site } from '../../config/site';
const reviewUrl = `https://search.google.com/local/writereview?placeid=${site.placeId}`;
---
<div class="google-reviews-widget-wrapper-2">
  <a href={reviewUrl} target="_blank" rel="noopener" class="google-reviews-widget-1" aria-label="Leave us a Google review">
    <img src="/icons/google-icon.png" alt="" class="grw-google" width="24" height="24" loading="lazy" />
    <div id="reviews-container"></div>
  </a>
</div>

<script define:vars={{ endpoint: `${site.reviewsApi}/${site.placeId}` }}>
  fetch(endpoint)
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
    .then((html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('script, iframe, object, embed').forEach((n) => n.remove());
      doc.querySelectorAll('*').forEach((el) => {
        for (const attr of [...el.attributes]) {
          if (/^on/i.test(attr.name) || /javascript:/i.test(attr.value)) el.removeAttribute(attr.name);
        }
      });
      const target = document.getElementById('reviews-container');
      if (target) target.replaceChildren(...doc.body.childNodes);
    })
    .catch(() => { /* widget is non-essential; fail silently as the source does */ });
</script>
```

If `google-icon.png` is not in `public/icons/`, use the actual mirrored filename from `ls public/icons`.

- [ ] **Step 4: Write `src/components/widgets/VetstoriaButton.astro`**

```astro
<script is:inline defer src="https://us.vetstoria.com/js/oabp-widget-floating-button.min.js"></script>
```

- [ ] **Step 5: Write `src/components/widgets/UserWay.astro`**

```astro
<script is:inline>
  var _userway_config = { position: '1', size: 'small' };
</script>
<script is:inline defer src="https://cdn.userway.org/widget.js"></script>
```

- [ ] **Step 6: Write `src/styles/layout/footer.css`**

```css
.footer { background-color: var(--main-dark); color: var(--white); }
.container-footer { padding-block: 3rem; }

.footer-grid-desktop {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
}
.footer-grid-mobile { display: none; }

.footer-heading { font-size: 1rem; text-transform: uppercase; margin-bottom: 1rem; color: var(--white); }
.footer-link { display: block; color: var(--white-o85); font-size: .875rem; padding-block: .25rem; }
.footer-link:hover { color: var(--cta); }

.footer-bottom-2 {
  border-top: 1px solid var(--main);
  padding-block: 1.25rem;
  font-size: .8125rem;
  color: var(--white-o85);
  text-align: center;
}

@media screen and (max-width: 991px) {
  /* Keep the fixed CallBar from covering footer content. */
  .footer { padding-bottom: var(--callbar-height); }
}

@media screen and (max-width: 767px) {
  .footer-grid-desktop { display: none; }
  .footer-grid-mobile { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
}
```

- [ ] **Step 7: Write `src/styles/components/widgets.css`**

```css
.google-reviews-widget-wrapper-2 {
  position: fixed;
  left: 1rem;
  bottom: 1rem;
  z-index: 40;
}
.google-reviews-widget-1 {
  display: flex;
  align-items: center;
  gap: .5rem;
  background-color: var(--white);
  box-shadow: 0 2px 10px var(--shadow);
  border-radius: 2rem;
  padding: .5rem .875rem;
  color: var(--text);
  font-size: .8125rem;
}
.grw-google { width: 1.5rem; height: 1.5rem; }

@media screen and (max-width: 991px) {
  .google-reviews-widget-wrapper-2 { bottom: calc(var(--callbar-height) + 1rem); }
}
```

- [ ] **Step 8: Write `src/components/layout/Footer.astro`**

```astro
---
import { site, socialLinks, locations, hoursHtml } from '../../config/site';
import CallBar from './CallBar.astro';
import GoogleReviews from '../widgets/GoogleReviews.astro';
import VetstoriaButton from '../widgets/VetstoriaButton.astro';
import UserWay from '../widgets/UserWay.astro';

const year = new Date().getFullYear();
---
<footer class="footer">
  <div class="container container-footer">
    <div class="footer-grid-desktop">
      <div>
        <h2 class="footer-heading">Contact</h2>
        <a class="footer-link" href={site.phoneHref}>{site.phoneDisplay}</a>
        {locations.map((l) => (
          <a class="footer-link" href={l.href} target="_blank" rel="noopener">{l.label}</a>
        ))}
      </div>
      <div>
        <h2 class="footer-heading">Hours</h2>
        <div class="footer-link" set:html={hoursHtml} />
      </div>
      <div>
        <h2 class="footer-heading">Explore</h2>
        <a class="footer-link" href="/services">Services</a>
        <a class="footer-link" href="/meet-the-team">Meet Our Team</a>
        <a class="footer-link" href="/clinic-schedule-locations">Pop-Up Clinics</a>
        <a class="footer-link" href="/blog">Our Blog</a>
        <a class="footer-link" href="/career-opportunity">Careers</a>
      </div>
      <div>
        <h2 class="footer-heading">Follow</h2>
        {socialLinks.map((s) => (
          <a class="footer-link" href={s.href} target="_blank" rel="noopener">{s.label}</a>
        ))}
      </div>
    </div>

    <div class="footer-grid-mobile">
      <a class="footer-link" href={site.phoneHref}>{site.phoneDisplay}</a>
      <a class="footer-link" href="/services">Services</a>
      <a class="footer-link" href="/meet-the-team">Meet Our Team</a>
      <a class="footer-link" href="/general-information-request">Contact</a>
      {socialLinks.map((s) => (
        <a class="footer-link" href={s.href} target="_blank" rel="noopener">{s.label}</a>
      ))}
    </div>

    <div class="footer-bottom-2">
      © {year} {site.name}. All rights reserved.
    </div>
  </div>

  <CallBar />
  <GoogleReviews />
  <VetstoriaButton />
  <UserWay />
</footer>
```

- [ ] **Step 9: Replace the standalone CallBar on the homepage**

In `src/pages/index.astro`, remove the direct `<CallBar />` and its import (Footer now owns it), and add `<Footer />` after `</main>`:

```astro
import Footer from '../components/layout/Footer.astro';
```

```astro
  </main>
  <Footer />
```

Append to `src/styles/global.css`:

```css
@import './layout/footer.css';
@import './components/widgets.css';
```

- [ ] **Step 10: Run the tests to verify they pass**

Run: `npm run verify`
Expected: PASS — 6 Footer tests plus all previous tests, including the CallBar tests which still find `.callbar` (now nested in the footer).

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: add Footer with callbar, reviews, and third-party widgets"
```

---

### Task 13: Homepage — hero and collage sections

**Files:**
- Create: `src/components/home/Hero.astro`, `src/components/home/Collage.astro`
- Create: `src/styles/components/hero.css`, `src/styles/components/collage.css`
- Create: `src/scripts/reveal.ts`, `src/scripts/lightbox.ts`
- Modify: `src/pages/index.astro`, `src/styles/global.css`, `src/styles/components/modal.css`
- Test: `tests/unit/reveal.test.ts`, `tests/unit/lightbox.test.ts`, `tests/build/home-hero.test.ts`

**Interfaces:**
- Consumes: `site` (Task 3), mirrored assets (Task 6).
- Produces:
  - `initReveal(doc?: Document): void` from `src/scripts/reveal.ts` — adds `is-visible` to every `.reveal` when it enters the viewport.
  - `initLightbox(doc?: Document): void` from `src/scripts/lightbox.ts` — binds every `[data-lightbox]` anchor to a generated `.lightbox-overlay`.
  - `Hero.astro`, `Collage.astro`, both propless.

**Reference:** extract the exact markup and CSS before writing:
`node -e "import('./tools/extract-css.mjs').then(m=>console.log(m.extractRules(require('fs').readFileSync('tools/snapshots/home.css','utf8'),['hero','hero-background','container-hero-home-page','collage-container'])))"`

- [ ] **Step 1: Write the failing reveal test**

Create `tests/unit/reveal.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initReveal } from '../../src/scripts/reveal';

let callback: (entries: { isIntersecting: boolean; target: Element }[]) => void;
const unobserve = vi.fn();

beforeEach(() => {
  unobserve.mockClear();
  document.body.innerHTML = '<div class="reveal" id="a"></div>';
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: typeof callback) { callback = cb; }
    observe() {} unobserve = unobserve; disconnect() {}
  });
});

describe('initReveal', () => {
  it('adds is-visible when the element enters the viewport', () => {
    initReveal(document);
    const el = document.getElementById('a')!;
    callback([{ isIntersecting: true, target: el }]);
    expect(el.classList.contains('is-visible')).toBe(true);
  });

  it('stops observing once revealed', () => {
    initReveal(document);
    const el = document.getElementById('a')!;
    callback([{ isIntersecting: true, target: el }]);
    expect(unobserve).toHaveBeenCalledWith(el);
  });

  it('leaves elements alone until they intersect', () => {
    initReveal(document);
    const el = document.getElementById('a')!;
    callback([{ isIntersecting: false, target: el }]);
    expect(el.classList.contains('is-visible')).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `../../src/scripts/reveal`.

- [ ] **Step 3: Write `src/scripts/reveal.ts`**

```ts
/** Replaces Webflow IX2 scroll-reveal interactions with a CSS-transition trigger. */
export function initReveal(doc: Document = document): void {
  const targets = doc.querySelectorAll<HTMLElement>('.reveal');
  if (targets.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
  );

  for (const target of targets) observer.observe(target);
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test`
Expected: PASS, 3 tests.

- [ ] **Step 5: Write the failing hero build test**

Create `tests/build/home-hero.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

let doc: Document;
beforeAll(() => {
  doc = parseHTML(readFileSync('dist/index.html', 'utf8')).document as unknown as Document;
});

describe('homepage hero', () => {
  it('renders the hero section', () => {
    expect(doc.querySelector('.hero')).not.toBeNull();
  });

  it('has exactly one h1', () => {
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
  });

  it('renders a background video with a poster fallback', () => {
    const video = doc.querySelector('.hero-background video');
    expect(video).not.toBeNull();
    expect(video!.hasAttribute('poster')).toBe(true);
    expect(video!.hasAttribute('muted')).toBe(true);
    expect(video!.hasAttribute('playsinline')).toBe(true);
  });

  it('renders a primary hero CTA', () => {
    expect(doc.querySelector('.hero a.button')).not.toBeNull();
  });

  it('renders the collage section', () => {
    expect(doc.querySelector('.collage-container')).not.toBeNull();
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npm run test:build`
Expected: FAIL — `.hero` is null.

- [ ] **Step 7: Build Hero and Collage from the captured snapshot**

Open `tools/snapshots/home.html` and locate the `.hero` block (search for `class="hero"`) and the `.collage-container` block. Port the markup into the two components, applying these rules:

- Keep every Webflow class name.
- Replace `<img src="https://cdn.prod.website-files.com/...">` with `astro:assets` `<Image>` imports from `~/assets/`, using the mirrored filename.
- Replace Webflow's `.w-background-video` div with a real `<video autoplay muted loop playsinline poster="...">`.
- Drop `data-w-id` attributes; where the element had a scroll-reveal interaction, add `class="reveal"`.
- The hero headline becomes the page's single `<h1>`.
- Move the extracted CSS rules into `src/styles/components/hero.css` and `collage.css`, converting hardcoded colors to the matching `var(--token)` where the value matches a token exactly.

- [ ] **Step 8: Wire the sections into the homepage**

In `src/pages/index.astro`, inside `<main class="content">` after the sentinel:

```astro
<Hero />
<Collage />
```

Add to frontmatter:

```ts
import Hero from '../components/home/Hero.astro';
import Collage from '../components/home/Collage.astro';
```

Add to the page's `<script>` block:

```ts
import { initReveal } from '../scripts/reveal';
initReveal();
```

Append to `src/styles/global.css`:

```css
@import './components/hero.css';
@import './components/collage.css';
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `npm run verify`
Expected: PASS — 3 reveal tests plus 5 hero build tests.

- [ ] **Step 10: Write the failing lightbox test**

The homepage has three `w-lightbox` instances. Create `tests/unit/lightbox.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { initLightbox } from '../../src/scripts/lightbox';

beforeEach(() => {
  document.body.innerHTML = `
    <a data-lightbox href="/a.jpg"><img src="/a-thumb.jpg" alt="A pug"></a>
    <a data-lightbox href="/b.jpg"><img src="/b-thumb.jpg" alt="A cat"></a>`;
  document.querySelector('.lightbox-overlay')?.remove();
  initLightbox(document);
});

const overlay = () => document.querySelector('.lightbox-overlay') as HTMLElement;

describe('initLightbox', () => {
  it('opens with the clicked image and its alt text', () => {
    (document.querySelectorAll('[data-lightbox]')[1] as HTMLElement).click();
    expect(overlay().classList.contains('is-open')).toBe(true);
    const img = overlay().querySelector('img')!;
    expect(img.getAttribute('src')).toBe('/b.jpg');
    expect(img.getAttribute('alt')).toBe('A cat');
  });

  it('closes on Escape', () => {
    (document.querySelector('[data-lightbox]') as HTMLElement).click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(overlay().classList.contains('is-open')).toBe(false);
  });

  it('closes when the backdrop is clicked', () => {
    (document.querySelector('[data-lightbox]') as HTMLElement).click();
    overlay().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay().classList.contains('is-open')).toBe(false);
  });

  it('prevents the anchor from navigating', () => {
    const link = document.querySelector('[data-lightbox]') as HTMLElement;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
```

- [ ] **Step 11: Write `src/scripts/lightbox.ts` and its styles**

Run `npm test` first and confirm it fails with an unresolved import, then create:

```ts
/** Minimal image lightbox replacing Webflow's w-lightbox. */
export function initLightbox(doc: Document = document): void {
  const links = doc.querySelectorAll<HTMLAnchorElement>('[data-lightbox]');
  if (links.length === 0) return;

  const overlay = doc.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML =
    '<button type="button" class="lightbox-close" aria-label="Close">×</button><img alt="">';
  doc.body.appendChild(overlay);

  const image = overlay.querySelector('img')!;

  const close = () => {
    overlay.classList.remove('is-open');
    doc.body.classList.remove('has-modal-open');
  };

  for (const link of links) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      image.setAttribute('src', link.getAttribute('href') ?? '');
      image.setAttribute('alt', link.querySelector('img')?.getAttribute('alt') ?? '');
      overlay.classList.add('is-open');
      doc.body.classList.add('has-modal-open');
      overlay.querySelector<HTMLElement>('.lightbox-close')?.focus();
    });
  }

  overlay.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target === overlay || target.closest('.lightbox-close')) close();
  });

  doc.addEventListener('keydown', (event) => {
    if ((event as KeyboardEvent).key === 'Escape') close();
  });
}
```

Append to `src/styles/components/modal.css`:

```css
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: none;
  align-items: center;
  justify-content: center;
  background-color: var(--overlay-color);
  padding: 2rem;
}
.lightbox-overlay.is-open { display: flex; }
.lightbox-overlay img { max-width: 100%; max-height: 90vh; object-fit: contain; }
.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  font-size: 2rem;
  line-height: 1;
  color: var(--white);
}
```

Mark collage images that open enlarged in the source with `data-lightbox` on their anchor, and
call `initLightbox()` from the homepage script block. Run `npm test` and expect 4 passing tests.

- [ ] **Step 12: Compare against the live site**

Run `npm run preview`, then screenshot `http://localhost:4321/` and `https://www.veterinaryimgroup.com/` at widths 1440, 768, and 375. Compare the hero and collage regions, and confirm clicking a collage image opens the lightbox. Fix any differences in spacing, type scale, or color before committing.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: add homepage hero, collage, and lightbox"
```

---

### Task 14: Homepage — practice info, doctors, and services sections

**Files:**
- Create: `src/components/home/PracticeInfo.astro`, `src/components/home/DoctorsSection.astro`, `src/components/home/ServicesGrid.astro`
- Create: `src/styles/components/practice-info.css`, `doctors.css`, `services-grid.css`
- Modify: `src/pages/index.astro`, `src/styles/global.css`
- Test: `tests/build/home-sections.test.ts`

**Interfaces:**
- Consumes: `doctors`, `services`, `practiceInformation` collections (Task 5); mirrored assets (Task 6).
- Produces: three propless components rendering `.practice-information-container`, `.doctors-section-home`, and `.services-homepage-grid`.

- [ ] **Step 1: Write the failing test**

Create `tests/build/home-sections.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

let doc: Document;
beforeAll(() => {
  doc = parseHTML(readFileSync('dist/index.html', 'utf8')).document as unknown as Document;
});

describe('homepage content sections', () => {
  it('renders the practice information section', () => {
    expect(doc.querySelector('.practice-information-container')).not.toBeNull();
  });

  it('renders at least one doctor card', () => {
    const section = doc.querySelector('.doctors-section-home');
    expect(section).not.toBeNull();
    expect(section!.querySelectorAll('a, article').length).toBeGreaterThan(0);
  });

  it('renders the services grid with links into /services/', () => {
    const grid = doc.querySelector('.services-homepage-grid');
    expect(grid).not.toBeNull();
    const hrefs = [...grid!.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs.some((h) => h?.startsWith('/services/'))).toBe(true);
  });

  it('gives every section image a decodable alt attribute', () => {
    for (const img of doc.querySelectorAll('.services-homepage-grid img, .doctors-section-home img')) {
      expect(img.hasAttribute('alt')).toBe(true);
    }
  });

  it('uses h2 for section headings, never a second h1', () => {
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelectorAll('h2').length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:build`
Expected: FAIL — `.practice-information-container` is null.

- [ ] **Step 3: Build the three components from the snapshot**

Port each section from `tools/snapshots/home.html`, following the same rules as Task 13 Step 7. Additionally:

- Replace each Webflow `.w-dyn-list` / `.w-dyn-item` loop with `getCollection()` plus `.map()`. Keep the `.w-dyn-list` wrapper class only where a CSS rule depends on it; drop `.w-dyn-bind-empty` and `.w-condition-invisible` helper divs entirely.
- Sort collections deterministically (for example `services.sort((a, b) => a.data.name.localeCompare(b.data.name))`) so builds are reproducible.
- Section headings are `<h2>`.

Example shape for `ServicesGrid.astro`:

```astro
---
import { getCollection } from 'astro:content';
const services = (await getCollection('services'))
  .sort((a, b) => String(a.data.name).localeCompare(String(b.data.name)));
---
<section class="general-section no-margin new-padding">
  <div class="container services-section">
    <h2 class="text-center">Our Services</h2>
    <div class="services-homepage-grid">
      {services.map((service) => (
        <a class="service-card reveal" href={`/services/${service.data.slug}`}>
          <h3>{service.data.name}</h3>
        </a>
      ))}
    </div>
  </div>
</section>
```

Expand this with the real markup, images, and copy from the snapshot — the shape above shows the data-binding pattern, not the finished component.

- [ ] **Step 4: Wire the sections in and import their stylesheets**

Add the three components to `src/pages/index.astro` after `<Collage />`, and append their `@import` lines to `src/styles/global.css`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run verify`
Expected: PASS — 5 new section tests.

- [ ] **Step 6: Compare against the live site**

Screenshot at 1440 / 768 / 375 and compare these three sections against the live page. Fix differences before committing.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add homepage practice info, doctors, and services sections"
```

---

### Task 15: Homepage — appointment CTA and testimonial slider

**Files:**
- Create: `src/components/home/AppointmentCta.astro`, `src/components/ui/Slider.astro`
- Create: `src/scripts/slider.ts`
- Create: `src/styles/components/appointment-cta.css`, `src/styles/components/slider.css`
- Modify: `src/pages/index.astro`, `src/styles/global.css`
- Test: `tests/unit/slider.test.ts`, `tests/build/home-testimonials.test.ts`

**Interfaces:**
- Consumes: `site` (Task 3), `initReveal` (Task 13).
- Produces:
  - `initSlider(doc?: Document): void` from `src/scripts/slider.ts` — for each `[data-slider]`, wires `[data-slider-prev]` / `[data-slider-next]` to scroll `[data-slider-track]` by one slide width, and keeps `aria-current` on the active dot.
  - `Slider.astro` with props `{ id: string }` and a `<slot />` for slides.

- [ ] **Step 1: Write the failing slider test**

Create `tests/unit/slider.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initSlider } from '../../src/scripts/slider';

beforeEach(() => {
  document.body.innerHTML = `
    <div data-slider>
      <div data-slider-track>
        <div class="slide">1</div><div class="slide">2</div><div class="slide">3</div>
      </div>
      <button data-slider-prev>prev</button>
      <button data-slider-next>next</button>
    </div>`;
  const track = document.querySelector('[data-slider-track]') as HTMLElement;
  Object.defineProperty(track, 'clientWidth', { value: 300, configurable: true });
  track.scrollBy = vi.fn();
  initSlider(document);
});

const track = () => document.querySelector('[data-slider-track]') as HTMLElement;

describe('initSlider', () => {
  it('scrolls forward by one slide width on next', () => {
    (document.querySelector('[data-slider-next]') as HTMLElement).click();
    expect(track().scrollBy).toHaveBeenCalledWith({ left: 300, behavior: 'smooth' });
  });

  it('scrolls backward on prev', () => {
    (document.querySelector('[data-slider-prev]') as HTMLElement).click();
    expect(track().scrollBy).toHaveBeenCalledWith({ left: -300, behavior: 'smooth' });
  });

  it('does not throw when there is no slider on the page', () => {
    document.body.innerHTML = '';
    expect(() => initSlider(document)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `../../src/scripts/slider`.

- [ ] **Step 3: Write `src/scripts/slider.ts`**

```ts
/** Scroll-snap slider controls, replacing Webflow's w-slider runtime. */
export function initSlider(doc: Document = document): void {
  for (const root of doc.querySelectorAll<HTMLElement>('[data-slider]')) {
    if (root.dataset.sliderBound) continue;
    root.dataset.sliderBound = 'true';

    const track = root.querySelector<HTMLElement>('[data-slider-track]');
    if (!track) continue;

    const step = (direction: 1 | -1) =>
      track.scrollBy({ left: direction * track.clientWidth, behavior: 'smooth' });

    root.querySelector<HTMLElement>('[data-slider-next]')?.addEventListener('click', () => step(1));
    root.querySelector<HTMLElement>('[data-slider-prev]')?.addEventListener('click', () => step(-1));
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test`
Expected: PASS, 3 tests.

- [ ] **Step 5: Write `src/styles/components/slider.css`**

```css
.slider { position: relative; }
.slider-track {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}
.slider-track::-webkit-scrollbar { display: none; }
.slider-track > * { flex: 0 0 100%; scroll-snap-align: start; }

.slider-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 100%;
  background-color: var(--white);
  box-shadow: 0 2px 8px var(--shadow);
  color: var(--main-dark);
}
.slider-arrow.prev { left: -1.25rem; }
.slider-arrow.next { right: -1.25rem; }

@media screen and (max-width: 767px) {
  .slider-arrow.prev { left: .25rem; }
  .slider-arrow.next { right: .25rem; }
}
```

- [ ] **Step 6: Write `src/components/ui/Slider.astro`**

```astro
---
interface Props { id: string }
const { id } = Astro.props;
---
<div class="slider" data-slider id={id}>
  <div class="slider-track" data-slider-track>
    <slot />
  </div>
  <button type="button" class="slider-arrow prev" data-slider-prev aria-label="Previous slide">‹</button>
  <button type="button" class="slider-arrow next" data-slider-next aria-label="Next slide">›</button>
</div>
```

- [ ] **Step 7: Write the failing build test**

Create `tests/build/home-testimonials.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

let doc: Document;
beforeAll(() => {
  doc = parseHTML(readFileSync('dist/index.html', 'utf8')).document as unknown as Document;
});

describe('appointment CTA and testimonials', () => {
  it('renders the appointment CTA section', () => {
    expect(doc.querySelector('.book-appointment')).not.toBeNull();
  });

  it('links the CTA to the appointment request page', () => {
    expect(doc.querySelector('.book-appointment a[href="/appointment-request"]')).not.toBeNull();
  });

  it('renders the testimonial slider with labelled controls', () => {
    const slider = doc.querySelector('.testimonial-container [data-slider]');
    expect(slider).not.toBeNull();
    expect(slider!.querySelector('[data-slider-prev]')!.getAttribute('aria-label')).toBeTruthy();
    expect(slider!.querySelector('[data-slider-next]')!.getAttribute('aria-label')).toBeTruthy();
  });

  it('renders at least two testimonial slides', () => {
    const track = doc.querySelector('.testimonial-container [data-slider-track]');
    expect(track!.children.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 8: Run it to verify it fails**

Run: `npm run test:build`
Expected: FAIL — `.book-appointment` is null.

- [ ] **Step 9: Build both sections from the snapshot**

Port `.filled-section.overlay-image > .container.book-appointment` and
`.testimonial-container` from `tools/snapshots/home.html`, following the Task 13 Step 7 rules.
Replace the Webflow `.w-slider` markup with `<Slider id="testimonials">` and one child element
per testimonial. Copy the testimonial text verbatim from the snapshot — do not invent reviews.

- [ ] **Step 10: Wire in and initialize**

Add both components to `src/pages/index.astro`, append their stylesheet imports to
`src/styles/global.css`, and add to the page script block:

```ts
import { initSlider } from '../scripts/slider';
initSlider();
```

- [ ] **Step 11: Run the tests to verify they pass**

Run: `npm run verify`
Expected: PASS — 3 slider unit tests plus 4 build tests.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: add appointment CTA and testimonial slider"
```

---

### Task 16: Milestone verification and hardening

**Files:**
- Create: `tests/build/a11y-structure.test.ts`
- Modify: `README.md`
- Test: the whole suite

**Interfaces:**
- Consumes: everything.
- Produces: a green `npm run verify` and a documented setup.

- [ ] **Step 1: Write the structural accessibility test**

Create `tests/build/a11y-structure.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

let doc: Document;
beforeAll(() => {
  doc = parseHTML(readFileSync('dist/index.html', 'utf8')).document as unknown as Document;
});

describe('page structure', () => {
  it('has exactly one main landmark', () => {
    expect(doc.querySelectorAll('main')).toHaveLength(1);
  });

  it('has exactly one h1', () => {
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
  });

  it('gives every image an alt attribute', () => {
    const missing = [...doc.querySelectorAll('img')]
      .filter((img) => !img.hasAttribute('alt'))
      .map((img) => img.getAttribute('src'));
    expect(missing).toEqual([]);
  });

  it('gives every link an accessible name', () => {
    const unnamed = [...doc.querySelectorAll('a')].filter(
      (a) =>
        !a.textContent!.trim() &&
        !a.getAttribute('aria-label') &&
        !a.querySelector('img[alt]:not([alt=""])'),
    );
    expect(unnamed).toHaveLength(0);
  });

  it('ships no jQuery and no webflow.js', () => {
    const html = readFileSync('dist/index.html', 'utf8');
    expect(html).not.toContain('jquery');
    expect(html).not.toContain('webflow.js');
  });

  it('opens external links safely', () => {
    for (const a of doc.querySelectorAll('a[target="_blank"]')) {
      expect(a.getAttribute('rel') ?? '').toContain('noopener');
    }
  });
});
```

- [ ] **Step 2: Run it and fix every failure**

Run: `npm run test:build`
Expected: initially FAIL on any missing alt text, unnamed link, or unsafe external link. Fix the components — do not weaken the test.

- [ ] **Step 3: Run the full suite**

Run: `npm run verify`
Expected: PASS, every test green, build completes with no errors or warnings.

- [ ] **Step 4: Visual comparison at all three breakpoints**

Run `npm run preview`. For each width — 1440, 768, 375 — screenshot `http://localhost:4321/` and `https://www.veterinaryimgroup.com/` and compare top to bottom. Confirm specifically:

- Header is transparent over the hero, and turns solid with the color logo after scrolling.
- CallBar is hidden at 1440 and visible pinned to the bottom at 768 and 375, with 5 evenly sized cells.
- Footer content is not obscured by the CallBar on mobile.
- Dropdowns open on click and close on Escape.
- The How'd We Do modal opens from both the nav and the CallBar, and advances through its steps.

Record any deviation you choose not to fix as a note in the commit message.

- [ ] **Step 5: Check the console on the built site**

With `npm run preview` running, load the homepage and confirm the browser console has no errors. The Google Reviews `fetch` may log a network failure if the upstream endpoint is unavailable — that is expected and must not throw.

- [ ] **Step 6: Write `README.md`**

```markdown
# VIMG — Astro Replica

Static Astro rebuild of [veterinaryimgroup.com](https://www.veterinaryimgroup.com),
originally built in Webflow (site `6952729d2807a37cc07c2e29`).

The upstream Webflow site is **read-only**. No script here writes to it.

## Setup

    npm install
    npm run dev

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run build` | Static build to `dist/` |
| `npm run preview` | Serve the built site |
| `npm test` | Unit tests |
| `npm run test:build` | Build, then assert on the output |
| `npm run verify` | Both suites |

## Regenerating source data

    node tools/capture.mjs home https://www.veterinaryimgroup.com/
    WEBFLOW_TOKEN=<token> node scripts/export-webflow-content.mjs
    node scripts/mirror-assets.mjs

## Documentation

- Design: `docs/superpowers/specs/2026-08-10-vimg-astro-rebuild-design.md`
- Plan: `docs/superpowers/plans/2026-08-10-vimg-milestone-1.md`
```

- [ ] **Step 7: Commit and push**

```bash
git add -A
git commit -m "test: add structural accessibility checks and document setup"
git push origin main
```

---

## Milestone complete when

- `npm run verify` passes with every test green.
- The homepage matches the live site at 1440 / 768 / 375.
- No jQuery and no `webflow.js` appear in `dist/`.
- Work is pushed to `git@github.com:armandovetmark/website-replica.git`.

## Deferred to later milestones

The remaining 16 standalone published pages; the 10 CMS route templates
(`services/[slug]`, `blog/[slug]`, `doctors/[slug]`, …); site search via Pagefind;
the form submission endpoint; redirects, `sitemap.xml`, and `robots.txt`.
