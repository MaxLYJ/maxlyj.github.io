# Image Storage Plan — Cloudflare R2

> Authoritative folder-structure plan for images on Cloudflare R2.
> Supersedes the folder-structure notes in `imageLoadingPlan.md` §4.
> The progressive **loading** strategy (blur-up, `_low` variants) in
> `imageLoadingPlan.md` still applies on top of this structure.

## 1. Goals

1. **Two clean tiers** — a single `shared/` tree for cross-page assets and a
   `projects/<slug>/` tree for per-project assets.
2. **One folder per project slug** — kill the legacy duplication where the same
   project's images live under `Wix/...`, `Featured Recommendations/pages/fr-<slug>`,
   and `Project Template/pages/pt-<slug>`.
3. **Human-readable names** — replace opaque Wix export hashes (`6275d4_*.jpg`)
   with semantic names (`cover.png`, `thumb_01.png`, …).
4. **Convention-derived paths** — code can build a URL from `(slug, role)` with no
   per-image config, while JSON keeps logical paths as source of truth.
5. **Compatible with the progressive-loading plan** — `_low` raster variants sit
   next to their full-res siblings; SVGs need none.

---

## 2. CDN base

```
CDN_BASE = https://pub-dc4e1f00955f4568a77da06925201843.r2.dev
```

Logical paths (those documented here and stored in JSON) are repo-style relative
paths. `toCdnUrl(logicalPath)` prepends `CDN_BASE` at runtime. JSON configs store
**logical paths only** — never full URLs.

---

## 3. Folder structure

```
R2 bucket root
├── shared/                          ← CROSS-PAGE / reused assets
│   ├── brand/
│   │   ├── logo.png                 (+ logo_low.png)  header + sidebar + footer logo
│   │   └── portrait.jpg             (+ portrait_low.jpg)  About section + OG/Twitter + JSON-LD
│   └── ui/                          (reserved for shared UI / decor; empty for now)
│
└── projects/                        ← PROJECT-SPECIFIC assets (one folder per slug)
    ├── farcry6-procedural-generation/
    │   ├── cover.png                (+ _low)  gallery card + project hero
    │   ├── thumb_01.png             (+ _low)  project-page thumbnails
    │   ├── thumb_02.png … thumb_04.png (+ _low)
    │   ├── featured/
    │   │   ├── main.png             (+ _low)  homepage featured-recommendation main image
    │   │   └── thumb_01.png … thumb_04.png (+ _low)
    │   └── blocks/                  inline images for projectDetails.blocks (image, image-compare)
    ├── division2-tools/ …
    ├── d-walker-vs-sahelanthropus/ …
    ├── raiden-vs-gekko/ …
    └── project-instance-test/ …
```

**Slug = `data/taxonomy.json` `projects[].slug`** (single source of truth).

### Roles within a project
| Role | Logical path | Used by |
|---|---|---|
| cover | `projects/<slug>/cover.png` | homepage gallery card, project hero |
| thumbnail | `projects/<slug>/thumb_0N.png` | project-instance page thumbnail strip |
| featured main | `projects/<slug>/featured/main.png` | homepage featured-recommendation carousel |
| featured thumb | `projects/<slug>/featured/thumb_0N.png` | carousel thumbnail strip |
| block image | `projects/<slug>/blocks/<name>.png` | `projectDetails.blocks[].src` |

### Shared assets
| Asset | Logical path | Used by |
|---|---|---|
| logo | `shared/brand/logo.png` | header, sidebar, footer |
| portrait | `shared/brand/portrait.jpg` | About section, OG, Twitter card, JSON-LD `image` |

---

## 4. Naming rules

- **Raster** (png/jpg/webp): ship two files — `<name>.<ext>` (full) + `<name>_low.<ext>` (placeholder). The `_low` is inserted **before the extension**.
- **SVG**: no `_low` (already tiny).
- **Slugs**: lowercase, hyphenated, exactly matching `data/taxonomy.json`.
- **No spaces in keys** — replaces the current `HOME _ Yujia Max Liu_files` style.

---

## 5. Migration mapping (old → new)

| Old location | New location |
|---|---|
| `(bucket root)/YujiaMaxLiu_Web.jpg` | `shared/brand/portrait.jpg` |
| `Resources/Wix/.../Liu_WP_Logo_4x.png` | `shared/brand/logo.png` |
| `Resources/Wix/.../6275d4_...farcry....jpg` | `projects/farcry6-procedural-generation/cover.png` |
| `Resources/Wix/.../6275d4_...division2....jpg` | `projects/division2-tools/cover.png` |
| `Resources/Wix/.../6275d4_...d-walker....jpg` | `projects/d-walker-vs-sahelanthropus/cover.png` |
| `Resources/Featured Recommendations/pages/fr-<slug>/*` | `projects/<slug>/featured/*` |
| `Resources/Project Template/pages/pt-template-project/*` | `projects/project-instance-test/*` |

---

## 6. Code integration (after assets are uploaded)

| Where | Change |
|---|---|
| `home.js`, `project-instance-loader.js` | Define `CDN_BASE`; add `toCdnUrl(path)` (skip if path already starts with `http`). |
| `data/taxonomy.json` `projects[].image` | Set to `projects/<slug>/cover.png` (logical path). Code prepends `CDN_BASE`. |
| `index.html` portrait/logo/OG/JSON-LD | Point logo → `${CDN_BASE}/shared/brand/logo.png`, portrait/OG/JSON-LD → `${CDN_BASE}/shared/brand/portrait.jpg`. |
| Featured-recommendation path builder (`home.js` `buildImagePath`) | Build `projects/<slug>/featured/<role>.<ext>` instead of `Resources/Featured Recommendations/pages/fr-<slug>/...`. |
| `project-instance-loader.js` | Read project JSON image paths (already logical); prepend `CDN_BASE` at `img.src` assignment. |

No code change is required to **create** the folders — folders are just key prefixes
that exist once an object is written under them.

---

## 7. Provisioning the folders in R2 — DONE

All 17 folders below are materialized in the **`portfolio-images`** bucket as
zero-byte `.keep` objects (created & verified 2026-06-26).

```
shared/brand/.keep                                 ┐  2 shared folders
shared/ui/.keep                                    ┘
projects/<slug>/.keep          ┐
projects/<slug>/featured/.keep  ├ × 5 slugs  = 15 project folders
projects/<slug>/blocks/.keep    ┘
```
Slugs: `farcry6-procedural-generation`, `division2-tools`,
`d-walker-vs-sahelanthropus`, `raiden-vs-gekko`, `project-instance-test`.

### How to re-run (new slugs / re-provision)

`scripts/provision-r2-folders.sh` writes the `.keep` objects via wrangler.
Wrangler authenticates with **`npx wrangler login`** (OAuth) — **not** R2 S3
tokens. Two gotchas learned during provisioning:

1. **`--remote` is mandatory** on `wrangler r2 object put|get`. Without it,
   wrangler writes to the *local* simulator (`~/.wrangler/state`), not the real
   bucket. The script passes `--remote`.
2. **`wrangler r2 object list` does not exist.** Verify a folder with
   `wrangler r2 object get <bucket>/<key> --remote --pipe >/dev/null && echo ok`,
   or fetch the public CDN URL.

```bash
npx wrangler login                                   # one-time, opens browser
R2_BUCKET=portfolio-images bash scripts/provision-r2-folders.sh
```

### Auth notes
- **Recommended:** `npx wrangler login` (OAuth). Works in any interactive terminal.
  In a non-interactive (no-TTY) shell, wrap wrangler in a pseudo-TTY:
  `script -qec "npx wrangler ..." /dev/null`.
- **API token (alternative):** must be a *general* token from
  **Account → API Tokens** (new format `cfat_…` or legacy `v1.0-…`), permission
  **Account → Workers R2 Storage → Edit**. Do **not** use R2 → Manage R2 API
  Tokens — those produce S3-style Access Key/Secret for `aws`/`rclone`, not a
  Bearer that wrangler accepts.
