using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class AddLaunches : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Launches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Excerpt = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CoverImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Zone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProjectName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeveloperName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsPublished = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeliveryDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    SliderImages = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PricePerMeterResale = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    PricePerMeterPrimary = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Button1Label = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Button1ImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Button2Label = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Button2ImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Button3Label = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Button3ImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProjectDetails = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MapEmbedUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MasterPlanImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PaymentPlansJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ResaleUnitIdsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PrimaryUnitIdsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RentUnitIdsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DownPaymentPercentage = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    AvgDownPayment = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ArticleSectionsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FaqsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AdminPhone = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Launches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LaunchMeetingRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LaunchId = table.Column<int>(type: "int", nullable: false),
                    ProjectName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FullName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MeetingDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsContacted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LaunchMeetingRequests", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Launches");

            migrationBuilder.DropTable(
                name: "LaunchMeetingRequests");
        }
    }
}
