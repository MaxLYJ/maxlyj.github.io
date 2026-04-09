// Slug-to-config mapping. Each JSON file contains one project instance's content.
const PROJECT_INSTANCE_CONFIG_PATHS = {
  "project-instance-test":
    "Resources/Project Instances/config/project-instance-test.json",
  "raiden-vs-gekko": "Resources/Project Instances/config/raiden-vs-gekko.json",
  "division2-tools": "Resources/Project Instances/config/division2-tools.json",
  "d-walker-vs-sahelanthropus": "Resources/Project Instances/config/d-walker-vs-sahelanthropus.json",
  "farcry6-procedural-generation": "Resources/Project Instances/config/Farcry6-ProceduralGeneration.json"
};
const TAXONOMY_MANIFEST_PATH = "data/taxonomy.json";

let taxonomyManifestPromise;

async function loadProjectConfig(slug) {
  const configPath = PROJECT_INSTANCE_CONFIG_PATHS[slug];
  if (!configPath) {
    return null;
  }

  try {
    const response = await fetch(configPath);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  }
}

async function loadTaxonomyManifest() {
  if (taxonomyManifestPromise) {
    return taxonomyManifestPromise;
  }

  taxonomyManifestPromise = (async () => {
    try {
      const response = await fetch(TAXONOMY_MANIFEST_PATH);
      if (!response.ok) {
        return { projects: [], tagLabelById: new Map() };
      }

      const manifest = await response.json();
      const tags = Array.isArray(manifest.tags) ? manifest.tags : [];
      const projects = Array.isArray(manifest.projects) ? manifest.projects : [];
      const tagLabelById = new Map(
        tags
          .filter((tag) => tag && typeof tag.id === "string")
          .map((tag) => [tag.id, tag.label || tag.id])
      );

      return { projects, tagLabelById };
    } catch {
      return { projects: [], tagLabelById: new Map() };
    }
  })();

  return taxonomyManifestPromise;
}

function findProjectEntry(projects, projectSlug) {
  const currentPage = window.location.pathname.split("/").pop() || "";
  return projects.find(
    (project) => project?.slug === projectSlug || project?.url === currentPage
  );
}

function toTagLabels(tagIds, tagLabelById) {
  if (!Array.isArray(tagIds)) {
    return [];
  }

  return tagIds
    .map((tagId) => tagLabelById.get(tagId))
    .filter((label) => Boolean(label) && label !== "All");
}

async function resolveProjectTagLabels(projectSlug) {
  const { projects, tagLabelById } = await loadTaxonomyManifest();
  const projectEntry = findProjectEntry(projects, projectSlug);

  if (!projectEntry) {
    return [];
  }

  return toTagLabels(projectEntry.tagIds, tagLabelById);
}

function resolveRelatedProjects(currentProject, projects, maxItems = 4) {
  if (!currentProject || !Array.isArray(currentProject.tagIds)) {
    return [];
  }

  // Relatedness is defined by overlapping taxonomy tagIds.
  const currentTagSet = new Set(currentProject.tagIds);
  if (currentTagSet.size === 0) {
    return [];
  }

  return projects
    .filter((project) => {
      if (!project) {
        return false;
      }
      // Never recommend the page currently being viewed.
      if (project.slug && currentProject.slug && project.slug === currentProject.slug) {
        return false;
      }
      if (project.url && currentProject.url && project.url === currentProject.url) {
        return false;
      }
      return true;
    })
    .map((project) => {
      const projectTagIds = Array.isArray(project.tagIds) ? project.tagIds : [];
      const overlapCount = projectTagIds.filter((tagId) => currentTagSet.has(tagId)).length;
      return {
        project,
        overlapCount
      };
    })
    .filter((entry) => entry.overlapCount > 0)
    // Prioritize projects sharing more tags; fall back to title for stable order.
    .sort((a, b) => {
      if (b.overlapCount !== a.overlapCount) {
        return b.overlapCount - a.overlapCount;
      }
      return String(a.project.title || "").localeCompare(String(b.project.title || ""));
    })
    .slice(0, maxItems)
    .map((entry) => entry.project);
}

function renderRelatedWorks(relatedWorksGallery, relatedWorksEmpty, relatedProjects, tagLabelById) {
  if (!relatedWorksGallery) {
    return;
  }

  relatedWorksGallery.innerHTML = "";

  // Show an explicit empty state when no projects share tags.
  if (!Array.isArray(relatedProjects) || relatedProjects.length === 0) {
    if (relatedWorksEmpty) {
      relatedWorksEmpty.hidden = false;
    }
    return;
  }

  if (relatedWorksEmpty) {
    relatedWorksEmpty.hidden = true;
  }

  relatedProjects.forEach((project) => {
    const card = document.createElement("article");
    card.className = "card";

    const link = document.createElement("a");
    link.href = project.url || "#";
    link.className = "work-link";

    const image = document.createElement("img");
    image.src = project.image || "";
    image.alt = project.alt || `${project.title || "Related project"} key art`;

    const title = document.createElement("h3");
    title.textContent = project.title || "Untitled Project";

    const tags = document.createElement("p");
    tags.className = "work-tags";
    tags.textContent = toTagLabels(project.tagIds, tagLabelById).join(" · ");

    link.append(image, title, tags);
    card.appendChild(link);
    relatedWorksGallery.appendChild(card);
  });
}

function toEmbedVideoUrl(url) {
  if (!url) return "";
  if (url.includes("youtube.com/embed/")) return url;

  try {
    const parsed = new URL(url, window.location.origin);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const videoId = parsed.searchParams.get("v");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (host === "youtu.be") {
      const videoId = parsed.pathname.replace(/^\//, "");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    return url;
  } catch {
    return url;
  }
}

function createDetailBlockElement(block, fallbackTitle) {
  if (!block || typeof block !== "object") {
    return null;
  }

  const type = String(block.type || "").toLowerCase();
  if (type === "h1" || type === "h2" || type === "h3" || type === "p") {
    const textNode = document.createElement(type);
    textNode.textContent = block.text || "";
    return textNode;
  }

  if (type === "image") {
    if (!block.src) return null;
    const image = document.createElement("img");
    image.src = block.src;
    image.alt = block.alt || `${fallbackTitle} project detail image`;
    image.className = "project-details-image";
    return image;
  }

  if (type === "video") {
    if (!block.url) return null;
    const frame = document.createElement("div");
    frame.className = "project-details-video-frame";
    const iframe = document.createElement("iframe");
    iframe.src = toEmbedVideoUrl(block.url);
    iframe.title = block.title || `${fallbackTitle} project detail video`;
    iframe.loading = "lazy";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = true;
    frame.appendChild(iframe);
    return frame;
  }

  return null;
}

function renderProjectDetails(detailsContainer, config) {
  if (!detailsContainer) {
    return;
  }

  detailsContainer.innerHTML = "";

  const blocks = config.projectDetails?.blocks;
  if (Array.isArray(blocks) && blocks.length > 0) {
    blocks.forEach((block) => {
      const node = createDetailBlockElement(block, config.title);
      if (node) {
        node.classList.add("project-details-block");
        detailsContainer.appendChild(node);
      }
    });
    return;
  }

  // Backward compatibility for existing projectDetails shape.
  if (config.projectDetails?.initiative) {
    const heading = document.createElement("h3");
    heading.textContent = "Initiative";
    const paragraph = document.createElement("p");
    paragraph.textContent = config.projectDetails.initiative;
    heading.className = "project-details-block";
    paragraph.className = "project-details-block";
    detailsContainer.append(heading, paragraph);
  }

  if (config.projectDetails?.pipeline) {
    const heading = document.createElement("h3");
    heading.textContent = "Research Pipeline";
    const paragraph = document.createElement("p");
    paragraph.textContent = config.projectDetails.pipeline;
    heading.className = "project-details-block";
    paragraph.className = "project-details-block";
    detailsContainer.append(heading, paragraph);
  }

  if (config.projectDetails?.result) {
    const heading = document.createElement("h3");
    heading.textContent = "Research Result";
    const paragraph = document.createElement("p");
    paragraph.textContent = config.projectDetails.result;
    heading.className = "project-details-block";
    paragraph.className = "project-details-block";
    detailsContainer.append(heading, paragraph);
  }

  if (config.projectDetails?.placeholderImage) {
    const imageNode = createDetailBlockElement(
      {
        type: "image",
        src: config.projectDetails.placeholderImage,
        alt: `${config.title} project details image`
      },
      config.title
    );
    if (imageNode) {
      imageNode.classList.add("project-details-block");
      detailsContainer.appendChild(imageNode);
    }
  }

  if (config.projectDetails?.placeholderVideo) {
    const videoNode = createDetailBlockElement(
      {
        type: "video",
        url: config.projectDetails.placeholderVideo,
        title: `${config.title} project details video`
      },
      config.title
    );
    if (videoNode) {
      videoNode.classList.add("project-details-block");
      detailsContainer.appendChild(videoNode);
    }
  }
}

function initMobileOverviewStack(main) {
  const layout = main.querySelector(".project-overview-layout");
  const info = layout?.querySelector(".project-overview-info");
  const detailList = info?.querySelector(".project-detail-list");
  const descriptionSection = info?.querySelector(".project-description-text")?.closest("section");
  const metaSection = info?.querySelector(".project-meta-grid-2col")?.closest("section");
  const tagSection = info?.querySelector(".project-tag-list")?.closest("section");
  const gallery = layout?.querySelector(".project-overview-gallery");
  const mobileBreakpoint = window.matchMedia("(max-width: 980px)");

  if (!layout || !info || !detailList || !descriptionSection || !metaSection || !gallery) {
    return;
  }

  function moveToMobileStack() {
    layout.style.gridTemplateColumns = "minmax(0, 1fr)";
    info.style.width = "100%";
    info.style.maxWidth = "100%";
    gallery.style.width = "100%";
    gallery.style.maxWidth = "100%";
    detailList.append(descriptionSection);
    detailList.append(metaSection);
    detailList.append(gallery);
    if (tagSection) {
      detailList.append(tagSection);
    }
  }

  function moveToDesktopLayout() {
    layout.style.gridTemplateColumns = "";
    info.style.width = "";
    info.style.maxWidth = "";
    gallery.style.width = "";
    gallery.style.maxWidth = "";
    detailList.append(descriptionSection);
    detailList.append(metaSection);
    if (tagSection) {
      detailList.append(tagSection);
    }
    layout.append(gallery);
  }

  function syncOverviewOrder() {
    if (mobileBreakpoint.matches) {
      moveToMobileStack();
      return;
    }
    moveToDesktopLayout();
  }

  syncOverviewOrder();
  mobileBreakpoint.addEventListener("change", syncOverviewOrder);
}

function initProjectGallery(main) {
  const projectGallery = main.querySelector("[data-project-gallery]");
  if (!projectGallery) {
    return;
  }

  const mainImage = projectGallery.querySelector("[data-project-gallery-main]");
  const thumbs = Array.from(projectGallery.querySelectorAll(".project-thumb"));
  if (!mainImage || thumbs.length === 0) {
    return;
  }

  let activeIndex = Math.max(
    0,
    thumbs.findIndex((thumb) => thumb.classList.contains("is-active"))
  );
  let touchStartX = 0;
  let touchEndX = 0;

  function renderProjectGallery(index) {
    const boundedIndex = (index + thumbs.length) % thumbs.length;
    const activeThumb = thumbs[boundedIndex];
    if (!activeThumb) {
      return;
    }

    activeIndex = boundedIndex;
    mainImage.src = activeThumb.dataset.gallerySrc || mainImage.src;
    mainImage.alt = activeThumb.dataset.galleryAlt || mainImage.alt;

    thumbs.forEach((thumb, thumbIndex) => {
      thumb.classList.toggle("is-active", thumbIndex === activeIndex);
    });

    activeThumb.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  thumbs.forEach((thumb, index) => {
    thumb.addEventListener("click", () => renderProjectGallery(index));
  });

  function onSwipe() {
    const distance = touchEndX - touchStartX;
    if (Math.abs(distance) < 40) {
      return;
    }

    if (distance < 0) {
      renderProjectGallery(activeIndex + 1);
      return;
    }

    renderProjectGallery(activeIndex - 1);
  }

  projectGallery.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0].clientX;
    },
    { passive: true }
  );

  projectGallery.addEventListener(
    "touchend",
    (event) => {
      touchEndX = event.changedTouches[0].clientX;
      onSwipe();
    },
    { passive: true }
  );

  renderProjectGallery(activeIndex);
}

async function loadProjectInstanceTemplate() {
  // The host page provides where to mount and which manifest entry to use.
  const root = document.querySelector("[data-project-instance-root]");
  const slug = document.body.dataset.projectSlug;

  // Abort when required runtime context is missing.
  if (!root || !slug) {
    return;
  }

  const config = await loadProjectConfig(slug);
  if (!config) {
    return;
  }

  // Load the shared template markup, then parse it into a detached DOM tree.
  const response = await fetch("template-content.html");
  const html = await response.text();
  const parsed = new DOMParser().parseFromString(html, "text/html");

  // Grab the template sections that are injected into the live page.
  const header = parsed.querySelector("header.top-bar");
  const overlay = parsed.querySelector(".sidebar-overlay");
  const sidebar = parsed.querySelector("nav.sidebar");
  const main = parsed.querySelector("main.project-template-main");

  // Guard against malformed template files.
  if (!header || !overlay || !sidebar || !main) {
    return;
  }

  document.title = `${config.title} | Yujia Max Liu`;

  // Map manifest fields to primary content placeholders.
  const kicker = main.querySelector(".project-kicker");
  const title = main.querySelector("h1");
  const description = main.querySelector(".project-description-text");
  const coverImage = main.querySelector('[data-project-role="cover"]');
  const mainImage = main.querySelector("[data-project-gallery-main]");
  const metaValues = main.querySelectorAll(".project-meta-grid-2col .meta-value");
  const tagList = main.querySelector(".project-tag-list");
  const detailsContainer = main.querySelector("[data-project-details-content]");
  const relatedWorksGallery = main.querySelector("[data-related-works-gallery]");
  const relatedWorksEmpty = main.querySelector("[data-related-works-empty]");

  if (kicker) kicker.textContent = config.kicker;
  if (title) title.textContent = config.title;
  if (description) description.textContent = config.description;

  renderProjectDetails(detailsContainer, config);

  // Set hero and gallery starter image.
  if (coverImage) {
    coverImage.src = config.images.cover;
    coverImage.alt = `${config.title} cover image`;
  }

  if (mainImage) {
    mainImage.src = config.images.thumb_01;
    mainImage.alt = `${config.title} gallery image 1`;
  }

  // Populate thumbnail strip based on thumb_01..thumb_04 keys.
  const thumbButtons = main.querySelectorAll(".project-thumb");
  thumbButtons.forEach((button, index) => {
    const role = `thumb_0${index + 1}`;
    const imageNode = button.querySelector("img");
    const imagePath = config.images[role];
    if (imageNode) {
      imageNode.src = imagePath;
      imageNode.alt = `${config.title} gallery thumbnail ${index + 1}`;
    }
    button.dataset.gallerySrc = imagePath;
  });

  // Fill the 4-column metadata grid in template order.
  if (metaValues.length >= 4) {
    metaValues[0].textContent = config.tools;
    metaValues[1].textContent = config.languages;
    metaValues[2].textContent = config.time;
    metaValues[3].textContent = config.role;
  }

  // Rebuild tag list from taxonomy manifest.
  if (tagList) {
    const projectTagLabels = await resolveProjectTagLabels(slug);
    tagList.innerHTML = "";
    projectTagLabels.forEach((tag) => {
      const item = document.createElement("li");
      item.textContent = tag;
      tagList.appendChild(item);
    });
  }

  // Render related works by overlapping tag IDs from taxonomy.
  const { projects, tagLabelById } = await loadTaxonomyManifest();
  const currentProject = findProjectEntry(projects, slug);
  const relatedProjects = resolveRelatedProjects(currentProject, projects);
  renderRelatedWorks(relatedWorksGallery, relatedWorksEmpty, relatedProjects, tagLabelById);

  // Expose template identity for styling/hooks/debugging.
  main.dataset.projectTemplateSlug = "template-project";
  main.dataset.projectTemplateFolder = "pt-template-project";
  // Prevent home.js template image hydration from overriding JSON-driven image paths.
  main.dataset.projectTemplateAutohydrate = "false";

  // Replace mount content with hydrated template nodes.
  root.innerHTML = "";
  root.append(header, overlay, sidebar, main);
  initMobileOverviewStack(main);
  initProjectGallery(main);

  // Wire the sidebar toggle now that the injected elements are in the DOM.
  // home.js already ran before these elements existed, so its querySelector
  // calls returned null and no listeners were attached. We attach them here.
  initSidebarToggle();
}

function initSidebarToggle() {
  const menuToggle = document.querySelector(".menu-toggle");
  const sidebarEl = document.querySelector(".sidebar");
  const overlayEl = document.querySelector(".sidebar-overlay");
  const mobileBreakpoint = window.matchMedia("(max-width: 980px)");

  if (!menuToggle || !sidebarEl || !overlayEl) {
    return;
  }

  function closeSidebar() {
    sidebarEl.classList.remove("is-open");
    overlayEl.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("sidebar-open");
  }

  function openSidebar() {
    sidebarEl.classList.add("is-open");
    overlayEl.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("sidebar-open");
  }

  menuToggle.addEventListener("click", () => {
    if (sidebarEl.classList.contains("is-open")) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  overlayEl.addEventListener("click", closeSidebar);

  sidebarEl.querySelectorAll("a").forEach((link) => {
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
/*
after root.append(header, overlay, sidebar, main). At that point the elements are guaranteed to be in the live DOM,
so querySelector finds them and all five event listeners(click, overlay click, nav link click, Escape key,
breakpoint change) are correctly attached.
*/

loadProjectInstanceTemplate();
