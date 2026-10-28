namespace Project_2.Model
{
    public class Student
    {
        // Primary key
        public string StudentId { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;

        public string? Course { get; set; }
        public string? YearLevel { get; set; }
        public string? Section { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }

        // Convenience (not mapped to DB)
        public string FullName => $"{FirstName} {LastName}".Trim();

    }
}