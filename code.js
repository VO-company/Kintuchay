/* LANGUAJES */
function detectLanguage() {
  const userLang = navigator.language.toLowerCase();
  if (userLang.startsWith("en")) {
    return "en";
  } else if (userLang.startsWith("es")) {
    return "es";
  } else {
    return languages.default_lang;
  }
}
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
  document.querySelectorAll("[data-lang]").forEach((el) => {
    const key = el.getAttribute("data-lang");
    let value = lang[key] || key;
    if (value.includes("\\n")) {
      value = value.replace(/\\n/g, "<br>");
      el.innerHTML = value;
    } else {
      el.textContent = value;
    }
  });
}
let currentLang = detectLanguage();
const langToggle = document.getElementById("lang-toggle");
function setLanguage(langKey) {
  currentLang = langKey;
  const langFile = `lang/${langKey}.lang`;
  applyLang(langFile);
  renderMenuOptions();
  langToggle.textContent = langKey.toUpperCase();
  showLanguageToast(langFile, langKey);
}
langToggle.addEventListener("click", () => {
  if (currentLang === "es") {
    setLanguage("en");
  } else {
    setLanguage("es");
  }
});
function showLanguageToast(langFile, langKey) {
  loadLang(langFile).then((lang) => {
    const baseMessage = lang["selected_language"];
    const languageName = languages[langKey];
    const message = `${baseMessage} ${languageName}`;
    let toast = document.querySelector(".language-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.classList.add("language-toast");
      document.body.appendChild(toast);
    }
    toast.innerHTML = message;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
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
const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
if (isTouchDevice) {
  document.body.removeAttribute("data-smooth-scroll");
  const customScrollbar = document.querySelector(".custom-scrollbar");
  if (customScrollbar) {
    customScrollbar.style.display = "none";
  }
}
window.addEventListener("beforeunload", () => {
  window.scrollTo(0, 0);
});
window.addEventListener("load", () => {
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 0);
});

/* TOP-BAR */
const topBar = document.querySelector(".top-bar");
const banner = document.querySelector(".banner");
const firstBlock = document.querySelector(".sections-container");
function updateTopBar() {
  const scrollY = window.scrollY;
  const bannerHeight = banner.offsetHeight;
  const bannerBottom = banner.offsetTop + bannerHeight;
  const ratio = Math.min(scrollY / bannerHeight, 1);
  const translateY = -100 + 100 * ratio + "%";
  topBar.style.transform = `translateY(${translateY})`;
  topBar.style.opacity = ratio;
  if (scrollY >= bannerBottom) {
    topBar.style.transform = "translateY(0%)";
    topBar.style.opacity = 1;
  }
}
window.addEventListener("scroll", updateTopBar);
window.addEventListener("resize", updateTopBar);
window.addEventListener("load", updateTopBar);

/* MENU OPTIONS */
document.querySelector(".menu-box").addEventListener("click", () => {
  let sideMenu = document.querySelector(".side-menu");
  if (!sideMenu) {
    sideMenu = document.createElement("div");
    sideMenu.classList.add("side-menu");
    sideMenu.innerHTML = `<ul id="menu-options"></ul>`;
    document.body.appendChild(sideMenu);
    renderMenuOptions();
    requestAnimationFrame(() => {
      updateMenuHeight();
      sideMenu.classList.add("active");
    });
  } else {
    closeMenu();
  }
});
async function renderMenuOptions() {
  const menuList = document.getElementById("menu-options");
  if (!menuList) return;
  menuList.innerHTML = "";
  sectionBlocks.forEach((block) => {
    const li = document.createElement("li");
    li.setAttribute("data-lang", `section_block.${block.key}`);
    li.addEventListener("click", () => {
      const target = document.querySelector(`.section-container[data-key="${block.key}"]`);
      if (target) {
        const top = target.offsetTop;
        if (isTouchDevice) {
          window.scrollTo({ top, behavior: "smooth" });
        } else {
          SmoothScroll.scrollTo(0, top);
        }
        closeMenu();
      }
    });
    menuList.appendChild(li);
  });
  const mapLi = document.createElement("li");
  mapLi.setAttribute("data-lang", "ui.map");
  mapLi.addEventListener("click", () => {
    const target = document.querySelector(".map-container");
    if (target) {
      const top = target.offsetTop;
      if (isTouchDevice) {
        window.scrollTo({ top, behavior: "smooth" });
      } else {
        SmoothScroll.scrollTo(0, top);
      }
      closeMenu();
    }
  });
  menuList.appendChild(mapLi);

  const separator = document.createElement("hr");
  separator.classList.add("menu-separator");
  menuList.appendChild(separator);
  const langContainer = document.createElement("div");
  langContainer.classList.add("menu-lang-container");
  const langLabel = document.createElement("div");
  langLabel.setAttribute("data-lang", "ui.languaje");
  langContainer.appendChild(langLabel);
  const langButton = document.createElement("button");
  langButton.classList.add("menu-lang-button");
  const languageName = languages[currentLang];
  const langFile = `lang/${currentLang}.lang`;
  loadLang(langFile).then((lang) => {
    const baseMessage = lang["selected_language"];
    langButton.textContent = `${baseMessage} ${languageName}`;
  });
  langButton.addEventListener("click", () => {
    if (currentLang === "es") {
      setLanguage("en");
    } else {
      setLanguage("es");
    }
    closeMenu();
  });
  langContainer.appendChild(langButton);
  menuList.appendChild(langContainer);
  const modeContainer = document.createElement("div");
  modeContainer.classList.add("menu-mode-container");
  const modeLabel = document.createElement("div");
  modeLabel.setAttribute("data-lang", "ui.mode");
  modeContainer.appendChild(modeLabel);
  const modeSwitch = document.createElement("div");
  modeSwitch.classList.add("switch");
  const slider = document.createElement("span");
  slider.classList.add("slider");
  modeSwitch.appendChild(slider);
  if (document.body.classList.contains("dark-mode")) {
    modeSwitch.classList.add("active");
  }
  modeSwitch.addEventListener("click", () => {
    modeSwitch.classList.toggle("active");
    if (modeSwitch.classList.contains("active")) {
      document.body.classList.remove("light-mode");
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
      document.body.classList.add("light-mode");
    }
  });
  modeContainer.appendChild(modeSwitch);
  menuList.appendChild(modeContainer);
  applyLang(`lang/${currentLang}.lang`);
}
function updateMenuHeight() {
  const topBarRect = topBar.getBoundingClientRect();
  const sideMenu = document.querySelector(".side-menu");
  if (sideMenu) {
    sideMenu.style.top = `${topBarRect.bottom}px`;
    sideMenu.style.height = `calc(100% - ${topBarRect.bottom}px)`;
  }
}
if (isTouchDevice) {
  function syncMenu() {
    updateMenuHeight();
    requestAnimationFrame(syncMenu);
  }
  syncMenu();
} else {
  window.addEventListener("scroll", updateMenuHeight);
  window.addEventListener("resize", updateMenuHeight);
  window.addEventListener("load", updateMenuHeight);
}
function closeMenu() {
  const sideMenu = document.querySelector(".side-menu");
  if (sideMenu) {
    sideMenu.classList.remove("active");
    sideMenu.addEventListener(
      "transitionend",
      () => {
        sideMenu.remove();
      },
      { once: true },
    );
  }
}
function detectDefaultMode() {
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark-mode";
  } else {
    return "light-mode";
  }
}

/* BANNER */
banner.addEventListener("click", () => {
  const bannerBottom = banner.offsetTop + banner.offsetHeight;
  if (isTouchDevice) {
    window.scrollTo({
      top: bannerBottom,
      behavior: "smooth",
    });
  } else {
    SmoothScroll.scrollTo(0, bannerBottom);
  }
});
const bannerContent = document.querySelector(".banner-content");
function updateBannerContent() {
  const scrollY = window.scrollY;
  const bannerHeight = banner.offsetHeight;
  const ratio = Math.min(scrollY / bannerHeight, 1);
  const opacity = 1 - ratio;
  bannerContent.style.opacity = opacity;
}
window.addEventListener("scroll", updateBannerContent);
window.addEventListener("resize", updateBannerContent);
window.addEventListener("load", updateBannerContent);

/* SECTION BLOCKS */
function observeImages() {
  const options = {
    threshold: Array.from({ length: 101 }, (_, i) => i / 100),
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const img = entry.target;
      img.style.opacity = entry.intersectionRatio;
    });
  }, options);
  document.querySelectorAll(".section-image img").forEach((img) => {
    img.style.opacity = 0;
    observer.observe(img);
  });
}
async function renderSections() {
  const container = document.querySelector(".sections-container");
  container.innerHTML = "";
  sectionBlocks.forEach((block) => {
    const sectionContainer = document.createElement("div");
    sectionContainer.classList.add("section-container");
    sectionContainer.setAttribute("data-key", block.key);
    const sectionBlock = document.createElement("div");
    sectionBlock.classList.add("section-block");
    if (block.model === "b2") sectionBlock.classList.add("b2");
    if (block.model === "b1") {
      sectionBlock.innerHTML = `
        <div class="section-text">
          <h2 data-lang="section_block.${block.key}"></h2>
          <p data-lang="section_block.${block.key}.description"></p>
        </div>
        <div class="section-image">
          <img src="${block.image}" alt="" data-lang="section_block.${block.key}">
        </div>
      `;
    }
    if (block.model === "b2") {
      sectionBlock.innerHTML = `
        <div class="section-image">
          <img src="${block.image}" alt="" data-lang="section_block.${block.key}">
        </div>
        <div class="section-text">
          <h2 data-lang="section_block.${block.key}"></h2>
          <p data-lang="section_block.${block.key}.description"></p>
        </div>
      `;
    }
    sectionContainer.appendChild(sectionBlock);
    container.appendChild(sectionContainer);
  });
}

/* Initiations */
renderSections().then(() => {
  observeImages();
});
SmoothScroll.init();
currentLang = detectLanguage();
const langFile = `lang/${currentLang}.lang`;
applyLang(langFile);
langToggle.textContent = currentLang.toUpperCase();
const defaultMode = detectDefaultMode();
document.body.classList.add(defaultMode);