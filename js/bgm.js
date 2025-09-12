(() => {
  const TRACKS = { level1: "assets/audio/happy-cave-6095.mp3" };

  let current = null;
  let currentName = null;
  let enabled = localStorage.getItem("bgm:enabled") !== "0";
  let targetVolume = parseFloat(localStorage.getItem("bgm:volume") || "0.35");

  function makeAudio(src) {
    const a = new Audio(src);
    a.loop = true;
    a.preload = "auto";
    a.volume = enabled ? targetVolume : 0;
    return a;
  }

  async function play(name) {
    if (currentName === name) return;
    const src = TRACKS[name];
    if (!src) return;

    const next = makeAudio(src);
    currentName = name;

    try {
      await next.play();
    } catch (_) {}

    const fadeMs = 250,
      steps = 10,
      dt = fadeMs / steps;

    if (current) {
      const old = current;
      const start = old.volume;
      let i = 0;
      const fadeOut = setInterval(() => {
        i++;
        old.volume = Math.max(0, start * (1 - i / steps));
        if (i >= steps) {
          clearInterval(fadeOut);
          old.pause();
        }
      }, dt);
    }

    current = next;
    if (!enabled) current.volume = 0;
    else current.volume = targetVolume;
  }

  function stop() {
    if (!current) return;
    current.pause();
    current.currentTime = 0;
    current = null;
    currentName = null;
  }

  function setEnabled(on) {
    enabled = on;
    localStorage.setItem("bgm:enabled", on ? "1" : "0");
    if (current) current.volume = on ? targetVolume : 0;
    if (on && current) current.play().catch(() => {});
  }

  function setVolume(v) {
    targetVolume = Math.max(0, Math.min(1, v));
    localStorage.setItem("bgm:volume", String(targetVolume));
    if (current && enabled) current.volume = targetVolume;
  }

  let duckTimer = null;
  function duck() {
    if (!current || !enabled) return;
    if (duckTimer) clearTimeout(duckTimer);
    const base = targetVolume;
    current.volume = Math.max(0, base * 0.5);
    duckTimer = setTimeout(() => {
      if (current && enabled) current.volume = base;
    }, 350);
  }
  window.addEventListener("sfx:played", duck);

  document.addEventListener("visibilitychange", () => {
    if (!current) return;
    if (document.hidden) current.pause();
    else if (enabled) current.play().catch(() => {});
  });

  // Hook tombol & slider di HUD
  window.addEventListener("DOMContentLoaded", () => {
    const tgl = document.getElementById("music-toggle");
    const vol = document.getElementById("music-volume");
    if (tgl) {
      const render = () => (tgl.textContent = enabled ? "🎵 On" : "🔇 Off");
      render();
      tgl.addEventListener("click", async () => {
        setEnabled(!enabled);
        render();
        if (enabled && !current) await play("level1");
      });
    }
    if (vol) {
      vol.value = String(targetVolume);
      vol.addEventListener("input", (e) =>
        setVolume(parseFloat(e.target.value))
      );
    }
  });

  window.BGM = { play, stop, setEnabled, setVolume };
})();
