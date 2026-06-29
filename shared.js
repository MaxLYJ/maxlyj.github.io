// shared.js — utilities shared by every page's entry-point script.
//
// home.js (homepage) and project-instance-loader.js (project pages) previously
// each carried identical copies of the Cloudflare R2 CDN helper, the GitHub
// "version tag" fetcher, and the taxonomy-manifest path. They are declared here
// once and loaded (as a classic <script>) BEFORE the page-specific script so
// both entry points read a single source of truth.
//
// Classic scripts share the global lexical scope, so top-level `const` and
// `function` declarations here are visible to subsequently-loaded scripts. The
// consumers must NOT redeclare these names, or the browser throws
// "Identifier has already been declared".

// CDN base for project images served from Cloudflare R2.
// Logical paths (e.g. "projects/<slug>/cover.png") are prefixed with this at
// runtime; absolute URLs (http...) pass through unchanged.
const CDN_BASE = "https://pub-dc4e1f00955f4568a77da06925201843.r2.dev";

function toCdnUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return CDN_BASE + "/" + path.replace(/^\/+/, "");
}

// Path to the taxonomy manifest consumed by both the homepage tag system /
// featured carousel and the project-page related-works renderer.
const TAXONOMY_MANIFEST_PATH = "data/taxonomy.json";

// Populate the ".top-bar-version" pill with the short SHA of the latest commit
// on main. No-ops when the element is absent, so callers may invoke it before
// the top bar exists; on pages where the bar is injected asynchronously (project
// instance pages) the caller should invoke it again once it is in the DOM.
async function loadVersionTag() {
  const el = document.querySelector(".top-bar-version");
  if (!el) return;
  try {
    const res = await fetch("https://api.github.com/repos/MaxLYJ/maxlyj.github.io/commits?per_page=1&sha=main");
    if (!res.ok) return;
    const commits = await res.json();
    if (commits.length > 0) {
      el.textContent = "Ver " + commits[0].sha.substring(0, 7);
    }
  } catch {}
}
