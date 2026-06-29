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

// Honor the user's OS/browser "reduce motion" preference (vestibular-
// accessibility best practice; aligns with WCAG 2.1 SC 2.3.3 Animation from
// Interactions). CSS neutralizes every transition/animation site-wide via the
// @media (prefers-reduced-motion: reduce) block in style.css, but CSS cannot
// reach programmatic scrolls — so the three JS-driven
// scrollIntoView({behavior:"smooth"}) calls (tag click + hash link in home.js,
// active gallery thumb in project-instance-loader.js) gate on this helper
// instead. Returns false when matchMedia is unavailable (older browsers) so the
// existing smooth-scroll default is preserved as a safe fallback rather than
// silently forced to instant.
function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Populate the ".top-bar-version" pill with the short SHA of the latest commit
// on main. No-ops when the element is absent, so callers may invoke it before
// the top bar exists; on pages where the bar is injected asynchronously (project
// instance pages) the caller should invoke it again once it is in the DOM.
//
// The resolved SHA is cached in sessionStorage and reused across pages within
// the same browsing session. loadVersionTag runs once per page (homepage at
// module load + each project page after the template injects), so without
// caching a visitor browsing N pages makes N unauthenticated GitHub API calls
// against the shared 60-req/hour-per-IP limit; caching collapses that to one
// fetch per session and makes subsequent pages show the version instantly
// instead of re-hitting the API (or leaving the pill empty on a rate-limited
// repeat). sessionStorage (not localStorage) is deliberate: it is scoped to the
// tab and clears when the tab closes, so visitors reach a new deploy's SHA on
// their next session rather than reading a stale one. Storage access is wrapped
// so an unavailable sessionStorage (private mode, disabled storage) silently
// falls back to fetching — same conservative-fallback pattern as
// prefersReducedMotion.
const VERSION_TAG_CACHE_KEY = "maxlyj:version-tag";
async function loadVersionTag() {
  const el = document.querySelector(".top-bar-version");
  if (!el) return;

  let cached;
  try {
    cached = sessionStorage.getItem(VERSION_TAG_CACHE_KEY);
  } catch {
    cached = null;
  }
  if (cached) {
    el.textContent = cached;
    return;
  }

  try {
    const res = await fetch("https://api.github.com/repos/MaxLYJ/maxlyj.github.io/commits?per_page=1&sha=main");
    if (!res.ok) return;
    const commits = await res.json();
    if (commits.length > 0) {
      const label = "Ver " + commits[0].sha.substring(0, 7);
      el.textContent = label;
      try {
        sessionStorage.setItem(VERSION_TAG_CACHE_KEY, label);
      } catch {
        // Storage unavailable — leave uncached; the next page will refetch.
      }
    }
  } catch {}
}
