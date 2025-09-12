(() => {
  "use strict";

  // ===== helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ===== nav: active link highlighter
  function markActiveLinks() {
    try {
      const here = (
        location.pathname.split("/").pop() || "index.html"
      ).toLowerCase();
      const links = $$("header nav a, #mobileMenu a");
      links.forEach((a) => {
        const href = a.getAttribute("href");
        if (!href) return;

        const url = new URL(href, location.href);
        const file = (
          url.pathname.split("/").pop() || "index.html"
        ).toLowerCase();

        const matchFile = file === here;
        const matchHash =
          href.startsWith("#") &&
          here === "index.html" &&
          url.hash === location.hash &&
          url.hash !== "";

        if (matchFile || matchHash) {
          a.classList.add("is-active");
          a.setAttribute("aria-current", "page");
        }
      });
    } catch {}
  }

  // ===== header theme (transparent/solid) + mobile menu toggle
  function headerControls() {
    const headerEl = $("#siteHeader");
    const pinStage = $("#pin-stage");
    const btn = $("#openMenu");
    const menu = $("#mobileMenu");
    const iconHamburger = $("#iconHamburger");
    const iconClose = $("#iconClose");
    if (!headerEl) return;

    const setIconTheme = (isSolid) => {
      const setSrc = (el, attr) =>
        el && el.setAttribute("src", el.dataset[attr]);
      if (isSolid) {
        setSrc(iconHamburger, "srcLight");
        setSrc(iconClose, "srcLight");
        btn && btn.classList.remove("text-white");
        btn && btn.classList.add("text-slate-800");
      } else {
        setSrc(iconHamburger, "srcDark");
        setSrc(iconClose, "srcDark");
        btn && btn.classList.remove("text-slate-800");
        btn && btn.classList.add("text-white");
      }
    };

    function applyHeader(transparent) {
      headerEl.classList.toggle("header-transparent", transparent);
      headerEl.classList.toggle("header-solid", !transparent);
      setIconTheme(!transparent);
    }

    function updateHeaderState() {
      if (!pinStage) return;
      const r = pinStage.getBoundingClientRect();
      const inSticky = r.top <= 0 && r.bottom >= window.innerHeight;
      applyHeader(inSticky);
    }

    // mobile menu
    if (btn && menu && iconHamburger && iconClose) {
      btn.addEventListener("click", () => {
        menu.classList.toggle("hidden");
        iconHamburger.classList.toggle("hidden");
        iconClose.classList.toggle("hidden");

        const opened = !menu.classList.contains("hidden");
        if (opened) {
          applyHeader(false); // paksa solid biar kontras
        } else {
          updateHeaderState();
        }
      });
    }

    // initial + listeners
    document.addEventListener("DOMContentLoaded", updateHeaderState);
    window.addEventListener("scroll", updateHeaderState, { passive: true });
    window.addEventListener("resize", updateHeaderState);
    window.addEventListener("hashchange", updateHeaderState);
    updateHeaderState();
  }

  // ===== hero swiper
  function initHeroSwiper() {
    if (!$(".swiper") || !window.Swiper) return;
    new Swiper(".swiper", {
      loop: true,
      autoplay: { delay: 4500 },
      speed: 700,
      pagination: { el: ".swiper-pagination", clickable: true },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
    });
  }

  // ===== roll-in reveal observer
  function initRollObserver() {
    const heroFrame = $("#heroFrame");
    const rollBox = $("#rollBox");
    if (!heroFrame || !rollBox || !("IntersectionObserver" in window)) return;

    const ioRoll = new IntersectionObserver(
      ([entry]) => {
        rollBox.classList.toggle("roll-active", entry.isIntersecting);
      },
      { threshold: 0.06 }
    );
    ioRoll.observe(heroFrame);
  }

  // ===== snap scroll ke hero saat melewati pin-stage
  function initScrollSnap() {
    const stageEl = $("#pin-stage");
    const heroEl = $("#heroFrame");
    if (!stageEl || !heroEl) return;

    let ticking = false;
    let didSnap = false;
    let lastY = window.scrollY;

    window.addEventListener(
      "scroll",
      () => {
        if (ticking || didSnap) {
          lastY = window.scrollY;
          return;
        }
        ticking = true;

        requestAnimationFrame(() => {
          const stage = stageEl.getBoundingClientRect();
          const heroTop = heroEl.getBoundingClientRect().top;

          const scrollingDown = window.scrollY > lastY;
          lastY = window.scrollY;

          if (
            scrollingDown &&
            stage.bottom < window.innerHeight * 0.9 &&
            stage.bottom > window.innerHeight * 0.1 &&
            heroTop > 4
          ) {
            didSnap = true;
            heroEl.scrollIntoView({ behavior: "smooth", block: "start" });
            // untuk mengizinkan snap ulang saat user scroll balik, uncomment:
            // setTimeout(() => { didSnap = false; }, 800);
          }

          ticking = false;
        });
      },
      { passive: true }
    );
  }

  // ===== Canvas animasi (crane mengangkat & memilah) di heroFrame
  function initHeroCraneScene() {
    const frame = $("#heroFrame");
    const stage = $("#stageSlot");
    const bgCanvas = $("#frameBG");
    const fgCanvas = $("#frameFG");
    if (!frame || !stage || !bgCanvas || !fgCanvas) return;

    const bg = bgCanvas.getContext("2d");
    const fg = fgCanvas.getContext("2d");

    let FW = 0,
      FH = 0,
      SW = 0,
      SH = 0,
      SOX = 0,
      SOY = 0;
    let beamY = 80,
      groundY = 0;
    let bins = [];
    const TYPES = ["paper", "plastic", "glass", "metal"];
    let items = [];
    const crane = {
      x: 0,
      targetX: 0,
      y: 0,
      cable: 0,
      maxCable: 0,
      speed: 2.2,
      holding: null,
      state: "moveToItem",
    };

    function fitCanvas(c, ctx, w, h) {
      const d = window.devicePixelRatio || 1;
      c.width = Math.max(1, Math.floor(w * d));
      c.height = Math.max(1, Math.floor(h * d));
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    function rr(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    const rand = (a, b) => Math.random() * (b - a) + a;
    const moveTowards = (v, t, s) =>
      Math.abs(t - v) < s ? t : v + Math.sign(t - v) * s;

    function measure() {
      const fr = frame.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      FW = Math.max(320, fr.width);
      FH = Math.max(240, fr.height);
      fitCanvas(bgCanvas, bg, FW, FH);
      fitCanvas(fgCanvas, fg, FW, FH);
      SW = Math.max(240, sr.width);
      SH = Math.max(200, sr.height);
      SOX = sr.left - fr.left;
      SOY = sr.top - fr.top;

      beamY = Math.max(48, SH * 0.16);
      groundY = SH - Math.max(72, SH * 0.2);

      const margin = 20;
      const binW = Math.min(108, (SW - margin * 2) / 4.6);
      const gap = (SW - margin * 2 - binW * 4) / 3;
      const colors = ["#f59e0b", "#10b981", "#3b82f6", "#ef4444"];
      const labels = ["KERTAS", "PLASTIK", "KACA", "LOGAM"];

      bins = [];
      for (let i = 0; i < 4; i++) {
        const x = margin + i * (binW + gap);
        const y = groundY - 88;
        bins.push({
          x,
          y,
          w: binW,
          h: 88,
          color: colors[i],
          label: labels[i],
          type: TYPES[i],
        });
      }
      crane.y = beamY + 10;
      crane.maxCable = Math.max(200, SH * 0.58);
    }

    const RO =
      "ResizeObserver" in window ? new ResizeObserver(() => measure()) : null;
    RO && RO.observe(frame);
    RO && RO.observe(stage);
    window.addEventListener("resize", measure);
    if (document.fonts && document.fonts.ready)
      document.fonts.ready.then(measure);

    function spawnItems(n = 6) {
      items = [];
      for (let i = 0; i < n; i++) {
        const type = TYPES[i % TYPES.length];
        items.push({
          id: i,
          type,
          x: rand(60, SW - 60),
          y: rand(beamY + 90, groundY - 46),
          r: 15,
          done: false,
        });
      }
    }
    const chooseNextItem = () => {
      const c = items.find((i) => !i.done);
      if (!c) {
        spawnItems(6);
        return items[0];
      }
      return c;
    };

    let t = 0;
    const reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function update() {
      if (reduceMotion) return;
      t += 1;
      const hookX = crane.x,
        hookY = crane.y + crane.cable;

      if (crane.state === "moveToItem") {
        const it = chooseNextItem();
        crane.targetX = it.x;
        crane.x = moveTowards(crane.x, crane.targetX, crane.speed);
        if (Math.abs(crane.x - crane.targetX) < 0.8)
          crane.state = "lowerToGrab";
      } else if (crane.state === "lowerToGrab") {
        const it = chooseNextItem();
        const targetCable = Math.min(
          crane.maxCable,
          Math.max(60, it.y - crane.y)
        );
        crane.cable = moveTowards(crane.cable, targetCable, 4.8);
        if (Math.hypot(it.x - hookX, it.y - hookY) < it.r + 12) {
          crane.holding = it;
          crane.state = "raiseWithItem";
        }
        if (crane.cable >= crane.maxCable - 1) crane.state = "raiseWithItem";
      } else if (crane.state === "raiseWithItem") {
        crane.cable = moveTowards(crane.cable, 0, 6.0);
        if (crane.holding) {
          crane.holding.x = hookX;
          crane.holding.y = hookY + 8;
        }
        if (crane.cable <= 0.1) {
          const b = bins.find((b) => b.type === crane.holding.type);
          crane.targetX = b.x + b.w / 2;
          crane.state = "moveToBin";
        }
      } else if (crane.state === "moveToBin") {
        crane.x = moveTowards(crane.x, crane.targetX, crane.speed * 1.6);
        if (crane.holding) {
          crane.holding.x = hookX;
          crane.holding.y = hookY + 8;
        }
        if (Math.abs(crane.x - crane.targetX) < 0.8)
          crane.state = "lowerToDrop";
      } else if (crane.state === "lowerToDrop") {
        crane.cable = moveTowards(crane.cable, Math.min(260, SH - 110), 5.2);
        if (crane.holding) {
          crane.holding.x = hookX;
          crane.holding.y = hookY + 8;
        }
        if (hookY >= bins.find((b) => b.type === crane.holding.type).y + 6)
          crane.state = "release";
      } else if (crane.state === "release") {
        if (crane.holding) {
          const b = bins.find((b) => b.type === crane.holding.type);
          crane.holding.x = b.x + b.w / 2;
          crane.holding.y = b.y + b.h - 12;
          crane.holding.done = true;
          crane.holding = null;
        }
        crane.state = "raiseEmpty";
      } else if (crane.state === "raiseEmpty") {
        crane.cable = moveTowards(crane.cable, 0, 6.0);
        if (crane.cable <= 0.1) crane.state = "moveToItem";
      }
    }

    function drawBackground() {
      bg.clearRect(0, 0, FW, FH);

      // langit
      const sky = bg.createLinearGradient(0, 0, 0, FH);
      sky.addColorStop(0, "#f1f5f9");
      sky.addColorStop(1, "#ffffff");
      bg.fillStyle = sky;
      bg.fillRect(0, 0, FW, FH);

      // awan
      bg.fillStyle = "#e5e7eb";
      [
        [120, 60],
        [240, 40],
        [420, 70],
        [680, 50],
        [900, 90],
      ].forEach((c) => {
        bg.beginPath();
        bg.arc(c[0], c[1], 16, 0, Math.PI * 2);
        bg.arc(c[0] + 18, c[1] - 8, 12, 0, Math.PI * 2);
        bg.arc(c[0] + 36, c[1], 16, 0, Math.PI * 2);
        bg.fill();
      });

      // tanah
      const groundYAbs = SOY + groundY;
      bg.fillStyle = "#d1fae5";
      bg.fillRect(0, groundYAbs, FW, FH - groundYAbs);
      bg.fillStyle = "#a7f3d0";
      bg.beginPath();
      bg.moveTo(0, groundYAbs);
      bg.bezierCurveTo(
        FW * 0.2,
        groundYAbs - 24,
        FW * 0.35,
        groundYAbs - 10,
        FW * 0.5,
        groundYAbs - 26
      );
      bg.bezierCurveTo(
        FW * 0.7,
        groundYAbs - 44,
        FW * 0.82,
        groundYAbs - 8,
        FW,
        groundYAbs - 22
      );
      bg.lineTo(FW, FH);
      bg.lineTo(0, FH);
      bg.closePath();
      bg.fill();

      // kaki & rel beam
      const x0 = SOX,
        y0 = SOY;
      bg.strokeStyle = "#9aa0a6";
      bg.lineWidth = 4;
      const legL = x0 + 16,
        legR = x0 + SW - 16;
      bg.beginPath();
      bg.moveTo(legL, y0 + beamY);
      bg.lineTo(legL, y0 + groundY);
      bg.stroke();
      bg.beginPath();
      bg.moveTo(legR, y0 + beamY);
      bg.lineTo(legR, y0 + groundY);
      bg.stroke();

      bg.strokeStyle = "#c1c7cf";
      bg.lineWidth = 2;
      for (let y = y0 + beamY; y < y0 + groundY; y += 22) {
        bg.beginPath();
        bg.moveTo(legL, y);
        bg.lineTo(legL + 14, y + 18);
        bg.stroke();
        bg.beginPath();
        bg.moveTo(legR, y);
        bg.lineTo(legR - 14, y + 18);
        bg.stroke();
      }

      bg.fillStyle = "#9aa0a6";
      bg.fillRect(x0, y0 + beamY - 8, SW, 8);
      bg.fillStyle = "#b4bac2";
      bg.fillRect(x0, y0 + beamY - 14, SW, 6);
      bg.strokeStyle = "#7b8087";
      bg.lineWidth = 2;
      bg.beginPath();
      bg.moveTo(x0, y0 + beamY - 16);
      bg.lineTo(x0 + SW, y0 + beamY - 16);
      bg.stroke();

      // troli
      const trolleyY = y0 + beamY - 18,
        trW = 56,
        trH = 24;
      const tx = Math.max(
        x0 + 24,
        Math.min(x0 + SW - 24 - trW, x0 + crane.x - trW / 2)
      );
      bg.fillStyle = "#4b5563";
      [tx + 10, tx + trW - 10].forEach((rx) => {
        bg.beginPath();
        bg.arc(rx, trolleyY + trH + 4, 5, 0, Math.PI * 2);
        bg.fill();
      });
      rr(bg, tx, trolleyY, trW, trH, 6);
      bg.fillStyle = "#374151";
      bg.fill();
      for (let i = 0; i < trW; i += 10) {
        bg.fillStyle = (i / 10) % 2 === 0 ? "#fbbf24" : "#111827";
        bg.fillRect(tx + i, trolleyY + trH - 8, 10, 8);
      }

      // tempat pilah
      bg.textAlign = "center";
      bg.textBaseline = "middle";
      bg.font = "bold 13px ui-sans-serif,system-ui";
      const labels = ["KERTAS", "PLASTIK", "KACA", "LOGAM"];
      const colors = ["#f59e0b", "#10b981", "#3b82f6", "#ef4444"];
      bins.forEach((b, i) => {
        bg.fillStyle = colors[i];
        rr(bg, x0 + b.x, y0 + b.y, b.w, b.h, 10);
        bg.fill();
        bg.fillStyle = "#eceff1";
        bg.fillRect(x0 + b.x - 3, y0 + b.y - 10, b.w + 6, 10);
        bg.fillStyle = "#1f2937";
        bg.beginPath();
        bg.arc(x0 + b.x + 14, y0 + b.y + b.h, 7, 0, Math.PI * 2);
        bg.fill();
        bg.beginPath();
        bg.arc(x0 + b.x + b.w - 14, y0 + b.y + b.h, 7, 0, Math.PI * 2);
        bg.fill();
        bg.fillStyle = "#fff";
        bg.fillText(labels[i], x0 + b.x + b.w / 2, y0 + b.y + b.h / 2);
      });

      // item di tanah
      items.forEach((it) => {
        if (crane.holding && it.id === crane.holding.id) return;
        bg.fillStyle = "rgba(0,0,0,.08)";
        bg.beginPath();
        bg.ellipse(
          x0 + it.x,
          y0 + it.y + it.r,
          it.r * 0.9,
          5,
          0,
          0,
          Math.PI * 2
        );
        bg.fill();
        bg.fillStyle = "#fff";
        bg.beginPath();
        bg.arc(x0 + it.x, y0 + it.y, it.r, 0, Math.PI * 2);
        bg.fill();
        const emoji = { paper: "📄", plastic: "🧴", glass: "🍾", metal: "🥫" }[
          it.type
        ];
        bg.font =
          "16px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, ui-sans-serif";
        bg.fillText(emoji, x0 + it.x, y0 + it.y + 1);
      });
    }

    function drawForeground() {
      fg.clearRect(0, 0, FW, FH);
      const swing = Math.sin(t * 0.08) * Math.min(18, crane.cable * 0.05 + 6);
      const hookX = SOX + crane.x + swing;
      const hookY = SOY + crane.y + crane.cable;

      fg.strokeStyle = "#94a3b8";
      fg.lineWidth = 3;
      fg.beginPath();
      fg.moveTo(SOX + crane.x, SOY + beamY + 6);
      fg.lineTo(hookX, hookY - 18);
      fg.stroke();

      const blockW = 26,
        blockH = 22,
        bx = hookX - blockW / 2,
        by = hookY - 22;
      fg.fillStyle = "#6b7280";
      fg.beginPath();
      fg.moveTo(bx + 6, by);
      fg.arcTo(bx + blockW, by, bx + blockW, by + blockH, 6);
      fg.arcTo(bx + blockW, by + blockH, bx, by + blockH, 6);
      fg.arcTo(bx, by + blockH, bx, by, 6);
      fg.arcTo(bx, by, bx + blockW, by, 6);
      fg.closePath();
      fg.fill();
      fg.fillStyle = "#9ca3af";
      fg.beginPath();
      fg.arc(hookX - 6, by + 8, 3, 0, Math.PI * 2);
      fg.fill();
      fg.beginPath();
      fg.arc(hookX + 6, by + 8, 3, 0, Math.PI * 2);
      fg.fill();

      fg.strokeStyle = "#374151";
      fg.lineWidth = 5;
      fg.lineCap = "round";
      fg.beginPath();
      fg.moveTo(hookX, hookY - 4);
      fg.lineTo(hookX, hookY + 10);
      fg.arc(hookX + 10, hookY + 10, 10, Math.PI, Math.PI * 1.6, false);
      fg.stroke();

      if (crane.holding) {
        const it = crane.holding;
        const emoji = { paper: "📄", plastic: "🧴", glass: "🍾", metal: "🥫" }[
          it.type
        ];
        fg.fillStyle = "rgba(0,0,0,.06)";
        fg.beginPath();
        fg.ellipse(hookX, hookY + it.r + 8, it.r * 0.9, 4, 0, 0, Math.PI * 2);
        fg.fill();
        fg.fillStyle = "#fff";
        fg.beginPath();
        fg.arc(hookX, hookY + 8, it.r, 0, Math.PI * 2);
        fg.fill();
        fg.font =
          "16px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, ui-sans-serif";
        fg.textAlign = "center";
        fg.textBaseline = "middle";
        fg.fillText(emoji, hookX, hookY + 9);
      }
    }

    function loop() {
      update();
      drawBackground();
      drawForeground();
      requestAnimationFrame(loop);
    }
    function initScene() {
      spawnItems(6);
      crane.x = SW - 80;
      crane.y = beamY + 10;
      crane.maxCable = Math.max(220, SH * 0.6);
    }
    function init() {
      measure();
      initScene();
      loop();
    }
    init();
  }

  // ===== boot
  document.addEventListener("DOMContentLoaded", () => {
    markActiveLinks();
    headerControls();
    initHeroSwiper();
    initRollObserver();
    initScrollSnap();
    initHeroCraneScene();
  });
})();
