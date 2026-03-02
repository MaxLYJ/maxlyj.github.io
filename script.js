const RECOMMENDATION_SECTION_NAME = "Recommendation";
const RECOMMENDATION_IMAGE_EXTENSION_PRIORITY = ["png", "jpg", "svg"];
const TAG_DEFINITIONS = [
  { id: "all", label: "All" },
  { id: "farcry6", label: "Farcry6" },
  { id: "division2", label: "Division2" },
  { id: "short-film", label: "Short film" },
  { id: "tool", label: "Tool" }
];

const PROJECT_INDEX = [
  {
    title: "Farcry 6",
    url: "farcry-6.html",
    image: "Resources/Wix/HOME _ Yujia Max Liu_files/6275d4_0acb6eb0a34d41fc8f08f3c4eae91ecbf000.jpg",
    alt: "Farcry 6 project key art",
    tags: ["farcry6"]
  },
  {
    title: "Division 2",
    url: "division-2.html",
    image: "Resources/Wix/HOME _ Yujia Max Liu_files/6275d4_a7082ee4aa4f4a4790658c0bfb7d6c0af000.jpg",
    alt: "Division 2 project artwork",
    tags: ["division2"]
  },
  {
    title: "D-Walker VS Sahelanthropus",
    url: "d-walker-vs-sahelanthropus.html",
    image: "Resources/Wix/HOME _ Yujia Max Liu_files/6275d4_79561fe54d1d4c429bf66be91875a65af000.jpg",
    alt: "D-Walker VS Sahelanthropus scene",
    tags: ["short-film"]
  },
  {
    title: "Shader & Material Tooling",
    url: "d-walker-vs-sahelanthropus.html",
    image: "Resources/Wix/HOME _ Yujia Max Liu_files/6275d4_3a7cfeefce354f47a3798ec24745223e~mv2.jpg",
    alt: "Tooling and shader experiments",
    tags: ["tool"]
  }
];

const yearElement = document.getElementById("year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

document.querySelectorAll("[data-recommendation-label]").forEach((node) => {
  node.textContent = RECOMMENDATION_SECTION_NAME;
});

const recommendationSectionElement = document.querySelector("[data-recommendation-section]");
if (recommendationSectionElement) {
  recommendationSectionElement.setAttribute("aria-label", RECOMMENDATION_SECTION_NAME);
}

const recommendationIndicatorElement = document.querySelector("[data-recommendation-indicator]");
if (recommendationIndicatorElement) {
  recommendationIndicatorElement.setAttribute("aria-label", `${RECOMMENDATION_SECTION_NAME} pages`);
}

const tagBar = document.getElementById("tag-bar");
const worksGallery = document.getElementById("works-gallery");
const worksEmptyState = document.getElementById("works-empty");

let activeTagId = "all";

function createTagChip(tag) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "tag-chip";
  chip.textContent = tag.label;
  chip.setAttribute("aria-pressed", String(tag.id === activeTagId));
  chip.classList.toggle("is-active", tag.id === activeTagId);
  chip.addEventListener("click", () => {
    activeTagId = tag.id;
    renderTagSystem();
  });
  return chip;
}

function createWorkCard(project) {
  const card = document.createElement("article");
  card.className = "card";

  const link = document.createElement("a");
  link.href = project.url;
  link.className = "work-link";

  const image = document.createElement("img");
  image.src = project.image;
  image.alt = project.alt;

  const title = document.createElement("h3");
  title.textContent = project.title;

  const tags = document.createElement("p");
  tags.className = "work-tags";
  const labels = project.tags
    .map((tagId) => TAG_DEFINITIONS.find((tag) => tag.id === tagId)?.label)
    .filter(Boolean);
  tags.textContent = labels.join(" · ");

  link.append(image, title, tags);
  card.appendChild(link);
  return card;
}

function renderTagSystem() {
  if (!tagBar || !worksGallery || !worksEmptyState) {
    return;
  }

  tagBar.innerHTML = "";
  TAG_DEFINITIONS.forEach((tag) => {
    tagBar.appendChild(createTagChip(tag));
  });

  const filteredProjects =
    activeTagId === "all"
      ? PROJECT_INDEX
      : PROJECT_INDEX.filter((project) => project.tags.includes(activeTagId));

  worksGallery.innerHTML = "";
  filteredProjects.forEach((project) => {
    worksGallery.appendChild(createWorkCard(project));
  });

  worksEmptyState.hidden = filteredProjects.length > 0;
}

renderTagSystem();

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
    link.addEventListener("click", () => {
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

const featuredPages = [
  {
    folder: "fr-division-2",
    slug: "division-2",
    title: "Division 2",
    description: "Tom Clancy's The Division 2 recommendation set.",
    targetUrl: "division-2.html",
    altMain: "Division 2 main recommendation image",
    altThumbs: ["Division 2 thumbnail 1", "Division 2 thumbnail 2", "Division 2 thumbnail 3", "Division 2 thumbnail 4"]
  },
  {
    folder: "fr-farcry-6",
    slug: "farcry-6",
    title: "Farcry 6",
    description: "Recommendation snapshots for Farcry 6.",
    targetUrl: "farcry-6.html",
    altMain: "Farcry 6 main recommendation image",
    altThumbs: ["Farcry 6 thumbnail 1", "Farcry 6 thumbnail 2", "Farcry 6 thumbnail 3", "Farcry 6 thumbnail 4"]
  },
  {
    folder: "fr-d-walker-vs-sahelanthropus",
    slug: "d-walker-vs-sahelanthropus",
    title: "D-Walker VS Sahelanthropus",
    description: "A tactical encounter recommendation: D-Walker VS Sahelanthropus.",
    targetUrl: "d-walker-vs-sahelanthropus.html",
    altMain: "D-Walker VS Sahelanthropus main recommendation image",
    altThumbs: [
      "D-Walker VS Sahelanthropus thumbnail 1",
      "D-Walker VS Sahelanthropus thumbnail 2",
      "D-Walker VS Sahelanthropus thumbnail 3",
      "D-Walker VS Sahelanthropus thumbnail 4"
    ]
  },
  {
    folder: "fr-raiden-vs-gekko",
    slug: "raiden-vs-gekko",
    title: "Raiden VS Gekko",
    description: "Metal Gear Rising recommendation: Raiden VS Gekko.",
    targetUrl: "raiden-vs-gekko.html",
    altMain: "Raiden VS Gekko main recommendation image",
    altThumbs: ["Raiden VS Gekko thumbnail 1", "Raiden VS Gekko thumbnail 2", "Raiden VS Gekko thumbnail 3", "Raiden VS Gekko thumbnail 4"]
  }
];

const frSection = document.getElementById("featured-recommendations");
if (frSection) {
  const frCardLink = document.getElementById("fr-card-link");
  const frMainImage = document.getElementById("fr-main-image");
  const frThumbs = document.getElementById("fr-thumbs");
  const frTitle = document.getElementById("fr-title");
  const frDescription = document.getElementById("fr-description");
  const frWarning = document.getElementById("fr-warning");
  const frWarningList = document.getElementById("fr-warning-list");
  const pageIndicator = document.getElementById("fr-page-indicator");
  const prevBtn = frSection.querySelector(".fr-nav-prev");
  const nextBtn = frSection.querySelector(".fr-nav-next");

  const basePath = "Resources/Featured Recommendations/pages";
  const pathCache = new Map();
  const validationCache = new Map();
  const preloadCache = new Set();
  let currentPageIndex = 0;
  let renderToken = 0;

  function buildImagePath(page, role, extension) {
    return `${basePath}/${page.folder}/fr_${page.slug}__${role}.${extension}`;
  }

  function canLoadImage(src) {
    if (validationCache.has(src)) {
      return validationCache.get(src);
    }

    const validationPromise = new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = src;
    });

    validationCache.set(src, validationPromise);
    return validationPromise;
  }

  function preloadImage(src) {
    const image = new Image();
    image.decoding = "async";
    image.src = src;
  }

  function getPageRoles() {
    return ["main", "thumb_01", "thumb_02", "thumb_03", "thumb_04"];
  }

  async function preloadPageAssets(page) {
    if (preloadCache.has(page.slug)) {
      return;
    }

    preloadCache.add(page.slug);
    const roles = getPageRoles();
    const resolvedPaths = await Promise.all(roles.map((role) => resolveImagePath(page, role)));
    resolvedPaths.forEach(preloadImage);
  }

  function warmNeighborPages() {
    const prevPage = featuredPages[(currentPageIndex - 1 + featuredPages.length) % featuredPages.length];
    const nextPage = featuredPages[(currentPageIndex + 1) % featuredPages.length];

    preloadPageAssets(prevPage);
    preloadPageAssets(nextPage);
  }

  async function resolveImagePath(page, role) {
    const key = `${page.slug}:${role}`;
    if (pathCache.has(key)) {
      return pathCache.get(key);
    }

    for (const extension of RECOMMENDATION_IMAGE_EXTENSION_PRIORITY) {
      const candidatePath = buildImagePath(page, role, extension);
      // eslint-disable-next-line no-await-in-loop
      const isValid = await canLoadImage(candidatePath);
      if (isValid) {
        pathCache.set(key, candidatePath);
        return candidatePath;
      }
    }

    const fallbackPath = buildImagePath(page, role, "svg");
    pathCache.set(key, fallbackPath);
    return fallbackPath;
  }

  function validatePage(page) {
    const issues = [];
    if (!/^fr-[a-z0-9-]+$/.test(page.folder)) {
      issues.push(`Invalid folder name: ${page.folder}`);
    }

    if (!page.folder.endsWith(page.slug)) {
      issues.push(`Folder and slug mismatch: ${page.folder} vs ${page.slug}`);
    }

    return issues;
  }

  function clearWarning() {
    frSection.classList.remove("has-warning");
    frWarning.hidden = true;
    frWarningList.innerHTML = "";
  }

  function applyWarning(issues, page) {
    if (!issues.length) {
      clearWarning();
      return;
    }

    frSection.classList.add("has-warning");
    frWarning.hidden = false;
    frWarningList.innerHTML = issues.map((issue) => `<li>${issue}</li>`).join("");
    console.warn(`${RECOMMENDATION_SECTION_NAME} naming issues`, {
      pageSlug: page.slug,
      issues
    });
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

  async function renderPage() {
    renderToken += 1;
    const currentToken = renderToken;
    const page = featuredPages[currentPageIndex];

    const thumbRoles = ["thumb_01", "thumb_02", "thumb_03", "thumb_04"];
    const [mainImage, thumbPaths] = await Promise.all([
      resolveImagePath(page, "main"),
      Promise.all(thumbRoles.map((role) => resolveImagePath(page, role)))
    ]);

    if (currentToken !== renderToken) {
      return;
    }

    frCardLink.href = page.targetUrl;
    frTitle.textContent = page.title;
    frDescription.textContent = page.description;
    frMainImage.src = mainImage;
    frMainImage.alt = page.altMain;
    preloadImage(mainImage);

    frThumbs.innerHTML = "";
    thumbPaths.forEach((thumbPath, thumbIndex) => {
      const i = thumbIndex + 1;

      const thumbButton = document.createElement("button");
      thumbButton.className = "fr-thumb";
      thumbButton.type = "button";
      thumbButton.setAttribute("aria-label", `Preview ${page.title} image ${i}`);

      const thumbImage = document.createElement("img");
      thumbImage.src = thumbPath;
      thumbImage.alt = page.altThumbs[i - 1] || `${page.title} thumbnail ${i}`;
      thumbButton.appendChild(thumbImage);

      const activateThumb = () => {
        frMainImage.src = thumbPath;
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

      thumbButton.addEventListener("mouseleave", () => {
        frMainImage.src = mainImage;
        frMainImage.alt = page.altMain;
        setActiveThumb(null);
      });
      thumbButton.addEventListener("blur", () => {
        frMainImage.src = mainImage;
        frMainImage.alt = page.altMain;
        setActiveThumb(null);
      });

      frThumbs.appendChild(thumbButton);
      preloadImage(thumbPath);
    });

    applyWarning(validatePage(page), page);
    renderIndicator();
    warmNeighborPages();
  }

  function movePage(direction) {
    currentPageIndex = (currentPageIndex + direction + featuredPages.length) % featuredPages.length;
    renderPage();
  }

  [prevBtn, nextBtn].forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });

  prevBtn.addEventListener("click", () => movePage(-1));
  nextBtn.addEventListener("click", () => movePage(1));

  renderPage();
}
