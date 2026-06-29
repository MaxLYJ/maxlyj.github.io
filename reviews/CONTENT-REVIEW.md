# Content Review — maxlyj.github.io

**Reviewer:** Technical Director content pass
**Date:** 2026-06-30
**Scope:** All user-facing portfolio copy — homepage (`index.html`: About, Experience, Education, skill tags), the four project case studies (`Resources/Project Instances/config/*.json` → rendered title/kicker/description/detail blocks), the taxonomy filter labels (`data/taxonomy.json`), and SEO/social copy (`config.seo` → `<title>`, meta description, og/twitter, JSON-LD).

Companion to [`CODE-REVIEW.md`](./CODE-REVIEW.md). Where an item is also tracked there as a numbered backlog entry (e.g. P4 #15, P4 #16, P4 #17, P1 #24), this doc gives the content-specific detail and a recommended resolution; the CODE-REVIEW entry remains the single source of truth for status.

Reviewing as a senior hiring manager / art director reading a Senior Technical Artist portfolio: **does the copy prove the claimed expertise, is it consistent across surfaces, and is anything placeholder or half-finished shipping to a live page?**

---

## Methodology & evidence

- Every finding is grounded in a verifiable artifact (a config field value, a served string, a cross-source comparison). No claim about rendered output is made without either reading the config or grepping the served HTML.
- "Ships on a live page" = the value is read verbatim by `project-instance-loader.js` (`createDetailBlockElement`, `loadProjectInstanceTemplate`) or is static in `index.html`, and is reachable from `sitemap.xml`/nav.
- R2 object filenames are treated as **out of repo scope** (the bucket is not verifiable from here): a misspelled *filename* is documented for R2-side remediation, never "fixed" at the URL level, because the URL points at the literal bucket object — renaming it reintroduces a 404 (the same defect class as the iteration-8 `HighResGameImage02jpg` typo and the documented `CenimaticShader1.png`). Visible `alt` text and headings are in-repo and fair game.

---

## ✅ Fixed in this iteration (iteration 18)

Two content defects that ship on live pages, both unambiguous, both verified in config **and** the pre-rendered `<noscript>` (crawlers/no-JS) before and after:

### Correctness — d-walker missing-space typo
- **`d-walker-vs-sahelanthropus.json` → `projectDetails.blocks[1].text`** opened with `"Ten years ago(2015), I experienced…"` — a missing space before the parenthetical year. This is the project's only body paragraph and it is the emotional hook of the page, so the typo was the first thing a reader saw. Corrected to `"Ten years ago (2015), I experienced…"`. Confirmed gone from the config (0 → fixed form) and from the served `/d-walker-vs-sahelanthropus.html` `<noscript>` (the build-time pre-render inlines `block.text`, so the static and runtime copies now agree — re-ran `scripts/prerender-project-pages.js` to keep the single-sourcing intact).

### IA / copywriting — division-2 placeholder "Header" heading
- **`division2-tools.json`** carried an `h3` block whose `text` was literally `"Header"`, immediately above the banner image `Header_TheDivision2.jpg`. It was the **only** non-descriptive heading in the file — the other seven (`Procedural Level Generation`, `Level Streaming & Optimization`, `Boss Mechanics`, `Oil Truck Encounter`, `In-Game Shaders`, `LED Screen Setup`, `UI Programming & VFX`) each name a distinct work area and each is followed by a descriptive paragraph. `"Header"` had no paragraph and headed only a banner. It read as an unreplaced scaffold label (same family as the `Thumbnail 0N` placeholder SVGs on d-walker/raiden, P1 #24). **Removed the `h3` block**; the banner image now follows the intro `h2`+`p` directly — a conventional hero-image lead-in that needs no heading. Chose removal over inventing a descriptive title: I cannot see the image, and fabricating a heading name would be worse than the honest "a banner needs no H3." The banner image itself is preserved (verified present in config and served noscript). Confirmed `>Header<` gone from served `/division-2.html`.

### Validation (both fixes)
- All 4 project configs + `data/taxonomy.json` parse as valid JSON; `node --check` passes on `shared.js`/`home.js`/`project-instance-loader.js`/`scripts/prerender-project-pages.js`.
- `scripts/prerender-project-pages.js` re-run: only the two edited pages changed (farcry/raiden untouched); **idempotent** (byte-identical on a second run).
- Served locally (`python3 -m http.server 8318`): `/`, `/division-2.html`, `/d-walker-vs-sahelanthropus.html` → 200; served d-walker has `ago (2015)` (1) and `ago(2015)` (0); served division-2 has `>Header<` (0) and the banner image still present (≥1). Server confirmed stopped (`ss -ltn` → 0 listeners).

---

## ✅ Fixed in iteration 27 (typography consistency: date-range separators)

A fresh end-to-end read of `index.html`'s visible content surfaced a real, user-visible inconsistency: **date ranges used two different separators**. The en-dash (`–`, U+2013) is the typographic standard for a numeric/date range (Chicago Manual of Style §6.78) and was already the site's convention — **5 of 6** resume `<time>` ranges and the Far Cry 6 config `time` all used it — but **3 sites** shipped a bare ASCII hyphen (`-`, U+002D), making them inconsistent with both the convention and their immediate siblings:

| Site | Before | After | Why it's the outlier |
|---|---|---|---|
| `index.html` resume (Gearbox) | `Mar 2019 - Sep 2019` | `Mar 2019 – Sep 2019` | The other **5** resume ranges (`Nov 2024 – Present`, `Dec 2021 – Nov 2024`, `Sep 2020 – Dec 2021`, `Aug 2018 – May 2020`, `Sep 2014 – Jun 2018`) all use en-dash. The `<time datetime="2019-03">` attribute is unchanged — visible text only. |
| `division2-tools.json` `time` | `2022-2024` | `2022–2024` | The sibling AAA config (`farcry6`, `Sep 2020 – Dec 2021`) uses en-dash. Pure separator change — the author's chosen *precision* (year-only vs month-level) is preserved. |
| `division-2.html` `<noscript>` Period `<dd>` | `2022-2024` | `2022–2024` | Regenerated from the config by re-running `scripts/prerender-project-pages.js` (the iteration-12 single-sourcing rule: editing a config field that the pre-render inlines requires re-running it, or the static crawler/no-JS copy drifts from the runtime copy). |

This is **typography/consistency polish**, not authorial voice: the author didn't make a meaningful choice between hyphen and en-dash (one entry simply used the keyboard hyphen); normalizing to the en-dash matches the site's own established convention and the typographic standard. Distinct from the owner-gated content items (case-study depth, raiden's scaffold headings, P4 #15 naming policy) which this iteration does **not** touch.

**Net:** every shipped date range across the homepage resume and all four project pages now uses the en-dash. A repo-wide scan confirms **0** ASCII-hyphen date ranges remain (`20[0-9]{2}-20[0-9]{2}` and `Mon YYYY - Mon YYYY` patterns).

### Validation
- `division2-tools.json` parses as valid JSON (`time` now `'2022–2024'`); `index.html`/`division-2.html` are static HTML (no JS changed — `config.time` is rendered verbatim at `project-instance-loader.js:610` and `prerender-project-pages.js:396`, nothing parses the separator).
- Prerender re-run: only `division-2.html` changed among the 4 project pages (farcry/d-walker/raiden md5 unchanged); **idempotent** (byte-identical md5 on a second run).
- `git diff --stat` = exactly 3 files, 3 insertions / 3 deletions — one line each, each a single-character separator swap (verified `2d` → `e2 80 93`); all `datetime` attributes and surrounding markup untouched.

---

## ✅ Fixed in iteration 28 (content-rendering bug: Tools/Languages metadata mangled on the Far Cry 6 page)

Iteration 27's note prescribed continuing the visible-text read onto the project configs. Reading how each config **field renders** (not just the authored copy) surfaced a real, shipped, user-visible **content-rendering bug**: the Far Cry 6 page's Tools and Languages metadata rendered with **no space after any comma**.

**Root cause** — the four configs used two different shapes for `tools`/`languages`. farcry6 used **arrays** (`["Houdini","Substance Designer","Maya","Python","Custom Engine Tools"]`); the other three used comma-separated **strings**. The runtime loader (`project-instance-loader.js`) assigned the field straight to the cell (`metaValues[0].textContent = config.tools`), and assigning an **Array** to `textContent` coerces via `Array.toString()` = `join(",")` — so farcry6 rendered `Houdini,Substance Designer,Maya,Python,Custom Engine Tools` and `Python,VEX,HLSL` (jammed commas). The prerendered `<noscript>` (which has a `metaText()` helper) rendered correctly, so the static crawler view was right but the runtime view (every JS-enabled visitor) was mangled — and only on the Far Cry 6 page.

**Fix** (two parts — full detail in [`CODE-REVIEW.md`](./CODE-REVIEW.md#-fixed-in-iteration-28-content-rendering-bug-mangled-toolslanguages-metadata-on-the-far-cry-6-page)):
1. Normalized farcry6's `tools`/`languages` from arrays to the comma-separated **strings** the other three configs already use — fixing the live rendering **and** eliminating the schema outlier (4/4 configs now `str`/`str`).
2. Added a `formatMetaValue()` helper to the loader mirroring the prerender's `metaText()`, so the two renderers of the same config can no longer diverge on field shape.

This is a content-rendering defect (mangled visible text on the strongest project page), not authorial voice — distinct from the owner-gated content items (case-study depth, raiden's scaffold headings, P4 #15 naming) which stay documented, not edited.

---

## ✅ Fixed in iteration 29 (content/a11y: leftover placeholder `alt` on the raiden card + carousel hero)

Iteration 28's note prescribed continuing the visible-text read. A systematic **mechanical sweep** of every authored string across the four configs + `taxonomy.json` + `index.html` (double-spaces, space-before-punctuation, missing-space-after-sentence-end, smart-vs-straight-quote mixing) returned **clean** — the author writes carefully; there were no polish-level mechanical copy defects (this retires that angle as a negative finding). Pivoting to the one surface the mechanical sweep reads *structurally* — the `alt` values in `data/taxonomy.json` — surfaced a real shipped defect.

**The defect** — raiden's works-gallery card `alt` was `"Tooling and shader experiments"`, a generic leftover. It was (1) **inconsistent** (the other three cards name their project — `"Far Cry 6 project key art"`, `"Division 2 project artwork"`, `"D-Walker VS Sahelanthropus scene"`), and (2) **factually wrong** — the phrase describes Division 2's tools+shaders theme, not raiden's rigging-and-animation short. Same leftover-placeholder class as the iter-11 media / iter-18 `"Header"` heading.

**Blast radius** — the taxonomy `alt` is consumed in two runtime sites in `home.js`: the works-gallery card image alt (`createWorkCard`) *and* the featured-carousel main-image alt (`page.altMain`), so navigating the carousel to the raiden slide also spoke the stale alt. WCAG 1.1.1 (Non-text Content) applies — the alt must describe the image.

**Fix** — aligned raiden's `alt` to its d-walker sibling (`"Raiden VS Gekko scene"`, mirroring `"D-Walker VS Sahelanthropus scene"` — the two short-film projects share a type). A one-value JSON edit to a runtime-only field (the prerender doesn't consume taxonomy `projects[].alt`, so no re-run needed). Full detail + validation in [`CODE-REVIEW.md`](./CODE-REVIEW.md#-fixed-in-iteration-29-contenta11y-leftover-placeholder-alt-on-the-raiden-works-gallery-card--carousel-hero).

Like iter 27's separators and iter 28's metadata rendering, an `alt` that is both inconsistent *and* factually wrong is a mechanics/correctness defect — not authorial voice. It is distinct from raiden's genuinely owner-gated `Initiative`/`Research Pipeline`/`Research Result` *headings* (voice) and the case-study depth gap, which stay documented-not-edited.

---

## Per-project content assessment

### Far Cry 6 — Procedural Generation  *(gold standard)*
The strongest case study. Nine descriptive `h3` sections (`World Map Overview`, `Beach & Coastline`, `Cliff & Rock Formation`, `Volcanic Lava Lake`, `Cinematic Shading`, `Road & River Networks`, `Waterfall Integration`, `Performance`) each with a real (if compact) paragraph and supporting images/image-compares. The description and SEO copy are specific and verifiable (`biome scattering, road & river networks, material blending across Yara's terrain`). Real R2 thumbnails + HighRes fulls. **No content action needed** — this is the bar the other AAA page (Division 2) largely meets and the two short films fall short of.

### Division 2 — Tools Showcase  *(strong, minor cleanup)*
Eight descriptive `h3` work areas, each with a paragraph — good structure and good specificity (names Snowdrop capabilities, procedural level tooling, streaming optimization, boss/fire-area telegraphing, energy-weapon/water-gun/ammo shaders, LED-screen signage, UI/VFX). The intro paragraph is solid. **Now clean** after removing the `"Header"` placeholder. Residual items are naming-consistency (P4 #15 — worst offender, see below) and R2-side filename typos (`BossMachanic*.png`, `BossMachanic_Firearea*.png` — documented, not repo-fixable).

### d-walker VS Sahelanthropus  *(thinnest — content depth gap)*
- **Body copy is a single personal/anecdotal paragraph + one video.** After fixing the typo, the page reads well *as a tribute* but is the least technically substantive case study: there is no breakdown of rigging approach, Control Rig setup, Sequencer pipeline, or the "decade of technical-artist skills" the copy invokes. For a Senior TA portfolio, a viewer who clicks through expecting technique finds emotion instead. The single `h3 "Initiative"` heading is also generic. **Recommendation:** add 1–2 short technical blocks (rig-to-engine workflow specifics, what was hard, what the rig solves) — authored by the owner; do **not** fabricate. (Distinct from P1 #24, which is the missing *thumbnail* assets.)
- Placeholder thumbnails (P1 #24) and the local-path cover (vs R2) are tracked in CODE-REVIEW.

### raiden VS Gekko  *(thin — scaffold-voice headings)*
Three sections (`Initiative` / `Research Pipeline` / `Research Result`) each with one short, real sentence describing actual work (Blender rig → UE5, Sequencer + Control Rig iteration, impact-timing/silhouette result). The content is genuine and accurate, but:
- **The section headings are generic academic-scaffold labels**, not project-specific. Compare Far Cry 6's `Volcanic Lava Lake` / `Road & River Networks`. `Initiative`/`Research Pipeline`/`Research Result` read as a template the author didn't rename. **Recommendation:** rename to what each section actually does (e.g. `Rig Build`, `Engine Integration & Animation`, `Result`) — a copywriting polish, not a correctness fix; left to the owner.
- Same depth issue as d-walker: one sentence per stage is below the Far Cry 6 / Division 2 bar.
- Works-gallery card `alt` was a generic leftover (`"Tooling and shader experiments"`) — **fixed in iteration 29** → `"Raiden VS Gekko scene"`.
- Placeholder thumbnails (P1 #24) tracked in CODE-REVIEW.

---

## Cross-cutting content / IA issues

### P4 #15 — Inconsistent project naming across surfaces *(real; recommend a documented policy)*
The same project is labeled differently depending on where you look. The MGS projects are consistent; the two AAA projects are not, and Division 2 is the worst:

| Project | Taxonomy card title | Config `title` (page H1) | `seo.headline` (JSON-LD/title) | Resume heading |
|---|---|---|---|---|
| Far Cry 6 | `Far Cry 6` | `Far Cry 6 — Procedural Generation` | `Far Cry 6 — Procedural Generation` | `Far Cry 6` |
| Division 2 | `Division 2` | `Division 2 Tools Showcase` | `The Division 2 — Technical Art Tools` | `Tom Clancy's The Division 2` |
| D-Walker VS Sahelanthropus | `D-Walker VS Sahelanthropus` | `D-Walker VS Sahelanthropus` | `D-Walker VS Sahelanthropus` | — |
| Raiden VS Gekko | `Raiden VS Gekko` | `Raiden VS Gekko` | `Raiden VS Gekko` | — |

Division 2 appears in **four** different forms. This is not a bug (each surface has a legitimate reason to differ — the card is short, the page title is descriptive, the resume uses the full trademark), but the *lack of a stated rule* means future edits will drift further.

**Recommended policy (a documented decision, not a code change):**
1. **Card/taxonomy title** = the shortest recognizable name (`Far Cry 6`, `The Division 2`). Single source: `data/taxonomy.json` `title`.
2. **Page H1 / `config.title`** = short name + the specific contribution (`Far Cry 6 — Procedural Generation`). This is what the visitor landed to see.
3. **Resume heading** = the full official trademark (`Tom Clancy's The Division 2`) — resumes have different conventions than a portfolio card; this is fine and should stay.
4. **`seo.headline`** = match the page H1 (the JSON-LD `headline` should equal the `<h1>` the user sees; the prerender script already derives `<title>` from it).

Under that policy the only actual change to make would be aligning Division 2's taxonomy card title to `The Division 2` (the official form used everywhere else) and confirming `seo.headline` == page H1. **Deferred** — it's a naming/aesthetics call for the owner, and the Far Cry 6 card already uses the short form intentionally. Filed for a future owner-driven pass.

### P4 #16 — About skill-tags vs taxonomy tags *(not a defect — two different dimensions; verified no contradiction)*
The About `.skill-tag` chips (`index.html`) and the `data/taxonomy.json` tag system are **intentionally different lists**, not a duplication that drifted:
- **About skill-tags (14):** concrete tools/engines/languages — `C++, Python, HLSL, Houdini VEX, Unreal Engine, Snowdrop, Dunia, Anvil, Maya, Houdini, ZBrush, Substance, 3ds Max, Blender`. Purpose: "what I know" (a compact capabilities billboard).
- **Taxonomy tags (10):** competency areas used to *filter* the works gallery — `Shaders (HLSL), Procedural Generation, Pipeline & Tools, Houdini, Python, Optimization, Character Pipeline, Environment, Short Film, Template`. Purpose: "what each project demonstrates," tuned to Senior-TA job-desk frequency (per `tagSystemMeta`).

Exact overlaps: only **Python** and **Houdini**. Related-but-differently-labeled: `HLSL` (About) ↔ `Shaders (HLSL)` (taxonomy). **No skill-tag contradicts a taxonomy tag**, and merging them would *reduce* signal (you'd lose either the tool list or the filter dimension). **Verdict: no unification needed.** The only optional polish: if the owner wants the competency areas visible on the About section too, they could surface a second row of `taxonomy`-derived chips — but that's a design choice, not a content defect. **Closed (documented).**

### P4 #17 — No contact path *(blocked on owner input)*
A senior-TA portfolio with no email, contact CTA, or resume download is a real gap — but a repo-wide grep returns **zero** email addresses, so a contact path cannot be built without the owner's real address. Fabricating one is out of scope. **Blocked** until the owner supplies a contact address (and decides whether to expose it as plaintext, a mailto, or a form). Tracked in CODE-REVIEW P4 #17.

### R2 object-filename typos *(document-only — R2-side remediation)*
Same defect class as the iteration-8 `CenimaticShader1.png` finding: misspelled **filenames** on R2 objects, with correctly-spelled visible `alt`/heading text. Leaving the URLs intact (renaming would 404 the live image). Found this pass:
- `BossMachanic1.png`, `BossMachanic2.png` (Division 2, `Boss Mechanics` section) — should be `BossMechanic…`.
- `BossMachanic_Firearea1.png`, `BossMachanic_Firearea2.png` (Division 2) — `Firearea` should be `FireArea` / `Fire Area`.
- `CenimaticShader1.png` (Far Cry 6, `Cinematic Shading` section) — should be `Cinematic` (already documented iteration 8).

**Remediation:** re-upload each asset with the corrected filename to the same R2 path prefix and repoint the one config URL per asset. Not actionable from the repo alone.

---

## Content backlog (prioritized)

Carried/tracked in `CODE-REVIEW.md` unless noted:

1. **[Content depth — owner]** d-walker & raiden case studies are below the Far Cry 6 / Division 2 depth bar. Add authored technical blocks (no fabrication). *Highest content ROI.*
2. **[Copywriting — owner]** raiden's `Initiative`/`Research Pipeline`/`Research Result` headings → project-specific names. d-walker's lone `Initiative` likewise.
3. **[P4 #15 — policy]** Adopt + document the 4-surface naming policy above; align Division 2's taxonomy card title to `The Division 2`.
4. **[P1 #24 — assets]** d-walker & raiden placeholder thumbnail SVGs need real R2 assets (covers verified real).
5. **[R2-side]** Re-upload `BossMachanic*`, `BossMachanic_Firearea*`, `CenimaticShader1` with corrected filenames and repoint URLs.
6. **[P4 #17 — blocked]** Add a contact path once the owner supplies an address.

### Closed this pass
- d-walker `ago(2015)` typo → fixed.
- division-2 `"Header"` placeholder heading → removed.
- P4 #16 (skills vs taxonomy) → documented as non-defect (two dimensions, no contradiction).

### Closed in iteration 27
- Date-range separator inconsistency (3 sites: `index.html` resume, `division2-tools.json` `time`, `division-2.html` `<noscript>`) → normalized to en-dash, matching the site convention and the typographic standard. See the iteration-27 section above.

### Closed in iteration 28
- Far Cry 6 Tools/Languages metadata rendered with no space after commas (`Houdini,Substance Designer,…`, `Python,VEX,HLSL`) — farcry6's `tools`/`languages` were arrays while the other 3 configs use strings, and the runtime loader coerced the array via `Array.toString()`. Normalized farcry6 to strings (schema consistency) + added a `formatMetaValue()` helper to the loader mirroring the prerender's `metaText()` (runtime↔prerender parity). See the iteration-28 section above.

### Closed in iteration 29
- raiden works-gallery card + featured-carousel hero `alt` was a generic leftover (`"Tooling and shader experiments"`) that didn't describe the project — aligned to the d-walker sibling (`"Raiden VS Gekko scene"`). A runtime-only `taxonomy.json` field (no prerender re-run needed); also a WCAG 1.1.1 fix. See the iteration-29 section above.
- Mechanical sweep of all authored config/taxonomy/homepage text for double-spaces, space-before-punctuation, missing-space-after-sentence-end, and smart-vs-straight-quote mixing → **clean** (negative finding; retires that polish angle).

### Closed in iteration 31
- Dead "Template" filter chip in the works-gallery tag bar — `taxonomy.json` defined a `template` tag backed by **zero** projects (the scaffold/template-placeholder tag left over from the deleted `project-instance-test`), and `home.js` builds the tag bar from every tag definition, so it shipped as a real filter that yielded the empty state and inflated the collapsed "More +N" count by one. A relational read (does each tag definition back ≥1 project? → `USED ×9, ORPHAN ×1`) surfaced it. Removed the orphan tag definition; the nine remaining tags all back ≥1 project, and the prerender is byte-identical (no project referenced it). Same leftover-scaffold defect class as the iter-11 placeholder media / iter-18 "Header" heading. See the iteration-31 section in [`CODE-REVIEW.md`](./CODE-REVIEW.md#-fixed-in-iteration-31-contentia-dead-template-filter-chip-in-the-works-gallery-tag-bar--orphan-taxonomy-tag).

### Closed in iteration 32
- Skipped heading levels in the prerendered `<noscript>` on the d-walker & raiden pages (the content crawlers and no-JS / screen-reader users read). The build-time prerender omitted the runtime's wrapping `<h2>Project Details</h2>`, so the two short-film pages — whose detail blocks start at `h3` (`Initiative` / `Research Pipeline` / `Research Result`) — jumped `h1 → h3`. Fixed by mirroring the runtime template's `<h2>Project Details</h2>` in the prerender; all four `<noscript>` regions are now skip-free. Also removed farcry6's dead top-level `slug` field (the 4 configs now share an identical key set). See the iteration-32 section in [`CODE-REVIEW.md`](./CODE-REVIEW.md#-fixed-in-iteration-32-a11yseo-skipped-heading-levels-in-the-prerendered-noscript-on-the-d-walker--raiden-pages--a-runtimeprerender-structural-divergence).

### Closed in iteration 33
- The project-page date-range metadata field was labeled **"Time"** at runtime (`template-content.html`, every JS visitor) but **"Period"** in the prerendered `<noscript>` (crawlers / no-JS / AT) — the same `config.time` field read two different labels depending on the reader (a runtime↔prerender content-parity divergence, same class as iter 28/32). Aligned both renderers on the clearer **"Period"** via a one-line extraction-neutral template edit (`Time` → `Period`); the prerender already emitted "Period", so its re-run is byte-identical. A scaffold-default-vs-clearer-label refinement (the template label sat beside `Placeholder Text` values), fair to fix without owner input. Same pass also documented (not fixed) a *latent* sibling divergence — the image / image-compare block `alt` fallbacks differ between the two renderers (title-qualified at runtime, generic in the prerender), but no shipped block omits the explicit alt so they agree today. See the iteration-33 section in [`CODE-REVIEW.md`](./CODE-REVIEW.md#-fixed-in-iteration-33-contentia--seo-parity-the-project-page-metadata-date-range-field-was-labeled-differently-by-the-two-renderers--time-vs-period).
