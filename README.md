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
| `npm test` | Unit tests (`tests/unit`) |
| `npm run test:build` | Build, then assert on the output (`tests/build`) |
| `npm run verify` | Both suites |

Port 4321 is Astro's default and may already be in use by another local
project. In that case run `npm run preview -- --port 4399` (or `dev -- --port
<n>`) and use that port instead — `.claude/launch.json` is already configured
for 4399.

## Project structure

- `src/pages/index.astro` — the homepage, assembling each section component
  inside `<main class="content">` and initializing the interactive scripts.
- `src/components/home/*.astro` — one component per homepage section (Hero,
  Collage, PracticeInfo, DoctorsSection, ServicesGrid, AppointmentCta,
  Testimonials).
- `src/components/layout/*.astro` — Header, Nav, Footer, CallBar.
- `src/components/modals/*.astro`, `src/components/widgets/*.astro` — the
  How'd We Do / Referring Clinics / Scheduled-popup modals and the
  third-party embeds (Google Reviews, UserWay, Vetstoria).
- `src/components/ui/Slider.astro` — a generic CSS scroll-snap slider,
  replacing Webflow's JS-driven `.w-slider` runtime (this project ships no
  jQuery and no `webflow.js`).
- `src/scripts/*.ts` — small, independently unit-tested modules
  (`initNav`, `initHeaderScroll`, `initModals`, `initReveal`, `initLightbox`,
  `initFooterAccordion`, `initSlider`, …) that each replace a piece of
  Webflow's IX2/interactions runtime. Every one exports an
  `init*(doc: Document = document)` function guarded by a `dataset` flag so
  calling it twice never double-binds event listeners.
- `src/styles/` — global CSS only (no Astro `<style scoped>` blocks). Values
  are ported verbatim from `tools/snapshots/home.css`, organized to match the
  live cascade: base rules first, then `max-width` media blocks narrowest to
  widest, matching the site's own declaration order (`extractRules` in
  `tools/extract-css.mjs` emits media rules before base rules — always
  reorder its output before pasting it in).
- `src/content/` — Astro content collections (Practice Information, Doctors,
  Staff, Services, Locations, Blog, …), exported read-only from the live
  Webflow CMS.
- `tools/` — `capture.mjs` (snapshot a live page's HTML/CSS),
  `extract-css.mjs` (pull just the rules for a set of class names out of a
  snapshot).
- `scripts/` — `export-webflow-content.mjs` (re-sync content collections from
  the Webflow API) and `mirror-assets.mjs` (re-download referenced images/
  icons into `src/assets` / `public/icons`).

## Conventions

- **Replicate the live site exactly.** Every CSS value should trace back to
  a captured snapshot in `tools/snapshots/`; nothing is invented. Where the
  live site itself has a real defect (e.g. the homepage ships no `<h1>`
  anywhere), that is replicated deliberately and called out in a comment
  rather than silently "fixed" — except where accessibility requires a fix
  (see `tests/build/a11y-structure.test.ts`), in which case the component is
  corrected and the deviation from live is documented.
- **Webflow class names are preserved**, including any typos, so the ported
  CSS can be diffed against the snapshot later.
- Interactive behavior that Webflow implemented via `webflow.js` / jQuery /
  IX2 interactions is reimplemented as small, dependency-free TypeScript
  modules under `src/scripts/`, each with its own unit tests.

## Regenerating source data

    node tools/capture.mjs home https://www.veterinaryimgroup.com/
    WEBFLOW_TOKEN=<token> node scripts/export-webflow-content.mjs
    node scripts/mirror-assets.mjs

## Verification

    npm run verify        # unit + build test suites
    npx tsc --noEmit       # type-check
    npm audit              # dependency vulnerabilities (expect 0)

For a visual/layout check (the build-test suite runs on `linkedom`, which has
no layout engine and cannot catch responsive/CSS regressions), build and
serve the site, then compare against the live site at 1280 / 1440 / 375px
using `getComputedStyle` / `getBoundingClientRect` in a real browser —
screenshots are not available in every environment this project has been
developed in.

    npm run build
    npm run preview -- --port 4399

## Documentation

- Design: `docs/superpowers/specs/2026-08-10-vimg-astro-rebuild-design.md`
- Plan: `docs/superpowers/plans/2026-08-10-vimg-milestone-1.md`
- Task-by-task briefs and reports:
  `.superpowers/sdd/2026-08-10-vimg-milestone-1/`

## Known gaps (Milestone 1)

- The homepage has no `<h1>` — a real SEO gap inherited from the live site,
  replicated deliberately rather than corrected (see
  `tests/build/a11y-structure.test.ts`).
- `.navbar-grid.hours` (practice hours in the header) is hidden
  unconditionally, matching the live site; confirmed intentional by the
  project owner (mobile-first practice, no walk-in address to advertise).
- The live header also carries an 800-484-5243 online-pharmacy phone line
  (`.nav-actions.with-online-pharmacy`) that is out of scope for this
  milestone and is not rendered.
- Deferred to later milestones: the remaining 16 standalone published pages;
  the 10 CMS route templates (`services/[slug]`, `blog/[slug]`,
  `doctors/[slug]`, …); site search via Pagefind; the form submission
  endpoint; redirects, `sitemap.xml`, and `robots.txt`.
