using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class EditRequestWithCRM : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxBathrooms",
                table: "LeadRequests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxRooms",
                table: "LeadRequests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MinBathrooms",
                table: "LeadRequests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MinRooms",
                table: "LeadRequests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SelectedCities",
                table: "LeadRequests",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxBathrooms",
                table: "LeadRequests");

            migrationBuilder.DropColumn(
                name: "MaxRooms",
                table: "LeadRequests");

            migrationBuilder.DropColumn(
                name: "MinBathrooms",
                table: "LeadRequests");

            migrationBuilder.DropColumn(
                name: "MinRooms",
                table: "LeadRequests");

            migrationBuilder.DropColumn(
                name: "SelectedCities",
                table: "LeadRequests");
        }
    }
}
