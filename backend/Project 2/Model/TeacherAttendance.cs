namespace Project_2.Model
{
    public class TeacherAttendance
    {
        public DateTime Date { get; set; }
        public string TeacherId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public DateTime TimeIn { get; set; }
        public DateTime? TimeOut { get; set; }
        public string? Task { get; set; }
        public string? Journal { get; set; }

        public Teacher? Teacher { get; set; }
    }
}