using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project_2.Data;
using Project_2.Model;

namespace Project_2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubmissionsController : ControllerBase
    {
        private readonly AceDbContext _context;

        public SubmissionsController(AceDbContext context)
        {
            _context = context;
        }

        // ============ GET ALL SUBMISSIONS ============
        // GET: api/submissions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Submission>>> GetAllSubmissions()
        {
            var submissions = await _context.Submissions
                .OrderByDescending(s => s.SubmittedAt)
                .ToListAsync();

            return Ok(submissions);
        }

        // ============ GET ALL SUBMISSIONS FOR AN ASSIGNMENT ============
        // GET: api/submissions/assignment/{assignmentId}
        // Teacher view — who submitted what
        [HttpGet("assignment/{assignmentId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetByAssignment(int assignmentId)
        {
            var assignmentExists = await _context.Assignments
                .AnyAsync(a => a.AssignmentId == assignmentId);

            if (!assignmentExists)
                return NotFound("Assignment not found.");

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

            return Ok(submissions);
        }

        // ============ GET ALL SUBMISSIONS BY A STUDENT ============
        // GET: api/submissions/student/{studentId}
        // ⭐ Student view — their own submission history
        [HttpGet("student/{studentId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetByStudent(string studentId)
        {
            var studentExists = await _context.Students
                .AnyAsync(s => s.StudentId == studentId);

            if (!studentExists)
                return NotFound("Student not found.");

            var submissions = await _context.Submissions
                .Where(s => s.StudentId == studentId)
                .Join(_context.Assignments,
                    s => s.AssignmentId,
                    a => a.AssignmentId,
                    (s, a) => new
                    {
                        s.SubmissionId,
                        s.AssignmentId,
                        AssignmentTitle = a.Title,
                        a.DueDate,
                        a.MaxPoints,
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

            return Ok(submissions);
        }

        // ============ GET ONE SUBMISSION ============
        // GET: api/submissions/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Submission>> GetSubmission(int id)
        {
            var submission = await _context.Submissions.FindAsync(id);
            if (submission == null) return NotFound();

            return Ok(submission);
        }

        // ============ CREATE SUBMISSION ============
        // POST: api/submissions
        // ⭐ Student submits their work
        [HttpPost]
        public async Task<ActionResult<Submission>> CreateSubmission(Submission submission)
        {
            // Verify assignment exists
            var assignment = await _context.Assignments
                .FirstOrDefaultAsync(a => a.AssignmentId == submission.AssignmentId);

            if (assignment == null || !assignment.IsActive)
                return BadRequest("Assignment does not exist or is inactive.");

            // Verify student exists
            var studentExists = await _context.Students
                .AnyAsync(s => s.StudentId == submission.StudentId);

            if (!studentExists)
                return BadRequest("Student does not exist.");

            // Prevent duplicate submission
            var alreadySubmitted = await _context.Submissions
                .AnyAsync(s => s.AssignmentId == submission.AssignmentId
                            && s.StudentId == submission.StudentId);

            if (alreadySubmitted)
                return BadRequest("You have already submitted this assignment.");

            // Determine status (late if past due date)
            string status = "submitted";
            if (assignment.DueDate.HasValue && DateTime.UtcNow > assignment.DueDate.Value)
                status = "late";

            submission.Status = status;
            submission.SubmittedAt = DateTime.UtcNow;
            submission.Score = null;
            submission.Feedback = null;
            submission.GradedAt = null;

            _context.Submissions.Add(submission);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSubmission),
                new { id = submission.SubmissionId }, submission);
        }

        // ============ UPDATE SUBMISSION ============
        // PUT: api/submissions/{id}
        // Student can edit only if not yet graded
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSubmission(int id, Submission submission)
        {
            if (id != submission.SubmissionId)
                return BadRequest("ID mismatch");

            var existing = await _context.Submissions.FindAsync(id);
            if (existing == null) return NotFound();

            if (existing.Status == "graded")
                return BadRequest("Cannot edit a graded submission.");

            existing.Content = submission.Content;
            existing.FileUrl = submission.FileUrl;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ============ GRADE SUBMISSION ============
        // PUT: api/submissions/{id}/grade
        // Teacher grades a submission
        [HttpPut("{id}/grade")]
        public async Task<IActionResult> GradeSubmission(int id, GradeRequest req)
        {
            var submission = await _context.Submissions.FindAsync(id);
            if (submission == null) return NotFound();

            var assignment = await _context.Assignments
                .FirstOrDefaultAsync(a => a.AssignmentId == submission.AssignmentId);

            if (assignment == null) return BadRequest("Assignment not found.");

            if (req.Score < 0 || req.Score > assignment.MaxPoints)
                return BadRequest($"Score must be between 0 and {assignment.MaxPoints}.");

            submission.Score = req.Score;
            submission.Feedback = req.Feedback;
            submission.Status = "graded";
            submission.GradedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ============ DELETE SUBMISSION ============
        // DELETE: api/submissions/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSubmission(int id)
        {
            var submission = await _context.Submissions.FindAsync(id);
            if (submission == null) return NotFound();

            _context.Submissions.Remove(submission);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    // DTO for grading
    public class GradeRequest
    {
        public decimal Score { get; set; }
        public string? Feedback { get; set; }
    }
}