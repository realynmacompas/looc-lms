(function () {
  const student = requireRole("student");
  if (!student) return;
  renderShell("attendance");

  const alertBox = document.getElementById("alertBox");
  const successBox = document.getElementById("successBox");
  const loadingRow = document.getElementById("loadingRow");
  const actionCard = document.getElementById("actionCard");
  const content = document.getElementById("attendanceContent");

  let records = [];

  load();

  async function load() {
    try {
      records = await Students.getAttendance(student.userId);
    } catch (err) {
      if (err.status === 404) {
        records = [];
      } else {
        showAlert(alertBox, err.message);
        loadingRow.classList.add("hidden");
        return;
      }
    }

    renderActionCard();
    renderRows(records);

    loadingRow.classList.add("hidden");
    actionCard.classList.remove("hidden");
    content.classList.remove("hidden");
  }

  function todaysRecord() {
    return records.find((r) => isSameCalendarDate(r.date)) || null;
  }

  function renderActionCard() {
    const today = todaysRecord();

    if (!today) {
      actionCard.innerHTML = `
        <h2>Today</h2>
        <p class="field-hint">You haven't timed in today yet.</p>
        <button type="button" class="btn btn-primary" id="timeInBtn" style="width:auto;">Time In</button>
      `;
      document.getElementById("timeInBtn").addEventListener("click", handleTimeIn);
      return;
    }

    if (!today.timeOut) {
      actionCard.innerHTML = `
        <h2>Today</h2>
        <div class="list-item">
          <div class="item-meta">Timed in</div>
          <div class="item-title">${formatDateTime(today.timeIn)}</div>
        </div>
        <form id="timeOutForm">
          <div class="form-group">
            <label for="task">Task <span class="optional">(optional)</span></label>
            <input type="text" id="task" placeholder="What did you work on today?" />
          </div>
          <div class="form-group">
            <label for="journal">Journal <span class="optional">(optional)</span></label>
            <textarea id="journal" placeholder="Notes about today's session..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary" id="timeOutBtn" style="width:auto;">Time Out</button>
        </form>
      `;
      document.getElementById("timeOutForm").addEventListener("submit", handleTimeOut);
      return;
    }

    actionCard.innerHTML = `
      <h2>Today</h2>
      <div class="list-item">
        <div class="item-meta">Timed in</div>
        <div class="item-title">${formatDateTime(today.timeIn)}</div>
      </div>
      <div class="list-item">
        <div class="item-meta">Timed out</div>
        <div class="item-title">${formatDateTime(today.timeOut)}</div>
      </div>
      <p class="field-hint">You've completed today's attendance log.</p>
    `;
  }

  async function handleTimeIn() {
    hideAlert(alertBox);
    hideAlert(successBox);

    const btn = document.getElementById("timeInBtn");
    btn.disabled = true;
    btn.textContent = "Timing in...";

    try {
      await Attendance.create({
        date: todayDateOnly(),
        studentId: student.userId,
        fullName: `${student.firstName} ${student.lastName}`.trim(),
        timeIn: new Date().toISOString(),
      });
      showAlert(successBox, "Timed in successfully.", "success");
      await load();
    } catch (err) {
      showAlert(alertBox, err.message);
      btn.disabled = false;
      btn.textContent = "Time In";
    }
  }

  async function handleTimeOut(e) {
    e.preventDefault();
    hideAlert(alertBox);
    hideAlert(successBox);

    const today = todaysRecord();
    if (!today) return;

    const task = document.getElementById("task").value.trim();
    const journal = document.getElementById("journal").value.trim();

    const btn = document.getElementById("timeOutBtn");
    btn.disabled = true;
    btn.textContent = "Timing out...";

    try {
      // The backend's UpdateAttendance overwrites every field it's given,
      // so timeIn has to be sent back unchanged - otherwise it would be
      // reset to the request's default value.
      await Attendance.update(today.date, student.userId, {
        date: today.date,
        studentId: student.userId,
        fullName: `${student.firstName} ${student.lastName}`.trim(),
        timeIn: today.timeIn,
        timeOut: new Date().toISOString(),
        task: task || null,
        journal: journal || null,
      });
      showAlert(successBox, "Timed out successfully.", "success");
      await load();
    } catch (err) {
      showAlert(alertBox, err.message);
      btn.disabled = false;
      btn.textContent = "Time Out";
    }
  }

  function renderRows(records) {
    const tbody = document.getElementById("attendanceBody");
    if (!records || records.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No attendance records yet.</td></tr>`;
      return;
    }
    const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
    tbody.innerHTML = sorted
      .map(
        (a) => `
      <tr>
        <td>${formatDate(a.date)}</td>
        <td>${formatDateTime(a.timeIn)}</td>
        <td>${a.timeOut ? formatDateTime(a.timeOut) : "—"}</td>
        <td>${escapeHtml(a.task || "—")}</td>
        <td>${escapeHtml(a.journal || "—")}</td>
      </tr>`
      )
      .join("");
  }
})();
