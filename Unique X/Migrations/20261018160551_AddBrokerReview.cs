using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class AddBrokerReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LeadId",
                table: "Reviews",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LeadShownProperties",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LeadId = table.Column<int>(type: "int", nullable: false),
                    PropertyId = table.Column<int>(type: "int", nullable: false),
                    ShownByBrokerId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ShownAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeadShownProperties", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LeadShownProperties_Leads_LeadId",
                        column: x => x.LeadId,
                        principalTable: "Leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LeadShownProperties_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LeadShownProperties_LeadId_PropertyId",
                table: "LeadShownProperties",
                columns: new[] { "LeadId", "PropertyId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LeadShownProperties_PropertyId",
                table: "LeadShownProperties",
                column: "PropertyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LeadShownProperties");

            migrationBuilder.DropColumn(
                name: "LeadId",
                table: "Reviews");
        }
    }
}
