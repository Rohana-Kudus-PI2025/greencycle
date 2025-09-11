// ===== Mobile menu
document.getElementById("menu-btn")?.addEventListener("click", () => {
  document.getElementById("menu")?.classList.toggle("hidden");
});

// ===== DOM refs
const itemWrap = document.getElementById("drag-wrap");
const itemName = document.getElementById("item-name");
const itemImg = document.getElementById("item-img");
const scoreEl = document.getElementById("hud-score");
const levelEl = document.getElementById("hud-level");
const toast = document.getElementById("toast");
const toastMsg = document.getElementById("toast-msg");
const timeEl = document.getElementById("hud-time");
const barEl = document.getElementById("hud-progress");
const livesEl = document.getElementById("hud-lives");

const startModal = document.getElementById("start-modal");
const startPlayBtn = document.getElementById("start-play");

let streakTouchedThisSession = false; // guard biar nggak dobel di 1 sesi tab

// ===== Items
const ITEMS = window.ITEMS || [];

const LABEL = {
  food: "Food Scraps",
  recycle: "Recyclable Containers",
  paper: "Paper",
  trash: "Garbage",
};

// ===== LocalStorage Keys
const SCORE_KEY = "sortitout_score_v1";
const LEVEL_KEY = "sortitout_level_v1";
const STREAK_KEY = "sortitout_daily_streak_v1";

// ===== Load persisted state
let score = parseInt(localStorage.getItem(SCORE_KEY) || "0", 10);
let level = parseInt(localStorage.getItem(LEVEL_KEY) || "1", 10);

// === NEW: Date helpers (pakai tanggal lokal user)
function todayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`; // YYYY-MM-DD
}
function diffDays(isoA, isoB) {
  // hitung selisih hari berbasis local time
  const a = new Date(isoA + "T00:00:00");
  const b = new Date(isoB + "T00:00:00");
  const ms = b - a;
  return Math.round(ms / 86400000); // 1000*60*60*24
}

// === NEW: Load streak object
function loadStreak() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { count: 0, longest: 0, lastPlayed: null };
    const obj = JSON.parse(raw);
    return {
      count: Number(obj.count || 0),
      longest: Number(obj.longest || 0),
      lastPlayed: obj.lastPlayed || null,
    };
  } catch {
    return { count: 0, longest: 0, lastPlayed: null };
  }
}

function saveStreak(obj) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(obj));
}

function touchDailyStreak() {
  const today = todayStr();
  const st = loadStreak();

  if (!st.lastPlayed) {
    // pertama kali main
    st.count = 1;
    st.longest = Math.max(st.longest, st.count);
    st.lastPlayed = today;
    saveStreak(st);
    renderStreakHUD(st);
    showToast("🔥 Streak dimulai! +1 hari", true);
    return;
  }

  if (st.lastPlayed === today) {
    // sudah dihitung hari ini, no-op
    renderStreakHUD(st);
    return;
  }

  const gap = diffDays(st.lastPlayed, today);
  if (gap === 1) {
    // lanjut streak
    st.count += 1;
    st.longest = Math.max(st.longest, st.count);
    st.lastPlayed = today;
    saveStreak(st);
    renderStreakHUD(st);
    showToast(`🔥 Streak ${st.count} hari`, true);
  } else if (gap > 1) {
    // putus lebih dari 1 hari → reset ke 1
    st.count = 1;
    st.longest = Math.max(st.longest, st.count);
    st.lastPlayed = today;
    saveStreak(st);
    renderStreakHUD(st);
    showToast("💤 Streak putus. Start lagi: 1", false);
  } else {
    // gap < 0 (jam sistem mundur/aneh) → anggap no-op
    renderStreakHUD(st);
  }
}

// ===== Streak & Level rules
const STREAK_TARGET = 5; // 5 benar beruntun → level up
let streak = 0;

// ===== Lives
const MAX_LIVES = 5;
let lives = MAX_LIVES;

// ===== Mistake log (untuk modal edukasi)
let wrongLog = [];
const wrongSet = new Set();

// ===== Timer
const BASE_TIME = 30;
let t = BASE_TIME;
let timer = null;

// ===== Current item
let currentItem = null;

// ===== Answer lock (anti double-trigger)
let processingAnswer = false;
function withAnswerLock(fn) {
  if (processingAnswer || !running) return;
  processingAnswer = true;
  try {
    fn();
  } finally {
    setTimeout(() => {
      processingAnswer = false;
    }, 0);
  }
}

// ===== Helpers UI
function showToast(text, ok = true) {
  toastMsg.textContent = text;
  toast.classList.remove("hidden");
  toast.classList.toggle("bg-sky-400/30", ok);
  toast.classList.toggle("bg-red-400/30", !ok);
  toast.classList.add("animate-pop");
  setTimeout(() => {
    toast.classList.add("hidden");
    toast.classList.remove("animate-pop");
  }, 1000);
}
function renderLives() {
  const LOST_OPACITY = 0.2;
  livesEl.innerHTML = "";
  const lost = MAX_LIVES - lives;
  for (let i = 0; i < MAX_LIVES; i++) {
    const span = document.createElement("span");
    span.textContent = "♥";
    span.className = "text-red-500";
    if (i < lost) span.style.opacity = LOST_OPACITY;
    livesEl.appendChild(span);
  }
}

// ===== Start gate
let running = false; // game belum jalan sampai user klik "Mulai"

function openStartModal() {
  startModal?.classList.remove("hidden");
  startModal?.classList.add("flex");
}
function closeStartModal() {
  startModal?.classList.add("hidden");
  startModal?.classList.remove("flex");
}

// ===== Timer control
function resetTimer() {
  clearInterval(timer);
  t = BASE_TIME;
  timeEl.textContent = `00:${String(t).padStart(2, "0")}`;
  barEl.style.width = "100%";
  timer = setInterval(tick, 1000);
}

function tick() {
  t -= 1;
  timeEl.textContent = `00:${String(Math.max(0, t)).padStart(2, "0")}`;
  const pct = Math.max(0, (t / BASE_TIME) * 100);
  barEl.style.width = pct + "%";

  if (t > 0 && t <= 5) {
    window.SFX?.play("click", { volume: 0.4, rate: 1.1 }); // simulasi tick
  }

  if (t <= 0) handleTimeUp();
}

// ===== Asset CDN (gambar item)
const CDN =
  window.CDN ||
  "https://cdn.jsdelivr.net/gh/Rohana-Kudus-PI2025/asset-sortItOut@main/";
const FALLBACK = CDN + "_fallback.png";

// 1x global fallback image
itemImg.addEventListener("error", (e) => {
  if (e.target.src !== FALLBACK) e.target.src = FALLBACK;
});
function srcFor(it) {
  return it.img || CDN + (it.file || "");
}

// ===== Item picker
function pickRandomItem() {
  const it = ITEMS[Math.floor(Math.random() * ITEMS.length)];
  currentItem = it;
  itemName.textContent = it.name;
  itemWrap.dataset.category = it.category;
  itemImg.src = srcFor(it);
  itemImg.alt = it.name;
  itemWrap.classList.add("animate-pop");
  setTimeout(() => itemWrap.classList.remove("animate-pop"), 160);

  // reset lock untuk item baru
  processingAnswer = false;
}

// ===== Score & Level helpers
function updateScore(newScore) {
  score = newScore;
  scoreEl.textContent = score;
  localStorage.setItem(SCORE_KEY, String(score));
}
function setLevel(newLevel) {
  level = newLevel;
  levelEl.textContent = `Level ${level}`;
  localStorage.setItem(LEVEL_KEY, String(level));
}
function resetStreak() {
  streak = 0;
}

// === NEW: HUD refs untuk streak
const hudStreak = document.getElementById("hud-streak");
const hudStreakBest = document.getElementById("hud-streak-best");

// === NEW: render HUD streak
function renderStreakHUD(st) {
  if (hudStreak) hudStreak.textContent = `${st.count}🔥`;
  if (hudStreakBest) hudStreakBest.textContent = String(st.longest);
}

// ===== Init HUD
scoreEl.textContent = score;
levelEl.textContent = `Level ${level}`;
renderLives();

// NEW: tampilkan streak saat load halaman
renderStreakHUD(loadStreak());

document.addEventListener("DOMContentLoaded", () => {
  pickRandomItem();
});

// ===== Start button
startPlayBtn?.addEventListener("click", async () => {
  window.SFX?.unlock();
  window.SFX?.play("click", { volume: 0.6 });
  await window.BGM?.play("level1");

  running = true;
  closeStartModal();
  resetTimer();

  // NEW: sekali per sesi
  if (!streakTouchedThisSession) {
    touchDailyStreak();
    streakTouchedThisSession = true;
  }
});

// ===== Correct / Wrong handlers
function handleCorrect(binEl) {
  window.SFX?.play("correct");

  updateScore(score + 1);
  streak += 1;

  if (binEl) {
    binEl.classList.add("animate-pop");
    setTimeout(() => binEl.classList.remove("animate-pop"), 160);
  }

  if (streak >= STREAK_TARGET) {
    const prev = level;
    setLevel(level + 1);

    // pause game & timer saat modal
    running = false;
    clearInterval(timer);

    // butuh levelup.js (openLevelUpModal)
    if (typeof openLevelUpModal === "function") {
      openLevelUpModal({
        prevLevel: prev,
        nextLevel: level,
        score,
        onContinue: () => {
          resetStreak();
          pickRandomItem();
          resetTimer();
          running = true;
        },
      });
    } else {
      // fallback kalau levelup.js belum ada
      showToast(`🚀 Level Up! Now Level ${level}`, true);
      resetStreak();
      pickRandomItem();
      resetTimer();
      running = true;
    }
    return; // stop di sini supaya tidak auto lanjut sebelum user klik
  }

  showToast(`✅ Correct! (${streak}/${STREAK_TARGET})`, true);
  pickRandomItem();
}

function handleWrong(binEl, chosenCategory) {
  window.SFX?.play("wrong");

  showToast("❌ Wrong! Streak reset.", false);
  resetStreak();

  // kurangi nyawa
  lives = Math.max(0, lives - 1);
  renderLives();

  // catat ke log edukasi (UNIQUE by item|chosen)
  const key = `${currentItem.name}|${chosenCategory}`;
  if (!wrongSet.has(key)) {
    wrongSet.add(key);
    wrongLog.push({
      item: currentItem.name,
      chosen: chosenCategory,
      correct: currentItem.category,
      reason: currentItem.explain,
    });
  }

  // habis nyawa → modal
  if (lives === 0) {
    openModal();
    return;
  }

  // item baru, tetap di level ini
  pickRandomItem();
}

function handleTimeUp() {
  window.SFX?.play("wrong");
  clearInterval(timer);
  showToast("⏱️ Time up! -1 life", false);
  resetStreak();

  lives = Math.max(0, lives - 1);
  renderLives();

  // timeout sebagai salah unik
  const key = `${currentItem.name}|timeout`;
  if (!wrongSet.has(key)) {
    wrongSet.add(key);
    wrongLog.push({
      item: currentItem.name,
      chosen: "timeout",
      correct: currentItem.category,
      reason: `Kehabisan waktu. ${currentItem.explain}`,
    });
  }

  if (lives === 0) {
    openModal();
    return;
  }

  pickRandomItem();
  resetTimer();
}

// ===== Drag source (1x, pakai guard running)
itemWrap.addEventListener("dragstart", (e) => {
  if (!running) {
    e.preventDefault();
    return;
  }
  e.dataTransfer.setData("text/plain", itemWrap.dataset.category);
  itemWrap.classList.add("ring-2", "ring-emerald-300");
});
itemWrap.addEventListener("dragend", () => {
  itemWrap.classList.remove("ring-2", "ring-emerald-300");
  document
    .querySelectorAll(".bin")
    .forEach((b) =>
      b.classList.remove("ring-2", "ring-emerald-300/60", "ring-red-400/60")
    );
});

// ===== Drop targets (single source of truth)
document.querySelectorAll(".bin").forEach((bin) => {
  bin.addEventListener("dragover", (e) => e.preventDefault());

  bin.addEventListener("dragenter", (e) => {
    e.preventDefault();
    bin.classList.add("ring-2", "ring-emerald-300/60");
  });

  bin.addEventListener("dragleave", () =>
    bin.classList.remove("ring-2", "ring-emerald-300/60")
  );

  bin.addEventListener("drop", (e) => {
    e.preventDefault();
    if (!running) return;

    const from = e.dataTransfer.getData("text/plain");
    const to = bin.dataset.category;

    bin.classList.remove("ring-2", "ring-emerald-300/60", "ring-red-400/60");

    withAnswerLock(() => {
      if (from === to) handleCorrect(bin);
      else handleWrong(bin, to);
    });
  });

  // Click fallback (mobile) — juga lewat lock
  bin.addEventListener("click", () => {
    if (!running) return;
    const from = itemWrap.dataset.category;
    const to = bin.dataset.category;

    withAnswerLock(() => {
      if (from === to) handleCorrect(bin);
      else handleWrong(bin, to);
    });
  });
});

// ===== Reset progress button
document.getElementById("reset")?.addEventListener("click", () => {
  localStorage.removeItem(SCORE_KEY);
  localStorage.removeItem(LEVEL_KEY);
  updateScore(0);
  setLevel(1);
  resetStreak();
  lives = MAX_LIVES;
  renderLives();
  wrongLog = [];
  wrongSet.clear();
  resetTimer();
  showToast("🔄 Progress reset", true);
});

// ===== Modal: review mistakes
const modal = document.getElementById("modal");
const modalClose = document.getElementById("modal-close");
const modalRetry = document.getElementById("modal-retry");
const mistakesList = document.getElementById("mistakes-list");

function openModal() {
  mistakesList.innerHTML = "";
  if (wrongLog.length === 0) {
    mistakesList.innerHTML =
      '<p class="text-white/70 text-sm">Tidak ada kesalahan yang tercatat.</p>';
  } else {
    wrongLog.forEach((m, i) => {
      const el = document.createElement("div");
      el.className = "rounded-lg bg-white/10 border border-white/10 p-3";
      el.innerHTML = `
        <div class="text-sm font-semibold mb-1">${i + 1}. ${m.item}</div>
        <div class="text-xs text-slate-800 mb-1">Pilihanmu: <span class="font-semibold">
          ${LABEL[m.chosen] || m.chosen}
        </span></div>
        <div class="text-xs text-emerald-300 mb-1">Seharusnya: <span class="font-semibold">
          ${LABEL[m.correct] || m.correct}
        </span></div>
        <div class="text-xs text-slate-800">Alasan: ${m.reason}</div>
      `;
      mistakesList.appendChild(el);
    });
  }
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}
function closeModal() {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}
modalClose?.addEventListener("click", closeModal);
modalRetry?.addEventListener("click", () => {
  lives = MAX_LIVES;
  renderLives();
  resetStreak();
  wrongLog = [];
  wrongSet.clear();
  resetTimer();
  closeModal();
  showToast("🔁 Retry level", true);
});
