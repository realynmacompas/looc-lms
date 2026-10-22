using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project_2.Data;
using Project_2.Model;

namespace Project_2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TeacherController : ControllerBase
    {
        private readonly AceDbContext _context;

        public TeacherController(AceDbContext context)
        {
            _context = context;
        }

        // ============ GET ONE TEACHER ============
        // GET: api/teacher/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetTeacher(string id)
        {
            var teacher = await _context.Teachers
                .Where(t => t.TeacherId == id)
                .Select(t => new
                {
                    t.TeacherId,
                    t.Email,
                    t.FirstName,
                    t.LastName,
                    t.Department,
                    t.IsActive,
                    t.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (teacher == null) return NotFound("Teacher not found.");

            return Ok(teacher);
        }

        // ============ GET TEACHER'S COURSES ============
        // GET: api/teacher/{id}/courses
        [HttpGet("{id}/courses")]
        public async Task<ActionResult<object>> GetTeacherCourses(string id)
        {
            var teacherExists = await _context.Teachers
                .AnyAsync(t => t.TeacherId == id);

            if (!teacherExists) return NotFound("Teacher not found.");

            var courses = await _context.Courses
                .Where(c => c.TeacherId == id && c.IsActive)
                .OrderBy(c => c.CourseCode)
                .ToListAsync();

            var result = new List<object>();
            foreach (var course in courses)
            {
                int enrolledCount = await _context.Enrollments
                    .CountAsync(e => e.CourseId == course.CourseId && e.Status != "dropped");

                int assignmentCount = await _context.Assignments
                    .CountAsync(a => a.CourseId == course.CourseId && a.IsActive);

                int materialCount = await _context.Materials
                    .CountAsync(m => m.CourseId == course.CourseId && m.IsActive);

                result.Add(new
                {
                    course.CourseId,
                    course.CourseCode,
                    course.CourseName,
                    course.Units,
                    course.Schedule,
                    EnrolledStudents = enrolledCount,
                    Assignments = assignmentCount,
                    Materials = materialCount
                });
            }

            return Ok(new
            {
                TeacherId = id,
                TotalCourses = courses.Count,
                Courses = result
            });
        }

        // ============ TEACHER DASHBOARD ============
        // GET: api/teacher/{id}/dashboard
        [HttpGet("{id}/dashboard")]
        public async Task<ActionResult<object>> GetDashboard(string id)
        {
            // 1. TEACHER
            var teacher = await _context.Teachers
                .FirstOrDefaultAsync(t => t.TeacherId == id);
            if (teacher == null) return NotFound("Teacher not found.");

            // 2. COURSES
            var courses = await _context.Courses
                .Where(c => c.TeacherId == id && c.IsActive)
                .ToListAsync();

            var courseIds = courses.Select(c => c.CourseId).ToList();

            // 3. STUDENTS & ASSIGNMENTS
            int totalStudents = await _context.Enrollments
                .Where(e => courseIds.Contains(e.CourseId) && e.Status != "dropped")
                .Select(e => e.StudentId)
                .Distinct()
                .CountAsync();

            var assignments = await _context.Assignments
                .Where(a => courseIds.Contains(a.CourseId) && a.IsActive)
                .ToListAsync();

            var assignmentIds = assignments.Select(a => a.AssignmentId).ToList();

            // 4. SUBMISSIONS NEEDING GRADING
            int pendingGrading = await _context.Submissions
                .CountAsync(s => assignmentIds.Contains(s.AssignmentId)
                              && s.Status != "graded");

            // 5. UPCOMING DEADLINES
            var now = DateTime.UtcNow;
            var upcomingDeadlines = assignments
                .Where(a => a.DueDate != null && a.DueDate >= now)
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

            // 6. PER-COURSE SUMMARY
            var courseSummaries = new List<object>();
            foreach (var course in courses)
            {
                int studentCount = await _context.Enrollments
                    .CountAsync(e => e.CourseId == course.CourseId && e.Status != "dropped");

                int assignmentCount = await _context.Assignments
                    .CountAsync(a => a.CourseId == course.CourseId && a.IsActive);

                int ungradedCount = await _context.Submissions
                    .Where(s => s.Status != "graded")
                    .Join(_context.Assignments.Where(a => a.CourseId == course.CourseId),
                          s => s.AssignmentId,
                          a => a.AssignmentId,
                          (s, a) => s)
                    .CountAsync();

                courseSummaries.Add(new
                {
                    course.CourseId,
                    course.CourseCode,
                    course.CourseName,
                    course.Units,
                    course.Schedule,
                    EnrolledStudents = studentCount,
                    Assignments = assignmentCount,
                    PendingGrading = ungradedCount
                });
            }

            // 7. ASSEMBLE RESPONSE
            return Ok(new
            {
                Profile = new
                {
                    teacher.TeacherId,
                    teacher.Email,
                    teacher.FirstName,
                    teacher.LastName,
                    teacher.Department,
                    teacher.IsActive,
                    teacher.CreatedAt
                },
                Stats = new
                {
                    TotalCourses = courses.Count,
                    TotalStudents = totalStudents,
                    TotalAssignments = assignments.Count,
                    PendingGrading = pendingGrading
                },
                Courses = courseSummaries,
                UpcomingDeadlines = upcomingDeadlines
            });
        }

        // ============ GET SUBMISSIONS FOR AN ASSIGNMENT ============
        // GET: api/teacher/assignments/{assignmentId}/submissions
        [HttpGet("assignments/{assignmentId}/submissions")]
        public async Task<ActionResult<object>> GetAssignmentSubmissions(int assignmentId)
        {
            var assignment = await _context.Assignments
                .FirstOrDefaultAsync(a => a.AssignmentId == assignmentId);

            if (assignment == null) return NotFound("Assignment not found.");

            var submissions = await _context.Submissions
                .Where(s => s.AssignmentId == assignmentId)
                .Join(_context.Students,
                    s => s.StudentId,
                    st => st.StudentId,
                    (s, st) => new
                    {
                        s.SubmissionId,
                        s.AssignmentId,
                        s.StudentId,
                        StudentName = st.FirstName + " " + st.LastName,
                        s.Content,
                        s.FileUrl,
                        s.Status,
                        s.Score,
                        s.Feedback,
                        s.SubmittedAt,
                        s.GradedAt
                    })
                .OrderByDescending(x => x.SubmittedAt)
                .ToListAsync();

            return Ok(new
            {
                AssignmentId = assignment.AssignmentId,
                assignment.Title,
                assignment.MaxPoints,
                assignment.DueDate,
                TotalSubmissions = submissions.Count,
                GradedCount = submissions.Count(s => s.Status == "graded"),
                PendingCount = submissions.Count(s => s.Status != "graded"),
                Submissions = submissions
            });
        }

        // ============ GET CLASS GRADEBOOK ============
        // GET: api/teacher/course/{courseId}/gradebook
        [HttpGet("course/{courseId}/gradebook")]
        public async Task<ActionResult<object>> GetGradebook(int courseId)
        {
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null) return NotFound("Course not found.");

            var enrollments = await _context.Enrollments
                .Where(e => e.CourseId == courseId && e.Status != "dropped")
                .ToListAsync();

            var studentIds = enrollments.Select(e => e.StudentId).ToList();

            var students = await _context.Students
                .Where(s => studentIds.Contains(s.StudentId))
                .ToListAsync();

            var assignments = await _context.Assignments
                .Where(a => a.CourseId == courseId && a.IsActive)
                .OrderBy(a => a.DueDate)
                .ToListAsync();

            var assignmentIds = assignments.Select(a => a.AssignmentId).ToList();

            var submissions = await _context.Submissions
                .Where(s => assignmentIds.Contains(s.AssignmentId))
                .ToListAsync();

            var rows = new List<object>();

            foreach (var student in students)
            {
                var studentSubs = submissions
                    .Where(s => s.StudentId == student.StudentId)
                    .ToList();

                var grades = assignments.Select(a =>
                {
                    var sub = studentSubs.FirstOrDefault(s => s.AssignmentId == a.AssignmentId);
                    return new
                    {
                        a.AssignmentId,
                        a.Title,
                        a.MaxPoints,
                        Score = sub?.Score,
                        Status = sub?.Status ?? "not_submitted"
                    };
                }).ToList();

                var graded = studentSubs.Where(s => s.Status == "graded" && s.Score != null).ToList();
                decimal earned = graded.Sum(s => s.Score ?? 0);
                int possible = 0;
                foreach (var sub in graded)
                {
                    var a = assignments.FirstOrDefault(x => x.AssignmentId == sub.AssignmentId);
                    if (a != null) possible += a.MaxPoints;
                }
                decimal percent = possible > 0 ? Math.Round((earned / possible) * 100, 2) : 0;

                rows.Add(new
                {
                    student.StudentId,
                    StudentName = student.FirstName + " " + student.LastName,
                    StudentCourse = student.Course,
                    YearLevel = student.YearLevel,
                    Section = student.Section,
                    Grades = grades,
                    Earned = earned,
                    Possible = possible,
                    Percent = percent,
                    Equivalent = PercentToEquivalent(percent)
                });
            }

            return Ok(new
            {
                CourseId = course.CourseId,
                course.CourseCode,
                course.CourseName,
                course.Units,
                TotalStudents = students.Count,
                TotalAssignments = assignments.Count,
                Assignments = assignments.Select(a => new
                {
                    a.AssignmentId,
                    a.Title,
                    a.DueDate,
                    a.MaxPoints
                }),
                Students = rows
            });
        }

        // ============ POST ANNOUNCEMENT TO COURSE ============
        // POST: api/teacher/course/{courseId}/announcement
        [HttpPost("course/{courseId}/announcement")]
        public async Task<ActionResult<Material>> PostAnnouncement(int courseId, [FromBody] Material announcement)
        {
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null) return NotFound("Course not found.");

            announcement.CourseId = courseId;
            announcement.Type = "announcement";
            announcement.Url = string.IsNullOrWhiteSpace(announcement.Url) ? "n/a" : announcement.Url;
            announcement.CreatedAt = DateTime.UtcNow;
            announcement.IsActive = true;

            _context.Materials.Add(announcement);
            await _context.SaveChangesAsync();

            return Ok(announcement);
        }

        // ============ GET ALL SUBMISSIONS ACROSS TEACHER'S COURSES ============
        // GET: api/teacher/{id}/submissions
        [HttpGet("{id}/submissions")]
        public async Task<ActionResult<object>> GetAllTeacherSubmissions(string id)
        {
            var teacherExists = await _context.Teachers
                .AnyAsync(t => t.TeacherId == id);

            if (!teacherExists) return NotFound("Teacher not found.");

            var courseIds = await _context.Courses
                .Where(c => c.TeacherId == id && c.IsActive)
                .Select(c => c.CourseId)
                .ToListAsync();

            var assignmentIds = await _context.Assignments
                .Where(a => courseIds.Contains(a.CourseId) && a.IsActive)
                .Select(a => a.AssignmentId)
                .ToListAsync();

            var submissions = await _context.Submissions
                .Where(s => assignmentIds.Contains(s.AssignmentId))
                .Join(_context.Students,
                    s => s.StudentId,
                    st => st.StudentId,
                    (s, st) => new
                    {
                        s.SubmissionId,
                        s.AssignmentId,
                        s.StudentId,
                        StudentName = st.FirstName + " " + st.LastName,
                        s.Status,
                        s.Score,
                        s.SubmittedAt,
                        s.GradedAt
                    })
                .OrderByDescending(x => x.SubmittedAt)
                .ToListAsync();

            return Ok(new
            {
                TeacherId = id,
                TotalSubmissions = submissions.Count,
                PendingGrading = submissions.Count(s => s.Status != "graded"),
                Submissions = submissions
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