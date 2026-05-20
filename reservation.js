document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.supabaseClient || window.supabase || supabaseClient;
  if (!supabase) return;

  // 1. Récupération de tous les éléments du DOM
  const form = document.getElementById("reservationForm");
  const message = document.getElementById("message");
  const dateInput = document.getElementById("date");
  const timeSelect = document.getElementById("time");
  const navLogoLink = document.getElementById("navLogoLink");

  const setMessage = (text, type = "") => {
    if (message) {
      message.textContent = text;
      message.className = type;
    }
  };

  // 2. LOGIQUE DES CRÉNEAUX HORAIRES (S'exécute toujours pour que l'interface réponde)
  if (dateInput && timeSelect) {
    dateInput.addEventListener("change", () => {
      const dateSelected = new Date(dateInput.value);
      const dayOfWeek = dateSelected.getDay(); // 0 = Dimanche, 3 = Mercredi

      timeSelect.innerHTML = "";

      if (dayOfWeek === 0 || dayOfWeek === 3) {
        setMessage("❌ Le restaurant est fermé le mercredi et le dimanche.", "error");
        dateInput.value = "";
        timeSelect.innerHTML = '<option value="">Sélectionnez d\'abord une date...</option>';
        return;
      }
      setMessage("", "");

      let slots = ["12:00", "12:30", "19:00", "19:30", "20:00", "20:30"];
      
      // Rallonges du week-end (Vendredi et Samedi)
      if (dayOfWeek === 5 || dayOfWeek === 6) {
        slots.push("21:00", "21:30");
      }

      timeSelect.innerHTML = slots.map(slot => `<option value="${slot}">${slot.replace(":", "h")}</option>`).join("");
    });
  }

  // 3. VÉRIFICATION DE LA SESSION SUPABASE
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (navLogoLink) {
    navLogoLink.href = session ? "admin.html" : "login.html";
  }

  // Si l'utilisateur n'est pas connecté, on bloque le submit mais on garde l'interface interactive
  if (sessionError || !session) {
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        setMessage("⚠️ Vous devez être connecté pour pouvoir réserver une table.", "error");
      });
    }
    return;
  }

  // 4. CLIENT CONNECTÉ : Récupération de l'identité
  const user = session.user;

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("user_id_temp", user.id)
    .single();

  const nomCompletClient = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "Client Web";

  if (!form) return;

  // Gestion dynamique de la capacité maximale globale de la journée
  async function checkAndGetCapacityForDate(selectedDate) {
    let { data: config } = await supabase.from("restaurant_config").select("max_capacity").eq("date", selectedDate).maybeSingle();
    if (!config) {
      const defaultCapacity = 30;
      await supabase.from("restaurant_config").insert([{ date: selectedDate, max_capacity: defaultCapacity }]);
      return defaultCapacity;
    }
    return config.max_capacity;
  }

  // Fonction utilitaire pour convertir "HH:MM" en minutes depuis minuit
  const toMinutes = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  // 5. TRITEMENT ET VALIDATION DU FORMULAIRE DE RÉSERVATION
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMessage("⏳ Vérification des disponibilités en temps réel...", "");

    const selectedDate = dateInput.value;
    const nouvellesPlaces = Number(document.getElementById("people").value);
    const selectedTime = timeSelect.value; // Exemple: "19:30"

    const tempsCibleDebut = toMinutes(selectedTime);
    const tempsCibleFin = tempsCibleDebut + 90; // Durée fixe de 1h30 (90 minutes)

    try {
      const capaciteMaximale = await checkAndGetCapacityForDate(selectedDate);

      // Récupération de toutes les réservations de la journée choisie
      const { data: allReservations } = await supabase
        .from("reservations")
        .select("time, people")
        .eq("date", selectedDate);

      let placesOccupeesAuMemeMoment = 0;

      if (allReservations) {
        allReservations.forEach(res => {
          // Extraction propre de l'heure (pour gérer "19:00:00" renvoyé par Postgres)
          const cleanTime = res.time.substring(0, 5); 
          const resDebut = toMinutes(cleanTime);
          const resFin = resDebut + 90; // Durée de présence des clients déjà installés

          // Algorithme mathématique de chevauchement d'intervalles
          if (resDebut < tempsCibleFin && resFin > tempsCibleDebut) {
            placesOccupeesAuMemeMoment += Number(res.people);
          }
        });
      }

      // Vérification si la capacité maximale sature sur ce créneau horaire précis
      if (placesOccupeesAuMemeMoment + nouvellesPlaces > capaciteMaximale) {
        const placesRestantes = Math.max(0, capaciteMaximale - placesOccupeesAuMemeMoment);
        return setMessage(`❌ Pas assez de places à cet horaire. (Places dispos à ${selectedTime.replace(":", "h")} : ${placesRestantes})`, "error");
      }

      // Tout est au vert, on procède à l'insertion
      const { error: insertError } = await supabase.from("reservations").insert([{
        date: selectedDate, 
        time: `${selectedTime}:00`, 
        people: nouvellesPlaces,
        user_id_temp: user.id,
        notes: nomCompletClient
      }]);

      if (insertError) throw insertError;

      setMessage("🍽️ Réservation confirmée ! On vous attend avec impatience.", "success");
      form.reset();
      timeSelect.innerHTML = '<option value="">Sélectionnez d\'abord une date...</option>';

    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de l'enregistrement de votre réservation.", "error");
    }
  });
});