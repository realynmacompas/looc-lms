using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project_2.Data;

namespace Project_2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GradesController : ControllerBase
    {
        private readonly AceDbContext _context;

        public GradesController(AceDbContext context)
        {
            _context = context;
        }

        // ============ GET ALL GRADES FOR A STUDENT ============
        // GET: api/grades/student/{studentId}
        // ⭐ Student dashboard: all course grades + overall GPA
        [HttpGet("student/{studentId}")]
        public async Task<ActionResult<object>> GetStudentGrades(string studentId)
        {
            var studentExists = await _context.Students
                .AnyAsync(s => s.StudentId == studentId);

            if (!studentExists)
                return NotFound("Student not found.");

            // Get all active/completed enrollments for this student
            var enrollments = await _context.Enrollments
                .Where(e => e.StudentId == studentId && e.Status != "dropped")
                .ToListAsync();

            var result = new List<object>();
            decimal totalWeightedGrade = 0;
            int totalUnits = 0;

            foreach (var enrollment in enrollments)
            {
                var course = await _context.Courses
                    .FirstOrDefaultAsync(c => c.CourseId == enrollment.CourseId);

                if (course == null) continue;

                // Get all assignments for this course
                var assignments = await _context.Assignments
                    .Where(a => a.CourseId == course.CourseId && a.IsActive)
                    .ToListAsync();

                var assignmentIds = assignments.Select(a => a.AssignmentId).ToList();

                // Get graded submissions for this student on those assignments
                var gradedSubmissions = await _context.Submissions
                    .Where(s => s.StudentId == studentId
                             && assignmentIds.Contains(s.AssignmentId)
                             && s.Status == "graded"
                             && s.Score != null)
                    .ToListAsync();

                decimal earned = gradedSubmissions.Sum(s => s.Score ?? 0);
                int possible = 0;

                foreach (var sub in gradedSubmissions)
                {
                    var a = assignments.FirstOrDefault(x => x.AssignmentId == sub.AssignmentId);
                    if (a != null) possible += a.MaxPoints;
                }

                decimal coursePercent = possible > 0
                    ? Math.Round((earned / possible) * 100, 2)
                    : 0;

                decimal? finalGrade = enrollment.FinalGrade;

                result.Add(new
                {
                    CourseId = course.CourseId,
                    course.CourseCode,
                    course.CourseName,
                    course.Units,
                    EnrollmentStatus = enrollment.Status,
                    GradedAssignments = gradedSubmissions.Count,
                    TotalAssignments = assignments.Count,
                    Earned = earned,
                    Possible = possible,
                    Percent = coursePercent,
                    FinalGrade = finalGrade
                });

                // Accumulate for GPA
                if (coursePercent > 0)
                {
                    totalWeightedGrade += coursePercent * course.Units;
                    totalUnits += course.Units;
                }
            }

            decimal overallPercent = totalUnits > 0
                ? Math.Round(totalWeightedGrade / totalUnits, 2)
                : 0;

            return Ok(new
            {
                StudentId = studentId,
                OverallPercent = overallPercent,
                OverallEquivalent = PercentToEquivalent(overallPercent),
                TotalUnits = totalUnits,
                Courses = result
            });
        }

        // ============ GET DETAILED GRADE FOR ONE COURSE ============
        // GET: api/grades/course/{courseId}/student/{studentId}
        // Detailed per-assignment breakdown
        [HttpGet("course/{courseId}/student/{studentId}")]
        public async Task<ActionResult<object>> GetCourseGrade(int courseId, string studentId)
        {
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null) return NotFound("Course not found.");

            var enrolled = await _context.Enrollments
                .AnyAsync(e => e.StudentId == studentId && e.CourseId == courseId);

            if (!enrolled)
                return NotFound("Student is not enrolled in this course.");

            var assignments = await _context.Assignments
                .Where(a => a.CourseId == courseId && a.IsActive)
                .OrderBy(a => a.DueDate)
                .ToListAsync();

            var assignmentIds = assignments.Select(a => a.AssignmentId).ToList();

            var submissions = await _context.Submissions
                .Where(s => s.StudentId == studentId && assignmentIds.Contains(s.AssignmentId))
                .ToListAsync();

            var breakdown = assignments.Select(a =>
            {
                var sub = submissions.FirstOrDefault(s => s.AssignmentId == a.AssignmentId);
                return new
                {
                    a.AssignmentId,
                    a.Title,
                    a.DueDate,
                    a.MaxPoints,
                    Score = sub?.Score,
                    Status = sub?.Status ?? "not_submitted",
                    Feedback = sub?.Feedback,
                    SubmittedAt = sub?.SubmittedAt,
                    GradedAt = sub?.GradedAt
                };
            }).ToList();

            var graded = submissions.Where(s => s.Status == "graded" && s.Score != null).ToList();
            decimal earned = graded.Sum(s => s.Score ?? 0);
            int possible = 0;
            foreach (var sub in graded)
            {
                var a = assignments.FirstOrDefault(x => x.AssignmentId == sub.AssignmentId);
                if (a != null) possible += a.MaxPoints;
            }
            decimal percent = possible > 0 ? Math.Round((earned / possible) * 100, 2) : 0;

            return Ok(new
            {
                CourseId = course.CourseId,
                course.CourseCode,
                course.CourseName,
                course.Units,
                Earned = earned,
                Possible = possible,
                Percent = percent,
                Equivalent = PercentToEquivalent(percent),
                Assignments = breakdown
            });
        }

        // ============ CLASS GRADEBOOK ============
        // GET: api/grades/course/{courseId}
        // Teacher view: grades for all enrolled students
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<object>> GetClassGrades(int courseId)
        {
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null) return NotFound("Course not found.");

            var enrollments = await _context.Enrollments
                .Where(e => e.CourseId == courseId && e.Status != "dropped")
                .ToListAsync();

            var assignments = await _context.Assignments
                .Where(a => a.CourseId == courseId && a.IsActive)
                .ToListAsync();

            var assignmentIds = assignments.Select(a => a.AssignmentId).ToList();

            var rows = new List<object>();

            foreach (var e in enrollments)
            {
                var student = await _context.Students.FindAsync(e.StudentId);
                if (student == null) continue;

                var submissions = await _context.Submissions
                    .Where(s => s.StudentId == e.StudentId
                             && assignmentIds.Contains(s.AssignmentId))
                    .ToListAsync();

                var graded = submissions
                    .Where(s => s.Status == "graded" && s.Score != null)
                    .ToList();

                decimal earned = graded.Sum(s => s.Score ?? 0);
                int possible = 0;
                foreach (var sub in graded)
                {
                    var a = assignments.FirstOrDefault(x => x.AssignmentId == sub.AssignmentId);
                    if (a != null) possible += a.MaxPoints;
                }
                decimal percent = possible > 0
                    ? Math.Round((earned / possible) * 100, 2)
                    : 0;

                rows.Add(new
                {
                    e.StudentId,
                    StudentName = student.FirstName + " " + student.LastName,
                    GradedCount = graded.Count,
                    TotalAssignments = assignments.Count,
                    Earned = earned,
                    Possible = possible,
                    Percent = percent,
                    Equivalent = PercentToEquivalent(percent),
                    FinalGrade = e.FinalGrade
                });
            }

            return Ok(new
            {
                CourseId = course.CourseId,
                course.CourseCode,
                course.CourseName,
                Students = rows
            });
        }

        // ============ FINALIZE FINAL GRADE ============
        // PUT: api/grades/enrollment/{enrollmentId}/finalize
        // Computes and saves the final grade into enrollments.final_grade
        [HttpPut("enrollment/{enrollmentId}/finalize")]
        public async Task<IActionResult> FinalizeGrade(int enrollmentId)
        {
            var enrollment = await _context.Enrollments.FindAsync(enrollmentId);
            if (enrollment == null) return NotFound("Enrollment not found.");

            var assignments = await _context.Assignments
                .Where(a => a.CourseId == enrollment.CourseId && a.IsActive)
                .ToListAsync();

            var assignmentIds = assignments.Select(a => a.AssignmentId).ToList();

            var graded = await _context.Submissions
                .Where(s => s.StudentId == enrollment.StudentId
                         && assignmentIds.Contains(s.AssignmentId)
                         && s.Status == "graded"
                         && s.Score != null)
                .ToListAsync();

            decimal earned = graded.Sum(s => s.Score ?? 0);
            int possible = 0;
            foreach (var sub in graded)
            {
                var a = assignments.FirstOrDefault(x => x.AssignmentId == sub.AssignmentId);
                if (a != null) possible += a.MaxPoints;
            }

            if (possible == 0)
                return BadRequest("No graded submissions found to compute a final grade.");

            decimal percent = Math.Round((earned / possible) * 100, 2);

            enrollment.FinalGrade = percent;
            enrollment.Status = "completed";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                enrollment.EnrollmentId,
                enrollment.StudentId,
                enrollment.CourseId,
                Percent = percent,
                Equivalent = PercentToEquivalent(percent),
                Status = enrollment.Status
            });
        }

        // ============ HELPER: % → equivalent grade ============
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