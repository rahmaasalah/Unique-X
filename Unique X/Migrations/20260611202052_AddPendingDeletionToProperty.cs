using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class AddPendingDeletionToProperty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DeletionRejectionReason",
                table: "Properties",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletionRequestedAt",
                table: "Properties",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PendingDeletion",
                table: "Properties",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeletionRejectionReason",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "DeletionRequestedAt",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "PendingDeletion",
                table: "Properties");
        }
    }
}
