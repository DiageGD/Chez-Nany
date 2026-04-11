const SUPABASE_URL = "https://mcyadykysjwlwfnrplqs.supabase.co";
const SUPABASE_KEY = "sb_publishable_2ZvOjfwMvQ61KDbkrJfuOw_AxY5Qbns";

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
      .select("*")
      .eq("date", data.date);

    if (fetchError) throw fetchError;

    data.number = (existing?.length || 0) + 1;

    // 💾 insertion
    const { error } = await supabase
      .from("reservations")
      .insert([data]);

    if (error) throw error;

    message.textContent = `Réservation confirmée 🎉 Numéro : ${data.number}`;
    form.reset();

  } catch (err) {
    console.error(err);
    message.textContent = "Erreur lors de la réservation ❌";
  }
});