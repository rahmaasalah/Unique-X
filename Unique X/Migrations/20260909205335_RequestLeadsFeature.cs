using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class RequestLeadsFeature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BrokerLeadRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BrokerId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    SelectedCities = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ListingTypes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PropertyTypes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MinRooms = table.Column<int>(type: "int", nullable: true),
                    MaxRooms = table.Column<int>(type: "int", nullable: true),
                    MinBathrooms = table.Column<int>(type: "int", nullable: true),
                    MaxBathrooms = table.Column<int>(type: "int", nullable: true),
                    MinBudget = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    MaxBudget = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BrokerLeadRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BrokerLeadRequests_AspNetUsers_BrokerId",
                        column: x => x.BrokerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BrokerLeadRequests_BrokerId",
                table: "BrokerLeadRequests",
                column: "BrokerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BrokerLeadRequests");
        }
    }
}
