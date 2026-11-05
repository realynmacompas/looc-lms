(function () {
  const student = requireRole("student");
  if (!student) return;
  renderShell("settings");

  const alertBox = document.getElementById("alertBox");
  const successBox = document.getElementById("successBox");
  const loadingRow = document.getElementById("loadingRow");
  const content = document.getElementById("settingsContent");

  let current = null; // freshest copy from the server (has isActive, etc.)

  load();

  async function load() {
    try {
      current = await Students.getById(student.userId);

      document.getElementById("studentId").value = current.studentId;
      document.getElementById("email").value = current.email;
      document.getElementById("firstName").value = current.firstName;
      document.getElementById("lastName").value = current.lastName;
      document.getElementById("course").value = current.course || "";
      document.getElementById("yearLevel").value = current.yearLevel || "";
      document.getElementById("section").value = current.section || "";

      loadingRow.classList.add("hidden");
      content.classList.remove("hidden");
    } catch (err) {
      loadingRow.classList.add("hidden");
      showAlert(alertBox, err.message);
    }
  }

  document.getElementById("profileForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(alertBox);
    hideAlert(successBox);

    const email = document.getElementById("email").value.trim();
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const course = document.getElementById("course").value.trim();
    const yearLevel = document.getElementById("yearLevel").value.trim();
    const section = document.getElementById("section").value.trim();

    if (!email || !firstName || !lastName) {
      showAlert(alertBox, "Email, first name, and last name are required.");
      return;
    }

    const saveBtn = document.getElementById("saveProfileBtn");
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
      // PUT /api/student/{id} is a full replace, so we send back the
      // fields we're not editing here (like isActive) exactly as the
      // server gave them, and an empty password so it's left untouched -
      // password changes go through the Change Password form below,
      // which actually verifies the current one first.
      await Students.update(student.userId, {
        studentId: current.studentId,
        email,
        firstName,
        lastName,
        course: course || null,
        yearLevel: yearLevel || null,
        section: section || null,
        isActive: current.isActive,
        passwordHash: "",
      });

      setCurrentUser({ ...student, email, firstName, lastName, course, yearLevel, section });
      current.email = email;

      showAlert(successBox, "Profile updated.", "success");
    } catch (err) {
      showAlert(alertBox, err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Changes";
    }
  });

  document.getElementById("passwordForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(alertBox);
    hideAlert(successBox);

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmNewPassword = document.getElementById("confirmNewPassword").value;

    if (newPassword.length < 8) {
      showAlert(alertBox, "New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showAlert(alertBox, "New password and confirmation do not match.");
      return;
    }

    const saveBtn = document.getElementById("savePasswordBtn");
    saveBtn.disabled = true;
    saveBtn.textContent = "Updating...";

    try {
      await Auth.changePassword({
        role: "student",
        userId: student.userId,
        currentPassword,
        newPassword,
      });

      document.getElementById("passwordForm").reset();
      showAlert(successBox, "Password updated.", "success");
    } catch (err) {
      showAlert(alertBox, err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Update Password";
    }
  });

  // Notification toggles are UI-only for now (see the note on the page) -
  // there's no backend field to persist them to yet, so this just flips
  // the switch's own visual state for this visit.
  document.querySelectorAll(".switch").forEach((btn) => {
    btn.addEventListener("click", () => {
      const isOn = btn.classList.toggle("on");
      btn.setAttribute("aria-pressed", String(isOn));
    });
  });
})();
