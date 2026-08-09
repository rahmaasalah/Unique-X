using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using static Unique_X.Models.PropEnums;

namespace Unique_X.Models
{
    // 🟢 نقل البيانات القديمة الهاردكودد (اللي كانت في PropertiesService.cs / add-property.ts)
    // لجداول Developers/Projects/Regions في الداتابيز، مرة واحدة بس لو الجداول لسه فاضية.
    // بعدها الإدارة كلها بتتم من صفحة Lookups في الـ admin dashboard.
    public static class DbSeeder
    {
        public static async Task SeedLookupsAsync(AppDbContext context)
        {
            // لو فيه بيانات بالفعل (يعني الـ Seed اتشغل قبل كده) منعملش حاجة
            if (await context.Developers.AnyAsync() || await context.Projects.AnyAsync() || await context.Regions.AnyAsync())
                return;

            // ---------- المطورين (كانت PrimaryAndDeveloperCodes) ----------
            var developerCodes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                {"Palm hills", "PH"}, {"Elsewhere", "EW"}, {"Orouba", "OR"}, {"Zinnia", "ZN"},
                {"Tasheed", "TD"}, {"Turkey", "TK"}, {"Add Group", "AG"}, {"Gamal Elghonimy", "CG"},
                {"Khames Elghonimy", "KG"}, {"Bunyan", "BY"}, {"The rise", "TR"}, {"Baron", "BN"},
                {"Mimary", "MR"}, {"Abo Zahra", "AZ"}, {"Al maram", "MA"}, {"Ivory", "IV"},
                {"Alforat", "AF"}, {"Abo Zahra \"Diva\"", "AZ"}, {"Elghonimy \"Saluga Elite\"", "KG"},
                {"Elghonimy \" Vee Club\"", "KG"}, {"Boulivard", "BV"}, {"Seif water front", "SWF"},
                {"Saudi Masria", "SM"}, {"Solik", "SK"}, {"First", "FT"}, {"Tabark", "TB"},
                {"Swag", "SG"}, {"Waf", "W"}, {"Elsedeky", "SD"}, {"Tegan, Eldawlia", "TG"},
                {"Jeran", "JN"}, {"Alexandria development", "AL"}, {"Darak", "DK"}, {"Saif", "SF"},
                {"Cleopatra", "CP"}, {"Jedar & Jawiria", "JW"}, {"Marsoum Development", "MS"},
                {"Marakez", "MAR"}, {"Madar", "MAD"}, {"Naia", "NAI"}, {"M Squared", "MS"},
                {"Tatweer Misr", "TM"}, {"Mezyan", "MZ"}, {"Hyde Park", "HP"}, {"Sodic", "SOD"},
                {"G Development", "GD"}, {"La Vista Ras", "LVR"}, {"Mabany Edris", "MBE"},
                {"Metso", "MET"}, {"Gates", "GAT"}, {"Mountain View", "MV"}, {"Misr Italia", "MI"},
                {"Hassan Allam", "HA"}, {"People", "PEO"}, {"Ahly Sabbour", "AS"}, {"Ara Bella", "AB"},
                {"Maven", "MAV"}, {"Marasem", "MAR1"}, {"Inertia", "INE"}, {"Idar", "IDA"},
                {"Il Cazar", "IC"}, {"Rreedy", "RRE"}, {"He", "HE"}, {"Starlight Development", "SD"},
                {"Emaar", "EMA"}, {"Akam El Rajhi", "AER"}, {"The Water Way", "TWW"}, {"Alqamzi", "ALQ"},
                {"Lavista", "LAV"}, {"La Sirena", "LAS"}, {"Tmg", "TMG"}, {"Roua", "ROU"},
                {"Q Development", "QD"}, {"Developer X", "DX"}, {"Serac", "SER"}, {"Egy Gab", "EG"},
                {"Location", "LOC"}, {"Memar Elmorshedy", "ME"}, {"LMD", "LMD"}, {"Ghazala Bay", "GB"},
                {"Modon", "MOD"}, {"New Generation", "NG"}, {"City Edge", "CE"}, {"Aldiwan", "ALD"},
                {"Hdp", "HDP"}, {"Code", "COD"}, {"Master", "MAS"}, {"J D", "JD"}, {"Mena Group", "MG"},
                {"Arabia", "ARA"}, {"Toledo", "TOL"}, {"Tharaa", "THA"}, {"Farag Amer", "FAG"}, {"Housing and Development bank", "HBD"},
                {"Saudi Egyptian Development", "SED"}
            };

            foreach (var kv in developerCodes)
            {
                context.Developers.Add(new Developer { Name = kv.Key, Code = kv.Value });
            }

            // ---------- مشاريع Primary (كانت في نفس PrimaryAndDeveloperCodes - الجزء الساحلي) ----------
            var primaryProjectCodes = new (string Name, string Code, City City)[]
            {
                ("Palm hills Alexandria", "PHA", City.Alexandria), ("The One", "TO", City.Alexandria), ("Skyline", "SL", City.Alexandria), ("East towers", "ET", City.Alexandria),
                ("Alex west", "AW", City.Alexandria), ("Valore Smouha", "VS", City.Alexandria), ("Valore Antoniadis", "VA", City.Alexandria), ("Muruj", "MJ", City.Alexandria),
                ("Sawari", "SW", City.Alexandria), ("Jackranda", "JK", City.Alexandria), ("Vida", "VD", City.Alexandria), ("Alsafwa", "AS", City.Alexandria), ("Abha hayat", "AH", City.Alexandria),
                ("Grand view", "GV", City.Alexandria), ("Crystal towers", "CT", City.Alexandria), ("Twin towers", "TT", City.Alexandria), ("Veranda", "VR", City.Alexandria),
                ("Jewar", "JR", City.Alexandria), ("Soly vie", "SV", City.Alexandria), ("San Stefano royals", "SSR", City.Alexandria), ("Cleopatra Plaza", "CP", City.Alexandria),
                ("Malaaz", "MZ", City.Alexandria), ("Smouha Gate", "SMG", City.Alexandria), ("Amwaj", "AM", City.Alexandria), ("Antoniades City", "AC", City.Alexandria),
                ("Oria City", "OC", City.Alexandria), ("Elite City", "EC", City.Alexandria), ("Ouruba Royals", "OR", City.Alexandria), ("Saraya Gardens", "SG", City.Alexandria),
                ("Alsafwa City", "AS", City.Alexandria), ("The Island", "TI", City.Alexandria), ("Telal", "TE", City.Alexandria), ("Creeks", "CK", City.Alexandria), ("Silver Sands", "SSN", City.Alexandria),

                ("Ramla", "RA", City.NorthCoast), ("Azha", "AZ", City.NorthCoast), ("Naia Bay", "NA", City.NorthCoast), ("El Masyaf", "EL", City.NorthCoast), ("Fouka Bay", "FO", City.NorthCoast),
                ("Remal", "RE", City.NorthCoast), ("Hacienda West", "HA", City.NorthCoast), ("Seashore", "SE", City.NorthCoast), ("Ogami", "OG", City.NorthCoast), ("Seashell Playa", "SEA", City.NorthCoast),
                ("La Vista Ras El Hikma", "LA", City.NorthCoast), ("Caesar", "CA", City.NorthCoast), ("Koun", "KO", City.NorthCoast), ("Caesar Bay", "CAE", City.NorthCoast), ("Lyv", "LY", City.NorthCoast),
                ("Mountain View Ras El Hikma", "MO", City.NorthCoast), ("Solare", "SO", City.NorthCoast), ("Swan Lake", "SW", City.NorthCoast), ("Seashell Ras El Hikma", "SA", City.NorthCoast),
                ("The Med", "TH", City.NorthCoast), ("Gaia", "GA", City.NorthCoast), ("June", "JU", City.NorthCoast), ("Direction White", "DI", City.NorthCoast), ("Cali Coast", "CAL", City.NorthCoast),
                ("Hacienda Waters", "HAC", City.NorthCoast), ("Mar Bay", "MA", City.NorthCoast), ("Jefaira", "JE", City.NorthCoast), ("Sea View", "SV", City.NorthCoast), ("Safia", "SAF", City.NorthCoast),
                ("Salt", "SAL", City.NorthCoast), ("Azzar Islands", "AZZ", City.NorthCoast), ("Saada North Coast", "SAA", City.NorthCoast), ("Katamya Coast", "KA", City.NorthCoast),
                ("Soul", "SOU", City.NorthCoast), ("Lvls", "LV", City.NorthCoast), ("Dose", "DO", City.NorthCoast), ("Seazen", "SZ", City.NorthCoast), ("La Vista Bay", "LAV", City.NorthCoast),
                ("La Vista Bay East", "LI", City.NorthCoast), ("Hacienda Blue", "HC", City.NorthCoast), ("D bay", "DB", City.NorthCoast), ("South Med", "SU", City.NorthCoast),
                ("Hacienda Red", "HI", City.NorthCoast), ("Hacienda White", "HE", City.NorthCoast), ("Q North", "QN", City.NorthCoast), ("SeaShell", "SS", City.NorthCoast),
                ("Bianchi Ilios", "BI", City.NorthCoast), ("Shamasi", "SH", City.NorthCoast), ("Masaya", "MAS", City.NorthCoast), ("Stella Heights", "ST", City.NorthCoast),
                ("Alura", "AL", City.NorthCoast), ("La vista Cascada", "LS", City.NorthCoast), ("Maraasi", "MAR", City.NorthCoast), ("Stella", "STE", City.NorthCoast),
                ("Diplo 3", "DIP", City.NorthCoast), ("Haceinda Bay", "HN", City.NorthCoast), ("Playa Ghazala", "PL", City.NorthCoast), ("Zoya", "ZO", City.NorthCoast),
                ("Zahra", "ZA", City.NorthCoast), ("Crysta", "CR", City.NorthCoast), ("Plage", "PLA", City.NorthCoast), ("Lagoons", "LAG", City.NorthCoast), ("Alma", "ALM", City.NorthCoast),
                ("IL Latini", "IL", City.NorthCoast), ("Downtown", "DOW", City.NorthCoast), ("Plam Hills North Coast", "PA", City.NorthCoast), ("Mazarine", "MAZ", City.NorthCoast),
                ("Golf Porto Marina", "GPM", City.NorthCoast), ("Marina 1", "MR1", City.NorthCoast), ("Marina 2", "MR2", City.NorthCoast), ("Marina 3", "MR3", City.NorthCoast),
                ("Marina 4", "MR4", City.NorthCoast), ("Marina 5", "MR5", City.NorthCoast), ("Marina 6", "MR6", City.NorthCoast), ("Marina 7", "MR7", City.NorthCoast), ("Marina 8", "MR8", City.NorthCoast),
                ("Viller", "VI", City.NorthCoast), ("North Code", "NO", City.NorthCoast), ("Wanas Master", "WA", City.NorthCoast), ("London", "LON", City.NorthCoast), ("Ajaza", "AGZ", City.NorthCoast), ("Youd", "YD", City.NorthCoast),
                ("Eko Mena", "EK", City.NorthCoast), ("Bungalows", "BU", City.NorthCoast), ("Layana", "LAY", City.NorthCoast), ("Glee", "GL", City.NorthCoast), ("Ras Al-Hekma", "RH", City.NorthCoast), ("Hacienda Ras Al-Hekma", "HCR", City.NorthCoast), ("Dayz", "DZ", City.NorthCoast)
            };

            foreach (var p in primaryProjectCodes)
            {
                context.Projects.Add(new Project { Name = p.Name, Code = p.Code, Type = ProjectListingType.Primary, City = p.City });
            }

            // ---------- مشاريع Resale الإسكندرية (كانت ResaleProjectIds) ----------
            var resaleProjectIds = new (string Name, string Code)[]
            {
                ("Sawari", "1"), ("Muruj", "2"), ("Palm hills Alexandria", "3"), ("The one", "4"), ("Alex west", "5"),
                ("Skyline", "6"), ("Grand view", "7"), ("Antoniades City", "8"), ("Valore Antoniadis", "9"),
                ("Valore Smouha", "10"), ("Jewar", "11"), ("Crystal Towers", "12"), ("Twin Towers", "13"),
                ("East Towers", "14"), ("Saraya Gardens", "15"), ("Veranda", "16"), ("Jackranda", "17"),
                ("Oria City", "18"), ("Elite City", "19"), ("Vida", "20"), ("Abha Hayat", "21"),
                ("Ouruba Royals", "22"), ("Soly Vie", "23"), ("San Stefano Royals", "24"), ("Malaaz", "25"),
                ("Smouha Gate", "26")
            };

            foreach (var p in resaleProjectIds)
            {
                context.Projects.Add(new Project { Name = p.Name, Code = p.Code, Type = ProjectListingType.Resale, City = City.Alexandria });
            }

            // ---------- مناطق الإسكندرية (كانت ResaleZoneIds) ----------
            var resaleZoneIds = new (string Name, string ZoneCode)[]
            {
                ("Abu Qir", "1"), ("Al-Maamoura", "2"), ("Al-zawaida", "4"), ("Khurshid", "5"), ("Al-Maraghi", "6"),
                ("Bahary", "7"), ("El-Mandara-kebly", "8"), ("Al-Manshiyya", "9"), ("Bashair al-khayr", "11"),
                ("Al-Agamy", "13"), ("Al-Baytash", "14"), ("Al-Hanovil", "15"), ("Al-Dakhila", "16"), ("October", "17"),
                ("Al-Amiriya", "20"), ("Borj Al-Arab", "21"), ("Sidi Bishr", "23"), ("Al-Aasafirah-45", "24"),
                ("Al-Aasafirah-bahary", "25"), ("Al-Aasafirah-30", "26"), ("Janaklis", "32"), ("San Stefano", "33"),
                ("Fleming", "34"), ("Shods", "35"), ("Al-Suyuf", "39"), ("Bakus", "40"), ("Bolkley", "41"),
                ("Roshdy", "42"), ("Zizinia", "43"), ("Kafr Abdo", "45"), ("Cleopatra", "46"), ("Sporting", "47"),
                ("Sidi Gaber", "48"), ("Camp Schésar", "49"), ("Al-Shatibi", "50"), ("Al-Azariṭa", "51"),
                ("Mahattah al-raml", "52"), ("Al-Saraya", "53"), ("Muharram Bik", "56"), ("Al-Hadra", "57"),
                ("Miamy", "59"), ("Abo solaiman", "60"), ("Falaky", "61"), ("Al-Aasafirah-kebly", "62"),
                ("Smouha", "63"), ("scot", "64"), ("Mahattat Misr", "66"), ("Al-Ibrahimiya", "67"),
                ("Moustafa Kamel", "68"), ("Loran", "69"), ("Al-luban", "70"), ("Victoria", "71"),
                ("Gliem", "72"), ("Wabur al-miyah", "73"), ("Karmouz", "74"), ("Stanly", "76"),
                ("Al-Aawaid", "77"), ("salah Salem", "78"), ("Hajar al-nawatih", "79"), ("Al-Montaza", "80"),
                ("Al-Hedaya", "81"), ("Wenget", "82"), ("Road", "83"), ("Abis", "84"), ("Al-Hurriya", "85"),
                ("Sultan Hussein", "86"), ("Kubri al-namus", "87"), ("Mohammed Naguib", "88"),
                ("Al-Mahmoudia", "90"), ("Saba Basha", "91"), ("El-Mandara-bahary", "92"), ("Marina", "93"),
                ("Tharwat", "94"), ("Elshalalat", "95"), ("Green Plaza", "96"), ("King Mariout", "97")
            };

            foreach (var r in resaleZoneIds)
            {
                context.Regions.Add(new Region { Name = r.Name, ZoneCode = r.ZoneCode, City = City.Alexandria });
            }

            // ---------- مناطق القاهرة والساحل الشمالي (مفيش ليها ZoneCode أصلاً، كانت مجرد أسماء في الفرونت) ----------
            var cairoRegions = new[] { "Sheikh Zayed", "Green belt", "6th of October", "North Expansions", "October Gardens", "Eastern Expansions", "New Cairo" };
            foreach (var name in cairoRegions)
            {
                context.Regions.Add(new Region { Name = name, City = City.Cairo });
            }

            var northCoastRegions = new[] { "Al-Dabaa", "Sidi Abdulrahman", "Ghazala Bay", "Al-Alamin", "Sidi Henish", "Sahel", "Ras Al Hekma" };
            foreach (var name in northCoastRegions)
            {
                context.Regions.Add(new Region { Name = name, City = City.NorthCoast });
            }

            await context.SaveChangesAsync();
        }
    }
}