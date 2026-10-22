namespace Project_2.Model
{
    public class Submission
    {
        public int SubmissionId { get; set; }
        public int AssignmentId { get; set; }
        public string StudentId { get; set; } = string.Empty;
        public string? Content { get; set; }
        public string? FileUrl { get; set; }
        public string Status { get; set; } = "submitted";  // submitted | graded | late
        public decimal? Score { get; set; }
        public string? Feedback { get; set; }
        public DateTime SubmittedAt { get; set; }
        public DateTime? GradedAt { get; set; }
    }
}