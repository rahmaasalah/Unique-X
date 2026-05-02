using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class ProjectsAndRegions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BuildingDate",
                table: "LeadRequests");

            migrationBuilder.DropColumn(
                name: "Compound",
                table: "LeadRequests");

            migrationBuilder.DropColumn(
                name: "Floor",
                table: "LeadRequests");

            migrationBuilder.RenameColumn(
                name: "ZoneInterested",
                table: "LeadRequests",
                newName: "SelectedRegions");

            migrationBuilder.RenameColumn(
                name: "UnitType",
                table: "LeadRequests",
                newName: "SelectedProjects");

            migrationBuilder.RenameColumn(
                name: "InstallmentAmount",
                table: "LeadRequests",
                newName: "InstallmentYears");

            migrationBuilder.RenameColumn(
                name: "DpAmount",
                table: "LeadRequests",
                newName: "DownPayment");

            migrationBuilder.AddColumn<int>(
                name: "ZoneId",
                table: "LeadRequests",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ZoneId",
                table: "LeadRequests");

            migrationBuilder.RenameColumn(
                name: "SelectedRegions",
                table: "LeadRequests",
                newName: "ZoneInterested");

            migrationBuilder.RenameColumn(
                name: "SelectedProjects",
                table: "LeadRequests",
                newName: "UnitType");

            migrationBuilder.RenameColumn(
                name: "InstallmentYears",
                table: "LeadRequests",
                newName: "InstallmentAmount");

            migrationBuilder.RenameColumn(
                name: "DownPayment",
                table: "LeadRequests",
                newName: "DpAmount");

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

            migrationBuilder.AddColumn<string>(
                name: "Floor",
                table: "LeadRequests",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
