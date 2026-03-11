# Project Instance Page Best Practices

This guide defines the **recommended workflow** for creating a new project instance page from the shared template while keeping navigation and future updates maintainable.

---

## Objectives

1. Create a new instance page with placeholder tags and images.
2. Keep instance discovery in Selected Works/project index; do not add sidebar links by default.
3. Ensure template improvements can propagate to all instance pages.

---

## Core Principle: Separate Structure from Content

To make global updates easy, keep:

- **Shared layout/structure** in one template file.
- **Per-project content** in lightweight data objects (JSON or JS object).

### Recommended file roles

- `template-content.html` → canonical template structure and placeholder tokens.
- `script.js` → loader that injects project data into the template.
- `index.html` (or shared nav source) → menu links generated from a single project list/manifest.

---

## 1) Create a New Instance with Placeholders

### A. Add placeholder tokens to the template (once)

Use explicit placeholders in `template-content.html`, for example:

- `{{PROJECT_TITLE}}`
- `{{PROJECT_SUBTITLE}}`
- `{{PROJECT_TAGS}}`
- `{{PROJECT_COVER_IMAGE}}`
- `{{PROJECT_THUMB_01}}` ... `{{PROJECT_THUMB_04}}`

Use semantic attributes so script replacement is robust:

- `data-slot="project-title"`
- `data-slot="project-cover"`
- `data-slot="project-tags"`

### B. Create an instance content entry

Create one manifest entry per instance (in `script.js` or separate JSON):

```js
{
  slug: "new-project-slug",
  title: "[Project Name]",
  subtitle: "[Short Description]",
  tags: ["Tag A", "Tag B", "Tag C"],
  images: {
    cover: "Resources/Project Template/pages/pt-template-project/pt_template-project__cover.svg",
    thumb01: "Resources/Project Template/pages/pt-template-project/pt_template-project__thumb_01.svg",
    thumb02: "Resources/Project Template/pages/pt-template-project/pt_template-project__thumb_02.svg",
    thumb03: "Resources/Project Template/pages/pt-template-project/pt_template-project__thumb_03.svg",
    thumb04: "Resources/Project Template/pages/pt-template-project/pt_template-project__thumb_04.svg"
  }
}
```

> For a fresh instance draft, leave text values as placeholders (`"[Project Name]"`) and point images to template placeholder assets until final artwork is ready.

### C. Keep one HTML shell per instance (minimal)

Each instance file (example: `my-project.html`) should be minimal and only provide:

- the project slug (`data-project-slug="new-project-slug"`)
- template mount target
- shared JS/CSS includes

This avoids duplicating layout markup across many HTML files.

---

## 2) Ensure Instance Discovery Appears Automatically

### Sidebar rule (required for this repo)

- Do **not** add project instance pages to the homepage sidebar by default.
- Add a sidebar link only when explicitly requested by the user/stakeholder for that specific instance.
- Treat sidebar items as stable/global navigation, not per-instance listing.

Do **not** hard-code menu buttons individually in multiple files.

Instead:

1. Maintain a single `PROJECT_INDEX` list with fields:
   - `slug`
   - `title`
   - `url`
   - `showInMainMenu` (boolean)
   - optional `menuOrder`
2. Render menu links from this list in `script.js`.
3. Add one new project object with `showInMainMenu: true`.

### Menu best practices

- Use deterministic ordering (`menuOrder` then title).
- Add active-state styling for the current page.
- Use accessible labels and keyboard-focusable links.

---

## 3) Make Template Updates Propagate to All Instances

Use one of these patterns (Pattern A is preferred for this repo):

### Pattern A (preferred): Runtime template injection

- Keep all shared markup in `template-content.html`.
- Load it once in each instance page using JS (`fetch` + `innerHTML`/DOM parsing).
- Replace `data-slot` fields with the instance content from manifest.

**Benefit:** Any structural edit to `template-content.html` updates all instance pages instantly.

### Pattern B: Build-time generation

- Use a script to compile many instance HTML files from one template.
- Commit generated files.

**Benefit:** No runtime fetch.
**Tradeoff:** Must re-run generator every time template changes.

### Hard rule for propagation

- Instance pages must **not** duplicate template markup.
- If an instance copies full template HTML manually, propagation is broken.

---

## Recommended Step-by-Step Workflow

1. Add/update placeholders in `template-content.html`.
2. Add project data in the shared manifest.
3. Add a minimal instance shell HTML with only slug + mount point.
4. Confirm the Selected Works/project discovery entry is generated from the shared index list.
5. Verify rendering fallback when tags/images are still placeholders.
6. Validate that editing `template-content.html` changes all instance pages.

---

## Validation Checklist

- [ ] New instance loads with placeholder title/tags/images when content is incomplete.
- [ ] New instance appears in Selected Works/project index without manual duplicated edits.
- [ ] Editing one template file updates all project instances.
- [ ] Instance pages contain only page-level metadata + slug, not duplicated full layout.
- [ ] Missing image paths fall back to template placeholder assets.

---

## Naming & Content Hygiene

- Slug format: lowercase kebab-case (`new-project-slug`).
- Keep image naming consistent by role (`cover`, `thumb_01..04`).
- Keep alt text meaningful even for placeholders (`"Placeholder cover image"`).
- Keep tags normalized and reusable to support future filtering.

---

## Anti-Patterns to Avoid

- Copy-pasting full template HTML into every new page.
- Manually adding menu links in more than one place.
- Mixing content and layout logic in many files.
- Hard-coding image paths directly in template structure.

---

Following this guide ensures fast content creation now, and low-cost maintenance when template design evolves.
