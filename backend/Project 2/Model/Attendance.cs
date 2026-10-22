namespace Project_2.Model
{
    public class Attendance
    {
        public DateTime Date { get; set; }
        public string StudentId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public DateTime TimeIn { get; set; }
        public DateTime? TimeOut { get; set; }
        public string? Task { get; set; }
        public string? Journal { get; set; }

        // Navigation property - this attendance belongs to one student
        public Student? Student { get; set; }
    }
}