(function () {
  const teacher = requireRole("teacher");
  if (!teacher) return;
  renderShell("dashboard");

  const alertBox = document.getElementById("alertBox");
  const loadingRow = document.getElementById("loadingRow");
  const content = document.getElementById("dashboardContent");

  document.getElementById("welcomeHeading").textContent = `Welcome, ${teacher.firstName}!`;
  document.getElementById("welcomeSubtitle").textContent =
    teacher.department || "Here's what's happening in your classes.";

  load();

  async function load() {
    try {
      const data = await Teachers.getDashboard(teacher.userId);
      renderStats(data.stats);
      renderCourses(data.courses);
      renderUpcoming(data.upcomingDeadlines);

      loadingRow.classList.add("hidden");
      content.classList.remove("hidden");
    } catch (err) {
      loadingRow.classList.add("hidden");
      showAlert(alertBox, err.message);
    }
  }

  function renderStats(stats) {
    document.getElementById("statCourses").textContent = stats.totalCourses ?? 0;
    document.getElementById("statStudents").textContent = stats.totalStudents ?? 0;
    document.getElementById("statAssignments").textContent = stats.totalAssignments ?? 0;
    document.getElementById("statPendingGrading").textContent = stats.pendingGrading ?? 0;
  }

  function renderCourses(courses) {
    const el = document.getElementById("coursesList");
    if (!courses || courses.length === 0) {
      el.innerHTML = `<div class="empty-state">You haven't created any courses yet. <a href="teacher-courses.html">Create one</a>.</div>`;
      return;
    }
    el.innerHTML = courses
      .map(
        (c) => `
      <div class="list-item">
        <div>
          <div class="item-title">
            <a href="teacher-course-detail.html?id=${c.courseId}">${escapeHtml(c.courseCode)} - ${escapeHtml(c.courseName)}</a>
          </div>
          <div class="item-meta">${c.enrolledStudents} student(s) &middot; ${c.assignments} assignment(s)</div>
        </div>
        <div>${c.pendingGrading > 0 ? `<span class="badge badge-late">${c.pendingGrading} to grade</span>` : `<span class="badge badge-active">up to date</span>`}</div>
      </div>`
      )
      .join("");
  }

  function renderUpcoming(items) {
    const el = document.getElementById("upcomingList");
    if (!items || items.length === 0) {
      el.innerHTML = `<div class="empty-state">No upcoming deadlines.</div>`;
      return;
    }
    el.innerHTML = items
      .map(
        (a) => `
      <div class="list-item">
        <div>
          <div class="item-title"><a href="teacher-assignment.html?id=${a.assignmentId}">${escapeHtml(a.title)}</a></div>
          <div class="item-meta">${escapeHtml(a.courseCode || "")} &middot; ${a.maxPoints} pts</div>
        </div>
        <div class="item-meta">Due ${formatDate(a.dueDate)}</div>
      </div>`
      )
      .join("");
  }
})();
