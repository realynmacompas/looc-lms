namespace Project_2.Model
{
    public class Material
    {
        public int MaterialId { get; set; }
        public int CourseId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Type { get; set; } = "link";        // pdf | video | link | doc | image
        public string Url { get; set; } = string.Empty;
        public string? UploadedBy { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
    }
}