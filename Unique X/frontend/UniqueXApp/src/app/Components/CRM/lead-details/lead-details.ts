import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { CrmService } from '../../../Services/crm.services';
import { AlertService } from '../../../Services/alert';




export function futureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null; 
    const selectedDate = new Date(control.value).getTime();
    const now = new Date().getTime();
    return selectedDate < now ? { pastDate: true } : null; // لو الماضي، يرجع إيرور
  };
}


@Component({
  selector: 'app-lead-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './lead-details.html',
  styleUrls: ['./lead-details.css']
})
export class LeadDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private crmService = inject(CrmService);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);
  private router = inject(Router);
  leadInfo = signal<any>(null);
  requestDetails = signal<any>(null);
  visits = signal<any[]>([]);
  activities = signal<any[]>([]);
  statusHistory = signal<any[]>([]);

  leadId!: number;
  currentBrokerId: string = '';
  minDateTime: string = '';

  combinedTimeline = signal<any[]>([]); // اللستة المجمعة

  filteredIds: number[] =[];
  hasPrev = signal<boolean>(false);
  hasNext = signal<boolean>(false);

  
  // متغيرات الـ Reschedule
  isRescheduling = signal<boolean>(false);
  rescheduleId = signal<number | null>(null);
  rescheduleType = signal<'visit' | 'activity' | null>(null);

  activityAvailableRegions: string[] = [];
  activityAvailableProjects: string[] =[];

  recommendations = signal<any[]>([]); // لتخزين العقارات المرشحة

  // الفورمز
  visitForm!: FormGroup;
  activityForm!: FormGroup;
  actionFeedbackForm!: FormGroup;
  generalNoteForm!: FormGroup;

  stages =[
    { id: 1, name: 'New "To Call"' }, { id: 2, name: 'Waiting response on wtp msg' }, { id: 3, name: 'Request call another time' },
    { id: 4, name: 'Calls (request)' }, { id: 5, name: 'Waiting Client Feedback on unit' }, { id: 6, name: 'Follow Up For Visit' },
    { id: 7, name: 'Visit scheduled' }, { id: 8, name: 'Follow up After visit' }, { id: 9, name: 'Waiting feedback on project' },
    { id: 10, name: 'Follow up for Meeting' }, { id: 11, name: 'Meeting Scheduled' }, { id: 12, name: 'Follow up after meeting' },
    { id: 13, name: 'Follow up for developer meeting' }, { id: 14, name: 'Follow up for site visit' }, { id: 15, name: 'Site visit scheduled' },
    { id: 16, name: 'Follow up for event' }, { id: 17, name: 'Follow up after event' }, { id: 18, name: 'Follow up for closing' },
    { id: 19, name: 'Deal closed' }, { id: 20, name: 'Follow up, not now' }, { id: 21, name: 'N/A "unreachable"' },
    { id: 22, name: 'Lost Not interested' }, { id: 23, name: 'Low Budget' }, { id: 24, name: 'Number Issue' },
    { id: 25, name: 'Broker' }, { id: 26, name: 'Recommend to shift' }
  ];

  zones =[{ id: 1, name: 'Cairo' }, { id: 2, name: 'Alexandria' }, { id: 3, name: 'North Coast' }];

   regionsMapping: any = {
    1:['Sheikh Zayed', 'Green belt', '6th of October', 'North Expansions', 'October Gardens', 'Eastern Expansions', 'New Cairo'],
    2:['zizinia', 'Janaklis', 'Gliem', 'Fleming', 'San Stefano', 'Shods', 'Elshalalat', 'Wabur al-miyah', 'Al-Ibrahimiya', 'Al-Manshiyya', 'Camp Schésar', 'Muharram Bik', 'Mahattat Misr', 'Cleopatra', 'Al-Azariṭa', 'Al-Shatibi', 'Saba Basha', 'Sidi Gaber', 'Roshdy', 'Bolkley', 'Moustafa Kamel', 'Kafr Abdo', 'Stanly', 'Sidi Beshr', 'El-Mandara', 'Al-Suyuf', 'Victoria', 'Al-Aasafirah', 'Al-Maamoura', 'Toson', 'Smouha', 'New Smouha', 'Borj Al-Arab', 'Loran', 'Al-Agamy', 'King Mariout'],
    3:['Al-Dabaa', 'Sidi Abdulrahman', 'Ghazala Bay', 'Al-Alamin', 'Sahel', 'Ras Al Hekma']
  };

  projectsMapping: any = {
    1: { 
      'Sheikh Zayed':['Village West-Dorra', 'Elkarma Kay', 'Zed West-Ora', 'Skyramp-Upwyde', 'La Colina-Capital Hills', 'Ivoire West-Pre', 'Etapa-City Edge', 'Allegria-Sodic', 'Westown-Sodic', ' Bura Residence-Kafafy', 'Terrace-Hdp', '205-Arkan Palm', 'Elite West-Taj', 'Bliss Gate-Torec', 'The Harv-Dal', 'Genova West-Eastren', 'Jazal-Legacy Estates', 'Bahja-Symphony', 'Coy-Voya', 'Lien-Elysium', 'Belva-Karnak', 'Rovan-Epd', 'Guira-Kaia', 'Pavia-Taj', 'Cloudside-Hills', 'Civ West-Civilia', 'Bona Nova-Ad', 'Levent-El Diwanya', 'White Residence-Pledge', 'La Quinta-Rhd', 'Calma-Leaders', 'Via-Eagles', 'D.Mile-District 4', 'Zia Park-Hills', 'Rewaya-Siac', 'Rouh Zayed-Al Amaken'],
      'Green belt':['One 50 El-Gabry', 'Zg2-Zg', 'Montania Park-Everst View', 'T pearl-Torec', 'Novella-Al Karma', 'Stay-Zg', 'Tabah West-Zg', 'Upove-Contact', 'Zayard Elite-Palmier', 'El Patio Vera-La Vista', 'Levels-Duens', 'West End', 'Green Plaza', 'Vert-Palmier', 'S7n Shades-Zg', 'Yuva-Urban Edge', 'Lake West 5-Cairo Capital', 'Menorca-Mardev', 'Montania Gardens', 'Lake West 4-Cairo Capital', 'Montania-Everst view', 'Ira-El Gabry', 'The 8-El Gabry', 'West Line-Living Lines', 'Isola Villas-El Masria', 'Ladera Heights-Merath', 'Roudy-Zaya', 'Parkwoods-Malvern', 'Solimar', 'Moon Hills 5-Sakan', 'Ladera Rose-Merath', 'Kings Way-Mountain View'],
      '6th of October':['Ever-Cred', 'O/Nine-Miqqat', 'Jazebeya-Upwyde', 'Pyramids City 5', 'West Clay-Remal', 'Stay`n-A plus', 'Hayah-Jawad'],
      'North Expansions':['Rafts-The Ark', 'Elm Tree-Elm', 'One 33-Badreldin', 'Westdays-Ilcazar', 'ICity-Mountain View', 'October Plaza-Sodic', 'Diar 2-Tameer', 'Kayan-Badreldin', 'Nyoum October-Adh', 'Boulevard Hiils-Al Amar', 'Azalea-Egy Dev', 'Abha-Srd', 'Rayat-Malaz', 'Villaria-Mirad', 'M Apartments-Mirad', 'Murooj'],
      'October Gardens':['kite-Centrada', ' Belong-Centrada', 'Aqmar-Kayan', 'Tesla Residence-Tesla', 'Flw-Zg', 'Darvell-White Eagle', 'Tabeaa-Nasdaq', 'O west-Orascom', 'Ashgar City-Igi', 'River-West Way', 'Rock Eden-El Batal', 'Ixora-Jora', 'Westera-Kastorai', 'Seven-Harby', 'Sun Capital-Arabia Holding', 'Zat-Voya', 'Zaya', 'Solin-Levels', 'Jiran-A Plus', 'Vienna-Dream Hills', 'Beta Residence-Beta Egypt', 'Badya-Palm Hills', 'Mountain View kings way', 'Badya'],
      'Eastern Expansions':['Cleopatra Square-Cleopatra', 'Joya-Tcc', 'Nmq-Melee', 'keeva-Al Ahly Sabbour', 'Swan Lake West-Hassan Allam', 'Palm Parks-Palm Hills', 'Upville-Wadi El Nile', 'WestVille-Binbaz 9 El Masria', '31 West-M Squared', 'Club Hills-Hpd', 'Villagio-Modon', 'Tawny-Hyde Park', 'Signature-Hyde Park', 'Garden Lakes-Hyde Park', 'The Crown-Palm Hills', 'Px-Palm Hills', 'October Park-Mountain View', 'Joulz-Inertia', 'Midgard-Orbit', 'Giza Terracas-Marakez', 'West Leaves-El Attal', 'Hadaba-Pre', 'Nyoum Pyarmids-Adh', 'Brix-Inertia', 'Fifty 7-Inertia'],
      'New Cairo':['Swan Lake Residences-Hassan Allam', 'Sa`ada-Horizon', 'Capital Gardens-Palm Hills', 'Palm Hills New Cairo', '97 Hills-Palm Hills', 'Patio Oro-La Vista', 'Patio Hills-La vista', 'Hyde park New cairo', 'Solana East-Ora', 'Zed East-Ora', 'Hyde park Central', 'Patio Vida-La Vista', 'Patio Riva-La Vista', 'Crescent Walk-Marakez', 'Sa`ada Boutique-Horizon', 'District 5-Marakez', 'Kairo-One & Waterway', 'Hyde Park Views', 'Katameya Creeks-Starlight', 'El-Patio Town - La Vista', 'Al Patio 7-La Vista', 'W Signature-The Waterway', 'The View-The Waterway', 'Villette-Sodic', 'Regent`s Square - Al Dawlia', 'Fifth Square - Marasem', 'Waterway 1-The Waterway', 'Taj City-Madinet Masr', 'Stei8ht-Lmd', 'Creek Town-II Cazar', 'Yellow-Urbnlanes', 'Address East-Dorra', 'Telal East-Roya', 'ICity New Cairo-Mountain View', 'Mist-M Squared', 'Trio Gardens-M Squared', 'Sarai-Madinet Masr', 'Tierra-Sed', 'Glen-II Cazar', 'Roya', 'Cred-Ever', 'Midtown East-Better Home', 'The Crest-|| Cazar', 'Mountain View Hyde park', 'City Gate-Qatari Diar', 'IVoire East-Pre', 'Promenade-Wadi Degla', 'The WaterMarQ-The MarQ', 'Azad-Tameer', 'Noi-Urbnlanes', 'Galleria Moon Valley-Arabia Holding', 'Jayd-Sed', 'Mountain View 1.1', 'Ashrafieh-Arabia Holding', 'Jw Marriott Residences-Al Jazi', 'White Residence-Upwyde', 'Stone park-Royal', 'Stone Residence-Pre', 'Brooks-Pre', 'SQ1-Hdp', 'The Median-Egy Gab', 'Nile Boulevard-Nile', 'Eelaf-Erg', 'Life Wise-Eons', 'Linwood-Erg', 'Livair-Erg', 'Zeya-El Baron', 'Orla-ICapital', 'Peerage-Al riyadh Misr', 'Acasa Mia-Dar Al Alamia', 'Hope Memaar Al Ashraf', 'Notion-TownWriters', 'The lark-Tamayoz', 'La Colina-Capital Hills', 'Eastville - Ajna', 'Solay-Living Yards', 'Cavali-Al Basiony', 'Blue Tree-Sky Ad', 'Zomra East-Nations of Sky', 'The Red-Abm', 'Greya-El Baron', 'Kin-Imarra', 'Cattleya Arabco', 'Aster-Times', ' Boutique Village-Modon', 'Nurai-Mercon', 'Amara-New Plan', 'Isola Centra-El Masria', 'The Residence-Salam', 'True-UC', 'Avelin-Times', 'Garnet-Jadeer', '90 Avenue-Tabarak', 'The Ark', 'J East-Juzur', 'Palm East-Tg', 'Begonia-Menassat', 'Blanks-Manaj', 'Sephora Heights-Sephora', 'Jada & Blue-Aspect', 'Rock Vera-Al Batal', 'Jadie-Concrete', 'The Icon Gardens-Style Home', 'Valencia Valley-Ncb', 'Silvia-Ted', 'Yardin-Mass', 'Rivali-Samco Holding', 'Century city-Vantage', 'Amorada-Afaaq', 'Elen-Concrete', 'Wuud-Tharaa', 'Dijar-Azzar Reedy', 'Maliv-kulture', 'Noll-Kleek', 'Acasa Alma-Dar Al Alamia', 'Najm-Royal', 'Jiwar-Concrete', 'Home Residence-Home Town', 'Cairova-Rna', 'Lusail-Margins', 'Nest N Developments', 'Alca-Sag', 'Grounds - One / One']
    },
    2: { 
      'any':['Palm hills', 'Sawari', 'The One', 'Muruj', 'Alex west', 'Skyline', 'Crystal towers', 'Grand view', 'Twin towers', 'Valore smouha', 'Valore antoniadis', 'East towers', 'Fayroza smouha', 'Saraya gardens', 'Veranda', 'Jackranda', 'Jara', 'Oria city', 'El safwa city', 'Vida', 'Abha hayat', 'Pharma city', 'Jewar', 'Ouruba royals', 'Soly vie', 'San Stefano royals', 'Malaaz']
    },
    3: { 
      'Ras Al Hekma':['Ramla', 'Azha', 'Naia Bay', 'El Masyaf', 'Fouka Bay', 'Remal', 'Hacienda West', 'Seashore', 'Ogami', 'Seashell Playa', 'La Vista Ras El Hikma', 'Caesar', 'Koun', 'Caesar Bay', 'Lyv', 'Mountain View Ras El Hikma', 'Solare', 'Swan Lake', 'Seashell Ras El Hikma', 'The Med', 'Gaia', 'June', 'Direction White', 'Cali Coast', 'Hacienda Waters', 'Mar Bay', 'Jefaira', 'Sea View', 'Safia', 'Salt', 'Azzar Islands', 'Saada North Coast', 'Katamya Coast', 'Soul', 'Lvls', 'قرية لافيستا باي', 'قرية سواني', 'قرية الامارات هايتس', 'قرية قطامية كوست', 'قرية بالي', 'قرية ذا ووتر واي', 'قرية ذا شور', 'قرية سي فيو', 'قرية لاميرا', 'قرية وان علمين', 'قرية دايركشن وايت', 'قرية جون سوديك', 'قرية رملة', 'قرية ذا ميد', 'قرية كالي كوست', 'قرية سيتي ستارز', 'قرية رودس', 'قرية ذا كريبس جيفيرا', 'قرية ماونتن فيو الدبلوماسيين', 'قرية سيزر قيصر باي', 'قرية هاسيندا وايت', 'قرية جيفيرا', 'قرية بلوز تيفاني', 'قرية الجوهرة', 'قرية رويال بيتش', 'قرية لافيستا باي ايست', 'قرية كوست 82 سابقا المصيف حاليا', 'قرية فوكا كلوب', 'قرية المصيف', 'قرية نايا باي', 'قرية مينا كلوب', 'قرية ازها', 'قرية ملاذ سوديك', 'قرية كاي', 'قرية سيلفر ساندس', 'قرية وايت باي سيدي حنيش', 'قرية سيسيليا لاجونز', 'قرية اس باس سيدي حنيش', 'قرية ازميرالدا باي', 'قرية بورتو كريستال لاجونز', 'قرية جزر الجراولة'],
      'Al-Dabaa':['Dose', 'The Water Way', 'Seazen', 'La Vista Bay', 'La Vista Bay East', 'Hacienda Blue', 'La Sirena', 'D bay', 'South Med', 'قرية كورونادو', 'قرية جاي', 'قرية دي باي', 'قرية لاسيرينا', 'قرية سيزين', 'قرية دوس'],
      'Sidi Abdulrahman':['Telal', 'Hacienda Red', 'Hacienda White', 'Amwaj', 'Q North', 'SeaShell', 'Bianchi Ilios', 'Shamasi', 'Masaya', 'Location', 'Stella Heights', 'Alura', 'La vista Cascada', 'Maraasi', 'Stella', 'Diplo 3', 'Haceinda Bay', 'قرية هاسيندا باي', 'قرية ستيلا سيدي عبدالرحمن', 'قرية ليك يارد', 'قرية ماراسي', 'قرية سكايا مراسي', 'قرية أجورا', 'قرية فرح', 'قرية لافيستا كاسكادا', 'قرية سي شيل بلايا', 'قرية سوان ليك', 'قرية ريتان', 'قرية مسايا', 'قرية اوركيديا', 'قرية ستيلا هايتس', 'قرية كاسكاديا', 'قرية بيانكي', 'قرية ستيلا مارينا', 'قرية أمواج', 'قرية بلومار', 'قرية هاسيندا وايت', 'قرية خليج غزالة', 'قرية زويا', 'قرية تلال'],
      'Ghazala Bay':['Playa Ghazala', 'Ghazala Bay', 'Zoya'],
      'Al-Alamin':['Zahra', 'Crysta', 'Plage', 'Lagoons', 'Alma', 'IL Latini', 'Downtown', 'Plam Hills North Coast', 'Mazarine', 'Golf Porto Marina', 'Marina 1', 'Marina 2', 'Marina 3', 'Marina 4', 'Marina 5', 'Marina 6', 'Marina 7', 'Marina 8', 'قرية مازارين', 'قرية مارسيليا لاند', 'قرية ليفير', 'قرية اركو لاجون', 'قرية فيستا مارينا', 'منتجع العلمين كابيتال', 'قرية باب البحر', 'قرية بلو فالي', 'قرية لازوردي باي', 'قرية بو ايلاند', 'قرية بو ساندس', 'قرية داون تاون مارينا', 'قرية رو مارينا', 'قرية بورتو مارينا', 'قرية سيا فيلاجيو', 'قرية جولف بورتو مارينا', 'قرية بورتو كروز'],
      'Sahel':['Viller', 'The Island', 'Marina 8', 'North Code', 'Wanas Master', 'London', 'Eko Mena', 'Bungalows', 'Layana', 'Glee', 'قرية المهندسين', 'فخر البحار للقوات البحرية', 'قرية سيدرا', 'قرية ريزيه', 'قرية أمون', 'مايوركا', 'قرية كرير باراديس', 'قرية ألماظة باي', 'قرية داليا', 'قرية مصر للتعمير', 'قرية كرير لاجون', 'قرية الفيروز', 'قرية شاطئ الشروق', 'قرية البنوك', 'قرية الأطباء', 'قرية الطيارين', 'قرية جامعة القاهرة', 'قرية رمسيس', 'قرية كازابلانكا', 'قرية جولدن بيتش', 'قرية مرسي باجوش', 'قرية هليو بيتش', 'قرية مراقيا', 'قرية سرايات', 'قرية الدبلوماسيين التجاريين', 'قرية زمردة', 'قرية روزانا', 'قرية غرناطة', 'قرية فالنسيا', 'قرية ديانا بيتش', 'قرية هايدي', 'قرية سيلا', 'قرية الريفيرا', 'قرية تيباروز', 'قرية جراند هيلز', 'قرية المروة', 'قرية سلسبيل', 'قرية تاهيتي', 'قرية التجاريين', 'قرية بلو باي', 'قرية باراديس بيتش', 'قرية البلاح', 'قرية قناة السويس', 'قرية ماربيلا', 'قرية اونديكسا', 'قرية روز فالي', 'قرية الرواد بيتش', 'قرية الكروان', 'قرية بالم بيتش', 'قرية كازابيانكا', 'قرية الروضة', 'قرية جامعة الدول العربية', 'قرية جامعة عين شمس', 'قرية المعمورة الجديدة', 'قرية الصفا', 'قرية بانجلوز', 'قرية حورس والرمال الذهبية', 'قرية زهرة', 'قرية بيلا ميرا', 'قرية ديمورا', 'قرية مارسيليا بوكية', 'قرية وايت ساند', 'قرية بانوراما بيتش', 'قرية عايدة', 'قرية المعادي', 'قرية مرحبا بيتش', 'قرية ريتال فيو', 'قرية كاربيان', 'قرية ريماس', 'قرية الروان', 'قرية المنتزة', 'قرية ايكو', 'قرية المرجان', 'قرية قرطاج', 'قرية مارينا فلاورز', 'قرية أغادير', 'قرية سيرينا', 'قرية الصحفيين', 'قرية بلو بلاجا', 'قرية كوستا دل سول', 'قرية بيو بيلا', 'قرية روتندو كوست', 'قرية سانتوريني', 'قرية بدر', 'قرية فيرجينيا', 'قرية نيفادا هيلز', 'قرية كيلوباترا', 'قرية الزهور', 'قرية مارينا صن شاين', 'قرية البوسيت', 'قرية جرين بيتش', 'قرية سوميد', 'قرية جامعة أسيوط', 'قرية دياموند بيتش', 'قرية أتيك', 'قرية مارينا جاردنز', 'قرية اللوتس', 'قرية أكوا فيو', 'قرية باترسي', 'قرية بيترو بيتش', 'قرية مارينا فالي', 'قرية بيلا مارينا']
    }
  };

  visitAvailableRegions: string[] = [];
  visitAvailableProjects: string[] =[];


   ngOnInit() {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      this.currentBrokerId = user.id || user.userId || ''; 
    }

    const now = new Date();
    this.minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    // 👇 1. نقرأ قائمة الأرقام المتفلترة من الذاكرة
    const storedIds = sessionStorage.getItem('crm_filtered_leads');
    if (storedIds) {
      this.filteredIds = JSON.parse(storedIds);
    }

    // 👇 2. نستخدم subscribe عشان الشاشة تتحدث أوتوماتيك لما ندوس Next بدون ريفريش
    this.route.paramMap.subscribe(params => {
      this.leadId = Number(params.get('id'));
      if (this.leadId) {
        this.checkPagination(); // نفحص هل فيه Next ولا Previous
        this.initForms(); // نجهز الفورمز على الـ ID الجديد
        this.loadLeadData(this.leadId); // نحمل بيانات العميل الجديد
      }
    });
  }

  // 👇 دالة لمعرفة هل فيه عميل سابق أو تالي
  checkPagination() {
    if (this.filteredIds.length > 0) {
      const currentIndex = this.filteredIds.indexOf(this.leadId);
      this.hasPrev.set(currentIndex > 0);
      this.hasNext.set(currentIndex < this.filteredIds.length - 1 && currentIndex !== -1);
    }
  }

  // 👇 دالة التقليب
  navigateLead(direction: 'prev' | 'next') {
    const currentIndex = this.filteredIds.indexOf(this.leadId);
    if (direction === 'prev' && currentIndex > 0) {
      const prevId = this.filteredIds[currentIndex - 1];
      this.router.navigate(['/crm/leads', prevId]);
    } else if (direction === 'next' && currentIndex < this.filteredIds.length - 1) {
      const nextId = this.filteredIds[currentIndex + 1];
      this.router.navigate(['/crm/leads', nextId]);
    }
  }

 initForms() {
    this.visitForm = this.fb.group({
      leadId: [this.leadId],
      brokerId:[this.currentBrokerId],
      propertyCode: [''], // اختياري
      propertyName: [''], // اختياري
      brokerPhone: [''], // اختياري
      zoneId: ['', Validators.required],
      listingType:['', Validators.required],
      region: [''], // اختياري مبدئياً وهيتغير برمجياً
      project: [''], // اختياري مبدئياً وهيتغير برمجياً
      visitDate: ['',[Validators.required, futureDateValidator()]],
      location: ['', Validators.required],
      notes:['']
    });

    // فورم الملاحظة العمومية
    this.generalNoteForm = this.fb.group({
      note: ['', Validators.required]
    });

    // فورم الفيدباك الخاص بزيارة أو مكالمة
    this.actionFeedbackForm = this.fb.group({
      feedback: ['', Validators.required]
    });

    this.activityForm = this.fb.group({
      leadId:[this.leadId],
      assignedToId: [this.currentBrokerId],
      activityType:['Call', Validators.required],
      summary: ['', Validators.required],
      dueDate: ['',[Validators.required, futureDateValidator()]],
      notes: [''],
      propertyCode: [''], 
      propertyName: [''], 
      brokerPhone: [''], 
      zoneId:['', Validators.required],
      listingType:['', Validators.required],
      region: [''], 
      project:[''], 
    });

    this.setupVisitDynamicFields(); 
    this.setupActivityDynamicFields();
  }

  setupActivityDynamicFields() {
    this.activityForm.get('zoneId')?.valueChanges.subscribe(zoneId => {
      this.activityForm.patchValue({ region: '', project: '' });
      this.activityAvailableRegions = this.regionsMapping[zoneId] ||[];
      
      this.activityAvailableProjects =[];
      if (zoneId && this.projectsMapping[zoneId]) {
        Object.values(this.projectsMapping[zoneId]).forEach((projArray: any) => {
          this.activityAvailableProjects =[...this.activityAvailableProjects, ...projArray];
        });
        this.activityAvailableProjects.sort();
      }
    });

    this.activityForm.get('listingType')?.valueChanges.subscribe(type => {
      this.activityForm.patchValue({ region: '', project: '' });
      
      const regionCtrl = this.activityForm.get('region');
      const projectCtrl = this.activityForm.get('project');

      regionCtrl?.clearValidators();
      projectCtrl?.clearValidators();

      if (['Resale', 'Rent'].includes(type)) regionCtrl?.setValidators(Validators.required);
      if (['Primary', 'Resale Project', 'Rent'].includes(type)) projectCtrl?.setValidators(Validators.required);

      regionCtrl?.updateValueAndValidity();
      projectCtrl?.updateValueAndValidity();
    });
  }

  get showActivityRegion() {
    const type = this.activityForm.get('listingType')?.value;
    return['Resale', 'Rent'].includes(type);
  }

  get showActivityProject() {
    const type = this.activityForm.get('listingType')?.value;
    return['Primary', 'Resale Project', 'Rent'].includes(type);
  }

  setupVisitDynamicFields() {
    // لما الـ Zone تتغير
    this.visitForm.get('zoneId')?.valueChanges.subscribe(zoneId => {
      this.visitForm.patchValue({ region: '', project: '' });
      this.visitAvailableRegions = this.regionsMapping[zoneId] ||[];
      
      // تجميع كل المشاريع في الزون دي
      this.visitAvailableProjects = [];
      if (zoneId && this.projectsMapping[zoneId]) {
        Object.values(this.projectsMapping[zoneId]).forEach((projArray: any) => {
          this.visitAvailableProjects =[...this.visitAvailableProjects, ...projArray];
        });
        this.visitAvailableProjects.sort();
      }
    });

    // لما הـ Listing Type يتغير (لتفعيل الإجباري/الاختياري)
    this.visitForm.get('listingType')?.valueChanges.subscribe(type => {
      this.visitForm.patchValue({ region: '', project: '' });
      
      const regionCtrl = this.visitForm.get('region');
      const projectCtrl = this.visitForm.get('project');

      regionCtrl?.clearValidators();
      projectCtrl?.clearValidators();

      if (['Resale', 'Rent'].includes(type)) regionCtrl?.setValidators(Validators.required);
      if (['Primary', 'Resale Project', 'Rent'].includes(type)) projectCtrl?.setValidators(Validators.required);

      regionCtrl?.updateValueAndValidity();
      projectCtrl?.updateValueAndValidity();
    });
  }

   get showVisitRegion() {
    const type = this.visitForm.get('listingType')?.value;
    return['Resale', 'Rent'].includes(type);
  }

  get showVisitProject() {
    const type = this.visitForm.get('listingType')?.value;
    return ['Primary', 'Resale Project', 'Rent'].includes(type);
  }

  isTimePassed(dateValue: any): boolean {
    if (!dateValue) return false;
    const taskTime = new Date(dateValue).getTime();
    const nowTime = new Date().getTime();
    return taskTime <= nowTime;
  }

  loadLeadData(id: number) {
    this.crmService.getLeadDetails(id).subscribe({
      next: (res) => {
        
        // 🟢 1. بنسيب حرف الـ Z لتواريخ الإنشاء والتعديل بس (عشان دول بيتولدوا من السيرفر)
        if (res.leadInfo) {
          if (res.leadInfo.createdAt && !res.leadInfo.createdAt.endsWith('Z')) res.leadInfo.createdAt += 'Z';
          if (res.leadInfo.updatedAt && !res.leadInfo.updatedAt.endsWith('Z')) res.leadInfo.updatedAt += 'Z';
        }
        if (res.statusHistory) {
          res.statusHistory.forEach((h: any) => {
            if (h.changedAt && !h.changedAt.endsWith('Z')) h.changedAt += 'Z';
          });
        }

        // ❌ شيلنا أكواد الـ Z بتاعة الزيارات والمهام عشان تقرأ توقيتك صح 100%

        // حفظ الداتا 
        this.leadInfo.set(res.leadInfo);
        this.requestDetails.set(res.requestDetails);
        this.visits.set(res.visits ||[]);
        this.activities.set(res.activities ||[]);
        this.statusHistory.set(res.statusHistory ||[]);

        // تجميع وترتيب التايم لاين المجمع
        const v = (res.visits ||[]).map((x: any) => ({ ...x, _type: 'visit', _date: x.visitDate }));
        const a = (res.activities ||[]).map((x: any) => ({ ...x, _type: 'activity', _date: x.dueDate }));
        const combined = [...v, ...a].sort((a, b) => new Date(b._date).getTime() - new Date(a._date).getTime());
        this.combinedTimeline.set(combined);
      },
      error: (err) => console.error('Error fetching lead details:', err)
    });

    this.crmService.getLeadRecommendations(id).subscribe({
      next: (recs) => this.recommendations.set(recs),
      error: (err) => console.error('Error fetching recommendations', err)
    });
  }

  // 👇 الدالة الجديدة لتغيير الحالة من الـ Dropdown
  onStageChange(event: any) {
    const newStatusId = Number(event.target.value);
    
    this.alertService.showLoading('Updating Stage...');
    this.crmService.updateLeadStatus(this.leadId, {
      newStatusId: newStatusId,
      brokerId: this.currentBrokerId,
      notes: 'Stage updated from Profile'
    }).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('Stage updated successfully!');
        this.loadLeadData(this.leadId); // تحديث الداتا عشان الهيستوري يتكتب فيه
      },
      error: () => {
        this.alertService.close();
        this.alertService.error('Failed to update stage.');
        this.loadLeadData(this.leadId); // نرجعها زي ما كانت لو حصل خطأ
      }
    });
  }

  submitVisit() {
    if (this.visitForm.valid) {
      this.alertService.showLoading('Saving visit...');

      // 🟢 1. لو إحنا في وضع "تأجيل الميعاد" (Reschedule)
      if (this.isRescheduling() && this.rescheduleId()) {
        const newDate = this.visitForm.get('visitDate')?.value; // بناخد التاريخ الجديد بس
        
        this.crmService.rescheduleVisit(this.rescheduleId()!, newDate).subscribe({
          next: () => {
            this.alertService.close();
            this.alertService.success('Visit rescheduled successfully!');
            this.loadLeadData(this.leadId); // تحديث التايم لاين
            document.getElementById('closeVisitModal')?.click(); // قفل المودال
          },
          error: (err) => {
            console.error(err);
            this.alertService.close();
            this.alertService.error('Error rescheduling visit.');
          }
        });
      } 
      // 🟢 2. لو إحنا في وضع "إنشاء زيارة جديدة"
      else {
        const submitData = { ...this.visitForm.getRawValue() }; // getRawValue بتجيب الداتا حتى لو الخانات مقفولة
        
        // تنظيف الداتا لمنع خطأ 400 Bad Request
        if (submitData.zoneId === '') submitData.zoneId = null;

        this.crmService.scheduleVisit(submitData).subscribe({
          next: () => {
            this.alertService.close();
            this.alertService.success('Visit scheduled successfully!');
            this.visitForm.reset({ leadId: this.leadId, brokerId: this.currentBrokerId });
            this.loadLeadData(this.leadId); 
            document.getElementById('closeVisitModal')?.click();
          },
          error: (err) => {
            console.error(err);
            this.alertService.close();
            this.alertService.error('Error scheduling visit.');
          }
        });
      }
    }
  }

  submitActivity() {
    if (this.activityForm.valid) {
      this.alertService.showLoading('Saving activity...');

      // 🟢 1. لو إحنا في وضع "تأجيل الميعاد" (Reschedule)
      if (this.isRescheduling() && this.rescheduleId()) {
        const newDate = this.activityForm.get('dueDate')?.value; // بناخد التاريخ الجديد بس
        
        this.crmService.rescheduleActivity(this.rescheduleId()!, newDate).subscribe({
          next: () => {
            this.alertService.close();
            this.alertService.success('Activity rescheduled successfully!');
            this.loadLeadData(this.leadId);
            document.getElementById('closeActivityModal')?.click();
          },
          error: (err) => {
            console.error(err);
            this.alertService.close();
            this.alertService.error('Error rescheduling activity.');
          }
        });
      } 
      // 🟢 2. لو إحنا في وضع "إنشاء مهمة جديدة"
      else {
        const submitData = { ...this.activityForm.getRawValue() };
        
        // تنظيف الداتا لمنع خطأ 400 Bad Request
        if (submitData.zoneId === '') submitData.zoneId = null;

        this.crmService.logActivity(submitData).subscribe({
          next: () => {
            this.alertService.close();
            this.alertService.success('Activity logged successfully!');
            this.activityForm.reset({ leadId: this.leadId, assignedToId: this.currentBrokerId, activityType: 'Call' });
            this.loadLeadData(this.leadId); 
            document.getElementById('closeActivityModal')?.click();
          },
          error: (err) => {
            console.error(err);
            this.alertService.close();
            this.alertService.error('Error logging activity.');
          }
        });
      }
    }
  }

  onStatusChange(item: any, event: any) {
    const newStatus = event.target.value;
    
    // لو اختار تأجيل، نفتح المودال ونرجع السهم لـ Pending مؤقتاً
    if (newStatus === 'Rescheduled') {
      this.openRescheduleModal(item);
      event.target.value = item.status || 'Pending'; 
      return;
    }

    this.alertService.showLoading('Updating status...');
    const apiCall = item._type === 'visit' 
      ? this.crmService.updateVisitStatus(item.id, newStatus)
      : this.crmService.updateActivityStatus(item.id, newStatus);

    apiCall.subscribe({
      next: () => {
        this.alertService.close();
        this.loadLeadData(this.leadId);
        this.crmService.refreshNavbar$.next(); // تحديث الجرس
      }
    });
  }

  // 👇 2. دالة فتح مودال التأجيل (بتقفل كل الخانات وتفتح التاريخ بس)
  openRescheduleModal(item: any) {
    this.isRescheduling.set(true);
    this.rescheduleId.set(item.id);
    this.rescheduleType.set(item._type);

    const bootstrap = (window as any).bootstrap;
    if (item._type === 'visit') {
      this.visitForm.patchValue(item); 
      this.visitForm.disable(); 
      this.visitForm.get('visitDate')?.enable(); 
      new bootstrap.Modal(document.getElementById('visitModal')).show();
    } else {
      this.activityForm.patchValue(item);
      this.activityForm.disable();
      this.activityForm.get('dueDate')?.enable();
      new bootstrap.Modal(document.getElementById('activityModal')).show();
    }
  }

  // 👇 3. دالة فتح المودال لإضافة جديدة (عشان نلغي وضع التأجيل ونفتح الخانات)
  openNewModal(type: 'visit' | 'activity') {
    this.isRescheduling.set(false);
    if (type === 'visit') {
      this.visitForm.enable();
      this.visitForm.reset({ leadId: this.leadId, brokerId: this.currentBrokerId });
    } else {
      this.activityForm.enable();
      this.activityForm.reset({ leadId: this.leadId, assignedToId: this.currentBrokerId, activityType: 'Call' });
    }
  }

  // متغيرات عشان نعرف احنا بنعمل فيدباك لأنهي أكشن
  feedbackActionId = signal<number | null>(null);
  feedbackActionType = signal<'visit' | 'activity' | null>(null);

  openFeedbackModal(item: any) {
    this.feedbackActionId.set(item.id);
    this.feedbackActionType.set(item._type);
    this.actionFeedbackForm.reset();
    const bootstrap = (window as any).bootstrap;
    new bootstrap.Modal(document.getElementById('actionFeedbackModal')).show();
  }

  submitActionFeedback() {
    if (this.actionFeedbackForm.valid && this.feedbackActionId()) {
      this.alertService.showLoading('Saving feedback...');
      const feedbackText = this.actionFeedbackForm.value.feedback;
      const apiCall = this.feedbackActionType() === 'visit'
        ? this.crmService.addVisitFeedback(this.feedbackActionId()!, feedbackText)
        : this.crmService.addActivityFeedback(this.feedbackActionId()!, feedbackText);

      apiCall.subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('Feedback saved!');
          this.loadLeadData(this.leadId);
          document.getElementById('closeActionFeedbackModal')?.click();
        }
      });
    }
  }

  submitGeneralNote() {
    if (this.generalNoteForm.valid) {
      this.alertService.showLoading('Adding Note...');
      this.crmService.addGeneralNote(this.leadId, this.currentBrokerId, this.generalNoteForm.value.note).subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('Feedback saved successfully!');
          this.generalNoteForm.reset();
          this.loadLeadData(this.leadId);
          document.getElementById('closeGeneralNoteModal')?.click();
        }
      });
    }
  }

  // دالة صغيرة تفصل الفيدباك من الـ Notes بتاعت الـ Activity
  extractFeedback(notes: string): string | null {
    if (!notes) return null;
    const parts = notes.split('[Feedback]:');
    return parts.length > 1 ? parts[1].trim() : null;
  }
  extractOriginalNotes(notes: string): string | null {
    if (!notes) return null;
    const parts = notes.split('[Feedback]:');
    return parts[0].trim() !== '' ? parts[0].trim() : null;
  }

  onRecommendClick(prop: any) {
    // 1. فتح العقار في تاب جديد للموقع الأساسي
    const baseUrl = window.location.origin;
    window.open(`${baseUrl}/property-details/${prop.id}`, '_blank');

    // 2. لو مكنش متداس عليه قبل كده، هنعلم عليه في الداتابيز ونلونه أخضر
    if (!prop.isProposed) {
      prop.isProposed = true; // تحويل وهمي سريع للعين
      
      this.crmService.markPropertyAsProposed(this.leadId, prop.id).subscribe({
        error: () => prop.isProposed = false // نرجعه لو حصل إيرور
      });
    }
  }
  
}