# AGENTS.md

## Repository Type
Static HTML/CSS/JS portfolio site. **No build system, tests, or linting.** Edit files directly. Deployed on GitHub Pages.

## Dual JS Architecture (easy to miss)
- **Homepage** (`index.html`) loads **`home.js`** (tag system, featured carousel, sidebar)
- **Project instance pages** (`<slug>.html`) load **`project-instance-loader.js`** — NOT `home.js`. `shared.js` (CDN base, `toCdnUrl`, `loadVersionTag`, taxonomy path) loads before both entry scripts.
- `template-content.html` is a shared **fragment source**, not a shipped page: the loader `fetch()`es it + `DOMParser.parseFromString()` and injects only its `<header>/<overlay>/<nav>/<main>` into each project page (see the banner comment at the top of `template-content.html`). Its `<head>` is for local preview only — each project page carries its own `<head>`.
- (Historical note: `home.js` once hydrated `template-content.html` directly and the loader set `data-project-template-autohydrate="false"` (plus `data-project-template-slug`/`-folder`) to guard it. That hydration code never ran in production and was removed in iteration 10; the three vestigial dataset setters — now reader-less — were removed from the loader in iteration 26. The two static attributes still present on `<main>` in `template-content.html` are inert markup that nothing reads.)

## Entry Points
- **Homepage**: `index.html` → `home.js` (tag system, featured recommendations, gallery from `data/taxonomy.json`)
- **Project Instance Pages**: `<slug>.html` → `project-instance-loader.js` → fetches `template-content.html` at runtime → populates from `Resources/Project Instances/config/<slug>.json`
- **Template**: `template-content.html` (shared markup, loaded via `fetch` + `DOMParser` — must be same-origin)

## Data Sources
- **`data/taxonomy.json`**: tags + project index. Read by both `home.js` (homepage gallery) and `project-instance-loader.js` (tag labels, related projects)
- **`Resources/Project Instances/config/<slug>.json`**: per-project content (title, kicker, description, tools, images, `projectDetails.blocks`). **Filename must match the slug exactly** — loader resolves path by convention (`Resources/Project Instances/config/<slug>.json`)

## Adding a New Project Instance (3 files to touch)
1. Add entry to `data/taxonomy.json` `projects` array (`slug`, `url`, `title`, `image`, `tagIds`)
2. Create `<slug>.html` shell with `data-project-slug="<slug>"` and `<div data-project-instance-root></div>` (copy `raiden-vs-gekko.html` as template)
3. Create `Resources/Project Instances/config/<slug>.json` — filename must match the slug exactly (copy `division2-tools.json` as template)

## Featured Recommendations
The homepage featured carousel is driven by the `FEATURED_PROJECT_SLUGS` constant in `home.js` (currently `farcry6-procedural-generation`, `division2-tools`). For each slug, `buildFeaturedPages()` reads the **same** per-project config the project page uses (`Resources/Project Instances/config/<slug>.json`) and builds entries from `images.cover` (main image), `images.thumb_01..04` (thumbnails), and `images.full_01..04` (high-res shown on hover, falling back to the thumb). To feature a project:
1. Ensure its `Resources/Project Instances/config/<slug>.json` has `images.cover` + `images.thumb_01` (optionally `thumb_02..04`, `full_01..04`).
2. Add the slug to `FEATURED_PROJECT_SLUGS` in `home.js`.

Note: the `Resources/Featured Recommendations/pages/fr-<slug>/` folders are image-asset sources (some project configs point `cover`/`thumb_01..04` at files inside them) — they are NOT a separate data path. The carousel reads the project config, not these folders, and image extensions are declared explicitly in the config (no runtime probing).

## Project Config JSON Schema
Required fields: `title`, `kicker`, `description`, `tools`, `languages`, `time`, `role`, `images` (object with `cover`, `thumb_01`..`thumb_04`)
Optional: `projectDetails.blocks` — array of `{type, text/src/url, alt/title}`. Block types: `h1`, `h2`, `h3`, `p`, `image`, `video`, `image-compare`
  - `image-compare` block requires: `before` (before image URL), `after` (after image URL), optional: `beforeAlt`, `afterAlt`
  - (The legacy `initiative`/`pipeline`/`result`/`placeholderImage`/`placeholderVideo` shape was removed — all shipped configs use `blocks`. The loader renders `blocks` only.)

## Styling
Single file: `style.css`. Design tokens as CSS custom properties in `:root` (lines 1-18). Mobile breakpoint: `980px`.

## Local Development
Serve from repo root with any static server (e.g., `npx serve` or VS Code Live Server). No special env or config needed.

## Design Docs (reference only)
- `PROJECT_INSTANCE_PAGE_BEST_PRACTICES.md` — project page conventions
- `FEATURED_RECOMMENDATIONS_PLAN.md` — recommendation section spec
- `TAG_SYSTEM_PLAN.md` — tag taxonomy design
