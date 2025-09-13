/* =========================================================
   GreenCycle — LevelUp (continue only)
   ========================================================= */
(() => {
  let modal, elPrev, elNext, elScore, btnGo, qLoad, qText, qAuthor;

  function grabRefs() {
    modal = document.getElementById("levelup-modal");
    elPrev = document.getElementById("levelup-prev");
    elNext = document.getElementById("levelup-next");
    elScore = document.getElementById("levelup-score");
    btnGo = document.getElementById("levelup-continue");
    qLoad = document.getElementById("quote-loading");
    qText = document.getElementById("quote-text");
    qAuthor = document.getElementById("quote-author");

    if (btnGo && !btnGo.type) btnGo.type = "button"; // safety
  }

  function setDragEnabled(on) {
    const wrap = document.getElementById("drag-wrap");
    if (wrap) wrap.setAttribute("draggable", on ? "true" : "false");
  }

  function fetchFunFact(apiKey) {
    if (!qLoad || !qText || !qAuthor) grabRefs();

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

  function openLevelUpModal({ prevLevel, nextLevel, score, onContinue }) {
    grabRefs();

    if (elPrev) elPrev.textContent = String(prevLevel);
    if (elNext) elNext.textContent = String(nextLevel);
    if (elScore) elScore.textContent = String(score);

    setDragEnabled(false);

    modal?.classList.remove("hidden");
    modal?.classList.add("flex");

    fetchFunFact(window.API_NINJAS_KEY);

    const onGo = (e) => {
      e?.preventDefault?.();
      window.SFX?.play("click", { volume: 0.6 });
      modal?.classList.add("hidden");
      modal?.classList.remove("flex");
      setDragEnabled(true);
      onContinue?.();
    };

    // penting: HANYA bind tombol lanjut; tidak ada share di file ini
    btnGo?.addEventListener("click", onGo, { once: true, capture: true });
  }

  // expose buat game.js
  window.openLevelUpModal = openLevelUpModal;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", grabRefs, { once: true });
  } else {
    grabRefs();
  }
})();
