import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup,FormArray, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PropertyService } from '../../Services/property';
import { AlertService } from '../../Services/alert';

function minAmountValidator(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const currentAmount = Number(control.value.toString().replace(/,/g, ''));
    return currentAmount < min ? { 'min': true } : null;
  };
}

@Component({
  selector: 'app-edit-property',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-property.html'
})
export class EditPropertyComponent implements OnInit {
  editForm!: FormGroup;
  propertyId!: number;
  selectedFiles: File[] = [];
  existingPhotos = signal<any[]>([]);
  selectedPhotos = signal<{ file: File, preview: string, originalFile: File, originalPreview: string, isWatermarked: boolean }[]>([]);
newMainPhotoIndex: number | null = null;
currentYear = new Date().getFullYear();
isSubmitting = false;

currentPrefix: string = '';

  regionsMapping: any = {
  1: ['Sheikh Zayed', 'Green belt', '6th of October', 'North Expansions', 'October Gardens', 'Eastern Expansions', 'New Cairo'], // Cairo
  2: [
    'Zizinia', 'Janaklis', 'Gliem', 'Fleming', 'San Stefano', 'Shods', 
    'Elshalalat', 'Wabur al-miyah', 'Al-Ibrahimiya', 'Al-Manshiyya', 
    'Camp Schésar', 'Muharram Bik', 'Mahattat Misr', 'Cleopatra', 
    'Al-Azariṭa', 'Al-Shatibi', 'Saba Basha', 'Sidi Gaber', 'Roshdy', 
    'Bolkley', 'Moustafa Kamel', 'Kafr Abdo', 'Stanly', 'Sidi Bishr',
    'El-Mandara-kebly', 'El-Mandara-bahary', 'Al-Suyuf', 'Victoria', 'Al-Aasafirah-kebly', 'Al-Aasafirah-bahary', 'Al-Aasafirah-30', 'Al-Aasafirah-45', 'Al-Maamoura', 
    'Smouha', 'Borj Al-Arab', 'Loran', 
    'Al-Agamy', 'King Mariout', 'Abu Qir', 'Al-zawaida', 'Khurshid', 'Al-Maraghi', 'Bahary', 'Bashair al-khayr', 'Al-Baytash', 'Al-Hanovil',
    'Al-Dakhila', 'Al-Amiriya', 'Bakus', 'Sporting', 'Mahattah al-raml', 'Al-Saraya', 'Al-Hadra', 'Miamy', 'Abo solaiman', 'Falaky',
    'Al-luban', 'Karmouz', 'Al-Aawaid', 'Hajar al-nawatih', 'Tharwat', 'Mohammed Naguib', 'Green Plaza', 'Al-Montaza', 'Al-Hedaya', 'Wenget',
    'Abis', 'Al-Hurriya', 'Sultan Hussein', 'Kubri al-namus', 'Al-Mahmoudia'
  ], // Alexandria
  3: ['Al-Dabaa', 'Sidi Abdulrahman', 'Ghazala Bay', 'Al-Alamin', 'Sahel', 'Ras Al Hekma'] // North Coast
};

filteredRegions: string[] = [];


projectsMapping: any = {
  1: { // Cairo
    'Sheikh Zayed' : ['Village West-Dorra', 'Elkarma Kay', 'Zed West-Ora', 'Skyramp-Upwyde', 'La Colina-Capital Hills', 'Ivoire West-Pre', 'Etapa-City Edge', 'Allegria-Sodic', 'Westown-Sodic', ' Bura Residence-Kafafy', 'Terrace-Hdp', '205-Arkan Palm', 'Elite West-Taj', 'Bliss Gate-Torec', 'The Harv-Dal', 'Genova West-Eastren', 'Jazal-Legacy Estates', 'Bahja-Symphony', 'Coy-Voya', 'Lien-Elysium', 'Belva-Karnak', 'Rovan-Epd', 'Guira-Kaia', 'Pavia-Taj', 'Cloudside-Hills', 'Civ West-Civilia', 'Bona Nova-Ad', 'Levent-El Diwanya', 'White Residence-Pledge', 'La Quinta-Rhd', 'Calma-Leaders', 'Via-Eagles', 'D.Mile-District 4', 'Zia Park-Hills', 'Rewaya-Siac', 'Rouh Zayed-Al Amaken'],
    'Green belt' : ['One 50 El-Gabry','Zg2-Zg','Montania Park-Everst View','T pearl-Torec','Novella-Al Karma','Stay-Zg','Tabah West-Zg','Upove-Contact','Zayard Elite-Palmier','El Patio Vera-La Vista','Levels-Duens', 'West End','Green Plaza', 'Vert-Palmier','S7n Shades-Zg', 'Yuva-Urban Edge', 'Lake West 5-Cairo Capital', 'Menorca-Mardev', 'Montania Gardens', 'Lake West 4-Cairo Capital', 'Montania-Everst view','Ira-El Gabry', 'The 8-El Gabry', 'West Line-Living Lines', 'Isola Villas-El Masria', 'Ladera Heights-Merath','Roudy-Zaya', 'Parkwoods-Malvern', 'Solimar', 'Moon Hills 5-Sakan', 'Ladera Rose-Merath', 'Kings Way-Mountain View'],
    '6th of October' : ['Ever-Cred', 'O/Nine-Miqqat','Jazebeya-Upwyde', 'Pyramids City 5', 'West Clay-Remal', 'Stay`n-A plus', 'Hayah-Jawad'],
    'North Expansions' : ['Rafts-The Ark', 'Elm Tree-Elm', 'One 33-Badreldin', 'Westdays-Ilcazar', 'ICity-Mountain View', 'October Plaza-Sodic', 'Diar 2-Tameer', 'Kayan-Badreldin', 'Nyoum October-Adh', 'Boulevard Hiils-Al Amar', 'Azalea-Egy Dev', 'Abha-Srd', 'Rayat-Malaz', 'Villaria-Mirad', 'M Apartments-Mirad', 'Murooj'],
    'October Gardens' : ['kite-Centrada', ' Belong-Centrada', 'Aqmar-Kayan', 'Tesla Residence-Tesla', 'Flw-Zg', 'Darvell-White Eagle', 'Tabeaa-Nasdaq', 'O west-Orascom', 'Ashgar City-Igi', 'River-West Way', 'Rock Eden-El Batal', 'Ixora-Jora', 'Westera-Kastorai', 'Seven-Harby', 'Sun Capital-Arabia Holding', 'Zat-Voya', 'Zaya', 'Solin-Levels', 'Jiran-A Plus', 'Vienna-Dream Hills', 'Beta Residence-Beta Egypt', 'Badya-Palm Hills', 'Mountain View kings way', 'Badya'],
    'Eastern Expansions' : ['Cleopatra Square-Cleopatra', 'Joya-Tcc', 'Nmq-Melee', 'keeva-Al Ahly Sabbour', 'Swan Lake West-Hassan Allam', 'Palm Parks-Palm Hills', 'Upville-Wadi El Nile', 'WestVille-Binbaz 9 El Masria', '31 West-M Squared', 'Club Hills-Hpd', 'Villagio-Modon', 'Tawny-Hyde Park', 'Signature-Hyde Park', 'Garden Lakes-Hyde Park', 'The Crown-Palm Hills', 'Px-Palm Hills', 'October Park-Mountain View', 'Joulz-Inertia', 'Midgard-Orbit', 'Giza Terracas-Marakez', 'West Leaves-El Attal', 'Hadaba-Pre', 'Nyoum Pyarmids-Adh', 'Brix-Inertia', 'Fifty 7-Inertia'],
    'New Cairo' : ['Swan Lake Residences-Hassan Allam', 'Sa`ada-Horizon', 'Capital Gardens-Palm Hills', 'Palm Hills New Cairo', '97 Hills-Palm Hills', 'Patio Oro-La Vista', 'Patio Hills-La vista', 'Hyde park New cairo', 'Solana East-Ora', 'Zed East-Ora', 'Hyde park Central', 'Patio Vida-La Vista', 'Patio Riva-La Vista', 'Crescent Walk-Marakez', 'Sa`ada Boutique-Horizon', 'District 5-Marakez', 'Kairo-One & Waterway', 'Hyde Park Views', 'Katameya Creeks-Starlight', 'El-Patio Town - La Vista', 'Al Patio 7-La Vista', 'W Signature-The Waterway', 'The View-The Waterway', 'Villette-Sodic', 'Regent`s Square - Al Dawlia', 'Fifth Square - Marasem', 'Waterway 1-The Waterway', 'Taj City-Madinet Masr', 'Stei8ht-Lmd', 'Creek Town-II Cazar',
      'Yellow-Urbnlanes', 'Address East-Dorra', 'Telal East-Roya', 'ICity New Cairo-Mountain View', 'Mist-M Squared', 'Trio Gardens-M Squared', 'Sarai-Madinet Masr', 'Tierra-Sed', 'Glen-II Cazar', 'Roya', 'Cred-Ever', 'Midtown East-Better Home', 'The Crest-|| Cazar', 'Mountain View Hyde park', 'City Gate-Qatari Diar', 'IVoire East-Pre', 'Promenade-Wadi Degla', 'The WaterMarQ-The MarQ', 'Azad-Tameer', 'Noi-Urbnlanes', 'Galleria Moon Valley-Arabia Holding', 'Jayd-Sed', 'Mountain View 1.1', 'Ashrafieh-Arabia Holding', 'Jw Marriott Residences-Al Jazi', 'White Residence-Upwyde', 'Stone park-Royal', 'Stone Residence-Pre', 'Brooks-Pre', 'SQ1-Hdp', 'The Median-Egy Gab', 'Nile Boulevard-Nile', 'Eelaf-Erg', 'Life Wise-Eons', 'Linwood-Erg',
      'Livair-Erg', 'Zeya-El Baron', 'Orla-ICapital', 'Peerage-Al riyadh Misr', 'Acasa Mia-Dar Al Alamia', 'Hope Memaar Al Ashraf', 'Notion-TownWriters', 'The lark-Tamayoz', 'La Colina-Capital Hills', 'Eastville - Ajna', 'Solay-Living Yards', 'Cavali-Al Basiony', 'Blue Tree-Sky Ad', 'Zomra East-Nations of Sky', 'The Red-Abm', 'Greya-El Baron', 'Kin-Imarra', 'Cattleya Arabco', 'Aster-Times', ' Boutique Village-Modon', 'Nurai-Mercon', 'Amara-New Plan', 'Isola Centra-El Masria', 'The Residence-Salam', 'True-UC', 'Avelin-Times', 'Garnet-Jadeer', '90 Avenue-Tabarak', 'The Ark', 'J East-Juzur', 'Palm East-Tg', 'Begonia-Menassat', 'Blanks-Manaj', 'Sephora Heights-Sephora', 'Jada & Blue-Aspect', 'Rock Vera-Al Batal', 'Jadie-Concrete',
      'The Icon Gardens-Style Home', 'Valencia Valley-Ncb', 'Silvia-Ted', 'Yardin-Mass', 'Rivali-Samco Holding', 'Century city-Vantage', 'Amorada-Afaaq', 'Elen-Concrete', 'Wuud-Tharaa', 'Dijar-Azzar Reedy', 'Maliv-kulture', 'Noll-Kleek', 'Acasa Alma-Dar Al Alamia', 'Najm-Royal', 'Jiwar-Concrete', 'Home Residence-Home Town', 'Cairova-Rna', 'Lusail-Margins', 'Nest N Developments', 'Alca-Sag', 'Grounds - One / One'
     ]

  },
  2: { // Alexandria
    'any': [
      'Palm hills Alexandria', 'Sawari', 'The One', 'Muruj', 'Alex west', 'Skyline', 'Crystal towers', 
      'Grand view', 'Twin towers', 'Valore smouha', 'Valore antoniadis', 'East towers', 
      'Saraya gardens', 'Veranda', 'Jackranda', 'Oria city', 'Elite City',
      'Alsafwa City', 'Vida', 'Abha hayat', 'Jewar', 'Ouruba royals', 
      'Soly vie', 'San Stefano royals', 'Malaaz', 'Cleopatra plaza','Smoha Gate', 'Antoniades City'
    ]
  },
   3: { // North Coast
    'Ras Al Hekma': ['Ramla', 'Azha', 'Naia Bay', 'El Masyaf', 'Fouka Bay', 'Remal', 'Hacienda West', 'Seashore', 'Youd','Ogami', 'Ras Al-Hekma', 'Hacienda Ras Al-Hekma', 'Seashell Playa', 'La Vista Ras El Hikma', 'Caesar', 'Koun', 'Caesar Bay', 'Lyv', 'Mountain View Ras El Hikma', 'Solare', 'Swan Lake', 'Seashell Ras El Hikma', 'The Med', 'Gaia', 'June', 'Direction White', 'Cali Coast', 'Hacienda Waters', 'Mar Bay', 'Jefaira', 'Sea View', 'Safia', 'Salt', 'Azzar Islands', 'Saada North Coast', 'Katamya Coast', 'Soul', 'Lvls','قرية لافيستا باي','قرية سواني','قرية الامارات هايتس','قرية قطامية كوست','قرية بالي','قرية ذا ووتر واي','قرية ذا شور','قرية سي فيو','قرية لاميرا','قرية وان علمين','قرية دايركشن وايت','قرية جون سوديك','قرية رملة','قرية ذا ميد','قرية كالي كوست','قرية سيتي ستارز','قرية رودس','قرية ذا كريبس جيفيرا','قرية ماونتن فيو الدبلوماسيين','قرية سيزر قيصر باي','قرية هاسيندا وايت','قرية جيفيرا','قرية بلوز تيفاني','قرية الجوهرة','قرية رويال بيتش','قرية لافيستا باي ايست','قرية كوست 82 سابقا المصيف حاليا','قرية فوكا كلوب','قرية المصيف','قرية نايا باي','قرية مينا كلوب','قرية ازها','قرية ملاذ سوديك','قرية كاي','قرية سيلفر ساندس','قرية وايت باي سيدي حنيش','قرية سيسيليا لاجونز','قرية اس باس سيدي حنيش','قرية ازميرالدا باي','قرية بورتو كريستال لاجونز','قرية جزر الجراولة'],
    'Al-Dabaa': ['Dose', 'The Water Way', 'Seazen', 'La Vista Bay', 'La Vista Bay East', 'Hacienda Blue', 'La Sirena', 'D bay', 'South Med','قرية كورونادو','قرية جاي','قرية دي باي','قرية لاسيرينا','قرية سيزين','قرية دوس'],
    'Sidi Abdulrahman': ['Telal', 'Hacienda Red', 'Hacienda White', 'Amwaj', 'Q North', 'SeaShell', 'Bianchi Ilios', 'Shamasi', 'Masaya', 'Location', 'Stella Heights', 'Alura', 'La vista Cascada', 'Maraasi', 'Stella', 'Diplo 3', 'Haceinda Bay','قرية هاسيندا باي','قرية ستيلا سيدي عبدالرحمن','قرية ليك يارد','قرية ماراسي','قرية سكايا مراسي','قرية أجورا','قرية فرح','قرية لافيستا كاسكادا','قرية سي شيل بلايا','قرية سوان ليك','قرية ريتان','قرية مسايا','قرية اوركيديا','قرية ستيلا هايتس','قرية كاسكاديا','قرية بيانكي','قرية ستيلا مارينا','قرية أمواج','قرية بلومار','قرية هاسيندا وايت','قرية خليج غزالة','قرية زويا','قرية تلال'],
    'Ghazala Bay': ['Playa Ghazala', 'Ghazala Bay', 'Zoya'],
    'Al-Alamin': ['Zahra', 'Crysta', 'Plage', 'Lagoons', 'Alma' , 'Ajaza', 'IL Latini', 'Downtown', 'Plam Hills North Coast', 'Mazarine', 'Golf Porto Marina', 'Marina 1', 'Marina 2', 'Marina 3', 'Marina 4', 'Marina 5', 'Marina 6', 'Marina 7', 'Marina 8','قرية مازارين','قرية مارسيليا لاند','قرية ليفير','قرية اركو لاجون','قرية فيستا مارينا','منتجع العلمين كابيتال','قرية باب البحر','قرية بلو فالي','قرية لازوردي باي','قرية بو ايلاند','قرية بو ساندس','قرية داون تاون مارينا','قرية رو مارينا','قرية بورتو مارينا','قرية سيا فيلاجيو','قرية جولف بورتو مارينا','قرية بورتو كروز'],
    'Sahel': ['Viller', 'The Island', 'Marina 8', 'North Code', 'Wanas Master', 'London', 'Eko Mena', 'Bungalows', 'Layana', 'Glee', 'قرية المهندسين', 'فخر البحار للقوات البحرية', 'قرية سيدرا', 'قرية ريزيه', 'قرية أمون','مايوركا', 'قرية كرير باراديس','قرية ألماظة باي','قرية داليا','قرية مصر للتعمير','قرية كرير لاجون','قرية الفيروز','قرية شاطئ الشروق','قرية البنوك','قرية الأطباء','قرية الطيارين','قرية جامعة القاهرة','قرية رمسيس','قرية كازابلانكا','قرية جولدن بيتش','قرية مرسي باجوش','قرية هليو بيتش','قرية مراقيا','قرية سرايات','قرية الدبلوماسيين التجاريين','قرية زمردة','قرية روزانا','قرية غرناطة','قرية فالنسيا','قرية ديانا بيتش','قرية هايدي','قرية سيلا','قرية الريفيرا','قرية تيباروز','قرية جراند هيلز','قرية المروة','قرية سلسبيل','قرية تاهيتي',
      'قرية التجاريين','قرية بلو باي','قرية باراديس بيتش','قرية البلاح','قرية قناة السويس','قرية ماربيلا','قرية اونديكسا','قرية روز فالي','قرية الرواد بيتش','قرية الكروان','قرية بالم بيتش','قرية كازابيانكا','قرية الروضة','قرية جامعة الدول العربية','قرية جامعة عين شمس','قرية المعمورة الجديدة','قرية الصفا','قرية بانجلوز','قرية حورس والرمال الذهبية','قرية زهرة','قرية بيلا ميرا','قرية ديمورا','قرية مارسيليا بوكية','قرية وايت ساند','قرية بانوراما بيتش','قرية عايدة','قرية المعادي','قرية مرحبا بيتش','قرية ريتال فيو','قرية كاربيان','قرية ريماس','قرية الروان','قرية المنتزة','قرية ايكو','قرية المرجان','','قرية قرطاج','قرية مارينا فلاورز','قرية أغادير','قرية سيرينا','قرية الصحفيين','قرية بلو بلاجا','قرية كوستا دل سول','قرية بيو بيلا','قرية روتندو كوست','قرية سانتوريني','قرية بدر','قرية فيرجينيا','قرية نيفادا هيلز','قرية كيلوباترا','قرية الزهور','قرية مارينا صن شاين','قرية البوسيت','قرية جرين بيتش','قرية سوميد','قرية جامعة أسيوط','قرية دياموند بيتش','قرية أتيك','قرية مارينا جاردنز','قرية اللوتس','قرية أكوا فيو','قرية باترسي','قرية بيترو بيتش','قرية مارينا فالي','قرية بيلا مارينا',
    ]
  }
};

// 🟢 قائمة المطورين
dummyDevelopers =[
  { code: 'PH', name: 'Palm hills' },
  { code: 'EW', name: 'Elsewhere' },
  { code: 'OR', name: 'Orouba' },
  { code: 'ZN', name: 'Zinnia' },
  { code: 'TD', name: 'Tasheed' },
  { code: 'TK', name: 'Turkey' },
  { code: 'AG', name: 'Add Group' },
  { code: 'CG', name: 'Gamal Elghonimy' },
  { code: 'KG', name: 'Khames Elghonimy' },
  { code: 'BY', name: 'Bunyan' },
  { code: 'TR', name: 'The rise' },
  { code: 'BN', name: 'Baron' },
  { code: 'MR', name: 'Mimary' },
  { code: 'AZ', name: 'Abo Zahra' },
  { code: 'MA', name: 'Al maram' },
  { code: 'IV', name: 'Ivory' },
  { code: 'AF', name: 'Alforat' },
  { code: 'AZ', name: 'Abo Zahra "Diva"' },
  { code: 'KG', name: 'Elghonimy "Saluga Elite"' },
  { code: 'KG', name: 'Elghonimy " Vee Club"' },
  { code: 'BV', name: 'Boulivard' },
  { code: 'SWF', name: 'Seif water front' },
  { code: 'SM', name: 'Saudi Masria' },
  { code: 'SK', name: 'Solik' },
  { code: 'FT', name: 'First' },
  { code: 'TB', name: 'Tabark' },
  { code: 'SG', name: 'Swag' },
  { code: 'W', name: 'Waf' },
  { code: 'SD', name: 'Elsedeky' },
  { code: 'TG', name: 'Tegan, Eldawlia' },
  { code: 'JN', name: 'Jeran' },
  { code: 'AL', name: 'Alexandria development' },
  { code: 'DK', name: 'Darak' },
  { code: 'SF', name: 'Saif' },
  { code: 'CP', name: 'Cleopatra' },
  { code: 'JW', name: 'Jedar & Jawiria' },
  { code: 'MS', name: 'Marsoum Development' },
  {code: 'MAR', name: 'Marakez' },
  {code: 'MAD', name: 'Madar' },
  {code: 'NAI', name: 'Naia' },
  {code: 'MS', name: 'M Squared' },
  {code: 'TM', name: 'Tatweer Misr' },
  {code: 'MZ', name: 'Mezyan' },
  {code: 'HP', name: 'Hyde Park' },
  {code: 'SOD', name: 'Sodic' },
  {code: 'GD', name: 'G Development' },
  {code: 'LVR', name: 'La Vista Ras' },
  {code: 'MBE', name: 'Mabany Edris' },
  {code: 'MET', name: 'Metso' },
  {code: 'GAT', name: 'Gates' },
  {code: 'MV', name: 'Mountain View' },
  {code: 'MI', name: 'Misr Italia' },
  {code: 'HA', name: 'Hassan Allam' },
  {code: 'PEO', name: 'People' },
  {code: 'AS', name: 'Ahly Sabbour' },
  {code: 'AB', name: 'Ara Bella' },
  {code: 'MAV', name: 'Maven' },
  {code: 'MAR1', name: 'Marasem' },
  {code: 'INE', name: 'Inertia' },
  {code: 'IDA', name: 'Idar' },
  {code: 'IC', name: 'Il Cazar' },
  {code: 'RRE', name: 'Rreedy' },
  {code: 'HE', name: 'He' },
  {code: 'SD', name: 'Starlight Development' },
  {code: 'EMA', name: 'Emaar' },
  {code: 'AER', name: 'Akam El Rajhi' },
  {code: 'TWW', name: 'The Water Way' },
  {code: 'ALQ', name: 'Alqamzi' },
  {code: 'LAV', name: 'Lavista' },
  {code: 'LS', name: 'La Sirena' },
  {code: 'TMG', name: 'Tmg' },
  {code: 'ROU', name: 'Roua' },
  {code: 'QD', name: 'Q Development' },
  {code: 'DX', name: 'Developer X' },
  {code: 'SER', name: 'Serac' },
  {code: 'EG', name: 'Egy Gab' },
  {code: 'LOC', name: 'Location' },
  {code: 'ME', name: 'Memar Elmorshedy' },
  {code: 'LMD', name: 'LMD' },
  {code: 'GB', name: 'Ghazala Bay' },
  {code: 'MOD', name: 'Modon' },
  {code: 'NG', name: 'New Generation' },
  {code: 'CE', name: 'City Edge' },
  {code: 'ALD', name: 'Aldiwan' },
  {code: 'HDP', name: 'Hdp' },
  {code: 'COD', name: 'Code' },
  {code: 'MAS', name: 'Master' },
  {code: 'JD', name: 'J D' },
  {code: 'MG', name: 'Mena Group' },
  {code: 'ARA', name: 'Arabia' },
  {code: 'TOL', name: 'Toledo' },
  {code: 'THA', name: 'Tharaa' },
  {code: 'FAG', name: 'Farag Amer' },
  {code: 'SED', name: 'Saudi Egyptian Development' },
  {code: 'HBD', name: 'Housing and Development bank' },
  {code: 'MRC', name: 'Mercon' }
];

primaryProjectCodes: any = {
    "Palm hills Alexandria": "PHA", "The One": "TO", "Skyline": "SL", "East towers": "ET",
    "Alex west": "AW", "Valore Smouha": "VS", "Valore Antoniadis": "VA", "Muruj": "MJ",
    "Sawari": "SW", "Jackranda": "JK", "Vida": "VD", "Alsafwa": "AS", "Abha hayat": "AH",
    "Grand view": "GV", "Crystal towers": "CT", "Twin towers": "TT", "Veranda": "VR",
    "Jewar": "JR", "Soly vie": "SV", "San Stefano royals": "SSR", "Cleopatra plaza": "CP",
    "Malaaz": "MZ", "Smoha Gate": "SMG", "Amwaj": "AM", "Antoniades City": "AC", 'Oria City': 'OC', 'Elite City': 'EC', 'Ouruba Royals': 'OR'
    , 'Saraya Gardens': 'SG', 'Alsafwa City': 'AS', 'The Island': 'TI', 'Telal': 'TE', 
    "Ramla": "RA", "Azha": "AZ", "Naia Bay": "NA", "El Masyaf": "EL", "Fouka Bay": "FO",
    "Remal": "RE", "Hacienda West": "HA", "Seashore": "SE", "Ogami": "OG", "Seashell Playa": "SEA",
    "La Vista Ras El Hikma": "LA", "Caesar": "CA", "Koun": "KO", "Caesar Bay": "CAE", "Lyv": "LY",
    "Mountain View Ras El Hikma": "MO", "Solare": "SO", "Swan Lake": "SW", "Seashell Ras El Hikma": "SA",
    "The Med": "TH", "Gaia": "GA", "June": "JU", "Direction White": "DI", "Cali Coast": "CAL",
    "Hacienda Waters": "HAC", "Mar Bay": "MA", "Jefaira": "JE", "Sea View": "SV", "Safia": "SAF",
    "Salt": "SAL", "Azzar Islands": "AZZ", "Saada North Coast": "SAA", "Katamya Coast": "KA",
    "Soul": "SOU", "Lvls": "LV", "Ras Al-Hekma": "RH", "Hacienda Ras Al-Hekma": "HCR", "Youd": "YD",

    // 🏖️ الساحل الشمالي (Al-Dabaa)
    "Dose": "DO", "The Water Way": "THE", "Seazen": "SZ", "La Vista Bay": "LAV", 
    "La Vista Bay East": "LI", "Hacienda Blue": "HC", "La Sirena": "LAS", "D bay": "DB", 
    "South Med": "SU",

    // 🏖️ الساحل الشمالي (Sidi Abdulrahman)
    "Hacienda Red": "HI", "Hacienda White": "HE", "Q North": "QN", "SeaShell": "SS", 
    "Bianchi Ilios": "BI", "Shamasi": "SH", "Masaya": "MAS", "Location": "LO", 
    "Stella Heights": "ST", "Alura": "AL", "La vista Cascada": "LS", "Maraasi": "MAR", 
    "Stella": "STE", "Diplo 3": "DIP", "Haceinda Bay": "HN",

    // 🏖️ الساحل الشمالي (Ghazala Bay)
    "Playa Ghazala": "PL", "Ghazala Bay": "GH", "Zoya": "ZO",

    // 🏖️ الساحل الشمالي (Al-Alamin)
    "Zahra": "ZA", "Crysta": "CR", "Plage": "PLA", "Lagoons": "LAG", "Alma": "ALM",
    "IL Latini": "IL", "Downtown": "DOW", "Plam Hills North Coast": "PA", "Mazarine": "MAZ",
    "Golf Porto Marina": "GPM", "Marina 1": "MR1", "Marina 2": "MR2", "Marina 3": "MR3",
    "Marina 4": "MR4", "Marina 5": "MR5", "Marina 6": "MR6", "Marina 7": "MR7", "Marina 8": "MR8", "Ajaza": "AGZ",

    // 🏖️ الساحل الشمالي (Sahel)
    "Viller": "VI", "North Code": "NO", "Wanas Master": "WA", "London": "LON", 
    "Eko Mena": "EK", "Bungalows": "BU", "Layana": "LAY", "Glee": "GL", "Dayz": "DZ"
  };

  resaleProjectIds: any = {
    "Sawari": "1", "Muruj": "2", "Palm hills Alexandria": "3", "The one": "4", "Alex west": "5",
    "Skyline": "6", "Grand view": "7", "Antoniades City": "8", "Valory Antoniades": "9",
    "Valory Smoha": "10", "Jewar": "11", "Crystal Towers": "12", "Twin Towers": "13",
    "East Towers": "14", "Saraya Gardens": "15", "Veranda": "16", "Jackranda": "17",
    "Oria City": "18", "Elite City": "19", "Vida": "20", "Abha Hayat": "21",
    "Ouruba Royals": "22", "Soly Vie": "23", "San Stefano Royals": "24", "Malaaz": "25",
    "Smouha Gate": "26"
  };

  resaleZoneIds: any = {
    "Abu Qir": "1", "Al-Maamoura": "2", "Al-zawaida": "4", "Khurshid": "5", "Al-Maraghi": "6",
    "Bahary": "7", "El-Mandara-kebly": "8", "Al-Manshiyya": "9", "Bashair al-khayr": "11",
    "Al-Agamy": "13", "Al-Baytash": "14", "Al-Hanovil": "15", "Al-Dakhila": "16", "October": "17",
    "Al-Amiriya": "20", "Borj Al-Arab": "21", "Sidi Bishr": "23", "Al-Aasafirah-45": "24",
    "Al-Aasafirah-bahary": "25", "Al-Aasafirah-30": "26", "Janaklis": "32", "San Stefano": "33",
    "Fleming": "34", "Shods": "35", "Al-Suyuf": "39", "Bakus": "40", "Bolkley": "41",
    "Roshdy": "42", "Zizinia": "43", "Kafr Abdo": "45", "Cleopatra": "46", "Sporting": "47",
    "Sidi Gaber": "48", "Camp Schésar": "49", "Al-Shatibi": "50", "Al-Azariṭa": "51",
    "Mahattah al-raml": "52", "Al-Saraya": "53", "Muharram Bik": "56", "Al-Hadra": "57",
    "Miamy": "59", "Abo solaiman": "60", "Falaky": "61", "Al-Aasafirah-kebly": "62",
    "Smouha": "63", "scot": "64", "Mahattat Misr": "66", "Al-Ibrahimiya": "67",
    "Moustafa Kamel": "68", "Loran": "69", "Al-luban": "70", "Victoria": "71",
    "Gliem": "72", "Wabur al-miyah": "73", "Karmouz": "74", "Stanly": "76",
    "Al-Aawaid": "77", "salah Salem": "78", "Hajar al-nawatih": "79", "Al-Montaza": "80",
    "Al-Hedaya": "81", "Wenget": "82", "Road": "83", "Abis": "84", "Al-Hurriya": "85",
    "Sultan Hussein": "86", "Kubri al-namus": "87", "Mohammed Naguib": "88",
    "Al-Mahmoudia": "90", "Saba Basha": "91", "El-Mandara-bahary": "92", "Marina": "93",
    "Tharwat": "94", "Elshalalat": "95", "Green Plaza": "96", "King Mariout": "97"
  };

  legacySequenceStarters: any = {
    "NR93-": 51, "NPR93-": 85, 
    "ARP1-": 22, "ARP2-": 38, "ARP3-": 43, "ARP6-": 13, "ARP5-": 7,
    "ARP4-": 15, "ARP9-": 3, "ARP8-": 2, "ARP7-": 18, "ARP11-": 2,
    "ARP12-": 1, "AR69-": 120, "AR72-": 59, "AR43-": 28, "AR34-": 18,
    "AR41-": 28, "AR42-": 27, "AR91-": 26, "AR33-": 15, "AR32-": 26,
    "AR68-": 18, "AR45-": 55, "AR61-": 35, "AR71-": 16, "AR67-": 37,
    "AR50-": 7, "AR47-": 43, "AR46-": 26, "AR48-": 38, "AR49-": 52,
    "AR51-": 4, "AR52-": 3, "AR56-": 54, "AR63-": 327, "AR59-": 109,
    "AR23-": 127, "AR2-": 11, "AR92-": 35, "AR97-": 15
  };
filteredProjects: string[] = [];

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private propertyService = inject(PropertyService);
  private alertService = inject(AlertService);

  originalCode: string = '';
  originalCodeTriggers: any = {};

  ngOnInit(): void {
    this.editForm = this.fb.group({
      title: ['',[Validators.required, Validators.maxLength(200)]],
      description: ['', Validators.required],
      price: ['',[Validators.required, minAmountValidator(1000000)]],
      area: ['',[Validators.required, Validators.min(1)]],
      rooms: [0, [Validators.min(0)]],
      bathrooms: [0, [Validators.min(0)]],
      city:[1, Validators.required],
      region: ['', Validators.required],
      projectName: [''],
      address:[''],
      listingType: [0, Validators.required],
      propertyType:[0, Validators.required],
      ownerName: ['', Validators.required],
      ownerPhone: ['', Validators.required],
      developerName: [''],
      areaType: [0],
      villaCategory: [0],
      villaSubType:[null],
      groundRooms: [0], groundBaths: [0], groundReception: [0],
      firstRooms: [0], firstBaths: [0], firstReception: [0],
      secondRooms: [0], secondBaths: [0], secondReception: [0],
      hasPool: [false], hasGarden: [false],
      code: ['', Validators.required],
      finishing: [2],
      buildYear: ['', [Validators.min(1950), Validators.max(this.currentYear)]],
      floor:[0, [Validators.min(0)]],
      totalFloors: [2,[Validators.min(2)]],
      apartmentsPerFloor: [1, [Validators.min(1)]],
      elevatorsCount: [0, [Validators.min(0)]],
      receptionPieces: [0,[Validators.min(0)]],
      view: [''],
      distanceFromLandmark: [''],
      paymentMethod: ['Cash', Validators.required],
      //installmentYears: [1],
      //downPayment:[0],
      //quarterInstallment: [0],
      paymentPlans: this.fb.array([this.createPaymentPlan()]),
      monthlyRent: [0],
      securityDeposit:[0, [minAmountValidator(0)]],
      deliveryStatus: [0],
      deliveryYear: [null],
      hasMasterRoom: [false], hasHotelEntrance: [false], hasSecurity: [false],
      hasParking: [false], hasBalcony: [false], isFurnished: [false],
      isFirstOwner: [false], isLegalReconciled: [false], isLicensed: [false],
      hasWaterMeter: [false], hasElectricityMeter: [false], hasGasMeter: [false], hasLandShare: [false],
      pricePerMeter: [''],
      //downPaymentPercentage: ['']
    });

    this.propertyId = Number(this.route.snapshot.paramMap.get('id'));

    this.editForm.get('city')?.valueChanges.subscribe(() => { this.updateRegions(); this.updateProjectsList(); });
    this.editForm.get('region')?.valueChanges.subscribe(() => this.updateProjectsList());

    this.editForm.get('listingType')?.valueChanges.subscribe(type => {
      const typeNum = Number(type);
      const priceControl = this.editForm.get('price');
      const ppmControl = this.editForm.get('pricePerMeter');
      const securityControl = this.editForm.get('securityDeposit');
      const devControl = this.editForm.get('developerName'); // 👈 المتغير الجديد

      // 🟢 التعامل مع المطور وسعر المتر (Primary فقط = 2)
      if (typeNum === 2) { 
        ppmControl?.setValidators([Validators.required]);
        devControl?.setValidators([Validators.required]); // المطور إجباري
      } else {
        ppmControl?.clearValidators();
        ppmControl?.setValue(''); 
        devControl?.clearValidators(); 
        devControl?.setValue(''); // تصفير المطور
      }

      if (typeNum === 1) { 
        priceControl?.setValidators([Validators.required, minAmountValidator(1)]);
        securityControl?.setValidators([Validators.required, minAmountValidator(0)]);
      } else { 
        priceControl?.setValidators([Validators.required, minAmountValidator(1000000)]);
        securityControl?.clearValidators();
      }
      
      priceControl?.updateValueAndValidity();
      ppmControl?.updateValueAndValidity();
      securityControl?.updateValueAndValidity();
      devControl?.updateValueAndValidity(); // 👈 تحديث حالة المطور
    });

    this.editForm.get('price')?.valueChanges.subscribe(val => {
      if (this.isRent()) {
        this.editForm.get('monthlyRent')?.setValue(val, { emitEvent: false });
      }
    });

    this.editForm.get('monthlyRent')?.valueChanges.subscribe(val => {
      if (this.isRent()) {
        this.editForm.get('price')?.setValue(val, { emitEvent: false });
      }
    });

    this.editForm.valueChanges.subscribe(() => {
      this.updateLiveCodePreview();
    });

    this.loadPropertyData();
  }

  loadPropertyData() {
    this.propertyService.getPropertyById(this.propertyId).subscribe({
      next: (data: any) => {
        const cityId = this.mapCityToId(data.city);
        this.updateRegions(cityId);
        this.updateProjectsList(cityId, data.region);

        if (data.buildYear === 0) data.buildYear = '';
        if (data.totalFloors === 0) data.totalFloors = 2;
        if (data.apartmentsPerFloor === 0) data.apartmentsPerFloor = 1;

        this.editForm.patchValue({
          ...data,
          city: cityId,
          listingType: this.mapListingToId(data.listingType),
          propertyType: this.mapTypeToId(data.propertyType),
          finishing: this.mapFinishingToId(data.finishing),
          deliveryStatus: this.mapDeliveryToId(data.deliveryStatus),
          areaType: this.mapAreaTypeToId(data.areaType),
          villaCategory: this.mapVillaCatToId(data.villaCategory),
          villaSubType: this.mapVillaSubToId(data.villaSubType),
        });

        this.originalCode = data.code;
        this.originalCodeTriggers = {
          city: cityId,
          listingType: this.mapListingToId(data.listingType),
          propertyType: this.mapTypeToId(data.propertyType),
          projectName: data.projectName || '',
          developerName: data.developerName || '',
          region: data.region || ''
        };
        
        // عرض الكود القديم فوراً
        this.editForm.get('code')?.setValue(this.originalCode, { emitEvent: false });

        this.paymentPlans.clear();
        if (data.paymentPlans && data.paymentPlans.length > 0) {
          const price = Number(data.price) || 0;
          data.paymentPlans.forEach((plan: any) => {
  let dpPercent = '';
  if (price > 0 && plan.downPayment > 0) {
    dpPercent = ((plan.downPayment / price) * 100).toFixed(2);
  }

  const frequency = plan.frequency || 'Quarterly';

  this.paymentPlans.push(this.createPaymentPlan(
    plan.installmentYears,
    plan.downPayment > 0 ? plan.downPayment.toLocaleString('en-US') : '',
    dpPercent,
    plan.quarterInstallment > 0 ? plan.quarterInstallment.toLocaleString('en-US') : '',
    frequency
  ));
});

// ✅ بعد ما الخطط اتحملت، احسب الـ installmentAmount لكل خطة
setTimeout(() => {
  for (let i = 0; i < this.paymentPlans.length; i++) {
    this.calculateInstallments(i);
  }
}, 0);
        } else {
          this.addPaymentPlan(); // لو مفيش، يفتحله خطة واحدة بيضاء
        }

        this.formatInitialAmount('price');
        this.formatInitialAmount('downPayment');
        this.formatInitialAmount('quarterInstallment');
        this.formatInitialAmount('monthlyRent');
        this.formatInitialAmount('securityDeposit');

        const area = Number(data.area) || 0;
        const price = Number(data.price) || 0;
        const downPayment = Number(data.downPayment) || 0;

        if (area > 0 && price > 0) {
          const ppm = price / area;
          this.editForm.get('pricePerMeter')?.setValue(ppm.toLocaleString('en-US'), { emitEvent: false });
        }

        if (price > 0 && downPayment > 0) {
          const dpPercent = (downPayment / price) * 100;
          this.editForm.get('downPaymentPercentage')?.setValue(parseFloat(dpPercent.toFixed(2)), { emitEvent: false });
        }

        this.existingPhotos.set(data.photos);
      }
    });
  }

  updateLiveCodePreview() {
    const f = this.editForm.getRawValue(); 
    if (!f) return;

    const isChanged = 
      String(f.city) !== String(this.originalCodeTriggers?.city) ||
      String(f.listingType) !== String(this.originalCodeTriggers?.listingType) ||
      String(f.propertyType) !== String(this.originalCodeTriggers?.propertyType) ||
      (f.projectName || '') !== this.originalCodeTriggers?.projectName ||
      (f.developerName || '') !== this.originalCodeTriggers?.developerName ||
      (f.region || '') !== this.originalCodeTriggers?.region;

    if (!isChanged && this.originalCode) {
      this.editForm.get('code')?.setValue(this.originalCode, { emitEvent: false });
      return;
    }

    if (!f.city || f.listingType === null || f.listingType === '') {
      this.editForm.get('code')?.setValue('Auto-Generated', { emitEvent: false });
      return;
    }

    let city = f.city == 1 ? "C" : f.city == 2 ? "A" : f.city == 3 ? "N" : "";
    let list = (f.listingType == 0 || f.listingType == 1) ? "R" : f.listingType == 2 ? "P" : (f.city == 3 ? "PR" : "RP"); 

    let type = f.propertyType == 0 ? "A" : f.propertyType == 1 ? "V" : 
               f.propertyType == 2 ? "S" : f.propertyType == 3 ? "O" : 
               f.propertyType == 4 ? "CH" : f.propertyType == 5 ? "F" : "";

    let prefix = "";

    const getProjCodePrimary = (name: string) => {
      if(!name) return '';
      const key = Object.keys(this.primaryProjectCodes).find(k => k.toLowerCase() === name.toLowerCase());
      return key ? this.primaryProjectCodes[key] : '';
    };

    const getDevCode = (name: string) => {
      if(!name) return '';
      const found = this.dummyDevelopers.find(d => d.name.toLowerCase() === name.toLowerCase());
      return found ? found.code : name.substring(0, 2).toUpperCase();
    };

    const getResaleProjectId = (name: string) => {
      if(!name) return '';
      const key = Object.keys(this.resaleProjectIds).find(k => k.toLowerCase() === name.toLowerCase());
      return key ? this.resaleProjectIds[key] : '(ProjId)';
    };

    const getZoneId = (name: string) => {
      if(!name) return '';
      const key = Object.keys(this.resaleZoneIds).find(k => k.toLowerCase() === name.toLowerCase());
      return key ? this.resaleZoneIds[key] : '0'; 
    };

    if (f.listingType == 2) { 
      const pCode = getProjCodePrimary(f.projectName);
      const dCode = getDevCode(f.developerName);
      prefix = `${city}${list}${type}-${pCode}${dCode}-`; 
    } 
    else if (f.listingType == 3) { 
      if (f.city == 3) prefix = `NPR93-`;
      else {
        const pId = getResaleProjectId(f.projectName);
        prefix = `${city}${list}${pId}-`;
      }
    } 
    else { 
      if (f.city == 3) prefix = `NR93-`; 
      else {
        const zId = getZoneId(f.region);
        prefix = `${city}${list}${zId}-`;
      }
    }

    // 🟢 السحر هنا: لو الـ Prefix كامل واتغير، هنكلم الباك إند يجيب الرقم الحقيقي!
    if (prefix && this.currentPrefix !== prefix) {
      this.currentPrefix = prefix; // حفظناه عشان منعملش ريكويستات عالفاضي
      this.editForm.get('code')?.setValue(`${prefix}Loading...`, { emitEvent: false }); // رسالة مؤقتة

      this.propertyService.getNextCode(prefix).subscribe({
        next: (res) => {
          this.editForm.get('code')?.setValue(res.code, { emitEvent: false });
        },
        error: () => {
          this.editForm.get('code')?.setValue(`${prefix}01`, { emitEvent: false });
        }
      });
    }
  }

  getPureNumber(controlName: string): number {
    const val = this.editForm.get(controlName)?.value;
    if (!val) return 0;
    return Number(val.toString().replace(/,/g, ''));
  }

   convertArabicToEnglish(str: string): string {
    if (!str) return '';
    const arabicNumbers =['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[٠-٩]/g, (char) => arabicNumbers.indexOf(char).toString());
  }

  isSecurityExceeded(): boolean {
    const totalPrice = this.getPureNumber('price');
    const security = this.getPureNumber('securityDeposit');
    return security > 0 && totalPrice > 0 && security > totalPrice;
  }

  isVilla(): boolean { return Number(this.editForm.get('propertyType')?.value) === 1; }

  isPrimary(): boolean { 
    return Number(this.editForm.get('listingType')?.value) === 2; 
  }

  isValidFinance(): boolean {
    if (this.isRent()) return !this.isSecurityExceeded();
    const total = this.getPureNumber('price');
    const down = this.getPureNumber('downPayment');
    const quarter = this.getPureNumber('quarterInstallment');
    return down < total && quarter < total;
  }

  isFinanceExceeded(controlName: string): boolean {
    const totalPrice = this.getPureNumber('price');
    const amount = this.getPureNumber(controlName);
    return amount > 0 && totalPrice > 0 && amount > totalPrice;
  }

  formatFinancial(event: any, controlName: string) {
    let input = this.convertArabicToEnglish(event.target.value);
    let pureDigits = input.replace(/[^0-9]/g, '');
    if (pureDigits === '') { this.editForm.get(controlName)?.setValue(''); return; }
    let formatted = Number(pureDigits).toLocaleString('en-US');
    this.editForm.get(controlName)?.setValue(formatted, { emitEvent: false });
  }

  formatInteger(event: any, controlName: string) {
    let input = this.convertArabicToEnglish(event.target.value);
    let pureDigits = input.replace(/[^0-9]/g, '');
    this.editForm.get(controlName)?.setValue(pureDigits, { emitEvent: false });
  }

  formatPercentage(event: any, controlName: string) {
    let input = this.convertArabicToEnglish(event.target.value);
    let pureDigits = input.replace(/[^0-9.]/g, '');
    if ((pureDigits.match(/\./g) ||[]).length > 1) pureDigits = pureDigits.substring(0, pureDigits.length - 1);
    this.editForm.get(controlName)?.setValue(pureDigits, { emitEvent: false });
  }

  // 🟢 دالة التقريب (لأقرب 1000)
  // ================== 🟢 إدارة المصفوفة (FormArray) ==================
  get paymentPlans(): FormArray {
    // استخدمي editForm لو إنتي في صفحة التعديل، و propertyForm لو في صفحة الإضافة
    return this.editForm.get('paymentPlans') as FormArray;
  }

  createPaymentPlan(years = 1, dp = '', dpPercent = '', quarter = '', frequency = 'Quarterly'): FormGroup {
  return this.fb.group({
    installmentYears: [years, [Validators.min(1)]],
    downPaymentPercentage: [dpPercent],
    downPayment: [dp],
    frequency: [frequency],
    quarterInstallment: [quarter],
    installmentAmount: ['']
  });
}

  addPaymentPlan() {
    this.paymentPlans.push(this.createPaymentPlan());
  }

  removePaymentPlan(index: number) {
    if (this.paymentPlans.length > 1) {
      this.paymentPlans.removeAt(index);
    }
  }

  // ================== 🟢 دوال التنسيق الخاصة بالمصفوفة ==================
 formatFinancialArray(event: any, controlName: string, index: number) {
    let input = this.convertArabicToEnglish(event.target.value);
    let pureDigits = input.replace(/[^0-9]/g, '');
    let formatted = pureDigits ? Number(pureDigits).toLocaleString('en-US') : '';
    this.paymentPlans.at(index).get(controlName)?.setValue(formatted, { emitEvent: false });
  }


  formatIntegerArray(event: any, controlName: string, index: number) {
    let input = this.convertArabicToEnglish(event.target.value);
    let pureDigits = input.replace(/[^0-9]/g, '');
    this.paymentPlans.at(index).get(controlName)?.setValue(pureDigits, { emitEvent: false });
  }

  formatPercentageArray(event: any, controlName: string, index: number) {
    let input = this.convertArabicToEnglish(event.target.value);
    let pureDigits = input.replace(/[^0-9.]/g, '');
    if ((pureDigits.match(/\./g) ||[]).length > 1) pureDigits = pureDigits.substring(0, pureDigits.length - 1);
    this.paymentPlans.at(index).get(controlName)?.setValue(pureDigits, { emitEvent: false });
  }

  // ================== 🟢 دوال الحسابات الذكية للمصفوفة ==================
  roundAmount(value: number): number {
    if (value <= 0) return 0;
    return Math.round(value / 1000) * 1000;
  }

  calculateTotalPrice() {
    if (!this.isPrimary()) return; 
    const area = this.getPureNumber('area');
    const ppm = this.getPureNumber('pricePerMeter');
    
    if (area > 0 && ppm > 0) {
      const total = this.roundAmount(area * ppm); 
      const form = this.editForm;
      form.get('price')?.setValue(total.toLocaleString('en-US'), { emitEvent: false });
      
      // تحديث كل خطط الدفع المفتوحة بناءً على السعر الجديد
      this.onTotalPriceChange();
    }
  }

  onTotalPriceChange() {
    for (let i = 0; i < this.paymentPlans.length; i++) {
      this.onAmountChange(i);
    }
  }

  onPercentageChange(index: number) {
    const total = this.getPureNumber('price');
    const plan = this.paymentPlans.at(index);
    const dpPercent = Number(plan.get('downPaymentPercentage')?.value || 0);

    if (total > 0 && dpPercent >= 0) {
      const dpAmount = this.roundAmount(total * (dpPercent / 100));
      plan.get('downPayment')?.setValue(dpAmount.toLocaleString('en-US'), { emitEvent: false });
      this.calculateInstallments(index);
    }
  }

  onAmountChange(index: number) {
    const total = this.getPureNumber('price');
    const plan = this.paymentPlans.at(index);
    const dpAmount = Number(plan.get('downPayment')?.value.toString().replace(/,/g, '') || 0);

    if (total > 0 && dpAmount >= 0) {
      const dpPercent = (dpAmount / total) * 100;
      plan.get('downPaymentPercentage')?.setValue(parseFloat(dpPercent.toFixed(2)), { emitEvent: false });
      this.calculateInstallments(index);
    }
  }

  calculateInstallments(index: number) {
  const total = this.getPureNumber('price');
  const plan = this.paymentPlans.at(index);
  const dpAmount = Number(plan.get('downPayment')?.value?.toString().replace(/,/g, '') || 0);
  const years = Number(plan.get('installmentYears')?.value?.toString().replace(/[^0-9]/g, '') || 0);
  const frequency = plan.get('frequency')?.value || 'Quarterly';

  if (total > 0 && years > 0) {
    const remaining = total - dpAmount;
    if (remaining > 0) {
      let result = 0;
      if (frequency === 'Quarterly')    result = (remaining / years) / 4;
      else if (frequency === 'Semi-Annual') result = (remaining / years) / 2;
      else if (frequency === 'Annual')      result = remaining / years;

      plan.get('installmentAmount')?.setValue(
        this.roundAmount(result).toLocaleString('en-US'), { emitEvent: false }
      );
    } else {
      plan.get('installmentAmount')?.setValue('0', { emitEvent: false });
    }
  }
}

  isInstallmentSelected(): boolean { return this.editForm.get('paymentMethod')?.value === 'Installment'; }

  updateProjectsList(cId?: number, rName?: string) {
    const id = cId || Number(this.editForm.get('city')?.value);
    const reg = rName || this.editForm.get('region')?.value;
    
    if (id === 1 || id === 3) {
      this.filteredProjects = this.projectsMapping[id]?.[reg] ||[];
    } 
    else if (id === 2) {
      this.filteredProjects = this.projectsMapping[id]?.['any'] ||[];
    } 
    else {
      this.filteredProjects =[];
    }
    
    this.editForm.get('projectName')?.setValue('');
  }

  showDeliveryMenu(): boolean {
    const type = Number(this.editForm.get('listingType')?.value);
    return type === 2 || type === 3;
  }

  isUnderConstruction(): boolean { return Number(this.editForm.get('deliveryStatus')?.value) === 1; }

  updateRegions(cId?: number) {
    const id = cId || Number(this.editForm.get('city')?.value);
    this.filteredRegions = this.regionsMapping[id] ||[];
    const currentRegion = this.editForm.get('region')?.value;
    if (currentRegion && !this.filteredRegions.includes(currentRegion)) {
      this.editForm.get('region')?.setValue('', { emitEvent: false });
    }
  }

  onFileSelect(event: any) {
    const files = event.target.files;
    if (files) {
      const existingCount = this.existingPhotos().length;
      const newlySelectedCount = this.selectedPhotos().length;
      const totalCurrent = existingCount + newlySelectedCount;
      const remainingLimit = 10 - totalCurrent;

      if (files.length > remainingLimit) {
        this.alertService.error(`Limit Reached! You can only add ${remainingLimit} more photos.`, 'Upload Limit');
        event.target.value = '';
        return;
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.selectedPhotos.update(prev =>[
          ...prev, 
          { 
            file: file, 
            preview: e.target.result, 
            originalFile: file, 
            originalPreview: e.target.result, 
            isWatermarked: false 
          }
        ]);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  toggleWatermark(index: number) {
    const photoObj = this.selectedPhotos()[index];

    if (photoObj.isWatermarked) {
      this.selectedPhotos.update(photos => {
        const newPhotos = [...photos];
        newPhotos[index].file = newPhotos[index].originalFile;
        newPhotos[index].preview = newPhotos[index].originalPreview;
        newPhotos[index].isWatermarked = false;
        return newPhotos;
      });
      return;
    }

    this.alertService.showLoading('Applying Logo...');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = photoObj.originalPreview; 
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const watermark = new Image();
      watermark.src = 'logo.png'; // 🟢 مسار اللوجو الشفاف بتاعك
      
      watermark.onload = () => {
        const wmWidth = img.width * 0.50; 
        const wmHeight = watermark.height * (wmWidth / watermark.width);
        
        const x = (img.width - wmWidth) / 2;
        const y = (img.height - wmHeight) / 2;

        ctx.globalAlpha = 0.5; 
        ctx.drawImage(watermark, x, y, wmWidth, wmHeight);
        ctx.globalAlpha = 1.0; 

        canvas.toBlob((blob) => {
          if (blob) {
            const newFile = new File([blob], `watermarked_${photoObj.originalFile.name}`, { type: 'image/jpeg' });
            const newPreview = canvas.toDataURL('image/jpeg', 0.85); 

            this.selectedPhotos.update(photos => {
              const newPhotos = [...photos];
              newPhotos[index].file = newFile;
              newPhotos[index].preview = newPreview;
              newPhotos[index].isWatermarked = true;
              return newPhotos;
            });
            this.alertService.close();
          } else {
             this.alertService.close();
             this.alertService.error("Failed to process this specific image.");
          }
        }, 'image/jpeg', 0.85); // 0.85 دي نسبة ضغط ممتازة للجودة
      };
      
      watermark.onerror = () => {
         this.alertService.close();
         this.alertService.error("Logo file not found!");
      };
    };
  }
  

  setExistingAsMain(photoId: number) {
    this.alertService.showLoading('Updating...');
    this.propertyService.setMainPhoto(this.propertyId, photoId).subscribe({
      next: () => { this.alertService.close(); this.loadPropertyData(); this.alertService.success('Done'); }
    });
  }

  setNewAsMain(i: number) { this.newMainPhotoIndex = i; }
  
  removePhoto(i: number) {
    this.selectedPhotos.update(p => { const n = [...p]; n.splice(i, 1); return n; });
  }

  isRent() { return Number(this.editForm.get('listingType')?.value) === 1; }
  isProject() { const t = Number(this.editForm.get('listingType')?.value); return t === 2 || t === 3; }
  isInstallment() { return this.editForm.get('paymentMethod')?.value === 'Installment'; }

  onSubmit() {
    if (this.isSubmitting) return;

    if (this.editForm.invalid) {
    this.editForm.markAllAsTouched(); // إظهار الأخطاء باللون الأحمر في الفورم
    
    // إضافة هذا الكود لرؤية الأخطاء في الـ Console
    const controls = this.editForm.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        console.log(`Field with error: ${name}`, controls[name].errors);
      }
    }
    
    this.alertService.error("Please fill all required fields correctly.");
    return;
  }

    this.isSubmitting = true;
    this.alertService.showLoading('Saving changes...');
    
    const formData = new FormData();
    const f = this.editForm.value;

    // 🟢 دالة السحر: بتغسل أي رقم جاي من الموبايل (بتحول العربي لإنجليزي وتمسح الفواصل والمسافات)
    const cleanNum = (val: any) => {
      if (val === null || val === undefined || val === '') return '0';
      let str = val.toString();
      const arabicNumbers =['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      str = str.replace(/[٠-٩]/g, (char: string) => arabicNumbers.indexOf(char).toString());
      return str.replace(/[, ]/g, ''); 
    };

    // إرسال الحقول النصية
    formData.append('Title', f.title || '');
    formData.append('Description', f.description || '');
    formData.append('ProjectName', f.projectName || ''); 
    formData.append('Code', f.code || '');
    formData.append('City', f.city.toString());
    formData.append('Region', f.region || '');
    formData.append('ListingType', f.listingType.toString());
    formData.append('PropertyType', f.propertyType.toString());
    formData.append('Finishing', (f.finishing || 2).toString());
    formData.append('PaymentMethod', f.paymentMethod || 'Full Cash');
    formData.append('DeliveryStatus', (f.deliveryStatus || 0).toString());
    formData.append('DistanceFromLandmark', f.distanceFromLandmark || '');
    formData.append('View', f.view || '');

    // 🟢 إرسال الأرقام بعد غسيلها بـ cleanNum
    formData.append('Price', cleanNum(f.price));
    formData.append('Area', cleanNum(f.area));
    formData.append('Rooms', cleanNum(f.rooms));
    formData.append('Bathrooms', cleanNum(f.bathrooms));
    formData.append('ReceptionPieces', cleanNum(f.receptionPieces));

    formData.append('OwnerName', f.ownerName || '');
    formData.append('OwnerPhone', f.ownerPhone || '');
    formData.append('DeveloperName', f.developerName || '');
    
    formData.append('Floor', cleanNum(f.floor));
    formData.append('TotalFloors', cleanNum(f.totalFloors));
    formData.append('ApartmentsPerFloor', cleanNum(f.apartmentsPerFloor));
    formData.append('ElevatorsCount', cleanNum(f.elevatorsCount));

    formData.append('GroundRooms', cleanNum(f.groundRooms));
    formData.append('GroundBaths', cleanNum(f.groundBaths));
    formData.append('GroundReception', cleanNum(f.groundReception));
    formData.append('FirstRooms', cleanNum(f.firstRooms));
    formData.append('FirstBaths', cleanNum(f.firstBaths));
    formData.append('FirstReception', cleanNum(f.firstReception));
    formData.append('SecondRooms', cleanNum(f.secondRooms));
    formData.append('SecondBaths', cleanNum(f.secondBaths));
    formData.append('SecondReception', cleanNum(f.secondReception));

    formData.append('AreaType', f.areaType?.toString() || '0');
    formData.append('VillaCategory', f.villaCategory?.toString() || '0');
    if (f.villaSubType !== null) {
      formData.append('VillaSubType', f.villaSubType.toString());
    }

    formData.append('HasPool', (f.hasPool || false).toString());
    formData.append('HasGarden', (f.hasGarden || false).toString());
    formData.append('HasLandShare', (f.hasLandShare || false).toString());
    formData.append('IsLicensed', (f.isLicensed || false).toString());
    formData.append('IsLegalReconciled', (f.isLegalReconciled || false).toString());
    formData.append('IsFirstOwner', (f.isFirstOwner || false).toString());
    formData.append('HasMasterRoom', (f.hasMasterRoom || false).toString());
    formData.append('HasHotelEntrance', (f.hasHotelEntrance || false).toString());
    formData.append('HasSecurity', (f.hasSecurity || false).toString());
    formData.append('HasParking', (f.hasParking || false).toString());
    formData.append('HasBalcony', (f.hasBalcony || false).toString());
    formData.append('HasElectricityMeter', (f.hasElectricityMeter || false).toString());
    formData.append('HasWaterMeter', (f.hasWaterMeter || false).toString());
    formData.append('HasGasMeter', (f.hasGasMeter || false).toString());

    if (f.paymentMethod === 'Installment') {
      this.paymentPlans.controls.forEach((plan, index) => {
        const y = cleanNum(plan.get('installmentYears')?.value);
        const dp = cleanNum(plan.get('downPayment')?.value);
        const q = cleanNum(plan.get('quarterInstallment')?.value);
        const freq = plan.get('frequency')?.value || 'Quarterly';

        formData.append(`PaymentPlans[${index}].InstallmentYears`, y);
        formData.append(`PaymentPlans[${index}].DownPayment`, dp);
        formData.append(`PaymentPlans[${index}].QuarterInstallment`, q);
        
        formData.append(`PaymentPlans[${index}].Frequency`, freq);
      });
    }
    
    formData.append('SecurityDeposit', cleanNum(f.securityDeposit));
    formData.append('MonthlyRent', cleanNum(f.monthlyRent));

    if (this.isUnderConstruction()) {
      formData.append('BuildYear', '0'); 
    } else {
      formData.append('BuildYear', cleanNum(f.buildYear));
    }

    if (f.deliveryYear !== null && f.deliveryYear !== '') {
      formData.append('DeliveryYear', cleanNum(f.deliveryYear));
    }

    if (this.newMainPhotoIndex !== null) formData.append('MainPhotoIndex', this.newMainPhotoIndex.toString());
    this.selectedPhotos().forEach(p => formData.append('Photos', p.file));

    this.propertyService.updateProperty(this.propertyId, formData).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('Property Updated Successfully!');
        this.router.navigate(['/my-properties']);
      },
      error: (err) => {
        this.alertService.close();
        this.isSubmitting = false;
        
        let errorMsg = 'Error while saving. Please check all fields.';
        if (err.error) {
          if (typeof err.error === 'string') errorMsg = err.error;
          else if (err.error.title) errorMsg = err.error.title; 
          else if (err.error.errors) errorMsg = JSON.stringify(err.error.errors);
        }
        
        console.error("Backend Error:", err);
        this.alertService.error(errorMsg, 'Update Failed');
      }
    });
  }
  updateCounter(name: string, amt: number) {
    const ctrl = this.editForm.get(name);
    const total = this.editForm.get('totalFloors')?.value || 0;
    if (ctrl) {
      const newVal = (ctrl.value || 0) + amt;
      if (newVal >= 0) {
        if (name === 'floor' && newVal > total) return;
        ctrl.patchValue(newVal);
      }
    }
  }

  validateFloorInput() {
    const f = this.editForm.get('floor')?.value;
    const t = this.editForm.get('totalFloors')?.value;
    if (f > t) this.editForm.get('floor')?.patchValue(t);
  }

  formatInitialAmount(controlName: string) {
    const val = this.editForm.get(controlName)?.value;
    if (val) {
      this.editForm.get(controlName)?.setValue(Number(val).toLocaleString('en-US'), { emitEvent: false });
    }
  }

  mapCityToId(c: string) { const m: any = { 'Cairo': 1, 'Alexandria': 2, 'NorthCoast': 3 }; return m[c] || 1; }
  mapListingToId(t: string) { const m: any = { 'Resale': 0, 'Rent': 1, 'Primary': 2, 'ResaleProject': 3 }; return m[t] ?? 0; }
  mapTypeToId(t: string) { const m: any = { 'Apartment': 0, 'Villa': 1, 'Shop': 2, 'Office': 3, 'Chalet': 4, 'FullFloor': 5 }; return m[t] ?? 0; }
  mapFinishingToId(f: string) { const m: any = { 'CoreAndShell': 0, 'SemiFinished': 1, 'FullyFinished': 2, 'SemiFurnished': 3, 'FullyFurnished': 4 }; return m[f] ?? 2; }
  mapDeliveryToId(s: string) { const m: any = { 'Ready': 0, 'UnderConstruction': 1 }; return m[s] ?? 0; }
  mapAreaTypeToId(val: string) { return val === 'LandArea' ? 0 : 1; }
  mapVillaCatToId(val: string) {
    const cats: any = { 'Standalone': 0, 'TwinHouse': 1, 'TownHouse': 2, 'TiesseraLower': 3, 'TiesseraUpper': 4, 'SkyVilla': 5 };
    return cats[val] ?? 0;
  }
  mapVillaSubToId(val: string) {
    if (!val || val === 'null' || val === 'None') return null;
    const types: any = { 'Basement': 0, 'Penthouse': 1, 'Corner': 2, 'Middle': 3 };
    return types[val] ?? null;
  }

  // 🟢 1. دالة لتحميل صورة واحدة للبروكر
  downloadPhoto(url: string, index: number, e: Event) {
    e.stopPropagation(); // عشان المتصفح ميعملش Set as Main للصورة وإحنا بندوس تحميل
    this.alertService.showLoading('Downloading...');
    
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `My_Property_Image_${index + 1}.jpg`; // اسم الصورة لما تنزل
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.alertService.close();
      })
      .catch(err => {
        console.error(err);
        this.alertService.close();
        this.alertService.error('Failed to download image.');
      });
  }

  // 🟢 2. دالة لتحميل كل الصور بضغطة واحدة للبروكر
  downloadAllPhotos() {
    const photos = this.existingPhotos();
    if (!photos || photos.length === 0) return;
    
    this.alertService.success('Starting download... Please allow multiple downloads if prompted.');
    
    // استخدام مهلة زمنية (نصف ثانية) بين كل صورة عشان المتصفح ميمنعش التحميل المتعدد
    photos.forEach((photo, index) => {
      setTimeout(() => {
        this.downloadPhoto(photo.url, index, new Event('click'));
      }, index * 500); 
    });
  }

  // 🟢 3. دالة حذف الصورة القديمة من قاعدة البيانات والشاشة
  deleteExistingPhoto(photoId: number, index: number, event: Event) {
    event.stopPropagation(); // عشان المتصفح ميعتبرش إننا بندوس Set as Main

    this.alertService.confirm('Are you sure you want to permanently delete this photo?', () => {
      this.alertService.showLoading('Deleting photo...');
      
      // هنا بننادي على سيرفيس العقارات لمسح الصورة 
      // (تأكدي إن عندك دالة deletePhoto في PropertyService)
      this.propertyService.deletePhoto(this.propertyId, photoId).subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('Photo deleted successfully.');
          
          // مسح الصورة من الشاشة فوراً (تحديث الـ Signal)
          this.existingPhotos.update(photos => {
            const newPhotos = [...photos];
            newPhotos.splice(index, 1);
            return newPhotos;
          });
        },
        error: (err) => {
          console.error(err);
          this.alertService.close();
          this.alertService.error('Failed to delete the photo.');
        }
      });
    });
  }
}