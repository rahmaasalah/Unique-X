using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class verifycode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsVerified",
                table: "AspNetUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "VerificationCode",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsVerified",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "VerificationCode",
                table: "AspNetUsers");
        }
    }
}
