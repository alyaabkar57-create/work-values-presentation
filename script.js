/* ============================================================
   سلوكيات وقيم العمل — منطق العرض التفاعلي
   ============================================================ */

(function () {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".slide"));
  const total = slides.length;
  let current = 0;

  const deck = document.getElementById("deck");
  const currentEl = document.getElementById("currentSlide");
  const totalEl = document.getElementById("totalSlides");
  const progressFill = document.getElementById("progressFill");
  const sectionName = document.getElementById("sectionName");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const overview = document.getElementById("overview");
  const overviewBtn = document.getElementById("overviewBtn");
  const overviewList = document.getElementById("overviewList");
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const printBtn = document.getElementById("printBtn");
  const hint = document.getElementById("hint");

  const pad = (n) => String(n).padStart(2, "0");

  /* بناء قائمة الشرائح */
  slides.forEach((slide, index) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML =
      '<span class="idx">' + pad(index + 1) + "</span><span>" +
      slide.dataset.title + "</span>";
    button.addEventListener("click", () => {
      goTo(index);
      closeOverview();
    });
    li.appendChild(button);
    overviewList.appendChild(li);
  });

  totalEl.textContent = pad(total);

  /* الانتقال إلى شريحة */
  function goTo(index, options = {}) {
    const next = Math.max(0, Math.min(total - 1, index));
    if (next === current && !options.force) return;

    const previousSlide = slides[current];
    current = next;
    const activeSlide = slides[current];

    previousSlide.classList.remove("is-active");
    previousSlide.scrollTop = 0;

    // إعادة تشغيل حركات الظهور عند العودة للشريحة
    activeSlide.classList.remove("is-active");
    void activeSlide.offsetWidth;
    activeSlide.classList.add("is-active");
    activeSlide.scrollTop = 0;

    currentEl.textContent = pad(current + 1);
    progressFill.style.width = ((current + 1) / total) * 100 + "%";
    sectionName.textContent = activeSlide.dataset.section || activeSlide.dataset.title;

    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;

    Array.from(overviewList.children).forEach((li, i) => {
      li.querySelector("button").classList.toggle("is-current", i === current);
    });

    if (options.focus !== false) {
      (nextBtn.disabled ? prevBtn : nextBtn).focus({ preventScroll: true });
    }
  }

  const nextSlide = () => goTo(current + 1);
  const prevSlide = () => goTo(current - 1);

  nextBtn.addEventListener("click", nextSlide);
  prevBtn.addEventListener("click", prevSlide);

  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => goTo(Number(button.dataset.go)));
  });

  /* التنقل بلوحة المفاتيح (اتجاه RTL) */
  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (!overview.hidden) {
      if (event.key === "Escape") closeOverview();
      return;
    }

    switch (event.key) {
      case "ArrowLeft":      // التالي في اتجاه RTL
      case "PageDown":
      case " ":
        event.preventDefault();
        nextSlide();
        break;
      case "ArrowRight":     // السابق في اتجاه RTL
      case "PageUp":
        event.preventDefault();
        prevSlide();
        break;
      case "Home":
        event.preventDefault();
        goTo(0);
        break;
      case "End":
        event.preventDefault();
        goTo(total - 1);
        break;
      case "Escape":
        if (document.fullscreenElement) document.exitFullscreen();
        break;
      case "f":
      case "F":
        toggleFullscreen();
        break;
      case "p":
      case "P":
        window.print();
        break;
    }
  });

  /* السحب باللمس للتنقل */
  let touchStartX = 0;
  let touchStartY = 0;
  deck.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].screenX;
    touchStartY = event.changedTouches[0].screenY;
  }, { passive: true });

  deck.addEventListener("touchend", (event) => {
    const dx = event.changedTouches[0].screenX - touchStartX;
    const dy = event.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      // في RTL: السحب لليسار = التالي
      if (dx < 0) nextSlide(); else prevSlide();
    }
  }, { passive: true });

  /* وضع ملء الشاشة */
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      (deck.requestFullscreen || document.documentElement.requestFullscreen)
        ?.call(deck.requestFullscreen ? deck : document.documentElement)
        .catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  fullscreenBtn.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", () => {
    fullscreenBtn.style.background = document.fullscreenElement
      ? "var(--royal)" : "";
    fullscreenBtn.style.color = document.fullscreenElement ? "#fff" : "";
  });

  printBtn.addEventListener("click", () => window.print());

  /* قائمة الشرائح */
  function openOverview() {
    overview.hidden = false;
    overviewBtn.setAttribute("aria-expanded", "true");
    const currentButton = overviewList.querySelector("button.is-current");
    if (currentButton) currentButton.focus({ preventScroll: true });
  }

  function closeOverview() {
    overview.hidden = true;
    overviewBtn.setAttribute("aria-expanded", "false");
    overviewBtn.focus({ preventScroll: true });
  }

  overviewBtn.addEventListener("click", () => {
    overview.hidden ? openOverview() : closeOverview();
  });

  document.querySelectorAll("[data-close-overview]").forEach((el) => {
    el.addEventListener("click", closeOverview);
  });

  /* بطاقات المواقف: إظهار الإجابة */
  document.querySelectorAll(".scenario").forEach((card) => {
    const toggle = card.querySelector(".sc-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      const isOpen = card.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.firstChild.textContent = isOpen ? "إخفاء الإجابة " : "عرض السلوك الصحيح ";
    });
  });

  /* تلميح أولي يختفي تلقائياً */
  let hintTimer;
  function showHint() {
    hint.classList.add("is-visible");
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => hint.classList.remove("is-visible"), 4500);
  }

  /* صور احتياطية إن تعذّر تحميلها */
  document.querySelectorAll(".photo img").forEach((img) => {
    img.addEventListener("error", () => { img.style.display = "none"; });
  });

  /* تهيئة */
  goTo(0, { force: true, focus: false });
  overviewBtn.setAttribute("aria-expanded", "false");
  setTimeout(showHint, 1200);

  // إخفاء التلميح على الشاشات الصغيرة عند تغيير الحجم
  window.addEventListener("resize", () => {
    if (window.innerWidth < 560) hint.classList.remove("is-visible");
  });
})();
