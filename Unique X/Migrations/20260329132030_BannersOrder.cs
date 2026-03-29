using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class BannersOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                table: "HomeBanners",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                table: "HomeBanners");
        }
    }
}
