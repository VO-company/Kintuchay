const isMobile = /Mobi|Android/i.test(navigator.userAgent);

(function (window, document) {
  "use strict";

  const DEFAULT_LERP = 0.08;
  const STOP_DISTANCE = 0.5;
  const MAX_FRAME_TIME = 0.05;
  const LINE_HEIGHT = 40;
  const KEY_STEP = 60;
  const PAGE_RATIO = 0.9;

  const root = document.documentElement;

  let lerp = DEFAULT_LERP;
  let wheelMultiplier = 1;
  let y = 0;
  let targetY = 0;
  let maxY = 0;
  let frameId = 0;
  let lastTime = 0;
  let touchStartY = 0;
  let touchStartTarget = 0;
  let resizeObserver = null;
  let listening = false;
  const innerStates = new WeakMap();
  const activeInner = new Set();

  function parseNumber(value, fallback, min, max) {
    const number = parseFloat(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(min, Math.min(number, max));
  }

  function updateMax() {
    maxY = Math.max(0, root.scrollHeight - window.innerHeight);
  }

  function clampY(value) {
    return Math.max(0, Math.min(value, maxY));
  }

  function applyScroll(value) {
    window.scrollTo({ top: value, left: 0, behavior: "instant" });
  }

  function frame(now) {
    const dt = Math.min((now - lastTime) / 1000, MAX_FRAME_TIME);
    lastTime = now;
    const distance = targetY - y;
    if (Math.abs(distance) < STOP_DISTANCE) {
      y = targetY;
      applyScroll(y);
      frameId = 0;
      return;
    }
    y += distance * (1 - Math.pow(1 - lerp, dt * 60));
    applyScroll(y);
    frameId = requestAnimationFrame(frame);
  }

  function setTarget(value) {
    targetY = clampY(value);
    if (frameId) return;
    lastTime = performance.now();
    frameId = requestAnimationFrame(frame);
  }

  function findInnerScroller(target, dy) {
    let element = target;
    while (element && element !== document.body && element !== root) {
      if (element.scrollHeight > element.clientHeight) {
        const overflow = getComputedStyle(element).overflowY;
        if (overflow === "auto" || overflow === "scroll") {
          const state = innerStates.get(element);
          const current = state && state.frameId ? state.target : element.scrollTop;
          const atTop = current <= 0;
          const atBottom = current + element.clientHeight >= element.scrollHeight - 1;
          if ((dy < 0 && !atTop) || (dy > 0 && !atBottom)) return element;
        }
      }
      element = element.parentElement;
    }
    return null;
  }

  function innerFrame(element, state, now) {
    const dt = Math.min((now - state.lastTime) / 1000, MAX_FRAME_TIME);
    state.lastTime = now;
    const distance = state.target - state.y;
    if (Math.abs(distance) < STOP_DISTANCE) {
      state.y = state.target;
      element.scrollTop = state.y;
      state.frameId = 0;
      activeInner.delete(state);
      return;
    }
    state.y += distance * (1 - Math.pow(1 - lerp, dt * 60));
    element.scrollTop = state.y;
    state.frameId = requestAnimationFrame((time) => innerFrame(element, state, time));
  }

  function scrollInner(element, dy) {
    let state = innerStates.get(element);
    if (!state) {
      state = { y: 0, target: 0, frameId: 0, lastTime: 0 };
      innerStates.set(element, state);
    }
    if (!state.frameId) {
      state.y = element.scrollTop;
      state.target = state.y;
    }
    const max = Math.max(0, element.scrollHeight - element.clientHeight);
    state.target = Math.max(0, Math.min(state.target + dy * wheelMultiplier, max));
    if (state.frameId) return;
    state.lastTime = performance.now();
    activeInner.add(state);
    state.frameId = requestAnimationFrame((time) => innerFrame(element, state, time));
  }

  function onWheel(event) {
    if (event.ctrlKey) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    let dy = event.deltaY;
    if (event.deltaMode === 1) dy *= LINE_HEIGHT;
    else if (event.deltaMode === 2) dy *= window.innerHeight;
    if (Math.abs(dy) < 0.01) return;
    const inner = findInnerScroller(event.target, dy);
    if (inner) {
      event.preventDefault();
      scrollInner(inner, dy);
      return;
    }
    if (maxY <= 0) return;
    event.preventDefault();
    setTarget(targetY + dy * wheelMultiplier);
  }

  function onScroll() {
    if (frameId) return;
    y = window.scrollY;
    targetY = y;
  }

  function onResize() {
    updateMax();
    targetY = clampY(targetY);
  }

  function onKeyDown(event) {
    if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || maxY <= 0) return;
    const active = document.activeElement;
    const tag = active ? active.tagName : "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (active && active.isContentEditable)) return;
    if (event.key === " " && (tag === "BUTTON" || tag === "A")) return;
    const page = window.innerHeight * PAGE_RATIO;
    let delta;
    switch (event.key) {
      case "ArrowDown":
        delta = KEY_STEP;
        break;
      case "ArrowUp":
        delta = -KEY_STEP;
        break;
      case "PageDown":
        delta = page;
        break;
      case "PageUp":
        delta = -page;
        break;
      case " ":
        delta = event.shiftKey ? -page : page;
        break;
      case "Home":
        event.preventDefault();
        setTarget(0);
        return;
      case "End":
        event.preventDefault();
        setTarget(maxY);
        return;
      default:
        return;
    }
    event.preventDefault();
    setTarget(targetY + delta);
  }

  function onTouchStart(event) {
    touchStartY = event.touches[0].clientY;
    touchStartTarget = frameId ? targetY : window.scrollY;
  }

  function onTouchMove(event) {
    if (maxY <= 0) return;
    event.preventDefault();
    setTarget(touchStartTarget + touchStartY - event.touches[0].clientY);
  }

  function onClick(event) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest && event.target.closest("a[href^='#']");
    if (!link) return;
    const id = link.getAttribute("href").slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    scrollToElement(target);
    history.pushState(null, "", `#${id}`);
  }

  function scrollTo(x, top) {
    if (!listening) return;
    setTarget(Number.isFinite(top) ? top : targetY);
  }

  function scrollToElement(element) {
    if (!listening) return;
    const target = typeof element === "string" ? document.querySelector(element) : element;
    if (!target) return;
    setTarget(target.getBoundingClientRect().top + window.scrollY);
  }

  function destroy() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    activeInner.forEach((state) => {
      cancelAnimationFrame(state.frameId);
      state.frameId = 0;
    });
    activeInner.clear();
    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = null;
    if (!listening) return;
    listening = false;
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("click", onClick);
  }

  function init() {
    destroy();
    if (isMobile || !document.body.hasAttribute("data-smooth-scroll")) return SmoothScroll;
    lerp = parseNumber(document.body.dataset.smooth, DEFAULT_LERP, 0.01, 1);
    wheelMultiplier = parseNumber(document.body.dataset.wheel, 1, 0.01, 100);
    y = window.scrollY;
    targetY = y;
    updateMax();
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick);
    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(document.body);
    }
    listening = true;
    return SmoothScroll;
  }

  const SmoothScroll = { init, destroy, scrollTo, scrollToElement };
  window.SmoothScroll = SmoothScroll;
})(window, document);