import { Component, OnInit, inject, signal,computed} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CrmService } from '../../../Services/crm.services';
import { AlertService } from '../../../Services/alert';
import { AdminService } from '../../../Services/admin';
import { PhoneInputComponent } from '../../phone-input/phone-input';

@Component({
  selector: 'app-edit-request',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, PhoneInputComponent],
  templateUrl: './edit-request.html'
})
export class EditRequestComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private crmService = inject(CrmService);
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);
  public router = inject(Router);

  leadId!: number;
  editRequestForm!: FormGroup;
  campaignsList: any[] =[];
  currentBrokerId: string = '';
  isAdmin = signal<boolean>(false);
  originalPhone: string = ''; // الرقم الأصلي قبل التعديل

  // Duplicate modal
  duplicateModalOpen = signal<boolean>(false);
  duplicateInfo = signal<{originalBroker: string, newBroker: string} | null>(null);
  pendingSubmitData: any = null;

  availablePropertyCodes = signal<string[]>([]); 

  sourcesList = [
    'Facebook', 'Paid Ads', 'MarketPlace Ads', 'Google Ads', 'Property Finder', 
    'Bayut', 'Akar map', 'Groups', 'WhatsApp', 'Betk page', 'Shaety Page', 
    'Semsar Misr', 'Linkedin', 'Tiktok', 'Instagram', 'Market place'
  ];

  zones =[{ id: 1, name: 'Cairo' }, { id: 2, name: 'Alexandria' }, { id: 3, name: 'North Coast' }];

  // ============================================================
  // 🟢 نظام Qualified / Unqualified - نفس اللي في lead-details بالظبط
  // ============================================================
  qualifiedStages = [
    { id: 1, name: 'New "To Call"' },
    { id: 4, name: 'Calls (request)' },
    { id: 6, name: 'Follow Up For Visit' },
    { id: 10, name: 'Follow up for Meeting' },
    { id: 7, name: 'Visit scheduled' },
    { id: 11, name: 'Meeting Scheduled' },
    { id: 8, name: 'Follow up After visit' },
    { id: 18, name: 'Follow up for closing' },
    { id: 19, name: 'Deal closed' }
  ];

  unqualifiedStages = [
    { id: 23, name: 'Low Budget' },
    { id: 22, name: 'Lost Not interested' },
    { id: 24, name: 'Number Issue' },
    { id: 21, name: 'N/A "unreachable"' },
    { id: 25, name: 'Broker' },
    { id: 26, name: 'Recommend to shift' }
  ];

  leadQualification = signal<'qualified' | 'unqualified' | null>(null);

  get visibleStages() {
    if (this.leadQualification() === 'qualified') return this.qualifiedStages;
    if (this.leadQualification() === 'unqualified') return this.unqualifiedStages;
    return [];
  }

  get isOrphanStatus(): boolean {
    const statusId = this.editRequestForm?.value?.leadStatusId;
    if (statusId == null) return false;
    const inQualified = this.qualifiedStages.some(s => s.id === Number(statusId));
    const inUnqualified = this.unqualifiedStages.some(s => s.id === Number(statusId));
    return !inQualified && !inUnqualified;
  }

  selectQualification(type: 'qualified' | 'unqualified') {
    this.leadQualification.set(type);
    // لو الحالة الحالية مش من نفس المجموعة، منسيبهاش محددة غلط - نمسحها عشان يختار حالة جديدة تناسب المجموعة
    const current = Number(this.editRequestForm.value.leadStatusId);
    const list = type === 'qualified' ? this.qualifiedStages : this.unqualifiedStages;
    if (!list.some(s => s.id === current)) {
      this.editRequestForm.patchValue({ leadStatusId: '' });
    }
  }

  dummyBrokers = signal<any[]>([]);
  

  availableRegions: string[] =[];
  availableProjects: string[] =[];

  searchCampaignCode = signal<string>('');
  isCampaignDropdownOpen = signal<boolean>(false);

  filteredCampaignCodes = computed(() => {
    const term = this.searchCampaignCode().toLowerCase();
    return this.availablePropertyCodes().filter(code => code.toLowerCase().includes(term));
  });

  selectCampaign(code: string) {
    this.editRequestForm.patchValue({ campaignName: code });
    this.searchCampaignCode.set(code);
    this.isCampaignDropdownOpen.set(false);
  }

  closeCampaignDropdown() {
    setTimeout(() => this.isCampaignDropdownOpen.set(false), 200);
  }

  ngOnInit() {
    this.leadId = Number(this.route.snapshot.paramMap.get('id'));

    // نجيب بيانات اليوزر الحالي
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.currentBrokerId = user.id || user.userId || '';
      const roles = user.roles || [];
      const isUserAdmin = roles.includes('Admin') || user.userType === 2 || user.userType === 'Admin';
      this.isAdmin.set(isUserAdmin);

      // Debug مؤقت — احذفيه بعد ما تتأكدي
      console.log('User object:', user);
      console.log('isAdmin:', isUserAdmin);
    }

    this.initForm();
    if (this.leadId) {
      this.loadLeadData(this.leadId);
    }
    this.setupDynamicFields();
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
    this.editRequestForm = this.fb.group({
      fullName: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\+\d{1,4}\s?\d{6,12}$/)]],
      email: [''],
      leadStatusId: [1, Validators.required],
      
      // 👇 بقوا Required زي ما طلبتي
      campaignSource: ['', Validators.required],
      campaignName: ['', Validators.required],
      referredBy: ['', Validators.required],
      
      propertyType: [[], Validators.required], // 🟢 بقت Array - Multi-select زي مودال Get Recommendation
      purpose: [[], Validators.required], // 🟢 بقت Array - Multi-select
      totalAmount: [''], 
      paymentMethod: ['Cash'],
      zoneId: [''],
      selectedRegions: [[]],
      selectedProjects: [[]],
      selectedCities: [[]], // 🟢 جديد - Multi-select زي مودال Get Recommendation
      minRooms: [''], maxRooms: [''], // 🟢 جديد
      minBathrooms: [''], maxBathrooms: [''], // 🟢 جديد
      downPayment: ['', Validators.min(0)],
      installmentYears: ['', Validators.min(1)],
      quarterlyInstallment: [0, [Validators.min(0)]],
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

          // 🟢 تحديد هل الحالة الحالية Qualified ولا Unqualified ولا يتيمة (زي lead-details بالظبط)
          if (this.qualifiedStages.some(s => s.id === info.statusId)) {
            this.leadQualification.set('qualified');
          } else if (this.unqualifiedStages.some(s => s.id === info.statusId)) {
            this.leadQualification.set('unqualified');
          } else {
            this.leadQualification.set(null);
          }
          this.originalPhone = info.phoneNumber; // نحفظ الرقم الأصلي
          
          this.editRequestForm.get('zoneId')?.setValue(req.zoneId || '', { emitEvent: false });
          this.loadRegionsForZone(req.zoneId);
          this.updateAvailableProjects(req.zoneId);

          const regionsArr = req.selectedRegions ? req.selectedRegions.split(', ').filter((x:any)=>x) :[];
          const projectsArr = req.selectedProjects ? req.selectedProjects.split(', ').filter((x:any)=>x) :[];
          // 🟢 PropertyType/Purpose/Cities بقوا Comma-separated من الباك إند - بنحولهم لـ Array هنا
          const propertyTypeArr = req.propertyType ? req.propertyType.split(',').map((x:string)=>x.trim()).filter((x:any)=>x) :[];
          const purposeArr = req.purpose ? req.purpose.split(',').map((x:string)=>x.trim()).filter((x:any)=>x) :[];
          const citiesArr = req.selectedCities ? req.selectedCities.split(',').map((x:string)=>x.trim()).filter((x:any)=>x) :[];

          // 🟢 جلب أكواد المشاريع الخاصة بالعميل ده عشان الداتا تنزل متعلمة جاهزة (بناخد أول Purpose مختار)
          this.fetchPropertyCodes(purposeArr[0] || '', () => {
            this.editRequestForm.patchValue({
              fullName: info.fullName,
              phoneNumber: info.phoneNumber,
              email: info.email,
              leadStatusId: info.statusId,              
              // 👇 تفاصيل الكامبين والكود هتنزل متعلمة هنا
              campaignSource: info.campaignSource || '',
              campaignName: info.campaignName || '',
              referredBy: info.referredBy || '',

              propertyType: propertyTypeArr,
              purpose: purposeArr,
              selectedCities: citiesArr,
              minRooms: req.minRooms ?? '',
              maxRooms: req.maxRooms ?? '',
              minBathrooms: req.minBathrooms ?? '',
              maxBathrooms: req.maxBathrooms ?? '',
              paymentMethod: req.paymentMethod || 'Cash',
              zoneId: req.zoneId || '',
              selectedRegions: regionsArr,
              selectedProjects: projectsArr,
              
              totalAmount: req.totalAmount ? Number(req.totalAmount).toLocaleString('en-US') : '',
              downPayment: req.downPayment ? Number(req.downPayment).toLocaleString('en-US') : '',
              quarterlyInstallment: req.quarterlyInstallment ? Number(req.quarterlyInstallment).toLocaleString('en-US') : '',
              installmentYears: req.installmentYears ? Number(req.installmentYears).toLocaleString('en-US') : '',
              
              preferredLocation: req.preferredLocation,
              notes: req.notes
            }, { emitEvent: false });
          });
        }
      },
      error: (err) => console.error('Error fetching lead details:', err)
    });
  }

  fetchPropertyCodes(purpose: string, callback?: () => void) {
    if (purpose) {
      this.crmService.getPropertyCodesByPurpose(purpose).subscribe(codes => {
        this.availablePropertyCodes.set(codes);
        if (callback) callback();
      });
    } else {
      this.availablePropertyCodes.set([]);
      if (callback) callback();
    }
  }

 setupDynamicFields() {
    this.editRequestForm.get('zoneId')?.valueChanges.subscribe(zoneId => {
      this.editRequestForm.patchValue({ selectedRegions: [], selectedProjects: [] });
      this.loadRegionsForZone(zoneId);
      this.updateAvailableProjects(zoneId); 
    });

    this.editRequestForm.get('purpose')?.valueChanges.subscribe((purpose: string[]) => {
      this.editRequestForm.patchValue({ selectedRegions: [], selectedProjects:[], downPayment: '', installmentYears: '', campaignName: '' });
      this.fetchPropertyCodes(purpose?.[0] || ''); // 👈 تحديث أكواد العقارات لو الغرض اتغير (بناخد أول Purpose مختار)
    });
    
    this.editRequestForm.get('paymentMethod')?.valueChanges.subscribe(() => {
      this.editRequestForm.patchValue({ downPayment: '', installmentYears: '', quarterlyInstallment: '' });
    });
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
    this.availableProjects = [];
    if (!zoneId) return;
    this.adminService.getProjects(undefined, zoneId).subscribe({
      next: (projects: any[]) => {
        this.availableProjects = (projects || []).map(p => p.name).sort();
      },
      error: () => this.availableProjects = []
    });
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

  // 🟢 دوال الـ Multi-select الجديدة - نفس فكرة toggleRecommendationValue في مودال الهوم بالظبط
  toggleMultiValue(controlName: string, value: string): void {
    const current = (this.editRequestForm.get(controlName)?.value || []) as string[];
    const idx = current.indexOf(value);
    const updated = idx > -1 ? current.filter(v => v !== value) : [...current, value];
    this.editRequestForm.patchValue({ [controlName]: updated });
  }

  isMultiValueSelected(controlName: string, value: string): boolean {
    const current = (this.editRequestForm.get(controlName)?.value || []) as string[];
    return current.includes(value);
  }

  get showRegionSelection() {
    const purpose = (this.editRequestForm.get('purpose')?.value || []) as string[];
    return purpose.some(p => ['Resale', 'Rent'].includes(p));
  }

  get showProjectSelection() {
    const purpose = (this.editRequestForm.get('purpose')?.value || []) as string[];
    return purpose.some(p => ['Primary', 'Resale Project', 'Rent'].includes(p));
  }

  get showFinancialDetails() {
    if (!this.editRequestForm) return false;
    const purpose = (this.editRequestForm.get('purpose')?.value || []) as string[];
    const payment = this.editRequestForm.get('paymentMethod')?.value;
    
    // 🟢 هتظهر دايماً مع التقسيط بشرط إن الغرض ميكونش "إيجار" بس
    return payment === 'Installment' && !purpose.every(p => p === 'Rent') && purpose.length > 0;
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
    if (this.editRequestForm.invalid) return;

    this.alertService.showLoading('Saving Changes...');
    const submitData = { ...this.editRequestForm.value };

    submitData.selectedRegions = submitData.selectedRegions.join(', ');
    submitData.selectedProjects = submitData.selectedProjects.join(', ');
    // 🟢 propertyType/purpose/selectedCities بقوا Arrays (Multi-select) - نحولهم لـ Comma string قبل الإرسال للباك إند
    submitData.propertyType = (submitData.propertyType || []).join(',');
    submitData.purpose = (submitData.purpose || []).join(',');
    submitData.selectedCities = (submitData.selectedCities || []).join(',');
    submitData.minRooms = submitData.minRooms ? Number(submitData.minRooms) : null;
    submitData.maxRooms = submitData.maxRooms ? Number(submitData.maxRooms) : null;
    submitData.minBathrooms = submitData.minBathrooms ? Number(submitData.minBathrooms) : null;
    submitData.maxBathrooms = submitData.maxBathrooms ? Number(submitData.maxBathrooms) : null;
    submitData.totalAmount = submitData.totalAmount ? parseInt(String(submitData.totalAmount).replace(/,/g, ''), 10) : 0;
    submitData.downPayment = submitData.downPayment ? parseInt(String(submitData.downPayment).replace(/,/g, ''), 10) : 0;
    submitData.quarterlyInstallment = submitData.quarterlyInstallment ? parseInt(String(submitData.quarterlyInstallment).replace(/,/g, ''), 10) : 0;
    submitData.installmentYears = submitData.installmentYears ? parseInt(String(submitData.installmentYears).replace(/,/g, ''), 10) : 0;
    if (submitData.campaignId === '') submitData.campaignId = null;
    if (submitData.zoneId === '') submitData.zoneId = null;

    // الـ backend هيتحقق من التكرار تلقائياً ويرجع isDuplicate لو في تكرار
    this.saveUpdate(submitData);
  }

  saveUpdate(submitData: any) {
    this.alertService.showLoading('Saving Changes...');
    this.crmService.updateLeadDetails(this.leadId, submitData).subscribe({
      next: (res: any) => {
        this.alertService.close();
        if (res?.isDuplicate) {
          if (this.isAdmin()) {
            // الأدمن يشوف modal يقبل أو يرفض
            this.duplicateInfo.set({
              originalBroker: res.originalBrokerName || 'Unknown',
              newBroker: 'Admin'
            });
            this.pendingSubmitData = null; // البيانات اتحفظت بالفعل
            this.duplicateModalOpen.set(true);
          } else {
            // البروكر يشوف رسالة انتظار
            this.alertService.success(
              'Phone number already exists for another client. Your change has been saved and is pending Admin approval.'
            );
            this.router.navigate(['/crm/leads', String(this.leadId)]);
          }
        } else {
          this.alertService.success('Lead updated successfully!');
          this.router.navigate(['/crm/leads', String(this.leadId)]);
        }
      },
      error: () => {
        this.alertService.close();
        this.alertService.error('Failed to update details.');
      }
    });
  }

  confirmDuplicateAdmin(approve: boolean) {
    this.duplicateModalOpen.set(false);
    if (approve) {
      this.crmService.approveDuplicateLead(this.leadId).subscribe({
        next: () => {
          this.alertService.success('Duplicate approved successfully!');
          this.router.navigate(['/crm/leads', String(this.leadId)]);
        },
        error: () => this.alertService.error('Failed to approve duplicate.')
      });
    } else {
      this.crmService.updateLeadDetails(this.leadId, { phoneNumber: this.originalPhone }).subscribe({
        next: () => {
          this.alertService.success('Change rejected. Original phone number restored.');
          this.router.navigate(['/crm/leads', String(this.leadId)]);
        },
        error: () => this.alertService.error('Failed to revert phone number.')
      });
    }
  }
}