document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.getElementById("openMenu");
  const mobileMenu = document.getElementById("mobileMenu");
  const iconHamburger = document.getElementById("iconHamburger");
  const iconClose = document.getElementById("iconClose");

  function markActiveLinks() {
    const current = (
      location.pathname.split("/").pop() || "index.html"
    ).toLowerCase();

    const links = document.querySelectorAll("#siteHeader nav a, #mobileMenu a");
    links.forEach((a) => {
      const href = a.getAttribute("href");
      if (!href) return;

      const file = (
        new URL(href, location.href).pathname.split("/").pop() || "index.html"
      ).toLowerCase();

      if (file === current) {
        a.classList.add("is-active");
        a.setAttribute("aria-current", "page");
      }
    });
  }

  function setMenuOpen(isOpen) {
    if (!mobileMenu || !menuButton) return;
    mobileMenu.classList.toggle("hidden", !isOpen);
    document.body.classList.toggle("overflow-hidden", isOpen);
    menuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");

    if (iconHamburger) iconHamburger.classList.toggle("hidden", isOpen);
    if (iconClose) iconClose.classList.toggle("hidden", !isOpen);
  }

  function wireMobileMenu() {
    if (!menuButton || !mobileMenu) return;

    menuButton.addEventListener("click", () => {
      const willOpen = mobileMenu.classList.contains("hidden");
      setMenuOpen(willOpen);
    });

    document.querySelectorAll("#mobileMenu a").forEach((a) => {
      a.addEventListener("click", () => setMenuOpen(false));
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    });
  }

  markActiveLinks();
  wireMobileMenu();
});