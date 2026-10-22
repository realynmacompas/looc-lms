(function () {
  const student = requireRole("student");
  if (!student) return;
  renderShell("courses");

  const params = new URLSearchParams(window.location.search);
  const assignmentId = params.get("id");

  const alertBox = document.getElementById("alertBox");
  const successBox = document.getElementById("successBox");
  const loadingRow = document.getElementById("loadingRow");
  const content = document.getElementById("assignmentContent");

  let assignment = null;
  let existingSubmission = null;

  if (!assignmentId) {
    showAlert(alertBox, "No assignment specified.");
    loadingRow.classList.add("hidden");
    return;
  }

  load();

  async function load() {
    try {
      assignment = await Assignments.getById(assignmentId);
      const mySubmissions = await Submissions.getByStudent(student.userId);
      existingSubmission = mySubmissions.find((s) => s.assignmentId === Number(assignmentId)) || null;

      renderAssignment();
      renderSubmissionArea();

      loadingRow.classList.add("hidden");
      content.classList.remove("hidden");
    } catch (err) {
      loadingRow.classList.add("hidden");
      showAlert(alertBox, err.message);
    }
  }

  function renderAssignment() {
    document.getElementById("breadcrumbCourse").href = `course-detail.html?id=${assignment.courseId}`;
    document.getElementById("breadcrumbCourse").textContent = "Course";
    document.getElementById("assignmentTitle").textContent = assignment.title;
    document.getElementById("assignmentDescription").textContent = assignment.description || "No description provided.";

    const overdue = !existingSubmission && assignment.dueDate && new Date(assignment.dueDate) < new Date();
    document.getElementById("assignmentMeta").textContent =
      `Due ${formatDateTime(assignment.dueDate)} · ${assignment.maxPoints} points`;

    const badgeWrap = document.getElementById("statusBadgeWrap");
    if (existingSubmission) {
      badgeWrap.innerHTML = `<span class="${badgeClass(existingSubmission.status)}">${existingSubmission.status}</span>`;
    } else if (overdue) {
      badgeWrap.innerHTML = `<span class="badge badge-overdue">overdue</span>`;
    } else {
      badgeWrap.innerHTML = `<span class="badge badge-pending">not submitted</span>`;
    }

    const attachmentWrap = document.getElementById("attachmentWrap");
    if (assignment.attachmentUrl) {
      attachmentWrap.innerHTML = `<a href="${encodeURI(assignment.attachmentUrl)}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">View Assignment Attachment</a>`;
    }
  }

  function renderSubmissionArea() {
    const resultCard = document.getElementById("submissionResultCard");
    const resultBox = document.getElementById("submissionResult");
    const formCard = document.getElementById("submissionFormCard");
    const contentField = document.getElementById("content");
    const fileUrlField = document.getElementById("fileUrl");
    const formTitle = document.getElementById("submissionFormTitle");
    const hint = document.getElementById("submissionHint");

    if (existingSubmission) {
      resultCard.style.display = "block";
      resultBox.innerHTML = `
        <div class="list-item">
          <div class="item-meta">Submitted</div>
          <div class="item-title">${formatDateTime(existingSubmission.submittedAt)}</div>
        </div>
        ${existingSubmission.content ? `<div class="list-item"><div class="item-meta">Answer / Notes</div><div>${escapeHtml(existingSubmission.content)}</div></div>` : ""}
        ${existingSubmission.fileUrl ? `<div class="list-item"><div class="item-meta">Link</div><div><a href="${encodeURI(existingSubmission.fileUrl)}" target="_blank" rel="noopener">${escapeHtml(existingSubmission.fileUrl)}</a></div></div>` : ""}
        ${
          existingSubmission.status === "graded"
            ? `
        <div class="list-item">
          <div class="item-meta">Score</div>
          <div class="item-title">${existingSubmission.score} / ${assignment.maxPoints}</div>
        </div>
        ${existingSubmission.feedback ? `<div class="list-item"><div class="item-meta">Teacher feedback</div><div>${escapeHtml(existingSubmission.feedback)}</div></div>` : ""}
        `
            : ""
        }
      `;

      contentField.value = existingSubmission.content || "";
      fileUrlField.value = existingSubmission.fileUrl || "";

      if (existingSubmission.status === "graded") {
        formCard.style.display = "none";
        return;
      }
      formTitle.textContent = "Update Your Submission";
      hint.textContent = "You can update your submission until it's graded.";
    } else {
      resultCard.style.display = "none";
      formTitle.textContent = "Submit Your Work";
      hint.textContent = "";
    }

    document.getElementById("submissionForm").addEventListener("submit", handleSubmit);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    hideAlert(alertBox);
    hideAlert(successBox);

    const content = document.getElementById("content").value.trim();
    const fileUrl = document.getElementById("fileUrl").value.trim();

    if (!content && !fileUrl) {
      showAlert(alertBox, "Please add an answer/notes or a link to your work before submitting.");
      return;
    }

    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = existingSubmission ? "Updating..." : "Submitting...";

    try {
      if (existingSubmission) {
        await Submissions.update(existingSubmission.submissionId, {
          submissionId: existingSubmission.submissionId,
          assignmentId: Number(assignmentId),
          studentId: student.userId,
          content: content || null,
          fileUrl: fileUrl || null,
        });
        showAlert(successBox, "Submission updated.", "success");
      } else {
        await Submissions.create({
          assignmentId: Number(assignmentId),
          studentId: student.userId,
          content: content || null,
          fileUrl: fileUrl || null,
        });
        showAlert(successBox, "Submitted successfully.", "success");
      }
      await load();
    } catch (err) {
      showAlert(alertBox, err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = existingSubmission ? "Update Submission" : "Submit";
    }
  }
})();
