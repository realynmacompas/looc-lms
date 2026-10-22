using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project_2.Data;
using Project_2.Model;

namespace Project_2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TeacherAttendanceController : ControllerBase
    {
        private readonly AceDbContext _context;

        public TeacherAttendanceController(AceDbContext context)
        {
            _context = context;
        }

        // GET: api/TeacherAttendance
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TeacherAttendance>>> GetAll()
        {
            return Ok(await _context.TeacherAttendance.ToListAsync());
        }

        // GET: api/TeacherAttendance/teacher/{teacherId}
        [HttpGet("teacher/{teacherId}")]
        public async Task<ActionResult<IEnumerable<TeacherAttendance>>> GetForTeacher(string teacherId)
        {
            var records = await _context.TeacherAttendance
                .Where(a => a.TeacherId == teacherId)
                .OrderByDescending(a => a.Date)
                .ToListAsync();

            if (!records.Any())
                return NotFound("No attendance records found for this teacher");

            return Ok(records);
        }

        // GET: api/TeacherAttendance/{date}/{teacherId}
        [HttpGet("{date}/{teacherId}")]
        public async Task<ActionResult<TeacherAttendance>> GetOne(DateTime date, string teacherId)
        {
            var record = await _context.TeacherAttendance
                .FirstOrDefaultAsync(a => a.Date == date && a.TeacherId == teacherId);

            if (record == null) return NotFound();
            return Ok(record);
        }

        // POST: api/TeacherAttendance
        [HttpPost]
        public async Task<ActionResult<TeacherAttendance>> Create(TeacherAttendance attendance)
        {
            var exists = await _context.TeacherAttendance.AnyAsync(a =>
                a.TeacherId == attendance.TeacherId && a.Date == attendance.Date);

            if (exists)
                return BadRequest("Attendance for this teacher on this date already exists.");

            _context.TeacherAttendance.Add(attendance);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetOne),
                new { date = attendance.Date, teacherId = attendance.TeacherId }, attendance);
        }

        // PUT: api/TeacherAttendance/{date}/{teacherId}
        [HttpPut("{date}/{teacherId}")]
        public async Task<IActionResult> Update(DateTime date, string teacherId, TeacherAttendance attendance)
        {
            if (date != attendance.Date || teacherId != attendance.TeacherId)
                return BadRequest("Date or Teacher ID does not match.");

            var existing = await _context.TeacherAttendance
                .FirstOrDefaultAsync(a => a.Date == date && a.TeacherId == teacherId);

            if (existing == null) return NotFound();

            existing.FullName = attendance.FullName;
            existing.TimeIn = attendance.TimeIn;
            existing.TimeOut = attendance.TimeOut;
            existing.Task = attendance.Task;
            existing.Journal = attendance.Journal;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/TeacherAttendance/{date}/{teacherId}
        [HttpDelete("{date}/{teacherId}")]
        public async Task<IActionResult> Delete(DateTime date, string teacherId)
        {
            var record = await _context.TeacherAttendance
                .FirstOrDefaultAsync(a => a.Date == date && a.TeacherId == teacherId);

            if (record == null) return NotFound();

            _context.TeacherAttendance.Remove(record);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}