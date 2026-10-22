using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Project_2.Migrations
{
    /// <inheritdoc />
    public partial class AddCompositeKeyToAttendance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_attendance",
                table: "attendance");

            migrationBuilder.AddPrimaryKey(
                name: "PK_attendance",
                table: "attendance",
                columns: new[] { "student_id", "date" });

            migrationBuilder.CreateTable(
                name: "teacher_attendance",
                columns: table => new
                {
                    date = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    teacher_id = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    full_name = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    time_in = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    time_out = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    task = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    journal = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_teacher_attendance", x => new { x.teacher_id, x.date });
                    table.ForeignKey(
                        name: "FK_teacher_attendance_teachers_teacher_id",
                        column: x => x.teacher_id,
                        principalTable: "teachers",
                        principalColumn: "teacher_id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "teacher_attendance");

            migrationBuilder.DropPrimaryKey(
                name: "PK_attendance",
                table: "attendance");

            migrationBuilder.AddPrimaryKey(
                name: "PK_attendance",
                table: "attendance",
                column: "student_id");
        }
    }
}
