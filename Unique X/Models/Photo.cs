using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Unique_X.Models
{
    public class Photo
    {
        public int Id { get; set; }

        [Required]
        public string Url { get; set; } // رابط الصورة

        public string PublicId { get; set; } // ID الصورة عند Cloudinary (للحذف لاحقاً)

        public bool IsMain { get; set; } // هل هي الصورة الرئيسية للغلاف؟
        // ترتيب ظهور الصورة في الجاليري (الأصغر يظهر الأول) - بيتحدد بالـ drag & drop في فورم التعديل
        public int DisplayOrder { get; set; } = 0;

        public int PropertyId { get; set; }
        [JsonIgnore]
        public Property Property { get; set; }
    }
}
