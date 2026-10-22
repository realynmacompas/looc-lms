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
})();
