const PROJECT_INSTANCE_MANIFEST = {
  "project-instance-test": {
    title: "[Project Name Placeholder]",
    kicker: "Project Template Instance",
    description:
      "This is a test instance generated from the shared template. Replace this text with project-specific summary when content is ready.",
    tools: "[Tool A], [Tool B]",
    languages: "[Language A], [Language B]",
    time: "[Timeline Placeholder]",
    role: "[Role Placeholder]",
    tags: ["[Tag 1]", "[Tag 2]", "[Tag 3]"],
    images: {
      cover:
        "Resources/Project Template/pages/pt-template-project/pt_template-project__cover.svg",
      thumb_01:
        "Resources/Project Template/pages/pt-template-project/pt_template-project__thumb_01.svg",
      thumb_02:
        "Resources/Project Template/pages/pt-template-project/pt_template-project__thumb_02.svg",
      thumb_03:
        "Resources/Project Template/pages/pt-template-project/pt_template-project__thumb_03.svg",
      thumb_04:
        "Resources/Project Template/pages/pt-template-project/pt_template-project__thumb_04.svg"
    }
  }
};

async function loadProjectInstanceTemplate() {
  const root = document.querySelector("[data-project-instance-root]");
  const slug = document.body.dataset.projectSlug;

  if (!root || !slug || !PROJECT_INSTANCE_MANIFEST[slug]) {
    return;
  }

  const response = await fetch("template-content.html");
  const html = await response.text();
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const config = PROJECT_INSTANCE_MANIFEST[slug];

  const header = parsed.querySelector("header.top-bar");
  const overlay = parsed.querySelector(".sidebar-overlay");
  const sidebar = parsed.querySelector("nav.sidebar");
  const main = parsed.querySelector("main.project-template-main");

  if (!header || !overlay || !sidebar || !main) {
    return;
  }

  document.title = `${config.title} | Yujia Max Liu`;

  const kicker = main.querySelector(".project-kicker");
  const title = main.querySelector("h1");
  const description = main.querySelector(".project-description-text");
  const coverImage = main.querySelector('[data-project-role="cover"]');
  const mainImage = main.querySelector("[data-project-gallery-main]");
  const metaValues = main.querySelectorAll(".project-meta-grid-2col .meta-value");
  const tagList = main.querySelector(".project-tag-list");

  if (kicker) kicker.textContent = config.kicker;
  if (title) title.textContent = config.title;
  if (description) description.textContent = config.description;

  if (coverImage) {
    coverImage.src = config.images.cover;
    coverImage.alt = `${config.title} cover image`;
  }

  if (mainImage) {
    mainImage.src = config.images.thumb_01;
    mainImage.alt = `${config.title} gallery image 1`;
  }

  const thumbButtons = main.querySelectorAll(".project-thumb");
  thumbButtons.forEach((button, index) => {
    const role = `thumb_0${index + 1}`;
    const imageNode = button.querySelector("img");
    if (imageNode) {
      imageNode.src = config.images[role];
      imageNode.alt = `${config.title} gallery thumbnail ${index + 1}`;
    }
  });

  if (metaValues.length >= 4) {
    metaValues[0].textContent = config.tools;
    metaValues[1].textContent = config.languages;
    metaValues[2].textContent = config.time;
    metaValues[3].textContent = config.role;
  }

  if (tagList) {
    tagList.innerHTML = "";
    config.tags.forEach((tag) => {
      const item = document.createElement("li");
      item.textContent = tag;
      tagList.appendChild(item);
    });
  }

  const relatedCards = main.querySelectorAll("#other-projects .card img");
  if (relatedCards[0]) relatedCards[0].src = config.images.thumb_02;
  if (relatedCards[1]) relatedCards[1].src = config.images.thumb_03;

  main.dataset.projectTemplateSlug = "template-project";
  main.dataset.projectTemplateFolder = "pt-template-project";

  root.innerHTML = "";
  root.append(header, overlay, sidebar, main);

  const script = document.createElement("script");
  script.src = "script.js";
  document.body.appendChild(script);
}

loadProjectInstanceTemplate();
