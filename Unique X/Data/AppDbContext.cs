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

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // ==================================================
            // 2. تحسين الأداء (Performance Tuning & Indexes)
            // ==================================================

            // فهرس للسعر لتسريع الفلترة
            builder.Entity<Property>()
                .HasIndex(p => p.Price);

            // فهرس للمدينة لتسريع البحث
            builder.Entity<Property>()
                .HasIndex(p => p.City);

            // ==================================================
            // 3. ضبط العلاقات (Relationships)
            // ==================================================

            // علاقة العقار بالصور (One-to-Many)
            // عند حذف العقار -> تحذف جميع صوره تلقائياً (Cascade)
            builder.Entity<Property>()
                .HasMany(p => p.Photos)
                .WithOne(p => p.Property)
                .HasForeignKey(p => p.PropertyId)
                .OnDelete(DeleteBehavior.Cascade);

            // علاقة البروكر بالعقار (One-to-Many)
            // كل عقار له بروكر واحد
            builder.Entity<Property>()
                .HasOne(p => p.Broker)
                .WithMany() // لم نضف List<Property> في كلاس المستخدم (اختياري)
                .HasForeignKey(p => p.BrokerId)
                .OnDelete(DeleteBehavior.Restrict); // نستخدم Restrict لمنع حذف المستخدم إذا كان لديه عقارات (أو يمكن جعلها Cascade حسب رغبتك)

            // ==================================================
            // 4. ضبط أنواع البيانات (Data Types)
            // ==================================================

            // تأكيد دقة الأرقام العشرية للسعر (لضمان عدم حدوث مشاكل تقريب)
            builder.Entity<Property>()
                .Property(p => p.Price)
                .HasColumnType("decimal(18,2)");
        }
    }
}