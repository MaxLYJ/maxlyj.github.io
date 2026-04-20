# Project Instance Pages — Newcomer Guide (Step-by-Step)

This guide is for people who are new to this repo and want to add a **new project page** safely.

Goal: you should be able to create a new page without breaking tags, related works, gallery images, or template behavior.

---

## Quick Mental Model (What lives where)

When you create a project page, you usually touch **three places**:

1. `Resources/Project Instances/config/<your-slug>.json`  
   Your page content (title, text, images, details, metadata).
2. `data/taxonomy.json`  
   Global tag system + project discovery entry (used for tags and related works).
3. `project-instance-loader.js`  
   Registers the slug-to-config file mapping so the page can load your JSON.

The HTML page itself should stay lightweight and only point to the slug.

---

## Before You Start

### Naming rules

- Use lowercase kebab-case for slug: `my-new-project`
- Keep slug consistent everywhere:
  - HTML page body `data-project-slug`
  - taxonomy `projects[].slug`
  - loader mapping key

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

## Step 2) Register your config in `project-instance-loader.js`

In `PROJECT_INSTANCE_CONFIG_PATHS`, add your slug and config path:

```js
"my-new-project": "Resources/Project Instances/config/my-new-project.json"
```

If you skip this step, loader cannot fetch your JSON and the page will not hydrate.

---

## Step 3) Add taxonomy tags and project entry

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
   Usually missing slug mapping in `PROJECT_INSTANCE_CONFIG_PATHS`.

2. **Tags not showing**  
   `tagIds` not found in taxonomy `tags`, typo in tag id, or slug/url mismatch causing project lookup fail.

3. **Related works empty unexpectedly**  
   Your project shares no tag IDs with others; add meaningful shared tags.

4. **Gallery broken / blank**  
   Missing one of `thumb_01..thumb_04` keys or bad image path.

5. **Details section empty**  
   `projectDetails.blocks` malformed or unsupported block `type`.

---

## Suggested workflow for each new project

1. Copy an existing config JSON as baseline.
2. Rename slug and file paths.
3. Register slug in loader mapping.
4. Add taxonomy project entry and needed tags.
5. Verify HTML shell slug value.
6. Test locally and fix missing assets/typos.
7. Replace placeholders with final copy + media.

This order prevents most integration issues and is the fastest path for newcomers.
