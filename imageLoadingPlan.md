# Progressive Image Loading Plan

## 1. Goals

1.  **Cloudflare CDN** — all image URLs point to Cloudflare R2 instead of local repo paths.
2.  **Low-res first, high-res lazy** — browser paints a small placeholder image immediately, then upgrades to the full-resolution image when it scrolls into the viewport.
3.  **Consistent auto-loading** — image paths are derived by convention (folder + slug + role) so that adding new projects/images requires zero JS changes.
4.  **Smooth UX** — CSS blur-up transition masks the low→high swap.

---

## 2. Cloudflare CDN Configuration

**CDN base URL** (constant in code):

```
https://pub-dc4e1f00955f4568a77da06925201843.r2.dev
```

**Path mapping:** The R2 bucket **mirrors the repo directory structure** exactly.
A local path like `Resources/Featured Recommendations/pages/fr-division-2/fr_division-2__main.png`
becomes `https://pub-dc4e1f00955f4568a77da06925201843.r2.dev/Resources/Featured Recommendations/pages/fr-division-2/fr_division-2__main.png`

**Strategy:** Introduce a single `CDN_BASE` constant. All path-building functions
prepend it. No per-file find-and-replace — the constant gates everything.

```js
// New constant in both home.js and project-instance-loader.js
const CDN_BASE = "https://pub-dc4e1f00955f4568a77da06925201843.r2.dev";
```

**What changes:**
| Where | Current | New |
|---|---|---|
| `home.js` line 288, 513 | Returns local path | Returns `${CDN_BASE}/${localPath}` |
| `project-instance-loader.js` | Reads config JSON paths as-is (they already contain local paths) | Prepends `CDN_BASE` before setting `img.src` |
| JSON config files | Contain local paths like `Resources/…/cover.png` | **Keep local paths** in JSON (source of truth), code prepends CDN_BASE at runtime |
| Hardcoded `<img src="Resources/…">` in HTML | Local path | Replace with full CDN URL in markup |
| `data/taxonomy.json` `image` field | Local path | **Keep local path**, code prepends CDN_BASE at runtime |

---

## 3. Image File Naming Convention

For every image you upload to R2, provide **two versions**:

| Version | Convention | Example | When loaded |
|---|---|---|---|
| **Low-res** (placeholder) | Append `_low` before the extension | `fr_division-2__main_low.png` | Immediately (blocking first paint) |
| **High-res** (full) | Keep existing name, unchanged | `fr_division-2__main.png` | Lazy (viewport entry via IntersectionObserver) |

**Rules:**
- The `_low` suffix is always inserted **just before the last dot**.
  - `image.png` → `image_low.png` ✅
  - `fr_division-2__main.png` → `fr_division-2__main_low.png` ✅
- SVGs are skipped — they are already tiny and don't need a `_low` version.
- External URLs (any URL that starts with `http` but not the CDN_BASE) are skipped.
- If a `_low` file does not exist, fall back to loading the high-res image directly.

---

## 4. Image Folder Structure (Project Instance Pages)

Every project instance page draws images from its own folder. The structure is:

```
R2 Bucket:
  Resources/
    Featured Recommendations/
      pages/
        fr-<slug>/                         ← one folder per featured rec
          fr_<slug>__main.png              ← high-res main
          fr_<slug>__main_low.png          ← low-res main
          fr_<slug>__thumb_01.svg          ← thumbs (SVG, no _low needed)
          fr_<slug>__thumb_02.svg
          fr_<slug>__thumb_03.svg
          fr_<slug>__thumb_04.svg
    Project Template/
      pages/
        pt-template-project/
          pt_template-project__cover.svg   ← scalable vector (no _low)
          pt_template-project__thumb_01.svg
          pt_template-project__thumb_02.svg
          pt_template-project__thumb_03.svg
          pt_template-project__thumb_04.svg
    Project Instances/
      config/
        <slug>.json                        ← contains local paths (not full URLs)
    Wix/
      HOME _ Yujia Max Liu_files/
        Liu_WP_Logo_4x.png
        Liu_WP_Logo_4x_low.png
        6275d4_*.jpg                       ← project key art (add _low variants)
```

**Project JSON config convention** (`Resources/Project Instances/config/<slug>.json`):
```json
"images": {
  "cover":    "Resources/Featured Recommendations/pages/fr-<slug>/fr_<slug>__main.png",
  "thumb_01": "Resources/Featured Recommendations/pages/fr-<slug>/fr_<slug>__thumb_01.svg",
  "thumb_02": "Resources/Featured Recommendations/pages/fr-<slug>/fr_<slug>__thumb_02.svg",
  "thumb_03": "Resources/Featured Recommendations/pages/fr-<slug>/fr_<slug>__thumb_03.svg",
  "thumb_04": "Resources/Featured Recommendations/pages/fr-<slug>/fr_<slug>__thumb_04.svg"
}
```
Paths in JSON stay **local** (repo-relative). Code prepends `CDN_BASE` at runtime.

---

## 5. Function Naming Convention

The function names make the **load order** obvious:

| Function | Responsibility | Load Order |
|---|---|---|
| `getLowResPath(hiResPath)` | Derive low-res path: inserts `_low` before extension | Utility |
| `loadImageLowFirst(imgEl, hiResPath)` | Sets `img.src` to low-res **immediately**, then schedules high-res upgrade on viewport entry | **1st** |
| `upgradeImageToHigh(imgEl, hiResPath)` | Preloads the high-res image in the background, then swaps `img.src` when ready | **2nd** (lazy) |

**Naming rationale:**
- `LowFirst` explicitly answers "which loads first?" — the low-res one.
- `upgradeImageToHigh` describes the action: upgrade from low → high.
- The names read naturally together: *load image low first, then upgrade image to high.*

---

## 6. Implementation Steps

### 6.1 New shared utility file: `image-loader.js`

Create a new file loaded on **every page** (`index.html` and all `<slug>.html`).
It defines the three core functions and the `CDN_BASE` constant.

**File:** `image-loader.js`

```js
const CDN_BASE = "https://pub-dc4e1f00955f4568a77da06925201843.r2.dev";

function toCdnUrl(localPath) {
  if (!localPath || localPath.startsWith("http")) return localPath;
  return CDN_BASE + "/" + localPath;
}

function getLowResPath(hiResPath) {
  // SVGs don't need low-res
  if (hiResPath.toLowerCase().endsWith(".svg")) return hiResPath;
  const dotIndex = hiResPath.lastIndexOf(".");
  if (dotIndex === -1) return hiResPath;
  return hiResPath.slice(0, dotIndex) + "_low" + hiResPath.slice(dotIndex);
}

function upgradeImageToHigh(imgEl, hiResPath) {
  const fullHiRes = toCdnUrl(hiResPath);
  const preloader = new Image();
  preloader.onload = () => {
    imgEl.src = fullHiRes;
    imgEl.classList.remove("progressive-loading");
    imgEl.classList.add("progressive-loaded");
  };
  preloader.onerror = () => {
    // High-res failed, just remove blur (keep low-res visible)
    imgEl.classList.remove("progressive-loading");
    imgEl.classList.add("progressive-loaded");
  };
  preloader.src = fullHiRes;
}

function loadImageLowFirst(imgEl, hiResPath) {
  const fullLowRes = toCdnUrl(getLowResPath(hiResPath));

  // Step 1: Set low-res immediately
  imgEl.src = fullLowRes;
  imgEl.classList.add("progressive-loading");

  // Step 2: Validate low-res exists; if not, fall back to high-res directly
  const probe = new Image();
  probe.onload = () => {
    // Low-res loaded fine. Schedule high-res upgrade on viewport entry.
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          upgradeImageToHigh(imgEl, hiResPath);
          observer.unobserve(imgEl);
        }
      });
    }, { rootMargin: "300px" });
    observer.observe(imgEl);
  };
  probe.onerror = () => {
    // Low-res missing — load high-res directly (still lazy if below fold)
    if (imgEl.complete && imgEl.naturalWidth === 0) {
      imgEl.src = toCdnUrl(hiResPath);
    }
    imgEl.classList.remove("progressive-loading");
    imgEl.classList.add("progressive-loaded");
  };
  probe.src = fullLowRes;
}
```

### 6.2 CSS changes (`style.css`)

Add the blur-up transition classes:

```css
/* Progressive image loading: blur-up transition */
.progressive-loading {
  filter: blur(8px);
  transform: scale(1.02);
  transition: filter 0.4s ease, transform 0.4s ease;
}

.progressive-loaded {
  filter: blur(0);
  transform: scale(1);
}
```

### 6.3 `home.js` integration points

| Line(s) | Current code | Replacement |
|---|---|---|
| 2-3 | (no CDN constant) | Remove `RECOMMENDATION_IMAGE_EXTENSION_PRIORITY` (no longer needed — files are fixed convention now). Keep `RECOMMENDATION_SECTION_NAME`. |
| 101-103 (`createWorkCard`) | `image.src = project.image` | `loadImageLowFirst(image, project.image)` |
| 280 | `const basePath = "Resources/Featured Recommendations/pages"` | Unchanged. Paths built by `buildImagePath()` now return CDN-prefixed paths via `toCdnUrl()`. |
| 288 (`buildImagePath`) | `return \`${basePath}/${page.folder}/fr_${page.slug}__${role}.${extension}\`` | `return toCdnUrl(\`${basePath}/${page.folder}/fr_${page.slug}__${role}.${extension}\`)` |
| 308 (`preloadImage`) | `image.src = src` | `image.src = toCdnUrl(src)` (preload uses CDN path) |
| 430 (`frMainImage.src = mainImage`) | Direct assignment | `loadImageLowFirst(frMainImage, mainImage)` |
| 444 (`thumbImage.src = thumbPath`) | Direct assignment | `loadImageLowFirst(thumbImage, thumbPath)` |
| 510 | `const basePath = "Resources/Project Template/pages"` | Unchanged. |
| 513 (`buildProjectImagePath`) | Returns local path | Return `toCdnUrl(...)` — prepends CDN_BASE. |
| 558 (`node.src = imagePath`) | Direct assignment | `loadImageLowFirst(node, imagePath)` |

### 6.4 `project-instance-loader.js` integration points

| Line(s) | Current code | Replacement |
|---|---|---|
| 1 | `const PROJECT_INSTANCE_CONFIG_BASE = ...` | Add CDN_BASE constant (import or re-declare from image-loader.js). |
| 165 | `image.src = project.image` | `loadImageLowFirst(image, project.image)` |
| 224 | `image.src = block.src` | `loadImageLowFirst(image, block.src)` |
| 254 | `afterImg.src = block.after` | `loadImageLowFirst(afterImg, block.after)` |
| 259 | `beforeImg.src = block.before` | `loadImageLowFirst(beforeImg, block.before)` |
| 557 | `coverImage.src = config.images.cover` | `loadImageLowFirst(coverImage, config.images.cover)` |
| 562 | `mainImage.src = config.images.thumb_01` | `loadImageLowFirst(mainImage, config.images.thumb_01)` |
| 573 | `imageNode.src = imagePath` | `loadImageLowFirst(imageNode, imagePath)` |

### 6.5 HTML changes

| File | Line | Current | New |
|---|---|---|---|
| `index.html` | 57 | `src="Resources/Wix/HOME _ Yujia Max Liu_files/Liu_WP_Logo_4x.png"` | `src="https://pub-dc4e1f00955f4568a77da06925201843.r2.dev/Resources/Wix/HOME _ Yujia Max Liu_files/Liu_WP_Logo_4x.png"` |
| `index.html` | 135 | Already CDN URL | Unchanged |
| `index.html` | 253 | `src="Resources/Featured Recommendations/pages/fr-division-2/fr_division-2__main.png"` | Full CDN URL (but this image is overridden by JS at runtime anyway — can also leave as-is since JS overwrites it) |
| `template-content.html` | 23 | `src="Resources/Wix/..."` | Full CDN URL |
| Shell pages | Various | N/A | Add `<script src="image-loader.js" defer></script>` to each `.html` file |

### 6.6 JSON config changes (`data/taxonomy.json`)

| Field | Current (example) | New |
|---|---|---|
| `projects[].image` | `"Resources/Wix/.../6275d4_xxx.jpg"` | **Keep local path.** Code will prepend CDN_BASE. |

No JSON config changes needed — local paths are the source of truth, CDN prefix is a runtime concern.

### 6.7 Remove obsolete image validation logic

Since images now live on a CDN with fixed conventions (not extension priority probing):
- `canLoadImage()` — can be removed. Low-res fallback is handled by `loadImageLowFirst()`.
- `resolveImagePath()` — can be simplified. No more extension priority loop. Just build the CDN path and return it.
- `canLoadProjectImage()` — same, can be simplified.
- `resolveProjectImagePath()` — same, can be simplified.
- `validationCache`, `pathCache` — no longer needed if validation is removed.
- `RECOMMENDATION_IMAGE_EXTENSION_PRIORITY` — remove.

---

## 7. Loading Flow Summary

```
page loads
  ↓
loadImageLowFirst(img, "Resources/Featured Recommendations/pages/fr-division-2/fr_division-2__main.png")
  ↓
1. Derives low-res path:  ".../fr_division-2__main_low.png"
2. Prepends CDN_BASE:     "https://...r2.dev/Resources/Featured Recommendations/pages/fr-division-2/fr_division-2__main_low.png"
3. Sets img.src = low-res  → user sees blurred placeholder immediately
4. Probes low-res existence:
   ├─ exists → register IntersectionObserver, wait for viewport
   └─ missing → load high-res directly, skip blur
  ↓
5. Image enters viewport (+ 300px rootMargin)
6. upgradeImageToHigh() preloads high-res in background
7. On high-res loaded → img.src swapped, CSS class → .progressive-loaded
8. User sees sharp full-resolution image with blur→sharp transition
```

---

## 8. Edge Cases

| Scenario | Behavior |
|---|---|
| `_low` file does not exist | `probe.onerror` → loads high-res directly, skips blur |
| High-res file does not exist | Browser shows broken image (expected — user needs to upload it) |
| Image is SVG | `getLowResPath()` returns original path, no `_low` suffix |
| Image is external URL (not CDN_BASE) | `toCdnUrl()` returns URL unchanged, `loadImageLowFirst()` skips progressive handling |
| Image already visible on load (above fold) | IntersectionObserver fires immediately → high-res loads right away |
| Carousel neighbor preloading (`preloadImage`) | Uses `toCdnUrl()` but preloads high-res only (no DOM swap, just browser cache warming) |
| `image-compare` block (before/after) | Both images get `loadImageLowFirst()` independently |
| Featured rec `fr-main-image` | Loaded via JS → `loadImageLowFirst()`. Initial HTML `src` is a static fallback (can be low-res or removed). |

---

## 9. Migration Checklist

- [ ] Upload all low-res `_low` variants to R2 (mirroring repo folder structure)
- [ ] Upload all existing images to R2 (mirroring repo folder structure)
- [ ] Create `image-loader.js` with `CDN_BASE`, `toCdnUrl()`, `getLowResPath()`, `loadImageLowFirst()`, `upgradeImageToHigh()`
- [ ] Add `image-loader.js` script tag to `index.html` and all `<slug>.html` files
- [ ] Add `.progressive-loading` / `.progressive-loaded` CSS to `style.css`
- [ ] Replace `image.src = path` with `loadImageLowFirst(img, path)` in `home.js` (5 sites)
- [ ] Replace `image.src = path` with `loadImageLowFirst(img, path)` in `project-instance-loader.js` (7 sites)
- [ ] Update `buildImagePath()` and `buildProjectImagePath()` to return CDN-prefixed paths
- [ ] Update `preloadImage()` to use `toCdnUrl()`
- [ ] Replace hardcoded local `<img src>` in `index.html` and `template-content.html` with full CDN URLs
- [ ] Remove `canLoadImage()`, `resolveImagePath()` extension-probing logic (no longer needed)
- [ ] Remove `canLoadProjectImage()`, `resolveProjectImagePath()` extension-probing logic
- [ ] Remove `RECOMMENDATION_IMAGE_EXTENSION_PRIORITY` constant
- [ ] Remove `validationCache`, `pathCache` (if validation is fully removed)
- [ ] Test: verify low-res loads first (blurred), then sharpens on viewport entry
- [ ] Test: verify missing `_low` falls back to high-res directly
