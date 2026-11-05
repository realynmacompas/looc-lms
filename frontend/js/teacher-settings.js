(function () {
  const teacher = requireRole("teacher");
  if (!teacher) return;
  renderShell("settings");

  const alertBox = document.getElementById("alertBox");
  const successBox = document.getElementById("successBox");
  const loadingRow = document.getElementById("loadingRow");
  const content = document.getElementById("settingsContent");

  let current = null;

  load();

  async function load() {
    try {
      current = await Teachers.getById(teacher.userId);

      document.getElementById("teacherId").value = current.teacherId;
      document.getElementById("email").value = current.email;
      document.getElementById("firstName").value = current.firstName;
      document.getElementById("lastName").value = current.lastName;
      document.getElementById("department").value = current.department || "";

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
    const department = document.getElementById("department").value.trim();

    if (!email || !firstName || !lastName) {
      showAlert(alertBox, "Email, first name, and last name are required.");
      return;
    }

    const saveBtn = document.getElementById("saveProfileBtn");
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
      await Teachers.update(teacher.userId, {
        teacherId: current.teacherId,
        email,
        firstName,
        lastName,
        department: department || null,
        isActive: current.isActive,
      });

      setCurrentUser({ ...teacher, email, firstName, lastName, department });
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
        role: "teacher",
        userId: teacher.userId,
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

  document.querySelectorAll(".switch").forEach((btn) => {
    btn.addEventListener("click", () => {
      const isOn = btn.classList.toggle("on");
      btn.setAttribute("aria-pressed", String(isOn));
    });
  });
})();
