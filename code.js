/* LANGUAJES */
async function loadLang(file) {
  const text = await fetch(file).then((r) => r.text());
  const lines = text.split("\n");
  const lang = {};
  lines.forEach((line) => {
    if (line.trim() && !line.startsWith("//")) {
      const [key, value] = line.split("=");
      if (key && value) {
        lang[key.trim()] = value.trim();
      }
    }
  });
  return lang;
}
async function applyLang(file) {
  const lang = await loadLang(file);
  document.querySelectorAll("[data-lang]").forEach(el => {
    const key = el.getAttribute("data-lang");
    el.textContent = lang[key] || key;
  });
}

/* SCROLL-BAR CUSTOM */
const scrollbar = document.querySelector(".custom-scrollbar");
const thumb = scrollbar.querySelector(".thumb");
function updateThumb() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight;
  const winHeight = window.innerHeight;
  const thumbHeight = (winHeight / docHeight) * scrollbar.clientHeight;
  thumb.style.height = thumbHeight + "px";
  const ratio = scrollTop / (docHeight - winHeight);
  const thumbMax = scrollbar.clientHeight - thumbHeight;
  thumb.style.top = ratio * thumbMax + "px";
}
let hideTimeout;
window.addEventListener("scroll", () => {
  scrollbar.style.opacity = 1;
  updateThumb();
  clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => {
    scrollbar.style.opacity = 0;
  }, 800);
});
window.addEventListener("resize", updateThumb);
thumb.addEventListener("mousedown", (e) => {
  e.preventDefault();
  const startY = e.clientY;
  const startTop = parseFloat(thumb.style.top) || 0;
  const thumbHeight = thumb.offsetHeight;
  const thumbMax = scrollbar.clientHeight - thumbHeight;
  function onMove(ev) {
    const delta = ev.clientY - startY;
    let newTop = Math.max(0, Math.min(startTop + delta, thumbMax));
    thumb.style.top = newTop + "px";
    const ratio = newTop / thumbMax;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    window.scrollTo(0, ratio * (docHeight - winHeight));
  }
  function onUp() {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  }
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
});

/* TOP-BAR */
const topBar = document.querySelector(".top-bar");
const bannerHeight = document.querySelector(".banner").offsetHeight;

window.addEventListener("scroll", () => {
  const scrollY = window.scrollY;
  const ratio = Math.min(scrollY / bannerHeight, 1); // 0 → inicio, 1 → fin del banner

  // interpolación: -100% (oculta arriba) → 0% (posición normal)
  const translateY = (-100 + (100 * ratio)) + "%";

  topBar.style.transform = `translateY(${translateY})`;
  topBar.style.opacity = ratio; // también se desvanece progresivamente
});
window.addEventListener("scroll", () => {
  const scrollY = window.scrollY;
  const ratio = Math.min(scrollY / bannerHeight, 1); // 0 → arriba, 1 → abajo

  // interpolación: -100% (oculta) → 0% (visible)
  const translateY = (-100 + (100 * ratio)) + "%";

  topBar.style.transform = `translateY(${translateY})`;
  topBar.style.opacity = ratio; // también se desvanece progresivamente
});

/* BANNER */
document.querySelector(".banner").addEventListener("click", () => {
  const banner = document.querySelector(".banner");
  const bannerBottom = banner.offsetTop + banner.offsetHeight;
  SmoothScroll.scrollTo(0, bannerBottom);
});

/* SECTION BLOCKS */
async function renderSections() {
  const lang = await loadLang("lang/es.lang");
  const container = document.querySelector(".sections-container");

  sectionBlocks.forEach((block) => {
    const title = lang[`section_block.${block.key}`];
    let description = lang[`section_block.${block.key}.description`];
    description = description.replace(/\\n/g, "<br>");

    // contenedor general invisible
    const sectionContainer = document.createElement("div");
    sectionContainer.classList.add("section-container");

    // bloque interno
    const sectionBlock = document.createElement("div");
    sectionBlock.classList.add("section-block");
    if (block.model === "b2") sectionBlock.classList.add("b2");

    // contenido dinámico
    if (block.model === "b1") {
      sectionBlock.innerHTML = `
        <div class="section-text">
          <h2>${title}</h2>
          <p>${description}</p>
        </div>
        <div class="section-image">
          <img src="${block.image}" alt="${title}">
        </div>
      `;
    }
    if (block.model === "b2") {
      sectionBlock.innerHTML = `
        <div class="section-image">
          <img src="${block.image}" alt="${title}">
        </div>
        <div class="section-text">
          <h2>${title}</h2>
          <p>${description}</p>
        </div>
      `;
    }

    // insertar bloque dentro del contenedor general
    sectionContainer.appendChild(sectionBlock);
    container.appendChild(sectionContainer);
  });
}

/* Initiations */
renderSections();
SmoothScroll.init();
applyLang("lang/es.lang");