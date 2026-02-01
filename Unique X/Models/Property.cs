using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using static Unique_X.Models.PropEnums;

namespace Unique_X.Models
{
    public class Property
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } 

        [Required]
        public string Description { get; set; }

        [Column(TypeName = "decimal(18,2)")] 
        public decimal Price { get; set; }

        public int Area { get; set; } // المساحة بالمتر
        public int Rooms { get; set; }
        public int Bathrooms { get; set; }

        [Required]
        public City City { get; set; }
        public string Region { get; set; } // المعادي، التجمع..
        public string Address { get; set; }
        public ListingType ListingType { get; set; }
        public PropertyType PropertyType { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Foreign Key for Broker (User)
        public string BrokerId { get; set; }
        public ApplicantUser Broker { get; set; }

        // العلاقة مع الصور
        public ICollection<Photo> Photos { get; set; }
    }
}
