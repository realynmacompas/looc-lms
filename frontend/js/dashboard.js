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
    "Here's what's happening in your subjects.";

  load();

  async function load() {
    try {
      const data = await Students.getDashboard(student.userId);
      renderStats(data.stats);
      renderUpcoming(data.upcomingAssignments);
      renderAnnouncements(data.courses);

      loadingRow.classList.add("hidden");
      content.classList.remove("hidden");
    } catch (err) {
      loadingRow.classList.add("hidden");
      showAlert(alertBox, err.message);
    }
  }

  function renderStats(stats) {
    const pct = stats.overallPercent > 0 ? stats.overallPercent : 0;
    document.getElementById("statGrade").textContent = stats.overallPercent > 0 ? `${stats.overallPercent}%` : "—";
    document.getElementById("statGradeBar").style.width = `${pct}%`;
    document.getElementById("statEquivalent").textContent =
      stats.overallPercent > 0 && stats.overallEquivalent ? `${stats.overallEquivalent} equivalent` : "";
    document.getElementById("statCourses").textContent = stats.enrolledCourses ?? 0;
    document.getElementById("statPending").textContent = stats.pendingAssignments ?? 0;
    document.getElementById("statOverdue").textContent = stats.overdueAssignments ?? 0;
  }

  // Flat agenda-style list, nearest due date first. The API already
  // returns these in that order; we only need to know which one (if
  // any) is overdue so it can get the red date + "Overdue" tag.
  function renderUpcoming(items) {
    const el = document.getElementById("upcomingList");
    if (!items || items.length === 0) {
      el.innerHTML = `<li class="empty-state" style="border-bottom: none;">No upcoming assignments. You're all caught up.</li>`;
      return;
    }

    const now = new Date();
    el.innerHTML = items
      .map((a) => {
        const due = a.dueDate ? new Date(a.dueDate) : null;
        const validDue = due && !isNaN(due);
        const isOverdue = validDue && due < now;
        return `
        <li>
          <div class="agenda-date${isOverdue ? " overdue" : ""}">
            <div class="d">${validDue ? due.getDate() : "—"}</div>
            <div class="m">${validDue ? due.toLocaleDateString("en-PH", { month: "short" }) : ""}</div>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div class="agenda-title"><a href="assignment.html?id=${a.assignmentId}">${escapeHtml(a.title)}</a></div>
            <div class="agenda-meta">${escapeHtml(a.courseCode || "")}</div>
          </div>
          ${isOverdue ? `<div class="pill-overdue">Overdue</div>` : ""}
        </li>`;
      })
      .join("");
  }

  // There's no single "announcements for this student" endpoint, so we
  // fan out to each enrolled course's materials and keep the ones
  // marked type === "announcement" (same convention course-detail.js
  // uses), newest first.
  async function renderAnnouncements(courses) {
    const el = document.getElementById("announcementsList");
    if (!courses || courses.length === 0) {
      el.innerHTML = `<li class="text-muted" style="border-bottom: none;">No announcements yet.</li>`;
      return;
    }

    try {
      const perCourse = await Promise.all(
        courses.map((c) => Materials.getByCourse(c.courseId).catch(() => []))
      );
      const announcements = perCourse
        .flat()
        .filter((m) => m.type === "announcement")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      if (announcements.length === 0) {
        el.innerHTML = `<li class="text-muted" style="border-bottom: none;">No announcements yet.</li>`;
        return;
      }

      el.innerHTML = announcements
        .map(
          (m) => `
        <li>
          <div class="announce-date">${formatDate(m.createdAt).toUpperCase()}</div>
          <div class="announce-title">${escapeHtml(m.title)}</div>
        </li>`
        )
        .join("");
    } catch (err) {
      el.innerHTML = `<li class="text-muted" style="border-bottom: none;">Couldn't load announcements.</li>`;
    }
  }

})();