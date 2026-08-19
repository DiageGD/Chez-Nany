document.addEventListener("DOMContentLoaded", () => {
    const reservationForm = document.getElementById("reservationForm");
    const statusMessage = document.getElementById("message");
    const dateInput = document.getElementById("date");
    const timeSelect = document.getElementById("time");

    dateInput.addEventListener("change", () => {
        const dateSelected = new Date(dateInput.value);
        const dayOfWeek = dateSelected.getDay();
        timeSelect.innerHTML = "";

        if (dayOfWeek === 0 || dayOfWeek === 3) { // 0 = Dimanche, 3 = Mercredi
            statusMessage.style.color = "red";
            statusMessage.textContent = "❌ Le restaurant est fermé le mercredi et le dimanche.";
            dateInput.value = "";
            timeSelect.innerHTML = '<option value="" disabled selected>Restaurant fermé</option>';
            return;
        }
        statusMessage.textContent = "";

        let slots = [
            "12:00", "12:15", "12:30", "12:45", "13:00", "13:15", "13:30",
            "19:00", "19:15", "19:30", "19:45", "20:00", "20:15", "20:30", "20:45", "21:00", "21:15", "21:30"
        ];
        // Le vendredi (5) et samedi (6), on ferme plus tard
        if (dayOfWeek === 5 || dayOfWeek === 6) slots.push("21:45", "22:00");

        timeSelect.innerHTML = slots.map(slot => `<option value="${slot}:00">${slot.replace(":", "h")}</option>`).join("");
    });

    if (!reservationForm) return;

    reservationForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = {
            client_firstname: document.getElementById("firstname").value.trim(),
            client_lastname: document.getElementById("lastname").value.trim(),
            client_email: document.getElementById("email").value.trim(),
            client_phone: document.getElementById("phone").value.trim(),
            reservation_date: dateInput.value,
            reservation_time: timeSelect.value, // ex: "19:30:00"
            people_count: parseInt(document.getElementById("people").value, 10),
            is_terrace: document.getElementById("terrace").checked,
            notes: document.getElementById("notes").value.trim() || null
        };

        statusMessage.style.color = "#f39c12"; // Orange d'attente
        statusMessage.textContent = "⏳ Traitement de votre réservation en cours...";

        try {
            const response = await fetch("http://127.0.0.1:8000/api/reservations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                statusMessage.style.color = "#2ecc71"; // Vert succès
                statusMessage.textContent = "🎉 " + data.message;
                reservationForm.reset();
                timeSelect.innerHTML = '<option value="" disabled selected>Choisissez d\'abord une date</option>';
            } else {
                // Gestion des erreurs renvoyées par Python
                let errorMsg = data.detail || "Une erreur est survenue.";
                if (Array.isArray(data.detail)) errorMsg = data.detail[0].msg; // Erreurs Pydantic
                statusMessage.style.color = "#e74c3c"; // Rouge erreur
                statusMessage.textContent = "❌ " + errorMsg;
            }
        } catch (error) {
            statusMessage.style.color = "#e74c3c";
            statusMessage.textContent = "❌ Serveur injoignable. Veuillez réessayer plus tard.";
        }
    });
});