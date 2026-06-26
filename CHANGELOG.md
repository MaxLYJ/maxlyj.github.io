# Changelog

All notable changes to this portfolio site are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## 2026-06-26

### Added
- **Priority skill tag system** (homepage). Skill tags derived from a survey of
  current Senior Technical Artist job descriptions, ranked into P1 (core demand),
  P2 (strong), P3 (specialized) tiers. Tags are sorted and visually weighted by
  tier, and the bar is **collapsible** — one line by default, expand to reveal
  all tags, select a tag to snap back to one line.
  - "Skill filter aligned to Senior Technical Artist roles · Reviewed Jun 26, 2026"
    reminder banner at the top of the sticky tag panel.
- **Cloudflare R2 image pipeline.**
  - `IMAGE_STORAGE_PLAN.md` — two-tier structure: `shared/brand/` for cross-page
    assets and `projects/<slug>/` (with `featured/`, `blocks/`) for per-project
    assets. Includes migration mapping and naming/`_low` conventions.
  - `scripts/provision-r2-folders.sh` — creates zero-byte `.keep` folder
    placeholders in the `portfolio-images` R2 bucket. Project slugs are read
    dynamically from `data/taxonomy.json` (no hardcoding).
  - `CDN_BASE` constant + `toCdnUrl()` helper in `home.js` and
    `project-instance-loader.js`; logical paths in JSON resolve to the CDN at
    runtime, absolute URLs pass through.
- **Farcry 6 project page content.** 19 pictures uploaded to R2 under
  `projects/farcry6-procedural-generation/blocks/` and wired into the page config
  as 8 themed sections (World Overview, Beach, Cliff, Lava Lake, Material
  Transition, Road, Waterfall, Performance) with placeholder copy.
  `LavaTransitionBefore` / `LavaTransitionAfter` are wired as an `image-compare`
  block (drag slider).
- `CHANGELOG.md` (this file).
- Newcomer docs: `PROJECT_INSTANCE_PAGE_BEST_PRACTICES.md` now includes a
  required **Step 3 — Provision image folders on Cloudflare R2**, so adding a
  project page always runs the provisioning script.

### Changed
- `data/taxonomy.json` `projects[].image` now stores logical R2 paths
  (`projects/<slug>/cover.*`) instead of local `Resources/...` paths; homepage
  gallery cards now load from the Cloudflare CDN.
- Tag taxonomy replaced project-name tags with JD-derived skill tags
  (`shaders`, `procedural-generation`, `pipeline-tools`, `houdini`, `python`,
  `optimization`, `character`, `environment`, `short-film`, `template`), each
  with a `priority`.
- Far Cry 6 project config: removed copy-paste placeholder content (previously
  referenced Division 2 / Snowdrop) and replaced with real themed content.

### Operational notes
- R2 provisioning auth: use `npx wrangler login` (OAuth). In non-interactive
  shells, wrap wrangler in a pseudo-TTY (`script -qec "..." /dev/null`).
  `wrangler r2 object put|get` requires `--remote` (otherwise it writes to the
  local simulator). SVGs must be uploaded with `--content-type=image/svg+xml`.
- `.wrangler/` local state is now gitignored.
