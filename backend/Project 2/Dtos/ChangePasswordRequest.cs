namespace Project_2.Dtos
{
    public class ChangePasswordRequest
    {
        public string Role { get; set; } = string.Empty;        // "student" | "teacher"
        public string UserId { get; set; } = string.Empty;      // StudentId or TeacherId
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
