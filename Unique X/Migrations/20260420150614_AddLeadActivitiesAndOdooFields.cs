using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class AddLeadActivitiesAndOdooFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ExpectedClosingDate",
                table: "Leads",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ExpectedRevenue",
                table: "Leads",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Probability",
                table: "Leads",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BuildingDate",
                table: "LeadRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Compound",
                table: "LeadRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DpAmount",
                table: "LeadRequests",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Floor",
                table: "LeadRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "InstallmentAmount",
                table: "LeadRequests",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalAmount",
                table: "LeadRequests",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UnitType",
                table: "LeadRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZoneInterested",
                table: "LeadRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LeadActivities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LeadId = table.Column<int>(type: "int", nullable: false),
                    ActivityType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Summary = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AssignedToId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDone = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeadActivities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LeadActivities_AspNetUsers_AssignedToId",
                        column: x => x.AssignedToId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LeadActivities_Leads_LeadId",
                        column: x => x.LeadId,
                        principalTable: "Leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LeadActivities_AssignedToId",
                table: "LeadActivities",
                column: "AssignedToId");

            migrationBuilder.CreateIndex(
                name: "IX_LeadActivities_LeadId",
                table: "LeadActivities",
                column: "LeadId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LeadActivities");

            migrationBuilder.DropColumn(
                name: "ExpectedClosingDate",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "ExpectedRevenue",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "Probability",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "BuildingDate",
                table: "LeadRequests");

            migrationBuilder.DropColumn(
                name: "Compound",
                table: "LeadRequests");

            migrationBuilder.DropColumn(
                name: "DpAmount",
                table: "LeadRequests");

            migrationBuilder.DropColumn(
                name: "Floor",
                table: "LeadRequests");

            migrationBuilder.DropColumn(
                name: "InstallmentAmount",
                table: "LeadRequests");

            migrationBuilder.DropColumn(
                name: "TotalAmount",
                table: "LeadRequests");

            migrationBuilder.DropColumn(
                name: "UnitType",
                table: "LeadRequests");

            migrationBuilder.DropColumn(
                name: "ZoneInterested",
                table: "LeadRequests");
        }
    }
}
