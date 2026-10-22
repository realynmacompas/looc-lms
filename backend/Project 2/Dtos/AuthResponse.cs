namespace Project_2.Dtos
{
    public class AuthResponse
    {
        // Common
        public string Role { get; set; } = string.Empty;   // "student" | "teacher"
        public string UserId { get; set; } = string.Empty; // student_id or teacher_id
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;

        // Student-only (null for teachers)
        public string? Course { get; set; }
        public string? YearLevel { get; set; }
        public string? Section { get; set; }

        // Teacher-only (null for students)
        public string? Department { get; set; }
    }
}