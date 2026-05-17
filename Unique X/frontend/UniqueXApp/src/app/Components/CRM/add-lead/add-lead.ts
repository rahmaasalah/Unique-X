import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CrmService } from '../../../Services/crm.services';
import { AlertService } from '../../../Services/alert';
import { Router } from '@angular/router';
import { AdminService } from '../../../Services/admin';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-add-lead',
  standalone: true,
  imports:[CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-lead.html'
})
export class AddLeadComponent implements OnInit {
  private crmService = inject(CrmService);
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);
  public router = inject(Router);

  leadForm!: FormGroup;
  currentBrokerId: string = '';
  campaignsList: any[] =[];

   isAdmin = signal<boolean>(false);
  brokersList = signal<any[]>([]);
  selectedBulkBroker: string = '';
  bulkFile: File | null = null;

  importedLeads = signal<any[]>([]);
  masterBrokerId = signal<string>('');

  // الداتا الثابتة للمناطق والمشاريع
  zones =[
    { id: 1, name: 'Cairo' },
    { id: 2, name: 'Alexandria' },
    { id: 3, name: 'North Coast' }
  ];

  dummyBrokers = [
    { code: 'X7', name: 'Abdelrahman Ashraf' },
    { code: 'X10', name: 'Menna Ameen' },
    { code: 'X249', name: 'Ashraf Saad' },
    { code: 'X646', name: 'Nadia Salem' },
    { code: 'X9', name: 'Hussine Ehab' },
    { code: 'X652', name: 'Mohamed Ali' },
    { code: 'X653', name: 'Mohamed Khaled' },
    { code: 'X656', name: 'Mayar Elkhalil' },
    { code: 'X659', name: 'Yasmine Mohamed' },
    { code: 'X660', name: 'Ahmed Ramadan' },
    {code: 'X661', name: 'Ibrahim Mahmoud'},
    {code: 'X665', name: 'Belal Elsayed'},
    {code: 'X666', name: 'Mohmoud Ali'},
    {code: 'X668', name: 'Mostafa Elsayed'},
    {code: 'X2', name: 'Hagar Mohamed'},
    {code: 'X101', name: 'Alaa Ashraf'},
    {code: 'X8', name: 'Abeer Ashraf'},

  ];

  sourcesList = [
    'Facebook', 'Paid Ads', 'MarketPlace Ads', 'Google Ads', 'Property Finder', 
    'Bayut', 'Akar map', 'Groups', 'WhatsApp', 'Betk page', 'Shaety Page', 
    'Semsar Misr', 'Linkedin', 'Tiktok', 'Instagram', 'Market place'
  ];
  
  availablePropertyCodes = signal<string[]>([]);

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

  availableRegions: string[] =[];
  availableProjects: string[] =[];

  ngOnInit() {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      this.currentBrokerId = user.id || user.userId || ''; 
      
      if (user.roles && user.roles.includes('Admin')) {
        this.isAdmin.set(true);
        this.adminService.getAllUsers().subscribe(users => {
          this.brokersList.set(users.filter((u: any) => u.userType === 1));
        });
      }
    }
    
    this.initForm();
    this.setupDynamicFields();
    
    // تحميل أكواد العقارات للنوع الافتراضي (Resale)
    this.fetchPropertyCodes('Resale');
  }
  
  initForm() {
    this.leadForm = this.fb.group({
      fullName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      email: [''],
      brokerId: [this.isAdmin() ? '' : this.currentBrokerId, Validators.required],
      leadStatusId: [1, Validators.required], 
      campaignSource: [''], // 👈 الحقل الجديد
      campaignName: [''],   // 👈 الحقل الجديد
      referredBy: [''],
      propertyType: ['Apartment', Validators.required],
      purpose: ['Resale', Validators.required], 
      totalAmount: [0, [Validators.min(0)]],
      paymentMethod: ['Cash'],
      zoneId: [''],
      selectedRegions: [[]], 
      selectedProjects: [[]], 
      downPayment: [0, [Validators.min(0)]],
      installmentYears: [0, [Validators.min(0)]],
      preferredLocation: [''],
      notes: ['']
    });
  }

 setupDynamicFields() {
    // تحديث المناطق والمشاريع
    this.leadForm.get('zoneId')?.valueChanges.subscribe(zoneId => {
      this.leadForm.patchValue({ selectedRegions: [], selectedProjects: [] });
      this.availableRegions = this.regionsMapping[zoneId] || [];
      this.updateAvailableProjects(zoneId); 
    });

    // 🟢 السحر هنا: لما يغير الغرض (Primary/Resale..) بنجيب أكواد العقارات من الداتابيز
    this.leadForm.get('purpose')?.valueChanges.subscribe(purpose => {
      this.leadForm.patchValue({ selectedRegions: [], selectedProjects: [], downPayment: 0, installmentYears: 0, campaignName: '' });
      this.fetchPropertyCodes(purpose);
    });

    this.leadForm.get('paymentMethod')?.valueChanges.subscribe(() => {
      this.leadForm.patchValue({ downPayment: 0, installmentYears: 0 });
    });
  }

  fetchPropertyCodes(purpose: string) {
    if (purpose) {
      this.crmService.getPropertyCodesByPurpose(purpose).subscribe(codes => {
        this.availablePropertyCodes.set(codes);
      });
    }
  }

  updateAvailableProjects(zoneId: number) {
    this.availableProjects =[];
    if (!zoneId) return;

    const zoneProjectsMap = this.projectsMapping[zoneId];
    if (zoneProjectsMap) {
      Object.values(zoneProjectsMap).forEach((projectsArray: any) => {
        this.availableProjects = [...this.availableProjects, ...projectsArray];
      });
      // ترتيب المشاريع أبجدياً عشان البروكر يلاقي اللي بيدور عليه بسرعة
      this.availableProjects.sort();
    }
  }

  // دوال للتحكم في الـ Checkboxes
  onRegionChange(event: any, region: string) {
    const current = this.leadForm.get('selectedRegions')?.value as string[];
    if (event.target.checked) {
      this.leadForm.patchValue({ selectedRegions:[...current, region] });
    } else {
      this.leadForm.patchValue({ selectedRegions: current.filter(r => r !== region) });
    }
  }

  onProjectChange(event: any, project: string) {
    const current = this.leadForm.get('selectedProjects')?.value as string[];
    if (event.target.checked) {
      this.leadForm.patchValue({ selectedProjects: [...current, project] });
    } else {
      this.leadForm.patchValue({ selectedProjects: current.filter(p => p !== project) });
    }
  }

  // Getters للتحكم في ظهور الحقول في الـ HTML
  get showRegionSelection() {
    const purpose = this.leadForm.get('purpose')?.value;
    return ['Resale', 'Rent'].includes(purpose); 
  }

  get showProjectSelection() {
    const purpose = this.leadForm.get('purpose')?.value;
    return ['Primary', 'Resale Project', 'Rent'].includes(purpose);
  }

  get showFinancialDetails() {
    if (!this.leadForm) return false;
    const purpose = this.leadForm.get('purpose')?.value;
    const payment = this.leadForm.get('paymentMethod')?.value;
    
    // 🟢 التعديل هنا: هتظهر دايماً مع التقسيط بشرط إن الغرض ميكونش "إيجار"
    return payment === 'Installment' && purpose !== 'Rent'; 
  }

  preventNegative(event: any) {
    if (event.key === '-' || event.key === 'e' || event.key === '+') event.preventDefault();
  }

  formatCurrency(event: any, controlName: string) {
    // 1. مسح أي حروف أو فواصل قديمة (يسمح بالأرقام فقط)
    let value = event.target.value.replace(/,/g, '').replace(/\D/g, '');
    
    if (value) {
      // 2. تحويل النص لرقم وإضافة الفاصلة
      const numberValue = parseInt(value, 10);
      event.target.value = numberValue.toLocaleString('en-US'); // تحديث الرقم على الشاشة
      this.leadForm.patchValue({ [controlName]: numberValue }, { emitEvent: false }); // حفظ الرقم الصافي في الفورم
    } else {
      event.target.value = '';
      this.leadForm.patchValue({ [controlName]: null }, { emitEvent: false });
    }
  }

  onSubmit() {
    if (this.leadForm.valid) {
      this.alertService.showLoading('Adding new lead...');
      
      const submitData = { ...this.leadForm.value };
      submitData.selectedRegions = submitData.selectedRegions.join(', ');
      submitData.selectedProjects = submitData.selectedProjects.join(', ');

      submitData.totalAmount = submitData.totalAmount ? parseInt(String(submitData.totalAmount).replace(/,/g, ''), 10) : 0;
      submitData.downPayment = submitData.downPayment ? parseInt(String(submitData.downPayment).replace(/,/g, ''), 10) : 0;
      submitData.installmentYears = submitData.installmentYears ? parseInt(String(submitData.installmentYears).replace(/,/g, ''), 10) : 0;

      if (submitData.campaignId === '') submitData.campaignId = null;
      if (submitData.zoneId === '') submitData.zoneId = null;

      this.crmService.createLead(submitData).subscribe({
        next: (res) => {
          this.alertService.close();
          
          // 🟢 السحر هنا: فحص التكرار
          if (res.isDuplicate) {
            const swal = (window as any).Swal;
            swal.fire({
              title: 'Duplicate Lead Detected!',
              text: 'This phone number already exists. The lead has been saved but requires Admin approval before you can manage it in your pipeline.',
              icon: 'info',
              confirmButtonColor: '#ef3341'
            }).then(() => {
              this.router.navigate(['/crm/leads']);
            });
          } else {
            this.alertService.success('Lead added successfully!');
            this.router.navigate(['/crm/leads']);
          }
        },
        error: () => {
          this.alertService.close();
          this.alertService.error('Failed to add lead.');
        }
      });
    }
  }


  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const validExts = ['.csv', '.xlsx', '.xls'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExts.includes(fileExt)) {
      this.alertService.error('Invalid file format. Please upload an Excel (.xlsx) or CSV file.', 'Wrong File');
      event.target.value = ''; 
      return;
    }

    this.alertService.showLoading('Reading Excel File...');

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        
        // 🟢 قراءة الملف باستخدام مكتبة XLSX
        const workbook = XLSX.read(data, { type: 'array' }); 
        
        const sheetName = workbook.SheetNames[0]; // بناخد أول شيت
        const worksheet = workbook.Sheets[sheetName];
        
        // تحويل الشيت لمصفوفة ثنائية الأبعاد (سطور وعواميد)
        const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const parsed = [];
        const phoneSet = new Set<string>(); // لمنع التكرار جوه نفس الشيت

        // 🟢 نتجاهل أول سطر (الهيدر) ونبدأ من 1
        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          
          // نتأكد إن السطر فيه داتا والاسم مش فاضي
          if (row && row.length > 0 && row[0]) {
            const phone = row[1]?.toString().trim() || '';

            if (phone && !phoneSet.has(phone)) {
              phoneSet.add(phone); 
              
              // 🟢 استخراج اسم البروكر من عمود G (رقم 6)
              let matchedBrokerId = '';
              const excelBrokerName = row[6]?.toString().trim().toLowerCase(); 
              if (excelBrokerName) {
                const foundBroker = this.brokersList().find(b => 
                  (b.firstName + ' ' + b.lastName).toLowerCase().includes(excelBrokerName) ||
                  excelBrokerName.includes(b.firstName.toLowerCase())
                );
                if (foundBroker) matchedBrokerId = foundBroker.id;
              }

              // 🟢 تنظيف رقم الميزانية من عمود I (رقم 8)
              const budgetRaw = row[8]?.toString().replace(/,/g, '').replace(/\D/g, ''); 
              const budgetAmount = budgetRaw ? parseInt(budgetRaw, 10) : 0;

              // 🟢 تسكين الداتا في الفورمات اللي الباك إند طالبها بالمللي
              parsed.push({
                fullName: row[0]?.toString().trim() || '',               // A: Client Name
                phoneNumber: phone,                                      // B: Phone Number
                campaignSource: row[2]?.toString().trim() || '',         // C: Campaign Source
                campaignName: row[3]?.toString().trim() || '',           // D: Campaign Name
                referredBy: row[4]?.toString().trim() || '',             // E: Referred By
                notes: row[5]?.toString().trim() || '',                  // F: Notes
                brokerId: matchedBrokerId,                               // G: Sales person
                purpose: row[7]?.toString().trim() || 'Resale',          // H: Purpose
                totalAmount: budgetAmount,                               // I: budget
                propertyType: row[9]?.toString().trim() || 'Apartment',  // J: Property type
                
                // قيم افتراضية إجبارية عشان الـ API ميضربش 400
                email: '',
                leadStatusId: 1, 
                paymentMethod: 'Cash',
                campaignId: null,
                zoneId: null,
                preferredLocation: '',
                selectedRegions: '',
                selectedProjects: '',
                downPayment: 0,
                installmentYears: 0
              });
            }
          }
        }
        
        this.importedLeads.set(parsed); // عرض في الجدول
        event.target.value = ''; // تصفير زرار الرفع
        this.alertService.close(); // قفل رسالة التحميل

      } catch (error) {
        console.error('Excel Parsing Error Details:', error);
        this.alertService.close();
        this.alertService.error('Failed to parse the file! Please open "Console" tab to see the exact error.');
      }
    };
    
    // قراءة الملف בצيغة (ArrayBuffer) اللي مكتبة XLSX بتفهمها
    reader.readAsArrayBuffer(file);
  }

  downloadTemplate() {
    // 1. تحديد أسماء العواميد بنفس الترتيب اللي السيستم بيقراه في onFileSelect
    const headers = [
      "Client Name",                  // A (0)
      "Phone Number",                 // B (1)
      "Campaign Source",              // C (2) - e.g. Facebook
      "Campaign Name",                // D (3) - e.g. Palm Hills Ad
      "Referred By (Code)",           // E (4) - Broker Code if any
      "Notes",                        // F (5)
      "Assigned Broker (Name)",       // G (6)
      "Purpose (Resale/Primary...)",  // H (7)
      "Budget (Numbers only)",        // I (8)
      "Property Type (Apartment...)"  // J (9)
    ];

    // 2. تحويل المصفوفة لشيت
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);

    // 3. تظبيط عرض العواميد عشان الشيت يفتح شكله نظيف ومنظم
    const wscols = [
      { wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, 
      { wch: 35 }, { wch: 25 }, { wch: 25 }, { wch: 20 }, { wch: 25 }
    ];
    worksheet['!cols'] = wscols;

    // 4. إنشاء ملف الإكسيل ووضع الشيت بداخله
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads_Template");

    // 5. تحميل الملف تلقائياً للأدمن
    XLSX.writeFile(workbook, "BETK_Leads_Template.xlsx");
  }
  
  // دالة لتطبيق بروكر واحد على كل الجدول بضغطة زرار
  applyMasterBroker() {
    const broker = this.masterBrokerId();
    if (!broker) return;
    
    const updated = this.importedLeads().map(l => ({ ...l, brokerId: broker }));
    this.importedLeads.set(updated);
  }

  // حذف صف من الجدول قبل الحفظ
  removeImportedRow(index: number) {
    const current = [...this.importedLeads()];
    current.splice(index, 1);
    this.importedLeads.set(current);
  }

  // حفظ كل الجدول للداتابيز
  saveImportedLeads() {
    const leads = this.importedLeads();
    
    // التأكد إن كل صف واخد بروكر
    const unassigned = leads.filter(l => !l.brokerId);
    if (unassigned.length > 0) {
      this.alertService.error(`Please assign a broker to all leads. ${unassigned.length} leads are missing a broker.`);
      return;
    }

    this.alertService.showLoading('Saving all leads...');
    
    // بنجهز كل الطلبات
    const requests = leads.map(leadData => this.crmService.createLead(leadData));

    // forkJoin بتبعتهم كلهم للباك إند وتستنى يخلصوا كلهم
    forkJoin(requests).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success(`${leads.length} Leads imported successfully!`);
        this.importedLeads.set([]); // تفريغ الجدول
      },
      error: (err) => {
        this.alertService.close();
        console.error(err);
        this.alertService.error('An error occurred while saving some leads.');
      }
    });
  }

  uploadBulk() {
    if (!this.bulkFile || !this.selectedBulkBroker) {
      this.alertService.error('Please select a file and a broker.');
      return;
    }
    this.alertService.showLoading('Uploading Leads...');
    this.crmService.uploadBulkLeads(this.bulkFile, this.selectedBulkBroker).subscribe({
      next: (res) => {
        this.alertService.close();
        this.alertService.success(res.message);
        this.bulkFile = null;
        this.selectedBulkBroker = '';
      },
      error: () => {
        this.alertService.close();
        this.alertService.error('Failed to upload leads.');
      }
    });
  }
}