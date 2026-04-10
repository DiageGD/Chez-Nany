const slides = document.querySelectorAll('.super-slide');
const buttons = document.querySelectorAll('.overlay button');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

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

if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

function checkOpenStatus() {
    const now = new Date();
    const day = now.getDay(); // 0 = dimanche
    const date = now.getDate();
    const month = now.getMonth(); // 0 = janvier, 7 = août
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hour + minutes / 60;

    let isOpen = false;
    let message = "";

    // ❌ Fermeture annuelle : 3 dernières semaines d'août
    if (month === 7 && date >= 10) {
        message = "🔴 Fermé (congés annuels)";
    }

    // ❌ Jours fermés fixes
    else if (day === 0 || day === 3) {
        message = "🔴 Fermé aujourd’hui";
    }

    else {
        const schedule = {
            1: [[12, 14], [19, 22]],
            2: [[12, 14], [19, 22]],
            4: [[12, 14], [19, 22]],
            5: [[12, 14], [19, 23]],
            6: [[12, 14], [19, 23]]
        };

        const todaySchedule = schedule[day];

        if (todaySchedule) {
            for (let period of todaySchedule) {
                if (currentTime >= period[0] && currentTime <= period[1]) {
                    isOpen = true;
                    message = "🟢 Ouvert actuellement";
                    break;
                }
            }

            if (!isOpen) {
                message = "🔴 Fermé actuellement";
            }
        }
    }

    const statusElement = document.querySelector(".open-status");
    statusElement.textContent = message;
}

checkOpenStatus();
