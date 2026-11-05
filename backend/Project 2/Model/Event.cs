namespace Project_2.Model
{
    public class Event
    {
        public int EventId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime EventDate { get; set; }
        public string EventType { get; set; } = "school";   // holiday | exam | school
        public string? CreatedBy { get; set; }               // teacher_id, nullable (seeded events have none)
        public DateTime CreatedAt { get; set; }
    }
}
