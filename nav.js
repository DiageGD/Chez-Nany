// ======================================================
// 🧭 NAVIGATION GLOBAL SCRIPT (SUPABASE READY)
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  const navLinks = document.querySelector(".nav-links");
  const navToggle = document.querySelector(".nav-toggle");
  const navLogo = document.getElementById("navLogoLink");

  // ======================================================
  // 🍔 BURGER MENU
  // ======================================================

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }

  // ======================================================
  // 👤 NAV ACCOUNT LOGIC
  // ======================================================

  if (navLogo) {
    navLogo.addEventListener("click", async (e) => {
      e.preventDefault();

      const user = await getCurrentUser();

      if (user) {
        window.location.href = "admin.html";
      } else {
        window.location.href = "login.html";
      }
    });
  }

  // ======================================================
  // ⭐ UPDATE NAV STATE
  // ======================================================

  async function updateNavState() {
    const user = await getCurrentUser();

    if (user && navLogo) {
      navLogo.title = "Mon compte";
    } else if (navLogo) {
      navLogo.title = "Se connecter";
    }
  }

  updateNavState();
});