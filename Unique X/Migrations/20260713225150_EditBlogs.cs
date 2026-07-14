using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class EditBlogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "UnitIdsJson",
                table: "Blogs",
                newName: "Zone");

            migrationBuilder.RenameColumn(
                name: "Category",
                table: "Blogs",
                newName: "ResaleUnitIdsJson");

            migrationBuilder.AddColumn<string>(
                name: "DeveloperName",
                table: "Blogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PrimaryUnitIdsJson",
                table: "Blogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProjectName",
                table: "Blogs",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeveloperName",
                table: "Blogs");

            migrationBuilder.DropColumn(
                name: "PrimaryUnitIdsJson",
                table: "Blogs");

            migrationBuilder.DropColumn(
                name: "ProjectName",
                table: "Blogs");

            migrationBuilder.RenameColumn(
                name: "Zone",
                table: "Blogs",
                newName: "UnitIdsJson");

            migrationBuilder.RenameColumn(
                name: "ResaleUnitIdsJson",
                table: "Blogs",
                newName: "Category");
        }
    }
}
