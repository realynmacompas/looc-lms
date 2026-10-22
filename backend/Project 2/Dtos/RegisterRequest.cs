namespace Project_2.Dtos
{
    public class RegisterRequest
    {
        // Required for both
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;

        // The user's ID — student_id OR teacher_id
        public string UserId { get; set; } = string.Empty;

        // Which role to register as
        public string Role { get; set; } = "student";  // "student" | "teacher"

        // ---------- Student-only (nullable) ----------
        public string? Course { get; set; }         // e.g. "BSIT"
        public string? YearLevel { get; set; }      // e.g. "1"
        public string? Section { get; set; }        // e.g. "A"

        // ---------- Teacher-only (nullable) ----------
        public string? Department { get; set; }     // e.g. "College of Computer Studies"
    }
}