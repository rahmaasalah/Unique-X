using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class AddRentUnitsAndDownPaymentToBlog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AvgDownPayment",
                table: "Blogs",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DownPaymentPercentage",
                table: "Blogs",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RentUnitIdsJson",
                table: "Blogs",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvgDownPayment",
                table: "Blogs");

            migrationBuilder.DropColumn(
                name: "DownPaymentPercentage",
                table: "Blogs");

            migrationBuilder.DropColumn(
                name: "RentUnitIdsJson",
                table: "Blogs");
        }
    }
}
