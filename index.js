// ========================
// Éléments
// ========================
const slides = document.querySelectorAll('.super-slide');
const buttons = document.querySelectorAll('.overlay button');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

// ========================
// Slideshow (Uniquement si les éléments existent)
// ========================
if (slides.length > 0) {
    let activeIndex = 0;
    const autoDelay = 5000;
    let slideInterval;

    slides[activeIndex].classList.add('active');

    function nextSlide() {
        slides[activeIndex].classList.remove('active');
        activeIndex = (activeIndex + 1) % slides.length;
        slides[activeIndex].classList.add('active');
    }

    function startAutoSlide() {
        slideInterval = setInterval(nextSlide, autoDelay);
    }

    function stopAutoSlide() {
        clearInterval(slideInterval);
    }

    startAutoSlide();

    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', stopAutoSlide);
        btn.addEventListener('mouseleave', startAutoSlide);
    });
}

// ========================
// Hamburger menu (Toujours actif)
// ========================
if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

function checkOpenStatus() {
    const now = new Date();
    const day = now.getDay(); // 0 = dimanche, 1 = lundi...
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hour + minutes / 60;

    let isOpen = false;

    // Définition des horaires
    const schedule = {
        1: [[12, 14], [19, 22]], // lundi
        2: [[12, 14], [19, 22]], // mardi
        3: null,                 // mercredi fermé
        4: [[12, 14], [19, 22]], // jeudi
        5: [[12, 14], [19, 23]], // vendredi
        6: [[12, 14], [19, 23]], // samedi
        0: null                  // dimanche fermé
    };

    const todaySchedule = schedule[day];

    if (todaySchedule) {
        for (let period of todaySchedule) {
            if (currentTime >= period[0] && currentTime <= period[1]) {
                isOpen = true;
                break;
            }
        }
    }

    const statusElement = document.querySelector(".open-status");

    if (isOpen) {
        statusElement.textContent = "🟢 Ouvert actuellement";
        statusElement.style.color = "green";
    } else {
        statusElement.textContent = "🔴 Fermé actuellement";
        statusElement.style.color = "red";
    }
}

// Lancer au chargement
checkOpenStatus();