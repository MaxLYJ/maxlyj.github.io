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
