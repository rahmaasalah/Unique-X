using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class villaspecs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AreaType",
                table: "Properties",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FirstBaths",
                table: "Properties",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FirstReception",
                table: "Properties",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FirstRooms",
                table: "Properties",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GroundBaths",
                table: "Properties",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GroundReception",
                table: "Properties",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GroundRooms",
                table: "Properties",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasGarden",
                table: "Properties",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasPool",
                table: "Properties",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "SecondBaths",
                table: "Properties",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SecondReception",
                table: "Properties",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SecondRooms",
                table: "Properties",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VillaCategory",
                table: "Properties",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VillaSubType",
                table: "Properties",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AreaType",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "FirstBaths",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "FirstReception",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "FirstRooms",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "GroundBaths",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "GroundReception",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "GroundRooms",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "HasGarden",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "HasPool",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "SecondBaths",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "SecondReception",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "SecondRooms",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "VillaCategory",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "VillaSubType",
                table: "Properties");
        }
    }
}
