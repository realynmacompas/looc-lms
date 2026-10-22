(function () {
  const teacher = requireRole("teacher");
  if (!teacher) return;
  renderShell("courses");

  const params = new URLSearchParams(window.location.search);
  const assignmentId = params.get("id");

  const alertBox = document.getElementById("alertBox");
  const successBox = document.getElementById("successBox");
  const loadingRow = document.getElementById("loadingRow");
  const content = document.getElementById("assignmentContent");

  let maxPoints = 100;

  if (!assignmentId) {
    showAlert(alertBox, "No assignment specified.");
    loadingRow.classList.add("hidden");
    return;
  }

  load();

  async function load() {
    try {
      const data = await Teachers.getAssignmentSubmissions(assignmentId);
      maxPoints = data.maxPoints;

      document.getElementById("assignmentTitle").textContent = data.title;
      document.getElementById("assignmentMeta").textContent =
        `Due ${formatDateTime(data.dueDate)} · ${data.maxPoints} points`;
      document.getElementById("statTotal").textContent = data.totalSubmissions ?? 0;
      document.getElementById("statGraded").textContent = data.gradedCount ?? 0;
      document.getElementById("statPending").textContent = data.pendingCount ?? 0;

      renderSubmissions(data.submissions);

      loadingRow.classList.add("hidden");
      content.classList.remove("hidden");
    } catch (err) {
      loadingRow.classList.add("hidden");
      showAlert(alertBox, err.message);
    }
  }

  function renderSubmissions(submissions) {
    const el = document.getElementById("submissionsList");
    if (!submissions || submissions.length === 0) {
      el.innerHTML = `<div class="empty-state">No submissions yet.</div>`;
      return;
    }
    el.innerHTML = submissions.map(renderSubmissionRow).join("");

    el.querySelectorAll("[data-grade-form]").forEach((form) => {
      form.addEventListener("submit", handleGrade);
    });
  }

  function renderSubmissionRow(s) {
    return `
      <div class="card" style="margin-bottom:12px; box-shadow:none; border:1px solid var(--color-border);">
        <div class="page-header" style="margin-bottom:8px;">
          <div>
            <div class="item-title">${escapeHtml(s.studentName)} <span class="text-muted">(${escapeHtml(s.studentId)})</span></div>
            <div class="item-meta">Submitted ${formatDateTime(s.submittedAt)}</div>
          </div>
          <span class="${badgeClass(s.status)}">${s.status}</span>
        </div>
        ${s.content ? `<p class="text-muted" style="margin-bottom:8px;">${escapeHtml(s.content)}</p>` : ""}
        ${s.fileUrl ? `<p style="margin-bottom:8px;"><a href="${encodeURI(s.fileUrl)}" target="_blank" rel="noopener">${escapeHtml(s.fileUrl)}</a></p>` : ""}

        <form data-grade-form data-submission-id="${s.submissionId}" style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap;">
          <div class="form-group" style="margin-bottom:0; width:110px;">
            <label>Score (of ${maxPoints})</label>
            <input type="number" min="0" max="${maxPoints}" step="0.01" class="grade-score" value="${s.score ?? ""}" required />
          </div>
          <div class="form-group" style="margin-bottom:0; flex:1; min-width:180px;">
            <label>Feedback <span class="optional">(optional)</span></label>
            <input type="text" class="grade-feedback" value="${escapeHtml(s.feedback || "")}" />
          </div>
          <button type="submit" class="btn btn-primary btn-sm">Save Grade</button>
        </form>
      </div>`;
  }

  async function handleGrade(e) {
    e.preventDefault();
    hideAlert(alertBox);
    hideAlert(successBox);

    const form = e.target;
    const submissionId = form.dataset.submissionId;
    const score = Number(form.querySelector(".grade-score").value);
    const feedback = form.querySelector(".grade-feedback").value.trim();

    if (score < 0 || score > maxPoints) {
      showAlert(alertBox, `Score must be between 0 and ${maxPoints}.`);
      return;
    }

    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Saving...";

    try {
      await Submissions.grade(submissionId, score, feedback || null);
      showAlert(successBox, "Grade saved.", "success");
      await load();
    } catch (err) {
      showAlert(alertBox, err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Save Grade";
    }
  }
})();
