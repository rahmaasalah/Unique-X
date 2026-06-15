using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class AddJobApplication : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JobApplications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FullName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    City = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HasJob = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    WorkPlace = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HasLaptop = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    JobTitle = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EnglishLevel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CrmTools = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PastExperiences = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RealEstateBackground = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CompanyType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ZoneWorkedOn = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProjectPreparation = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    VisitSite = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DealsClosing = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SalesLastQuarter = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CvUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InterviewDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobApplications", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JobApplications");
        }
    }
}
