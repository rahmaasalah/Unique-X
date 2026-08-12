using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class AddArticles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Articles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Excerpt = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CoverImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CoverCaption = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    WrittenBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PublishedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsPublished = table.Column<bool>(type: "bit", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    VoiceUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Ad1Url = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Ad1Link = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Ad2Url = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Ad2Link = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Ad3Url = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Ad3Link = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Ad4Url = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Ad4Link = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Ad5Url = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Ad5Link = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SectionsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    KeywordsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Articles", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Articles");
        }
    }
}
