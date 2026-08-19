const API_URL = "https://chez-nany.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    const authForm = document.getElementById("clientAuthForm");
    const authMessage = document.getElementById("clientAuthMessage");
    const reservationsSection = document.getElementById("clientReservationsSection");
    const tableBody = document.getElementById("clientTableBody");

    let currentAuth = null;

    authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const email = document.getElementById("clientEmail").value.trim();
        const phone = document.getElementById("clientPhone").value.trim();

        authMessage.style.color = "#f39c12";
        authMessage.textContent = "⏳ Recherche en cours...";

        currentAuth = { client_email: email, client_phone: phone };

        try {
            const response = await fetch(`${API_URL}/api/client/reservations/search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(currentAuth)
            });

            if (!response.ok) throw new Error("Erreur serveur");

            const reservations = await response.json();

            if (reservations.length === 0) {
                authMessage.style.color = "#e74c3c";
                authMessage.textContent = "❌ Aucune réservation trouvée pour ces coordonnées.";
                reservationsSection.style.display = "none";
                return;
            }

            authMessage.textContent = "";
            reservationsSection.style.display = "block";
            renderTable(reservations);

        } catch (error) {
            authMessage.style.color = "#e74c3c";
            authMessage.textContent = "❌ Impossible de contacter le serveur.";
        }
    });

    function renderTable(reservations) {
        tableBody.innerHTML = reservations.map(res => {
            const isCancelled = res.status === 'cancelled';
            return `
                <tr style="${isCancelled ? 'opacity: 0.5; text-decoration: line-through;' : ''}">
                    <td>${res.reservation_date.split("-").reverse().join("/")}</td>
                    <td>${res.reservation_time.slice(0, 5).replace(":", "h")}</td>
                    <td>${res.people_count} pers. ${res.is_terrace ? '(Terrasse)' : ''}</td>
                    <td style="font-size: 13px;"><i>${res.notes || "-"}</i></td>
                    <td style="font-weight: bold; color: ${isCancelled ? '#e74c3c' : '#2ecc71'};">
                        ${isCancelled ? 'Annulée' : 'Confirmée'}
                    </td>
                    <td>
                        ${!isCancelled 
                            ? `<button class="btn-table-delete" onclick="cancelClientRes(${res.id})">❌ Annuler</button>`
                            : `-`
                        }
                    </td>
                </tr>
            `;
        }).join("");
    }

    window.cancelClientRes = async (id) => {
        if (!confirm("Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est définitive.")) return;

        try {
            const response = await fetch(`${API_URL}/api/client/reservations/${id}/cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(currentAuth)
            });

            const data = await response.json();

            if (response.ok) {
                alert("✅ " + data.message);
                authForm.dispatchEvent(new Event("submit"));
            } else {
                alert("❌ " + (data.detail || "Erreur lors de l'annulation."));
            }
        } catch (err) {
            alert("❌ Erreur de communication avec le serveur.");
        }
    };
});