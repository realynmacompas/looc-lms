(function () {
  const existing = getCurrentUser();
  if (existing) {
    window.location.href = homePageFor(existing.role);
    return;
  }

  const form = document.getElementById("registerForm");
  const alertBox = document.getElementById("alertBox");
  const registerBtn = document.getElementById("registerBtn");

  const roleStudent = document.getElementById("roleStudent");
  const roleTeacher = document.getElementById("roleTeacher");
  const studentFields = document.getElementById("studentFields");
  const teacherFields = document.getElementById("teacherFields");
  const userIdLabel = document.getElementById("userIdLabel");

  function syncRoleFields() {
    const isTeacher = roleTeacher.checked;
    studentFields.classList.toggle("hidden", isTeacher);
    teacherFields.classList.toggle("hidden", !isTeacher);
    userIdLabel.textContent = isTeacher ? "Teacher ID" : "Student ID";
  }
  roleStudent.addEventListener("change", syncRoleFields);
  roleTeacher.addEventListener("change", syncRoleFields);
  syncRoleFields();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(alertBox);

    const role = roleTeacher.checked ? "teacher" : "student";
    const userId = document.getElementById("userId").value.trim();
    const email = document.getElementById("email").value.trim();
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!userId || !email || !firstName || !lastName || !password) {
      showAlert(alertBox, "Please fill in all required fields.");
      return;
    }
    if (password.length < 6) {
      showAlert(alertBox, "Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      showAlert(alertBox, "Passwords do not match.");
      return;
    }

    const payload = {
      userId,
      email,
      password,
      firstName,
      lastName,
      role,
    };

    if (role === "student") {
      payload.course = document.getElementById("course").value.trim() || null;
      payload.yearLevel = document.getElementById("yearLevel").value.trim() || null;
      payload.section = document.getElementById("section").value.trim() || null;
    } else {
      payload.department = document.getElementById("department").value.trim() || null;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = "Creating account...";

    try {
      const profile = await Auth.register(payload);
      setCurrentUser(profile);
      window.location.href = homePageFor(profile.role);
    } catch (err) {
      showAlert(alertBox, err.message);
    } finally {
      registerBtn.disabled = false;
      registerBtn.textContent = "Create Account";
    }
  });
})();
