/* SITE CONFIG */
const ROOT = document.body.dataset.root || "";
const FIXED_LANG = document.body.dataset.fixedLang || "";
const TITLE_KEY = document.body.dataset.titleKey || "meta.title";
const DESCRIPTION_KEY = document.body.dataset.descriptionKey || "meta.description";
const SIDE_OPEN_DESKTOP = document.body.dataset.sideOpen === "desktop";
const portraitQuery = window.matchMedia("(max-aspect-ratio: 1/1)");

/* SITE META */
let languages = {};
let defaultLang = "en";
let sectionBlocks = [];
let siteLinks = {};
let menuLinks = {};
let currentLang = FIXED_LANG;
async function loadMeta() {
  const response = await fetch(`${ROOT}meta-data.json`);
  if (!response.ok) throw new Error("Could not load meta-data.json");
  const meta = await response.json();
  languages = meta.languages;
  defaultLang = meta.defaultLang;
  sectionBlocks = meta.sectionBlocks;
  siteLinks = meta.siteLinks;
  menuLinks = meta.menuLinks;
  currentLang = FIXED_LANG || defaultLang;
}
const metaReady = loadMeta();
function whenReady(callback) {
  metaReady.then(callback).catch((error) => console.error(error));
}

/* SHARED LAYOUT */
/* Top bar, side menu and background */
function buildTopLayout() {
  const langButton = FIXED_LANG
    ? ""
    : `<button class="lang-toggle" id="lang-toggle" type="button" data-lang-label="ui.lang_button">ES</button>`;
  document.body.insertAdjacentHTML(
    "afterbegin",
    `
    <div class="bg" aria-hidden="true"></div>
    <header class="top-bar" id="top-bar" inert>
      <button
        class="menu-box"
        id="menu-btn"
        type="button"
        aria-expanded="false"
        aria-controls="side-menu"
        data-lang-label="ui.menu_button"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <div class="bar-logo">
        <img class="logo-pc" src="${ROOT}assets/title_bar.svg" alt="Kintuchay Restobar" />
        <img class="logo-mobile" src="${ROOT}assets/icon_bar.svg" alt="Kintuchay Restobar" />
      </div>
      ${langButton}
    </header>
    <nav class="side-menu" id="side-menu" data-lang-label="ui.nav" inert></nav>`
  );
}
/* Footer */
function buildFooter() {
  document.querySelector("main").insertAdjacentHTML(
    "afterend",
    `
    <footer>
      <div class="footer-top">
        <div class="footer-logo">
          <img class="logo-pc" src="${ROOT}assets/footer/icon.svg" alt="Kintuchay Restobar" loading="lazy" />
          <img class="logo-mobile" src="${ROOT}assets/footer/title.svg" alt="Kintuchay Restobar" loading="lazy" />
        </div>
        <div class="footer-contacts">
          <h2 data-lang="footer.contacts"></h2>
          <div class="number_tell">
            <h3 data-lang="footer.tell"></h3>
            <a href="https://wa.me/51916669799" data-link="tel1" data-leaf target="_blank" rel="noopener">(+51) 916 669 799</a>
            <a href="https://wa.me/51993489932" data-link="tel2" data-leaf target="_blank" rel="noopener">(+51) 993 489 932</a>
          </div>
          <div class="social-buttons">
            <a class="facebook" data-link="facebook" data-leaf target="_blank" rel="noopener" aria-label="Facebook">
              <img src="${ROOT}assets/footer/networks/facebook.svg" alt="" />
            </a>
            <a class="instagram" data-link="instagram" data-leaf target="_blank" rel="noopener" aria-label="Instagram">
              <img src="${ROOT}assets/footer/networks/instagram.svg" alt="" />
            </a>
            <a class="tripadvisor" data-link="tripadvisor" data-leaf target="_blank" rel="noopener" aria-label="Tripadvisor">
              <img src="${ROOT}assets/footer/networks/tripadvisor.svg" alt="" />
            </a>
          </div>
        </div>
        <div class="footer-more">
          <a data-link="maps_short" data-leaf target="_blank" rel="noopener" data-lang="footer.direction"></a>
        </div>
      </div>
      <div class="footer-credits">
        <p class="footer-rights" data-lang="footer.rights"></p>
        <p class="wave-text" data-lang="footer.slogan"></p>
      </div>
    </footer>`
  );
}
/* Scrollbar, leaf animation and toast */
function buildOverlays() {
  const toastHtml = FIXED_LANG ? "" : `<div class="language-toast" id="toast" role="status" aria-live="polite"></div>`;
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div class="custom-scrollbar">
      <div class="thumb"></div>
    </div>
    <div id="leaf-overlay" aria-hidden="true">
      <div class="container">
        <img src="${ROOT}assets/leaf_load/sprite1.svg" id="leaf1" class="leaf" alt="" />
        <img src="${ROOT}assets/leaf_load/sprite2.svg" id="leaf2" class="leaf" alt="" />
        <img src="${ROOT}assets/leaf_load/sprite3.svg" id="leaf3" class="leaf" alt="" />
      </div>
    </div>
    ${toastHtml}`
  );
}
buildTopLayout();
buildFooter();
buildOverlays();

/* LANGUAGE */
const langCache = {};
let menuLangBtn = null;
const langToggle = document.getElementById("lang-toggle");
const toast = document.getElementById("toast");

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}
function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
}

function detectLanguage() {
  if (FIXED_LANG) return FIXED_LANG;
  const saved = storageGet("kw-lang");
  if (saved && Object.keys(languages).includes(saved)) return saved;
  const userLang = navigator.language.toLowerCase();
  if (userLang.startsWith("en")) return "en";
  if (userLang.startsWith("es")) return "es";
  return defaultLang;
}
async function loadLang(code) {
  if (langCache[code]) return langCache[code];
  const response = await fetch(`${ROOT}lang/${code}.lang`);
  if (!response.ok) throw new Error(`Could not load lang/${code}.lang`);
  const text = await response.text();
  const dict = {};
  text.split(/\r?\n/).forEach((line) => {
    const clean = line.trim();
    if (!clean || clean.startsWith("//")) return;
    const eq = clean.indexOf("=");
    if (eq < 1) return;
    const key = clean.slice(0, eq).trim();
    const value = clean.slice(eq + 1).trim();
    if (key && value) dict[key] = value;
  });
  langCache[code] = dict;
  return dict;
}
function setText(el, value) {
  el.replaceChildren();
  value.split("\\n").forEach((part, i) => {
    if (i > 0) el.appendChild(document.createElement("br"));
    el.appendChild(document.createTextNode(part.trim()));
  });
}
async function applyLang(code) {
  const dict = await loadLang(code);
  document.querySelectorAll("[data-lang]").forEach((el) => setText(el, dict[el.dataset.lang] ?? el.dataset.lang));
  document.querySelectorAll("[data-lang-alt]").forEach((el) => (el.alt = dict[el.dataset.langAlt] ?? ""));
  document
    .querySelectorAll("[data-lang-label]")
    .forEach((el) => el.setAttribute("aria-label", dict[el.dataset.langLabel] ?? ""));
  document
    .querySelectorAll("[data-lang-title]")
    .forEach((el) => el.setAttribute("title", dict[el.dataset.langTitle] ?? ""));
  document.documentElement.lang = code;
  if (dict[TITLE_KEY]) document.title = dict[TITLE_KEY];
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && dict[DESCRIPTION_KEY]) metaDesc.setAttribute("content", dict[DESCRIPTION_KEY]);
  applySloganWave();
  return dict;
}
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2500);
}
async function setLanguage(code, withToast = true) {
  currentLang = code;
  if (!FIXED_LANG) storageSet("kw-lang", code);
  try {
    const dict = await applyLang(code);
    const label = `${dict.selected_language} ${languages[code]}`;
    if (langToggle) langToggle.textContent = code.toUpperCase();
    if (menuLangBtn) menuLangBtn.textContent = label;
    if (withToast) showToast(label);
  } catch (error) {
    console.error(error);
  }
}
function toggleLanguage() {
  setLanguage(currentLang === "es" ? "en" : "es");
}
if (langToggle) langToggle.addEventListener("click", toggleLanguage);

/* CUSTOM SCROLLBAR */
const scrollbar = document.querySelector(".custom-scrollbar");
const thumb = scrollbar.querySelector(".thumb");
function updateThumb() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight;
  const winHeight = window.innerHeight;
  const maxScroll = docHeight - winHeight;
  if (maxScroll <= 0) {
    thumb.style.height = "0px";
    return;
  }
  const thumbHeight = (winHeight / docHeight) * scrollbar.clientHeight;
  thumb.style.height = thumbHeight + "px";
  const ratio = scrollTop / maxScroll;
  const thumbMax = scrollbar.clientHeight - thumbHeight;
  thumb.style.top = ratio * thumbMax + "px";
}
let hideTimeout;
window.addEventListener(
  "scroll",
  () => {
    scrollbar.style.opacity = 1;
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      scrollbar.style.opacity = 0;
    }, 800);
  },
  { passive: true }
);
thumb.addEventListener("mousedown", (e) => {
  e.preventDefault();
  const startY = e.clientY;
  const startTop = parseFloat(thumb.style.top) || 0;
  const thumbHeight = thumb.offsetHeight;
  const thumbMax = scrollbar.clientHeight - thumbHeight;
  function onMove(ev) {
    if (thumbMax <= 0) return;
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
const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
if (isTouchDevice) {
  document.body.removeAttribute("data-smooth-scroll");
  scrollbar.style.display = "none";
}
window.addEventListener("beforeunload", () => {
  window.scrollTo(0, 0);
});
window.addEventListener("load", () => {
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 0);
});

/* SMOOTH SCROLL */
function scrollToY(top) {
  if (isTouchDevice) {
    window.scrollTo({ top, behavior: "smooth" });
  } else {
    SmoothScroll.scrollTo(0, top);
  }
}
function scrollToEl(el) {
  if (!el) return;
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  scrollToY(el.getBoundingClientRect().top + window.scrollY - margin);
}

/* LEAF LOAD */
let leafBusy = false;
function openUrl(url) {
  if (url.startsWith("tel:")) {
    window.location.href = url;
    return;
  }
  const win = window.open(url, "_blank");
  if (win) {
    win.opener = null;
  } else {
    window.location.href = url;
  }
}
function playLeafAnimation(url) {
  if (leafBusy) return;
  leafBusy = true;
  const overlay = document.getElementById("leaf-overlay");
  const leaves = [document.getElementById("leaf1"), document.getElementById("leaf2"), document.getElementById("leaf3")];
  let finished = false;
  const resetLeaves = () => leaves.forEach((leaf, i) => leaf.classList.remove(`anim${i + 1}`));
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(safetyTimer);
    overlay.style.display = "none";
    resetLeaves();
    leafBusy = false;
    openUrl(url);
  };
  const safetyTimer = setTimeout(finish, 2200);
  resetLeaves();
  overlay.style.display = "block";
  void overlay.offsetWidth;
  leaves[0].classList.add("anim1");
  leaves[0].addEventListener("animationend", () => leaves[1].classList.add("anim2"), { once: true });
  leaves[1].addEventListener("animationend", () => leaves[2].classList.add("anim3"), { once: true });
  leaves[2].addEventListener("animationend", finish, { once: true });
}
document.addEventListener("click", (e) => {
  const link = e.target.closest("a[data-leaf]");
  if (!link || !link.href) return;
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  playLeafAnimation(link.href);
});
function applyLinks() {
  document.querySelectorAll("[data-link]").forEach((a) => {
    const url = siteLinks[a.dataset.link];
    if (url) a.href = url;
  });
}

/* TOP BAR */
const topBar = document.getElementById("top-bar");
const banner = document.querySelector(".banner");
let bannerHeight = 1;
let barHeight = 0;
let lastRatio = -1;
function measureBar() {
  bannerHeight = banner ? banner.offsetHeight || 1 : 1;
  barHeight = topBar.offsetHeight;
  lastRatio = -1;
}
function getBarRatio() {
  return banner ? Math.min(window.scrollY / bannerHeight, 1) : 1;
}
function updateTopBar() {
  const ratio = getBarRatio();
  if (ratio === lastRatio) return;
  lastRatio = ratio;
  topBar.style.transform = `translateY(${-100 + 100 * ratio}%)`;
  topBar.style.opacity = ratio;
  const hidden = ratio < 0.5;
  if (topBar.inert !== hidden) topBar.inert = hidden;
  if (isMenuOpen()) {
    if (hidden) closeMenu();
    else updateMenuTop();
  }
}

/* SIDE MENU */
const sideMenu = document.getElementById("side-menu");
const menuBtn = document.getElementById("menu-btn");
function isMenuOpen() {
  return sideMenu.classList.contains("active");
}
function isDocked() {
  return SIDE_OPEN_DESKTOP && !portraitQuery.matches;
}
function updateMenuTop() {
  sideMenu.style.top = `${barHeight * getBarRatio()}px`;
}
function openMenu() {
  updateMenuTop();
  sideMenu.classList.add("active");
  document.body.classList.add("side-open");
  sideMenu.inert = false;
  menuBtn.setAttribute("aria-expanded", "true");
}
function closeMenu() {
  sideMenu.classList.remove("active");
  document.body.classList.remove("side-open");
  sideMenu.inert = true;
  menuBtn.setAttribute("aria-expanded", "false");
}
function syncSideMenu() {
  if (!SIDE_OPEN_DESKTOP) return;
  if (isDocked()) openMenu();
  else closeMenu();
}
menuBtn.addEventListener("click", () => (isMenuOpen() ? closeMenu() : openMenu()));
sideMenu.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (!link) return;
  const href = link.getAttribute("href");
  if (href && href.startsWith("#")) {
    e.preventDefault();
    e.stopPropagation();
    scrollToEl(document.querySelector(href));
  }
  if (!isDocked()) closeMenu();
});
document.addEventListener("click", (e) => {
  if (isDocked() || !isMenuOpen()) return;
  if (!sideMenu.contains(e.target) && !menuBtn.contains(e.target)) closeMenu();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isMenuOpen()) {
    closeMenu();
    menuBtn.focus();
  }
});
portraitQuery.addEventListener("change", syncSideMenu);

/* SIDE MENU OPTIONS */
let modeSwitch = null;
function createSeparator() {
  const separator = document.createElement("hr");
  separator.className = "menu_separator";
  return separator;
}
function createLangOption() {
  const option = document.createElement("div");
  option.className = "option language";
  option.innerHTML = `
    <div data-lang="ui.language"></div>
    <button class="button language_select" id="menu-lang" type="button"></button>`;
  menuLangBtn = option.querySelector("#menu-lang");
  menuLangBtn.addEventListener("click", () => {
    toggleLanguage();
    closeMenu();
  });
  return option;
}
function createModeOption() {
  const option = document.createElement("div");
  option.className = "option web_mode";
  option.innerHTML = `
    <div id="mode-label" data-lang="ui.mode"></div>
    <button
      class="switch mode_select"
      id="mode-switch"
      type="button"
      role="switch"
      aria-checked="false"
      aria-labelledby="mode-label"
    >
      <span class="slider"></span>
    </button>`;
  modeSwitch = option.querySelector("#mode-switch");
  modeSwitch.addEventListener("click", () => {
    setMode(document.body.classList.contains("dark-mode") ? "light" : "dark");
  });
  return option;
}

/* WEB MODE */
function setMode(mode, persist = true) {
  const dark = mode === "dark";
  document.body.classList.toggle("dark-mode", dark);
  document.body.classList.toggle("light-mode", !dark);
  if (modeSwitch) modeSwitch.setAttribute("aria-checked", String(dark));
  if (persist) storageSet("kw-mode", mode);
}
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  if (!storageGet("kw-mode")) setMode(e.matches ? "dark" : "light", false);
});

/* FOOTER SLOGAN */
function applySloganWave() {
  const slogan = document.querySelector(".wave-text");
  if (!slogan) return;
  const text = slogan.textContent.trim();
  slogan.replaceChildren();
  const readable = document.createElement("span");
  readable.className = "sr-only";
  readable.textContent = text;
  slogan.appendChild(readable);
  const visual = document.createElement("span");
  visual.setAttribute("aria-hidden", "true");
  let charIndex = 1;
  text.split(/(\s+)/).forEach((part) => {
    if (/^\s+$/.test(part)) {
      visual.appendChild(document.createTextNode(" "));
      return;
    }
    const word = document.createElement("span");
    word.classList.add("slogan-word");
    [...part].forEach((char) => {
      const letter = document.createElement("span");
      letter.style.setProperty("--i", charIndex++);
      letter.textContent = char;
      word.appendChild(letter);
    });
    visual.appendChild(word);
  });
  slogan.appendChild(visual);
}

/* SCROLL AND RESIZE */
let scrollTicking = false;
function onScrollOrResize() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    updateThumb();
    updateTopBar();
    scrollTicking = false;
  });
}
function onLayoutChange() {
  measureBar();
  onScrollOrResize();
}
window.addEventListener("scroll", onScrollOrResize, { passive: true });
window.addEventListener("resize", onLayoutChange);
window.addEventListener("load", onLayoutChange);
if ("ResizeObserver" in window) new ResizeObserver(onLayoutChange).observe(document.body);

/* SITE START */
function startSite() {
  applyLinks();
  SmoothScroll.init();
  setMode(document.body.classList.contains("dark-mode") ? "dark" : "light", false);
  setLanguage(detectLanguage(), false);
  onLayoutChange();
  syncSideMenu();
}
