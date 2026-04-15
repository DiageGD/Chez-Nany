document.addEventListener("DOMContentLoaded", () => {

  // =============================
  // 🔐 INIT SUPABASE
  // =============================
  if (!window.supabase) {
    alert("❌ Supabase non chargé");
    return;
  }

  const SUPABASE_URL = "https://mcyadykysjwlwfnrplqs.supabase.co";
  const SUPABASE_KEY = "sb_publishable_VMQE7cuXKGZ7A7mkyTAQ-A_QKtDg4Ae";

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // =============================
  // 📱 MENU MOBILE
  // =============================
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // =============================
  // 🍽️ RÉSERVATION
  // =============================
  const form = document.getElementById("reservationForm");
  const message = document.getElementById("message");

  if (!form) return; // évite erreurs sur autres pages

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    message.textContent = "⏳ Envoi en cours...";

    const formData = new FormData(form);

    const data = {
      firstname: formData.get("firstname"),
      lastname: formData.get("lastname"),
      date: formData.get("date"),
      time: formData.get("time"),
      people: parseInt(formData.get("people")),
      email: formData.get("email"),
      phone: formData.get("phone")
    };

    try {
      // 🔢 compter réservations du jour
      const { data: existing, error: fetchError } = await supabase
        .from("reservations")
        .select("id")
        .eq("date", data.date);

      if (fetchError) {
        message.textContent = "❌ Erreur lors de la vérification";
        message.className = "error";
        return;
      }

      data.number = (existing?.length || 0) + 1;

      // 💾 insertion
      const { error: insertError } = await supabase
        .from("reservations")
        .insert([data]);

      if (insertError) {
        message.textContent = "❌ Erreur lors de la réservation";
        message.className = "error";
        return;
      }

      // 🎉 SUCCESS
      message.textContent = `🍽️ Réservation confirmée ! Numéro : ${data.number}`;
      message.className = "success";

      form.reset();

    } catch (err) {
      console.error(err);
      message.textContent = "❌ Erreur inattendue";
      message.className = "error";
    }
  });

});