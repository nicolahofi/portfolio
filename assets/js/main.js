// main.js
(() => {
  const initProjectModal = () => {
    const backdrop = document.getElementById("modalBackdrop");
    const closeBtn = document.getElementById("modalClose");
    const titleEl = document.getElementById("modalTitle");
    const subtitleEl = document.getElementById("modalSubtitle");
    const roleEl = document.getElementById("modalRole");
    const descEl = document.getElementById("modalDescription");
    const linksEl = document.getElementById("modalLinks");

    if (!backdrop || !closeBtn || !titleEl || !subtitleEl || !roleEl || !descEl || !linksEl) return;

    backdrop.hidden = true;
    const openers = Array.from(document.querySelectorAll(".js-modal-open"));
    const focusableSelector =
      'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    let previouslyFocused = null;
    let focusableElements = [];

    const openModal = (card) => {
      const title = card.getAttribute("data-title") || "Untitled";
      const subtitle = card.getAttribute("data-subtitle") || "";
      const description = card.getAttribute("data-description") || "";
      const role = card.getAttribute("data-role") || "";
      const linksRaw = card.getAttribute("data-links") || "[]";

      titleEl.textContent = title;
      subtitleEl.textContent = subtitle;
      roleEl.textContent = role;
      descEl.textContent = description;

      linksEl.innerHTML = "";
      let links = [];
      try {
        links = JSON.parse(linksRaw);
        if (!Array.isArray(links)) links = [];
      } catch {
        links = [];
      }

      links.forEach((l) => {
        const label = typeof l.label === "string" ? l.label.trim() : "";
        const url = typeof l.url === "string" ? l.url.trim() : "";
        if (!url || url === "#") return;
        const a = document.createElement("a");
        a.className = "modal-link";
        a.href = url;
        if (/^https?:\/\//i.test(url)) {
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        }
        const icon = document.createElement("span");
        icon.className = "material-symbols-outlined";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "arrow_outward";
        const text = document.createElement("span");
        text.textContent = label || "Link";
        a.append(icon, text);
        linksEl.appendChild(a);
      });

      previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      backdrop.hidden = false;
      focusableElements = Array.from(backdrop.querySelectorAll(focusableSelector));
      (focusableElements[0] || closeBtn).focus();
    };

    const closeModal = () => {
      backdrop.hidden = true;
      focusableElements = [];
      if (previouslyFocused) {
        previouslyFocused.focus();
        previouslyFocused = null;
      }
    };

    openers.forEach((card) => {
      card.addEventListener("click", () => openModal(card));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openModal(card);
        }
      });
    });

    closeBtn.addEventListener("click", closeModal);

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal();
    });

    document.addEventListener("keydown", (event) => {
      if (backdrop.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }
      if (event.key !== "Tab" || !focusableElements.length) return;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  };

  const initProjectInfoPanels = () => {
    const toggles = Array.from(document.querySelectorAll(".project-info-toggle"));
    if (!toggles.length) return;

    const pairs = toggles
      .map((toggle) => {
        const panelId = toggle.getAttribute("aria-controls");
        if (!panelId) return null;
        const panel = document.getElementById(panelId);
        if (!panel) return null;
        panel.hidden = true;
        return { toggle, panel };
      })
      .filter(Boolean);

    if (!pairs.length) return;

    const closeAll = () => {
      pairs.forEach(({ toggle, panel }) => {
        toggle.setAttribute("aria-expanded", "false");
        panel.hidden = true;
      });
    };

    const openPanel = (toggle, panel) => {
      closeAll();
      toggle.setAttribute("aria-expanded", "true");
      panel.hidden = false;
    };

    pairs.forEach(({ toggle, panel }) => {
      toggle.addEventListener("click", (event) => {
        event.stopPropagation();
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        if (expanded) {
          closeAll();
        } else {
          openPanel(toggle, panel);
        }
      });

      panel.addEventListener("click", (event) => event.stopPropagation());

      const closeBtn = panel.querySelector(".project-info-close");
      if (closeBtn) {
        closeBtn.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          closeAll();
          toggle.focus();
        });
      }
    });

    document.addEventListener("click", (event) => {
      if (event.target.closest(".project-info-panel") || event.target.closest(".project-info-toggle")) return;
      closeAll();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeAll();
    });
  };

  const initHeroSlider = () => {
    const slider = document.querySelector("[data-hero-slider]");
    if (!slider) return;

    const slides = Array.from(slider.querySelectorAll(".hero-slide"));
    if (slides.length <= 1) return;

    const indicatorsContainer = slider.querySelector(".hero-slider-indicators");
    const prevBtn = slider.querySelector("[data-hero-prev]");
    const nextBtn = slider.querySelector("[data-hero-next]");
    let activeIndex = 0;
    let autoTimer;
    const prefersReducedMotion = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : { matches: false };

    let indicators = [];

    const updateState = () => {
      slides.forEach((slide, idx) => {
        slide.classList.toggle("is-active", idx === activeIndex);
      });
      indicators.forEach((indicator, idx) => {
        indicator.classList.toggle("is-active", idx === activeIndex);
      });
    };

    const goTo = (index) => {
      activeIndex = (index + slides.length) % slides.length;
      updateState();
      resetTimer();
    };

    const next = () => goTo(activeIndex + 1);
    const prev = () => goTo(activeIndex - 1);

    const renderIndicators = () => {
      if (!indicatorsContainer) return [];
      indicatorsContainer.innerHTML = "";
      return slides.map((_, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "hero-indicator";
        btn.setAttribute("aria-label", `Bild ${idx + 1}`);
        btn.addEventListener("click", () => goTo(idx));
        indicatorsContainer.appendChild(btn);
        return btn;
      });
    };

    indicators = renderIndicators();
    const shouldAutoPlay = () => !prefersReducedMotion.matches;
    const resetTimer = () => {
      if (autoTimer) clearInterval(autoTimer);
      if (shouldAutoPlay()) {
        autoTimer = window.setInterval(next, 6000);
      }
    };

    prevBtn?.addEventListener("click", prev);
    nextBtn?.addEventListener("click", next);

    updateState();
    resetTimer();

    const handleMotionChange = () => resetTimer();
    if (typeof prefersReducedMotion.addEventListener === "function") {
      prefersReducedMotion.addEventListener("change", handleMotionChange);
    } else if (typeof prefersReducedMotion.addListener === "function") {
      prefersReducedMotion.addListener(handleMotionChange);
    }
  };

  const initEmailCopy = () => {
    const emailBtn = document.querySelector(".about-email-btn");
    if (!emailBtn) return;
    const email = emailBtn.getAttribute("data-email");
    if (!email) return;

    const defaultLabel = emailBtn.textContent.trim();
    const width = emailBtn.offsetWidth;
    if (width) emailBtn.style.width = `${width}px`;

    emailBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(email);
        emailBtn.textContent = "Kopiert!";
        setTimeout(() => {
          emailBtn.textContent = defaultLabel;
        }, 1800);
      } catch {
        window.prompt("E-Mail kopieren:", email);
      }
    });
  };

  const initMobileNav = () => {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("siteNav");
    if (!toggle || !nav) return;

    const closeNav = () => {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    };

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      if (expanded) {
        closeNav();
      } else {
        toggle.setAttribute("aria-expanded", "true");
        nav.classList.add("is-open");
      }
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeNav();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) closeNav();
    });
  };

  initProjectModal();
  initProjectInfoPanels();
  initHeroSlider();
  initEmailCopy();
  initMobileNav();
})();
