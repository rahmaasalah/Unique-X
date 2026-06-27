using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class AddBlogsContents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ArticleSectionsJson",
                table: "Blogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Button1ImageUrl",
                table: "Blogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Button1Label",
                table: "Blogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Button2ImageUrl",
                table: "Blogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Button2Label",
                table: "Blogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Button3ImageUrl",
                table: "Blogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Button3Label",
                table: "Blogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FaqsJson",
                table: "Blogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MapEmbedUrl",
                table: "Blogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MasterPlanImageUrl",
                table: "Blogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentPlansJson",
                table: "Blogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PricePerMeterPrimary",
                table: "Blogs",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PricePerMeterResale",
                table: "Blogs",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProjectDetails",
                table: "Blogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SliderImages",
                table: "Blogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UnitIdsJson",
                table: "Blogs",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ArticleSectionsJson",
                table: "Blogs");

            migrationBuilder.DropColumn(
                name: "Button1ImageUrl",
                table: "Blogs");

            migrationBuilder.DropColumn(
                name: "Button1Label",
                table: "Blogs");

            migrationBuilder.DropColumn(
                name: "Button2ImageUrl",
                table: "Blogs");

            migrationBuilder.DropColumn(
                name: "Button2Label",
                table: "Blogs");

            migrationBuilder.DropColumn(
                name: "Button3ImageUrl",
                table: "Blogs");

            migrationBuilder.DropColumn(
                name: "Button3Label",
                table: "Blogs");

            migrationBuilder.DropColumn(
                name: "FaqsJson",
                table: "Blogs");

            migrationBuilder.DropColumn(
                name: "MapEmbedUrl",
                table: "Blogs");

            migrationBuilder.DropColumn(
                name: "MasterPlanImageUrl",
                table: "Blogs");

            migrationBuilder.DropColumn(
                name: "PaymentPlansJson",
                table: "Blogs");

            migrationBuilder.DropColumn(
                name: "PricePerMeterPrimary",
                table: "Blogs");

            migrationBuilder.DropColumn(
                name: "PricePerMeterResale",
                table: "Blogs");

            migrationBuilder.DropColumn(
                name: "ProjectDetails",
                table: "Blogs");

            migrationBuilder.DropColumn(
                name: "SliderImages",
                table: "Blogs");

            migrationBuilder.DropColumn(
                name: "UnitIdsJson",
                table: "Blogs");
        }
    }
}
