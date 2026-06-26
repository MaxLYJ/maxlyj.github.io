# Project Instance Pages — Newcomer Guide (Step-by-Step)

This guide is for people who are new to this repo and want to add a **new project page** safely.

Goal: you should be able to create a new page without breaking tags, related works, gallery images, or template behavior.

---

## Quick Mental Model (What lives where)

When you create a project page, you edit **two files**, write **one HTML shell**, and run **one script**:

1. `Resources/Project Instances/config/<your-slug>.json`  
   Your page content (title, text, images, details, metadata).
2. `data/taxonomy.json`  
   Global tag system + project discovery entry (used for tags and related works).
3. **Cloudflare R2 image folders** — created by running `scripts/provision-r2-folders.sh` once your slug is in `taxonomy.json`. See **Step 3** below. *(Required — the project's images have nowhere to live without it.)*

The loader discovers configs automatically by naming convention — no registration step needed.

The HTML page itself should stay lightweight and only point to the slug.

---

## Before You Start

### Naming rules

- Use lowercase kebab-case for slug: `my-new-project`
- Keep slug consistent everywhere:
  - Config JSON filename must be `<your-slug>.json`
  - HTML page body `data-project-slug`
  - taxonomy `projects[].slug`
- The loader resolves config paths by convention: `Resources/Project Instances/config/<slug>.json`

### Important behavior from loader

`project-instance-loader.js` currently expects:

- Image keys exactly named: `cover`, `thumb_01`, `thumb_02`, `thumb_03`, `thumb_04`
- Metadata text fields: `tools`, `languages`, `time`, `role`
- Top text fields: `kicker`, `title`, `description`
- Detail content in `projectDetails`
- Tags pulled from `data/taxonomy.json` (not free-typed in config)

If these keys are missing, sections can render empty.

---

## Step 1) Create your project config JSON

Create a new file:

`Resources/Project Instances/config/<your-slug>.json`

Use this starter template:

```json
{
  "kicker": "[Project category or short label]",
  "title": "[Project Name]",
  "description": "[One short paragraph about the project.]",
  "tools": "[Tool A, Tool B]",
  "languages": "[Language / Engine / Tech]",
  "time": "[Date or duration]",
  "role": "[Your role]",
  "images": {
    "cover": "Resources/Project Template/pages/pt-template-project/pt_template-project__cover.svg",
    "thumb_01": "Resources/Project Template/pages/pt-template-project/pt_template-project__thumb_01.svg",
    "thumb_02": "Resources/Project Template/pages/pt-template-project/pt_template-project__thumb_02.svg",
    "thumb_03": "Resources/Project Template/pages/pt-template-project/pt_template-project__thumb_03.svg",
    "thumb_04": "Resources/Project Template/pages/pt-template-project/pt_template-project__thumb_04.svg"
  },
  "projectDetails": {
    "blocks": [
      { "type": "h3", "text": "Initiative" },
      { "type": "p", "text": "[What problem were you solving?]" },
      { "type": "h3", "text": "Process" },
      { "type": "p", "text": "[How did you approach it?]" },
      {
        "type": "image",
        "src": "Resources/Project Template/pages/pt-template-project/pt_template-project__thumb_01.svg",
        "alt": "[Optional detail image alt text]"
      },
      {
        "type": "video",
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "title": "[Optional video title]"
      }
    ]
  }
}
```

### `projectDetails` options

Preferred format is `projectDetails.blocks` with ordered blocks.

Allowed block types in current loader:

- `h1`, `h2`, `h3`, `p` (text blocks)
- `image` (needs `src`, optional `alt`)
- `video` (needs `url`, optional `title`; YouTube links are auto-converted when possible)

Legacy fallback fields still supported (for old pages):

- `projectDetails.initiative`
- `projectDetails.pipeline`
- `projectDetails.result`
- `projectDetails.placeholderImage`
- `projectDetails.placeholderVideo`

For new pages, use `blocks`.

---

## Step 2) Add taxonomy tags and project entry

> No loader registration step is needed. The config is discovered by slug convention.

Open `data/taxonomy.json`.

### A) Tags section rules (`tags`)

Each tag must be:

```json
{ "id": "stable-id", "label": "Human Label" }
```

Rules:

- `id` should be lowercase kebab-case (`short-film`, `tech-art`, `procedural-gen`)
- `id` must be unique
- `label` is what UI displays
- Do not use `All` as a label (loader intentionally filters out `All`)
- Reuse existing tags when possible (avoid near-duplicate tags)

### B) Projects section rules (`projects`)

Add one project object:

```json
{
  "slug": "my-new-project",
  "url": "my-new-project.html",
  "title": "My New Project",
  "image": "Resources/.../cover.png",
  "alt": "My New Project key art",
  "tagIds": ["short-film", "tool"]
}
```

Rules:

- `slug` must match your config mapping + page slug
- `url` must match the actual HTML filename
- `tagIds` must reference existing `tags[].id`
- `tagIds` drives:
  - visible tag chips on your page
  - related works matching (by overlapping tags)

If `tagIds` is wrong or missing, tags/related works will be poor or empty.

---

## Step 3) Provision image folders on Cloudflare R2 (required)

Every project's images live in the **`portfolio-images`** Cloudflare R2 bucket, under `projects/<your-slug>/`. A new project needs its own folder tree there — created by running **one script**.

> **Prerequisite:** your slug must already be in `data/taxonomy.json` (Step 2). The script reads `projects[].slug` from there, so it never needs editing when you add a project.

```bash
# one-time auth (interactive, opens a browser):
npx wrangler login

# create this project's folders (plus any others in taxonomy.json):
R2_BUCKET=portfolio-images bash scripts/provision-r2-folders.sh
```

This creates the project's folder tree as zero-byte `.keep` placeholders:

- `projects/<your-slug>/` — cover + thumbnails
- `projects/<your-slug>/featured/` — featured-recommendation imagery
- `projects/<your-slug>/blocks/` — inline detail/block images

Then upload your images into those folders following the naming conventions in [`IMAGE_STORAGE_PLAN.md`](./IMAGE_STORAGE_PLAN.md) (`cover.png`, `thumb_01..04`, `featured/main.png`, raster `_low` variants, etc.). That doc also covers the `CDN_BASE` runtime wiring and the full migration mapping.

> **Don't skip this step.** Without these folders, uploaded images have no destination and the project's images will not resolve on the CDN. The script is the only supported way to create them — never hand-create folders in the R2 dashboard, or the structure will drift from `taxonomy.json`.

---

## Step 4) Create (or verify) the instance HTML shell

Your instance HTML should be minimal and include:

- `data-project-slug="my-new-project"` on `<body>`
- mount root: `[data-project-instance-root]`
- shared CSS/JS includes (including `project-instance-loader.js`)

Avoid copying full template markup into each page. The loader fetches `template-content.html` and injects shared sections automatically.

---

## Step 5) Fill content safely (newbie tips)

- Start with placeholders first; publish structure, then refine copy/media.
- Keep alt text descriptive for accessibility.
- Prefer concise metadata fields (`tools`, `languages`, `time`, `role`) because they render in fixed slots.
- Use valid YouTube URLs for video blocks.
- Keep image dimensions/aspect reasonably consistent across thumbs for better gallery UX.

---

## Step 6) Validate your page

Checklist:

- [ ] R2 image folders created for this slug (`scripts/provision-r2-folders.sh`) and images uploaded
- [ ] Page title, kicker, description render correctly
- [ ] Cover image + 4 thumbnails load
- [ ] Thumbnail click/swipe changes main image
- [ ] Tags show correctly from taxonomy labels
- [ ] Related Works shows relevant projects (or empty state)
- [ ] Metadata grid shows tools/languages/time/role in right order
- [ ] Project details blocks render in intended sequence
- [ ] Mobile layout stacks overview sections correctly

---

## Common Mistakes (and fixes)

1. **Nothing renders**  
   Usually a slug mismatch — config filename must exactly match the slug in `data-project-slug` and `taxonomy.json`.

2. **Tags not showing**  
   `tagIds` not found in taxonomy `tags`, typo in tag id, or slug/url mismatch causing project lookup fail.

3. **Related works empty unexpectedly**  
   Your project shares no tag IDs with others; add meaningful shared tags.

4. **Gallery broken / blank**  
   Missing one of `thumb_01..thumb_04` keys or bad image path.

5. **Details section empty**  
   `projectDetails.blocks` malformed or unsupported block `type`.
6. **Images don't load / nowhere to upload them**  
   You skipped Step 3. After adding the slug to `taxonomy.json`, run `R2_BUCKET=portfolio-images bash scripts/provision-r2-folders.sh`. Without it the project's `projects/<slug>/` folders don't exist in R2, so there is no destination for its images.

---

## Suggested workflow for each new project

1. Copy an existing config JSON as baseline.
2. Rename file to `<your-slug>.json` and update slug paths inside.
3. Add taxonomy project entry and needed tags.
4. Run `R2_BUCKET=portfolio-images bash scripts/provision-r2-folders.sh` to create the project's R2 image folders (Step 3 above) — the script reads the slug you just added.
5. Upload images into those R2 folders per [`IMAGE_STORAGE_PLAN.md`](./IMAGE_STORAGE_PLAN.md).
6. Verify HTML shell slug value.
7. Test locally and fix missing assets/typos.
8. Replace placeholders with final copy + media.

This order prevents most integration issues and is the fastest path for newcomers.
