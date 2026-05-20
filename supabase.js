// ======================================================
// 🧠 SUPABASE CLIENT INITIALISATION
// ======================================================

// ⚠️ Remplace ces valeurs par les tiennes si besoin
const SUPABASE_URL = "https://mcyadykysjwlwfnrplqs.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeWFkeWt5c2p3bHdmbnJwbHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NjIzOTIsImV4cCI6MjA5MTQzODM5Mn0.d5o2RIoK-vDL37XKV5RTNKNkIey2AqGU-MpzDHxqw4M";

// ======================================================
// 🌐 CREATE SUPABASE CLIENT
// ======================================================

window.supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ======================================================
// 🔐 HELPERS AUTH (réutilisables partout)
// ======================================================

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();

  if (error) {
    console.error("Supabase getUser error:", error.message);
    return null;
  }

  return user;
}

async function isLoggedIn() {
  const user = await getCurrentUser();
  return !!user;
}

async function logout() {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.error("Logout error:", error.message);
    return;
  }

  window.location.href = "index.html";
}