import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CrmService } from '../../../Services/crm.services';
import { AlertService } from '../../../Services/alert';

@Component({
  selector: 'app-edit-request',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-request.html'
})
export class EditRequestComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private crmService = inject(CrmService);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);
  public router = inject(Router);

  leadId!: number;
  editRequestForm!: FormGroup;
  campaignsList: any[] =[];
  currentBrokerId: string = '';

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
      'Sahel':['Viller', 'The Island', 'Marina 8', 'North Code', 'Wanas Master', 'London', 'Eko Mena', 'Bungalows', 'Layana', 'Glee']
    }
  };

  availableRegions: string[] =[];
  availableProjects: string[] =[];

  ngOnInit() {
    this.leadId = Number(this.route.snapshot.paramMap.get('id'));
    this.initForm();
    this.crmService.getCampaigns().subscribe(data => this.campaignsList = data);
    
    if (this.leadId) {
      this.loadLeadData(this.leadId);
    }
    this.setupDynamicFields();
  }

  initForm() {
    this.editRequestForm = this.fb.group({
      fullName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      email: [''],
      leadStatusId: [1, Validators.required],
      campaignId: [''],
      referredBy: [''],
      
      propertyType: ['', Validators.required],
      purpose: ['', Validators.required],
      totalAmount: [''], // خليناها نص عشان تقبل الفواصل
      paymentMethod: ['Cash'],
      zoneId: [''],
      selectedRegions: [[]],
      selectedProjects: [[]],
      downPayment: [''],
      installmentYears: [''],
      preferredLocation: [''],
      notes: ['']
    });
  }

  loadLeadData(id: number) {
    this.crmService.getLeadDetails(id).subscribe({
      next: (res) => {
        if (res.leadInfo && res.requestDetails) {
          const info = res.leadInfo;
          const req = res.requestDetails;
          
          // عشان الـ zone متفصلش الداتا وهي بتعمل Load، بنوقف הـ Events مؤقتاً
          this.editRequestForm.get('zoneId')?.setValue(req.zoneId || '', { emitEvent: false });
          this.availableRegions = this.regionsMapping[req.zoneId] ||[];
          this.updateAvailableProjects(req.zoneId);

          const regionsArr = req.selectedRegions ? req.selectedRegions.split(', ').filter((x:any)=>x) :[];
          const projectsArr = req.selectedProjects ? req.selectedProjects.split(', ').filter((x:any)=>x) :[];

          // وضع البيانات وتنسيق الأرقام بالفواصل
          this.editRequestForm.patchValue({
            fullName: info.fullName,
            phoneNumber: info.phoneNumber,
            email: info.email,
            leadStatusId: info.statusId,
            campaignId: info.campaignId || '',
            referredBy: info.referredBy || '',

            propertyType: req.propertyType,
            purpose: req.purpose,
            paymentMethod: req.paymentMethod || 'Cash',
            zoneId: req.zoneId || '',
            selectedRegions: regionsArr,
            selectedProjects: projectsArr,
            
            totalAmount: req.totalAmount ? Number(req.totalAmount).toLocaleString('en-US') : '',
            downPayment: req.downPayment ? Number(req.downPayment).toLocaleString('en-US') : '',
            installmentYears: req.installmentYears ? Number(req.installmentYears).toLocaleString('en-US') : '',
            
            preferredLocation: req.preferredLocation,
            notes: req.notes
          }, { emitEvent: false });
        }
      },
      error: (err) => console.error('Error fetching lead details:', err)
    });
  }

  setupDynamicFields() {
    this.editRequestForm.get('zoneId')?.valueChanges.subscribe(zoneId => {
      this.editRequestForm.patchValue({ selectedRegions: [], selectedProjects: [] });
      this.availableRegions = this.regionsMapping[zoneId] ||[];
      this.updateAvailableProjects(zoneId); 
    });

    this.editRequestForm.get('purpose')?.valueChanges.subscribe(() => {
      this.editRequestForm.patchValue({ selectedRegions: [], selectedProjects:[], downPayment: '', installmentYears: '' });
    });
    this.editRequestForm.get('paymentMethod')?.valueChanges.subscribe(() => {
      this.editRequestForm.patchValue({ downPayment: '', installmentYears: '' });
    });
  }

  updateAvailableProjects(zoneId: number) {
    this.availableProjects =[];
    if (!zoneId) return;
    const zoneProjectsMap = this.projectsMapping[zoneId];
    if (zoneProjectsMap) {
      Object.values(zoneProjectsMap).forEach((projectsArray: any) => {
        this.availableProjects =[...this.availableProjects, ...projectsArray];
      });
      this.availableProjects.sort();
    }
  }

  onRegionChange(event: any, region: string) {
    const current = this.editRequestForm.get('selectedRegions')?.value as string[];
    if (event.target.checked) {
      this.editRequestForm.patchValue({ selectedRegions: [...current, region] });
    } else {
      this.editRequestForm.patchValue({ selectedRegions: current.filter(r => r !== region) });
    }
  }

  onProjectChange(event: any, project: string) {
    const current = this.editRequestForm.get('selectedProjects')?.value as string[];
    if (event.target.checked) {
      this.editRequestForm.patchValue({ selectedProjects: [...current, project] });
    } else {
      this.editRequestForm.patchValue({ selectedProjects: current.filter(p => p !== project) });
    }
  }

  get showRegionSelection() {
    const purpose = this.editRequestForm.get('purpose')?.value;
    return ['Resale', 'Rent'].includes(purpose); 
  }

  get showProjectSelection() {
    const purpose = this.editRequestForm.get('purpose')?.value;
    return ['Primary', 'Resale Project', 'Rent'].includes(purpose);
  }

  get showFinancialDetails() {
    if (!this.editRequestForm) return false;
    const purpose = this.editRequestForm.get('purpose')?.value;
    const payment = this.editRequestForm.get('paymentMethod')?.value;
    
    // 🟢 التعديل هنا: هتظهر دايماً مع التقسيط بشرط إن الغرض ميكونش "إيجار"
    return payment === 'Installment' && purpose !== 'Rent'; 
  }

  // 👇 دالة تنسيق الأرقام بـفواصل (12,000,000)
  formatCurrency(event: any, controlName: string) {
    let value = String(event.target.value).replace(/,/g, '').replace(/\D/g, '');
    if (value) {
      const formatted = parseInt(value, 10).toLocaleString('en-US');
      this.editRequestForm.patchValue({ [controlName]: formatted }, { emitEvent: false });
    } else {
      this.editRequestForm.patchValue({ [controlName]: '' }, { emitEvent: false });
    }
  }

  onUpdateRequest() {
    if (this.editRequestForm.valid) {
      this.alertService.showLoading('Saving Changes...');
      const submitData = { ...this.editRequestForm.value };
      
      // تجهيز المصفوفات لنصوص
      submitData.selectedRegions = submitData.selectedRegions.join(', ');
      submitData.selectedProjects = submitData.selectedProjects.join(', ');

      // 🟢 تنظيف الأرقام من الفواصل قبل ما تروح للداتابيز
      submitData.totalAmount = submitData.totalAmount ? parseInt(String(submitData.totalAmount).replace(/,/g, ''), 10) : 0;
      submitData.downPayment = submitData.downPayment ? parseInt(String(submitData.downPayment).replace(/,/g, ''), 10) : 0;
      submitData.installmentYears = submitData.installmentYears ? parseInt(String(submitData.installmentYears).replace(/,/g, ''), 10) : 0;

      if (submitData.campaignId === '') submitData.campaignId = null;
      if (submitData.zoneId === '') submitData.zoneId = null;

      this.crmService.updateLeadDetails(this.leadId, submitData).subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('Lead updated successfully!');
          this.router.navigate(['/crm/leads', this.leadId]); // نرجعه للبروفايل
        },
        error: () => {
          this.alertService.close();
          this.alertService.error('Failed to update details.');
        }
      });
    }
  }
}