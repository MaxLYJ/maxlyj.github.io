const yearElement = document.getElementById("year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

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
