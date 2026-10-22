(function () {
  const student = requireRole("student");
  if (!student) return;
  renderShell("courses");

  const alertBox = document.getElementById("alertBox");
  const successBox = document.getElementById("successBox");

  let enrolledCourseIds = new Set();

  loadEnrolled();
  loadAvailable();

  async function loadEnrolled() {
    const loading = document.getElementById("loadingEnrolled");
    const list = document.getElementById("enrolledList");
    try {
      const enrollments = await Enrollments.getForStudent(student.userId);
      enrolledCourseIds = new Set(enrollments.map((e) => e.course.courseId));

      if (enrollments.length === 0) {
        list.innerHTML = `<div class="empty-state">You haven't enrolled in any courses yet.</div>`;
      } else {
        list.innerHTML = enrollments.map(renderEnrolledCard).join("");
        list.querySelectorAll("[data-drop-id]").forEach((btn) => {
          btn.addEventListener("click", () => handleDrop(btn.dataset.dropId));
        });
      }
    } catch (err) {
      showAlert(alertBox, err.message);
    } finally {
      loading.classList.add("hidden");
      list.classList.remove("hidden");
    }
  }

  async function loadAvailable() {
    const loading = document.getElementById("loadingAvailable");
    const list = document.getElementById("availableList");
    try {
      const courses = await Courses.getAll();
      const available = courses.filter((c) => !enrolledCourseIds.has(c.courseId));

      if (available.length === 0) {
        list.innerHTML = `<div class="empty-state">No additional courses available right now.</div>`;
      } else {
        list.innerHTML = available.map(renderAvailableCard).join("");
        list.querySelectorAll("[data-enroll-id]").forEach((btn) => {
          btn.addEventListener("click", () => handleEnroll(btn.dataset.enrollId));
        });
      }
    } catch (err) {
      showAlert(alertBox, err.message);
    } finally {
      loading.classList.add("hidden");
      list.classList.remove("hidden");
    }
  }

  function renderEnrolledCard(e) {
    const c = e.course;
    return `
      <div class="course-card">
        <div class="course-code">${escapeHtml(c.courseCode)}</div>
        <div class="course-name">${escapeHtml(c.courseName)}</div>
        <div class="course-meta">${escapeHtml(c.teacherName || "")}</div>
        <div class="course-meta">${c.units} unit(s)${c.schedule ? " &middot; " + escapeHtml(c.schedule) : ""}</div>
        <div><span class="${badgeClass(e.status)}">${e.status}</span>${e.finalGrade ? ` <span class="badge badge-completed">Final: ${e.finalGrade}%</span>` : ""}</div>
        <div class="course-actions">
          <a href="course-detail.html?id=${c.courseId}" class="btn btn-secondary btn-sm">Open</a>
          ${e.status === "active" ? `<button class="btn btn-danger btn-sm" data-drop-id="${e.enrollmentId}">Drop</button>` : ""}
        </div>
      </div>`;
  }

  function renderAvailableCard(c) {
    return `
      <div class="course-card">
        <div class="course-code">${escapeHtml(c.courseCode)}</div>
        <div class="course-name">${escapeHtml(c.courseName)}</div>
        <div class="course-meta">${escapeHtml(c.teacherName || "")}</div>
        <div class="course-meta">${c.units} unit(s)${c.schedule ? " &middot; " + escapeHtml(c.schedule) : ""}</div>
        <div class="course-actions">
          <button class="btn btn-primary btn-sm" data-enroll-id="${c.courseId}">Enroll</button>
        </div>
      </div>`;
  }

  async function handleEnroll(courseId) {
    hideAlert(alertBox);
    hideAlert(successBox);
    try {
      await Enrollments.enroll(student.userId, Number(courseId));
      showAlert(successBox, "You're enrolled! Reloading your courses...", "success");
      await Promise.all([loadEnrolled(), loadAvailable()]);
    } catch (err) {
      showAlert(alertBox, err.message);
    }
  }

  async function handleDrop(enrollmentId) {
    if (!confirm("Drop this course? You can re-enroll later if it's still available.")) return;
    hideAlert(alertBox);
    hideAlert(successBox);
    try {
      await Enrollments.updateStatus(Number(enrollmentId), "dropped");
      showAlert(successBox, "Course dropped.", "success");
      await Promise.all([loadEnrolled(), loadAvailable()]);
    } catch (err) {
      showAlert(alertBox, err.message);
    }
  }
})();
