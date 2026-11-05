(function () {
  const teacher = requireRole("teacher");
  if (!teacher) return;
  renderShell("calendar");

  const alertBox = document.getElementById("alertBox");
  const successBox = document.getElementById("successBox");
  const loadingRow = document.getElementById("loadingRow");
  const content = document.getElementById("calendarContent");
  const dowRow = document.getElementById("calDowRow");
  const grid = document.getElementById("calGrid");
  const monthLabel = document.getElementById("monthLabel");
  const agendaList = document.getElementById("agendaList");
  const eventListCard = document.getElementById("eventListCard");
  const eventListBody = document.getElementById("eventListBody");

  const today = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth(); // 0-indexed

  let events = [];

  document.getElementById("prevMonthBtn").addEventListener("click", () => {
    viewMonth--;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear--;
    }
    loadMonth();
  });

  document.getElementById("nextMonthBtn").addEventListener("click", () => {
    viewMonth++;
    if (viewMonth > 11) {
      viewMonth = 0;
      viewYear++;
    }
    loadMonth();
  });

  document.getElementById("eventForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(alertBox);
    hideAlert(successBox);

    const title = document.getElementById("eventTitle").value.trim();
    const dateRaw = document.getElementById("eventDate").value;
    const eventType = document.getElementById("eventType").value;
    const description = document.getElementById("eventDescription").value.trim();

    if (!title || !dateRaw) {
      showAlert(alertBox, "Title and date are required.");
      return;
    }

    const btn = document.getElementById("eventBtn");
    btn.disabled = true;
    btn.textContent = "Adding...";

    try {
      await Events.create({
        title,
        description: description || null,
        eventDate: new Date(`${dateRaw}T00:00:00`).toISOString(),
        eventType,
        createdBy: teacher.userId,
      });
      showAlert(successBox, "Event added.", "success");
      document.getElementById("eventForm").reset();
      await loadMonth();
    } catch (err) {
      showAlert(alertBox, err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Add Event";
    }
  });

  renderCalendarDowRow(dowRow);
  init();

  async function init() {
    try {
      await loadMonth();
      loadingRow.classList.add("hidden");
      content.classList.remove("hidden");
    } catch (err) {
      loadingRow.classList.add("hidden");
      showAlert(alertBox, err.message);
    }
  }

  async function loadMonth() {
    events = (await Events.getAll({ month: viewMonth + 1, year: viewYear })) || [];
    renderMonth();
    renderAgenda();
    renderEventList();
  }

  function renderMonth() {
    monthLabel.textContent = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-PH", {
      month: "long",
      year: "numeric",
    });

    const itemsByDay = new Map();
    events.forEach((ev) => {
      const d = new Date(ev.eventDate);
      const key = calKeyFor(viewYear, viewMonth, d.getDate());
      const type = ev.eventType === "exam" || ev.eventType === "holiday" ? ev.eventType : "school";
      if (!itemsByDay.has(key)) itemsByDay.set(key, []);
      itemsByDay.get(key).push({ type, label: ev.title });
    });

    renderCalendarGrid(grid, viewYear, viewMonth, itemsByDay);
  }

  function renderAgenda() {
    const items = events
      .map((ev) => ({ date: new Date(ev.eventDate), label: ev.title, meta: eventTypeLabel(ev.eventType) }))
      .sort((a, b) => a.date - b.date);
    renderAgendaList(agendaList, items, "No events this month.");
  }

  function renderEventList() {
    if (!events || events.length === 0) {
      eventListCard.classList.add("hidden");
      return;
    }
    eventListCard.classList.remove("hidden");

    const sorted = [...events].sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
    eventListBody.innerHTML = sorted
      .map(
        (ev) => `
      <tr>
        <td>${new Date(ev.eventDate).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}</td>
        <td>${escapeHtml(ev.title)}</td>
        <td>${eventTypeLabel(ev.eventType)}</td>
        <td><button type="button" class="btn btn-secondary btn-sm" data-delete-id="${ev.eventId}">Delete</button></td>
      </tr>`
      )
      .join("");

    eventListBody.querySelectorAll("[data-delete-id]").forEach((btn) => {
      btn.addEventListener("click", () => deleteEvent(Number(btn.dataset.deleteId)));
    });
  }

  async function deleteEvent(eventId) {
    hideAlert(alertBox);
    hideAlert(successBox);
    try {
      await Events.delete(eventId);
      showAlert(successBox, "Event removed.", "success");
      await loadMonth();
    } catch (err) {
      showAlert(alertBox, err.message);
    }
  }

  function eventTypeLabel(type) {
    if (type === "exam") return "Exam";
    if (type === "holiday") return "Holiday";
    return "School event";
  }
})();
