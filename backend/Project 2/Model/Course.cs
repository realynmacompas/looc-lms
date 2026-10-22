namespace Project_2.Model
{
    public class Course
    {
        public int CourseId { get; set; }                        // PK, auto-increment
        public string CourseCode { get; set; } = string.Empty;   // "CS101"
        public string CourseName { get; set; } = string.Empty;
        public string TeacherId { get; set; } = string.Empty;
        public string TeacherName { get; set; } = string.Empty;
        public int Units { get; set; } = 3;
        public string? Schedule { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}