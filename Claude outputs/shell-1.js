/* =========================================================
   Renders the shared header + sidebar into every protected page.
   Each page must call renderShell("dashboard") (etc.) after
   requireRole("student"|"teacher") succeeds, and must have these three empty
   elements in its <body>:
     <header id="app-header"></header>
     <aside id="app-sidebar"></aside>
     <div id="sidebar-backdrop"></div>
   ========================================================= */

const NAV_ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  courses: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  grades: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 14 0v1"/>',
};

const STUDENT_NAV_LINKS = [
  { key: "dashboard", href: "dashboard.html", icon: NAV_ICONS.dashboard, label: "Dashboard" },
  { key: "courses", href: "courses.html", icon: NAV_ICONS.courses, label: "My Courses" },
  { key: "grades", href: "grades.html", icon: NAV_ICONS.grades, label: "Grades" },
  { key: "profile", href: "profile.html", icon: NAV_ICONS.profile, label: "Profile" },
];

const TEACHER_NAV_LINKS = [
  { key: "dashboard", href: "teacher-dashboard.html", icon: NAV_ICONS.dashboard, label: "Dashboard" },
  { key: "courses", href: "teacher-courses.html", icon: NAV_ICONS.courses, label: "My Courses" },
  { key: "profile", href: "teacher-profile.html", icon: NAV_ICONS.profile, label: "Profile" },
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
      <button class="menu-toggle" id="menuToggle" aria-label="Toggle menu">&#9776;</button>
      <div class="brand">
        <img src="images/school-seal.png" alt="" class="brand-seal-sm">
        <span>Looc Integrated School</span>
      </div>
    `;
  }

  if (sidebar) {
    sidebar.className = "app-sidebar";
    sidebar.innerHTML = `
      <div class="sidebar-brand">
        <img src="images/school-seal.png" alt="Looc Integrated School seal" class="sidebar-seal">
        <div style="min-width:0;">
          <div class="sidebar-school-name">Looc Integrated<br>School</div>
          <div class="sidebar-portal-label">${isTeacher ? "Teacher Portal" : "Student Portal"}</div>
        </div>
      </div>
      <nav>
        ${navLinks.map((link) => {
          const isActive = link.key === activeKey;
          return `
          <a href="${link.href}" class="${isActive ? "active" : ""}">
            <span class="icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${isActive ? "var(--gold-bright, #d9651f)" : "currentColor"}" stroke-width="2" aria-hidden="true">${link.icon}</svg></span>
            ${link.label}
          </a>`;
        }).join("")}
      </nav>
      <div class="sidebar-user">
        <div class="sidebar-user-row">
          <div class="sidebar-avatar">${initials(user)}</div>
          <div style="min-width:0;">
            <div class="sidebar-user-name">${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</div>
            <div class="sidebar-user-role">${escapeHtml(
              isTeacher
                ? user.department || "Teacher"
                : [user.course, user.yearLevel, user.section].filter(Boolean).join(" · ") || "Student"
            )}</div>
          </div>
        </div>
        <button class="logout-link" id="logoutBtn" type="button">Log out</button>
      </div>
    `;
    document.getElementById("logoutBtn").addEventListener("click", logout);
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

function initials(user) {
  const a = (user.firstName || "").charAt(0);
  const b = (user.lastName || "").charAt(0);
  return (a + b).toUpperCase() || "U";
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