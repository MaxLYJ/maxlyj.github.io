# Project Tag System Plan

## Goal
Design and implement a reusable **tag system** so every project page can be categorized by one or more tags, and users can discover content through tag-based filtering and navigation.

## Product Direction (Expanded)

### Why tags matter
- Improve findability across a growing project archive.
- Let visitors quickly pivot by interests (e.g., `game-dev`, `boss-fight`, `analysis`, `cinematic`).
- Enable lightweight cross-linking without building deep category trees.

### Guiding principles
- **Multi-tag first:** each project can have zero to many tags.
- **Consistent vocabulary:** avoid near-duplicate labels.
- **Progressive enhancement:** filtering works with JavaScript; core pages still remain navigable without it.
- **Single source of truth:** tag metadata and project-tag assignments are defined in one maintainable data structure.

## 1) Information Architecture

### Core entities
- **Tag**
  - `id` (machine key, kebab-case, immutable)
  - `label` (human-readable)
  - `description` (optional, used in tooltips or tag directory)
  - `colorToken` (optional visual token)
- **Project**
  - existing project fields (title, URL, thumbnail, summary)
  - `tags: string[]` (array of tag ids)

### Tag taxonomy model
Use a flat taxonomy for now (not hierarchical), but design ids so a hierarchy can be added later.

Suggested initial groups:
- **Domain:** `game-dev`, `level-design`, `combat-design`, `systems-design`
- **Content format:** `breakdown`, `comparison`, `case-study`
- **Game/IP:** `metal-gear`, `far-cry`, `the-division`
- **Pipeline/tooling:** `unreal-engine`, `animation`, `ai-tools`

## 2) Data Model & Storage Strategy

### Option A (recommended now): JS in-repo manifest
Create a single manifest object in `script.js` (or split into a dedicated file later):
- `TAG_DEFINITIONS`
- `PROJECT_INDEX`

Benefits:
- No build tooling required.
- Fast to implement and maintain in static hosting.

### Option B (future): JSON manifest files
- `data/tags.json`
- `data/projects.json`

Benefits:
- Cleaner content editing workflows.
- Easier migration to CMS or generator.

### Canonical tag id rules
- Lowercase + kebab-case only.
- Regex: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- IDs are immutable once published to avoid broken deep links.

## 3) URL & Routing Design

### Filter state in URL
Use query parameters for shareable views:
- Single tag: `/?tag=game-dev`
- Multi-tag: `/?tags=game-dev,combat-design`

### Matching logic
- Default logic: **OR** (show projects matching any selected tag).
- Optional toggle: **AND** mode for advanced users.

### Dedicated tag pages (phase 2)
Create pages like:
- `/tags/game-dev.html`
- `/tags/combat-design.html`

Each page should:
- Explain the tag.
- List matching projects.
- Cross-link to related tags.

## 4) UI/UX Specification

### A. Project cards and page headers
- Display tags as pills/chips on each project card.
- On project detail pages (e.g., `farcry-6.html`), render tags near title/metadata.
- Tag pill click behavior:
  - on homepage: filters list
  - on detail page: navigates to homepage with query filter

### B. Homepage filter bar
Add a filter component near top of project listing:
- Search input (optional phase 2)
- Tag chip list (multi-select)
- Clear filters button
- Active filter summary (`3 tags selected · 8 projects shown`)

### C. Accessibility requirements
- Chips must be keyboard focusable and toggle with Enter/Space.
- Use `aria-pressed` for selected state.
- Maintain visible focus ring and high-contrast selected style.
- Do not rely on color alone; include checkmark/icon/state text.

### D. Empty-state design
When no projects match:
- Show message: `No projects match these tags.`
- Add CTA: `Clear all filters`.
- Optionally suggest nearest tags.

## 5) Implementation Plan (Phased)

### Phase 1 — Data + rendering
1. Define `TAG_DEFINITIONS` and assign tags to existing projects.
2. Render tag chips on homepage project cards.
3. Render tag chips on each project detail page.
4. Validate unknown/missing tag ids in console warnings.

### Phase 2 — Interactive filtering
1. Add multi-select tag filter bar to homepage.
2. Filter visible project cards client-side.
3. Add URL query sync (`history.replaceState`/`pushState`).
4. Add clear-all and active-count UI.

### Phase 3 — Tag landing pages and SEO
1. Add static tag pages for top tags.
2. Add internal links between related tags/projects.
3. Add metadata (`title`, `description`, canonical) for tag pages.

### Phase 4 — Quality and governance
1. Add content rule checks (duplicate labels, orphan tags, unknown tags).
2. Write tag governance notes in repository docs.
3. Establish naming convention and review checklist for new tags.

## 6) Validation Rules

### Hard validation
- Every referenced tag id must exist in `TAG_DEFINITIONS`.
- No duplicate tag ids.
- No duplicate project tag ids inside one project.

### Soft validation (warn)
- Tag assigned to only one project (possible over-segmentation).
- Similar labels (`ai` vs `ai-tools`) for editorial review.

## 7) Migration Plan for Existing Pages

### Current pages to annotate first
- `d-walker-vs-sahelanthropus.html`
- `raiden-vs-gekko.html`
- `farcry-6.html`
- `division-2.html`

Suggested rollout approach:
1. Start with 6–10 tags only.
2. Tag all current projects.
3. Run visual QA on desktop/mobile.
4. Expand taxonomy only after usage feedback.

## 8) Success Metrics

Track post-launch signals:
- Tag filter engagement rate.
- Average projects viewed per session.
- Click-through rate from tag pages to project pages.
- Top selected tags and zero-result frequency.

## 9) Risks & Mitigations

- **Tag sprawl:** enforce governance and approval checklist.
- **Inconsistent editorial usage:** provide examples and definitions per tag.
- **UI clutter with many tags:** cap visible chips and add "Show more".
- **Performance with growth:** precompute index map `tagId -> projectIds`.

## 10) Future Extensions

- Combine text search + tags.
- Tag relationship graph (`relatedTags`).
- Personalized recommendations based on selected tags.
- Analytics-driven auto-suggested tags during content authoring.

## 11) Concrete Next Actions

1. Add a lightweight manifest structure in `script.js`.
2. Add tag chip styles to `style.css`.
3. Inject tag sections into homepage cards and project page headers.
4. Implement homepage multi-select filtering with URL sync.
5. Add QA checklist and validation logs.
