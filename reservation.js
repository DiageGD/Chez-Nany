const SUPABASE_URL = "https://mcyadykysjwlwfnrplqs.supabase.co";
const SUPABASE_KEY = "sb_publishable_VMQE7cuXKGZ7A7mkyTAQ-A_QKtDg4Ae";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById("reservationForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  message.textContent = "Envoi en cours... ⏳";

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

    if (fetchError) throw fetchError;

    data.number = (existing?.length || 0) + 1;

    // 💾 insertion
    const { data: insertData, error: insertError } = await supabase
      .from("reservations")
      .insert([data])
      .select();

    if (insertError) throw insertError;

    // ✅ SUCCESS
    message.textContent = `🎉 Réservation confirmée ! Numéro : ${data.number}`;
    form.reset();

    console.log("INSERT SUCCESS:", insertData);

  } catch (err) {
    console.error("Reservation error:", err);
    message.textContent = "❌ Erreur lors de la réservation. Réessayez.";
  }
});
