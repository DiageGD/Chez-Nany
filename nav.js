// ======================================================
// 🍔 BURGER MENU (Exécuté en premier pour être incassable)
// ======================================================
const navLinks = document.querySelector(".nav-links");
const navToggle = document.querySelector(".nav-toggle");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

// ======================================================
// 🧭 NAVIGATION GLOBAL SCRIPT (SUPABASE LOGIC)
// ======================================================
document.addEventListener("DOMContentLoaded", async () => {
  const navLogo = document.getElementById("navLogoLink");

  // 👤 NAV ACCOUNT LOGIC
  if (navLogo) {
    navLogo.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        const user = await getCurrentUser();
        if (user) {
          window.location.href = "admin.html";
        } else {
          window.location.href = "login.html";
        }
      } catch (err) {
        window.location.href = "login.html";
      }
    });
  }

  // ⭐ UPDATE NAV STATE
  async function updateNavState() {
    try {
      const user = await getCurrentUser();
      if (user && navLogo) {
        navLogo.title = "Mon compte";
      } else if (navLogo) {
        navLogo.title = "Se connecter";
      }
    } catch (err) {
      console.log("Supabase pas encore initialisé");
    }
  }

  updateNavState();
});
