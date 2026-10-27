(function () {
  // Already logged in? skip straight to the right dashboard.
  const existing = getCurrentUser();
  if (existing) {
    window.location.href = homePageFor(existing.role);
    return;
  }

  const form = document.getElementById("loginForm");
  const alertBox = document.getElementById("alertBox");
  const loginBtn = document.getElementById("loginBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(alertBox);

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      showAlert(alertBox, "Please enter your email and password.");
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Signing in...";

    try {
      const profile = await Auth.login(email, password);
      setCurrentUser(profile);
      window.location.href = homePageFor(profile.role);
    } catch (err) {
      showAlert(alertBox, err.message);
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Sign In";
    }
  });

    // ---------- Google Sign-In ----------
  const GOOGLE_CLIENT_ID = "829306334462-a554k2iv7nlofeu1e7h4fclo3im4i29d.apps.googleusercontent.com";

  async function handleGoogleCredential(response) {
    hideAlert(alertBox);
    try {
      const profile = await Auth.googleLogin(response.credential);
      setCurrentUser(profile);
      window.location.href = homePageFor(profile.role);
    } catch (err) {
      if (err.status === 404 && err.data && err.data.email) {
        // Verified by Google, but no account yet - send them to Register with the email pre-filled.
        window.location.href = `register.html?email=${encodeURIComponent(err.data.email)}`;
        return;
      }
      showAlert(alertBox, err.message || "Google sign-in failed.");
    }
  }

  if (window.google && window.google.accounts && window.google.accounts.id) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });
    google.accounts.id.renderButton(document.getElementById("googleSignInDiv"), {
      theme: "outline",
      size: "large",
      width: 300,
    });
  }
  
})();
