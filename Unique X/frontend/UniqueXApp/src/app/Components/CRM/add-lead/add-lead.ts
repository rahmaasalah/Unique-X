import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CrmService } from '../../../Services/crm.services';
import { AlertService } from '../../../Services/alert';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-lead',
  standalone: true,
  imports:[CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-lead.html'
})
export class AddLeadComponent implements OnInit {
  private crmService = inject(CrmService);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);
  public router = inject(Router);

  leadForm!: FormGroup;
  currentBrokerId: string = '';
  campaignsList: any[] =[];

  // الداتا الثابتة للمناطق والمشاريع
  zones =[
    { id: 1, name: 'Cairo' },
    { id: 2, name: 'Alexandria' },
    { id: 3, name: 'North Coast' }
  ];

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
    }

    this.crmService.getCampaigns().subscribe(data => this.campaignsList = data);
    this.initForm();
    this.setupDynamicFields();
  }

  initForm() {
    this.leadForm = this.fb.group({
      fullName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      email: [''],
      brokerId: [this.currentBrokerId, Validators.required],
      leadStatusId: [1, Validators.required], // الـ 26 حالة موجودين في الـ HTML
      propertyType: ['Apartment', Validators.required],
      purpose: ['Resale', Validators.required], // القيمة الافتراضية
      campaignId: [''],
      totalAmount: [0, [Validators.min(0)]],
      paymentMethod: ['Cash'],
      referredBy: [''],
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
    // لما الـ Zone تتغير: بنحدث المناطق والمشاريع مع بعض بناءً على الزون فقط
    this.leadForm.get('zoneId')?.valueChanges.subscribe(zoneId => {
      this.leadForm.patchValue({ selectedRegions: [], selectedProjects: [] });
      this.availableRegions = this.regionsMapping[zoneId] ||[];
      this.updateAvailableProjects(zoneId); 
    });

    // لما الغرض أو الدفع يتغيروا بنفضي الداتا عشان لو غير رأيه
    this.leadForm.get('purpose')?.valueChanges.subscribe(() => {
      this.leadForm.patchValue({ selectedRegions: [], selectedProjects:[], downPayment: 0, installmentYears: 0 });
    });
    this.leadForm.get('paymentMethod')?.valueChanges.subscribe(() => {
      this.leadForm.patchValue({ downPayment: 0, installmentYears: 0 });
    });
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
    const purpose = this.leadForm.get('purpose')?.value;
    const payment = this.leadForm.get('paymentMethod')?.value;
    return payment === 'Installment' && ['Primary', 'Resale Project'].includes(purpose);
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
      
      // تحويل المصفوفة لنص عشات تتبعت للباك إند صح
      submitData.selectedRegions = submitData.selectedRegions.join(', ');
      submitData.selectedProjects = submitData.selectedProjects.join(', ');

      // 👇 الجزء الجديد لحل مشكلة الـ 400 Bad Request
      // تحويل النص الفاضي لـ null عشان الداتابيز تقبله كأرقام
      if (submitData.campaignId === '') {
        submitData.campaignId = null;
      }
      if (submitData.zoneId === '') {
        submitData.zoneId = null;
      }

      this.crmService.createLead(submitData).subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('Lead added successfully!');
          this.router.navigate(['/crm/leads']);
        },
        error: (err) => {
          console.error(err); // هيطبعلك تفاصيل الإيرور لو حصل تاني
          this.alertService.close();
          this.alertService.error('Failed to add lead.');
        }
      });
    }
  }
}