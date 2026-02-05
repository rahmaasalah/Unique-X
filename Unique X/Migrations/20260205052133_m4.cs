using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class m4 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_wishlists_AspNetUsers_UserId",
                table: "wishlists");

            migrationBuilder.DropForeignKey(
                name: "FK_wishlists_Properties_PropertyId",
                table: "wishlists");

            migrationBuilder.DropPrimaryKey(
                name: "PK_wishlists",
                table: "wishlists");

            migrationBuilder.RenameTable(
                name: "wishlists",
                newName: "Wishlists");

            migrationBuilder.RenameIndex(
                name: "IX_wishlists_UserId",
                table: "Wishlists",
                newName: "IX_Wishlists_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_wishlists_PropertyId",
                table: "Wishlists",
                newName: "IX_Wishlists_PropertyId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Wishlists",
                table: "Wishlists",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Wishlists_AspNetUsers_UserId",
                table: "Wishlists",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Wishlists_Properties_PropertyId",
                table: "Wishlists",
                column: "PropertyId",
                principalTable: "Properties",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Wishlists_AspNetUsers_UserId",
                table: "Wishlists");

            migrationBuilder.DropForeignKey(
                name: "FK_Wishlists_Properties_PropertyId",
                table: "Wishlists");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Wishlists",
                table: "Wishlists");

            migrationBuilder.RenameTable(
                name: "Wishlists",
                newName: "wishlists");

            migrationBuilder.RenameIndex(
                name: "IX_Wishlists_UserId",
                table: "wishlists",
                newName: "IX_wishlists_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_Wishlists_PropertyId",
                table: "wishlists",
                newName: "IX_wishlists_PropertyId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_wishlists",
                table: "wishlists",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_wishlists_AspNetUsers_UserId",
                table: "wishlists",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_wishlists_Properties_PropertyId",
                table: "wishlists",
                column: "PropertyId",
                principalTable: "Properties",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
