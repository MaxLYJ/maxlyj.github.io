// home.js — homepage entry point.
// CDN_BASE, toCdnUrl, loadVersionTag, and TAXONOMY_MANIFEST_PATH are shared with
// project-instance-loader.js via shared.js, which is loaded before this script.

// ===== SHARED CONSTANTS (homepage-only) =====
const RECOMMENDATION_SECTION_NAME = "Recommendation";

// Populate the top-bar version pill. On the homepage ".top-bar-version" is in
// the static HTML, so this runs immediately. (On project instance pages the
// loader calls loadVersionTag() after injecting the template.)
loadVersionTag();

// ===== TAG SYSTEM DATA =====

let TAG_DEFINITIONS = [{ id: "all", label: "All" }];
let PROJECT_INDEX = [];
let tagLabelById = new Map();

// Memoized so the manifest is fetched exactly once per page load even though
// it is consumed by both the tag system and the featured carousel. Resolves to
// the parsed manifest (or null on failure) and populates the module globals.
let taxonomyManifestPromise;

async function loadTaxonomyManifest() {
  if (taxonomyManifestPromise) {
    return taxonomyManifestPromise;
  }

  taxonomyManifestPromise = (async () => {
    let manifest = null;
    try {
      const response = await fetch(TAXONOMY_MANIFEST_PATH);
      if (response.ok) {
        manifest = await response.json();
      }
    } catch {
      // Keep empty arrays when taxonomy cannot be loaded.
    }

    applyTaxonomyManifest(manifest);
    return manifest;
  })();

  return taxonomyManifestPromise;
}

function applyTaxonomyManifest(manifest) {
  const manifestTags = manifest && Array.isArray(manifest.tags) ? manifest.tags : [];
  const manifestProjects = manifest && Array.isArray(manifest.projects) ? manifest.projects : [];

  // Priority sort: P1 (core demand) first, then P2, then P3.
  // "All" stays pinned at position 0 with priority 0.
  const prioritizedTags = manifestTags
    .filter((tag) => tag && typeof tag.id === "string")
    .map((tag) => ({
      id: tag.id,
      label: tag.label || tag.id,
      priority: typeof tag.priority === "number" ? tag.priority : 3
    }))
    .sort((a, b) => a.priority - b.priority);

  TAG_DEFINITIONS = [
    { id: "all", label: "All", priority: 0 },
    ...prioritizedTags
  ];

  PROJECT_INDEX = manifestProjects
    .filter((project) => project && typeof project.url === "string")
    .map((project) => ({
      title: project.title || project.slug || "Untitled Project",
      url: project.url,
      image: project.image || "",
      alt: project.alt || `${project.title || project.slug || "Project"} image`,
      tagIds: Array.isArray(project.tagIds) ? project.tagIds : []
    }));

  tagLabelById = new Map(TAG_DEFINITIONS.map((tag) => [tag.id, tag.label]));
}

// ===== ABOUT SECTION =====
const yearElement = document.getElementById("year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// ===== TAG SYSTEM UI =====
const tagBar = document.getElementById("tag-bar");
const worksGallery = document.getElementById("works-gallery");
const worksSection = document.getElementById("works");
const worksEmptyState = document.getElementById("works-empty");

let activeTagId = "all";
// Collapsed (one-line) by default. Expand to reveal every tag; selecting any
// tag collapses the bar back to the original single line.
let tagBarExpanded = false;

function createTagChip(tag) {
  const chip = document.createElement("button");
  chip.type = "button";
  // Priority tier drives visual weight: P1 prominent, P2 normal, P3 subdued.
  const priority = typeof tag.priority === "number" ? tag.priority : 3;
  chip.className = `tag-chip tag-priority-${priority}`;
  chip.dataset.priority = String(priority);
  chip.textContent = tag.label;
  chip.setAttribute("aria-pressed", String(tag.id === activeTagId));
  chip.classList.toggle("is-active", tag.id === activeTagId);
  chip.addEventListener("click", () => {
    activeTagId = tag.id;
    // Selecting a tag returns the bar to the original one-line state.
    tagBarExpanded = false;
    renderTagSystem();

    //Scroll to selected works section on both desktop and mobile after clicking a tag.
    //Target the works section so the heading stays visible under the sticky tag bar;
    //scroll-margin-top on #works handles the sticky offset.
    const scrollTarget = worksSection || worksGallery;
    if (scrollTarget) {
      scrollTarget.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
    }
  });
  return chip;
}

// ===== SELECTED WORKS CARD RENDERING =====
function createWorkCard(project) {
  const card = document.createElement("article");
  card.className = "card";

  const link = document.createElement("a");
  link.href = project.url;
  link.className = "work-link";

  const image = document.createElement("img");
  image.src = toCdnUrl(project.image);
  image.alt = project.alt;
  image.loading = "lazy";
  image.decoding = "async";

  const title = document.createElement("h3");
  title.textContent = project.title;

  const tags = document.createElement("p");
  tags.className = "work-tags";
  const labels = (project.tagIds || [])
    .map((tagId) => tagLabelById.get(tagId))
    .filter(Boolean);
  tags.textContent = labels.join(" · ");

  link.append(image, title, tags);
  card.appendChild(link);
  return card;
}

function createExpandToggle() {
  // Tags concealed by the collapsed state: P2/P3 chips that are not active.
  const hiddenCount = TAG_DEFINITIONS.filter((tag) => {
    const priority = typeof tag.priority === "number" ? tag.priority : 3;
    return priority >= 2 && tag.id !== activeTagId;
  }).length;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "tag-chip tag-expand-toggle";
  toggle.setAttribute("aria-expanded", String(tagBarExpanded));
  toggle.setAttribute("aria-controls", "tag-bar");
  toggle.setAttribute(
    "aria-label",
    tagBarExpanded ? "Collapse tag filter" : `Expand tag filter, ${hiddenCount} more tags`
  );
  toggle.textContent = tagBarExpanded ? "Less" : `More +${hiddenCount}`;
  toggle.addEventListener("click", () => {
    tagBarExpanded = !tagBarExpanded;
    renderTagSystem();
  });
  return toggle;
}

function renderTagSystem() {
  if (!tagBar || !worksGallery || !worksEmptyState) {
    return;
  }

  tagBar.innerHTML = "";
  // is-collapsed forces a single line and hides non-active P2/P3 chips.
  tagBar.classList.toggle("is-collapsed", !tagBarExpanded);
  TAG_DEFINITIONS.forEach((tag) => {
    tagBar.appendChild(createTagChip(tag));
  });
  tagBar.appendChild(createExpandToggle());

  const filteredProjects =
    activeTagId === "all"
      ? PROJECT_INDEX
      : PROJECT_INDEX.filter((project) => (project.tagIds || []).includes(activeTagId));

  worksGallery.innerHTML = "";
  filteredProjects.forEach((project) => {
    worksGallery.appendChild(createWorkCard(project));
  });

  worksEmptyState.hidden = filteredProjects.length > 0;
}

loadTaxonomyManifest().then(() => {
  renderTagSystem();
});

const menuToggle = document.querySelector(".menu-toggle");
const sidebar = document.querySelector(".sidebar");
const overlay = document.querySelector(".sidebar-overlay");
const mobileBreakpoint = window.matchMedia("(max-width: 980px)");

function closeSidebar() {
  if (!sidebar || !overlay || !menuToggle) {
    return;
  }

  sidebar.classList.remove("is-open");
  overlay.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("sidebar-open");
}

function openSidebar() {
  if (!sidebar || !overlay || !menuToggle) {
    return;
  }

  sidebar.classList.add("is-open");
  overlay.classList.add("is-open");
  menuToggle.setAttribute("aria-expanded", "true");
  document.body.classList.add("sidebar-open");
}

if (menuToggle && sidebar && overlay) {
  menuToggle.addEventListener("click", () => {
    const isOpen = sidebar.classList.contains("is-open");
    if (isOpen) {
      closeSidebar();
      return;
    }

    openSidebar();
  });

  overlay.addEventListener("click", closeSidebar);

  sidebar.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href") || "";
      const isHashLink = href.startsWith("#") && href.length > 1;

      if (isHashLink) {
        const target = document.querySelector(href);
        if (target) {
          event.preventDefault();
          // No manual offset needed: each #section sets scroll-margin-top and
          // <html> sets scroll-padding-top, so the sticky top bar never covers
          // the heading after the smooth scroll lands.
          target.scrollIntoView({
            behavior: prefersReducedMotion() ? "auto" : "smooth",
            block: "start",
          });
          history.replaceState(null, "", href);
        }
      }

      if (mobileBreakpoint.matches) {
        closeSidebar();
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSidebar();
    }
  });

  mobileBreakpoint.addEventListener("change", (event) => {
    if (!event.matches) {
      closeSidebar();
    }
  });
}

// ===== RECOMMENDATION SECTION =====
document.querySelectorAll("[data-recommendation-label]").forEach((node) => {
  node.textContent = RECOMMENDATION_SECTION_NAME;
});

const recommendationSectionElement = document.querySelector("[data-recommendation-section]");
if (recommendationSectionElement) {
  // region + aria-roledescription="carousel" (set in the markup) make this
  // announced as a carousel; keep its accessible name in sync with the visible
  // "Recommendation" label.
  recommendationSectionElement.setAttribute("aria-label", `${RECOMMENDATION_SECTION_NAME} carousel`);
}

// The dot indicator is decorative; slide position is announced to assistive
// tech via the #fr-live live region, so no accessible name is needed here.

// Projects shown in the front-page carousel. These are the project slugs that
// have R2 featured/ art (LowRes thumbnails + HighRes previews). Add a slug here
// once its projects/<slug>/featured/ folder is populated.
const FEATURED_PROJECT_SLUGS = ["farcry6-procedural-generation", "division2-tools"];
const FEATURED_THUMB_MAX = 4;

const frSection = document.getElementById("featured-recommendations");
if (frSection) {
  const frCardLink = document.getElementById("fr-card-link");
  const frMainImage = document.getElementById("fr-main-image");
  const frThumbs = document.getElementById("fr-thumbs");
  const frTitle = document.getElementById("fr-title");
  const frDescription = document.getElementById("fr-description");
  const frLive = document.getElementById("fr-live");
  const pageIndicator = document.getElementById("fr-page-indicator");
  const prevBtn = frSection.querySelector(".fr-nav-prev");
  const nextBtn = frSection.querySelector(".fr-nav-next");

  const preloadCache = new Set();
  let featuredPages = [];
  let currentPageIndex = 0;
  let renderToken = 0;

  function preloadImage(src) {
    const image = new Image();
    image.decoding = "async";
    image.src = src;
  }

  // Build carousel entries from the shared (memoized) taxonomy + each project's
  // config images. Cover = project default image; thumbs = LowRes (cap at
  // FEATURED_THUMB_MAX); fulls = HighRes (shown on hover). Mirrors the
  // project-page data model so the two can never drift.
  async function buildFeaturedPages(taxonomy) {
    const projects = taxonomy && Array.isArray(taxonomy.projects) ? taxonomy.projects : [];
    const bySlug = new Map(projects.map((p) => [p.slug, p]));

    const entries = [];
    for (const slug of FEATURED_PROJECT_SLUGS) {
      const taxon = bySlug.get(slug);
      if (!taxon) {
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      const config = await loadFeaturedProjectConfig(slug);
      if (!config || !config.images) {
        continue;
      }
      const images = config.images;
      if (!images.cover || !images.thumb_01) {
        continue;
      }

      const thumbs = [];
      const fulls = [];
      for (let i = 1; i <= FEATURED_THUMB_MAX; i += 1) {
        const thumb = images[`thumb_0${i}`];
        if (!thumb) {
          break;
        }
        thumbs.push(thumb);
        // HighRes shown on hover; fall back to the LowRes thumb if not defined.
        fulls.push(images[`full_0${i}`] || thumb);
      }
      if (!thumbs.length) {
        continue;
      }

      entries.push({
        slug,
        title: taxon.title || config.title || slug,
        description: config.kicker || config.description || "",
        targetUrl: taxon.url || `${slug}.html`,
        cover: toCdnUrl(images.cover),
        altMain: taxon.alt || `${taxon.title || slug} cover image`,
        thumbs: thumbs.map(toCdnUrl),
        fulls: fulls.map(toCdnUrl)
      });
    }
    return entries;
  }

  async function loadFeaturedProjectConfig(slug) {
    try {
      const response = await fetch(`Resources/Project Instances/config/${slug}.json`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.warn(`Failed to load featured project config for ${slug}`, error);
      return null;
    }
  }

  function preloadPageAssets(page) {
    if (preloadCache.has(page.slug)) {
      return;
    }
    preloadCache.add(page.slug);
    // Warm only the cover for neighbor pages. The cover is the carousel slide's
    // LCP image and the only asset shown immediately on navigation, so warming
    // it makes prev/next feel instant. The thumbnails are small (LowRes) and the
    // HighRes "fulls" only swap in on hover, so speculatively preloading them —
    // formerly up to 1 cover + 4 thumbs + 4 fulls per neighbor (~18 large
    // fetches for two neighbors) — competed with the homepage LCP on slow
    // connections. When a neighbor becomes the current slide its thumbs and the
    // hovered full fetch on demand during renderPage().
    preloadImage(page.cover);
  }

  function warmNeighborPages() {
    if (!featuredPages.length) {
      return;
    }
    const prevPage = featuredPages[(currentPageIndex - 1 + featuredPages.length) % featuredPages.length];
    const nextPage = featuredPages[(currentPageIndex + 1) % featuredPages.length];
    preloadPageAssets(prevPage);
    preloadPageAssets(nextPage);
  }

  function setActiveThumb(activeButton) {
    frThumbs.querySelectorAll(".fr-thumb").forEach((button) => {
      button.classList.toggle("is-active", button === activeButton);
    });
  }

  function renderIndicator() {
    if (!pageIndicator) {
      return;
    }

    pageIndicator.innerHTML = "";
    featuredPages.forEach((_, index) => {
      const dot = document.createElement("span");
      dot.className = "fr-indicator-dot";
      dot.setAttribute("aria-hidden", "true");
      dot.classList.toggle("is-active", index === currentPageIndex);
      pageIndicator.appendChild(dot);
    });
  }

  function renderPage() {
    renderToken += 1;
    const currentToken = renderToken;
    if (!featuredPages.length) {
      return;
    }
    const page = featuredPages[currentPageIndex];

    if (currentToken !== renderToken) {
      return;
    }

    frCardLink.href = page.targetUrl;
    frTitle.textContent = page.title;
    frDescription.textContent = page.description;
    // Setting the visible <img> src below already fetches the cover; no separate
    // preloadImage() call is needed (it would just request the same URL twice).
    frMainImage.src = page.cover;
    frMainImage.alt = page.altMain;

    // Announce the current slide (position + title + description) to assistive
    // tech via the polite live region each time the carousel advances. The card
    // itself stays a plain link whose accessible name comes from its content.
    if (frLive) {
      frLive.textContent = `Slide ${currentPageIndex + 1} of ${featuredPages.length}: ${page.title}. ${page.description}`;
    }

    frThumbs.innerHTML = "";
    page.thumbs.forEach((thumbPath, thumbIndex) => {
      const i = thumbIndex + 1;
      const highRes = page.fulls[thumbIndex] || thumbPath;

      const thumbButton = document.createElement("button");
      thumbButton.className = "fr-thumb";
      thumbButton.type = "button";
      thumbButton.setAttribute("aria-label", `Preview ${page.title} image ${i}`);

      const thumbImage = document.createElement("img");
      thumbImage.src = thumbPath;
      thumbImage.alt = `${page.title} thumbnail ${i}`;
      thumbButton.appendChild(thumbImage);

      // Hover/focus swaps the main image to the HighRes variant.
      const activateThumb = () => {
        frMainImage.src = highRes;
        frMainImage.alt = thumbImage.alt;
        setActiveThumb(thumbButton);
      };

      thumbButton.addEventListener("mouseenter", activateThumb);
      thumbButton.addEventListener("focus", activateThumb);
      thumbButton.addEventListener("click", () => {
        activateThumb();
        window.location.href = page.targetUrl;
      });
      thumbButton.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activateThumb();
        }
      });

      // Leave/blur reverts the main image to the project cover.
      thumbButton.addEventListener("mouseleave", () => {
        frMainImage.src = page.cover;
        frMainImage.alt = page.altMain;
        setActiveThumb(null);
      });
      thumbButton.addEventListener("blur", () => {
        frMainImage.src = page.cover;
        frMainImage.alt = page.altMain;
        setActiveThumb(null);
      });

      // No preloadImage(thumbPath): the thumb is already a DOM <img> (its .src
      // above starts the fetch), so an explicit preload would duplicate it.
      frThumbs.appendChild(thumbButton);
    });

    renderIndicator();
    warmNeighborPages();
  }

  function movePage(direction) {
    if (!featuredPages.length) {
      return;
    }
    currentPageIndex = (currentPageIndex + direction + featuredPages.length) % featuredPages.length;
    renderPage();
  }

  [prevBtn, nextBtn].forEach((button) => {
    if (!button) {
      return;
    }
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });

  if (prevBtn) {
    prevBtn.addEventListener("click", () => movePage(-1));
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => movePage(1));
  }

  // Arrow-key navigation: when focus is anywhere inside the carousel (on a
  // prev/next button, a thumbnail, or the slide link), Left/Right advance the
  // slide. preventDefault stops the page from scrolling horizontally.
  frSection.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      movePage(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      movePage(1);
    }
  });

  // Wire the navigation buttons even before entries resolve, then hydrate the
  // carousel once project configs are fetched. loadTaxonomyManifest returns the
  // memoized manifest (one fetch shared with the tag system) for its slug/url
  // fields.
  loadTaxonomyManifest().then(async (manifest) => {
    featuredPages = await buildFeaturedPages(manifest);
    renderPage();
  });
}

// Project detail pages are rendered entirely by project-instance-loader.js.
// home.js previously hydrated the shared template (template-content.html) when it
// was opened directly, via a [data-project-template-folder] block that probed
// image extensions at runtime and duplicated the loader's gallery logic. That
// block never ran in production — home.js only ships on index.html, where the
// element does not exist — so it has been removed. See reviews/CODE-REVIEW.md.
