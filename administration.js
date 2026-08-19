document.addEventListener("DOMContentLoaded", () => {
    let adminKey = localStorage.getItem("admin_key") || prompt("Mot de passe Admin :");
    if (adminKey) localStorage.setItem("admin_key", adminKey);

    const headers = { "X-Admin-Key": adminKey, "Content-Type": "application/json" };

    async function loadTables() {
        const res = await fetch("http://127.0.0.1:8000/api/tables"); // Pas besoin de clé ici si ton API le permet
        const tables = await res.json();
        const container = document.getElementById("tableList");
        container.innerHTML = tables.map(t => `
            <div style="background:#333; padding:10px; border-radius:5px; text-align:center;">
                <strong>${t.capacity} pers</strong><br>${t.is_terrace ? 'Terrasse' : 'Intérieur'}<br>
                <button onclick="deleteTable(${t.id})" style="background:#e74c3c; border:none; color:white; padding:5px; cursor:pointer;">Supprimer</button>
            </div>
        `).join("");
    }

    document.getElementById("tableForm").onsubmit = async (e) => {
        e.preventDefault();
        await fetch("http://127.0.0.1:8000/api/tables", {
            method: "POST", headers,
            body: JSON.stringify({
                capacity: parseInt(document.getElementById("tCapacite").value),
                is_terrace: document.getElementById("tTerrasse").checked,
                is_active: true
            })
        });
        loadTables();
    };

    window.deleteTable = async (id) => {
        if(!confirm("Supprimer cette table ?")) return;
        await fetch(`http://127.0.0.1:8000/api/tables/${id}`, { method: "DELETE", headers });
        loadTables();
    };

    async function loadReservations() {
        if (!adminKey) {
            adminTableBody.innerHTML = `<tr><td colspan="6" style="color:red;">Mot de passe requis. Veuillez rafraîchir la page.</td></tr>`;
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:8000/api/reservations", {
                headers: {
                    "X-Admin-Key": adminKey
                }
            });

            if (response.status === 401) {
                alert("Accès refusé : mot de passe incorrect.");
                localStorage.removeItem("admin_key");
                adminTableBody.innerHTML = `<tr><td colspan="6" style="color:red;">Accès refusé. Veuillez rafraîchir pour réessayer.</td></tr>`;
                return;
            }

            if (!response.ok) throw new Error("Erreur serveur");

            localStorage.setItem("admin_key", adminKey);
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

    window.deleteRes = async (id) => {
        if (!confirm("Voulez-vous vraiment annuler cette réservation ?")) return;

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/reservations/${id}`, {
                method: 'DELETE',
                headers: {
                    "X-Admin-Key": adminKey
                }
            });

            if (response.ok) {
                loadReservations(); // Recharge le tableau après annulation
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