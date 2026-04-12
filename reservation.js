alert("JS FILE LOADED");
const SUPABASE_URL = "https://mcyadykysjwlwfnrplqs.supabase.co";
const SUPABASE_KEY = "sb_publishable_VMQE7cuXKGZ7A7mkyTAQ-A_QKtDg4Ae";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

if (!window.supabase) {
  alert("❌ Supabase non chargé");
}
window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("reservationForm");
  const message = document.getElementById("message");

  if (!form) {
    alert("❌ Formulaire introuvable");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // 🔥 empêche reload

    alert("🚀 Submit détecté");

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
      // 🔢 compter les réservations du jour
      const { data: existing, error: fetchError } = await supabase
        .from("reservations")
        .select("id")
        .eq("date", data.date);

      if (fetchError) {
        alert("❌ FETCH ERROR: " + fetchError.message);
        return;
      }

      data.number = (existing?.length || 0) + 1;

      // 💾 insertion
      const { error: insertError } = await supabase
        .from("reservations")
        .insert([data]);

      if (insertError) {
        alert("❌ INSERT ERROR: " + insertError.message);
        return;
      }

      alert("🎉 RÉSERVATION OK ! Numéro : " + data.number);

      if (message) {
        message.textContent = `Réservation confirmée 🎉 Numéro : ${data.number}`;
      }

      form.reset();

    } catch (err) {
      alert("💥 ERROR JS: " + err.message);
      console.error(err);
    }
  });
});
