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
      renderAttendance(data.stats);

      loadingRow.classList.add("hidden");
      content.classList.remove("hidden");
    } catch (err) {
      loadingRow.classList.add("hidden");
      showAlert(alertBox, err.message);
    }
  }

  function renderStats(stats) {
    document.getElementById("statCourses").textContent = stats.enrolledCourses ?? 0;
    document.getElementById("statGrade").textContent =
      stats.overallPercent > 0 ? `${stats.overallPercent}%` : "—";
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
      <div class="list-item">
        <div>
          <div class="item-title">
            <a href="course-detail.html?id=${c.courseId}">${escapeHtml(c.courseCode)} - ${escapeHtml(c.courseName)}</a>
          </div>
          <div class="item-meta">${escapeHtml(c.teacherName || "")} &middot; ${c.units} unit(s) &middot; ${c.pendingAssignments} pending</div>
        </div>
        <div><span class="${badgeClass(c.enrollmentStatus)}">${c.percent > 0 ? c.percent + "%" : c.enrollmentStatus}</span></div>
      </div>`
      )
      .join("");
  }

  function renderUpcoming(items) {
    const el = document.getElementById("upcomingList");
    if (!items || items.length === 0) {
      el.innerHTML = `<div class="empty-state">No upcoming assignments. You're all caught up.</div>`;
      return;
    }
    el.innerHTML = items
      .map(
        (a) => `
      <div class="list-item">
        <div>
          <div class="item-title"><a href="assignment.html?id=${a.assignmentId}">${escapeHtml(a.title)}</a></div>
          <div class="item-meta">${escapeHtml(a.courseCode || "")} &middot; ${a.maxPoints} pts</div>
        </div>
        <div class="item-meta">Due ${formatDate(a.dueDate)}</div>
      </div>`
      )
      .join("");
  }

  function renderRecentGrades(items) {
    const el = document.getElementById("recentGradesList");
    if (!items || items.length === 0) {
      el.innerHTML = `<div class="empty-state">No graded work yet.</div>`;
      return;
    }
    el.innerHTML = items
      .map(
        (g) => `
      <div class="list-item">
        <div>
          <div class="item-title">${escapeHtml(g.assignmentTitle || "Assignment")}</div>
          <div class="item-meta">${escapeHtml(g.courseCode || "")}${g.feedback ? " &middot; " + escapeHtml(g.feedback) : ""}</div>
        </div>
        <div class="item-title">${g.score}/${g.maxPoints}</div>
      </div>`
      )
      .join("");
  }

  function renderAttendance(stats) {
    const el = document.getElementById("attendanceSummary");
    el.innerHTML = `
      <div class="list-item">
        <div class="item-meta">Recorded days</div>
        <div class="item-title">${stats.attendanceDays ?? 0}</div>
      </div>
      <div class="list-item">
        <div class="item-meta">Open (no time-out) days</div>
        <div class="item-title">${stats.openAttendanceDays ?? 0}</div>
      </div>
      <div class="list-item">
        <div class="item-meta">Last recorded</div>
        <div class="item-title">${formatDate(stats.lastAttendance)}</div>
      </div>
    `;
  }
})();
