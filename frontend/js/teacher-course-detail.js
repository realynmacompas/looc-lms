(function () {
  const teacher = requireRole("teacher");
  if (!teacher) return;
  renderShell("courses");

  const params = new URLSearchParams(window.location.search);
  const courseId = params.get("id");

  const alertBox = document.getElementById("alertBox");
  const successBox = document.getElementById("successBox");
  const loadingRow = document.getElementById("loadingRow");
  const content = document.getElementById("courseContent");

  if (!courseId) {
    showAlert(alertBox, "No course specified.");
    loadingRow.classList.add("hidden");
    return;
  }

  load();

  async function load() {
    try {
      const course = await Courses.getById(courseId);
      document.getElementById("breadcrumbCourse").textContent = course.courseCode;
      document.getElementById("courseTitle").textContent = `${course.courseCode} - ${course.courseName}`;
      document.getElementById("courseMeta").textContent =
        [`${course.units} unit(s)`, course.schedule].filter(Boolean).join(" · ");
      document.getElementById("gradebookLink").href = `teacher-gradebook.html?courseId=${courseId}`;

      await Promise.all([loadMaterials(), loadAssignments()]);

      loadingRow.classList.add("hidden");
      content.classList.remove("hidden");
    } catch (err) {
      loadingRow.classList.add("hidden");
      showAlert(alertBox, err.message);
    }
  }

  async function loadMaterials() {
    const el = document.getElementById("materialsList");
    try {
      const materials = await Materials.getByCourse(courseId);
      if (!materials || materials.length === 0) {
        el.innerHTML = `<div class="empty-state">No materials posted yet.</div>`;
        return;
      }
      el.innerHTML = materials
        .map(
          (m) => `
        <div class="list-item">
          <div>
            <div class="item-title">${escapeHtml(m.title)}</div>
            <div class="item-meta">${escapeHtml(m.description || "")}</div>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="badge badge-completed">${escapeHtml(m.type)}</span>
            ${m.url && m.url !== "n/a" ? `<a href="${encodeURI(m.url)}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">Open</a>` : ""}
          </div>
        </div>`
        )
        .join("");
    } catch (err) {
      el.innerHTML = `<div class="empty-state">Could not load materials: ${escapeHtml(err.message)}</div>`;
    }
  }

  async function loadAssignments() {
    const tbody = document.getElementById("assignmentsBody");
    try {
      const assignments = await Assignments.getByCourse(courseId);
      if (!assignments || assignments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No assignments posted yet.</td></tr>`;
        return;
      }
      tbody.innerHTML = assignments
        .map(
          (a) => `
        <tr>
          <td>${escapeHtml(a.title)}</td>
          <td>${formatDate(a.dueDate)}</td>
          <td>${a.maxPoints}</td>
          <td><a href="teacher-assignment.html?id=${a.assignmentId}" class="btn btn-secondary btn-sm">View Submissions</a></td>
        </tr>`
        )
        .join("");
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4" class="empty-state">Could not load assignments: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  document.getElementById("materialForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(alertBox);
    hideAlert(successBox);

    const title = document.getElementById("materialTitle").value.trim();
    const type = document.getElementById("materialType").value;
    const description = document.getElementById("materialDescription").value.trim();
    const url = document.getElementById("materialUrl").value.trim();

    if (!title || !url) {
      showAlert(alertBox, "Title and link are required.");
      return;
    }

    const btn = document.getElementById("materialBtn");
    btn.disabled = true;
    btn.textContent = "Posting...";

    try {
      await Materials.create({
        courseId: Number(courseId),
        title,
        description: description || null,
        type,
        url,
        uploadedBy: teacher.userId,
      });
      showAlert(successBox, "Material posted.", "success");
      document.getElementById("materialForm").reset();
      await loadMaterials();
    } catch (err) {
      showAlert(alertBox, err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Post Material";
    }
  });

  document.getElementById("announcementForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(alertBox);
    hideAlert(successBox);

    const title = document.getElementById("announcementTitle").value.trim();
    const description = document.getElementById("announcementDescription").value.trim();

    if (!title) {
      showAlert(alertBox, "Please enter the announcement text.");
      return;
    }

    const btn = document.getElementById("announcementBtn");
    btn.disabled = true;
    btn.textContent = "Posting...";

    try {
      await Teachers.postAnnouncement(courseId, { title, description: description || null });
      showAlert(successBox, "Announcement posted.", "success");
      document.getElementById("announcementForm").reset();
      await loadMaterials();
    } catch (err) {
      showAlert(alertBox, err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Post Announcement";
    }
  });

  document.getElementById("assignmentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(alertBox);
    hideAlert(successBox);

    const title = document.getElementById("assignmentTitle").value.trim();
    const description = document.getElementById("assignmentDescription").value.trim();
    const maxPoints = Number(document.getElementById("maxPoints").value);
    const dueDateRaw = document.getElementById("dueDate").value;
    const attachmentUrl = document.getElementById("attachmentUrl").value.trim();

    if (!title) {
      showAlert(alertBox, "Title is required.");
      return;
    }

    const btn = document.getElementById("assignmentBtn");
    btn.disabled = true;
    btn.textContent = "Creating...";

    try {
      await Assignments.create({
        courseId: Number(courseId),
        title,
        description: description || null,
        dueDate: dueDateRaw ? new Date(dueDateRaw).toISOString() : null,
        maxPoints: maxPoints || 100,
        attachmentUrl: attachmentUrl || null,
        createdBy: teacher.userId,
      });
      showAlert(successBox, "Assignment created.", "success");
      document.getElementById("assignmentForm").reset();
      await loadAssignments();
    } catch (err) {
      showAlert(alertBox, err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Create Assignment";
    }
  });
})();
