// ======================================================
// 🔐 AUTH SYSTEM (SUPABASE CLEAN VERSION)
// ======================================================

// ⚠️ dépend de supabase.js
// supabaseClient doit être global

// ======================================================
// 🧾 SIGNUP
// ======================================================

const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const firstName = document.getElementById("signupFirstName").value;
    const lastName = document.getElementById("signupLastName").value;
    const phone = document.getElementById("signupPhone").value;

    // 1. CREATE AUTH USER
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const user = data.user ?? data.session?.user;

    if (!user) {
      alert("Erreur lors de la création du compte.");
      return;
    }

    // 2. CREATE PROFILE (table profiles liée à auth.uid)
    // Dans auth.js, remplace la partie insertion par :
    // Dans auth.js
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .insert([
        {
          user_id_temp: user.id,
          first_name: firstName, // Vérifie bien le nom des variables à droite !
          last_name: lastName,
          phone: phone
        }
      ]);

    if (profileError) {
      console.error(profileError);
      alert("Compte créé mais erreur profil.");
      return;
    }

    alert("Compte créé avec succès !");
    window.location.href = "login.html";
  });
}

// ======================================================
// 🔑 LOGIN
// ======================================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // On essaie de trouver l'élément de message (gère "msg" ou "message")
    const msgContainer = document.getElementById("msg") || document.getElementById("message");
    
    if (msgContainer) {
      msgContainer.textContent = "⏳ Connexion en cours...";
      msgContainer.style.color = "orange";
    }

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Erreur de connexion Supabase:", error.message);
        if (msgContainer) {
          msgContainer.textContent = "❌ Email ou mot de passe incorrect.";
          msgContainer.style.color = "red";
        }
        return;
      }

      // Si la connexion réussit
      if (data.user) {
        if (msgContainer) {
          msgContainer.textContent = "✅ Connexion réussie ! Redirection...";
          msgContainer.style.color = "green";
        }
        
        console.log("Utilisateur connecté avec succès :", data.user.email);
        
        // Redirection vers ton panneau admin personnalisé
        window.location.href = "admin.html";
      }

    } catch (err) {
      console.error("Erreur catch JavaScript:", err);
      if (msgContainer) {
        msgContainer.textContent = "❌ Une erreur inattendue est survenue.";
        msgContainer.style.color = "red";
      }
    }
  });
}