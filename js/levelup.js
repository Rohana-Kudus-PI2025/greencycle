(() => {
  let modal, elPrev, elNext, elScore, btnGo, btnShare, qLoad, qText, qAuthor;

  function grabRefs() {
    modal = document.getElementById("levelup-modal");
    elPrev = document.getElementById("levelup-prev");
    elNext = document.getElementById("levelup-next");
    elScore = document.getElementById("levelup-score");
    btnGo = document.getElementById("levelup-continue");
    btnShare = document.getElementById("levelup-share");
    qLoad = document.getElementById("quote-loading");
    qText = document.getElementById("quote-text");
    qAuthor = document.getElementById("quote-author");
  }

  function setDragEnabled(on) {
    const wrap = document.getElementById("drag-wrap");
    if (wrap) wrap.setAttribute("draggable", on ? "true" : "false");
  }

  function fetchFunFact(apiKey) {
    // pastikan refs ready
    if (!qLoad || !qText || !qAuthor) grabRefs();

    // reset UI
    qLoad?.classList.remove("hidden");
    qText?.classList.add("hidden");
    qAuthor?.classList.add("hidden");

    if (!apiKey) {
      if (qText)
        qText.textContent = "“Consistency beats intensity. Keep sorting.”";
      if (qAuthor) qAuthor.textContent = "— GreenCycle";
      qLoad?.classList.add("hidden");
      qText?.classList.remove("hidden");
      qAuthor?.classList.remove("hidden");
      return;
    }

    fetch("https://api.api-ninjas.com/v1/facts", {
      headers: { "X-Api-Key": apiKey },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((arr) => {
        const fact = arr?.[0]?.fact || "A fun fact a day keeps boredom away.";
        if (qText) qText.textContent = `“${fact}”`;
        if (qAuthor) qAuthor.textContent = "— Fun Fact";
      })
      .catch(() => {
        if (qText) qText.textContent = "“Fun fact lagi ngambek. Coba lagi ya.”";
        if (qAuthor) qAuthor.textContent = "— GreenCycle";
      })
      .finally(() => {
        qLoad?.classList.add("hidden");
        qText?.classList.remove("hidden");
        qAuthor?.classList.remove("hidden");
      });
  }

  // ===== SHARE UTIL =====
  function getFunFactText() {
    const qt = document.getElementById("quote-text");
    const qa = document.getElementById("quote-author");
    const quote =
      qt && !qt.classList.contains("hidden") ? qt.innerText.trim() : "";
    const author =
      qa && !qa.classList.contains("hidden") ? qa.innerText.trim() : "";
    if (quote && author) return `Fun fact: “${quote}” — ${author}`;
    if (quote) return `Fun fact: “${quote}”`;
    return "";
  }

  function composeShare({ level, score }) {
    const fact = getFunFactText();
    const origin = location.origin || "";
    const path = location.pathname || "/game.html";
    const url = origin + path;
    const text = [
      `Baru naik ke Level ${level} di GreenCycle ♻️`,
      `Skor total: ${score}`,
      fact ? fact : "",
      `Coba kamu juga:`,
    ]
      .filter(Boolean)
      .join("\n");
    return { title: "GreenCycle — Level Up!", text, url };
  }

  function openCentered(url, w = 640, h = 640) {
    const y = window.top.outerHeight / 2 + window.top.screenY - h / 2;
    const x = window.top.outerWidth / 2 + window.top.screenX - w / 2;
    return window.open(
      url,
      "_blank",
      `toolbar=0,location=0,status=0,menubar=0,scrollbars=1,resizable=1,width=${w},height=${h},top=${y},left=${x}`
    );
  }

  async function shareLevelUp({ level, score }) {
    const { title, text, url } = composeShare({ level, score });

    // Mobile-first: kalau user agent mobile, default ke WhatsApp
    const isMobile = /Mobi|Android/i.test(navigator.userAgent || "");

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        showToast("✅ Dibagikan!", true);
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return; // user cancel
        // terus ke fallback
      }
    }

    const t = encodeURIComponent(text);
    const u = encodeURIComponent(url);
    const links = {
      x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
      whatsapp: `https://wa.me/?text=${t}%20${u}`,
      telegram: `https://t.me/share/url?url=${u}&text=${t}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    };

    openCentered(isMobile ? links.whatsapp : links.x);

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      showToast("📋 Tersalin juga ke clipboard", true);
    } catch {}
  }

  // ===== DIPANGGIL DARI game.js =====
  function openLevelUpModal({ prevLevel, nextLevel, score, onContinue }) {
    // pastikan refs selalu fresh
    grabRefs();

    if (elPrev) elPrev.textContent = String(prevLevel);
    if (elNext) elNext.textContent = String(nextLevel);
    if (elScore) elScore.textContent = String(score);

    // disable drag biar ga kecolek di belakang modal
    setDragEnabled(false);

    // buka modal
    modal?.classList.remove("hidden");
    modal?.classList.add("flex");

    // ambil fun fact (pakai API key global milikmu)
    fetchFunFact(window.API_NINJAS_KEY);

    // listener sekali jalan
    const onShare = () => {
      window.SFX?.play("click", { volume: 0.6 });
      shareLevelUp({ level: nextLevel, score });
    };
    const onGo = () => {
      window.SFX?.play("click", { volume: 0.6 });
      modal?.classList.add("hidden");
      modal?.classList.remove("flex");
      setDragEnabled(true); // re-enable drag setelah modal ditutup
      onContinue?.();
    };

    btnShare?.addEventListener("click", onShare, { once: true });
    btnGo?.addEventListener("click", onGo, { once: true });
  }

  // === expose ke global supaya game.js bisa manggil ===
  window.openLevelUpModal = openLevelUpModal;
  // (opsional, kalau pengin akses manual dari tempat lain)
  window.shareLevelUp = shareLevelUp;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", grabRefs, { once: true });
  } else {
    grabRefs();
  }
})();
