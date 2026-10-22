namespace Project_2.Model
{
    public class Enrollment
    {
        public int EnrollmentId { get; set; }
        public string StudentId { get; set; } = string.Empty;
        public int CourseId { get; set; }
        public string Status { get; set; } = "active";
        public decimal? FinalGrade { get; set; }
        public DateTime EnrolledAt { get; set; }

        // Navigation (optional for now, add later when needed)
        // public Student? Student { get; set; }
        // public Course? Course { get; set; }
    }
}