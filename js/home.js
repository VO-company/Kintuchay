/* HOME SIDE MENU */
function buildMenuSections() {
  const container = document.getElementById("menu-sections");
  sectionBlocks.forEach((block) => {
    const link = document.createElement("a");
    link.className = "option section_block";
    link.href = `#${block.key}`;
    link.dataset.lang = `section_block.${block.key}`;
    container.appendChild(link);
  });
}
function buildSideMenu() {
  sideMenu.innerHTML = `
    <div id="menu-sections"></div>
    <a class="option section_block" href="#menus" data-lang="ui.menu"></a>
    <div class="option location">
      <a class="option-title" href="#map" data-lang="ui.map"></a>
      <a class="suboption google" data-link="google" data-leaf target="_blank" rel="noopener" data-lang="map.google"></a>
      <a class="suboption waze" data-link="waze" data-leaf target="_blank" rel="noopener" data-lang="map.waze"></a>
    </div>`;
  sideMenu.append(createSeparator(), createLangOption(), createModeOption());
  buildMenuSections();
}

/* BANNER */
banner.addEventListener("click", () => scrollToY(banner.offsetTop + banner.offsetHeight));
document.getElementById("scroll-hint").addEventListener("click", (e) => {
  e.stopPropagation();
  scrollToY(banner.offsetTop + banner.offsetHeight);
});

/* SECTION BLOCKS */
function renderSections() {
  const container = document.querySelector(".sections-container");
  container.replaceChildren();
  sectionBlocks.forEach((block) => {
    const section = document.createElement("section");
    section.className = "section-container";
    section.id = block.key;
    const text = `
      <div class="section-text">
        <h2 data-lang="section_block.${block.key}"></h2>
        <p data-lang="section_block.${block.key}.description"></p>
      </div>`;
    const image = `
      <div class="section-image">
        <img src="${block.image}" width="512" height="512" loading="lazy" alt="" data-lang-alt="alt.${block.key}">
      </div>`;
    section.innerHTML = `<div class="section-block ${block.model}">${block.model === "b2" ? image + text : text + image}</div>`;
    container.appendChild(section);
  });
}

/* MENUS */
document.querySelectorAll(".menu-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const links = menuLinks[button.dataset.menu];
    if (!links) return;
    window.location.href = links[currentLang] || links[defaultLang];
  });
});

/* INIT */
whenReady(() => {
  buildSideMenu();
  renderSections();
  startSite();
});

