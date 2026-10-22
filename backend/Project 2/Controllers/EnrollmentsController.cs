using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project_2.Data;
using Project_2.Model;

namespace Project_2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EnrollmentsController : ControllerBase
    {
        private readonly AceDbContext _context;

        public EnrollmentsController(AceDbContext context)
        {
            _context = context;
        }

        // GET: api/enrollments
        // List all enrollments (admin/teacher view)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Enrollment>>> GetEnrollments()
        {
            var enrollments = await _context.Enrollments
                .OrderByDescending(e => e.EnrolledAt)
                .ToListAsync();

            return Ok(enrollments);
        }

        // GET: api/enrollments/student/{studentId}
        // Get all enrollments for one student — "My Courses"
        [HttpGet("student/{studentId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetStudentEnrollments(string studentId)
        {
            var enrollments = await _context.Enrollments
                .Where(e => e.StudentId == studentId)
                .Join(_context.Courses,
                    e => e.CourseId,
                    c => c.CourseId,
                    (e, c) => new
                    {
                        e.EnrollmentId,
                        e.Status,
                        e.FinalGrade,
                        e.EnrolledAt,
                        Course = new
                        {
                            c.CourseId,
                            c.CourseCode,
                            c.CourseName,
                            c.TeacherName,
                            c.Units,
                            c.Schedule
                        }
                    })
                .ToListAsync();

            return Ok(enrollments);
        }

        // POST: api/enrollments
        // Enroll a student into a course
        [HttpPost]
        public async Task<ActionResult<Enrollment>> Enroll(Enrollment req)
        {
            // Verify student exists
            var studentExists = await _context.Students
                .AnyAsync(s => s.StudentId == req.StudentId);
            if (!studentExists)
                return BadRequest("Student does not exist.");

            // Verify course exists & is active
            var course = await _context.Courses.FindAsync(req.CourseId);
            if (course == null || !course.IsActive)
                return BadRequest("Course does not exist or is inactive.");

            // Prevent duplicate enrollment
            var alreadyEnrolled = await _context.Enrollments
                .AnyAsync(e => e.StudentId == req.StudentId
                            && e.CourseId == req.CourseId);
            if (alreadyEnrolled)
                return BadRequest("Student is already enrolled in this course.");

            var enrollment = new Enrollment
            {
                StudentId = req.StudentId,
                CourseId = req.CourseId,
                Status = "active",
                EnrolledAt = DateTime.UtcNow
            };

            _context.Enrollments.Add(enrollment);
            await _context.SaveChangesAsync();

            return Ok(enrollment);
        }

        // PUT: api/enrollments/{id}/status
        // Update enrollment status (drop, complete)
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
        {
            var allowed = new[] { "active", "completed", "dropped" };
            if (!allowed.Contains(status))
                return BadRequest("Invalid status. Use: active, completed, dropped.");

            var enrollment = await _context.Enrollments.FindAsync(id);
            if (enrollment == null) return NotFound();

            enrollment.Status = status;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/enrollments/{id}
        // Drop a course (hard delete of the enrollment record)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEnrollment(int id)
        {
            var enrollment = await _context.Enrollments.FindAsync(id);
            if (enrollment == null) return NotFound();

            _context.Enrollments.Remove(enrollment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}