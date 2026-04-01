import { Component, inject, OnInit, signal, ChangeDetectorRef, computed  } from '@angular/core';
import { CommonModule } from '@angular/common'; // مهم جداً للأوامر مثل *ngIf
import { PropertyCardComponent } from '../property-card/property-card'; // مهم لكي يتعرف على الكارت
import { PropertyService } from '../../Services/property';
import { Property } from '../../Models/property.model';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth';
import { AdminService } from '../../Services/admin';
import { GoogleAnalyticsService } from 'ngx-google-analytics';



@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PropertyCardComponent], 
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  properties = signal<Property[]>([]); 
  message = signal<string>('');
  ads = signal<any[]>([]);

  adminPhone = signal<string>('');
  private gaService = inject(GoogleAnalyticsService);

  resaleProps = computed(() => this.properties().filter(p => p.listingType === 'Resale'));
  resaleProjectProps = computed(() => this.properties().filter(p => p.listingType === 'ResaleProject'));
  primaryProps = computed(() => this.properties().filter(p => p.listingType === 'Primary'));
  rentProps = computed(() => this.properties().filter(p => p.listingType === 'Rent'));


  isLoading = signal<boolean>(false);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef); 
  constructor(private propertyService: PropertyService, 
  private router: Router, private activatedRoute: ActivatedRoute, private authService: AuthService,
  private adminService: AdminService) {}

  currentListingType: string | null = null;
  currentProjectName: string | null = null;
  //availableProjects: string[] =[];
  availableProjectGroups: { region: string, projects: string[] }[] =[];


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
      'Palm hills', 'Sawari', 'The One', 'Muruj', 'Alex west', 'Skyline', 'Crystal towers', 
      'Grand view', 'Twin towers', 'Valore smouha', 'Valore antoniadis', 'East towers', 
      'Fayroza smouha', 'Saraya gardens', 'Veranda', 'Jackranda', 'Jara', 'Oria city', 
      'El safwa city', 'Vida', 'Abha hayat', 'Pharma city', 'Jewar', 'Ouruba royals', 
      'Soly vie', 'San Stefano royals', 'Malaaz'
    ]
  },
   3: { // North Coast
    'Ras Al Hekma': ['Ramla', 'Azha', 'Naia Bay', 'El Masyaf', 'Fouka Bay', 'Remal', 'Hacienda West', 'Seashore', 'Ogami', 'Seashell Playa', 'La Vista Ras El Hikma', 'Caesar', 'Koun', 'Caesar Bay', 'Lyv', 'Mountain View Ras El Hikma', 'Solare', 'Swan Lake', 'Seashell Ras El Hikma', 'The Med', 'Gaia', 'June', 'Direction White', 'Cali Coast', 'Hacienda Waters', 'Mar Bay', 'Jefaira', 'Sea View', 'Safia', 'Salt', 'Azzar Islands', 'Saada North Coast', 'Katamya Coast', 'Soul', 'Lvls','قرية لافيستا باي','قرية سواني','قرية الامارات هايتس','قرية قطامية كوست','قرية بالي','قرية ذا ووتر واي','قرية ذا شور','قرية سي فيو','قرية لاميرا','قرية وان علمين','قرية دايركشن وايت','قرية جون سوديك','قرية رملة','قرية ذا ميد','قرية كالي كوست','قرية سيتي ستارز','قرية رودس','قرية ذا كريبس جيفيرا','قرية ماونتن فيو الدبلوماسيين','قرية سيزر قيصر باي','قرية هاسيندا وايت','قرية جيفيرا','قرية بلوز تيفاني','قرية الجوهرة','قرية رويال بيتش','قرية لافيستا باي ايست','قرية كوست 82 سابقا المصيف حاليا','قرية فوكا كلوب','قرية المصيف','قرية نايا باي','قرية مينا كلوب','قرية ازها','قرية ملاذ سوديك','قرية كاي','قرية سيلفر ساندس','قرية وايت باي سيدي حنيش','قرية سيسيليا لاجونز','قرية اس باس سيدي حنيش','قرية ازميرالدا باي','قرية بورتو كريستال لاجونز','قرية جزر الجراولة'],
    'Al-Dabaa': ['Dose', 'The Water Way', 'Seazen', 'La Vista Bay', 'La Vista Bay East', 'Hacienda Blue', 'La Sirena', 'D bay', 'South Med','قرية كورونادو','قرية جاي','قرية دي باي','قرية لاسيرينا','قرية سيزين','قرية دوس'],
    'Sidi Abdulrahman': ['Telal', 'Hacienda Red', 'Hacienda White', 'Amwaj', 'Q North', 'SeaShell', 'Bianchi Ilios', 'Shamasi', 'Masaya', 'Location', 'Stella Heights', 'Alura', 'La vista Cascada', 'Maraasi', 'Stella', 'Diplo 3', 'Haceinda Bay','قرية هاسيندا باي','قرية ستيلا سيدي عبدالرحمن','قرية ليك يارد','ماراسي','قرية سكايا مراسي','قرية أجورا','قرية فرح','قرية لافيستا كاسكادا','قرية سي شيل بلايا','قرية سوان ليك','قرية ريتان','قرية مسايا','قرية اوركيديا','قرية ستيلا هايتس','قرية كاسكاديا','قرية بيانكي','قرية ستيلا مارينا','قرية أمواج','قرية بلومار','قرية هاسيندا وايت','قرية خليج غزالة','قرية زويا','قرية تلال'],
    'Ghazala Bay': ['Playa Ghazala', 'Ghazala Bay', 'Zoya'],
    'Al-Alamin': ['Zahra', 'Crysta', 'Plage', 'Lagoons', 'Alma', 'IL Latini', 'Downtown', 'Plam Hills North Coast', 'Mazarine', 'Golf Porto Marina', 'Marina 1', 'Marina 2', 'Marina 3', 'Marina 4', 'Marina 5', 'Marina 6', 'Marina 7', 'Marina 8','قرية مازارين','قرية مارسيليا لاند','قرية ليفير','قرية اركو لاجون','قرية فيستا مارينا','منتجع العلمين كابيتال','قرية باب البحر','قرية بلو فالي','قرية لازوردي باي','قرية بو ايلاند','قرية بو ساندس','قرية داون تاون مارينا','قرية رو مارينا','قرية بورتو مارينا','قرية سيا فيلاجيو','قرية جولف بورتو مارينا','قرية بورتو كروز'],
    'Sahel': ['Viller', 'The Island', 'Marina 8', 'North Code', 'Wanas Master', 'London', 'Eko Mena', 'Bungalows', 'Layana', 'Glee', 'قرية المهندسين', 'فخر البحار للقوات البحرية', 'قرية سيدرا', 'قرية ريزيه', 'قرية أمون','مايوركا', 'قرية كرير باراديس','قرية ألماظة باي','قرية داليا','قرية مصر للتعمير','قرية كرير لاجون','قرية الفيروز','قرية شاطئ الشروق','قرية البنوك','قرية الأطباء','قرية الطيارين','قرية جامعة القاهرة','قرية رمسيس','قرية كازابلانكا','قرية جولدن بيتش','قرية مرسي باجوش','قرية هليو بيتش','قرية مراقيا','قرية سرايات','قرية الدبلوماسيين التجاريين','قرية زمردة','قرية روزانا','قرية غرناطة','قرية فالنسيا','قرية ديانا بيتش','قرية هايدي','قرية سيلا','قرية الريفيرا','قرية تيباروز','قرية جراند هيلز','قرية المروة','قرية سلسبيل','قرية تاهيتي',
      'قرية التجاريين','قرية بلو باي','قرية باراديس بيتش','قرية البلاح','قرية قناة السويس','قرية ماربيلا','قرية اونديكسا','قرية روز فالي','قرية الرواد بيتش','قرية الكروان','قرية بالم بيتش','قرية كازابيانكا','قرية الروضة','قرية جامعة الدول العربية','قرية جامعة عين شمس','قرية المعمورة الجديدة','قرية الصفا','قرية بانجلوز','قرية حورس والرمال الذهبية','قرية زهرة','قرية بيلا ميرا','قرية ديمورا','قرية مارسيليا بوكية','قرية وايت ساند','قرية بانوراما بيتش','قرية عايدة','قرية المعادي','قرية مرحبا بيتش','قرية ريتال فيو','قرية كاربيان','قرية ريماس','قرية الروان','قرية المنتزة','قرية ايكو','قرية المرجان','','قرية قرطاج','قرية مارينا فلاورز','قرية أغادير','قرية سيرينا','قرية الصحفيين','قرية بلو بلاجا','قرية كوستا دل سول','قرية بيو بيلا','قرية روتندو كوست','قرية سانتوريني','قرية بدر','قرية فيرجينيا','قرية نيفادا هيلز','قرية كيلوباترا','قرية الزهور','قرية مارينا صن شاين','قرية البوسيت','قرية جرين بيتش','قرية سوميد','قرية جامعة أسيوط','قرية دياموند بيتش','قرية أتيك','قرية مارينا جاردنز','قرية اللوتس','قرية أكوا فيو','قرية باترسي','قرية بيترو بيتش','قرية مارينا فالي','قرية بيلا مارينا',
    ]
  }
  };

ngOnInit(): void {
  this.route.queryParams.subscribe(params => {
    this.currentListingType = params['listingType']?.toString() || null;
    this.currentProjectName = params['projectName'] || '';
      
    this.updateProjectsList(params['city']);
    this.loadProperties(params);
  });

  this.adminService.getPublicBanners().subscribe({
    next: (data: any[]) => {
      
      // تحويل البيانات لشكل الكاراسول
      const formattedAds = data.map((b: any) => ({
        image: b.imageUrl, // تأكدي أن الحرف i صغير
        message: `Hello, I am interested in your Ad: ${b.messageTitle}`
      }));

      // تحديث السجنل بالبيانات الجديدة
      this.ads.set(formattedAds);

      // ================== الجزء المطور لحل مشكلة الظهور ==================
      // ننتظر 100 ملي ثانية لضمان أن @for رسم الصور في الصفحة
      setTimeout(() => {
        this.cdr.detectChanges(); // إجبار الأنجولار على رؤية الصور الجديدة
        
        // تشغيل الكاراسول يدوياً لضمان أنه سيعرض أول صورة ويبدأ الحركة
        const bootstrap = (window as any).bootstrap;
        const carouselElement = document.querySelector('#adsCarousel');
        if (carouselElement && bootstrap) {
          const carousel = new bootstrap.Carousel(carouselElement, {
            interval: 3000,
            ride: 'carousel',
            pause: 'hover'
          });
          carousel.cycle();
        }
      }, 100);
      // =============================================================
    },
    error: (err) => console.error('Banners Error:', err)
  });

  // 3. جلب رقم الأدمن للتواصل
  this.authService.getAdminContact().subscribe(res => {
    this.adminPhone.set(res.phoneNumber);
  });
}

updateProjectsList(cityId: any) {
    this.availableProjectGroups =[]; // تصفير القائمة
    const id = Number(cityId);

    if (id && id !== null && !isNaN(id)) {
      // 🟢 جلب مناطق ومشاريع مدينة معينة
      const cityData = this.projectsMapping[id];
      if (cityData) {
        for (const [region, projects] of Object.entries(cityData)) {
          this.availableProjectGroups.push({
            region: region === 'any' ? 'All Regions' : region,
            projects: projects as string[]
          });
        }
      }
    } else {
      // 🟢 لو مش مختار مدينة، نجيب كل المشاريع متقسمة حسب مناطقها
      for (const [cId, cityData] of Object.entries(this.projectsMapping)) {
        for (const [region, projects] of Object.entries(cityData as any)) {
          const groupName = region === 'any' ? (cId === '2' ? 'Alexandria' : 'All Regions') : region;
          this.availableProjectGroups.push({
            region: groupName,
            projects: projects as string[]
          });
        }
      }
    }

    // ترتيب أبجدي للمناطق والمشاريع بداخلها لسهولة البحث
    this.availableProjectGroups.sort((a, b) => a.region.localeCompare(b.region));
    this.availableProjectGroups.forEach(g => {
      g.projects = Array.from(new Set(g.projects)).sort();
    });
  }

  initCarousel() {
    const bootstrap = (window as any).bootstrap;
    const carouselElement = document.querySelector('#adsCarousel');
    if (carouselElement && bootstrap) {
      const carousel = new bootstrap.Carousel(carouselElement, {
        interval: 3000,
        ride: 'carousel'
      });
      carousel.cycle();
    }
  }

  onAdClick(message: string) {
    if (!this.adminPhone()) return;
    let phone = this.adminPhone().replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '2' + phone;
    // فتح واتساب الأدمن بالرسالة المخصصة للبنر ده
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  }


  /* loadProperties(filters: any = {}) {
  this.isLoading.set(true);
  this.propertyService.getProperties(filters).subscribe({
    next: (response: any) => {
      this.isLoading.set(false);
      
      // 1. استخراج البيانات (سواء كانت مصفوفة أو كائن فيه رسالة)
      const data = response.message ? response.data : response;
      this.properties.set(data || []);

      // 2. تحديث الرسالة بناءً على الحالة
      if (!data || data.length === 0) {
        if (filters.brokerId) {
          // لو فيه brokerId في الرابط، اظهر الرسالة المخصصة
          this.message.set("This agent hasn't listed any properties yet.");
        } else {
          // لو بحث عادي، اظهر الرسالة العادية
          this.message.set("No properties match your search criteria.");
        }
      } else {
        this.message.set(''); // مسح الرسالة لو فيه نتائج
      }
    },
    error: (err) => {
      this.isLoading.set(false);
      console.error(err);
    }
  });
} */

  loadProperties(filters: any = {}) {
    this.isLoading.set(true);
    
    // 🟢 تطبيق القاموس على الكلمات قبل إرسالها للباك إند
    const apiFilters = { ...filters };
    if (apiFilters.searchTerm) apiFilters.searchTerm = this.getSmartSearchTerm(apiFilters.searchTerm);
    if (apiFilters.projectName) apiFilters.projectName = this.getSmartSearchTerm(apiFilters.projectName);

    this.propertyService.getProperties(apiFilters).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        const data = response.message ? response.data : response;
        this.properties.set(data ||[]);

        if (!data || data.length === 0) {
          if (filters.brokerId) this.message.set("This agent hasn't listed any properties yet.");
          else this.message.set("No properties match your search criteria.");
        } else {
          this.message.set('');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

getSmartSearchTerm(term: string): string {
    if (!term) return '';
    let t = term.toLowerCase().trim();
    
    // مسح كلمة "قرية" من البحث عشان يركز على اسم المشروع نفسه ويترجمه صح
    let cleanTerm = t.replace('قرية ', '').replace('village ', '');

    const dict: any = {
      'palm hills': 'بالم هيلز', 'بالم هيلز': 'palm hills',
      
      // 🟢 ضفنا كل احتمالات ماراسي عشان يلقطها دايماً
      'marassi': 'ماراسي', 'maraasi': 'ماراسي', 'مراسي': 'maraasi', 'ماراسي': 'maraasi',
      'Muruj': 'مروج', 'مروج': 'Muruaj',
      'city edge': 'سيتي إيدج', 'سيتي إيدج': 'city edge',
      'golden beach': 'جولدن بيتش', 'جولدن بيتش': 'golden beach',
      'golf porto marina': 'جولف بورتو مارينا', 'جولف بورتو مارينا': 'golf porto marina',
      'ramla': 'رملة', 'رملة': 'ramla',
      'azha': 'ازها', 'ازها': 'azha',
      'naia bay': 'نايا باي', 'نايا باي': 'naia bay',
      'el masyaf': 'الماسي', 'الماسي': 'el masyaf',
      'fouka bay': 'فوكا باي', 'فوكا باي': 'fouka bay', 
      'remal': 'رمال', 'رمال': 'remal',
      'hacienda west': 'هاسيندا ويست', 'هاسيندا ويست': 'hacienda west',
      'seashore': 'سي شور', 'ذا شور': 'seashore',
      'swan lake': 'سوان ليك', 'سوان ليك': 'swan lake',
      'mountain view': 'ماونتن فيو', 'ماونتن فيو': 'mountain view',
      'قطامية كوست': 'catamya coast', 'catamya coast': 'قطامية كوست',
      'sodic': 'سوديك', 'سوديك': 'sodic',
      'emaar': 'اعمار', 'إعمار': 'emaar', 'اعمار': 'emaar',
      'hacienda': 'هاسيندا', 'هاسيندا': 'hacienda',
      'la vista': 'لافيستا', 'لا فيستا': 'la vista', 'لافيستا': 'la vista',
      'zayed': 'زايد', 'زايد': 'zayed',
      'new cairo': 'التجمع', 'التجمع': 'new cairo',
      'north coast': 'الساحل', 'الساحل': 'north coast',
      'apartment': 'شقة', 'شقة': 'apartment', 'شقه': 'apartment',
      'villa': 'فيلا', 'فيلا': 'villa', 'فيله': 'villa',
      'chalet': 'شاليه', 'شاليه': 'chalet'
    };

    let expanded = [t]; // بنحتفظ بالكلمة الأصلية (مثال: قرية ماراسي)
    
    for (const [key, value] of Object.entries(dict)) {
      if (cleanTerm.includes(key)) {
        // بنضيف الترجمة (مثال: maraasi)
        expanded.push(cleanTerm.replace(key, value as string));
      }
    }

    // النتيجة ستكون مفصولة بـ | لكي يقرأها الباك إند
    // مثال لو اخترنا Maraasi هيبعت -> maraasi|ماراسي
    return Array.from(new Set(expanded)).join('|');
  }

  formatInteger(event: any) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, ''); // حذف أي شيء ليس رقماً
  }

  
  onSearch(params: any) {
  // تجميع الفلاتر مع مراعاة الحفاظ على listingType الحالي في الرابط
  const filters = {
    ...this.route.snapshot.queryParams,
    searchTerm: params.searchTerm || null,
    city: params.city || null,
    minPrice: params.minPrice || null,
    maxPrice: params.maxPrice || null,
    projectName: params.projectName || null,
    code: params.code || null,
    area: params.area || null,
    buildYear: params.buildYear || null,
    minRooms: params.minRooms || null,
    maxRooms: params.maxRooms || null,
    minBathrooms: params.minBathrooms || null,
    maxBathrooms: params.maxBathrooms || null,
    minFloor: params.minFloor || null,
    maxFloor: params.maxFloor || null
  };

  // تحديث الرابط فوراً
  this.router.navigate(['/home'], { queryParams: filters });
}
clearFilters() {
  // التوجه للهوم بدون أي Query Params
  this.router.navigate(['/home']);
  
}

getAdminWhatsApp(): string {
  if (!this.adminPhone()) return '#';
  let phone = this.adminPhone().replace(/\D/g, '');
  if (phone.startsWith('0')) phone = '2' + phone;
  const msg = encodeURIComponent("Hello, I have an inquiry regarding BETK properties.");
  return `https://wa.me/${phone}?text=${msg}`;
}


handleAdminContact(event: Event, type: 'whatsapp' | 'call') {
  event.preventDefault(); // منع المتصفح من فتح الرابط تلقائياً

  if (!this.authService.loggedIn()) {
    this.router.navigate(['/login']);
    return;
  }

      this.gaService.event('contact_click', type, this.adminPhone() || '0');


  // 3. لو مسجل، نفذ عملية التواصل
  const phone = this.adminPhone();
  if (!phone) return;

  if (type === 'call') {
    window.location.href = 'tel:' + phone;
  } else {
    window.open(this.getAdminWhatsApp(), '_blank');
  }
}
}