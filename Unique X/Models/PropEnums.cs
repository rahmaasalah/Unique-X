namespace Unique_X.Models
{
    public class PropEnums
    {
        public enum City
        {
            Cairo = 1,
            Alexandria = 2,
            NorthCoast = 3
        }

        public enum ListingType //category
        {
            Resale = 0,
            Rent = 1,
            Primary = 2,
            ResaleProject = 3
        }
        public enum FinishingType
        {
            CoreAndShell = 0,    // بدون تشطيب (طوب أحمر)
            SemiFinished = 1,    // نصف تشطيب
            FullyFinished = 2,   // تشطيب كامل
            SemiFurnished = 3,   // نصف مفروش
            FullyFurnished = 4    // مفروش بالكامل
        }

        public enum PropertyType //type
        {
            Apartment = 0,
            Villa = 1,
            Shop = 2,
            Office = 3,
            Chalet = 4,
            FullFloor = 5
        }
        public enum DeliveryStatus
        {
            Ready = 0,
            UnderConstruction = 1
        }

        public enum AreaType 
        { 
            LandArea = 0, 
            BuiltUpArea = 1 
        }
        public enum VillaCategory 
        { 
            Standalone = 0, 
            TwinHouse = 1, 
            TownHouse = 2, 
            TiesseraLower = 3, 
            TiesseraUpper = 4, 
            SkyVilla = 5 
        }
        public enum VillaType 
        { 
            Basement = 0, 
            Penthouse = 1 
        }
    }
}
