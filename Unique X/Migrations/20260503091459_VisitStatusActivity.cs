using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class VisitStatusActivity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BrokerPhone",
                table: "LeadActivities",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ListingType",
                table: "LeadActivities",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Project",
                table: "LeadActivities",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PropertyCode",
                table: "LeadActivities",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PropertyName",
                table: "LeadActivities",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Region",
                table: "LeadActivities",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ZoneId",
                table: "LeadActivities",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BrokerPhone",
                table: "LeadActivities");

            migrationBuilder.DropColumn(
                name: "ListingType",
                table: "LeadActivities");

            migrationBuilder.DropColumn(
                name: "Project",
                table: "LeadActivities");

            migrationBuilder.DropColumn(
                name: "PropertyCode",
                table: "LeadActivities");

            migrationBuilder.DropColumn(
                name: "PropertyName",
                table: "LeadActivities");

            migrationBuilder.DropColumn(
                name: "Region",
                table: "LeadActivities");

            migrationBuilder.DropColumn(
                name: "ZoneId",
                table: "LeadActivities");
        }
    }
}
