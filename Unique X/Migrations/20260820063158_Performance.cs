using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class Performance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Properties_IsActive_IsApproved_IsSold",
                table: "Properties",
                columns: new[] { "IsActive", "IsApproved", "IsSold" });

            migrationBuilder.CreateIndex(
                name: "IX_Properties_ListingType",
                table: "Properties",
                column: "ListingType");

            migrationBuilder.CreateIndex(
                name: "IX_Properties_PropertyType",
                table: "Properties",
                column: "PropertyType");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Properties_IsActive_IsApproved_IsSold",
                table: "Properties");

            migrationBuilder.DropIndex(
                name: "IX_Properties_ListingType",
                table: "Properties");

            migrationBuilder.DropIndex(
                name: "IX_Properties_PropertyType",
                table: "Properties");
        }
    }
}
