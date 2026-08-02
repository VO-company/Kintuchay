(function (window, document) {
  "use strict";
  class SmoothScrollController {
    constructor(element) {
      this.element = element;
      this.isWindow = element === window;
      const smoothValue = this.isWindow ? document.body.dataset.smooth : element.dataset.smooth;
      this.lerp = this.parseLerp(smoothValue);
      const wheelValue = this.isWindow ? document.body.dataset.wheel : element.dataset.wheel;
      this.wheelMultiplier = this.parseNumber(wheelValue, 1);
      const horizontalValue = this.isWindow ? document.body.dataset.horizontal : element.dataset.horizontal;
      this.shiftToHorizontal = horizontalValue !== "false";
      this.x = this.getScrollX();
      this.y = this.getScrollY();
      this.targetX = this.x;
      this.targetY = this.y;
      this.animating = false;
      this.destroyed = false;
      this.onWheel = this.onWheel.bind(this);
      this.onScroll = this.onScroll.bind(this);
      this.onClick = this.onClick.bind(this);
      this.onResize = this.onResize.bind(this);
      this.init();
    }
    init() {
      this.element.addEventListener("wheel", this.onWheel, { passive: false });
      this.element.addEventListener("scroll", this.onScroll, { passive: true });
      this.element.addEventListener("touchstart", this.onTouchStart.bind(this), { passive: false });
      this.element.addEventListener("touchmove", this.onTouchMove.bind(this), { passive: false });
      this.element.addEventListener("touchend", this.onTouchEnd.bind(this), { passive: true });

      if (this.isWindow) {
        window.addEventListener(
          "resize",

          this.onResize,
        );
        document.addEventListener(
          "click",

          this.onClick,
        );
      }
      this.start();
    }
    parseLerp(value) {
      const number = parseFloat(value);

      if (!Number.isFinite(number)) {
        return 0.08;
      }
      return Math.max(0.01, Math.min(number, 1));
    }
    parseNumber(value, fallback) {
      const number = parseFloat(value);
      return Number.isFinite(number) ? number : fallback;
    }
    getScrollX() {
      return this.isWindow ? window.scrollX : this.element.scrollLeft;
    }
    getScrollY() {
      return this.isWindow ? window.scrollY : this.element.scrollTop;
    }
    getMaxX() {
      if (this.isWindow) {
        return Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
      }
      return Math.max(0, this.element.scrollWidth - this.element.clientWidth);
    }
    getMaxY() {
      if (this.isWindow) {
        return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      }
      return Math.max(0, this.element.scrollHeight - this.element.clientHeight);
    }
    clampX(value) {
      return Math.max(0, Math.min(value, this.getMaxX()));
    }
    clampY(value) {
      return Math.max(0, Math.min(value, this.getMaxY()));
    }
    onWheel(event) {
      if (event.ctrlKey) {
        return;
      }
      const maxX = this.getMaxX();
      const maxY = this.getMaxY();
      if (maxX <= 0 && maxY <= 0) {
        return;
      }
      let dx = event.deltaX;
      let dy = event.deltaY;
      if (this.shiftToHorizontal && event.shiftKey && Math.abs(dy) > Math.abs(dx)) {
        dx = dy;
        dy = 0;
      }
      if (maxX > 0 && maxY <= 0 && Math.abs(dy) > Math.abs(dx)) {
        dx = dy;
        dy = 0;
      }
      if (maxY > 0 && maxX <= 0) {
        dx = 0;
        dy = event.deltaY;
      }
      if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
        return;
      }
      event.preventDefault();
      this.targetX += dx * this.wheelMultiplier;
      this.targetY += dy * this.wheelMultiplier;
      this.targetX = this.clampX(this.targetX);
      this.targetY = this.clampY(this.targetY);
      this.animating = true;
    }
    onScroll() {
      if (!this.animating) {
        this.x = this.getScrollX();
        this.y = this.getScrollY();
        this.targetX = this.x;
        this.targetY = this.y;
      }
    }
    onResize() {
      this.targetX = this.clampX(this.targetX);
      this.targetY = this.clampY(this.targetY);
    }
    onTouchStart(event) {
      this.touchStartY = event.touches[0].clientY;
      this.startTargetY = this.targetY;
    }
    onTouchMove(event) {
      const deltaY = this.touchStartY - event.touches[0].clientY;
      this.targetY = this.clampY(this.startTargetY + deltaY);
      this.animating = true;
      event.preventDefault();
    }
    onTouchEnd() {
    }
    onClick(event) {
      const link = event.target.closest("a[href^='#']");
      if (!link) {
        return;
      }
      const href = link.getAttribute("href");
      if (!href || href === "#") {
        return;
      }
      let target;
      try {
        target = document.querySelector(href);
      } catch {
        return;
      }
      if (!target) {
        return;
      }
      event.preventDefault();
      const rect = target.getBoundingClientRect();
      this.targetX = this.clampX(rect.left + window.scrollX);
      this.targetY = this.clampY(rect.top + window.scrollY);
      this.animating = true;
      history.pushState(null, "", href);
    }
    setScroll(x, y) {
      if (this.isWindow) {
        window.scrollTo(x, y);
      } else {
        this.element.scrollLeft = x;
        this.element.scrollTop = y;
      }
    }
    start() {
      const frame = () => {
        if (this.destroyed) {
          return;
        }
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        this.x += dx * this.lerp;
        this.y += dy * this.lerp;
        if (Math.abs(dx) < 0.01) {
          this.x = this.targetX;
        }
        if (Math.abs(dy) < 0.01) {
          this.y = this.targetY;
        }
        this.setScroll(this.x, this.y);
        if (Math.abs(this.targetX - this.x) < 0.01 && Math.abs(this.targetY - this.y) < 0.01) {
          this.animating = false;
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }
    scrollTo(x = this.targetX, y = this.targetY) {
      this.targetX = this.clampX(x);
      this.targetY = this.clampY(y);
      this.animating = true;
    }
    scrollToElement(element) {
      if (typeof element === "string") {
        element = document.querySelector(element);
      }
      if (!element) {
        return;
      }
      if (this.isWindow) {
        const rect = element.getBoundingClientRect();
        this.scrollTo(rect.left + window.scrollX, rect.top + window.scrollY);
      } else {
        const elementRect = element.getBoundingClientRect();
        const containerRect = this.element.getBoundingClientRect();
        this.scrollTo(this.x + (elementRect.left - containerRect.left), this.y + (elementRect.top - containerRect.top));
      }
    }
    destroy() {
      this.destroyed = true;
      this.element.removeEventListener("wheel", this.onWheel);
      this.element.removeEventListener("scroll", this.onScroll);
      if (this.isWindow) {
        window.removeEventListener("resize", this.onResize);
        document.removeEventListener("click", this.onClick);
      }
    }
  }
  const SmoothScroll = {
    instances: [],
    init() {
      this.destroy();
      if (document.body.hasAttribute("data-smooth-scroll")) {
        const instance = new SmoothScrollController(window);

        this.instances.push(instance);
      }
      const elements = document.querySelectorAll("[data-smooth-scroll]");
      elements.forEach((element) => {
        if (element === document.body || element === document.documentElement) {
          return;
        }
        const instance = new SmoothScrollController(element);
        this.instances.push(instance);
      });
      return this;
    },
    get(element) {
      if (element === window) {
        return this.instances.find((instance) => instance.isWindow);
      }
      return this.instances.find((instance) => instance.element === element);
    },
    scrollTo(x, y) {
      const instance = this.instances.find((instance) => instance.isWindow);
      if (instance) {
        instance.scrollTo(x, y);
      }
    },
    scrollToElement(element) {
      const instance = this.instances.find((instance) => instance.isWindow);
      if (instance) {
        instance.scrollToElement(element);
      }
    },
    destroy() {
      this.instances.forEach((instance) => instance.destroy());
      this.instances = [];
    },
  };
  window.SmoothScroll = SmoothScroll;
})(window, document);
