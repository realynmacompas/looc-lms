(function () {
  const teacher = requireRole("teacher");
  if (!teacher) return;
  renderShell("courses");

  const params = new URLSearchParams(window.location.search);
  const courseId = params.get("courseId");

  const alertBox = document.getElementById("alertBox");
  const loadingRow = document.getElementById("loadingRow");
  const content = document.getElementById("gradebookContent");

  if (!courseId) {
    showAlert(alertBox, "No course specified.");
    loadingRow.classList.add("hidden");
    return;
  }

  load();

  async function load() {
    try {
      const data = await Teachers.getGradebook(courseId);

      document.getElementById("breadcrumbCourse").href = `teacher-course-detail.html?id=${courseId}`;
      document.getElementById("breadcrumbCourse").textContent = data.courseCode;
      document.getElementById("courseTitle").textContent = `${data.courseCode} - ${data.courseName}`;
      document.getElementById("courseMeta").textContent =
        `${data.totalStudents} student(s) · ${data.totalAssignments} assignment(s)`;

      renderTable(data);

      loadingRow.classList.add("hidden");
      content.classList.remove("hidden");
    } catch (err) {
      loadingRow.classList.add("hidden");
      showAlert(alertBox, err.message);
    }
  }

  function renderTable(data) {
    const head = document.getElementById("gradebookHead");
    const body = document.getElementById("gradebookBody");
    const assignments = data.assignments || [];

    head.innerHTML = `
      <tr>
        <th>Student</th>
        ${assignments.map((a) => `<th>${escapeHtml(a.title)}<br><span class="text-muted">/${a.maxPoints}</span></th>`).join("")}
        <th>Percent</th>
        <th>Equivalent</th>
      </tr>`;

    if (!data.students || data.students.length === 0) {
      body.innerHTML = `<tr><td colspan="${assignments.length + 4}" class="empty-state">No students enrolled yet.</td></tr>`;
      return;
    }

    body.innerHTML = data.students
      .map((s) => {
        const cells = assignments
          .map((a) => {
            const g = (s.grades || []).find((x) => x.assignmentId === a.assignmentId);
            if (!g || g.score === null || g.score === undefined) {
              return `<td class="text-muted">${g ? g.status.replace("_", " ") : "—"}</td>`;
            }
            return `<td>${g.score}</td>`;
          })
          .join("");
        return `
        <tr>
          <td>
            <div style="font-weight:600;">${escapeHtml(s.studentName)}</div>
            <div class="text-muted">${escapeHtml(s.studentId)}</div>
          </td>
          ${cells}
                    <td>${s.percent > 0 ? s.percent + "%" : "—"}</td>
          <td>${s.percent > 0 ? s.equivalent : "—"}</td>
        </tr>`;
      })
      .join("");
  }
})();