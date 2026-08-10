# VIMG Astro Rebuild — Design

**Date:** 2026-08-10
**Source site:** The Veterinary Internal Medicine Group (VIMG)
**Webflow site ID:** `6952729d2807a37cc07c2e29`
**Live URL:** https://www.veterinaryimgroup.com
**Target repo:** `git@github.com:armandovetmark/website-replica.git`

## 1. Goal

Rebuild the VIMG Webflow site as a static Astro site with hand-authored HTML and CSS,
reproducing the live site's appearance and behavior while removing Webflow's runtime.

**Hard constraint:** the Webflow site is read-only. No tool call may mutate it. Every
Webflow MCP action used in this project is a read action (`get_site`, `list_pages`,
`get_collection_list`, `list_collection_items`, `get_variable_collections`,
`get_variables`). Published HTML/CSS is fetched over plain HTTP from the public site.

## 2. Source of truth

The compiled, published CSS is authoritative for all visual decisions:

- `https://cdn.prod.website-files.com/6952729d2807a37cc07c2e29/css/vetimg.shared.51d75cc97.min.css` (30 KB)
- `https://cdn.prod.website-files.com/6952729d2807a37cc07c2e29/css/vetimg.<pageId>.<hash>.opt.min.css` (per page)

Structure comes from the published page HTML. Content comes from the Webflow Data API.

## 3. Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | **Hybrid CSS**: author our own stylesheet, keep Webflow class names | Markup lifts 1:1 from live pages so replication is fast and reviewable; drops unused shared CSS and Webflow's runtime. Compiled CSS remains verifiable ground truth. |
| D2 | **Export CMS content once** into Astro content collections | Repo is self-contained; builds need no API token and are reproducible. Re-runnable to re-sync. |
| D3 | **Mirror all assets**, optimize via `astro:assets` | No runtime coupling to Webflow's CDN; modern formats and srcset. |
| D4 | **Hand-written vanilla JS**, drop jQuery + `webflow.js` | Removes ~200 KB; keeps behavior debuggable; fits Astro's zero-JS-by-default model. |
| D5 | **Keep four integrations**: Google Reviews widget, GTM, Vetstoria, UserWay | Explicit user selection. |
| D6 | **Forms: markup + validation now, endpoint deferred** | Unblocks layout work; endpoint becomes a one-line config change. |
| D7 | **All CSS global**, files mirror the component tree | Webflow class names are inherently shared across pages; Astro's scoped styles would break them. |
| D8 | `output: 'static'`, no UI framework | Every page is static HTML; JS ships per-page only where a behavior needs it. |

## 4. Architecture

Astro 7.x, static output, no React/Vue/Svelte. Pages compose components; components carry
no client runtime except explicit `<script>` modules. TypeScript throughout.

**Version note (2026-08-10):** this design originally specified Astro 5.x. Astro 7.2.0 is the
current release, and the 5.x line carries unpatched high-severity advisories — XSS in
`define:vars`, in spread attribute names, and in slot names, plus `sharp`/libvips CVEs — whose
only remediation `npm audit` offers is a major-version bump. The project therefore targets
**Astro 7.2.0 or later**, and `npm audit` must report zero vulnerabilities. The APIs this design
depends on (Content Layer API, `astro:assets`, `output: 'static'`) have been stable since v5.

### Folder structure

```
vimg/
├─ astro.config.mjs
├─ package.json
├─ tsconfig.json
├─ src/
│  ├─ config/
│  │  └─ site.ts             # NAP, phone, GTM id, GMB place id, form action, nav model, callbar model
│  ├─ content.config.ts      # Zod schemas for exported collections
│  ├─ content/               # services/ doctors/ blog/ blog-categories/ staff/ locations/ dates/ …
│  ├─ styles/
│  │  ├─ tokens.css          # :root — Base collection variables
│  │  ├─ reset.css           # Webflow normalize equivalent
│  │  ├─ base.css            # typography, .container, .general-section, utilities
│  │  ├─ layout/             # header.css nav.css footer.css callbar.css
│  │  └─ components/         # one file per component, mirrors src/components/
│  ├─ layouts/
│  │  └─ BaseLayout.astro
│  ├─ components/
│  │  ├─ layout/   Header.astro Nav.astro NavDropdown.astro Footer.astro CallBar.astro
│  │  ├─ modals/   ReferringClinicsModal.astro ScheduledPopup.astro HowdWeDoWidget.astro
│  │  ├─ widgets/  GoogleReviews.astro VetstoriaButton.astro UserWay.astro GoogleTagManager.astro
│  │  └─ ui/       Slider.astro Lightbox.astro BackgroundVideo.astro Button.astro
│  ├─ scripts/     header-scroll.ts nav.ts modal.ts slider.ts lightbox.ts reveal.ts
│  ├─ pages/       index.astro, services/[slug].astro, blog/[slug].astro, …
│  └─ assets/      mirrored images consumed by astro:assets
├─ public/                   # favicons, SVG icons, video posters
├─ scripts/
│  ├─ export-webflow-content.mjs
│  └─ mirror-assets.mjs
└─ docs/superpowers/specs/
```

## 5. Design tokens

The Webflow variable collection **Base** (id `collection-6f9730ba-f7de-c628-3449-45efd96997d9`)
has one mode and 16 color variables. `tokens.css` reproduces the CSS names Webflow emits
verbatim, so rules ported from the compiled CSS work unchanged:

```css
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
  --secodary-dark: #3f3e42;   /* Webflow's spelling — preserved */
  --secondary-dark: #3f3e42;  /* corrected alias for new code */
  --main-soft-o50: #eff5ff80;
  --white-o85: #ffffffd9;
  --shadow: #0000001a;
  --overlay-color: #00000080;
  --main-o50: #447cdb80;
  --light-grey: #d1d1d1;
}
```

**Breakpoints** (matching Webflow): max-width `991px`, `767px`, `479px`; min-width `1280px`,
`1440px`, `1920px`. Declared as documented constants in `base.css`; note that CSS custom
properties cannot be used in media query conditions, so the literals appear in the queries.

**Typography:** Montserrat, full weight range, currently loaded via Google's WebFont loader.
Replaced with self-hosted `@font-face` + `font-display: swap` to remove a render-blocking
third-party request.

## 6. Layout components

### Header

Base CSS from source:

```css
.header  { z-index: 999; position: fixed; inset: 0 0 auto; }
.navbar  { background-color: #0000; padding-block: .5em; }
@media (max-width: 991px) { .header { flex-flow: column; justify-content: center; display: flex; } }
```

The transparent→solid transition on scroll exists **only** as a Webflow IX2 interaction —
there is no corresponding CSS class in the compiled output. We author it:

- A zero-height sentinel element at the top of `<main>`.
- `IntersectionObserver` toggles `.is-scrolled` on `.header` when the sentinel leaves view.
- `.header.is-scrolled .navbar` sets the solid background and shadow, with a CSS transition.
- No scroll event listener, so no layout thrash.

Also owns: logo, primary nav with dropdowns, mobile nav toggle, referring-clinics modal trigger.
Nav structure is data-driven from `site.ts`, not hardcoded markup.

### Footer

Reproduces the source DOM, which contains both a desktop grid (`.footer-grid-desktop`) and a
mobile grid (`.footer-grid-mobile`), plus `.footer-bottom-2`. The footer also **owns** CallBar,
the How'd We Do widget, and the Google reviews widget, matching the original structure.

The source contains a hidden legacy block (`.old-footer-new-template.hide`). It is dead markup
and is **not** reproduced.

### CallBar

```css
.callbar { background-color: var(--main-light); border-top: 2px #6b8c3b;
           padding: .625em .625em .375em; display: none; }
@media (max-width: 991px) {
  .callbar { z-index: 50; background-color: var(--cta); align-items: center;
             display: flex; position: fixed; inset: auto 0 0; }
}
.callbar-link, .callbar-link-2 { width: 20%; color: var(--white); text-decoration: none; }
.callbar-link-box  { flex-direction: column; align-items: center; margin-inline: auto; display: flex; }
.callbar-icon-image{ width: 1.3125em; height: 1.3125em; margin-bottom: .5em; line-height: 1; object-fit: contain; }
.callbar-text      { font-size: .75em; font-weight: 400; line-height: 1;
                     text-align: center; text-transform: uppercase; }
.callbar-phone     { background-color: var(--main); background-image: url(phone.svg);
                     background-position: 50%; background-repeat: no-repeat;
                     background-size: 32px 32px; width: 3.75em; height: 3.75em;
                     border-radius: 100%; margin-inline: auto; display: flex; }
```

**Visible at ≤991px only.** (The `max-width: 767px` block re-declares `display: flex`
redundantly; 991px is the real threshold.)

Five cells at 20% width each, driven by a config array in `site.ts`:

| # | Target | Icon | Label |
|---|--------|------|-------|
| 1 | `/clinic-schedule-locations` | `calendar2.svg` | Pop-up Clinics |
| 2 | `/meet-the-team` | `about.svg` | Our Team |
| 3 | `tel:+17866735903` | `phone.svg` (circular CTA) | — |
| 4 | `/general-information-request` | `map-pin.svg` | Contact Us |
| 5 | opens How'd We Do widget | `positive-review.png` | How'd We Do |

Cell 3 is the centered phone CTA. Cell 5 is a `div` in the source with no accessible role; in
the rebuild it becomes a real `<button>` with an accessible name.

## 7. Content layer

`scripts/export-webflow-content.mjs` reads all ten collections through the Webflow Data API
(read-only) and writes typed JSON/Markdown into `src/content/`:

| Collection | ID | Route |
|---|---|---|
| Services | `6952729d2807a37cc07c2ee6` | `/services/[slug]` |
| Services Categories | `6952729d2807a37cc07c2e54` | `/services-categories/[slug]` |
| Doctors | `6952729d2807a37cc07c2e95` | `/doctors/[slug]` |
| Staff Members | `6952729d2807a37cc07c2ede` | `/staff/[slug]` |
| Blogs | `6952729d2807a37cc07c2eb2` | `/blog/[slug]` |
| Blog Categories | `6952729d2807a37cc07c2ec9` | `/blog-categories/[slug]` |
| Locations | `69836ad140ba845d94864ae5` | `/locations/[slug]` |
| Dates | `69836ac7b9df763ecc149105` | `/dates-locations/[slug]` |
| Practice Information | `6952729d2807a37cc07c2e80` | site-wide singleton |
| Practice Social Links | `6952729d2807a37cc07c2e3a` | site-wide, footer |

`content.config.ts` defines a Zod schema per collection mirroring Webflow's field types.
Rich-text fields are stored as HTML and rendered with `set:html` after sanitization.
Practice Information and Practice Social Links are loaded once and passed through `BaseLayout`.

## 8. Asset pipeline

`scripts/mirror-assets.mjs` walks exported content plus captured page markup, downloads every
`cdn.prod.website-files.com` asset, deduplicates by content hash, and rewrites references.

- Layout/component images → `src/assets/`, rendered via `astro:assets` (AVIF/WebP + srcset).
- SVG icons, favicons, video posters, background video sources → `public/`.
- CMS images are downloaded next to their JSON and referenced by local path.

## 9. Interaction modules

Hand-written ES modules, no dependencies:

| Module | Responsibility |
|---|---|
| `header-scroll.ts` | Sentinel + `IntersectionObserver` → `.is-scrolled` |
| `nav.ts` | Mobile toggle, dropdowns, focus trap, Escape to close |
| `modal.ts` | Shared open/close controller: focus trap, scroll lock, Escape, backdrop click |
| `slider.ts` | Testimonial slider — CSS scroll-snap track with minimal JS controls |
| `lightbox.ts` | Image lightbox replacing `w-lightbox` |
| `reveal.ts` | `IntersectionObserver` adds `.is-visible`; CSS transitions replace decorative IX2 |

Decorative IX2 animations are re-expressed as CSS transitions and will be visually close but
not frame-identical to Webflow's generated interactions. This is an accepted tradeoff of D4.

### Modals

- **ReferringClinicsModal** — header-triggered.
- **ScheduledPopup** — date-windowed announcement. The source hardcodes UTC strings
  (`2025-09-18` → `2025-09-30`, already expired). Rebuilt to read its window from `site.ts`
  and render nothing at build time when the window has passed.
- **HowdWeDoWidget** — the most involved component. Multi-step review flow: prompt → Like/Dislike
  → positive routes to the Google write-review link, negative routes to private feedback
  (`/howd-we-do`). Includes three pug state images (neutral/happy/sad). State machine in JS,
  transitions in CSS.

## 10. Integrations

| Integration | Implementation |
|---|---|
| Google Tag Manager | `GTM-WJZMPJ92` — container script + `noscript` iframe; ID in `site.ts` |
| Google Reviews | `fetch('https://vetmarketing.googlewidget.com/api/reviews/{placeId}')` → sanitize → inject. Place ID `ChIJhw8-GA3X3ogRu7g-W6oUCQU` passed as a prop, not hardcoded. Fails silently to a hidden container, as the original does. |
| Vetstoria | `us.vetstoria.com/js/oabp-widget-floating-button.min.js`, deferred |
| UserWay | `cdn.userway.org/widget.js` with existing config (`position: '1'`, `size: 'small'`) |

The reviews endpoint returns raw HTML injected via `innerHTML`. The rebuild sanitizes the
response before insertion rather than trusting it verbatim.

## 11. Page inventory & replication workflow

The site has **39 pages**: 12 drafts (excluded), 10 CMS collection templates, and
**17 standalone published pages**:

| # | Page | Path |
|---|------|------|
| 1 | Home | `/` |
| 2 | Meet The Team | `/meet-the-team` |
| 3 | Services | `/services` |
| 4 | Blog | `/blog` |
| 5 | Resource Center | `/resource-center` |
| 6 | Clinic Schedule & Locations | `/clinic-schedule-locations` |
| 7 | Conferences | `/conferences` |
| 8 | Gallery | `/gallery` |
| 9 | Career Opportunity | `/career-opportunity` |
| 10 | Online Forms | `/online-forms` |
| 11 | Appointment Request | `/appointment-request` |
| 12 | General Information Request | `/general-information-request` |
| 13 | Telemedicine Consultations Appointment Request | `/telemedicine-consultations-appointment-request` |
| 14 | CT vs Ultrasound for Liver Enzymes | `/ct-vs-ultrasound-for-liver-enzymes` |
| 15 | How'd we do | `/howd-we-do` |
| 16 | Search Results | `/search` |
| 17 | 404 | `/404` |

Pages 16 and 17 are special: `/404` maps to Astro's `404.astro`, and `/search` requires a
client-side index (see §12, out of scope for this milestone).

For each page: fetch live HTML → extract section markup → map classes against already-ported
CSS → build/compose components → verify.

**Verification gate — no page is complete without:**

1. `npm run build` passing with zero errors and zero warnings.
2. Side-by-side screenshot comparison against the live URL at **1440 / 768 / 375** widths.
3. Console clean of errors on the built page.

## 12. Milestone 1 scope

**In scope:**

- Astro project scaffold, TypeScript config, npm scripts
- `tokens.css`, `reset.css`, `base.css`
- `BaseLayout.astro` including GTM, fonts, integration slots
- `Header` (with scroll state + nav + dropdowns), `Footer`, `CallBar`
- Homepage (`/`) fully replicated
- Supporting components the homepage needs: hero background video, services grid,
  doctors list, testimonial slider, appointment CTA section, the three modals, review widgets
- `site.ts` config, git repo pushed to the target remote

**Out of scope for this milestone** (later passes):

- The remaining 16 standalone published pages (see §11)
- The 10 CMS dynamic route templates (the export script runs in this milestone; the routes come later)
- Search — a static site needs a client-side index such as Pagefind; deferred by agreement
- Form submission endpoint (markup and validation are in scope; the endpoint is not)
- Redirects, sitemap, robots.txt, analytics verification

## 13. Known risks

| Risk | Mitigation |
|---|---|
| IX2 animations not frame-identical | Accepted under D4; screenshot comparison catches layout drift, not easing curves |
| Webflow CDN assets change or disappear mid-project | Mirror assets early (D3), before page work |
| Reviews API is third-party and undocumented | Sanitize response; degrade silently, matching current behavior |
| Per-page `.opt.css` files are page-scoped and overlap | Port into shared vs. page-specific CSS deliberately; watch for duplicate rules |
| Hidden/draft Webflow pages contain stale markup | Only the 27 non-draft pages are in scope (17 standalone + 10 CMS templates); the 12 drafts are ignored |

## 14. Next step

Invoke the `writing-plans` skill to turn this design into a step-by-step implementation plan.
