---
name: featured-recommendation-page
description: Create or update Recommendation pages for this portfolio repo using the required folder structure, file naming convention, metadata schema, and validation-friendly authoring rules.
---

# Recommendation Page Authoring

Use this skill when a request asks to add, update, or validate Recommendation page content in this repository.

## Scope
- Content root: `Resources/Featured Recommendations/pages/`
- Template source: `Resources/Featured Recommendations/pages/fr-template-page/`
- Conventions reference: `FEATURED_RECOMMENDATIONS_PLAN.md`
- UI naming: use one JS variable for section naming (`Recommendation`) and apply it everywhere in UI labels/aria where this section appears.

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


## Interaction expectations for this repo
When implementing or updating the homepage Recommendation section:
- Keep left/right navigation controls stretched vertically to the full section height on desktop layouts.
- Mobile layout must place left/right buttons on the same row above the page indicator.
- Include a bottom page indicator made of dots; highlight the active page dot.
- Sidebar must keep `Recommendation` as the top navigation item for this section anchor.
- Main image frame and all 4 thumbnail frames must be fixed to 16:9.
- Images must fill frames with cover behavior (no stretching).
- Thumbnail hover/focus should preview in the main image.
- Thumbnail click should navigate to the current page target URL.
- Arrow button clicks must not trigger content link navigation.


## Image loading priority rule
When more than one matching format exists for a role (`main` or `thumb_01..04`), load in this order:
1. `png`
2. `jpg`
3. `svg`
