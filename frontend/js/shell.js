/* =========================================================
   Renders the shared header + sidebar into every protected page.
   Each page must call renderShell("dashboard") (etc.) after
   requireRole("student"|"teacher") succeeds, and must have these three empty
   elements in its <body>:
     <header id="app-header"></header>
     <aside id="app-sidebar"></aside>
     <div id="sidebar-backdrop"></div>
   ========================================================= */

const STUDENT_NAV_LINKS = [
  { key: "dashboard", href: "dashboard.html", icon: "&#8962;", label: "Dashboard" },
  { key: "courses", href: "courses.html", icon: "&#128218;", label: "My Courses" },
  { key: "grades", href: "grades.html", icon: "&#128202;", label: "Grades" },
  { key: "attendance", href: "attendance.html", icon: "&#128197;", label: "Attendance" },
  { key: "profile", href: "profile.html", icon: "&#128100;", label: "Profile" },
];

const TEACHER_NAV_LINKS = [
  { key: "dashboard", href: "teacher-dashboard.html", icon: "&#8962;", label: "Dashboard" },
  { key: "courses", href: "teacher-courses.html", icon: "&#128218;", label: "My Courses" },
  { key: "attendance", href: "teacher-attendance.html", icon: "&#128197;", label: "My Attendance" },
  { key: "profile", href: "teacher-profile.html", icon: "&#128100;", label: "Profile" },
];

function renderShell(activeKey) {
  const user = getCurrentUser();
  if (!user) return;

  const isTeacher = user.role === "teacher";
  const navLinks = isTeacher ? TEACHER_NAV_LINKS : STUDENT_NAV_LINKS;

  const header = document.getElementById("app-header");
  const sidebar = document.getElementById("app-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");

  if (header) {
    header.className = "app-header";
    header.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <button class="menu-toggle" id="menuToggle" aria-label="Toggle menu">&#9776;</button>
        <div class="brand">
          <span class="badge">LIS</span>
          <span>
            Looc Integrated School
            <small>${isTeacher ? "Teacher Portal" : "Student Portal"}</small>
          </span>
        </div>
      </div>
      <div class="header-user">
        <span class="user-name">${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</span>
        <button class="logout-link" id="logoutBtn" type="button">Log out</button>
      </div>
    `;
    document.getElementById("logoutBtn").addEventListener("click", logout);
  }

  if (sidebar) {
    sidebar.className = "app-sidebar";
    sidebar.innerHTML = `
      <nav>
        ${navLinks.map(
          (link) => `
          <a href="${link.href}" class="${link.key === activeKey ? "active" : ""}">
            <span class="icon">${link.icon}</span> ${link.label}
          </a>`
        ).join("")}
      </nav>
    `;
  }

  if (backdrop) {
    backdrop.className = "sidebar-backdrop";
    backdrop.addEventListener("click", closeMobileMenu);
  }

  const toggleBtn = document.getElementById("menuToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      backdrop.classList.toggle("open");
    });
  }
}

function closeMobileMenu() {
  const sidebar = document.getElementById("app-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (sidebar) sidebar.classList.remove("open");
  if (backdrop) backdrop.classList.remove("open");
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showAlert(el, message, type = "error") {
  if (!el) return;
  el.textContent = message;
  el.className = `alert alert-${type} show`;
}

function hideAlert(el) {
  if (!el) return;
  el.className = "alert";
  el.textContent = "";
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d)) return "-";
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d)) return "-";
  return d.toLocaleString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function badgeClass(status) {
  const key = String(status || "").toLowerCase().replace(/\s+/g, "_");
  return `badge badge-${key}`;
}

/* -----------------------------------------------------------
   Date helpers for attendance self-service (time in / time out).

   The backend's Attendance/TeacherAttendance tables use a composite
   primary key of (Id, Date) where Date is meant to be a calendar day,
   not a timestamp. If we sent a full ISO string with a timezone
   offset (e.g. via `new Date().toISOString()`), the server would
   parse it as UTC and could roll it back to the *previous* day for
   anyone west of UTC - so "today's" record could silently fail to
   match. todayDateOnly() instead builds a plain "YYYY-MM-DDT00:00:00"
   string with no timezone marker, using the browser's local date, so
   it always lands on the day the user actually sees on their clock.
   ----------------------------------------------------------- */
function todayDateOnly() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}T00:00:00`;
}

/* -----------------------------------------------------------
   Lightweight modal, used by course-detail.js so materials,
   announcements, and assignment details open in-place instead of
   navigating to a new page. The overlay element is created once on
   first use and reused after that.
   ----------------------------------------------------------- */
function openModal(title, bodyHtml) {
  let overlay = document.getElementById("appModalOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "appModalOverlay";
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-panel">
        <div class="modal-header">
          <h2 id="appModalTitle"></h2>
          <button type="button" class="modal-close" id="appModalClose" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body" id="appModalBody"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
    document.getElementById("appModalClose").addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }
  document.getElementById("appModalTitle").textContent = title;
  document.getElementById("appModalBody").innerHTML = bodyHtml;
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const overlay = document.getElementById("appModalOverlay");
  if (!overlay) return;
  overlay.classList.remove("open");
  document.body.style.overflow = "";
}

function isSameCalendarDate(isoValue, referenceDate = new Date()) {
  if (!isoValue) return false;
  const d = new Date(isoValue);
  if (isNaN(d)) return false;
  return (
    d.getFullYear() === referenceDate.getFullYear() &&
    d.getMonth() === referenceDate.getMonth() &&
    d.getDate() === referenceDate.getDate()
  );
}
