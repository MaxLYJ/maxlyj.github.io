---
name: featured-recommendation-page
description: Create or update Featured & Recommendation pages for this portfolio repo using the required folder structure, file naming convention, metadata schema, and validation-friendly authoring rules.
---

# Featured & Recommendation Page Authoring

Use this skill when a request asks to add, update, or validate Featured & Recommendation page content in this repository.

## Scope
- Content root: `Resources/Featured Recommendations/pages/`
- Template source: `Resources/Featured Recommendations/pages/fr-template-page/`
- Conventions reference: `FEATURED_RECOMMENDATIONS_PLAN.md`

## Required folder naming
Create one folder per page using:
- `fr-<page-slug>/`
- Regex: `^fr-[a-z0-9-]+$`

Example:
- `fr-cyber-city/`

## Required file naming per page folder
Use the same `<page-slug>` (without `fr-`) in every file prefix:
- `fr_<page-slug>__main.<ext>`
- `fr_<page-slug>__thumb_01.<ext>`
- `fr_<page-slug>__thumb_02.<ext>`
- `fr_<page-slug>__thumb_03.<ext>`
- `fr_<page-slug>__thumb_04.<ext>`
- Optional: `fr_<page-slug>__meta.json`

Allowed extensions:
- `jpg`, `jpeg`, `png`, `webp`, `svg`

## Metadata schema (`fr_<page-slug>__meta.json`)
Recommended fields:
- `title`
- `description`
- `targetUrl`
- `altMain`
- `altThumbs` (array of 4)

## Authoring workflow
1. Copy `fr-template-page/` to a new `fr-<page-slug>/` folder.
2. Rename all template files to match `fr_<page-slug>__...` naming.
3. Replace placeholder images while preserving `main` and `thumb_01..04` roles.
4. Update metadata JSON with final copy and target URL.
5. Validate naming strictly before commit.

## Validation checklist
For each page folder, verify:
- Folder name matches `^fr-[a-z0-9-]+$`.
- Exactly one `__main` image exists.
- Exactly four thumbnail files exist with indexes `01..04`.
- File prefix slug matches folder slug.
- Image extensions are allowed.

## Warning behavior alignment
If authoring intentionally includes malformed names for testing warning UI:
- Keep images present so fallback rendering can still display content.
- Document expected warning text for each malformed file in PR notes.
