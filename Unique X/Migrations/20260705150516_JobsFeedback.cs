using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class JobsFeedback : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "InterviewFeedbackAppearance",
                table: "JobApplications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InterviewFeedbackCommunication",
                table: "JobApplications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InterviewFeedbackExperienceInRE",
                table: "JobApplications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InterviewFeedbackGoal",
                table: "JobApplications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InterviewFeedbackKnowledge",
                table: "JobApplications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InterviewFeedbackLanguage",
                table: "JobApplications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InterviewFeedbackNotes",
                table: "JobApplications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InterviewFeedbackPastExperiences",
                table: "JobApplications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InterviewFeedbackPresentation",
                table: "JobApplications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InterviewFeedbackSalesProcess",
                table: "JobApplications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InterviewFeedbackWhyRealEstate",
                table: "JobApplications",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InterviewFeedbackAppearance",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "InterviewFeedbackCommunication",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "InterviewFeedbackExperienceInRE",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "InterviewFeedbackGoal",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "InterviewFeedbackKnowledge",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "InterviewFeedbackLanguage",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "InterviewFeedbackNotes",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "InterviewFeedbackPastExperiences",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "InterviewFeedbackPresentation",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "InterviewFeedbackSalesProcess",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "InterviewFeedbackWhyRealEstate",
                table: "JobApplications");
        }
    }
}
