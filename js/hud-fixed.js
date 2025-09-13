document.addEventListener("DOMContentLoaded", () => {
  const bar = document.getElementById("hud-fixed");
  const SHOW_AT = 200; // px scroll sebelum muncul

  const onScroll = () => {
    if (window.scrollY > SHOW_AT) {
      bar.classList.remove(
        "opacity-0",
        "-translate-y-2",
        "pointer-events-none"
      );
    } else {
      bar.classList.add("opacity-0", "-translate-y-2", "pointer-events-none");
    }
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const map = [
    { src: "#hud-level", dst: "#hud-fixed-level", html: false },
    { src: "#hud-score", dst: "#hud-fixed-score", html: false },
    { src: "#hud-lives", dst: "#hud-fixed-lives", html: true },
    { src: "#hud-time", dst: "#hud-fixed-time", html: false },
  ];

  function copyOnce(srcEl, dstEl, useHtml) {
    if (!srcEl || !dstEl) return;
    const v = useHtml ? srcEl.innerHTML : srcEl.textContent;
    if (useHtml) dstEl.innerHTML = v;
    else dstEl.textContent = v;
  }

  // inisialisasi awal
  for (const { src, dst, html } of map) {
    copyOnce(document.querySelector(src), document.querySelector(dst), html);
  }

  // observe perubahan supaya ikut update otomatis
  const obs = new MutationObserver((muts) => {
    for (const mut of muts) {
      const srcEl = mut.target;
      const item = map.find((x) => document.querySelector(x.src) === srcEl);
      if (!item) continue;
      const dstEl = document.querySelector(item.dst);
      copyOnce(srcEl, dstEl, item.html);
    }
  });

  for (const { src } of map) {
    const el = document.querySelector(src);
    if (!el) continue;
    obs.observe(el, { characterData: true, subtree: true, childList: true });
  }
});
