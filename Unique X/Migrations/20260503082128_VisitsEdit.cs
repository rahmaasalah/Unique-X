using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class VisitsEdit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PropertyId",
                table: "Visits");

            migrationBuilder.AddColumn<string>(
                name: "BrokerPhone",
                table: "Visits",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ListingType",
                table: "Visits",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Project",
                table: "Visits",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PropertyCode",
                table: "Visits",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PropertyName",
                table: "Visits",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Region",
                table: "Visits",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ZoneId",
                table: "Visits",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BrokerPhone",
                table: "Visits");

            migrationBuilder.DropColumn(
                name: "ListingType",
                table: "Visits");

            migrationBuilder.DropColumn(
                name: "Project",
                table: "Visits");

            migrationBuilder.DropColumn(
                name: "PropertyCode",
                table: "Visits");

            migrationBuilder.DropColumn(
                name: "PropertyName",
                table: "Visits");

            migrationBuilder.DropColumn(
                name: "Region",
                table: "Visits");

            migrationBuilder.DropColumn(
                name: "ZoneId",
                table: "Visits");

            migrationBuilder.AddColumn<int>(
                name: "PropertyId",
                table: "Visits",
                type: "int",
                nullable: true);
        }
    }
}
