(function () {
  const student = requireRole("student");
  if (!student) return;
  renderShell("grades");

  const alertBox = document.getElementById("alertBox");
  const loadingRow = document.getElementById("loadingRow");
  const content = document.getElementById("gradesContent");

  load();

  async function load() {
    try {
      const data = await Grades.getForStudent(student.userId);

      document.getElementById("overallPercent").textContent =
        data.overallPercent > 0 ? `${data.overallPercent}%` : "—";
      document.getElementById("overallEquivalent").textContent =
        data.overallPercent > 0 ? data.overallEquivalent : "—";
      document.getElementById("totalUnits").textContent = data.totalUnits ?? 0;

      const tbody = document.getElementById("coursesBody");
      if (!data.courses || data.courses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No enrolled courses yet.</td></tr>`;
      } else {
        tbody.innerHTML = data.courses
          .map(
            (c) => `
          <tr>
            <td>
              <div style="font-weight:600;">${escapeHtml(c.courseCode)}</div>
              <div class="text-muted">${escapeHtml(c.courseName)}</div>
            </td>
            <td>${c.units}</td>
            <td>${c.gradedAssignments}/${c.totalAssignments}</td>
            <td>${c.percent > 0 ? c.percent + "%" : "—"}</td>
            <td>${c.finalGrade ?? "—"}</td>
            <td><a href="course-detail.html?id=${c.courseId}" class="btn btn-secondary btn-sm">Open</a></td>
          </tr>`
          )
          .join("");
      }

      loadingRow.classList.add("hidden");
      content.classList.remove("hidden");
    } catch (err) {
      loadingRow.classList.add("hidden");
      showAlert(alertBox, err.message);
    }
  }
})();
