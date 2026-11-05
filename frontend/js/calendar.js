(function () {
  const student = requireRole("student");
  if (!student) return;
  renderShell("calendar");

  const alertBox = document.getElementById("alertBox");
  const loadingRow = document.getElementById("loadingRow");
  const content = document.getElementById("calendarContent");
  const dowRow = document.getElementById("calDowRow");
  const grid = document.getElementById("calGrid");
  const monthLabel = document.getElementById("monthLabel");
  const agendaList = document.getElementById("agendaList");

  const today = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth(); // 0-indexed

  let events = [];
  let deadlines = [];

  document.getElementById("prevMonthBtn").addEventListener("click", () => {
    viewMonth--;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear--;
    }
    renderMonth();
  });

  document.getElementById("nextMonthBtn").addEventListener("click", () => {
    viewMonth++;
    if (viewMonth > 11) {
      viewMonth = 0;
      viewYear++;
    }
    renderMonth();
  });

  renderCalendarDowRow(dowRow);
  init();

  async function init() {
    try {
      const [eventsRes, assignmentsRes] = await Promise.all([
        Events.getAll(),
        Assignments.getUpcomingForStudent(student.userId),
      ]);
      events = eventsRes || [];
      deadlines = assignmentsRes || [];

      renderMonth();
      renderAgenda();

      loadingRow.classList.add("hidden");
      content.classList.remove("hidden");
    } catch (err) {
      loadingRow.classList.add("hidden");
      showAlert(alertBox, err.message);
    }
  }

  function renderMonth() {
    monthLabel.textContent = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-PH", {
      month: "long",
      year: "numeric",
    });

    const itemsByDay = new Map();

    events.forEach((ev) => {
      const d = new Date(ev.eventDate);
      if (d.getFullYear() !== viewYear || d.getMonth() !== viewMonth) return;
      const key = calKeyFor(viewYear, viewMonth, d.getDate());
      const type = ev.eventType === "exam" || ev.eventType === "holiday" ? ev.eventType : "school";
      pushItem(itemsByDay, key, { type, label: ev.title });
    });

    deadlines.forEach((a) => {
      const d = new Date(a.dueDate);
      if (d.getFullYear() !== viewYear || d.getMonth() !== viewMonth) return;
      const key = calKeyFor(viewYear, viewMonth, d.getDate());
      pushItem(itemsByDay, key, { type: "due", label: a.title });
    });

    renderCalendarGrid(grid, viewYear, viewMonth, itemsByDay);
  }

  function pushItem(map, key, item) {
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }

  function renderAgenda() {
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const eventItems = events
      .map((ev) => ({ date: new Date(ev.eventDate), label: ev.title, meta: eventTypeLabel(ev.eventType) }))
      .filter((item) => item.date >= startOfToday);

    const deadlineItems = deadlines
      .map((a) => ({
        date: new Date(a.dueDate),
        label: a.title,
        meta: a.course ? `Due · ${a.course.courseCode}` : "Due",
      }))
      .filter((item) => item.date >= startOfToday);

    const merged = eventItems
      .concat(deadlineItems)
      .sort((a, b) => a.date - b.date)
      .slice(0, 8);

    renderAgendaList(agendaList, merged, "Nothing coming up.");
  }

  function eventTypeLabel(type) {
    if (type === "exam") return "Exam";
    if (type === "holiday") return "Holiday";
    return "School event";
  }
})();
