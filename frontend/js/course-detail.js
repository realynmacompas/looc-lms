(function () {
  const student = requireRole("student");
  if (!student) return;
  renderShell("courses");

  const params = new URLSearchParams(window.location.search);
  const courseId = params.get("id");

  const alertBox = document.getElementById("alertBox");
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
        [course.teacherName, `${course.units} unit(s)`, course.schedule].filter(Boolean).join(" · ");

      await Promise.all([loadMaterials(), loadAssignments()]);

      loadingRow.classList.add("hidden");
      content.classList.remove("hidden");
    } catch (err) {
      loadingRow.classList.add("hidden");
      showAlert(alertBox, err.message);
    }
  }

  let materialsCache = [];
  let assignmentsCache = [];

  async function loadMaterials() {
    const el = document.getElementById("materialsList");
    try {
      const materials = await Materials.getByCourse(courseId);
      materialsCache = materials || [];
      if (materialsCache.length === 0) {
        el.innerHTML = `<div class="empty-state">No materials posted yet.</div>`;
        return;
      }
      el.innerHTML = materialsCache
        .map(
          (m, i) => `
        <div class="list-item">
          <div>
            <div class="item-title">${escapeHtml(m.title)}</div>
            <div class="item-meta">${escapeHtml(m.description || "")}</div>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="badge badge-completed">${escapeHtml(m.type)}</span>
            <button type="button" class="btn btn-secondary btn-sm" data-material-index="${i}">Open</button>
          </div>
        </div>`
        )
        .join("");
      el.querySelectorAll("[data-material-index]").forEach((btn) => {
        btn.addEventListener("click", () => openMaterialModal(materialsCache[Number(btn.dataset.materialIndex)]));
      });
    } catch (err) {
      el.innerHTML = `<div class="empty-state">Could not load materials: ${escapeHtml(err.message)}</div>`;
    }
  }

  function openMaterialModal(m) {
    const hasUrl = m.url && m.url !== "n/a";
    openModal(
      m.title,
      `
      <div class="list-item">
        <div class="item-meta">Type</div>
        <div class="item-title">${escapeHtml(m.type)}</div>
      </div>
      ${
        m.description
          ? `<div class="list-item"><div class="item-meta">Description</div><div>${escapeHtml(m.description)}</div></div>`
          : ""
      }
      ${
        hasUrl
          ? `<a href="${encodeURI(m.url)}" target="_blank" rel="noopener" class="btn btn-primary" style="width:auto; margin-top:14px;">Open Link</a>`
          : `<p class="field-hint" style="margin-top:14px;">No link was attached to this ${escapeHtml(m.type)}.</p>`
      }
    `
    );
  }

  async function loadAssignments() {
    const tbody = document.getElementById("assignmentsBody");
    try {
      const grade = await Grades.getForCourse(courseId, student.userId);
      assignmentsCache = grade.assignments || [];
      if (assignmentsCache.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No assignments posted yet.</td></tr>`;
        return;
      }
      tbody.innerHTML = assignmentsCache
        .map((a, i) => {
          const overdue = a.status === "not_submitted" && a.dueDate && new Date(a.dueDate) < new Date();
          const statusLabel = overdue ? "overdue" : a.status;
          return `
          <tr>
            <td>${escapeHtml(a.title)}</td>
            <td>${formatDate(a.dueDate)}</td>
            <td>${a.maxPoints}</td>
            <td>${a.score !== null && a.score !== undefined ? a.score : "—"}</td>
            <td><span class="${badgeClass(statusLabel)}">${statusLabel.replace("_", " ")}</span></td>
            <td><button type="button" class="btn btn-secondary btn-sm" data-assignment-index="${i}">${a.status === "not_submitted" ? "Submit" : "View"}</button></td>
          </tr>`;
        })
        .join("");
      tbody.querySelectorAll("[data-assignment-index]").forEach((btn) => {
        btn.addEventListener("click", () => openAssignmentModal(assignmentsCache[Number(btn.dataset.assignmentIndex)]));
      });
    } catch (err) {
      if (err.status === 404) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${escapeHtml(err.message)} <a href="courses.html">Go to My Courses</a>.</td></tr>`;
      } else {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Could not load assignments: ${escapeHtml(err.message)}</td></tr>`;
      }
    }
  }

  async function openAssignmentModal(a) {
    // grade.assignments (from GET /api/grades/course/{courseId}/student/{studentId})
    // doesn't include the description or attachment URL, so those are fetched
    // separately - the same call assignment.html already makes.
    openModal(a.title, `<div class="loading-row" style="padding:8px 0;">Loading assignment details...</div>`);
    try {
      const full = await Assignments.getById(a.assignmentId);
      const overdue = a.status === "not_submitted" && a.dueDate && new Date(a.dueDate) < new Date();
      const statusLabel = overdue ? "overdue" : a.status;
      openModal(
        a.title,
        `
        <div class="list-item">
          <div class="item-meta">Due</div>
          <div class="item-title">${formatDateTime(full.dueDate)} &middot; ${full.maxPoints} points</div>
        </div>
        <div class="list-item">
          <div class="item-meta">Status</div>
          <div><span class="${badgeClass(statusLabel)}">${statusLabel.replace("_", " ")}</span></div>
        </div>
        ${
          full.description
            ? `<div class="list-item"><div class="item-meta">Description</div><div>${escapeHtml(full.description)}</div></div>`
            : ""
        }
        ${
          a.score !== null && a.score !== undefined
            ? `<div class="list-item"><div class="item-meta">Score</div><div class="item-title">${a.score} / ${full.maxPoints}</div></div>`
            : ""
        }
        ${
          full.attachmentUrl
            ? `<a href="${encodeURI(full.attachmentUrl)}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">View Assignment Attachment</a>`
            : ""
        }
        <div style="margin-top:14px;">
          <a href="assignment.html?id=${a.assignmentId}" class="btn btn-primary" style="width:auto;">
            ${a.status === "not_submitted" ? "Go to Submit" : "Go to Submission"}
          </a>
        </div>
      `
      );
    } catch (err) {
      openModal(a.title, `<div class="empty-state">Could not load assignment details: ${escapeHtml(err.message)}</div>`);
    }
  }
})();
