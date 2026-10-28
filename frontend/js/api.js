/* =========================================================
   Thin fetch wrapper + endpoint helpers for the Project 2 API.
   Every function here maps 1:1 to a real controller action -
   nothing here is invented; see README.md for the source list.
   ========================================================= */

async function apiRequest(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new Error(
      "Could not reach the server. Make sure the API is running and " +
      "that API_BASE_URL in js/config.js points to it (this is also " +
      "the error you'll see if CORS isn't enabled on the backend)."
    );
  }

  if (res.status === 204) return null;

  const raw = await res.text();
  let data = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw; // plain-text error bodies like BadRequest("...")
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    if (typeof data === "string" && data.trim()) {
      message = data;
    } else if (data && typeof data === "object") {
      if (data.errors) {
        message = Object.values(data.errors).flat().join(" ");
      } else if (data.title) {
        message = data.title;
      }
    }
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

const Auth = {
  login: (email, password) =>
    apiRequest("/auth/login", { method: "POST", body: { email, password } }),
  googleLogin: (idToken) =>
    apiRequest("/auth/google-login", { method: "POST", body: { idToken } }),
  // payload: { email, password, firstName, lastName, userId, role, course?, yearLevel?, section?, department? }
  register: (payload) =>
    apiRequest("/auth/register", { method: "POST", body: payload }),
};

const Students = {
  getById: (studentId) => apiRequest(`/student/${encodeURIComponent(studentId)}`),
  getDashboard: (studentId) => apiRequest(`/student/${encodeURIComponent(studentId)}/dashboard`),
  update: (studentId, payload) =>
    apiRequest(`/student/${encodeURIComponent(studentId)}`, { method: "PUT", body: payload }),
};

const Courses = {
  getAll: () => apiRequest("/courses"),
  getById: (courseId) => apiRequest(`/courses/${courseId}`),
  // payload: { courseCode, courseName, teacherId, teacherName, units, schedule }
  create: (payload) => apiRequest("/courses", { method: "POST", body: payload }),
};

const Enrollments = {
  getForStudent: (studentId) => apiRequest(`/enrollments/student/${encodeURIComponent(studentId)}`),
  enroll: (studentId, courseId) =>
    apiRequest("/enrollments", { method: "POST", body: { studentId, courseId } }),
  updateStatus: (enrollmentId, status) =>
    apiRequest(`/enrollments/${enrollmentId}/status`, { method: "PUT", body: status }),
};

const Materials = {
  getByCourse: (courseId) => apiRequest(`/materials/course/${courseId}`),
  // payload: { courseId, title, description?, type, url, uploadedBy? }
  create: (payload) => apiRequest("/materials", { method: "POST", body: payload }),
};

const Assignments = {
  getById: (assignmentId) => apiRequest(`/assignments/${assignmentId}`),
  getByCourse: (courseId) => apiRequest(`/assignments/course/${courseId}`),
  getUpcomingForStudent: (studentId) => apiRequest(`/assignments/upcoming/${encodeURIComponent(studentId)}`),
  // payload: { courseId, title, description?, dueDate?, maxPoints?, attachmentUrl?, createdBy? }
  create: (payload) => apiRequest("/assignments", { method: "POST", body: payload }),
};

const Submissions = {
  getByStudent: (studentId) => apiRequest(`/submissions/student/${encodeURIComponent(studentId)}`),
  create: (payload) => apiRequest("/submissions", { method: "POST", body: payload }),
  update: (submissionId, payload) =>
    apiRequest(`/submissions/${submissionId}`, { method: "PUT", body: payload }),
  grade: (submissionId, score, feedback) =>
    apiRequest(`/submissions/${submissionId}/grade`, { method: "PUT", body: { score, feedback } }),
};

const Grades = {
  getForStudent: (studentId) => apiRequest(`/grades/student/${encodeURIComponent(studentId)}`),
  getForCourse: (courseId, studentId) =>
    apiRequest(`/grades/course/${courseId}/student/${encodeURIComponent(studentId)}`),
};

const Teachers = {
  getById: (teacherId) => apiRequest(`/teacher/${encodeURIComponent(teacherId)}`),
  getDashboard: (teacherId) => apiRequest(`/teacher/${encodeURIComponent(teacherId)}/dashboard`),
  getCourses: (teacherId) => apiRequest(`/teacher/${encodeURIComponent(teacherId)}/courses`),
  getAllSubmissions: (teacherId) => apiRequest(`/teacher/${encodeURIComponent(teacherId)}/submissions`),
  getAssignmentSubmissions: (assignmentId) => apiRequest(`/teacher/assignments/${assignmentId}/submissions`),
  getGradebook: (courseId) => apiRequest(`/teacher/course/${courseId}/gradebook`),
  // payload: { title, description?, url? }
  postAnnouncement: (courseId, payload) =>
    apiRequest(`/teacher/course/${courseId}/announcement`, { method: "POST", body: payload }),
};
