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

      let slots = [
        "12:00", "12:15", "12:30", "12:45", "13:00", "13:15", "13:30",
        "19:00", "19:15", "19:30", "19:45", "20:00", "20:15", "20:30", "20:45", "21:00", "21:15", "21:30"
      ];
      
      // Rallonges du week-end (Vendredi et Samedi)
      if (dayOfWeek === 5 || dayOfWeek === 6) {
        slots.push("21:45", "22:00");
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
      const defaultCapacity = 46; // Aligné sur la capacité totale des tables (10*4 + 3*2)
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

  // 5. TRAITEMENT ET VALIDATION DU FORMULAIRE DE RÉSERVATION
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMessage("⏳ Analyse de la configuration des tables...", "");

    const selectedDate = dateInput.value;
    const nouvellesPlaces = Number(document.getElementById("people").value);
    const selectedTime = timeSelect.value;

    const tempsCibleDebut = toMinutes(selectedTime);
    const tempsCibleFin = tempsCibleDebut + 90; // 1h30 de présence

    try {
      // 1. Récupération de toutes les réservations qui se chevauchent
      const { data: allReservations } = await supabase
        .from("reservations")
        .select("time, people")
        .eq("date", selectedDate);

      // Liste des groupes déjà présents au même moment
      let groupesPresents = [];

      if (allReservations) {
        allReservations.forEach(res => {
          const cleanTime = res.time.substring(0, 5); 
          const resDebut = toMinutes(cleanTime);
          const resFin = resDebut + 90;

          // Si la réservation chevauche le créneau demandé
          if (resDebut < tempsCibleFin && resFin > tempsCibleDebut) {
            groupesPresents.push(Number(res.people));
          }
        });
      }

      // 2. On ajoute virtuellement le nouveau client à la liste pour tester si ça passe
      groupesPresents.push(nouvellesPlaces);

      // On trie les groupes du plus grand au plus petit (indispensable pour bien remplir le resto)
      groupesPresents.sort((a, b) => b - a);

      // 3. SIMULATION DU PLACEMENT DES TABLES
      // On réinitialise notre restaurant virtuel pour ce créneau
      let tablesDe4Dispos = 10;
      let tablesDe2Dispos = 3;
      let reservationPossible = true;

      // 🔥 CORRECTION ICI : Changement de "du" par "of" et mise au singulier pour correspondre au bloc
      for (let personnes of groupesPresents) {
        let placesAFormes = personnes;

        // On essaie d'abord de placer le maximum de personnes sur des tables de 4
        while (placesAFormes > 0 && tablesDe4Dispos > 0) {
          if (placesAFormes >= 3 || (placesAFormes === 2 && tablesDe2Dispos === 0)) {
            // On consomme une table de 4
            tablesDe4Dispos--;
            placesAFormes -= 4; // Une table de 4 encaisse jusqu'à 4 personnes
          } else {
            break; // On verra si les tables de 2 peuvent prendre le reste
          }
        }

        // S'il reste des personnes à caser, on utilise les tables de 2
        while (placesAFormes > 0 && tablesDe2Dispos > 0) {
          tablesDe2Dispos--;
          placesAFormes -= 2; // Une table de 2 encaisse jusqu'à 2 personnes
        }

        // Si après avoir utilisé toutes les tables de 2, il reste encore des gens d'un groupe (ex: de 6)
        // mais qu'il reste de la place sur des tables de 4 vides, on les met dessus
        while (placesAFormes > 0 && tablesDe4Dispos > 0) {
          tablesDe4Dispos--;
          placesAFormes -= 4;
        }

        // Si après tout ça, placesAFormes est toujours > 0, c'est que le groupe ne rentre pas !
        if (placesAFormes > 0) {
          reservationPossible = false;
          break; // Pas la peine de tester le reste, le resto est bloqué
        }
      }

      // 4. VERDICT
      if (!reservationPossible) {
        return setMessage(`❌ Désolé, la configuration de nos tables (10 tables de 4 et 3 tables de 2) ne permet pas d'accueillir ${nouvellesPlaces} personne(s) de plus à cet horaire.`, "error");
      }

      // Tout est OK, le Tetris des tables est validé ! On insère en BDD
      const { error: insertError } = await supabase.from("reservations").insert([{
        date: selectedDate, 
        time: `${selectedTime}:00`, 
        people: nouvellesPlaces,
        user_id_temp: user.id,
        notes: nomCompletClient
      }]);

      if (insertError) throw insertError;

      setMessage("🍽️ Réservation confirmée ! Vos tables sont réservées.", "success");
      form.reset();
      timeSelect.innerHTML = '<option value="">Sélectionnez d\'abord une date...</option>';

    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de l'enregistrement de votre réservation.", "error");
    }
  });
});
