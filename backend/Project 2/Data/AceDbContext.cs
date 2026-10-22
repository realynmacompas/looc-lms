using Microsoft.EntityFrameworkCore;
using Project_2.Model;

namespace Project_2.Data
{
    public class AceDbContext : DbContext
    {
        public AceDbContext(DbContextOptions<AceDbContext> options)
            : base(options)
        {
        }

        public DbSet<Attendance> Attendance { get; set; }
        public DbSet<Student> Students { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Enrollment> Enrollments { get; set; }
        public DbSet<Material> Materials { get; set; }
        public DbSet<Assignment> Assignments { get; set; }
        public DbSet<Submission> Submissions { get; set; }
        public DbSet<Teacher> Teachers { get; set; }
        public DbSet<TeacherAttendance> TeacherAttendance { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ============ ATTENDANCE ============
            modelBuilder.Entity<Attendance>(entity =>
            {
                entity.ToTable("attendance");
                entity.HasKey(e => new { e.StudentId, e.Date });

                entity.Property(e => e.Date).HasColumnName("date").IsRequired();
                entity.Property(e => e.StudentId).HasColumnName("student_id").HasMaxLength(45).IsRequired();
                entity.Property(e => e.FullName).HasColumnName("full_name").HasMaxLength(255).IsRequired();
                entity.Property(e => e.TimeIn).HasColumnName("time_in").IsRequired();
                entity.Property(e => e.TimeOut).HasColumnName("time_out").IsRequired(false);
                entity.Property(e => e.Task).HasColumnName("task").HasMaxLength(45).IsRequired(false);
                entity.Property(e => e.Journal).HasColumnName("journal").HasMaxLength(45).IsRequired(false);

                entity.HasOne(e => e.Student)
                    .WithMany(s => s.Attendances)
                    .HasForeignKey(e => e.StudentId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ============ STUDENTS ============
            modelBuilder.Entity<Student>(entity =>
            {
                entity.ToTable("students");
                entity.HasKey(e => e.StudentId);

                entity.Property(e => e.StudentId).HasColumnName("student_id").HasMaxLength(45).IsRequired();
                entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.PasswordHash).HasColumnName("password_hash").HasMaxLength(255).IsRequired();
                entity.Property(e => e.FirstName).HasColumnName("first_name").HasMaxLength(100).IsRequired();
                entity.Property(e => e.LastName).HasColumnName("last_name").HasMaxLength(100).IsRequired();
                entity.Property(e => e.Course).HasColumnName("course").HasMaxLength(100).IsRequired(false);
                entity.Property(e => e.YearLevel).HasColumnName("year_level").HasMaxLength(20).IsRequired(false);
                entity.Property(e => e.Section).HasColumnName("section").HasMaxLength(20).IsRequired(false);
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Ignore(e => e.FullName);
            });

            // ============ COURSES ============
            modelBuilder.Entity<Course>(entity =>
            {
                entity.ToTable("courses");
                entity.HasKey(e => e.CourseId);

                entity.Property(e => e.CourseId).HasColumnName("course_id");
                entity.Property(e => e.CourseCode).HasColumnName("course_code").HasMaxLength(20).IsRequired();
                entity.HasIndex(e => e.CourseCode).IsUnique();
                entity.Property(e => e.CourseName).HasColumnName("course_name").HasMaxLength(255).IsRequired();
                entity.Property(e => e.TeacherId).HasColumnName("teacher_id").HasMaxLength(45).IsRequired();
                entity.Property(e => e.TeacherName).HasColumnName("teacher_name").HasMaxLength(255).IsRequired();
                entity.Property(e => e.Units).HasColumnName("units").HasDefaultValue(3);
                entity.Property(e => e.Schedule).HasColumnName("schedule").HasMaxLength(255).IsRequired(false);
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // ============ ENROLLMENTS ============
            modelBuilder.Entity<Enrollment>(entity =>
            {
                entity.ToTable("enrollments");
                entity.HasKey(e => e.EnrollmentId);

                entity.Property(e => e.EnrollmentId).HasColumnName("enrollment_id");
                entity.Property(e => e.StudentId).HasColumnName("student_id").HasMaxLength(45).IsRequired();
                entity.Property(e => e.CourseId).HasColumnName("course_id").IsRequired();
                entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).HasDefaultValue("active");
                entity.Property(e => e.FinalGrade).HasColumnName("final_grade").HasPrecision(5, 2).IsRequired(false);
                entity.Property(e => e.EnrolledAt).HasColumnName("enrolled_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasIndex(e => new { e.StudentId, e.CourseId }).IsUnique();

                entity.HasOne<Student>()
                    .WithMany()
                    .HasForeignKey(e => e.StudentId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<Course>()
                    .WithMany()
                    .HasForeignKey(e => e.CourseId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ============ MATERIALS ============
            modelBuilder.Entity<Material>(entity =>
            {
                entity.ToTable("materials");
                entity.HasKey(e => e.MaterialId);

                entity.Property(e => e.MaterialId).HasColumnName("material_id");
                entity.Property(e => e.CourseId).HasColumnName("course_id").IsRequired();
                entity.Property(e => e.Title).HasColumnName("title").HasMaxLength(255).IsRequired();
                entity.Property(e => e.Description).HasColumnName("description").HasColumnType("TEXT").IsRequired(false);
                entity.Property(e => e.Type).HasColumnName("type").HasMaxLength(20).HasDefaultValue("link");
                entity.Property(e => e.Url).HasColumnName("url").HasMaxLength(500).IsRequired();
                entity.Property(e => e.UploadedBy).HasColumnName("uploaded_by").HasMaxLength(45).IsRequired(false);
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne<Course>()
                    .WithMany()
                    .HasForeignKey(e => e.CourseId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ============ ASSIGNMENTS ============
            modelBuilder.Entity<Assignment>(entity =>
            {
                entity.ToTable("assignments");
                entity.HasKey(e => e.AssignmentId);

                entity.Property(e => e.AssignmentId).HasColumnName("assignment_id");
                entity.Property(e => e.CourseId).HasColumnName("course_id").IsRequired();
                entity.Property(e => e.Title).HasColumnName("title").HasMaxLength(255).IsRequired();
                entity.Property(e => e.Description).HasColumnName("description").HasColumnType("TEXT").IsRequired(false);
                entity.Property(e => e.DueDate).HasColumnName("due_date").IsRequired(false);
                entity.Property(e => e.MaxPoints).HasColumnName("max_points").HasDefaultValue(100);
                entity.Property(e => e.AttachmentUrl).HasColumnName("attachment_url").HasMaxLength(500).IsRequired(false);
                entity.Property(e => e.CreatedBy).HasColumnName("created_by").HasMaxLength(45).IsRequired(false);
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne<Course>()
                    .WithMany()
                    .HasForeignKey(e => e.CourseId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ============ SUBMISSIONS ============
            modelBuilder.Entity<Submission>(entity =>
            {
                entity.ToTable("submissions");   // ← FIXED: plural, matches DB
                entity.HasKey(e => e.SubmissionId);

                entity.Property(e => e.SubmissionId).HasColumnName("submission_id");
                entity.Property(e => e.AssignmentId).HasColumnName("assignment_id").IsRequired();
                entity.Property(e => e.StudentId).HasColumnName("student_id").HasMaxLength(45).IsRequired();
                entity.Property(e => e.Content).HasColumnName("content").HasColumnType("TEXT").IsRequired(false);
                entity.Property(e => e.FileUrl).HasColumnName("file_url").HasMaxLength(500).IsRequired(false);
                entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).HasDefaultValue("submitted");
                entity.Property(e => e.Score).HasColumnName("score").HasPrecision(5, 2).IsRequired(false);
                entity.Property(e => e.Feedback).HasColumnName("feedback").HasColumnType("TEXT").IsRequired(false);
                entity.Property(e => e.SubmittedAt).HasColumnName("submitted_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.GradedAt).HasColumnName("graded_at").IsRequired(false);

                entity.HasIndex(e => new { e.AssignmentId, e.StudentId }).IsUnique();

                entity.HasOne<Assignment>()
                    .WithMany()
                    .HasForeignKey(e => e.AssignmentId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<Student>()
                    .WithMany()
                    .HasForeignKey(e => e.StudentId)
                    .OnDelete(DeleteBehavior.Cascade);

                // ============ TEACHERS ============
                modelBuilder.Entity<Teacher>(entity =>
                {
                    entity.ToTable("teachers");
                    entity.HasKey(e => e.TeacherId);
                    entity.Property(e => e.TeacherId).HasColumnName("teacher_id").HasMaxLength(45).IsRequired();
                    entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
                    entity.HasIndex(e => e.Email).IsUnique();
                    entity.Property(e => e.PasswordHash).HasColumnName("password_hash").HasMaxLength(255).IsRequired();
                    entity.Property(e => e.FirstName).HasColumnName("first_name").HasMaxLength(100).IsRequired();
                    entity.Property(e => e.LastName).HasColumnName("last_name").HasMaxLength(100).IsRequired();
                    entity.Property(e => e.Department).HasColumnName("department").HasMaxLength(100).IsRequired(false);
                    entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                    entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                    entity.Ignore(e => e.FullName);
                });

                // ============ TEACHER ATTENDANCE ============
                modelBuilder.Entity<TeacherAttendance>(entity =>
                {
                    entity.ToTable("teacher_attendance");
                    entity.HasKey(e => new { e.TeacherId, e.Date });

                    entity.Property(e => e.Date).HasColumnName("date").IsRequired();
                    entity.Property(e => e.TeacherId).HasColumnName("teacher_id").HasMaxLength(45).IsRequired();
                    entity.Property(e => e.FullName).HasColumnName("full_name").HasMaxLength(255).IsRequired();
                    entity.Property(e => e.TimeIn).HasColumnName("time_in").IsRequired();
                    entity.Property(e => e.TimeOut).HasColumnName("time_out").IsRequired(false);
                    entity.Property(e => e.Task).HasColumnName("task").HasMaxLength(45).IsRequired(false);
                    entity.Property(e => e.Journal).HasColumnName("journal").HasMaxLength(45).IsRequired(false);

                    entity.HasOne(e => e.Teacher)
                        .WithMany(t => t.Attendances)
                        .HasForeignKey(e => e.TeacherId)
                        .OnDelete(DeleteBehavior.Cascade);
               
            });
            });
        }
    }
}