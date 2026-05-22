document.addEventListener("DOMContentLoaded", async () => {
    const supabase = window.supabaseClient || window.supabase || supabaseClient;
    if (!supabase) return;

    // ==========================================
    // 🔐 1. CONTROLE D'ACCÈS
    // ==========================================
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        window.location.href = "login.html";
        return;
    }
    const user = session.user;

    const profileMessage = document.getElementById("profileMessage");
    const clientReservationsList = document.getElementById("clientReservationsList");

    // ==========================================
    // 👤 2. SYNCHRONISATION DU PROFIL
    // ==========================================
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id_temp", user.id)
        .single();

    if (profileError || !profile) {
        alert("Impossible de charger votre profil.");
        return;
    }

    document.getElementById("userFirstName").value = profile.first_name || "";
    document.getElementById("userLastName").value = profile.last_name || "";
    document.getElementById("userPhone").value = profile.phone || "";

    // Sauvegarde des modifications du compte
    document.getElementById("profileUpdateForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        profileMessage.textContent = "⏳ Enregistrement des modifications...";
        profileMessage.className = "";

        const { error } = await supabase
            .from("profiles")
            .update({
                first_name: document.getElementById("userFirstName").value,
                last_name: document.getElementById("userLastName").value,
                phone: document.getElementById("userPhone").value
            })
            .eq("user_id_temp", user.id);

        if (error) {
            profileMessage.textContent = "❌ Une erreur est survenue lors de la sauvegarde.";
            profileMessage.className = "error";
        } else {
            profileMessage.textContent = "✅ Profil mis à jour avec succès !";
            profileMessage.className = "success";
        }
    });

    // Sauvegarde changement de MDP
    document.getElementById("passwordUpdateForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        profileMessage.textContent = "⏳ Modification du mot de passe...";
        
        const newPass = document.getElementById("newPassword").value;
        const { error } = await supabase.auth.updateUser({ password: newPass });

        if (error) {
            profileMessage.textContent = `❌ Erreur : ${error.message}`;
            profileMessage.className = "error";
        } else {
            profileMessage.textContent = "✅ Votre mot de passe a bien été modifié !";
            profileMessage.className = "success";
            document.getElementById("newPassword").value = "";
        }
    });

    // ==========================================
    // 🗑️ DISPOSITIF DE SUPPRESSION / ANNULATION
    // ==========================================
    window.deleteReservation = async (id) => {
        if (!confirm("Voulez-vous vraiment annuler cette réservation ?")) return;

        const { error } = await supabase
            .from("reservations")
            .delete()
            .eq("id", id);

        if (error) {
            alert("Erreur lors de l'annulation.");
        } else {
            alert("Réservation annulée avec succès.");
            await loadClientReservations();
            if (profile.is_admin && typeof loadAllReservations === "function") {
                await loadAllReservations();
            }
        }
    };

    // ==========================================
    // 🍽️ 3. RÉSERVATIONS PERSONNELLES DU CLIENT
    // ==========================================
    async function loadClientReservations() {
        if (!clientReservationsList) return;

        const { data: myRes } = await supabase
            .from("reservations")
            .select("*")
            .eq("user_id_temp", user.id)
            .order("date", { ascending: true });

        if (!myRes || myRes.length === 0) {
            clientReservationsList.innerHTML = `<li>Vous n'avez pas de réservation active.</li>`;
            return;
        }

        clientReservationsList.innerHTML = myRes.map(res => `
            <li>
                <span>🗓️ Le <strong>${res.date}</strong> à <strong>${res.time.slice(0, 5).replace(":", "h")}</strong> (${res.people} pers)</span>
                <button class="btn-inline-delete" onclick="deleteReservation(${res.id})">🗑️ Annuler</button>
            </li>
        `).join("");
    }
    await loadClientReservations();

    // ==========================================
    // 👑 4. INTERFACE RESTAURATEUR (ADMIN)
    // ==========================================
    const adminSection = document.getElementById("adminSection");
    
    if (profile.is_admin && adminSection) {
        adminSection.style.display = "block"; 

        const adminTableBody = document.getElementById("adminTableBody");
        const adminResForm = document.getElementById("adminInsertReservationForm");
        const adminResMessage = document.getElementById("adminResMessage");
        const adminDateInput = document.getElementById("adminResDate");
        const adminTimeSelect = document.getElementById("adminResTime");

        // Filtrage heures admin
        adminDateInput.addEventListener("change", () => {
            const dateSelected = new Date(adminDateInput.value);
            const dayOfWeek = dateSelected.getDay();
            adminTimeSelect.innerHTML = "";

            if (dayOfWeek === 0 || dayOfWeek === 3) {
                adminResMessage.textContent = "❌ Fermé le mercredi et le dimanche.";
                adminResMessage.className = "error";
                adminDateInput.value = "";
                return;
            }
            adminResMessage.textContent = "";

            let slots = ["12:00", "12:30", "19:00", "19:30", "20:00", "20:30"];
            if (dayOfWeek === 5 || dayOfWeek === 6) slots.push("21:00", "21:30");

            adminTimeSelect.innerHTML = slots.map(slot => `<option value="${slot}">${slot.replace(":", "h")}</option>`).join("");
        });

        // Fonction utilitaire pour convertir "HH:MM" en minutes depuis minuit
        const toMinutes = (timeStr) => {
            const [h, m] = timeStr.split(":").map(Number);
            return h * 60 + m;
        };

        // Tableau général de suivi du restaurant
        async function loadAllReservations() {
            if (!adminTableBody) return;

            const { data: allRes, error } = await supabase
                .from("reservations")
                .select("*")
                .order("date", { ascending: true });

            if (error || !allRes || allRes.length === 0) {
                adminTableBody.innerHTML = `<tr><td colspan="5">Aucune réservation globale enregistrée.</td></tr>`;
                return;
            }

            adminTableBody.innerHTML = allRes.map(res => {
                const clientAffichage = (res.notes && res.notes !== "EMPTY") ? res.notes : "Client Web Extérieur";

                return `
                    <tr>
                        <td>${res.date}</td>
                        <td>${res.time.slice(0, 5).replace(":", "h")}</td>
                        <td><strong>${res.people}</strong></td>
                        <td style="font-size: 13px; font-weight: 500;">${clientAffichage}</td>
                        <td>
                            <button class="btn-table-delete" onclick="deleteReservation(${res.id})">🗑️ Supprimer</button>
                        </td>
                    </tr>
                `;
            }).join("");
        }

        window.loadAllReservations = loadAllReservations;

        // Prise de réservation téléphonique (Avec algorithme Tetris 10x4 & 3x2)
        if (adminResForm) {
            adminResForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                adminResMessage.textContent = "⏳ Analyse de la configuration des tables...";
                adminResMessage.className = "";

                const selectedDate = adminDateInput.value;
                const selectedTime = adminTimeSelect.value;
                const nouvellesPlaces = Number(document.getElementById("adminResPeople").value);
                const noteClient = document.getElementById("adminResNote").value;

                const tempsCibleDebut = toMinutes(selectedTime);
                const tempsCibleFin = tempsCibleDebut + 90; // 1h30 de présence

                try {
                    // 1. Récupération de toutes les réservations du jour ciblé
                    const { data: allReservations } = await supabase
                        .from("reservations")
                        .select("time, people")
                        .eq("date", selectedDate);

                    // Liste des groupes présents au même moment
                    let groupesPresents = [];

                    if (allReservations) {
                        allReservations.forEach(res => {
                            const cleanTime = res.time.substring(0, 5); 
                            const resDebut = toMinutes(cleanTime);
                            const resFin = resDebut + 90;

                            // Vérification du chevauchement horaire (1h30)
                            if (resDebut < tempsCibleFin && resFin > tempsCibleDebut) {
                                groupesPresents.push(Number(res.people));
                            }
                        });
                    }

                    // 2. Ajout virtuel de la nouvelle réservation téléphonique dans le plan de salle
                    groupesPresents.push(nouvellesPlaces);
                    groupesPresents.sort((a, b) => b - a); // Tri décroissant indispensable

                    // 3. Simulation algorithmique du plan de table
                    let tablesDe4Dispos = 10;
                    let tablesDe2Dispos = 3;
                    let reservationPossible = true;

                    for (let personnes of groupesPresents) {
                        let placesAFormes = personnes;

                        // Remplissage prioritaire sur les tables de 4
                        while (placesAFormes > 0 && tablesDe4Dispos > 0) {
                            if (placesAFormes >= 3 || (placesAFormes === 2 && tablesDe2Dispos === 0)) {
                                tablesDe4Dispos--;
                                placesAFormes -= 4;
                            } else {
                                break;
                            }
                        }

                        // Remplissage sur les tables de 2
                        while (placesAFormes > 0 && tablesDe2Dispos > 0) {
                            tablesDe2Dispos--;
                            placesAFormes -= 2;
                        }

                        // Utilisation des reliquats de tables de 4 s'il n'y a plus de tables de 2
                        while (placesAFormes > 0 && tablesDe4Dispos > 0) {
                            tablesDe4Dispos--;
                            placesAFormes -= 4;
                        }

                        // Si le groupe n'a pas pu être totalement installé
                        if (placesAFormes > 0) {
                            reservationPossible = false;
                            break;
                        }
                    }

                    // 4. Verdict de la simulation
                    if (!reservationPossible) {
                        adminResMessage.textContent = `❌ Configuration insuffisante (10x4 & 3x2) pour ${nouvellesPlaces} personnes à cet horaire.`;
                        adminResMessage.className = "error";
                        return;
                    }

                    // 5. Validation : Insertion de la réservation téléphonique
                    const { error: insertError } = await supabase.from("reservations").insert([{
                        date: selectedDate,
                        time: `${selectedTime}:00`,
                        people: nouvellesPlaces,
                        user_id_temp: user.id, // ID de l'admin qui saisit la demande
                        notes: `📞 ${noteClient}`
                    }]);

                    if (insertError) throw insertError;

                    adminResMessage.textContent = "✅ Réservation enregistrée avec succès !";
                    adminResMessage.className = "success";
                    adminResForm.reset();
                    adminTimeSelect.innerHTML = '<option value="">Sélectionnez une date...</option>';
                    await loadAllReservations(); 

                } catch (err) {
                    console.error(err);
                    adminResMessage.textContent = "❌ Erreur technique lors de l'insertion.";
                    adminResMessage.className = "error";
                }
            });
        }

        await loadAllReservations();
    }

    // ==========================================
    // 🚪 LOGOUT BUTTON
    // ==========================================
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await supabase.auth.signOut();
            window.location.href = "login.html";
        });
    }
});