using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project_2.Data;
using Project_2.Model;

namespace Project_2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CoursesController : ControllerBase
    {
        private readonly AceDbContext _context;

        public CoursesController(AceDbContext context)
        {
            _context = context;
        }

        // GET: api/courses
        // List all active courses
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Course>>> GetCourses()
        {
            var courses = await _context.Courses
                .Where(c => c.IsActive)
                .OrderBy(c => c.CourseCode)
                .ToListAsync();

            return Ok(courses);
        }

        // GET: api/courses/{id}
        // Get one course by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Course>> GetCourse(int id)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null) return NotFound();

            return Ok(course);
        }

        // POST: api/courses
        // Create a course (admin/teacher action — kept here for testing)
        [HttpPost]
        public async Task<ActionResult<Course>> CreateCourse(Course course)
        {
            // Prevent duplicate course codes
            var exists = await _context.Courses
                .AnyAsync(c => c.CourseCode == course.CourseCode);

            if (exists)
                return BadRequest($"Course code '{course.CourseCode}' already exists.");

            course.CreatedAt = DateTime.UtcNow;
            course.UpdatedAt = DateTime.UtcNow;

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCourse),
                new { id = course.CourseId }, course);
        }

        // PUT: api/courses/{id}
        // Update a course
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCourse(int id, Course course)
        {
            if (id != course.CourseId)
                return BadRequest("ID mismatch");

            var existing = await _context.Courses.FindAsync(id);
            if (existing == null) return NotFound();

            existing.CourseCode = course.CourseCode;
            existing.CourseName = course.CourseName;
            existing.TeacherId = course.TeacherId;
            existing.TeacherName = course.TeacherName;
            existing.Units = course.Units;
            existing.Schedule = course.Schedule;
            existing.IsActive = course.IsActive;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/courses/{id}
        // Soft-delete (mark inactive)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null) return NotFound();

            course.IsActive = false;
            course.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}