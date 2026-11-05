(function () {
  const student = requireRole("student");
  if (!student) return;
  renderShell("dashboard");

  const alertBox = document.getElementById("alertBox");
  const loadingRow = document.getElementById("loadingRow");
  const content = document.getElementById("dashboardContent");

  document.getElementById("welcomeHeading").textContent = `Welcome, ${student.firstName}!`;
  document.getElementById("welcomeSubtitle").textContent =
    [student.course, student.yearLevel, student.section].filter(Boolean).join(" · ") ||
    "Here's what's happening in your courses.";

  load();

  async function load() {
    try {
      const data = await Students.getDashboard(student.userId);
      renderStats(data.stats);
      renderCourses(data.courses);
      renderUpcoming(data.upcomingAssignments);
      renderRecentGrades(data.recentGrades);
      renderAnnouncements(data.courses);

      loadingRow.classList.add("hidden");
      content.classList.remove("hidden");
    } catch (err) {
      loadingRow.classList.add("hidden");
      showAlert(alertBox, err.message);
    }
  }

  function renderStats(stats) {
    document.getElementById("statCourses").textContent = stats.enrolledCourses ?? 0;
    const percent = stats.overallPercent > 0 ? stats.overallPercent : 0;
    document.getElementById("statGrade").textContent = percent > 0 ? `${percent}%` : "—";
    document.getElementById("statGradeBar").style.width = `${percent}%`;
    document.getElementById("statGradeEquivalent").textContent =
      percent > 0 ? `${stats.overallEquivalent} equivalent` : "";
    document.getElementById("statPending").textContent = stats.pendingAssignments ?? 0;
    document.getElementById("statOverdue").textContent = stats.overdueAssignments ?? 0;
  }

  function renderCourses(courses) {
    const el = document.getElementById("coursesList");
    if (!courses || courses.length === 0) {
      el.innerHTML = `<div class="empty-state">You're not enrolled in any courses yet. <a href="courses.html">Browse courses</a>.</div>`;
      return;
    }
    el.innerHTML = courses
      .map(
        (c) => `
      <div class="subject-card">
        <div class="subject-name">${escapeHtml(c.courseName)}</div>
        <table class="mini-table">
          <thead>
            <tr><th></th><th>Graded</th><th>Pending</th></tr>
          </thead>
          <tbody>
            <tr><td>Assignments</td><td>${c.gradedCount ?? 0} / ${c.totalAssignments ?? 0}</td><td>${c.pendingAssignments ?? 0}</td></tr>
          </tbody>
        </table>
        <ul class="subj-list">
          <li>${escapeHtml(c.teacherName || "Teacher TBA")}</li>
        </ul>
        <div class="subj-schedule-label">SCHEDULE:</div>
        <ul class="subj-list">
          <li>${c.schedule ? escapeHtml(c.schedule) : "<span class=\"text-muted\">Not set yet</span>"}</li>
        </ul>
        <a href="course-detail.html?id=${c.courseId}" class="btn-pill">View Class</a>
      </div>`
      )
      .join("");
  }

  function renderUpcoming(items) {
    const el = document.getElementById("upcomingList");
    if (!items || items.length === 0) {
      el.innerHTML = `<li class="empty-state">No upcoming assignments. You're all caught up.</li>`;
      return;
    }
    el.innerHTML = items
      .map(
        (a) => `
      <li style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
        <div style="min-width:0;">
          <div style="font-size:13px; font-weight:600;"><a href="assignment.html?id=${a.assignmentId}">${escapeHtml(a.title)}</a></div>
          <div style="font-size:11.5px; color:var(--color-text-muted);">${escapeHtml(a.courseCode || "")}</div>
        </div>
        <div style="font-size:11.5px; font-weight:700; color:var(--color-warning); background:var(--color-warning-bg); padding:3px 9px; border-radius:999px; white-space:nowrap;">${formatDate(a.dueDate)}</div>
      </li>`
      )
      .join("");
  }

  function renderRecentGrades(items) {
    const el = document.getElementById("recentGradesList");
    if (!items || items.length === 0) {
      el.innerHTML = `<li class="empty-state">No graded work yet.</li>`;
      return;
    }
    el.innerHTML = items
      .map(
        (g) => `
      <li style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
        <div style="min-width:0;">
          <div style="font-size:13px; font-weight:600;">${escapeHtml(g.assignmentTitle || "Assignment")}</div>
          <div style="font-size:11.5px; color:var(--color-text-muted);">${escapeHtml(g.courseCode || "")}</div>
        </div>
        <div style="font-size:13px; font-weight:700; color:var(--color-primary); white-space:nowrap;">${g.score}/${g.maxPoints}</div>
      </li>`
      )
      .join("");
  }

  // Announcements aren't on the dashboard endpoint - each one is a Material
  // (type "announcement") scoped to a single course. Fetch per enrolled
  // course and merge, newest first.
  async function renderAnnouncements(courses) {
    const el = document.getElementById("announcementsList");
    if (!courses || courses.length === 0) {
      el.innerHTML = `<li class="empty-state">No announcements yet.</li>`;
      return;
    }
    try {
      const perCourse = await Promise.all(
        courses.map((c) =>
          Materials.getByCourse(c.courseId)
            .then((list) => (list || []).map((m) => ({ ...m, courseCode: c.courseCode })))
            .catch(() => [])
        )
      );
      const announcements = perCourse
        .flat()
        .filter((m) => m.type === "announcement")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      if (announcements.length === 0) {
        el.innerHTML = `<li class="empty-state">No announcements yet.</li>`;
        return;
      }
      el.innerHTML = announcements
        .map(
          (a) => `
        <li>
          <div style="font-size:11px; color:var(--color-text-muted); font-weight:600;">${formatDate(a.createdAt).toUpperCase()} &middot; ${escapeHtml(a.courseCode || "")}</div>
          <div style="font-size:13px; font-weight:600; margin-top:2px;">${escapeHtml(a.title)}</div>
        </li>`
        )
        .join("");
    } catch {
      el.innerHTML = `<li class="empty-state">Couldn't load announcements.</li>`;
    }
  }

})();