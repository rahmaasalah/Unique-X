using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Unique_X.Models
{
    public class Property
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } // عنوان الإعلان

        [Required]
        public string Description { get; set; }

        [Column(TypeName = "decimal(18,2)")] // لتحديد دقة العملة
        public decimal Price { get; set; }

        public int Area { get; set; } // المساحة بالمتر
        public int Rooms { get; set; }
        public int Bathrooms { get; set; }

        [Required]
        public string City { get; set; } // القاهرة، الجيزة..
        public string Region { get; set; } // المعادي، التجمع..
        public string Address { get; set; }

        // Enum: 0 = Sale, 1 = Rent
        public int ListingType { get; set; }

        // Enum: 0 = Apartment, 1 = Villa, 2 = Office...
        public int PropertyType { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Foreign Key for Broker (User)
        public string BrokerId { get; set; }
        public ApplicantUser Broker { get; set; }

        // العلاقة مع الصور
        public ICollection<Photo> Photos { get; set; }
    }
}
