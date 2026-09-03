using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class AddAnswerJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Age",
                table: "JobApplications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AnswersJson",
                table: "JobApplications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "JobApplications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmploymentStatus",
                table: "JobApplications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HowHeard",
                table: "JobApplications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WhatsAppNumber",
                table: "JobApplications",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Age",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "AnswersJson",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "EmploymentStatus",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "HowHeard",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "WhatsAppNumber",
                table: "JobApplications");
        }
    }
}
