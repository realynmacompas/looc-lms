namespace Project_2.Model
{
    public class Teacher
    {
        public string TeacherId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Department { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }

        // Computed helper (not stored in DB)
        public string FullName => $"{FirstName} {LastName}".Trim();

        public ICollection<TeacherAttendance>? Attendances { get; set; }
    }
}