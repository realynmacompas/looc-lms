using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project_2.Data;
using Project_2.Model;

namespace Project_2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssignmentsController : ControllerBase
    {
        private readonly AceDbContext _context;

        public AssignmentsController(AceDbContext context)
        {
            _context = context;
        }

        // ============ GET ALL ASSIGNMENTS ============
        // GET: api/assignments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Assignment>>> GetAllAssignments()
        {
            var assignments = await _context.Assignments
                .Where(a => a.IsActive)
                .OrderBy(a => a.DueDate)
                .ToListAsync();

            return Ok(assignments);
        }

        // ============ GET ASSIGNMENTS BY COURSE ============
        // GET: api/assignments/course/{courseId}
        // ⭐ Students use this on a course page
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<IEnumerable<Assignment>>> GetAssignmentsByCourse(int courseId)
        {
            var courseExists = await _context.Courses
                .AnyAsync(c => c.CourseId == courseId);

            if (!courseExists)
                return NotFound("Course not found.");

            var assignments = await _context.Assignments
                .Where(a => a.CourseId == courseId && a.IsActive)
                .OrderBy(a => a.DueDate)
                .ToListAsync();

            return Ok(assignments);
        }

        // ============ GET UPCOMING ASSIGNMENTS FOR A STUDENT ============
        // GET: api/assignments/upcoming/{studentId}
        // ⭐ Dashboard: all upcoming assignments across all enrolled courses
        [HttpGet("upcoming/{studentId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetUpcomingForStudent(string studentId)
        {
            var studentExists = await _context.Students
                .AnyAsync(s => s.StudentId == studentId);

            if (!studentExists)
                return NotFound("Student not found.");

            var now = DateTime.UtcNow;

            var upcoming = await _context.Enrollments
                .Where(e => e.StudentId == studentId && e.Status == "active")
                .Join(_context.Courses,
                    e => e.CourseId,
                    c => c.CourseId,
                    (e, c) => new { c.CourseId, c.CourseCode, c.CourseName })
                .Join(_context.Assignments.Where(a => a.IsActive),
                    x => x.CourseId,
                    a => a.CourseId,
                    (x, a) => new
                    {
                        a.AssignmentId,
                        a.Title,
                        a.Description,
                        a.DueDate,
                        a.MaxPoints,
                        a.AttachmentUrl,
                        Course = new
                        {
                            x.CourseId,
                            x.CourseCode,
                            x.CourseName
                        },
                        IsOverdue = a.DueDate != null && a.DueDate < now
                    })
                .OrderBy(x => x.DueDate)
                .ToListAsync();

            return Ok(upcoming);
        }

        // ============ GET ONE ASSIGNMENT ============
        // GET: api/assignments/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Assignment>> GetAssignment(int id)
        {
            var assignment = await _context.Assignments.FindAsync(id);
            if (assignment == null) return NotFound();

            return Ok(assignment);
        }

        // ============ CREATE ASSIGNMENT ============
        // POST: api/assignments
        [HttpPost]
        public async Task<ActionResult<Assignment>> CreateAssignment(Assignment assignment)
        {
            var courseExists = await _context.Courses
                .AnyAsync(c => c.CourseId == assignment.CourseId);

            if (!courseExists)
                return BadRequest("Course does not exist.");

            assignment.CreatedAt = DateTime.UtcNow;
            assignment.IsActive = true;

            if (assignment.MaxPoints <= 0)
                assignment.MaxPoints = 100;

            _context.Assignments.Add(assignment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAssignment),
                new { id = assignment.AssignmentId }, assignment);
        }

        // ============ UPDATE ASSIGNMENT ============
        // PUT: api/assignments/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAssignment(int id, Assignment assignment)
        {
            if (id != assignment.AssignmentId)
                return BadRequest("ID mismatch");

            var existing = await _context.Assignments.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Title = assignment.Title;
            existing.Description = assignment.Description;
            existing.DueDate = assignment.DueDate;
            existing.MaxPoints = assignment.MaxPoints;
            existing.AttachmentUrl = assignment.AttachmentUrl;
            existing.IsActive = assignment.IsActive;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ============ DELETE ASSIGNMENT (soft) ============
        // DELETE: api/assignments/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAssignment(int id)
        {
            var assignment = await _context.Assignments.FindAsync(id);
            if (assignment == null) return NotFound();

            assignment.IsActive = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}