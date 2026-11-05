/* =========================================================
   Shared month-grid builder used by calendar.html (student) and
   teacher-calendar.html. Both pages merge real Events (school-wide,
   from the API) with real assignment due dates; this file just turns
   a day -> items map into grid/agenda HTML so that logic isn't
   duplicated between the two pages.
   ========================================================= */

const CAL_DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function calKeyFor(year, month, day) {
  // month is 0-indexed (JS Date convention), to match everything else here
  return `${year}-${month}-${day}`;
}

function renderCalendarDowRow(el) {
  el.innerHTML = CAL_DOW_LABELS.map((d) => `<div class="cal-dow">${d}</div>`).join("");
}

/**
 * itemsByDay: Map<"year-month-day", Array<{ type: "exam"|"due"|"holiday"|"school", label }>>
 * year/month describe the month being displayed (month is 0-indexed).
 */
function renderCalendarGrid(el, year, month, itemsByDay) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const isToday = (y, m, d) =>
    y === today.getFullYear() && m === today.getMonth() && d === today.getDate();

  const cells = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, muted: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, muted: false, today: isToday(year, month, d), key: calKeyFor(year, month, d) });
  }
  const trailing = (7 - (cells.length % 7)) % 7;
  for (let d = 1; d <= trailing; d++) {
    cells.push({ day: d, muted: true });
  }

  el.innerHTML = cells
    .map((cell) => {
      const classes = ["cal-cell"];
      if (cell.muted) classes.push("muted");
      if (cell.today) classes.push("today");

      let dots = "";
      if (!cell.muted) {
        const items = itemsByDay.get(cell.key) || [];
        dots = items
          .slice(0, 2)
          .map((item) => `<span class="cal-dot dot-${item.type}">${escapeHtml(item.label)}</span>`)
          .join("");
        if (items.length > 2) {
          dots += `<span class="cal-dot dot-more">+${items.length - 2} more</span>`;
        }
      }

      return `<div class="${classes.join(" ")}"><div class="cal-daynum">${cell.day}</div>${dots}</div>`;
    })
    .join("");
}

/**
 * items: Array<{ date: Date, type, label, meta }>, already filtered/sorted
 * by the caller to whatever should show in the agenda.
 */
function renderAgendaList(el, items, emptyMessage) {
  if (!items || items.length === 0) {
    el.innerHTML = `<li class="empty-state" style="border-bottom: none;">${escapeHtml(emptyMessage || "Nothing scheduled.")}</li>`;
    return;
  }
  el.innerHTML = items
    .map(
      (item) => `
    <li>
      <div class="agenda-date">
        <div class="d">${item.date.getDate()}</div>
        <div class="m">${item.date.toLocaleDateString("en-PH", { month: "short" })}</div>
      </div>
      <div style="flex: 1; min-width: 0;">
        <div class="agenda-title">${escapeHtml(item.label)}</div>
        ${item.meta ? `<div class="agenda-meta">${escapeHtml(item.meta)}</div>` : ""}
      </div>
    </li>`
    )
    .join("");
}
