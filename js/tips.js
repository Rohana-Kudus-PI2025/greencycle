const form = document.getElementById("barcodeForm");
const input = document.getElementById("barcodeInput");
const loading = document.getElementById("tipLoading");
const receiptDate = document.getElementById("receiptDate");

const modal = document.getElementById("tipsModal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");
const modalOk = document.getElementById("modalOk");
const modalBackdrop = document.getElementById("modalBackdrop");

const exampleBtns = document.querySelectorAll(".ex-code");
const catContainer = document.getElementById("fallbackCats");

// helpers
const escapeHTML = (str) =>
  String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatDate = (d = new Date()) =>
  d.toLocaleDateString("id-ID", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

if (receiptDate) receiptDate.textContent = formatDate();

function openModal(html) {
  if (!modal || !modalBody) return;
  modalBody.innerHTML = html;
  modal.classList.remove("hidden");
  // kunci scroll konten di belakang
  document.documentElement.classList.add("overflow-hidden");
}

function closeModal() {
  if (!modal || !modalBody) return;
  modal.classList.add("hidden");
  modalBody.innerHTML = "";
  document.documentElement.classList.remove("overflow-hidden");
  if (input) {
    input.focus();
    input.select();
  }
}

[modalClose, modalOk, modalBackdrop].forEach((el) => {
  el && el.addEventListener("click", closeModal);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

let TIPS_BUCKETS = {
  clean: { lainnya: ["Pastikan kemasan bersih dan kering."] },
  space: { lainnya: ["Sediakan wadah terpisah per jenis kemasan."] },
  reuse: { lainnya: ["Pilih kemasan yang bisa dipakai ulang."] },
  habit: { lainnya: ["Tempel panduan pilah di kulkas."] },
};

let bucketsReady = (async function loadTipBuckets() {
  try {
    const res = await fetch("js/tips-bucket.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Gagal memuat tips-bucket.json");
    const json = await res.json();
    if (json?.clean && json?.space && json?.reuse && json?.habit) {
      TIPS_BUCKETS = json;
    } else {
      console.warn("Struktur tips-bucket.json tidak sesuai. Pakai fallback.");
    }
  } catch (err) {
    console.warn("Tidak bisa memuat tips-bucket.json. Pakai fallback.", err);
  }
})();

function collectPackagingSignals(product) {
  const texts = [];
  const tags = [];

  const packagingText =
    product.packaging_text ||
    product.packaging_text_id ||
    product.packaging_text_en ||
    product.packaging ||
    "";

  if (packagingText) texts.push(String(packagingText));

  if (product.product_name) texts.push(String(product.product_name));
  if (product.product_name_id) texts.push(String(product.product_name_id));
  if (product.product_name_en) texts.push(String(product.product_name_en));
  if (product.brands) texts.push(String(product.brands));
  if (product.categories) texts.push(String(product.categories));
  if (Array.isArray(product.categories_tags)) {
    product.categories_tags.forEach((t) => tags.push(String(t)));
  }

  if (Array.isArray(product.packaging_materials_tags)) {
    product.packaging_materials_tags.forEach((t) => tags.push(String(t)));
  }

  if (Array.isArray(product.packagings)) {
    product.packagings.forEach((p) => {
      if (p?.material) texts.push(String(p.material));
      if (p?.shape) texts.push(String(p.shape));
      if (p?.recycling) texts.push(String(p.recycling));
    });
  }

  if (Array.isArray(product.packaging_tags)) {
    product.packaging_tags.forEach((t) => tags.push(String(t)));
  }

  const allText = [texts.join(" "), tags.join(" ")].join(" ").toLowerCase();
  return {
    packagingText: packagingText || "-",
    allText,
    packagings: Array.isArray(product.packagings) ? product.packagings : [],
  };
}

function detectCategory(allText) {
  const has = (...words) => words.some((w) => allText.includes(w));

  if (
    has(
      "plastic",
      "plastik",
      "pet",
      "pp",
      "ps",
      "pe",
      "ldpe",
      "hdpe",
      "film",
      "sachet"
    )
  )
    return { key: "plastik", label: "Plastik" };

  if (has("paper", "kertas", "cardboard", "karton", "corrugated"))
    return { key: "kertas", label: "Kertas/Karton" };

  if (has("glass", "kaca", "botol kaca")) return { key: "kaca", label: "Kaca" };

  if (has("metal", "aluminium", "aluminum", "steel", "tin", "logam", "kaleng"))
    return { key: "logam", label: "Logam/Kaleng" };

  if (
    has("tetra", "tetra pak", "tetrapak", "composite", "komposit", "laminated")
  )
    return { key: "komposit", label: "Kemasan Komposit" };

  return { key: "lainnya", label: "Lainnya / Perlu dicek" };
}

function isConfectionery(allText = "") {
  return /\b(snickers|mars|twix|kitkat|silverqueen|beng[-\s]?beng|candy|chocolate|cokelat|snack|keripik|bumbu|seasoning|permen|wafer|royco|sachet)\b/i.test(
    allText
  );
}

function detectSubKey(allText, key) {
  const t = ` ${String(allText).toLowerCase()} `;
  if (key === "plastik") {
    // pakai isConfectionery agar snack/sachet otomatis ke plastik tipis
    if (isConfectionery(allText)) return "plastik_tipis";

    const THIN_RE =
      /(wrapper|flow[- ]?wrap|film|sachet|stick(?:\s|-)?pack|pouch|refill|metalli[sz]ed|foil|multilayer|laminated|flexible|snack|candy|chocolate|cokelat|bumbu|seasoning|keripik|wafer|bar(?!\s*code))/;
    const THICK_RE =
      /(bottle|botol|jar|stoples|tub|container|kanister|cup(?!\s*seal)|gallon|jerigen|hdpe|pp|pet(?!\s*film))/;

    if (THIN_RE.test(t)) return "plastik_tipis";
    if (THICK_RE.test(t)) return "plastik_tebal";
  }
  return null;
}

/* ---------- Awareness lingkungan (sederhana) ---------- */
function buildEnvAwareness(product, catKey, allText = "", packagings = []) {
  const out = [];
  const t = ` ${String(allText).toLowerCase()} `;

  // --- Eco-Score (produk, bukan kemasan) ---
  const ecoRaw = (product.ecoscore_grade || "").toString().toUpperCase();
  const ECO_VALID = new Set(["A", "B", "C", "D", "E"]);
  const ecoData = product.ecoscore_data || {};
  const hasDetails = !!(
    ecoData?.adjustments ||
    ecoData?.scores ||
    ecoData?.agribalyse
  );

  if (ECO_VALID.has(ecoRaw)) {
    if (hasDetails) {
      out.push({
        tone: ["A", "B"].includes(ecoRaw) ? "good" : "warn",
        text: `Eco-Score ${ecoRaw} (produk, bukan kemasan)`,
      });
    } else {
      out.push({
        tone: "note",
        text: `Eco-Score ${ecoRaw} (estimasi kategori)`,
      });
    }
  }

  // --- Deteksi larangan daur ulang / residu ---
  const antiRecycle =
    /\b(discard|do\s*not\s*recycle|not\s*recycl|non[-\s]*recycl|household\s*waste|residu)\b/i.test(
      allText
    ) ||
    (Array.isArray(packagings) &&
      packagings.some((p) =>
        /\b(discard|not\s*recycl)/i.test(String(p?.recycling || ""))
      ));

  // Bisa didaur ulang?
  const recyclingTags = (product.packaging_recycling_tags || []).map((s) =>
    String(s).toLowerCase()
  );
  const canRecycle =
    /recyclable|recycle|dapat didaur ulang|bisa didaur ulang/.test(t) ||
    recyclingTags.some((r) => /recyclable|recycle/.test(r)) ||
    (Array.isArray(packagings) &&
      packagings.some((p) => /recycle/i.test(String(p?.recycling || ""))));

  if (antiRecycle) {
    out.push({
      tone: "warn",
      text: "Label: jangan didaur ulang / buang ke residu",
    });
  } else if (canRecycle) {
    out.push({ tone: "good", text: "Kemasan bisa didaur ulang ♻️" });
  }

  // Komposit/sachet → sulit didaur ulang
  const isComposite =
    catKey === "komposit" || /sachet|laminated|multilayer|tetra/.test(t);
  if (isComposite)
    out.push({ tone: "warn", text: "Kemasan campuran — sulit didaur ulang" });

  // Film/wrapper/pouch umumnya sulit didaur ulang, tapi jangan dobel kalau sudah ada antiRecycle
  if (
    /\b(wrapper|flow[- ]?wrap|film|sachet|pouch|stick(?:\s|-)?pack)\b/i.test(
      allText
    ) &&
    !canRecycle &&
    !antiRecycle
  ) {
    out.push({
      tone: "warn",
      text: "Plastik tipis (film) umumnya sulit didaur ulang",
    });
  }

  // dedupe
  const seen = new Set();
  return out.filter((b) =>
    seen.has(b.text) ? false : (seen.add(b.text), true)
  );
}

function renderAwarenessBadges(aw = []) {
  if (!aw.length) return "";
  const styles = {
    good: "bg-emerald-100 text-emerald-900 border-emerald-200",
    warn: "bg-rose-100 text-rose-900 border-rose-200",
  };
  const chips = aw
    .map(
      (a) => `
      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
        styles[a.tone] || "bg-amber-100 text-amber-900 border-amber-200"
      }">${escapeHTML(a.text)}</span>`
    )
    .join(" ");
  return `
    <div class="space-y-2 mt-3">
      <p class="text-xs font-semibold text-slate-700">Awareness lingkungan:</p>
      <div class="flex flex-wrap gap-2">${chips}</div>
    </div>`;
}

async function fetchProductByBarcode(barcode) {
  const endpoints = [
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
      barcode
    )}.json`,
    `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(
      barcode
    )}.json`,
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.product) return data.product;
    } catch {}
  }
  return null;
}

function pickOne(arr = [], fallback = "") {
  if (!arr.length) return fallback;
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray(arr = []) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickSample(arr = [], n = 4) {
  const copy = shuffleArray(arr);
  return copy.slice(0, Math.min(n, copy.length));
}

// Tips terkurasi untuk plastik tipis (bungkus snack/sachet)
// default: kota/label tidak jelas; antiRecycle: kalau ada label "discard/not recycle"
const OVERRIDE_TIPS = {
  plastik_tipis: {
    default: [
      "Usap sisa makanan dengan tisu; tidak perlu dicuci lama.",
      "Keringkan lalu simpan di kantong khusus film plastik.",
      "Lipat kecil-kecil atau gulung supaya ringkas di rumah.",
      "Kalau ada drop-off film plastik di kota kamu, kumpulkan minimal satu kantong sebelum setor.",
      "Kurangi pembelian sachet; pilih ukuran keluarga lalu pindah ke wadah.",
      "Tempel label 'plastik tipis' di kantong agar keluarga ikut pilah.",
    ],
    antiRecycle: [
      "Ikuti label pabrik: buang ke residu setelah kering dan bersih dari sisa makanan.",
      "Satukan bungkus-bungkus kecil ke satu bungkus lebih besar lalu ikat agar tidak tercecer.",
      "Jangan cuci berlebihan—hemat air; cukup dilap agar tidak lengket.",
      "Pertimbangkan ganti ke isi ulang/kemasan besar untuk kurangi sachet baru.",
    ],
  },
};

function composeHouseholdTips(catKey, { antiRecycle = false } = {}) {
  const key = catKey || "lainnya";
  const baseKey = key.startsWith("plastik_") ? "plastik" : key;

  // Override khusus plastik tipis: jangan pakai bucket reuse acak
  if (key === "plastik_tipis") {
    const pool = antiRecycle
      ? OVERRIDE_TIPS.plastik_tipis.antiRecycle
      : OVERRIDE_TIPS.plastik_tipis.default;
    return pickSample(pool, 4);
  }

  // default behaviour (ambil 1 dari tiap bucket)
  const b = TIPS_BUCKETS;
  const clean = b.clean[key] || b.clean[baseKey] || b.clean.lainnya || [];
  const space = b.space[key] || b.space[baseKey] || b.space.lainnya || [];
  const reuse = b.reuse[key] || b.reuse[baseKey] || b.reuse.lainnya || [];
  const habit = b.habit[key] || b.habit[baseKey] || b.habit.lainnya || [];

  const picked = [
    pickOne(clean),
    pickOne(space),
    pickOne(reuse),
    pickOne(habit),
  ].filter(Boolean);
  return shuffleArray(picked);
}

function renderTipsCard({
  name,
  brand,
  packagingText,
  imageUrl,
  readableCategory,
  tips,
  awarenessHtml = "",
  showImage = true,
}) {
  const title = brand ? `${name} — ${brand}` : name;

  const imgEl = !showImage
    ? ""
    : imageUrl
    ? `<div class="w-full bg-white/80 border-b border-black/10">
           <img src="${imageUrl}" alt="${escapeHTML(title)}"
                class="w-full h-40 sm:h-48 object-contain" loading="lazy">
         </div>`
    : `<div class="w-full h-32 sm:h-40 bg-white/60 flex items-center justify-center text-slate-500 text-sm border-b border-black/10">
           Foto produk tidak tersedia
         </div>`;

  const tipsList = tips
    .map((t) => `<li class="pl-2">• ${escapeHTML(t)}</li>`)
    .join("");

  return `
    <div class="space-y-4">
      <div class="rounded-xl overflow-hidden border border-black/10 bg-white/70">
        ${imgEl}
        <div class="p-3">
          <h4 class="font-semibold text-slate-900">${escapeHTML(title)}</h4>
          <p class="text-[11px] text-slate-500 mt-0.5">Eco-Score menilai produk, bukan hanya kemasan.</p>
          <p class="text-xs text-slate-700 mt-1">
            Jenis kemasan: <span class="font-medium">${escapeHTML(
              readableCategory
            )}</span>
          </p>
          <p class="text-xs text-slate-600 mt-1">
            Keterangan pabrik: ${escapeHTML(packagingText || "-")}
          </p>
          ${awarenessHtml}
        </div>
      </div>

      <div class="rounded-md border border-black/10 p-3 bg-white/80">
        <p class="text-sm font-semibold text-slate-900">Tips cepat:</p>
        <ul class="mt-2 text-sm text-slate-800 space-y-1">
          ${tipsList}
        </ul>
      </div>
    </div>
  `;
}

function labelFromKey(key = "") {
  if (key === "plastik_tipis") return "Plastik Tipis (sachet/wrapper)";
  if (key === "plastik_tebal") return "Plastik Tebal (botol/kotak)";
  return key ? key[0].toUpperCase() + key.slice(1) : "Lainnya";
}

exampleBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const code = btn.getAttribute("data-code")?.trim();
    if (!code || !input) return;
    input.value = code;
    form?.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );
  });
});

if (catContainer) {
  catContainer.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    const key = btn.getAttribute("data-cat") || "lainnya";
    await bucketsReady.catch(() => {});
    const tips = composeHouseholdTips(key);

    const html = renderTipsCard({
      name: "Tips tanpa barcode",
      brand: "",
      packagingText: "-",
      imageUrl: "",
      readableCategory: labelFromKey(key),
      tips,
      awarenessHtml: "",
      showImage: false,
    });

    openModal(html);
  });
}

//submit
if (form && input) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const barcode = input.value.trim();

    loading?.classList.remove("hidden");

    try {
      if (!/^\d{6,}$/.test(barcode)) {
        throw new Error("Masukkan angka barcode yang benar.");
      }

      await bucketsReady.catch(() => {});

      const product = await fetchProductByBarcode(barcode);
      if (!product)
        throw new Error("Data produk belum tersedia. Coba barcode lain.");

      const name =
        product.product_name ||
        product.product_name_id ||
        product.product_name_en ||
        "Produk Tanpa Nama";

      let brand = "";
      if (Array.isArray(product.brands_tags) && product.brands_tags.length) {
        brand = product.brands_tags[0].split(":").pop();
      } else if (product.brands) {
        brand = product.brands.split(",")[0].trim();
      }

      const imageUrl =
        product.image_front_small_url ||
        product.image_small_url ||
        product.image_front_url ||
        product.image_url ||
        "";

      const { packagingText, allText, packagings } =
        collectPackagingSignals(product);
      const { key } = detectCategory(allText);
      const subKey = detectSubKey(allText, key) || key;

      const antiRecycle =
        /\b(discard|do\s*not\s*recycle|not\s*recycl|non[-\s]*recycl|household\s*waste|residu)\b/i.test(
          allText
        ) ||
        (Array.isArray(packagings) &&
          packagings.some((p) =>
            /\b(discard|not\s*recycl)/i.test(String(p?.recycling || ""))
          ));

      const tips = composeHouseholdTips(subKey, { antiRecycle });

      const awareness = buildEnvAwareness(product, key, allText, packagings);
      const awarenessHtml = renderAwarenessBadges(awareness);

      const html = renderTipsCard({
        name,
        brand,
        packagingText,
        imageUrl,
        readableCategory: labelFromKey(subKey),
        tips,
        awarenessHtml,
      });

      openModal(html);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      openModal(`
        <div class="space-y-3">
          <div class="rounded-md bg-white/70 border border-black/10 p-3">
            <p class="text-sm font-semibold text-rose-800">Tidak bisa menampilkan tips</p>
            <p class="text-sm text-rose-900 mt-1">${escapeHTML(msg)}</p>
          </div>
          <p class="text-xs text-slate-700">Cek lagi nomor barcode di struk atau coba produk lain.</p>
        </div>
      `);
    } finally {
      loading?.classList.add("hidden");
      input.focus();
      input.select();
    }
  });
}
