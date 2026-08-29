import { Component, OnInit, inject, signal, computed } from '@angular/core';
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

  dummyBrokers = signal<any[]>([]);

  sourcesList = [
    'Facebook', 'Paid Ads', 'MarketPlace Ads', 'Google Ads', 'Property Finder', 
    'Bayut', 'Akar map', 'Groups', 'WhatsApp', 'Betk page', 'Shaety Page', 
    'Semsar Misr', 'Linkedin', 'Tiktok', 'Instagram', 'Market place'
  ];
  
  availablePropertyCodes = signal<string[]>([]);


  availableRegions: string[] =[];
  availableProjects: string[] =[];

  searchCampaignCode = signal<string>('');
  isCampaignDropdownOpen = signal<boolean>(false);

  filteredCampaignCodes = computed(() => {
    const term = this.searchCampaignCode().toLowerCase();
    return this.availablePropertyCodes().filter(code => code.toLowerCase().includes(term));
  });

  selectCampaign(code: string) {
    this.leadForm.patchValue({ campaignName: code });
    this.searchCampaignCode.set(code);
    this.isCampaignDropdownOpen.set(false);
  }

  closeCampaignDropdown() {
    setTimeout(() => this.isCampaignDropdownOpen.set(false), 200);
  }

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
    this.fetchPropertyCodes('Resale');
    this.adminService.getBrokersWithCodes().subscribe({
      next: (data) => {
        const formatted = data
          .filter((b: any) => b.brokerCode)
          .map((b: any) => ({ code: b.brokerCode, name: `${b.firstName} ${b.lastName}` }));
        this.dummyBrokers.set(formatted);
      },
      error: (err) => console.error('Failed to load brokers with codes:', err)
    });
  }
  
  initForm() {
    this.leadForm = this.fb.group({
      fullName: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      email: [''],
      brokerId: [this.isAdmin() ? '' : this.currentBrokerId, Validators.required],
      leadStatusId: [1, Validators.required], 
      campaignSource: ['', Validators.required], // 👈 بقى Required
      campaignName: ['', Validators.required],   // 👈 بقى Required
      referredBy: ['', Validators.required],
      propertyType: ['Apartment', Validators.required],
      purpose: ['Resale', Validators.required], 
      totalAmount: [0, [Validators.min(0)]],
      paymentMethod: ['Cash'],
      zoneId: [''],
      selectedRegions: [[]], 
      selectedProjects: [[]], 
      downPayment: [0, [Validators.min(0)]],
      installmentYears: [0, [Validators.min(0)]],
      quarterlyInstallment: [0, [Validators.min(0)]],
      preferredLocation: [''],
      notes: ['']
    });
  }

 setupDynamicFields() {
    // تحديث المناطق والمشاريع
    this.leadForm.get('zoneId')?.valueChanges.subscribe(zoneId => {
      this.leadForm.patchValue({ selectedRegions: [], selectedProjects: [] });
      this.loadRegionsForZone(zoneId);
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

  // 🟢 المناطق (Regions) بقت جايه من الداتابيز (تاب Lookups بتاع الأدمن) بدل ليستة ثابتة في الكود
  loadRegionsForZone(zoneId: number) {
    this.availableRegions = [];
    if (!zoneId) return;
    this.adminService.getRegions(zoneId).subscribe({
      next: (regions: any[]) => {
        this.availableRegions = (regions || []).map(r => r.name).sort();
      },
      error: () => this.availableRegions = []
    });
  }

  // 🟢 المشاريع (Projects) بقت جايه من الداتابيز (تاب Lookups بتاع الأدمن) بدل ليستة ثابتة في الكود
  updateAvailableProjects(zoneId: number) {
    this.availableProjects =[];
    if (!zoneId) return;
    this.adminService.getProjects(undefined, zoneId).subscribe({
      next: (projects: any[]) => {
        this.availableProjects = (projects || []).map(p => p.name).sort();
      },
      error: () => this.availableProjects = []
    });
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
      submitData.quarterlyInstallment = submitData.quarterlyInstallment ? parseInt(String(submitData.quarterlyInstallment).replace(/,/g, ''), 10) : 0;

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