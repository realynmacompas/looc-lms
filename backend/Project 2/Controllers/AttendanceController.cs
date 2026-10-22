using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project_2.Data;
using Project_2.Model;

namespace Project_2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceController : ControllerBase
    {
        private readonly AceDbContext _context;

        public AttendanceController(AceDbContext context)
        {
            _context = context;
        }

        // ============ GET ALL ATTENDANCE RECORDS ============
        // GET: api/Attendance
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Attendance>>> GetAttendance()
        {
            var attendance = await _context.Attendance.ToListAsync();
            return Ok(attendance);
        }

        // ============ GET ONE ATTENDANCE RECORD ============
        // GET: api/Attendance/{date}/{studentId}
        [HttpGet("{date}/{studentId}")]
        public async Task<ActionResult<Attendance>> GetAttendance(
            DateTime date,
            string studentId)
        {
            var attendance = await _context.Attendance
                .FirstOrDefaultAsync(a =>
                    a.Date == date &&
                    a.StudentId == studentId);

            if (attendance == null)
            {
                return NotFound();
            }

            return Ok(attendance);
        }

        // ============ CREATE ATTENDANCE RECORD ============
        // POST: api/Attendance
        [HttpPost]
        public async Task<ActionResult<Attendance>> CreateAttendance(Attendance attendance)
        {
            var exists = await _context.Attendance.AnyAsync(a =>
                a.StudentId == attendance.StudentId && a.Date == attendance.Date);

            if (exists)
                return BadRequest("Attendance for this student on this date already exists.");

            _context.Attendance.Add(attendance);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAttendance),
                new { date = attendance.Date, studentId = attendance.StudentId }, attendance);
        }

        // ============ UPDATE ATTENDANCE RECORD ============
        // PUT: api/Attendance/{date}/{studentId}
        [HttpPut("{date}/{studentId}")]
        public async Task<IActionResult> UpdateAttendance(
            DateTime date,
            string studentId,
            Attendance attendance)
        {
            if (date != attendance.Date ||
                studentId != attendance.StudentId)
            {
                return BadRequest("Date or Student ID does not match.");
            }

            var existingAttendance = await _context.Attendance
                .FirstOrDefaultAsync(a =>
                    a.Date == date &&
                    a.StudentId == studentId);

            if (existingAttendance == null)
            {
                return NotFound();
            }

            // Update fields
            existingAttendance.FullName = attendance.FullName;  // NEW!
            existingAttendance.TimeIn = attendance.TimeIn;
            existingAttendance.TimeOut = attendance.TimeOut;
            existingAttendance.Task = attendance.Task;
            existingAttendance.Journal = attendance.Journal;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ============ DELETE ATTENDANCE RECORD ============
        // DELETE: api/Attendance/{date}/{studentId}
        [HttpDelete("{date}/{studentId}")]
        public async Task<IActionResult> DeleteAttendance(
            DateTime date,
            string studentId)
        {
            var attendance = await _context.Attendance
                .FirstOrDefaultAsync(a =>
                    a.Date == date &&
                    a.StudentId == studentId);

            if (attendance == null)
            {
                return NotFound();
            }

            _context.Attendance.Remove(attendance);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}