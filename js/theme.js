(function () {
  let mode = null;
  try {
    mode = localStorage.getItem("kw-mode");
  } catch (e) {}
  if (mode !== "dark" && mode !== "light") {
    mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.body.classList.add(mode + "-mode");
})();
