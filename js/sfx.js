// js/sfx.js — hanya bunyi di tombol, bukan link <a>
(() => {
  const SOURCES = {
    click: "assets/audio/mixkit-arcade-game-jump-coin-216.wav",
    correct: "assets/audio/mixkit-correct-answer-tone-2870.wav",
    wrong: "assets/audio/mixkit-game-show-wrong-answer-buzz-950.wav",
  };

  // Preload + clone
  const pool = {};
  function base(name) {
    if (!pool[name]) {
      const a = new Audio(SOURCES[name]);
      a.preload = "auto";
      a.volume = 0.6;
      pool[name] = a;
    }
    return pool[name];
  }
  function play(name, { volume = 0.6, rate = 1 } = {}) {
    const a = base(name).cloneNode(true);
    a.volume = volume;
    a.playbackRate = rate;
    a.play().catch(() => {});
    window.dispatchEvent(new CustomEvent("sfx:played", { detail: name }));
  }

  // hanya target button, pixel-btn, atau [role="button"]
  const clickableSel = 'button, .pixel-btn, [role="button"]';
  const isClickable = (t) => t?.closest?.(clickableSel);

  // pointerdown = lebih cepat dari click
  document.addEventListener(
    "pointerdown",
    (e) => {
      const el = isClickable(e.target);
      if (!el || el.dataset?.noSfx === "1") return;
      play("click", { volume: 0.55 });
    },
    { capture: true }
  );

  // keyboard support (Enter/Space)
  document.addEventListener(
    "keydown",
    (e) => {
      if (!(e.key === "Enter" || e.key === " ")) return;
      const el = isClickable(e.target);
      if (!el || el.dataset?.noSfx === "1") return;
      play("click", { volume: 0.55 });
    },
    { capture: true }
  );

  window.SFX = {
    play,
    unlock() {
      // iOS unlock
      const a = new Audio(SOURCES.click);
      a.volume = 0.0001;
      a.play().finally(() => {});
    },
  };
})();
