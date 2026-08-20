const API_URL = "https://chez-nany.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    let adminKey = localStorage.getItem("admin_key") || prompt("Mot de passe Admin :");
    if (adminKey) localStorage.setItem("admin_key", adminKey);

    const getHeaders = () => ({
        "X-Admin-Key": localStorage.getItem("admin_key") || adminKey,
        "Content-Type": "application/json"
    });

    const adminTableBody = document.getElementById("adminTableBody");

    // 1. Charger les tables
    async function loadTables() {
        try {
            const res = await fetch(`${API_URL}/api/tables`);
            const tables = await res.json();
            const container = document.getElementById("tableList");
            if (!container) return;

            container.innerHTML = tables.map(t => `
                <div style="background:#333; padding:10px; border-radius:5px; text-align:center;">
                    <strong>${t.capacity} pers</strong><br>${t.is_terrace ? 'Terrasse' : 'Intérieur'}<br>
                    <button onclick="deleteTable(${t.id})" style="background:#e74c3c; border:none; color:white; padding:5px; margin-top:5px; cursor:pointer; border-radius:3px;">Supprimer</button>
                </div>
            `).join("");
        } catch (err) {
            console.error("Erreur de chargement des tables :", err);
        }
    }

    // 2. Ajouter une table
    const tableForm = document.getElementById("tableForm");
    if (tableForm) {
        tableForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const capacity = parseInt(document.getElementById("tCapacite").value, 10);
            const is_terrace = document.getElementById("tTerrasse").checked;

            try {
                const response = await fetch(`${API_URL}/api/tables`, {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({
                        capacity: capacity,
                        is_terrace: is_terrace,
                        is_active: true
                    })
                });

                if (response.ok) {
                    tableForm.reset();
                    loadTables();
                } else {
                    const err = await response.json();
                    alert("❌ Erreur : " + (err.detail || "Impossible d'ajouter la table."));
                }
            } catch (err) {
                alert("❌ Erreur de connexion avec le serveur.");
            }
        });
    }

    // 3. Supprimer une table
    window.deleteTable = async (id) => {
        if (!confirm("Supprimer cette table ?")) return;
        try {
            const response = await fetch(`${API_URL}/api/tables/${id}`, {
                method: "DELETE",
                headers: getHeaders()
            });

            if (response.ok) {
                loadTables();
            } else {
                alert("Impossible de supprimer la table.");
            }
        } catch (err) {
            alert("Erreur serveur.");
        }
    };

    // 4. Charger les réservations
    async function loadReservations() {
        if (!adminTableBody) return;
        if (!adminKey) {
            adminTableBody.innerHTML = `<tr><td colspan="6" style="color:red;">Mot de passe requis. Veuillez rafraîchir la page.</td></tr>`;
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/reservations`, {
                headers: getHeaders()
            });

            if (response.status === 401) {
                alert("Accès refusé : mot de passe incorrect.");
                localStorage.removeItem("admin_key");
                adminTableBody.innerHTML = `<tr><td colspan="6" style="color:red;">Accès refusé. Veuillez rafraîchir pour réessayer.</td></tr>`;
                return;
            }

            if (!response.ok) throw new Error("Erreur serveur");

            const reservations = await response.json();

            if (reservations.length === 0) {
                adminTableBody.innerHTML = `<tr><td colspan="6">Aucune réservation pour le moment.</td></tr>`;
                return;
            }

            adminTableBody.innerHTML = reservations.map(res => `
                <tr style="${res.status === 'cancelled' ? 'opacity: 0.5; text-decoration: line-through;' : ''}">
                    <td>${res.reservation_date.split("-").reverse().join("/")}</td>
                    <td>${res.reservation_time.slice(0, 5).replace(":", "h")}</td>
                    <td><strong>${res.client_lastname} ${res.client_firstname}</strong></td>
                    <td>${res.people_count}</td>
                    <td style="font-size: 13px;">${res.client_phone} <br> <i>${res.notes || ""}</i></td>
                    <td>
                        ${res.status !== 'cancelled' 
                            ? `<button class="btn-table-delete" onclick="deleteRes(${res.id})">❌ Annuler</button>`
                            : `<span style="color: gray;">Annulée</span>`
                        }
                    </td>
                </tr>
            `).join("");
        } catch (error) {
            adminTableBody.innerHTML = `<tr><td colspan="6" style="color:red;">Erreur de chargement des données.</td></tr>`;
        }
    }

    // 5. Annuler une réservation
    window.deleteRes = async (id) => {
        if (!confirm("Voulez-vous vraiment annuler cette réservation ?")) return;

        try {
            const response = await fetch(`${API_URL}/api/reservations/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });

            if (response.ok) {
                loadReservations();
            } else {
                alert("Impossible d'annuler la réservation.");
            }
        } catch (err) {
            alert("Erreur lors de la communication avec le serveur.");
        }
    };

    loadTables();
    loadReservations();
});
