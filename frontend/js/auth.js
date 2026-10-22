/* =========================================================
   Client-side "session" handling.

   IMPORTANT / please read:
   The backend's /api/auth/login endpoint checks the password and
   returns the user's profile (now for either a student or a
   teacher), but it does NOT issue a token (no JWT, no cookie/
   session). So what we store here after login is just the last
   profile the server gave us - it lets the front end remember who
   is "logged in" on this browser and which ID/role to use on API
   calls.

   It is NOT a secure session: anyone who opens the browser console
   could set this value by hand and act as that user, and most API
   endpoints on the backend currently accept requests from anyone
   regardless of this value. Fine for a school project demo, but if
   this ever needs to be genuinely secure, the backend needs real
   authentication (e.g. a JWT issued at login and checked with
   [Authorize] on every request) before login means anything from a
   security standpoint.
   ========================================================= */

const SESSION_KEY = "lms_current_user";

function setCurrentUser(profile) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
}

function getCurrentUser() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearCurrentUser() {
  localStorage.removeItem(SESSION_KEY);
}

function homePageFor(role) {
  return role === "teacher" ? "teacher-dashboard.html" : "dashboard.html";
}

/**
 * Call at the top of every protected page, passing "student" or "teacher".
 * - Not logged in at all -> sends to the sign-in page.
 * - Logged in as the other role -> sends to that role's own home page,
 *   rather than showing a broken page built for the wrong role.
 */
function requireRole(role) {
  const user = getCurrentUser();
  if (!user || !user.userId) {
    window.location.href = "index.html";
    return null;
  }
  if (user.role !== role) {
    window.location.href = homePageFor(user.role);
    return null;
  }
  return user;
}

function logout() {
  clearCurrentUser();
  window.location.href = "index.html";
}
