(function () {
  const student = requireRole("student");
  if (!student) return;
  renderShell("report-card");

  const alertBox = document.getElementById("alertBox");
  const loadingRow = document.getElementById("loadingRow");
  const content = document.getElementById("reportCardContent");

  load();

  async function load() {
    try {
      const data = await Grades.getForStudent(student.userId);
      renderSummary(data);
      renderSubjects(data.courses);

      loadingRow.classList.add("hidden");
      content.classList.remove("hidden");
    } catch (err) {
      loadingRow.classList.add("hidden");
      showAlert(alertBox, err.message);
    }
  }

  function renderSummary(data) {
    document.getElementById("statOverall").textContent =
      data.overallPercent > 0 ? `${data.overallPercent}%` : "—";
    document.getElementById("statEquivalent").textContent =
      data.overallPercent > 0 ? data.overallEquivalent : "—";
    document.getElementById("statUnits").textContent = data.totalUnits ?? 0;
  }

  function renderSubjects(courses) {
    const el = document.getElementById("gradesBody");
    if (!courses || courses.length === 0) {
      el.innerHTML = `<tr><td colspan="5" class="empty-state">No subjects enrolled yet.</td></tr>`;
      return;
    }
    el.innerHTML = courses
      .map((c) => {
        const finalGradeCell =
          c.finalGrade != null
            ? `<span class="text-success" style="font-weight:700;">${c.finalGrade}</span>`
            : `<span class="badge badge-pending">In progress</span>`;
        return `
        <tr>
          <td>
            <div style="font-weight:600;">${escapeHtml(c.courseCode)}</div>
            <div class="text-muted" style="font-size:12.5px;">${escapeHtml(c.courseName)}</div>
          </td>
          <td>${c.units}</td>
          <td>${c.percent > 0 ? `<strong>${c.percent}%</strong>` : "—"}</td>
          <td>${c.percent > 0 ? percentToEquivalent(c.percent) : "—"}</td>
          <td>${finalGradeCell}</td>
        </tr>`;
      })
      .join("");
  }

  // The /api/grades/student/{id} response gives an overall equivalent
  // but not a per-subject one, so this mirrors GradesController's own
  // PercentToEquivalent breakpoints exactly. If those breakpoints ever
  // change on the backend, update this too.
  function percentToEquivalent(percent) {
    if (percent >= 96) return "1.00";
    if (percent >= 91) return "1.25";
    if (percent >= 86) return "1.50";
    if (percent >= 81) return "1.75";
    if (percent >= 76) return "2.00";
    if (percent >= 71) return "2.25";
    if (percent >= 66) return "2.50";
    if (percent >= 61) return "2.75";
    if (percent >= 56) return "3.00";
    return "5.00";
  }
})();
