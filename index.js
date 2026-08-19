document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".super-slide");
  const buttons = document.querySelectorAll(".overlay button");
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  let slideInterval;

  // ===================== 🎞️ SLIDESHOW (HERO CAROUSEL) =====================
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

  // ===================== 🟢 STATUT D'OUVERTURE DYNAMIQUE =====================
  function checkOpenStatus() {
    const statusElement = document.querySelector(".open-status");
    if (!statusElement) return;

    const now = new Date();
    const day = now.getDay();
    const date = now.getDate();
    const month = now.getMonth();
    const hour = now.getHours();
    const minutes = now.getMinutes();

    // Conversion précise en décimales (ex: 21h30 -> 21.5)
    const currentTime = hour + minutes / 60;

    let isOpen = false;
    let message = "";

    // Congés et fermetures exceptionnelles
    if (month === 7 && date >= 10) { 
      message = "🔴 Fermé (congés annuels)";
    } else if (month === 4 && date >= 1 && date <= 5) { 
      message = "🔴 Fermé (fermeture exceptionnelle)";
    } else if (day === 0 || day === 3) { 
      message = "🔴 Fermé aujourd'hui";
    } else {
      // Configuration des nouveaux horaires de la fiche Google
      const schedule = {
        1: [ [12, 14], [19, 21.5] ], // Lundi : 12h-14h / 19h-21h30
        2: [ [12, 14], [19, 21.5] ], // Mardi : 12h-14h / 19h-21h30
        4: [ [12, 14], [19, 21.5] ], // Jeudi : 12h-14h / 19h-21h30
        5: [ [12, 14], [19, 22]   ], // Vendredi : 12h-14h / 19h-22h
        6: [ [12, 14], [19, 22]   ], // Samedi : 12h-14h / 19h-22h
      };

      const todaySchedule = schedule[day];

      if (todaySchedule) {
        for (const period of todaySchedule) {
          // 🔥 Correction ici : strict inférieur (<) sur l'heure de fermeture
          if (currentTime >= period[0] && currentTime < period[1]) {
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