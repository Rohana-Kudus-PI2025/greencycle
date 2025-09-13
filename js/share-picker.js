(() => {
  let modalShare, btnWA, btnX, btnTG, btnFB, btnCopy, btnCancel;
  let payload = null;

  function grabRefs() {
    modalShare = document.getElementById("share-modal");
    btnWA = document.getElementById("share-wa");
    btnX = document.getElementById("share-x");
    btnTG = document.getElementById("share-tg");
    btnFB = document.getElementById("share-fb");
    btnCopy = document.getElementById("share-copy");
    btnCancel = document.getElementById("share-cancel");

    // tombol Share utama (#levelup-share)
    const btnOpenShare = document.getElementById("levelup-share");
    if (btnOpenShare) {
      btnOpenShare.addEventListener("click", () => {
        window.SFX?.play("click", { volume: 0.6 });

        const level =
          document.getElementById("levelup-next")?.textContent || "1";
        const score =
          document.getElementById("levelup-score")?.textContent || "0";
        const fact = document.getElementById("quote-text")?.innerText || "";

        const text = [
          `🔥 Aku baru naik ke Level ${level} di GreenCycle!`,
          `🌱 Skorku sekarang: ${score}`,
          fact ? fact : "",
          `Yuk coba main dan buktikan kalau kamu lebih jago ♻️`,
        ]
          .filter(Boolean)
          .join("\n");

        payload = {
          title: "GreenCycle — Level Up!",
          text,
          url: location.href,
        };

        // buka modal share
        openShareModal();
      });
    }
  }

  function openShareModal() {
    modalShare?.classList.remove("hidden");
    modalShare?.classList.add("flex");
  }

  function closeShareModal() {
    modalShare?.classList.add("hidden");
    modalShare?.classList.remove("flex");
    payload = null;
  }

  async function shareTo(target) {
    if (!payload) return;
    const { title, text, url } = payload;
    const t = encodeURIComponent(`${text}\n${url}`);
    const u = encodeURIComponent(url);

    const links = {
      wa: `https://wa.me/?text=${t}`,
      x: `https://twitter.com/intent/tweet?text=${t}`,
      tg: `https://t.me/share/url?text=${t}&url=${u}`,
      fb: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    };

    if (links[target]) {
      window.open(links[target], "_blank", "width=600,height=600");
    }
    closeShareModal();
  }

  function bindShareButtons() {
    btnWA?.addEventListener("click", () => shareTo("wa"));
    btnX?.addEventListener("click", () => shareTo("x"));
    btnTG?.addEventListener("click", () => shareTo("tg"));
    btnFB?.addEventListener("click", () => shareTo("fb"));
    btnCopy?.addEventListener("click", () => {
      if (!payload) return;
      navigator.clipboard
        .writeText(`${payload.text}\n${payload.url}`)
        .then(() => {
          showToast?.("📋 Disalin ke clipboard", true);
        });
      closeShareModal();
    });
    btnCancel?.addEventListener("click", closeShareModal);

    modalShare?.addEventListener("click", (e) => {
      if (e.target === modalShare) closeShareModal();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        grabRefs();
        bindShareButtons();
      },
      { once: true }
    );
  } else {
    grabRefs();
    bindShareButtons();
  }
})();
