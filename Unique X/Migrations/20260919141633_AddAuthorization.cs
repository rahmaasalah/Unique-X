using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthorization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CustomRoles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Dashboard = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CustomRoleMembers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CustomRoleId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomRoleMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomRoleMembers_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CustomRoleMembers_CustomRoles_CustomRoleId",
                        column: x => x.CustomRoleId,
                        principalTable: "CustomRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CustomRolePermissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CustomRoleId = table.Column<int>(type: "int", nullable: false),
                    PermissionKey = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomRolePermissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomRolePermissions_CustomRoles_CustomRoleId",
                        column: x => x.CustomRoleId,
                        principalTable: "CustomRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CustomRoleMembers_CustomRoleId_UserId",
                table: "CustomRoleMembers",
                columns: new[] { "CustomRoleId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CustomRoleMembers_UserId",
                table: "CustomRoleMembers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomRolePermissions_CustomRoleId_PermissionKey",
                table: "CustomRolePermissions",
                columns: new[] { "CustomRoleId", "PermissionKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CustomRoles_Dashboard_Name",
                table: "CustomRoles",
                columns: new[] { "Dashboard", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CustomRoleMembers");

            migrationBuilder.DropTable(
                name: "CustomRolePermissions");

            migrationBuilder.DropTable(
                name: "CustomRoles");
        }
    }
}
