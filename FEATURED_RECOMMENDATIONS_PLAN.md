# Recommendation Section Implementation Plan

## Goal
Add a new **Recommendation** section near the top of the homepage that:
- supports multiple pages with the same layout,
- can be navigated using left/right side buttons,
- swaps the large preview image when users hover small thumbnails,
- and links to content pages when clicked.

This plan follows the visual references in:
- `Resources/Featured Recommendations/Featured_Recommendations_Normal.png`
- `Resources/Featured Recommendations/Featured_Recommendations_Hover.png`

## 1) Information Architecture

### Section placement
- Insert the new section in `index.html` directly below the hero area so it is visible near the top of the page.
- Add a dedicated anchor id, e.g. `id="featured-recommendations"`, for future sidebar navigation.

### Data model (driven by folder + filename conventions)
- Section display name must be sourced from a single JS variable (e.g. `RECOMMENDATION_SECTION_NAME`) and reused for sidebar label, section aria-label, and indicator aria-label.
Use a JavaScript loader that builds section pages from the file system naming pattern (or from a pre-generated manifest that follows the same pattern):
- `pageSlug` (derived from folder name)
- `title`
- `description`
- `targetUrl`
- `images` (resolved from strict naming rules below)
  - one `main` image
  - four `thumb` images in fixed order `01` → `04`
- If multiple files match a role, load by extension priority: `png` → `jpg` → `svg`.

This makes layout reusable while keeping authoring consistent.

## 2) Required Folder Structure & Naming Convention

### Root folder for this feature
- `Resources/Featured Recommendations/pages/`

### Per-page folder naming rule
- Format: `fr-<page-slug>/`
- Regex rule: `^fr-[a-z0-9-]+$`
- Example:
  - `fr-cyber-city/`
  - `fr-stylized-forest/`

### Required files inside each page folder
Each page **must** include exactly 5 images using this exact role-based pattern:
- `fr_<page-slug>__main.<ext>`
- `fr_<page-slug>__thumb_01.<ext>`
- `fr_<page-slug>__thumb_02.<ext>`
- `fr_<page-slug>__thumb_03.<ext>`
- `fr_<page-slug>__thumb_04.<ext>`

Where:
- `<page-slug>` must match the folder slug without `fr-` prefix.
- `<ext>` allowed: `jpg`, `jpeg`, `png`, `webp`, `svg`.

Example:
- Folder: `Resources/Featured Recommendations/pages/fr-cyber-city/`
- Files:
  - `fr_cyber-city__main.jpg`
  - `fr_cyber-city__thumb_01.jpg`
  - `fr_cyber-city__thumb_02.jpg`
  - `fr_cyber-city__thumb_03.jpg`
  - `fr_cyber-city__thumb_04.jpg`

### Optional metadata file (recommended)
Inside each page folder, allow:
- `fr_<page-slug>__meta.json`

Suggested fields:
- `title`
- `description`
- `targetUrl`
- `altMain`
- `altThumbs` (array of 4)

If metadata file is missing, use fallback title/description from slug.

## 3) UI Layout Specification

### Container structure
- Outer clickable container (`<a>` wrapping the content) to satisfy "click anywhere goes to another page".
- Left and right nav buttons fixed at side edges of the section and stretched from top to bottom of the card area.
- Content area split into two columns:
  - **Left:** one large image preview.
  - **Right:** 2x2 grid of four small images.
- Description block under the four small images.
- Page indicator row at the bottom using dots; active page dot is highlighted.
- Main image frame and all 4 thumbnail frames use a fixed 16:9 ratio.
- Images must fill the frame using cover behavior (no stretching).

### Visual parity with references
- Match spacing, border radius, and card treatment with existing site style.
- Ensure hover state visually mirrors `Featured_Recommendations_Hover` behavior.
- Keep section responsive:
  - Desktop: two-column layout (big image + four thumbnails)
  - Mobile/tablet: stack columns, keep arrows accessible, preserve interactions.
  - Mobile rule: left/right buttons are on the same row, above the page indicator.
  - Sidebar rule: `Recommendation` link appears at the top of the sidebar navigation list.

## 4) Interaction Behavior

### A. Previous/Next paging buttons
- Left button: previous page item.
- Right button: next page item.
- Loop behavior:
  - Previous on first item goes to last.
  - Next on last item goes to first.

### B. Thumbnail hover interaction
- On hover over one of the four small images:
  - replace large image source with hovered thumbnail source.
  - show active/hover styling on the thumbnail.
- On hover out:
  - reset large image to page `main` image (recommended, deterministic behavior).

### C. Click-through interaction
- Clicking anywhere in the main section content opens current page `targetUrl`.
- Navigation arrows should not trigger link navigation:
  - use `event.stopPropagation()` / `preventDefault()` as needed.
- Clicking a thumbnail should both preview and navigate to the current page `targetUrl`.

### D. Accessibility requirements
- Buttons must be keyboard focusable and have aria labels.
- Thumbnail controls should support keyboard focus and Enter/Space action (mirror hover with focus).
- Provide meaningful `alt` text for all images.

## 5) Validation & Warning Behavior (when naming is incorrect)

If folder/file naming is invalid, the section should still render images when possible, **and show a visible warning state**.

### Validation checks
For each page folder:
1. Folder name matches `^fr-[a-z0-9-]+$`.
2. Exactly one `__main` image exists.
3. Exactly four `__thumb_01..04` images exist with no missing index.
4. File prefix slug matches folder slug.
5. File extension is allowed.

### Fallback rendering rules
- If `main` is missing:
  - use `thumb_01` as large image fallback.
- If any thumbnail index is missing:
  - keep existing valid images in order; missing slots use a placeholder tile.
- If names are wrong but image files are still discoverable:
  - display the discovered image in nearest slot and mark page as warning.

### Warning UI requirements
- Add a warning badge in the section, e.g. `⚠ Naming issue detected`.
- Add a warning outline/background color (amber/orange) around the section card.
- Show text with specific problems, e.g.:
  - `Expected: fr_cyber-city__thumb_03.jpg`
  - `Found: fr_cyber-city__thumb3.jpg`
- Keep warning non-blocking: user can still browse pages.

### Developer console logging
- Log structured warnings with page slug and issue list for quick debugging.

## 6) Files to Modify

### `index.html`
- Add Recommendation section markup.
- Add warning banner/message container.
- Add references to content pages.

### `style.css`
- Add styles for:
  - section wrapper,
  - side navigation buttons,
  - left large image,
  - right 2x2 thumbnail grid,
  - description text block,
  - hover/active/focus states,
  - warning visual state,
  - responsive behavior.

### `script.js`
- Add folder/naming based dataset loader (or manifest reader with same validation).
- Implement:
  - current page state,
  - prev/next handlers,
  - hover/focus-to-preview behavior,
  - click safety between buttons vs section link,
  - naming validation + warning rendering + fallback logic.

### New page: `template-content.html`
- Create a content page following the existing main-page visual language:
  - same top bar + sidebar pattern,
  - main content container and footer style,
  - placeholder title, hero image, body sections.
- This file acts as the reusable destination page template for recommendation links.

## 7) Implementation Steps (Execution Order)
1. Create `Resources/Featured Recommendations/pages/` and add 2–3 page folders following naming rules.
2. Add required 5-image sets (`main`, `thumb_01..04`) per page.
3. Build static HTML section skeleton + warning area in `index.html`.
4. Implement CSS layout, hover states, warning states, and responsive rules in `style.css`.
5. Implement JS loader + validator + fallback + interactions in `script.js`.
6. Create `template-content.html` using current page format.
7. Wire each recommendation item to template or specific content URLs.
8. Verify accessibility, mobile behavior, and warning behavior for invalid naming cases.
9. Perform final visual QA against Normal/Hover reference images.

## 8) QA Checklist
- [ ] Section appears near top of homepage.
- [ ] Left/right buttons switch pages correctly and visually span the section height.
- [ ] Layout is exactly 1 large image left + 4 small images right + description below.
- [ ] Main image + all thumbnails render in 16:9 frames with no stretching.
- [ ] Hovering any small image updates large image.
- [ ] Clicking a thumbnail opens linked content page.
- [ ] Clicking section opens linked content page.
- [ ] Arrow clicks do not accidentally open content link.
- [ ] Dot indicator count matches page count and active dot updates per page.
- [ ] Mobile shows left/right buttons on one row above the page indicator.
- [ ] Sidebar top item links to `#featured-recommendations`.
- [ ] If multiple image formats exist for one role, loader chooses `png`, then `jpg`, then `svg`.
- [ ] `template-content.html` follows existing site format.
- [ ] Works on desktop and mobile sizes.
- [ ] Keyboard navigation/focus states are functional.
- [ ] Valid folder/file names load with no warnings.
- [ ] Invalid folder/file names still render images and show warning badge/text.

## 9) Suggested Future Enhancements
- Add smooth slide/fade transition between recommendation pages.
- Add autoplay carousel with pause-on-hover.
- Move page discovery to a generated manifest step in CI for better performance.
