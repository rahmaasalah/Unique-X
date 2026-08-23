using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class AddSearchLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SearchLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SearchTerm = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProjectName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    City = table.Column<int>(type: "int", nullable: true),
                    PropertyType = table.Column<int>(type: "int", nullable: true),
                    ListingType = table.Column<int>(type: "int", nullable: true),
                    MinPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    MaxPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    MinPricePerMeter = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    MaxPricePerMeter = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    MinRooms = table.Column<int>(type: "int", nullable: true),
                    MaxRooms = table.Column<int>(type: "int", nullable: true),
                    MinBathrooms = table.Column<int>(type: "int", nullable: true),
                    MaxBathrooms = table.Column<int>(type: "int", nullable: true),
                    MinFloor = table.Column<int>(type: "int", nullable: true),
                    MaxFloor = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SearchLogs", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SearchLogs");
        }
    }
}
