(function () {
  const teacher = requireRole("teacher");
  if (!teacher) return;
  renderShell("profile");

  const alertBox = document.getElementById("alertBox");
  const loadingRow = document.getElementById("loadingRow");
  const content = document.getElementById("profileContent");

  load();

  async function load() {
    try {
      const data = await Teachers.getById(teacher.userId);

      document.getElementById("fTeacherId").textContent = data.teacherId;
      document.getElementById("fName").textContent = `${data.firstName} ${data.lastName}`;
      document.getElementById("fEmail").textContent = data.email;
      document.getElementById("fDepartment").textContent = data.department || "—";
      document.getElementById("fCreatedAt").textContent = formatDate(data.createdAt);

      loadingRow.classList.add("hidden");
      content.classList.remove("hidden");
    } catch (err) {
      loadingRow.classList.add("hidden");
      showAlert(alertBox, err.message);
    }
  }
})();
