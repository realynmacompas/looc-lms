# Looc Integrated School - Portal (Front End)

Plain HTML/CSS/JavaScript front end for the `Project 2` ASP.NET Core Web API. No build step, no
framework - open/serve the files as-is. Now covers **both** a student portal and a teacher portal,
matching your backend's unified `role`-based auth and the new `TeacherController`.

## What's included

**Shared:** `index.html` (sign in) and `register.html` (register as student or teacher) both post
to the unified `POST /api/auth/login` / `POST /api/auth/register`, then route you to the right
portal based on the `role` the server returns.

**Student portal** (unchanged in function from before, just updated to the new auth shape):

| Page | File | Backend endpoints used |
|---|---|---|
| Dashboard | `dashboard.html` | `GET /api/student/{id}/dashboard` |
| My Courses (view/enroll/drop) | `courses.html` | `GET /api/enrollments/student/{id}`, `GET /api/courses`, `POST /api/enrollments`, `PUT /api/enrollments/{id}/status` |
| Course detail | `course-detail.html` | `GET /api/courses/{id}`, `GET /api/materials/course/{id}`, `GET /api/grades/course/{courseId}/student/{studentId}` |
| Assignment (view/submit/update) | `assignment.html` | `GET /api/assignments/{id}`, `GET /api/submissions/student/{id}`, `POST /api/submissions`, `PUT /api/submissions/{id}` |
| Grades overview | `grades.html` | `GET /api/grades/student/{id}` |
| Attendance / DTR log (student logs their own time in/out) | `attendance.html` | `GET /api/student/{id}/attendance`, `POST /api/attendance`, `PUT /api/attendance/{date}/{studentId}` |
| Profile (edit info + password) | `profile.html` | `GET /api/student/{id}`, `PUT /api/student/{id}` |

**Teacher portal** (new):

| Page | File | Backend endpoints used |
|---|---|---|
| Dashboard | `teacher-dashboard.html` | `GET /api/teacher/{id}/dashboard` |
| My Courses (view + create) | `teacher-courses.html` | `GET /api/teacher/{id}/courses`, `POST /api/courses` |
| Course detail (materials, announcements, assignments) | `teacher-course-detail.html` | `GET /api/courses/{id}`, `GET /api/materials/course/{id}`, `POST /api/materials`, `POST /api/teacher/course/{id}/announcement`, `GET /api/assignments/course/{id}`, `POST /api/assignments` |
| Submissions / grading | `teacher-assignment.html` | `GET /api/teacher/assignments/{id}/submissions`, `PUT /api/submissions/{id}/grade` |
| Gradebook (+ link to a student's attendance) | `teacher-gradebook.html` | `GET /api/teacher/course/{id}/gradebook` |
| My Attendance (teacher logs their own time in/out) | `teacher-attendance.html` | `GET /api/teacherattendance/teacher/{id}`, `POST /api/teacherattendance`, `PUT /api/teacherattendance/{date}/{teacherId}` |
| A student's attendance (read-only, view only, no edit) | `teacher-student-attendance.html` | `GET /api/student/{id}` (header info), `GET /api/student/{id}/attendance` |
| Profile (read-only) | `teacher-profile.html` | `GET /api/teacher/{id}` |

Every fetch call lives in `js/api.js` and maps 1:1 to a controller action. The attendance rows
above are the exception - they map to controller actions that **do not exist in your backend
yet**. See "Backend changes this update depends on" below before testing attendance in the
browser; everything else maps to actions that already exist today.

## 1. Point it at your API

Edit `js/config.js` and set `API_BASE_URL` to wherever `dotnet run` is listening (check
`Properties/launchSettings.json`, or the console output when you run it).

## 2. CORS

Your `Program.cs` already has a `FrontendPolicy` with `app.UseCors(...)` wired up correctly. It
currently whitelists `http://127.0.0.1:5502` and `http://localhost:5700` - if Live Server later
serves from a different port, add that origin to the list too (and restart `dotnet run`, since
`Program.cs` changes need a restart, unlike the front-end files). When you eventually deploy this
front end somewhere real (e.g. Vercel), add that URL to the list as well.

## 3. Run it

Serve the folder rather than double-clicking the HTML files (VS Code's Live Server extension, or
`npx serve .`), so requests come from a real `http://` origin that CORS can match.

## What changed in this update

Your backend update added real teacher accounts and a `TeacherController`. That changed the shared
auth contract, so the front end's session handling and every page that used it were updated:

- `AuthResponse` now returns `role` ("student" or "teacher") and a generic `userId` instead of
  `studentId`. `js/auth.js` stores this as-is; every page reads `user.userId`, not
  `user.studentId`.
- `RegisterRequest` now needs `role` and `userId` (instead of `studentId`) plus the optional
  `department` field for teachers. `register.html` has a Student/Teacher toggle that swaps the
  visible fields and sends the right shape.
- `js/auth.js`'s `requireRole("student")` / `requireRole("teacher")` replaces the old
  `requireAuth()` - it sends you to the sign-in page if you're not logged in at all, or to your
  *own* role's dashboard if you're logged in as the other role (so a teacher account can't land on
  a page built for students, and vice versa).
- The sidebar/header (`js/shell.js`) now renders a different nav menu depending on `role`.

## Backend changes this update depends on

Attendance self-service (students logging their own time in/out, teachers having their own
separate daily log) needed backend changes I can't make for you - `Data/AceDbContext.cs` and the
`Controllers/` folder are C# you're actively working in, so these are described here rather than
edited directly. The front end (`attendance.html`, `teacher-attendance.html`,
`teacher-student-attendance.html`, and the `Attendance`/`TeacherAttendance` objects in `js/api.js`)
already assumes these exist - it will fail with 404s/500s until they're added. I gave you the exact
code for each of these in chat; short version of what's needed:

1. **Fix the `Attendance` table's primary key.** `AceDbContext.cs` currently has
   `entity.HasKey(e => e.StudentId)` for `Attendance` - meaning only *one row per student can ever
   exist*, despite the app's per-day design. Needs to become a composite key of `StudentId` + `Date`,
   plus a new EF Core migration.
2. **Add a duplicate-check to `AttendanceController.CreateAttendance`.** Once the key above is
   composite, POSTing a second record for a student on a date that's already logged will throw a raw
   500 from MySQL's duplicate-key constraint instead of a clean 400 - worth guarding against.
3. **Add a new `TeacherAttendance` table/model/controller**, mirroring `Attendance` but keyed to
   `Teacher` instead of `Student` (composite key of `TeacherId` + `Date`), plus a
   `TeacherAttendanceController` with the same CRUD shape as `AttendanceController`, plus a
   convenience `GET /api/teacherattendance/teacher/{id}` action (mirroring
   `StudentController.GetStudentAttendance`).
4. **Add an `Attendances` navigation property to `Model/Teacher.cs`**, mirroring `Student.cs`.

## Known limitations - please read before presenting this as "production ready"

**1. Still no real session/authentication**, for either role. Login checks the password but issues
no token - this front end's "logged in" state is just a `localStorage` convenience (see the
comment in `js/auth.js`), not real security. Every write endpoint (create a course, grade a
submission, post an announcement, etc.) currently accepts requests from anyone who can reach the
API, not just the account it should belong to. Fine for a school project prototype; needs real
`[Authorize]`-based auth (e.g. JWT issued at login) before it's safe to treat as production.

**2. Teacher profile editing isn't available.** Unlike students, there's no `PUT /api/teacher/{id}`
endpoint in your backend, so `teacher-profile.html` is read-only. Add that endpoint (mirroring
`StudentController.UpdateStudent`) if teachers should be able to edit their own info.

**3. Course-to-teacher linking is by plain text, not a real relationship.** `Course.TeacherId` /
`TeacherName` are free strings, not a foreign key into the `teachers` table - nothing stops two
different values from drifting apart, or a course being "owned" by a teacher ID that doesn't
exist. This is fine for now, but worth knowing.

**4. Small thing worth a look in `AceDbContext.cs`:** the `modelBuilder.Entity<Teacher>(...)`
block is nested *inside* the `modelBuilder.Entity<Submission>(...)` lambda rather than being its
own top-level call in `OnModelCreating`. It still works (EF Core doesn't care where in the method
body the call happens), but it reads confusingly and will bite you if you ever refactor that
section. Worth moving it out to sit alongside your other `modelBuilder.Entity<...>()` blocks as its
own sibling call.

**5. Your `appsettings.json` has a live database password in plain text**, shared with me directly
in this chat - I'd still treat that connection string as compromised if you haven't rotated it yet
(see my earlier message).

**6. File uploads.** Materials and submissions still store a URL string, not an uploaded file -
paste a link (e.g. Google Drive) rather than uploading directly.

**7. A teacher can view any student's attendance by editing the URL.** `teacher-student-attendance.html?studentId=...`
doesn't check that the student is actually enrolled in one of that teacher's courses - it's a
read-only view (no edit is possible from this page), but it's the same "no real auth" limitation as
#1, just called out here because it's new in this update.

## Folder structure

```
frontend/
  index.html, register.html                    shared auth
  dashboard.html, courses.html, course-detail.html,
  assignment.html, grades.html, attendance.html,
  profile.html                                  student portal
  teacher-dashboard.html, teacher-courses.html,
  teacher-course-detail.html, teacher-assignment.html,
  teacher-gradebook.html, teacher-profile.html,
  teacher-attendance.html,
  teacher-student-attendance.html               teacher portal
  css/style.css
  js/
    config.js       <- set your API URL here
    api.js           fetch wrapper + one function per endpoint
    auth.js          localStorage "session" helpers (role-aware)
    shell.js          shared header/sidebar (nav differs by role) + UI helpers,
                       plus todayDateOnly()/isSameCalendarDate() date helpers
    login.js, register.js                       shared auth pages
    dashboard.js, courses.js, course-detail.js, assignment.js,
    grades.js, attendance.js, profile.js         student pages
    teacher-dashboard.js, teacher-courses.js, teacher-course-detail.js,
    teacher-assignment.js, teacher-gradebook.js, teacher-profile.js,
    teacher-attendance.js,
    teacher-student-attendance.js                teacher pages
```
