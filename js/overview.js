// Animate counters (desimal + suffix)
const counters = document.querySelectorAll(".counter");
const ioCounters = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.target || "0");
      const suffix = el.dataset.suffix || "";
      const decimals = String(el.dataset.target).includes(".") ? 1 : 0;
      const dur = 1200;
      const start = performance.now();
      function tick(now) {
        const p = Math.min(1, (now - start) / dur);
        const val = target * (0.08 + 0.92 * p * p);
        el.textContent = (decimals ? val.toFixed(1) : Math.floor(val)) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      ioCounters.unobserve(el);
    });
  },
  { threshold: 0.4 }
);
counters.forEach((c) => ioCounters.observe(c));

const imgA = document.getElementById("imgA");
const imgB = document.getElementById("imgB");
const imgC = document.getElementById("imgC");
const imgD = document.getElementById("imgD");
const mainButton = document.getElementById("mainButton");

// -------------------
// Posisi awal imgA
// -------------------
const parentRect = imgA.parentElement.getBoundingClientRect();
const rectStart = imgA.getBoundingClientRect();
const startPos = {
  left: rectStart.left - parentRect.left + "px",
  top: rectStart.top - parentRect.top + "px",
};

imgA.style.position = "absolute";
imgA.style.left = startPos.left;
imgA.style.top = startPos.top;

// -------------------
// DESKTOP Drag & Drop
// -------------------
imgA.addEventListener("dragstart", (e) => {
  e.dataTransfer.setData("text/plain", "imgA");
  imgA.classList.remove("shake");
});

imgB.addEventListener("dragover", (e) => e.preventDefault());

imgB.addEventListener("drop", (e) => {
  e.preventDefault();
  const id = e.dataTransfer.getData("text/plain");
  if (id === "imgA") {
    successAction();
  }
});

// -------------------
// MOBILE (Touch)
// -------------------
let offsetX = 0,
  offsetY = 0;

imgA.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  const rect = imgA.getBoundingClientRect();
  offsetX = touch.clientX - rect.left;
  offsetY = touch.clientY - rect.top;
  imgA.classList.remove("shake");
});

imgA.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  imgA.style.left = touch.clientX - offsetX - parentRect.left + "px";
  imgA.style.top = touch.clientY - offsetY - parentRect.top + "px";
});

imgA.addEventListener("touchend", () => {
  checkDrop();
});

// -------------------
// Fungsi cek overlap
// -------------------
function checkDrop() {
  const rectA = imgA.getBoundingClientRect();
  const rectB = imgB.getBoundingClientRect();

  const overlap = !(
    rectA.right < rectB.left ||
    rectA.left > rectB.right ||
    rectA.bottom < rectB.top ||
    rectA.top > rectB.bottom
  );

  if (overlap) {
    successAction();
  } else {
    resetPosition();
  }
}

// -------------------
// Reset posisi awal
// -------------------
function resetPosition() {
  imgA.style.left = startPos.left;
  imgA.style.top = startPos.top;
}

// -------------------
// Aksi sukses
// -------------------
function successAction() {
  imgA.style.display = "none";
  imgB.style.display = "none";
  imgC.style.display = "none";
  imgD.style.display = "block";
  mainButton.classList.add("shake2");
}
