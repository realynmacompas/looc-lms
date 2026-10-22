(function () {
  const teacher = requireRole("teacher");
  if (!teacher) return;
  renderShell("courses");

  const params = new URLSearchParams(window.location.search);
  const studentId = params.get("studentId");
  const courseId = params.get("courseId");

  const alertBox = document.getElementById("alertBox");
  const loadingRow = document.getElementById("loadingRow");
  const content = document.getElementById("attendanceContent");

  const backLink = document.getElementById("breadcrumbBack");
  if (courseId) {
    backLink.href = `teacher-gradebook.html?courseId=${encodeURIComponent(courseId)}`;
    backLink.textContent = "Gradebook";
  } else {
    backLink.href = "teacher-courses.html";
    backLink.textContent = "My Courses";
  }

  if (!studentId) {
    showAlert(alertBox, "No student specified.");
    loadingRow.classList.add("hidden");
    return;
  }

  load();

  async function load() {
    try {
      const student = await Students.getById(studentId);
      document.getElementById("studentName").textContent = `${student.firstName} ${student.lastName}`;
      document.getElementById("studentMeta").textContent =
        [student.studentId, student.course, student.yearLevel, student.section].filter(Boolean).join(" · ");

      let records = [];
      try {
        records = await Students.getAttendance(studentId);
      } catch (err) {
        if (err.status !== 404) throw err;
      }
      renderRows(records);

      loadingRow.classList.add("hidden");
      content.classList.remove("hidden");
    } catch (err) {
      loadingRow.classList.add("hidden");
      showAlert(alertBox, err.message);
    }
  }

  function renderRows(records) {
    const tbody = document.getElementById("attendanceBody");
    if (!records || records.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No attendance records yet.</td></tr>`;
      return;
    }
    const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
    tbody.innerHTML = sorted
      .map(
        (a) => `
      <tr>
        <td>${formatDate(a.date)}</td>
        <td>${formatDateTime(a.timeIn)}</td>
        <td>${a.timeOut ? formatDateTime(a.timeOut) : "—"}</td>
        <td>${escapeHtml(a.task || "—")}</td>
        <td>${escapeHtml(a.journal || "—")}</td>
      </tr>`
      )
      .join("");
  }
})();
