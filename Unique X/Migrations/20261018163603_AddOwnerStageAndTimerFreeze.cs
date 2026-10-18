using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unique_X.Migrations
{
    /// <inheritdoc />
    public partial class AddOwnerStageAndTimerFreeze : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "TimerFrozenAt",
                table: "Leads",
                type: "datetime2",
                nullable: true);

            migrationBuilder.Sql("UPDATE Leads SET TimerFrozenAt = GETUTCDATE() WHERE LeadStatusId IN (7,8,18,28) AND IsUnassigned = 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TimerFrozenAt",
                table: "Leads");
        }
    }
}
