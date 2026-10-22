using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project_2.Data;
using Project_2.Dtos;
using Project_2.Model;

namespace Project_2.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AceDbContext _context;

        public AuthController(AceDbContext context)
        {
            _context = context;
        }

        // ============ UNIFIED LOGIN ============
        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest("Email and password are required.");

            // 1. Try student
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.Email == req.Email);

            if (student != null)
            {
                if (!student.IsActive) return Unauthorized("Account is deactivated.");
                if (!BCrypt.Net.BCrypt.Verify(req.Password, student.PasswordHash))
                    return Unauthorized("Invalid email or password.");

                return Ok(new AuthResponse
                {
                    Role = "student",
                    UserId = student.StudentId,
                    Email = student.Email,
                    FirstName = student.FirstName,
                    LastName = student.LastName,
                    Course = student.Course,
                    YearLevel = student.YearLevel,
                    Section = student.Section
                });
            }

            // 2. Try teacher
            var teacher = await _context.Teachers
                .FirstOrDefaultAsync(t => t.Email == req.Email);

            if (teacher != null)
            {
                if (!teacher.IsActive) return Unauthorized("Account is deactivated.");
                if (!BCrypt.Net.BCrypt.Verify(req.Password, teacher.PasswordHash))
                    return Unauthorized("Invalid email or password.");

                return Ok(new AuthResponse
                {
                    Role = "teacher",
                    UserId = teacher.TeacherId,
                    Email = teacher.Email,
                    FirstName = teacher.FirstName,
                    LastName = teacher.LastName,
                    Department = teacher.Department
                });
            }

            // 3. Not found
            return Unauthorized("Invalid email or password.");
        }

        // ============ UNIFIED REGISTER ============
        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req)
        {
            var role = (req.Role ?? "student").ToLower();

            if (role != "student" && role != "teacher")
                return BadRequest("Role must be 'student' or 'teacher'.");

            if (await _context.Students.AnyAsync(s => s.Email == req.Email)
                || await _context.Teachers.AnyAsync(t => t.Email == req.Email))
                return BadRequest("Email already registered.");

            if (role == "student")
            {
                if (await _context.Students.AnyAsync(s => s.StudentId == req.UserId))
                    return BadRequest("Student ID already exists.");

                var student = new Student
                {
                    StudentId = req.UserId,
                    Email = req.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
                    FirstName = req.FirstName,
                    LastName = req.LastName,
                    Course = req.Course,
                    YearLevel = req.YearLevel,
                    Section = req.Section,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Students.Add(student);
                await _context.SaveChangesAsync();

                return Ok(new AuthResponse
                {
                    Role = "student",
                    UserId = student.StudentId,
                    Email = student.Email,
                    FirstName = student.FirstName,
                    LastName = student.LastName,
                    Course = student.Course,
                    YearLevel = student.YearLevel,
                    Section = student.Section
                });
            }
            else // teacher
            {
                if (await _context.Teachers.AnyAsync(t => t.TeacherId == req.UserId))
                    return BadRequest("Teacher ID already exists.");

                var teacher = new Teacher
                {
                    TeacherId = req.UserId,
                    Email = req.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
                    FirstName = req.FirstName,
                    LastName = req.LastName,
                    Department = req.Department,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Teachers.Add(teacher);
                await _context.SaveChangesAsync();

                return Ok(new AuthResponse
                {
                    Role = "teacher",
                    UserId = teacher.TeacherId,
                    Email = teacher.Email,
                    FirstName = teacher.FirstName,
                    LastName = teacher.LastName,
                    Department = teacher.Department
                });
            }
        }
    }
}