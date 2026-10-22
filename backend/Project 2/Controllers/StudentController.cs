using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project_2.Data;
using Project_2.Model;

namespace Project_2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StudentController : ControllerBase
    {
        private readonly AceDbContext _context;

        public StudentController(AceDbContext context)
        {
            _context = context;
        }

        // ============ GET ALL STUDENTS ============
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetStudents()
        {
            var students = await _context.Students
                .Include(s => s.Attendances)
                .Select(s => new
                {
                    s.StudentId,
                    s.Email,
                    s.FirstName,
                    s.LastName,
                    s.Course,
                    s.YearLevel,
                    s.Section,
                    s.IsActive,
                    s.CreatedAt
                    // PasswordHash deliberately excluded
                })
                .ToListAsync();

            return Ok(students);
        }

        // ============ GET ONE STUDENT ============
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetStudent(string id)
        {
            var student = await _context.Students
                .Include(s => s.Attendances)
                .Where(s => s.StudentId == id)
                .Select(s => new
                {
                    s.StudentId,
                    s.Email,
                    s.FirstName,
                    s.LastName,
                    s.Course,
                    s.YearLevel,
                    s.Section,
                    s.IsActive,
                    s.CreatedAt,
                    Attendances = s.Attendances
                })
                .FirstOrDefaultAsync();

            if (student == null)
                return NotFound();

            return Ok(student);
        }

        // ============ CREATE STUDENT ============
        [HttpPost]
        public async Task<ActionResult<Student>> CreateStudent(Student student)
        {
            var existingEmail = await _context.Students
                .AnyAsync(s => s.Email == student.Email);

            if (existingEmail)
                return BadRequest("Email already exists.");

            // Hash the password before saving
            student.PasswordHash = BCrypt.Net.BCrypt.HashPassword(student.PasswordHash);
            student.CreatedAt = DateTime.UtcNow;

            _context.Students.Add(student);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetStudent),
                new { id = student.StudentId }, student);
        }

        // ============ UPDATE STUDENT ============
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStudent(string id, Student student)
        {
            if (id != student.StudentId)
                return BadRequest("ID mismatch");

            var existing = await _context.Students.FindAsync(id);
            if (existing == null)
                return NotFound();

            var existingEmail = await _context.Students
                .AnyAsync(s => s.Email == student.Email && s.StudentId != id);

            if (existingEmail)
                return BadRequest("Email already exists.");

            existing.Email = student.Email;
            existing.FirstName = student.FirstName;
            existing.LastName = student.LastName;
            existing.Course = student.Course;
            existing.YearLevel = student.YearLevel;
            existing.Section = student.Section;
            existing.IsActive = student.IsActive;

            // Only update password if a new one was provided
            if (!string.IsNullOrWhiteSpace(student.PasswordHash))
            {
                existing.PasswordHash = BCrypt.Net.BCrypt.HashPassword(student.PasswordHash);
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ============ DELETE STUDENT ============
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStudent(string id)
        {
            var student = await _context.Students.FindAsync(id);
            if (student == null)
                return NotFound();

            _context.Students.Remove(student);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ============ GET STUDENT'S ATTENDANCE ============
        [HttpGet("{id}/attendance")]
        public async Task<ActionResult<IEnumerable<Attendance>>> GetStudentAttendance(string id)
        {
            var attendances = await _context.Attendance
                .Where(a => a.StudentId == id)
                .OrderByDescending(a => a.Date)
                .ToListAsync();

            if (!attendances.Any())
                return NotFound("No attendance records found for this student");

            return Ok(attendances);
        }   // ← FIXED: GetStudentAttendance now closes here

        // ============ GET STUDENT DASHBOARD ============
        // GET: api/Student/{id}/dashboard
        // ⭐ Everything the student home page needs, in one call
        [HttpGet("{id}/dashboard")]
        public async Task<ActionResult<object>> GetDashboard(string id)
        {
            // ---------- 1. STUDENT ----------
            var student = await _context.Students.FindAsync(id);
            if (student == null) return NotFound("Student not found.");

            // ---------- 2. ENROLLMENTS ----------
            var enrollments = await _context.Enrollments
                .Where(e => e.StudentId == id && e.Status != "dropped")
                .ToListAsync();

            var courseIds = enrollments.Select(e => e.CourseId).ToList();

            var courses = await _context.Courses
                .Where(c => courseIds.Contains(c.CourseId))
                .ToListAsync();

            // ---------- 3. ALL ASSIGNMENTS IN ENROLLED COURSES ----------
            var allAssignments = await _context.Assignments
                .Where(a => courseIds.Contains(a.CourseId) && a.IsActive)
                .ToListAsync();

            var assignmentIds = allAssignments.Select(a => a.AssignmentId).ToList();

            // ---------- 4. STUDENT'S SUBMISSIONS ----------
            var submissions = await _context.Submissions
                .Where(s => s.StudentId == id && assignmentIds.Contains(s.AssignmentId))
                .ToListAsync();

            // ---------- 5. PER-COURSE BREAKDOWN ----------
            var courseSummaries = new List<object>();
            decimal totalWeighted = 0;
            int totalUnits = 0;

            foreach (var enrollment in enrollments)
            {
                var course = courses.FirstOrDefault(c => c.CourseId == enrollment.CourseId);
                if (course == null) continue;

                var courseAssignments = allAssignments
                    .Where(a => a.CourseId == course.CourseId)
                    .ToList();
                var courseAssignmentIds = courseAssignments.Select(a => a.AssignmentId).ToList();

                var courseSubs = submissions
                    .Where(s => courseAssignmentIds.Contains(s.AssignmentId))
                    .ToList();

                var graded = courseSubs
                    .Where(s => s.Status == "graded" && s.Score != null)
                    .ToList();

                decimal earned = graded.Sum(s => s.Score ?? 0);
                int possible = 0;
                foreach (var sub in graded)
                {
                    var a = courseAssignments.FirstOrDefault(x => x.AssignmentId == sub.AssignmentId);
                    if (a != null) possible += a.MaxPoints;
                }
                decimal percent = possible > 0 ? Math.Round((earned / possible) * 100, 2) : 0;

                var now = DateTime.UtcNow;
                int pending = courseAssignments.Count(a =>
                    a.DueDate != null
                    && a.DueDate >= now
                    && !courseSubs.Any(s => s.AssignmentId == a.AssignmentId));

                courseSummaries.Add(new
                {
                    CourseId = course.CourseId,
                    course.CourseCode,
                    course.CourseName,
                    course.TeacherName,
                    course.Units,
                    course.Schedule,
                    EnrollmentStatus = enrollment.Status,
                    GradedCount = graded.Count,
                    TotalAssignments = courseAssignments.Count,
                    PendingAssignments = pending,
                    Percent = percent,
                    FinalGrade = enrollment.FinalGrade
                });

                if (percent > 0)
                {
                    totalWeighted += percent * course.Units;
                    totalUnits += course.Units;
                }
            }

            decimal overallPercent = totalUnits > 0
                ? Math.Round(totalWeighted / totalUnits, 2)
                : 0;

            // ---------- 6. UPCOMING ASSIGNMENTS ----------
            var now2 = DateTime.UtcNow;
            var upcoming = allAssignments
                .Where(a => a.DueDate != null && a.DueDate >= now2)
                .Where(a => !submissions.Any(s => s.AssignmentId == a.AssignmentId))
                .OrderBy(a => a.DueDate)
                .Take(5)
                .Select(a =>
                {
                    var c = courses.FirstOrDefault(x => x.CourseId == a.CourseId);
                    return new
                    {
                        a.AssignmentId,
                        a.Title,
                        a.DueDate,
                        a.MaxPoints,
                        CourseCode = c?.CourseCode,
                        CourseName = c?.CourseName
                    };
                })
                .ToList();

            // ---------- 7. OVERDUE COUNT ----------
            int overdueCount = allAssignments.Count(a =>
                a.DueDate != null
                && a.DueDate < now2
                && !submissions.Any(s => s.AssignmentId == a.AssignmentId));

            // ---------- 8. RECENT GRADES ----------
            var recentGrades = submissions
                .Where(s => s.Status == "graded" && s.GradedAt != null)
                .OrderByDescending(s => s.GradedAt)
                .Take(5)
                .Select(s =>
                {
                    var a = allAssignments.FirstOrDefault(x => x.AssignmentId == s.AssignmentId);
                    var c = a != null ? courses.FirstOrDefault(x => x.CourseId == a.CourseId) : null;
                    return new
                    {
                        s.SubmissionId,
                        AssignmentTitle = a?.Title,
                        CourseCode = c?.CourseCode,
                        s.Score,
                        MaxPoints = a?.MaxPoints,
                        s.Feedback,
                        s.GradedAt
                    };
                })
                .ToList();

            // ---------- 9. ATTENDANCE SUMMARY ----------
            var attendanceRecords = await _context.Attendance
                .Where(a => a.StudentId == id)
                .ToListAsync();

            int attendanceDays = attendanceRecords.Count;
            int openAttendanceDays = attendanceRecords.Count(a => a.TimeOut == null);
            DateTime? lastAttendance = attendanceRecords.Any()
                ? attendanceRecords.Max(a => a.Date)
                : null;

            // ---------- 10. ASSEMBLE RESPONSE ----------
            return Ok(new
            {
                Profile = new
                {
                    student.StudentId,
                    student.Email,
                    student.FirstName,
                    student.LastName,
                    student.Course,
                    student.YearLevel,
                    student.Section,
                    student.IsActive,
                    student.CreatedAt
                },
                Stats = new
                {
                    EnrolledCourses = enrollments.Count,
                    ActiveCourses = enrollments.Count(e => e.Status == "active"),
                    TotalUnits = totalUnits,
                    OverallPercent = overallPercent,
                    OverallEquivalent = PercentToEquivalent(overallPercent),
                    AttendanceDays = attendanceDays,
                    OpenAttendanceDays = openAttendanceDays,
                    LastAttendance = lastAttendance,
                    PendingAssignments = upcoming.Count,
                    OverdueAssignments = overdueCount
                },
                Courses = courseSummaries,
                UpcomingAssignments = upcoming,
                RecentGrades = recentGrades
            });
        }

        // ============ HELPER ============
        private static decimal PercentToEquivalent(decimal percent)
        {
            if (percent >= 96) return 1.00m;
            if (percent >= 91) return 1.25m;
            if (percent >= 86) return 1.50m;
            if (percent >= 81) return 1.75m;
            if (percent >= 76) return 2.00m;
            if (percent >= 71) return 2.25m;
            if (percent >= 66) return 2.50m;
            if (percent >= 61) return 2.75m;
            if (percent >= 56) return 3.00m;
            return 5.00m;
        }
    }
}