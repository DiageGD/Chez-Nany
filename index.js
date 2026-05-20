document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".super-slide");
  const buttons = document.querySelectorAll(".overlay button");
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  let slideInterval;

  // ===================== SLIDES =====================
  if (slides.length > 0) {
    let activeIndex = 0;
    const autoDelay = 5000;

    slides[activeIndex].classList.add("active");

    function nextSlide() {
      slides[activeIndex].classList.remove("active");
      activeIndex = (activeIndex + 1) % slides.length;
      slides[activeIndex].classList.add("active");
    }

    function startAutoSlide() {
      if (!slideInterval) {
        slideInterval = setInterval(nextSlide, autoDelay);
      }
    }

    function stopAutoSlide() {
      clearInterval(slideInterval);
      slideInterval = null;
    }

    startAutoSlide();

    if (buttons.length > 0) {
      buttons.forEach((btn) => {
        btn.addEventListener("mouseenter", stopAutoSlide);
        btn.addEventListener("mouseleave", startAutoSlide);
      });
    }
  }

  // ===================== OPEN STATUS =====================
  function checkOpenStatus() {
    const statusElement = document.querySelector(".open-status");
    if (!statusElement) return;

    const now = new Date();
    const day = now.getDay();
    const date = now.getDate();
    const month = now.getMonth();
    const hour = now.getHours();
    const minutes = now.getMinutes();

    const currentTime = hour + minutes / 60;

    let isOpen = false;
    let message = "";

    if (month === 7 && date >= 10) {
      message = "🔴 Fermé (congés annuels)";
    } else if (month === 4 && date >= 1 && date <= 5) {
      message = "🔴 Fermé (fermeture exceptionnelle)";
    } else if (day === 0 || day === 3) {
      message = "🔴 Fermé aujourd'hui";
    } else {
      const schedule = {
        1: [
          [12, 14],
          [19, 22],
        ],
        2: [
          [12, 14],
          [19, 22],
        ],
        4: [
          [12, 14],
          [19, 22],
        ],
        5: [
          [12, 14],
          [19, 23],
        ],
        6: [
          [12, 14],
          [19, 23],
        ],
      };

      const todaySchedule = schedule[day];

      if (todaySchedule) {
        for (const period of todaySchedule) {
          if (currentTime >= period[0] && currentTime <= period[1]) {
            isOpen = true;
            message = "🟢 Ouvert actuellement";
            break;
          }
        }

        if (!isOpen && message === "") {
          message = "🔴 Fermé actuellement";
        }
      }
    }

    statusElement.textContent = message;
  }

  checkOpenStatus();
});
