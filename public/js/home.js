// public/js/home.js

document.addEventListener("DOMContentLoaded", () => {
  // ===== User dropdown =====
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userMenu = document.getElementById("userMenu");
  const logoutBtn = document.getElementById("logoutBtn");

  function closeUserMenu() {
    if (userMenu) userMenu.classList.add("hidden");
  }
  function toggleUserMenu() {
    if (!userMenu) return;
    userMenu.classList.toggle("hidden");
  }

  if (userMenuBtn) {
    userMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleUserMenu();
    });
  }

  document.addEventListener("click", () => closeUserMenu());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeUserMenu();
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      // server.js có GET /logout
      window.location.href = "/logout";
    });
  }

  // ===== Core Lessons carousel (Prev/Next) =====
  const carousel = document.getElementById("coreCarousel");
  const prevBtn = document.getElementById("corePrevBtn");
  const nextBtn = document.getElementById("coreNextBtn");

  function scrollByAmount(direction) {
    if (!carousel) return;
    // scroll gần bằng chiều rộng khung nhìn của carousel (1-2 card)
    const amount = Math.max(260, Math.floor(carousel.clientWidth * 0.85));
    carousel.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  function updateArrowState() {
    if (!carousel || !prevBtn || !nextBtn) return;
    const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;

    const atStart = carousel.scrollLeft <= 2;
    const atEnd = carousel.scrollLeft >= maxScrollLeft - 2;

    prevBtn.disabled = atStart;
    nextBtn.disabled = atEnd;

    prevBtn.classList.toggle("opacity-40", atStart);
    prevBtn.classList.toggle("cursor-not-allowed", atStart);

    nextBtn.classList.toggle("opacity-40", atEnd);
    nextBtn.classList.toggle("cursor-not-allowed", atEnd);
  }

  if (prevBtn) prevBtn.addEventListener("click", () => scrollByAmount(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => scrollByAmount(1));
  if (carousel) {
    carousel.addEventListener("scroll", () => {
      // debounce nhẹ
      window.requestAnimationFrame(updateArrowState);
    });
    updateArrowState();
    // nếu resize -> cập nhật lại
    window.addEventListener("resize", updateArrowState);
  }
});
