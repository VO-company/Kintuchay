/* MENU CONFIG */
const menuConfig = {
  dataUrl: "info_meta.json",
  currency: "S/",
  defaultColumns: 1
};

/* MENU HELPERS */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null && text !== "") node.textContent = text;
  return node;
}
function slug(text) {
  return (
    String(text)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}
function formatPrice(value) {
  if (value === undefined || value === null || value === "") return "";
  const number = Number(value);
  if (isNaN(number)) return String(value);
  return `${menuConfig.currency} ${number.toFixed(2)}`;
}

/* MENU PRODUCTS */
function resolveColumns(value, fallback) {
  const number = Number(value);
  return number === 1 || number === 2 ? number : fallback;
}
function renderProduct(product, usesTwo, columns) {
  const card = el("li", "product");
  if (usesTwo && resolveColumns(product.columns, columns) === 1) card.classList.add("product--full");
  card.appendChild(el("h3", "product-name", product.name));
  if (product.description) card.appendChild(el("p", "product-desc", product.description));
  if (Array.isArray(product.variants) && product.variants.length) {
    const list = el("ul", "variants");
    const variantColumns = resolveColumns(product.variantsColumns, 1);
    const variantsUseTwo = variantColumns === 2 || product.variants.some((variant) => Number(variant.columns) === 2);
    list.style.setProperty("--vcols", variantsUseTwo ? 2 : 1);
    product.variants.forEach((variant) => {
      const row = el("li", "variant");
      if (variantsUseTwo && resolveColumns(variant.columns, variantColumns) === 1) row.classList.add("variant--full");
      row.appendChild(el("span", "variant-name", variant.name));
      row.appendChild(el("span", "variant-price", formatPrice(variant.price)));
      list.appendChild(row);
    });
    card.appendChild(list);
  }
  if (Array.isArray(product.options) && product.options.length) {
    const chips = el("ul", product.optionsAlign === "center" ? "options options--center" : "options");
    product.options.forEach((option) => chips.appendChild(el("li", null, option)));
    card.appendChild(chips);
  }
  const price = formatPrice(product.price);
  if (price) card.appendChild(el("span", "price", price));
  return card;
}

/* MENU PARTS */
function renderPart(part, usedIds) {
  let id = slug(part.id || part.name);
  while (usedIds[id]) id += "-2";
  usedIds[id] = true;
  const columns = resolveColumns(part.columns, menuConfig.defaultColumns);
  const products = part.products || [];
  const usesTwo = columns === 2 || products.some((product) => Number(product.columns) === 2);
  const section = el("section", `part part--cols-${usesTwo ? 2 : 1}`);
  section.id = id;
  const head = el("div", "part-head");
  head.appendChild(el("h2", "part-title", part.name));
  if (part.note) head.appendChild(el("p", "part-note", part.note));
  section.appendChild(head);
  const list = el("ul", "products");
  list.style.setProperty("--cols", usesTwo ? 2 : 1);
  products.forEach((product) => list.appendChild(renderProduct(product, usesTwo, columns)));
  section.appendChild(list);
  return { id, name: part.name, node: section };
}

/* MENU SIDE MENU */
function buildSideMenu() {
  const back = el("div", "option back");
  back.innerHTML = `<a class="button back_button" href="${ROOT}index.html" data-lang="ui.back"></a>`;
  const parts = el("div");
  parts.id = "menu-sections";
  sideMenu.append(back, createSeparator(), parts, createSeparator(), createModeOption());
}
function buildPartLinks(sections) {
  const container = document.getElementById("menu-sections");
  sections.forEach((section) => {
    const link = el("a", "option section_block", section.name);
    link.href = `#${section.id}`;
    link.dataset.target = section.id;
    container.appendChild(link);
  });
}
function setupScrollSpy(sections) {
  if (!("IntersectionObserver" in window)) return;
  const links = document.querySelectorAll("#menu-sections .section_block");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          const isActive = link.dataset.target === entry.target.id;
          link.classList.toggle("active", isActive);
          if (isActive && isMenuOpen()) link.scrollIntoView({ block: "nearest" });
        });
      });
    },
    { rootMargin: "-20% 0px -65% 0px" }
  );
  sections.forEach((section) => observer.observe(section.node));
}

/* MENU LOAD */
function showError(message) {
  const box = el("div", "error");
  box.appendChild(el("h2", null, "Could not load the menu"));
  box.appendChild(el("p", null, message));
  document.getElementById("menu-content").appendChild(box);
}
function buildMenu(data) {
  const parts = data && data.menu_format && data.menu_format.parts;
  if (!Array.isArray(parts)) throw new Error(`Missing "menu_format.parts" in ${menuConfig.dataUrl}.`);
  const content = document.getElementById("menu-content");
  const usedIds = {};
  const sections = parts.map((part) => {
    const rendered = renderPart(part, usedIds);
    content.appendChild(rendered.node);
    return rendered;
  });
  buildPartLinks(sections);
  setupScrollSpy(sections);
  onLayoutChange();
}
function loadMenu() {
  fetch(menuConfig.dataUrl, { cache: "no-cache" })
    .then((res) => {
      if (!res.ok) throw new Error(`Could not find ${menuConfig.dataUrl} (HTTP ${res.status}).`);
      return res.json();
    })
    .then(buildMenu)
    .catch((err) => {
      let message =
        err instanceof SyntaxError
          ? `${menuConfig.dataUrl} has a format error (check commas and quotes): ${err.message}`
          : err.message;
      if (location.protocol === "file:") {
        message +=
          " You are opening the file directly and the browser blocks loading the JSON. " +
          "Use a local server (for example: python -m http.server) or upload it to a hosting.";
      }
      showError(message);
      onLayoutChange();
    });
}

/* INIT */
whenReady(() => {
  buildSideMenu();
  startSite();
  loadMenu();
});
