using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project_2.Data;
using Project_2.Model;

namespace Project_2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventsController : ControllerBase
    {
        private static readonly string[] ValidTypes = { "holiday", "exam", "school" };

        private readonly AceDbContext _context;

        public EventsController(AceDbContext context)
        {
            _context = context;
        }

        // ============ GET EVENTS ============
        // GET: api/events
        // GET: api/events?month=11&year=2026
        // School-wide calendar entries. Optional month/year narrows to
        // that month; omitted, every event is returned (ordered by date)
        // and the Calendar of Events page filters client-side.
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Event>>> GetEvents(int? month, int? year)
        {
            var query = _context.Events.AsQueryable();

            if (month.HasValue && year.HasValue)
            {
                query = query.Where(e => e.EventDate.Month == month.Value && e.EventDate.Year == year.Value);
            }

            var events = await query
                .OrderBy(e => e.EventDate)
                .ToListAsync();

            return Ok(events);
        }

        // ============ CREATE EVENT ============
        // POST: api/events
        // payload: { title, description?, eventDate, eventType, createdBy? }
        // Intended for teachers (same trust model as PostAnnouncement -
        // this backend has no real auth, so there's no server-side role
        // check here either).
        [HttpPost]
        public async Task<ActionResult<Event>> CreateEvent(Event ev)
        {
            if (string.IsNullOrWhiteSpace(ev.Title))
                return BadRequest("Title is required.");

            if (ev.EventDate == default)
                return BadRequest("EventDate is required.");

            if (string.IsNullOrWhiteSpace(ev.EventType) || !ValidTypes.Contains(ev.EventType))
                ev.EventType = "school";

            ev.CreatedAt = DateTime.UtcNow;

            _context.Events.Add(ev);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetEvents), new { }, ev);
        }

        // ============ DELETE EVENT ============
        // DELETE: api/events/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEvent(int id)
        {
            var ev = await _context.Events.FindAsync(id);
            if (ev == null) return NotFound();

            _context.Events.Remove(ev);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
