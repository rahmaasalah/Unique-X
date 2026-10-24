using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Unique_X.Helpers;
using Unique_X.Models;
using Unique_X.Models.Authorization;

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
        public DbSet<ProjectFinancialFile> ProjectFinancialFiles { get; set; }
        public DbSet<HotDeal> HotDeals { get; set; }
        public DbSet<RecommendedVisit> RecommendedVisits { get; set; }
        public DbSet<Lead> Leads { get; set; }
        public DbSet<LeadRequest> LeadRequests { get; set; }
        public DbSet<LeadActivity> LeadActivities { get; set; }
        public DbSet<LeadStatus> LeadStatuses { get; set; }
        public DbSet<Visit> Visits { get; set; }
        public DbSet<Campaign> Campaigns { get; set; }
        public DbSet<LeadStatusHistory> LeadStatusHistories { get; set; }
        public DbSet<JobApplication> JobApplications { get; set; }
        public DbSet<JobPosting> JobPostings { get; set; }
        public DbSet<Blog> Blogs { get; set; }
        public DbSet<LeadFavorite> LeadFavorites { get; set; }
        public DbSet<BrokerLeadRequest> BrokerLeadRequests { get; set; }

        public DbSet<Shortlist> Shortlists { get; set; }
        public DbSet<VisitList> VisitLists { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<LeadShownProperty> LeadShownProperties { get; set; }
        public DbSet<BrokerNotification> BrokerNotifications { get; set; }
        public DbSet<ProjectMeetingRequest> ProjectMeetingRequests { get; set; }
        public DbSet<Launch> Launches { get; set; }
        public DbSet<LaunchMeetingRequest> LaunchMeetingRequests { get; set; }
        public DbSet<HomeSectionBanner> HomeSectionBanners { get; set; }
        public DbSet<Developer> Developers { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<Region> Regions { get; set; }
        public DbSet<Article> Articles { get; set; }
        public DbSet<SearchLog> SearchLogs { get; set; }

        // 🟢 Authorization (Custom Roles)
        public DbSet<CustomRole> CustomRoles { get; set; }
        public DbSet<CustomRolePermission> CustomRolePermissions { get; set; }
        public DbSet<CustomRoleMember> CustomRoleMembers { get; set; }


        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // 🟢 Authorization (Custom Roles) relations
            builder.Entity<CustomRolePermission>()
                .HasOne(p => p.CustomRole)
                .WithMany(r => r.Permissions)
                .HasForeignKey(p => p.CustomRoleId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<CustomRoleMember>()
                .HasOne(m => m.CustomRole)
                .WithMany(r => r.Members)
                .HasForeignKey(m => m.CustomRoleId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<CustomRoleMember>()
                .HasOne(m => m.User)
                .WithMany()
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // مفيش تكرار لنفس البروكر جوه نفس الدور
            builder.Entity<CustomRoleMember>()
                .HasIndex(m => new { m.CustomRoleId, m.UserId })
                .IsUnique();

            // مفيش تكرار لنفس الصلاحية جوه نفس الدور
            builder.Entity<CustomRolePermission>()
                .HasIndex(p => new { p.CustomRoleId, p.PermissionKey })
                .IsUnique();

            // اسم الدور لازم يبقى فريد جوه نفس اللوحة (ممكن "Team Leader" يتكرر في Admin وCrm بس مش مرتين في Admin)
            builder.Entity<CustomRole>()
                .HasIndex(r => new { r.Dashboard, r.Name })
                .IsUnique();



            builder.Entity<Property>()
            .HasIndex(p => p.Price);

            builder.Entity<Property>()
                .HasIndex(p => p.City);

            // 🟢 Performance: كل بحث تقريبًا بيفلتر بالـ 3 حقول دول مع بعض (الوحدة نشطة/معتمدة/مش متباعة)،
            // فـ composite index بيسرّع الفلترة دي جدًا بدل full table scan في كل عملية بحث
            builder.Entity<Property>()
                .HasIndex(p => new { p.IsActive, p.IsApproved, p.IsSold });

            // 🟢 Performance: ListingType (Resale/Rent/Primary) و PropertyType و BrokerId
            // من أكتر الحقول اللي بيتفلتر بيها في البحث وصفحة My Properties وإعادة التعيين
            builder.Entity<Property>()
                .HasIndex(p => p.ListingType);

            builder.Entity<Property>()
                .HasIndex(p => p.PropertyType);

            // 🟢 Performance: Region و ProjectName بيتفلتر بيهم في البحث العادي وكمان في Lookalike Units
            // (بتجيب كل وحدة في نفس المنطقة/المشروع) - كانوا من غير index خالص يعني full table scan في كل مرة
            builder.Entity<Property>()
                .HasIndex(p => p.Region);

            builder.Entity<Property>()
                .HasIndex(p => p.ProjectName);

            // 🟢 الوحدة بتتعرض على نفس العميل مرة واحدة بس (والفيدباك بيتحدث على نفس السطر)
            builder.Entity<LeadShownProperty>()
                .HasIndex(s => new { s.LeadId, s.PropertyId })
                .IsUnique();



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
            builder.Entity<PaymentPlan>().Property(p => p.MonthlyAmount).HasColumnType("decimal(18,2)");
            builder.Entity<PaymentPlan>().Property(p => p.AnnualAmount).HasColumnType("decimal(18,2)");
            builder.Entity<PaymentPlan>().Property(p => p.MonthlyPercentage).HasColumnType("decimal(5,2)");
            builder.Entity<PaymentPlan>().Property(p => p.AnnualPercentage).HasColumnType("decimal(5,2)");

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
                .Property(lr => lr.DownPayment)
                .HasColumnType("decimal(18,2)");

            builder.Entity<LeadRequest>()
                .Property(lr => lr.InstallmentYears)
                .HasColumnType("decimal(18,2)");


            // يفضل كمان نمنع مسح البروكر لو ماسك Leads (عشان الداتا ماتضربش)
            builder.Entity<Lead>()
                .HasOne(l => l.Broker)
                .WithMany()
                .HasForeignKey(l => l.BrokerId)
                .OnDelete(DeleteBehavior.Restrict);

        }

        // ============================================================
        // 🟢 تجميد تراكر الـ Late / Too Late لما حالة العميل تدخل أو تخرج من الحالات المجمّدة
        // (Owner / Visit scheduled / Follow up after visit / Follow up for closing)
        //   - دخول حالة مجمّدة: التراكر بيقف عند الوقت اللي كان وصله (بدون تصفير)
        //   - خروج لحالة عادية: التراكر بيكمل من نفس المكان اللي وقف عنده
        //   - من حالة عادية لحالة عادية: زي الأول (أي أكشن بيصفّر التراكر)
        // الحساب هنا في SaveChanges عشان يشتغل مع كل الأماكن اللي بتغيّر LeadStatusId من غير ما نعدّل كل واحد فيهم
        // ============================================================
        private void ApplyLeadTimerFreeze()
        {
            ChangeTracker.DetectChanges();
            var now = DateTime.UtcNow;

            foreach (var entry in ChangeTracker.Entries<Lead>())
            {
                var lead = entry.Entity;

                if (entry.State == EntityState.Added)
                {
                    if (LeadTrackerHelper.IsFrozenStatus(lead.LeadStatusId))
                        lead.TimerFrozenAt = now;
                    continue;
                }

                if (entry.State != EntityState.Modified) continue;

                var statusProp = entry.Property(l => l.LeadStatusId);
                if (!statusProp.IsModified) continue;

                var oldId = statusProp.OriginalValue;
                var newId = statusProp.CurrentValue;
                if (oldId == newId) continue;

                bool wasFrozen = LeadTrackerHelper.IsFrozenStatus(oldId);
                bool willFreeze = LeadTrackerHelper.IsFrozenStatus(newId);
                if (!wasFrozen && !willFreeze) continue;

                var originalUpdatedAt = entry.Property(l => l.UpdatedAt).OriginalValue;
                var originalFrozenAt = entry.Property(l => l.TimerFrozenAt).OriginalValue;

                // الوقت اللي كان عدّى قبل تغيير الحالة دي (قبل ما الأكشن يصفّر UpdatedAt)
                var elapsed = TimeSpan.FromHours(
                    LeadTrackerHelper.ElapsedHours(originalUpdatedAt, lead.CreatedAt, now, originalFrozenAt));

                if (willFreeze)
                {
                    var frozenAt = originalFrozenAt ?? now;
                    lead.TimerFrozenAt = frozenAt;
                    lead.UpdatedAt = frozenAt - elapsed;
                }
                else
                {
                    lead.TimerFrozenAt = null;
                    lead.UpdatedAt = now - elapsed;
                }
            }
        }

        public override int SaveChanges(bool acceptAllChangesOnSuccess)
        {
            ApplyLeadTimerFreeze();
            return base.SaveChanges(acceptAllChangesOnSuccess);
        }

        public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
        {
            ApplyLeadTimerFreeze();
            return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        }
    }
}