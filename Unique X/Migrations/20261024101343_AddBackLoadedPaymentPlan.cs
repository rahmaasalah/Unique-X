using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class AddBackLoadedPaymentPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AnnualAmount",
                table: "PaymentPlans",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "AnnualPercentage",
                table: "PaymentPlans",
                type: "decimal(5,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MonthlyAmount",
                table: "PaymentPlans",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MonthlyPercentage",
                table: "PaymentPlans",
                type: "decimal(5,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnnualAmount",
                table: "PaymentPlans");

            migrationBuilder.DropColumn(
                name: "AnnualPercentage",
                table: "PaymentPlans");

            migrationBuilder.DropColumn(
                name: "MonthlyAmount",
                table: "PaymentPlans");

            migrationBuilder.DropColumn(
                name: "MonthlyPercentage",
                table: "PaymentPlans");
        }
    }
}
