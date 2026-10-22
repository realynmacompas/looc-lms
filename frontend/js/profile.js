(function () {
  const student = requireRole("student");
  if (!student) return;
  renderShell("profile");

  const alertBox = document.getElementById("alertBox");
  const successBox = document.getElementById("successBox");
  const loadingRow = document.getElementById("loadingRow");
  const content = document.getElementById("profileContent");

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
    const newPassword = document.getElementById("newPassword").value;
    const confirmNewPassword = document.getElementById("confirmNewPassword").value;

    if (!email || !firstName || !lastName) {
      showAlert(alertBox, "Email, first name, and last name are required.");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      showAlert(alertBox, "New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showAlert(alertBox, "New password and confirmation do not match.");
      return;
    }

    const saveBtn = document.getElementById("saveBtn");
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
      // The API does a full replace of the student record, so we send back
      // the fields we're not editing (like isActive) exactly as they came
      // from the server, to avoid accidentally overwriting them.
      await Students.update(student.userId, {
        studentId: current.studentId,
        email,
        firstName,
        lastName,
        course: course || null,
        yearLevel: yearLevel || null,
        section: section || null,
        isActive: current.isActive,
        passwordHash: newPassword || "", // only hashed server-side if non-empty
      });

      setCurrentUser({ ...student, email, firstName, lastName, course, yearLevel, section });

      document.getElementById("newPassword").value = "";
      document.getElementById("confirmNewPassword").value = "";

      showAlert(successBox, "Profile updated.", "success");
      await load();
    } catch (err) {
      showAlert(alertBox, err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Changes";
    }
  });
})();
