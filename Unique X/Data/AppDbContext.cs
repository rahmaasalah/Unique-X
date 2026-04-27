using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Unique_X.Models;

namespace Unique_X.Data
{
    public class AppDbContext : IdentityDbContext<ApplicantUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Property> Properties { get; set; }
        public DbSet<Photo> Photos { get; set; }
        public DbSet<Wishlist> Wishlists { get; set; }
        public DbSet<HomeBanner> HomeBanners { get; set; }
        public DbSet<AnalyticsRecord> AnalyticsRecords { get; set; }
        public DbSet<PaymentPlan> PaymentPlans { get; set; }
        public DbSet<FinancialFile> FinancialFiles { get; set; }
        public DbSet<Lead> Leads { get; set; }
        public DbSet<LeadRequest> LeadRequests { get; set; }
        public DbSet<LeadActivity> LeadActivities { get; set; }
        public DbSet<LeadStatus> LeadStatuses { get; set; }
        public DbSet<Visit> Visits { get; set; }
        public DbSet<Campaign> Campaigns { get; set; }
        public DbSet<LeadStatusHistory> LeadStatusHistories { get; set; }


        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            

                builder.Entity<Property>()
                .HasIndex(p => p.Price);

            builder.Entity<Property>()
                .HasIndex(p => p.City);

           
            builder.Entity<Property>()
                .HasMany(p => p.Photos)
                .WithOne(p => p.Property)
                .HasForeignKey(p => p.PropertyId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Property>()
                .HasMany(p => p.PaymentPlans)
                .WithOne(p => p.Property)
                .HasForeignKey(p => p.PropertyId)
                .OnDelete(DeleteBehavior.Cascade);


            builder.Entity<Property>()
                .HasOne(p => p.Broker)
                .WithMany() 
                .HasForeignKey(p => p.BrokerId)
                .OnDelete(DeleteBehavior.Restrict); // نستخدم Restrict لمنع حذف المستخدم إذا كان لديه عقارات (أو يمكن جعلها Cascade حسب رغبتك)

            // ==================================================
            // 4. ضبط أنواع البيانات (Data Types)
            // ==================================================

            // تأكيد دقة الأرقام العشرية للسعر (لضمان عدم حدوث مشاكل تقريب)
            builder.Entity<Property>()
                .Property(p => p.Price)
                .HasColumnType("decimal(18,2)");

            builder.Entity<Property>().Property(p => p.MonthlyRent).HasColumnType("decimal(18,2)");
            builder.Entity<Property>().Property(p => p.SecurityDeposit).HasColumnType("decimal(18,2)");
            builder.Entity<PaymentPlan>().Property(p => p.DownPayment).HasColumnType("decimal(18,2)");
            builder.Entity<PaymentPlan>().Property(p => p.QuarterInstallment).HasColumnType("decimal(18,2)");

            builder.Entity<LeadRequest>().Property(lr => lr.MinBudget).HasColumnType("decimal(18,2)");
            builder.Entity<LeadRequest>().Property(lr => lr.MaxBudget).HasColumnType("decimal(18,2)");

            // ==================================================
            // إعدادات الـ Decimals الجديدة الخاصة بالـ CRM (Odoo Fields)
            // ==================================================
            builder.Entity<Lead>()
                .Property(l => l.ExpectedRevenue)
                .HasColumnType("decimal(18,2)");

            builder.Entity<Lead>()
                .Property(l => l.Probability)
                .HasColumnType("decimal(18,2)");

            builder.Entity<LeadRequest>()
                .Property(lr => lr.TotalAmount)
                .HasColumnType("decimal(18,2)");

            builder.Entity<LeadRequest>()
                .Property(lr => lr.DpAmount)
                .HasColumnType("decimal(18,2)");

            builder.Entity<LeadRequest>()
                .Property(lr => lr.InstallmentAmount)
                .HasColumnType("decimal(18,2)");

            // يفضل كمان نمنع مسح البروكر لو ماسك Leads (عشان الداتا ماتضربش)
            builder.Entity<Lead>()
                .HasOne(l => l.Broker)
                .WithMany()
                .HasForeignKey(l => l.BrokerId)
                .OnDelete(DeleteBehavior.Restrict);

        }
    }
}