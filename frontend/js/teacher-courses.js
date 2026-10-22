(function () {
  const teacher = requireRole("teacher");
  if (!teacher) return;
  renderShell("courses");

  const alertBox = document.getElementById("alertBox");
  const successBox = document.getElementById("successBox");

  loadCourses();

  async function loadCourses() {
    const loading = document.getElementById("loadingCourses");
    const list = document.getElementById("coursesList");
    try {
      const data = await Teachers.getCourses(teacher.userId);
      if (!data.courses || data.courses.length === 0) {
        list.innerHTML = `<div class="empty-state">You haven't created any courses yet - use the form below.</div>`;
      } else {
        list.innerHTML = data.courses.map(renderCourseCard).join("");
      }
    } catch (err) {
      showAlert(alertBox, err.message);
    } finally {
      loading.classList.add("hidden");
      list.classList.remove("hidden");
    }
  }

  function renderCourseCard(c) {
    return `
      <div class="course-card">
        <div class="course-code">${escapeHtml(c.courseCode)}</div>
        <div class="course-name">${escapeHtml(c.courseName)}</div>
        <div class="course-meta">${c.units} unit(s)${c.schedule ? " &middot; " + escapeHtml(c.schedule) : ""}</div>
        <div class="course-meta">${c.enrolledStudents} student(s) &middot; ${c.assignments} assignment(s) &middot; ${c.materials} material(s)</div>
        <div class="course-actions">
          <a href="teacher-course-detail.html?id=${c.courseId}" class="btn btn-secondary btn-sm">Manage</a>
        </div>
      </div>`;
  }

  document.getElementById("createCourseForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(alertBox);
    hideAlert(successBox);

    const courseCode = document.getElementById("courseCode").value.trim();
    const courseName = document.getElementById("courseName").value.trim();
    const units = Number(document.getElementById("units").value);
    const schedule = document.getElementById("schedule").value.trim();

    if (!courseCode || !courseName || !units) {
      showAlert(alertBox, "Course code, course name, and units are required.");
      return;
    }

    const createBtn = document.getElementById("createBtn");
    createBtn.disabled = true;
    createBtn.textContent = "Creating...";

    try {
      await Courses.create({
        courseCode,
        courseName,
        teacherId: teacher.userId,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        units,
        schedule: schedule || null,
      });
      showAlert(successBox, "Course created.", "success");
      document.getElementById("createCourseForm").reset();
      document.getElementById("units").value = 3;
      await loadCourses();
    } catch (err) {
      showAlert(alertBox, err.message);
    } finally {
      createBtn.disabled = false;
      createBtn.textContent = "Create Course";
    }
  });
})();
