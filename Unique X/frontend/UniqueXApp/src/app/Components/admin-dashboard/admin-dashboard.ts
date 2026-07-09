import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../Services/admin';
import { AlertService } from '../../Services/alert';
import { AuthService } from '../../Services/auth'; // مهم جداً
import { RouterModule, Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag, CdkDragPlaceholder, DragDropModule } from '@angular/cdk/drag-drop';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms'; // 1. حل مشكلة formGroup
import { CrmService } from '../../Services/crm.services';
import { BlogService } from '../../Services/blog.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  // أضفنا ReactiveFormsModule هنا
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, CdkDropList, CdkDrag, CdkDragPlaceholder, DragDropModule], 
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {
  adminService = inject(AdminService);
  private alertService = inject(AlertService);
  public authService = inject(AuthService); // لجلب بيانات البروفايل
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private crmService = inject(CrmService);
  private blogService = inject(BlogService);
  private http = inject(HttpClient);
  adminLeadForm!: FormGroup;

  campaignsList = signal<any[]>([]);
  campaignForm!: FormGroup;

  // --- السجنلز ---
  users = signal<any[]>([]);
  properties = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  stats = signal<any>({});
  userData = signal<any>(null); // بيانات الأدمن الشخصية
  selectedProperty = signal<any>(null); 
  currentFinancialFile = signal<any>(null);
  hotDeals = signal<any[]>([]);

  hotDealSearchText = signal<string>('');
  selectedHotDealCode = signal<string>('');
  isHotDealDropdownOpen = signal<boolean>(false);

  propBrokerFilter = signal(''); // فلتر البروكر في Full Listing
  propProjectFilter = signal('');
  propStatusFilter = signal('');
  propDateFilter = signal('');
  
  soldSearchCode = signal(''); // فلتر الكود في Sold
  soldBrokerFilter = signal(''); // فلتر البروكر في Sold
  
  suspSearchCode = signal(''); // فلتر الكود في Suspended
  suspBrokerFilter = signal(''); // فلتر البروكر في Suspended

  filteredHotDealOptions = computed(() => {
    const search = this.hotDealSearchText().toLowerCase();
    return this.properties().filter(p => 
      (p.code && p.code.toLowerCase().includes(search)) || 
      (p.title && p.title.toLowerCase().includes(search))
    ).slice(0, 50); 
  });



  // 2. حل مشكلة 'settings' type mismatch
  // أضفنا 'settings' للأنواع المسموحة للـ Signal
  homeBanners = signal<any[]>([]);
  activeTab = signal<'users' | 'props' | 'settings' | 'banners' | 'sold' | 'whatsapp' | 'calls' | 'suspUsers' | 'suspProps' | 'financial' | 'pending' | 'rejected' | 'addLead'| 'hotDeals' | 'deletions' | 'ourTeam' | 'interviewCalendar' | 'blogs'>('users');

  detailData = signal<any[]>([]);

  adminForm!: FormGroup;
  pendingDeletions = signal<any[]>([]);

  userSearchText = signal('');
  userTypeFilter = signal(''); 
  userDateFilter = signal('');
  pendingProperties = signal<any[]>([]);// الكل، بروكر، أو كلاينت
  
  propSearchText = signal('');
  propListingFilter = signal('');
  propTypeFilter = signal('');
  isSidebarOpen = false;

  propOwnerFilter = signal('');
  propDeveloperFilter = signal('');

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
  uniqueOwners = computed(() => {
    const owners = this.properties().map(p => p.ownerName).filter(n => n && n.trim() !== '');
    return [...new Set(owners)].sort();
  });

  uniqueProjects = computed(() => {
    const projects = this.properties().map(p => p.projectName).filter(n => n && n.trim() !== '');
    return [...new Set(projects)].sort();
  });

  // 🟢 استخراج أسماء المطورين بدون تكرار (للفلتر)
 uniqueDevelopers = computed(() => {
  return this.dummyDevelopers.sort((a, b) => a.name.localeCompare(b.name));
});



  // إحصائيات سريعة
  totalUsers = computed(() => this.users().length);
  totalProperties = computed(() => this.properties().length);
  activePropertiesCount = computed(() => this.properties().filter(p => p.isActive).length); // حساب النشط فقط
  suspendedUsersCount = computed(() => this.users().filter(u => !u.isActive).length);
  suspendedPropertiesCount = computed(() => this.properties().filter(p => !p.isActive && p.isApproved).length);
  soldPropertiesCount = computed(() => this.properties().filter(p => p.isSold).length);
  rejectedPropertiesCount = computed(() => this.properties().filter(p => !p.isApproved && p.rejectionReason).length);
  rejectedPropertiesList = computed(() => this.properties().filter(p => !p.isApproved && p.rejectionReason));

  brokersList = computed(() => this.users().filter(u => u.userType === 1));



  // أي تاريخ قبل سنة 2000 يعتبر قيمة افتراضية فاسدة (مثل 01/01/0001) ومش تاريخ حقيقي
  isValidCreatedAt(createdAt: any): boolean {
    if (!createdAt) return false;
    const d = new Date(createdAt);
    return d.getFullYear() > 2000;
  }

  filteredUsers = computed(() => {
    const filtered = this.users().filter(u => {
      const search = this.userSearchText().toLowerCase();
      const matchesName = (u.firstName + ' ' + u.lastName).toLowerCase().includes(search) || u.email.toLowerCase().includes(search);
      const matchesType = this.userTypeFilter() === '' || u.userType.toString() === this.userTypeFilter();
      const dateFilter = this.userDateFilter();
      const matchesDate = !dateFilter || (this.isValidCreatedAt(u.createdAt) && new Date(u.createdAt).toISOString().split('T')[0] === dateFilter);
      return matchesName && matchesType && matchesDate;
    });

    // الأحدث أولاً، واللي معندهم تاريخ صحيح يتحطوا في الآخر
    return [...filtered].sort((a, b) => {
      const aValid = this.isValidCreatedAt(a.createdAt);
      const bValid = this.isValidCreatedAt(b.createdAt);
      if (!aValid && !bValid) return 0;
      if (!aValid) return 1;
      if (!bValid) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  });

  // فلترة العقارات لحظياً
  filteredProperties = computed(() => {
    let result = this.properties().filter(p => {
      const search = this.propSearchText().toLowerCase();
      const matchesTitle = p.title.toLowerCase().includes(search) || (p.code && p.code.toLowerCase().includes(search));
      const matchesListing = this.propListingFilter() === '' || p.listingType === this.propListingFilter();
      const matchesType = this.propTypeFilter() === '' || p.propertyType === this.propTypeFilter();
      const matchesOwner = this.propOwnerFilter() === '' || p.ownerName === this.propOwnerFilter();
      const matchesDev = this.propDeveloperFilter() === '' || p.developerName === this.propDeveloperFilter();
      const matchesBroker = this.propBrokerFilter() === '' || p.brokerId === this.propBrokerFilter();

      // 🟢 فلتر المشروع
      const matchesProject = this.propProjectFilter() === '' || p.projectName === this.propProjectFilter();

      // 🟢 فلتر الحالة (Status)
      let matchesStatus = true;
      if (this.propStatusFilter() !== '') {
        const s = this.propStatusFilter();
        if (s === 'Sold') matchesStatus = p.isSold;
        else if (s === 'Active') matchesStatus = p.isApproved && p.isActive && !p.isSold;
        else if (s === 'Suspended') matchesStatus = p.isApproved && !p.isActive && !p.isSold;
        else if (s === 'Rejected') matchesStatus = !p.isApproved && p.rejectionReason != null;
        else if (s === 'Pending') matchesStatus = !p.isApproved && !p.rejectionReason;
      }

      // 🟢 فلتر التاريخ (مقارنة بـ YYYY-MM-DD)
      let matchesDate = true;
      if (this.propDateFilter() !== '') {
        const propDate = new Date(p.createdAt).toISOString().split('T')[0];
        matchesDate = propDate === this.propDateFilter();
      }

      return matchesTitle && matchesListing && matchesType && matchesOwner && matchesDev && matchesBroker && matchesProject && matchesStatus && matchesDate;
    });

    // 🟢 الترتيب: من الأحدث للأقدم
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  filteredSoldData = computed(() => {
    const codeSearch = this.soldSearchCode().toLowerCase().trim();
    // 1. مسحنا كل المسافات من الكلمة اللي الأدمن اختارها
    const brokerSearch = this.soldBrokerFilter().toLowerCase().replace(/\s+/g, '');

    return this.detailData().filter(p => {
      const matchCode = codeSearch === '' || (p.code && p.code.toLowerCase().includes(codeSearch));
      
      // 2. مسحنا كل المسافات من اسم البروكر اللي راجع من الداتا بيز للمطابقة التامة
      const matchBroker = brokerSearch === '' || 
                          (p.brokerName && p.brokerName.toLowerCase().replace(/\s+/g, '') === brokerSearch);
                          
      return matchCode && matchBroker;
    });
  });

  // 🟢 فلترة جدول الموقوف (Suspended Properties)
  filteredSuspPropsData = computed(() => {
    const codeSearch = this.suspSearchCode().toLowerCase().trim();
    const brokerSearch = this.suspBrokerFilter().toLowerCase().replace(/\s+/g, '');

    return this.detailData().filter(p => {
      const matchCode = codeSearch === '' || (p.code && p.code.toLowerCase().includes(codeSearch));
      const matchBroker = brokerSearch === '' || 
                          (p.brokerName && p.brokerName.toLowerCase().replace(/\s+/g, '') === brokerSearch);
                          
      return matchCode && matchBroker;
    });
  });


  ngOnInit(): void {
    // تعريف فورم الإعدادات
    this.adminForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      phoneNumber: ['', Validators.required]
    });

    this.adminLeadForm = this.fb.group({
      fullName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      email: [''],
      brokerId: ['', Validators.required], // 👈 هنا الأدمن لازم يختار البروكر، مفيش قيمة مبدئية
      leadStatusId:[1, Validators.required], // بينزل في عمود الـ New
      propertyType: ['Apartment', Validators.required],
      purpose: ['Sale', Validators.required],
      campaignId: [''],
      totalAmount: [0],
      paymentMethod:['Cash'],
      preferredLocation: [''],
      notes: ['Assigned by Admin'] // رسالة توضح إن الأدمن اللي ضافه
    });

     this.campaignForm = this.fb.group({
      name: ['', Validators.required],
      source: ['Facebook', Validators.required]
    });

    // وفي نفس الدالة (ngOnInit) استدعي الدالة دي عشان نجيب الداتا
    this.loadCampaigns();

    this.loadAllData();
    this.loadAdminProfile();
    this.loadPendingProperties();
    this.loadPendingDeletions();
    this.initBlogForm(); // initialize blog form on load
  }

  loadPendingDeletions() {
  this.adminService.getPendingDeletions().subscribe(data =>
    this.pendingDeletions.set(data)
  );
}

onApproveDeletion(id: number) {
  this.alertService.confirm('Permanently delete this property? This cannot be undone.', () => {
    this.alertService.showLoading('Deleting...');
    this.adminService.approveDeletion(id).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('Property permanently deleted.');
        this.loadPendingDeletions();
        this.loadAllData();
      }
    });
  });
}

onRejectDeletion(id: number) {
  const swal = (window as any).Swal;
  swal.fire({
    title: 'Reject Deletion Request',
    input: 'textarea',
    inputLabel: 'Reason (will be shown to broker)',
    inputPlaceholder: 'Enter reason...',
    showCancelButton: true,
    confirmButtonColor: '#ef3341',
    confirmButtonText: 'Reject Deletion',
    inputValidator: (value: string) => {
      if (!value) return 'Please enter a reason!';
      return undefined;
    }
  }).then((result: any) => {
    if (result.isConfirmed) {
      this.alertService.showLoading('Rejecting...');
      this.adminService.rejectDeletion(id, result.value).subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('Deletion rejected. Property restored.');
          this.loadPendingDeletions();
          this.loadAllData();
        }
      });
    }
  });
}

  loadCampaigns() {
    this.crmService.getCampaigns().subscribe(data => this.campaignsList.set(data));
  }

  loadAllData() {
  this.isLoading.set(true);
  
  // نستخدم subscribe بذكاء لضمان تحميل البيانات
  this.adminService.getStats().subscribe({
    next: (data: any) => this.stats.set(data),
    error: (err) => console.error('Stats Error:', err)
  });

  this.adminService.getAllUsers().subscribe({
    next: (data: any[]) => {
      // 🟢 تظبيط فرق التوقيت (بنعرف الإنجولار إن ده توقيت عالمي عشان يحوله لمصر)
      data.forEach(u => {
        if (u.createdAt && !u.createdAt.endsWith('Z')) u.createdAt += 'Z';
      });
      this.users.set(data);
    },
    error: (err) => console.error('Users Error:', err)
  });

  this.adminService.getDetailedProperties().subscribe({
   next: (data: any[]) => {
      // 🟢 تظبيط فرق التوقيت (بنعرف الإنجولار إن ده توقيت عالمي عشان يحوله لمصر)
      data.forEach(p => {
        if (p.createdAt && !p.createdAt.endsWith('Z')) p.createdAt += 'Z';
      });
      
      this.properties.set(data);
      this.isLoading.set(false); // وقف التحميل هنا
    },
    error: (err) => {
      this.isLoading.set(false);
      console.error('Properties Error:', err);
    }
  });

  this.loadBanners(); 
  this.loadFinancialFile();
}

  loadBanners() {
    this.adminService.getBanners().subscribe((data: any[]) => { // إضافة :any[] ✅
        this.homeBanners.set(data);
    });
  }

  getDeveloperCode(developerName: string): string | undefined {
  const dev = this.dummyDevelopers.find(d => d.name === developerName);
  return dev ? dev.code : undefined;
}

  toggleSidebar() {
  this.isSidebarOpen = !this.isSidebarOpen;
}

  onAddBanner(title: string, fileInput: any) {
    const file = fileInput.files[0];
    if (!file || !title) {
        this.alertService.error('Please provide a title and select an image.');
        return;
    }

    this.alertService.showLoading('Uploading banner...');
    this.adminService.addBanner(file, title).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('Banner added successfully!');
        this.loadBanners(); // ريفريش للقائمة
        fileInput.value = ''; // تصفير الـ input
      }
    });
  }

  onDeleteBanner(id: number) {
    this.alertService.confirm('Delete this banner from homepage?', () => {
      this.adminService.deleteBanner(id).subscribe(() => this.loadBanners());
    });
  }


  loadAdminProfile() {
    this.authService.getProfile().subscribe(data => {
      this.userData.set(data);
      this.adminForm.patchValue(data);
    });
  }

  // 3. كود دالة رفع صور البروفايل للأدمن
  onImageChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.alertService.showLoading('Uploading your photo...');
      this.authService.uploadProfileImage(file).subscribe({
        next: (res: any) => {
          this.alertService.close();
          // تحديث الصورة في السجنل فوراً
          this.userData.update(current => ({ ...current, profileImageUrl: res.url }));
          
          // تحديث الـ LocalStorage عشان النافبار (لو لسه بتستخدميه)
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          user.profileImageUrl = res.url;
          localStorage.setItem('user', JSON.stringify(user));
          
          this.alertService.success('Profile photo updated!');
        },
        error: () => {
          this.alertService.close();
          this.alertService.error('Upload failed');
        }
      });
    }
  }

  // 4. حل مشكلة Property 'onUpdateProfile' does not exist
  onUpdateProfile() {
    if (this.adminForm.valid) {
      this.alertService.showLoading('Updating system data...');
      this.authService.updateProfile(this.adminForm.getRawValue()).subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('Your profile has been updated!');
          this.loadAdminProfile(); // ريفريش للبيانات
        },
        error: () => {
          this.alertService.close();
          this.alertService.error('Update failed');
        }
      });
    }
  }

  switchTab(tab: any) {
  this.activeTab.set(tab);
  this.isSidebarOpen = false;
  
  if (tab === 'sold') {
    this.adminService.getSoldProperties().subscribe(data => this.detailData.set(data));
  } 
  else if (tab === 'whatsapp') {
    this.adminService.getActivityLogs('WhatsAppClick').subscribe(data => this.detailData.set(data));
  }
  else if (tab === 'calls') {
    this.adminService.getActivityLogs('CallClick').subscribe(data => this.detailData.set(data));
  }
  else if (tab === 'hotDeals') {
  this.adminService.getHotDeals().subscribe(data => this.hotDeals.set(data));
}

  else if (tab === 'suspUsers') {
    this.adminService.getSuspendedUsers().subscribe(data => this.detailData.set(data));
  }
  else if (tab === 'suspProps') {
    this.adminService.getSuspendedProperties().subscribe(data => this.detailData.set(data));
  }
}

  toggleUser(userId: string, currentStatus: boolean) {
    this.adminService.toggleUserStatus(userId).subscribe({
      next: () => {
        this.loadAllData();
        this.alertService.success('Status Changed');
      }
    });
  }

  onAddHotDeal(code: string) {
    if (!code) return;
    
    this.alertService.showLoading('Adding...');
    this.adminService.addHotDeal(code).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('Added to Hot Deals');
        this.loadHotDeals(); // تحديث القائمة بعد الإضافة
        
        // 🟢 تصفير خانة البحث بعد الإضافة بنجاح
        this.hotDealSearchText.set('');
        this.selectedHotDealCode.set('');
      },
      error: (err) => {
        this.alertService.close();
        this.alertService.error(err.error || 'Failed to add.');
      }
    });
  }

selectHotDeal(code: string, title: string) {
    this.selectedHotDealCode.set(code);
    this.hotDealSearchText.set(`${code} - ${title}`); // بيعرض الكود والاسم في الحقل
    this.isHotDealDropdownOpen.set(false); // بيقفل القائمة
  }

  // 🟢 دالة لإغلاق القائمة لما يضغط براها
  closeHotDealDropdown() {
    setTimeout(() => {
      this.isHotDealDropdownOpen.set(false);
    }, 200); // تأخير بسيط عشان يلحق يسجل الكليك على العقار
  }

onRemoveHotDeal(id: number) {
  this.alertService.confirm('Remove this property from Hot Deals?', () => {
    this.adminService.removeHotDeal(id).subscribe(() => {
      this.alertService.success('Removed successfully');
      this.loadHotDeals(); // تحديث القائمة بعد الحذف
    });
  });
}
loadHotDeals() {
  this.adminService.getHotDeals().subscribe(data => this.hotDeals.set(data));
}

  toggleProperty(propId: number, currentStatus: boolean) {
    this.adminService.togglePropertyStatus(propId).subscribe({
      next: () => {
        
        this.alertService.success('Listing visibility updated');
        this.loadAllData();
      }
    });
  }

  viewPropertyDetails(prop: any) {
  this.selectedProperty.set(prop); 
  
  const bootstrap = (window as any).bootstrap;
  const modalElement = document.getElementById('adminPropModal');
  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }
}

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserTypeLabel(type: number) {
    return type === 1 ? 'Broker' : type === 2 ? 'Admin' : 'Client';
  }

  onReassignBroker(prop: any, event: any) {
    const newBrokerId = event.target.value;
    const selectElement = event.target; // نحتفظ بالعنصر (Dropdown) للتحكم فيه

    // لو اختار نفس الشخص الحالي، ميعملش حاجة
    if (!newBrokerId || newBrokerId === prop.brokerId) return;

    this.alertService.confirm('Are you sure you want to reassign this property to another broker?', () => {
      // لو الأدمن داس موافق (OK)
      this.alertService.showLoading('Reassigning property...');
      
      this.adminService.reassignProperty(prop.id, newBrokerId).subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('Property reassigned successfully!');
          this.loadAllData(); // تحديث الجدول عشان يقرا الداتا الجديدة
        },
        error: () => {
          this.alertService.close();
          this.alertService.error('Failed to reassign property.');
          selectElement.value = prop.brokerId; // نرجعه للاسم القديم لو حصل مشكلة
        }
      });
    });

    // لو الأدمن داس Cancel في التنبيه (لو الـ alertService بتاعتك مش بتدعم دي، القائمة هتتحدث لوحدها مع ريفريش الصفحة)
    // بس للاحتياط بنرجع القيمة القديمة يدوياً في حالة إنه مكملش العملية
    setTimeout(() => {
      const swalContainer = document.querySelector('.swal2-container');
      if (!swalContainer) {
        selectElement.value = prop.brokerId;
      }
    }, 500);
  }

  checkOwnerDuplicate(phone: string, currentPropId: number) {
    if (!phone || phone.trim() === '') return null;

    // 1. ندمج كل العقارات (الموافق عليها + المعلقة) في مصفوفة واحدة للبحث الشامل
    const allSystemProperties = [...this.properties(), ...this.pendingProperties()];

    // 2. نصفي العقارات اللي ليها نفس رقم المالك، ونستبعد العقار اللي الأدمن فاتحه دلوقتي
    const matches = allSystemProperties.filter(p => 
      p.ownerPhone === phone && p.id !== currentPropId
    );

    // لو مفيش أي عقار تاني بنفس الرقم، يبقى المالك ده جديد (نرجع null)
    if (matches.length === 0) return null;

    // 3. لو لقينا تكرار، هنرتبهم من القديم للجديد (عشان نجيب أول بروكر ضافه)
    matches.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const firstProperty = matches[0];

    // 🟢 4. استخراج اسم البروكر بذكاء حسب شكل الداتا الراجعة من الباك إند
    let brokerFullName = 'Unknown Broker';
    
    if (firstProperty.brokerName) {
      // لو العقار جاي من قائمة Pending
      brokerFullName = firstProperty.brokerName;
    } else if (firstProperty.broker) {
      // لو العقار جاي من الـ Full Listing
      const fName = firstProperty.broker.firstName || '';
      const lName = firstProperty.broker.lastName || '';
      brokerFullName = `${fName} ${lName}`.trim();
    }

    if (!brokerFullName) {
      brokerFullName = 'Unknown Broker';
    }

    // 5. نرجع البيانات عشان المودال يعرضها
    return {
      totalProperties: matches.length,
      firstBrokerName: brokerFullName,
      firstDate: firstProperty.createdAt,
      firstPropertyCode: firstProperty.code
    };
  }

  // ================== 🟢 إدارة ملف الحسابات (Financial) ==================
  loadFinancialFile() {
    this.adminService.getFinancialFile().subscribe({
      next: (data) => this.currentFinancialFile.set(data),
      error: () => this.currentFinancialFile.set(null) // لو مفيش ملف هيفضل null
    });
  }

  onUploadFinancial(fileInput: any) {
    const file = fileInput.files[0];
    if (!file) {
      this.alertService.error('Please select an Excel or CSV file first.');
      return;
    }

    this.alertService.showLoading('Uploading Data File...');
    this.adminService.uploadFinancialFile(file).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('Financial Data Updated Successfully!');
        this.loadFinancialFile(); 
        fileInput.value = ''; 
      },
      error: (err) => {
        this.alertService.close();
        this.alertService.error(err.error || 'Failed to upload file.');
      }
    });
  }

  onDeleteFinancial(id: number) {
    this.alertService.confirm('Are you sure you want to delete the current financial data?', () => {
      this.alertService.showLoading('Deleting...');
      this.adminService.deleteFinancialFile(id).subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('File deleted.');
          this.loadFinancialFile();
        }
      });
    });
  }

  loadPendingProperties() {
  this.adminService.getPendingProperties().subscribe(data => 
    this.pendingProperties.set(data)
  );
}

onApproveProperty(id: number) {
  this.alertService.confirm('Approve this property and publish it?', () => {
    this.alertService.showLoading('Approving...');
    this.adminService.approveProperty(id).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('Property approved and published!');
        this.loadPendingProperties();
        this.loadAllData();
        document.getElementById('closeModalBtn')?.click(); 
      }
    });
  });
}

onRejectProperty(id: number) {
  // أول حاجة: اقفل الـ Bootstrap modal مؤقتاً
  const modalElement = document.getElementById('adminPropModal');
  const bootstrap = (window as any).bootstrap;
  const modalInstance = bootstrap.Modal.getInstance(modalElement);
  modalInstance?.hide();

  // استنى الـ modal يقفل الأول، وبعدين افتح SweetAlert
  setTimeout(() => {
    const swal = (window as any).Swal;
    swal.fire({
      title: 'Reject Property',
      input: 'textarea',
      inputLabel: 'Reason for rejection',
      inputPlaceholder: 'Enter the reason...',
      inputAttributes: { 'aria-label': 'Reason' },
      showCancelButton: true,
      confirmButtonColor: '#ef3341',
      confirmButtonText: 'Reject',
      inputValidator: (value: string) => {
        if (!value) return 'Please enter a reason!';
        return undefined;
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.alertService.showLoading('Rejecting...');
        this.adminService.rejectProperty(id, result.value).subscribe({
          next: () => {
            this.alertService.close();
            this.alertService.success('Property rejected.');
            this.loadPendingProperties();
          }
        });
      } else {
        // لو الأدمن كانسل، افتح الـ modal تاني
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
    });
  }, 500);
}

onBannerReorder(event: CdkDragDrop<any[]>) {
  const updated = [...this.homeBanners()];
  moveItemInArray(updated, event.previousIndex, event.currentIndex);
  this.homeBanners.set(updated);

  const orderedIds = updated.map((b: any) => b.id);
  this.adminService.reorderBanners(orderedIds).subscribe({
    next: () => this.alertService.success('Order saved!'),
    error: () => this.alertService.error('Failed to save order.')
  });
}

// دالة لتحميل صورة واحدة
  downloadPhoto(url: string, index: number, e: Event, prefix: string = 'Property_Image'
  ) {
    e.stopPropagation();
    this.alertService.showLoading('Downloading...');
    
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${prefix}_${index + 1}.jpg`; // اسم الملف
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

  // دالة لتحميل كل الصور بضغطة واحدة
  downloadAllPhotos(photos: any[]) {
    if (!photos || photos.length === 0) return;
    this.alertService.success('Starting download... Please allow multiple downloads if prompted.');
    
    // استخدام مهلة زمنية بسيطة بين كل صورة لمنع المتصفح من حظر التحميل المتعدد
    photos.forEach((photo, index) => {
      setTimeout(() => {
        this.downloadPhoto(photo.url, index, new Event('click'));
      }, index * 500); // نصف ثانية بين كل صورة وصورة
    });
  }

  onDuplicateProperty(prop: any) {
    // 1. تجهيز قائمة البروكرز لتظهر في القائمة المنسدلة
    const brokerOptions: any = {};
    this.brokersList().forEach(b => {
      brokerOptions[b.id] = `${b.firstName} ${b.lastName} (${b.phoneNumber})`;
    });

    const swal = (window as any).Swal;
    swal.fire({
      title: 'Duplicate Property',
      text: `Select the broker for the new copy of "${prop.title}"`,
      input: 'select',
      inputOptions: brokerOptions,
      inputPlaceholder: '--- Select a Broker ---',
      showCancelButton: true,
      confirmButtonColor: '#0d6efd', // لون أزرق للنسخ
      confirmButtonText: '<i class="bi bi-files"></i> Duplicate Now',
      inputValidator: (value: string) => {
        return new Promise((resolve) => {
          if (value) {
            resolve(null);
          } else {
            resolve('You need to select a broker!');
          }
        });
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        const selectedBrokerId = result.value;
        this.alertService.showLoading('Duplicating Property...');
        
        // 2. إرسال الطلب للباك إند
        this.adminService.duplicateProperty(prop.id, selectedBrokerId).subscribe({
          next: () => {
            this.alertService.close();
            this.alertService.success('Property duplicated successfully!');
            this.loadAllData(); // تحديث الجدول عشان النسخة الجديدة تظهر
          },
          error: (err: any) => {
            this.alertService.close();
            this.alertService.error('Failed to duplicate property.');
          }
        });
      }
    });
  }


// ================== Our Team ==================
jobApplications = signal<any[]>([]);
selectedApplication = signal<any>(null);
calendarDays = signal<any[]>([]);
calendarMonth = signal<Date>(new Date());
selectedInterviewDate = signal<string>('');
selectedInterviewHour = signal<string>('');

// ---- فلاتر Job Applications ----
jobSearchName = signal<string>('');
jobActiveTab = signal<string>('all');
jobStageFilter = signal<string>('all');
jobAttendanceFilter = signal<string>('all');

// Reject modal
rejectReason = signal<string>('');
appToReject = signal<any>(null);

// Final decision modal
finalDecisionApp = signal<any>(null);
finalDecisionType = signal<string>('');
finalDecisionReason = signal<string>('');

// Call Feedback modal
callFeedbackApp = signal<any>(null);
callFeedbackText = signal<string>('');

// === Interview Feedback Modal ===
interviewFeedbackApp = signal<any>(null);
viewFeedbackApp = signal<any>(null);
interviewFeedback = signal({
  experienceInRE: '',
  pastExperiences: '',
  whyRealEstate: '',
  knowledge: '',
  salesProcess: '',
  goal: '',
  appearance: '',
  communication: '',
  presentation: '',
  language: '',
  notes: ''
});

// Final Feedback modal
finalFeedbackApp = signal<any>(null);
finalFeedbackText = signal<string>('');

rejectedApplicationsCount = computed(() =>
  this.jobApplications().filter(a => a.status === 'Rejected').length
);

scheduledApplicationsCount = computed(() =>
  this.jobApplications().filter(a => a.status === 'Scheduled').length
);

activeApplicationsCount = computed(() =>
  this.jobApplications().filter(a => a.status !== 'Rejected').length
);

filteredJobApplications = computed(() => {
  const search = this.jobSearchName().trim().toLowerCase();
  const tab = this.jobActiveTab();
  const stage = this.jobStageFilter();
  const attendance = this.jobAttendanceFilter();

  return this.jobApplications().filter(app => {
    const matchesName = !search || (app.fullName || '').toLowerCase().includes(search);

    if (tab === 'rejected') return matchesName && app.status === 'Rejected';

    if (tab === 'scheduled') {
      if (app.status !== 'Scheduled') return false;
      if (!matchesName) return false;
      if (attendance === 'none') return !app.attendanceStatus;
      if (attendance === 'Attended') return app.attendanceStatus === 'Attended';
      if (attendance === 'NotAttended') return app.attendanceStatus === 'NotAttended';
      if (attendance === 'Rejected') return app.finalDecision === 'Rejected';
      return true;
    }

    // tab === 'all'
    if (app.status === 'Rejected') return false;
    if (!matchesName) return false;
    if (stage !== 'all') return app.status === stage;
    return true;
  });
});

switchJobTab(tab: string) {
  this.jobActiveTab.set(tab);
  this.jobStageFilter.set('all');
  this.jobAttendanceFilter.set('all');
  this.jobSearchName.set('');
}

loadJobApplications() {
  this.adminService.getJobApplications().subscribe({
    next: (data) => this.jobApplications.set(data),
    error: () => this.alertService.error('Failed to load applications.')
  });
}

confirmApplication(id: number) {
  this.alertService.confirm('Confirm this applicant?', () => {
    this.adminService.confirmJobApplication(id).subscribe({
      next: () => {
        this.alertService.success('Applicant confirmed!');
        this.loadJobApplications();
      }
    });
  });
}
formatInterviewDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'Z'); // بنضيف Z عشان نعامله UTC ونعرضه صح
  // لا — خليها أبسط من كده
  const parts = dateStr.split('T');
  const [year, month, day] = parts[0].split('-');
  const [hour, minute] = parts[1].split(':');
  const h = parseInt(hour);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${day}/${month}/${year} ${h12}:${minute} ${ampm}`;
}
openRejectModal(app: any) {
  this.appToReject.set(app);
  this.rejectReason.set('');
  const modal = new (window as any).bootstrap.Modal(document.getElementById('rejectAppModal'));
  modal.show();
}

submitReject() {
  const app = this.appToReject();
  const reason = this.rejectReason().trim();
  if (!reason) { this.alertService.error('Please enter a rejection reason.'); return; }

  this.adminService.rejectJobApplication(app.id, reason).subscribe({
    next: () => {
      this.alertService.success('Application rejected.');
      this.loadJobApplications();
      const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('rejectAppModal'));
      modal?.hide();
      this.appToReject.set(null);
    },
    error: () => this.alertService.error('Failed to reject application.')
  });
}

markAttendance(id: number, attended: boolean) {
  if (attended) {
    // لو حضر → نفتح فورم الفيدباك
    const app = this.jobApplications().find((a: any) => a.id === id);
    this.interviewFeedbackApp.set(app);
    this.interviewFeedback.set({
      experienceInRE: '', pastExperiences: '', whyRealEstate: '',
      knowledge: '', salesProcess: '', goal: '', appearance: '',
      communication: '', presentation: '', language: '', notes: ''
    });
    const modal = new (window as any).bootstrap.Modal(document.getElementById('interviewFeedbackModal'));
    modal.show();
  } else {
    // لو No Show → نحفظ مباشرة
    this.adminService.markAttended(id, false).subscribe({
      next: () => { this.alertService.success('Marked as No Show.'); this.loadJobApplications(); },
      error: () => this.alertService.error('Failed to update attendance.')
    });
  }
}

updateInterviewFeedback(field: string, value: string) {
  this.interviewFeedback.update(f => ({ ...f, [field]: value }));
}

openViewFeedbackModal(app: any) {
  this.viewFeedbackApp.set(app);
  const modal = new (window as any).bootstrap.Modal(document.getElementById('viewInterviewFeedbackModal'));
  modal.show();
}

submitInterviewFeedback() {
  const app = this.interviewFeedbackApp();
  if (!app) return;
  const fb = this.interviewFeedback();

  // Validation — كل الحقول required ماعدا notes
  if (!fb.experienceInRE || !fb.pastExperiences?.trim() || !fb.whyRealEstate?.trim() ||
      !fb.knowledge?.trim() || !fb.salesProcess || !fb.goal ||
      !fb.appearance || !fb.communication || !fb.presentation || !fb.language) {
    this.alertService.error('Please fill all required fields.');
    return;
  }

  this.http.put(`${this.adminService['baseUrl'].replace('/Admin', '')}/jobapplications/${app.id}/interview-feedback`, {
    experienceInRE:  fb.experienceInRE,
    pastExperiences: fb.pastExperiences,
    whyRealEstate:   fb.whyRealEstate,
    knowledge:       fb.knowledge,
    salesProcess:    fb.salesProcess,
    goal:            fb.goal,
    appearance:      fb.appearance,
    communication:   fb.communication,
    presentation:    fb.presentation,
    language:        fb.language,
    notes:           fb.notes
  }).subscribe({
    next: () => {
      this.alertService.success('Interview feedback saved!');
      const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('interviewFeedbackModal'));
      modal?.hide();
      this.loadJobApplications();
    },
    error: () => this.alertService.error('Failed to save feedback.')
  });
}

openFinalDecisionModal(app: any, decision: string) {
  this.finalDecisionApp.set(app);
  this.finalDecisionType.set(decision);
  this.finalDecisionReason.set('');
  const modal = new (window as any).bootstrap.Modal(document.getElementById('finalDecisionModal'));
  modal.show();
}

submitFinalDecision() {
  const app = this.finalDecisionApp();
  const decision = this.finalDecisionType();
  const reason = this.finalDecisionReason().trim();
  if (decision === 'Rejected' && !reason) {
    this.alertService.error('Please enter a rejection reason.');
    return;
  }
  this.adminService.finalDecision(app.id, decision, reason || undefined).subscribe({
    next: () => {
      this.alertService.success(decision === 'Accepted' ? 'Applicant Accepted!' : 'Applicant Rejected.');
      this.loadJobApplications();
      const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('finalDecisionModal'));
      modal?.hide();
    },
    error: () => this.alertService.error('Failed to submit decision.')
  });
}

openCallFeedbackModal(app: any) {
  this.callFeedbackApp.set(app);
  this.callFeedbackText.set(app.callFeedback || '');
  const modal = new (window as any).bootstrap.Modal(document.getElementById('callFeedbackModal'));
  modal.show();
}

submitCallFeedback() {
  const app = this.callFeedbackApp();
  const text = this.callFeedbackText().trim();
  if (!text) { this.alertService.error('Please enter feedback.'); return; }
  this.http.put(`${environment.apiUrl}/jobapplications/${app.id}/call-feedback`, JSON.stringify(text), {
    headers: { 'Content-Type': 'application/json' }
  }).subscribe({
    next: () => {
      this.alertService.success('Call feedback saved!');
      this.loadJobApplications();
      const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('callFeedbackModal'));
      modal?.hide();
    },
    error: () => this.alertService.error('Failed to save feedback.')
  });
}

openFinalFeedbackModal(app: any) {
  this.finalFeedbackApp.set(app);
  this.finalFeedbackText.set(app.finalFeedback || '');
  const modal = new (window as any).bootstrap.Modal(document.getElementById('finalFeedbackModal'));
  modal.show();
}

submitFinalFeedback() {
  const app = this.finalFeedbackApp();
  const text = this.finalFeedbackText().trim();
  if (!text) { this.alertService.error('Please enter feedback.'); return; }
  this.http.put(`${environment.apiUrl}/jobapplications/${app.id}/final-feedback`, JSON.stringify(text), {
    headers: { 'Content-Type': 'application/json' }
  }).subscribe({
    next: () => {
      this.alertService.success('Final feedback saved!');
      this.loadJobApplications();
      const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('finalFeedbackModal'));
      modal?.hide();
    },
    error: () => this.alertService.error('Failed to save feedback.')
  });
}

openScheduleCalendar(app: any) {
  this.selectedApplication.set(app);
  this.generateCalendar(this.calendarMonth());
  const modal = new (window as any).bootstrap.Modal(document.getElementById('interviewCalendarModal'));
  modal.show();
}

generateCalendar(month: Date) {
  this.calendarMonth.set(month);
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const today = new Date();
  today.setHours(0,0,0,0);

  const days: any[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, m, d);
    const yyyy = date.getFullYear();
const mm = String(date.getMonth() + 1).padStart(2, '0');
const dd = String(date.getDate()).padStart(2, '0');
days.push({
  date,
  dateStr: `${yyyy}-${mm}-${dd}`,
  isPast: date < today,
  isToday: date.getTime() === today.getTime()
});
  }
  this.calendarDays.set(days);
}

prevMonth() {
  const d = new Date(this.calendarMonth());
  d.setMonth(d.getMonth() - 1);
  this.generateCalendar(d);
}

nextMonth() {
  const d = new Date(this.calendarMonth());
  d.setMonth(d.getMonth() + 1);
  this.generateCalendar(d);
}

scheduleInterview() {
  const app = this.selectedApplication();
  if (!app || !this.selectedInterviewDate() || !this.selectedInterviewHour()) {
    this.alertService.error('Please select a date and time.');
    return;
  }


  const dateTime = `${this.selectedInterviewDate()}T${this.selectedInterviewHour()}:00`;
  this.adminService.scheduleInterview(app.id, dateTime).subscribe({
    next: () => {
      this.alertService.success('Interview scheduled!');
      this.loadJobApplications();
      const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('interviewCalendarModal'));
      modal?.hide();
      this.selectedApplication.set(null);
      this.selectedInterviewDate.set('');
      this.selectedInterviewHour.set('');
    },
    error: () => this.alertService.error('Failed to schedule interview.')
  });
}
// ================== Blogs ==================
blogs = signal<any[]>([]);
blogForm!: FormGroup;
editingBlog = signal<any>(null);
blogCoverFile = signal<File | null>(null);
blogMasterPlanFile = signal<File | null>(null);
blogSliderFiles = signal<File[]>([]);
blogButtonFiles: { [key: number]: File | null } = { 1: null, 2: null, 3: null };
blogSubmitting = signal(false);
paymentPlans = signal<any[]>([]);
articleSections = signal<any[]>([]);
faqs = signal<any[]>([]);

// --- Unit selector signals ---
unitSearchText = signal<string>('');
isUnitDropdownOpen = signal<boolean>(false);
selectedUnits = signal<any[]>([]);

filteredUnitOptions = computed(() => {
  const search = this.unitSearchText().toLowerCase();
  const selectedIds = this.selectedUnits().map(u => u.id);
  return this.properties()
    .filter(p =>
      (p.code && p.code.toLowerCase().includes(search)) ||
      (p.title && p.title.toLowerCase().includes(search))
    )
    .slice(0, 50);
});

isUnitSelected(id: number): boolean {
  return this.selectedUnits().some(u => u.id === id);
}

addUnitId(prop: any) {
  if (this.selectedUnits().length >= 12) return;
  if (!this.isUnitSelected(prop.id)) {
    this.selectedUnits.update(list => [...list, { id: prop.id, code: prop.code, title: prop.title }]);
  }
  this.unitSearchText.set('');
  this.isUnitDropdownOpen.set(false);
}

removeUnitId(id: number) {
  this.selectedUnits.update(list => list.filter(u => u.id !== id));
}

closeUnitDropdown() {
  setTimeout(() => this.isUnitDropdownOpen.set(false), 150);
}

// --- Slider preview ---
sliderPreviewUrls = signal<string[]>([]);

removeNewSliderImage(index: number) {
  const current = [...this.blogSliderFiles()];
  current.splice(index, 1);
  this.blogSliderFiles.set(current);
  // إعادة بناء الـ preview URLs
  const urls = current.map(f => URL.createObjectURL(f));
  this.sliderPreviewUrls.set(urls);
}

getSliderPreviewUrl(index: number): string {
  return this.sliderPreviewUrls()[index] || '';
}

initBlogForm(blog?: any) {
  this.blogForm = this.fb.group({
    title:                [''],
    excerpt:              [''],
    category:             [''],
    isPublished:          [true],
    pricePerMeterResale:  [null],
    pricePerMeterPrimary: [null],
    projectDetails:       [''],
    mapEmbedUrl:          [''],
  });
  if (blog) {
    this.blogForm.patchValue({
      title:                blog.title || '',
      excerpt:              blog.excerpt || '',
      category:             blog.category || '',
      isPublished:          blog.isPublished,
      pricePerMeterResale:  blog.pricePerMeterResale,
      pricePerMeterPrimary: blog.pricePerMeterPrimary,
      projectDetails:       blog.projectDetails || '',
      mapEmbedUrl:          blog.mapEmbedUrl || '',
    });
    this.paymentPlans.set(this.parseJson(blog.paymentPlansJson));
    this.articleSections.set(this.parseJson(blog.articleSectionsJson));
    this.faqs.set(this.parseJson(blog.faqsJson));
  } else {
    this.paymentPlans.set([]);
    this.articleSections.set([]);
    this.faqs.set([]);
  }
}

parseJson(json: string | null | undefined): any[] {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

getSliderImagesArray(blog: any): string[] {
  if (!blog?.sliderImages) return [];
  return blog.sliderImages.split('|').filter((s: string) => s.trim());
}

loadBlogs() {
  this.blogService.getAll().subscribe({
    next: (data) => this.blogs.set(data),
    error: () => this.alertService.error('Failed to load projects.')
  });
}

openAddBlog() {
  this.editingBlog.set(null);
  this.blogSliderFiles.set([]);
  this.sliderPreviewUrls.set([]);
  this.blogMasterPlanFile.set(null);
  this.blogButtonFiles = { 1: null, 2: null, 3: null };
  this.selectedUnits.set([]);
  this.unitSearchText.set('');
  this.initBlogForm();
  const modal = new (window as any).bootstrap.Modal(document.getElementById('blogFormModal'));
  modal.show();
}

openEditBlog(blog: any) {
  this.editingBlog.set(blog);
  this.blogSliderFiles.set([]);
  this.sliderPreviewUrls.set([]);
  this.blogMasterPlanFile.set(null);
  this.blogButtonFiles = { 1: null, 2: null, 3: null };
  this.unitSearchText.set('');

  // ملء selectedUnits من الـ blog الموجود
  const unitIds: number[] = this.parseJson(blog.unitIdsJson);
  const unitObjects = unitIds
    .map(id => this.properties().find(p => p.id === id))
    .filter(p => !!p)
    .map(p => ({ id: p.id, code: p.code, title: p.title }));
  this.selectedUnits.set(unitObjects);

  this.initBlogForm(blog);
  const modal = new (window as any).bootstrap.Modal(document.getElementById('blogFormModal'));
  modal.show();
}

onSliderImagesChange(event: any) {
  const files = Array.from(event.target.files) as File[];
  this.blogSliderFiles.set(files);
  // بناء preview URLs للصور الجديدة
  const urls = files.map(f => URL.createObjectURL(f));
  this.sliderPreviewUrls.set(urls);
}

onMasterPlanChange(event: any) {
  const file = event.target.files[0];
  if (file) this.blogMasterPlanFile.set(file);
}

onButtonImageChange(event: any, btn: number) {
  const file = event.target.files[0];
  if (file) this.blogButtonFiles[btn] = file;
}

onBlogCoverChange(event: any) {
  const file = event.target.files[0];
  if (file) this.blogCoverFile.set(file);
}

removeSliderImage(filename: string) {
  const blog = this.editingBlog();
  if (!blog) return;
  this.blogService.deleteSliderImage(blog.id, filename).subscribe({
    next: () => {
      const imgs = this.getSliderImagesArray(blog).filter(i => i !== filename);
      this.editingBlog.set({ ...blog, sliderImages: imgs.join('|') });
      this.loadBlogs();
    }
  });
}

// Payment Plans
addPaymentPlan()         { this.paymentPlans.update(p => [...p, { name: '', downPayment: '', installment: '', years: null, note: '' }]); }
removePaymentPlan(i: number) { this.paymentPlans.update(p => p.filter((_, idx) => idx !== i)); }

// Article Sections
addArticleSection()          { this.articleSections.update(s => [...s, { headline: '', text: '' }]); }
removeArticleSection(i: number) { this.articleSections.update(s => s.filter((_, idx) => idx !== i)); }

// FAQs
addFaq()       { this.faqs.update(f => [...f, { question: '', answer: '' }]); }
removeFaq(i: number) { this.faqs.update(f => f.filter((_, idx) => idx !== i)); }

submitBlog() {
  if (!this.blogForm.value.title?.trim()) { this.alertService.error('Please enter a project name.'); return; }
  this.blogSubmitting.set(true);
  const f = this.blogForm.value;

  // Parse unit IDs from selectedUnits signal
  const unitIds = this.selectedUnits().map(u => u.id).slice(0, 12);

  const fd = new FormData();
  fd.append('Title',                f.title);
  fd.append('Excerpt',              f.excerpt);
  fd.append('Category',             f.category || '');
  fd.append('IsPublished',          f.isPublished ? 'true' : 'false');
  fd.append('PricePerMeterResale',  f.pricePerMeterResale?.toString() || '');
  fd.append('PricePerMeterPrimary', f.pricePerMeterPrimary?.toString() || '');
  fd.append('AdminPhone',           '01509064020'); // رقم الادمن ثابت
  fd.append('Button1Label',         'Gallery');
  fd.append('Button2Label',         'View on Map');
  fd.append('Button3Label',         'Master Plan');
  fd.append('ProjectDetails',       f.projectDetails || '');
  fd.append('MapEmbedUrl',          f.mapEmbedUrl || '');
  fd.append('PaymentPlansJson',     JSON.stringify(this.paymentPlans()));
  fd.append('UnitIdsJson',          JSON.stringify(unitIds));
  fd.append('ArticleSectionsJson',  JSON.stringify(this.articleSections()));
  fd.append('FaqsJson',             JSON.stringify(this.faqs()));

  this.blogSliderFiles().forEach(file => fd.append('SliderImages', file));
  if (this.blogMasterPlanFile()) fd.append('MasterPlanImage', this.blogMasterPlanFile()!);
  [1, 2, 3].forEach(btn => {
    if (this.blogButtonFiles[btn]) fd.append(`Button${btn}Image`, this.blogButtonFiles[btn]!);
  });

  const editing = this.editingBlog();
  const req = editing ? this.blogService.update(editing.id, fd) : this.blogService.create(fd);

  req.subscribe({
    next: () => {
      this.blogSubmitting.set(false);
      this.alertService.success(editing ? 'Project updated!' : 'Project created!');
      this.loadBlogs();
      const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('blogFormModal'));
      modal?.hide();
    },
    error: () => { this.blogSubmitting.set(false); this.alertService.error('Failed to save project.'); }
  });
}

deleteBlog(id: number) {
  this.alertService.confirm('Delete this project?', () => {
    this.blogService.delete(id).subscribe({
      next: () => { this.alertService.success('Project deleted.'); this.loadBlogs(); },
      error: () => this.alertService.error('Failed to delete project.')
    });
  });
}

getBlogImageUrl(filename: string) { return this.blogService.getImageUrl(filename); }
getBlogFirstImage(blog: any): string {
  const imgs = this.blogService.getSliderImages(blog);
  return imgs.length > 0 ? imgs[0] : '';
}

formatPrice(event: any) {
  const input = event.target;
  const raw = input.value.replace(/[^0-9]/g, '');
  input.value = raw ? Number(raw).toLocaleString('en-US') : '';
}
}