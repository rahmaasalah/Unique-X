using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class AddRecommendationAreaTimeline : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "MaxArea",
                table: "LeadRequests",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MinArea",
                table: "LeadRequests",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PurchaseTimeline",
                table: "LeadRequests",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxArea",
                table: "LeadRequests");

            migrationBuilder.DropColumn(
                name: "MinArea",
                table: "LeadRequests");

            migrationBuilder.DropColumn(
                name: "PurchaseTimeline",
                table: "LeadRequests");
        }
    }
}
