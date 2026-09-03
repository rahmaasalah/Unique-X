import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../Services/admin';
import { AlertService } from '../../Services/alert';
import { AuthService } from '../../Services/auth'; // مهم جداً
import { RouterModule, Router } from '@angular/router';
import { PhoneInputComponent } from '../phone-input/phone-input';
import { CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag, CdkDragPlaceholder, DragDropModule } from '@angular/cdk/drag-drop';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms'; // 1. حل مشكلة formGroup
import { CrmService } from '../../Services/crm.services';
import { BlogService } from '../../Services/blog.service';
import { LaunchService } from '../../Services/launch.service';
import { ArticleService } from '../../Services/article.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  // أضفنا ReactiveFormsModule هنا
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, CdkDropList, CdkDrag, CdkDragPlaceholder, DragDropModule, PhoneInputComponent], 
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
  private launchService = inject(LaunchService);
  articleService = inject(ArticleService);
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

  // ===================== Recommended to Visit (نفس فكرة Hot Deals بالظبط) =====================
  recommendedVisits = signal<any[]>([]);
  recommendedVisitSearchText = signal<string>('');
  selectedRecommendedVisitCode = signal<string>('');
  isRecommendedVisitDropdownOpen = signal<boolean>(false);

  filteredRecommendedVisitOptions = computed(() => {
    const search = this.recommendedVisitSearchText().toLowerCase();
    return this.properties().filter(p =>
      (p.code && p.code.toLowerCase().includes(search)) ||
      (p.title && p.title.toLowerCase().includes(search))
    ).slice(0, 50);
  });

  propBrokerFilter = signal(''); // فلتر البروكر في Full Listing
  propProjectFilter = signal('');
  propStatusFilter = signal('');
  propDateFilter = signal('');
  propZoneFilter = signal(''); // 🟢 فلتر المنطقة (Cairo/Alexandria/North Coast)
  propMinBudget = signal<number | null>(null); // 🟢 فلتر أقل سعر
  propMaxBudget = signal<number | null>(null); // 🟢 فلتر أعلى سعر
  
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

  // 🟢 بانرات ثابتة لصفحة الهوم (بين Launches و Hot Deals) - Array واحد مرتب حسب DisplayOrder
  // بيدعم أي عدد بانرات وقابل لإعادة الترتيب بالـ Drag & Drop
  homeSectionBanners = signal<any[]>([]);
  homeSectionBannerKeys: { key: string; title: string; description: string; icon: string }[] = [
    { key: 'explore-home', title: 'Explore Home Banner', description: 'Opens the "Explore Your Dream Home" page.', icon: 'bi-house-heart' },
    { key: 'add-property', title: 'Add Property Banner', description: 'Opens the "Add Your Property" page.', icon: 'bi-plus-square' },
    { key: 'add-property-2', title: 'Add Property Banner 2', description: 'Opens the "Add Your Property" page (a second slot for the same link).', icon: 'bi-plus-square' },
    { key: 'compare', title: 'Compare Banner', description: 'Opens the Compare Properties page.', icon: 'bi-arrow-left-right' },
    { key: 'price-range', title: 'Price/m² Search Banner', description: 'Opens a page to search units by price-per-meter range.', icon: 'bi-calculator' },
    { key: 'recommendation', title: 'Get Recommendation Banner', description: 'Opens the "Get Recommendation" criteria popup.', icon: 'bi-stars' }
  ];
  // بيحمل الـ key وقت الرفع/المسح عشان نعطل الزرار بتاعه بس
  homeSectionBannerSaving = signal<string>('');
  // نسخة قابلة لإعادة الترتيب بالـ Drag & Drop + هل الترتيب اتغير عشان نظهر زرار Save Order
  draggedBannerKey: string | null = null;
  bannersOrderChanged = signal<boolean>(false);

  activeTab = signal<'users' | 'props' | 'settings' | 'banners' | 'homeSectionBanners' | 'sold' | 'whatsapp' | 'calls' | 'suspUsers' | 'suspProps' | 'financial' | 'projectFinancial' | 'pending' | 'rejected' | 'addLead'| 'hotDeals' | 'recommendedVisits' | 'deletions' | 'ourTeam' | 'interviewCalendar' | 'blogs' | 'ownerProps' | 'projectMeetings' | 'launches' | 'launchMeetings' | 'articles' | 'lookups' | 'propertyAnalytics' | 'searchAnalytics' | 'brokerLimits' | 'jobPostings'>('users');

  // --- Lookups: Developers / Primary Projects / Resale Projects / Regions ---
  lookupsSubTab = signal<'developers' | 'primaryProjects' | 'resaleProjects' | 'regions'>('developers');
  lookupCityFilter = signal<number>(1); // 1 Cairo, 2 Alexandria, 3 North Coast

  lookupDevelopers = signal<any[]>([]);
  lookupPrimaryProjects = signal<any[]>([]);
  lookupResaleProjects = signal<any[]>([]);
  lookupRegions = signal<any[]>([]);

  newDeveloperName = signal<string>('');
  newDeveloperCode = signal<string>('');

  newProjectName = signal<string>('');
  newProjectCode = signal<string>('');
  newProjectRegion = signal<string>('');
  newProjectDeveloperId = signal<string>('');

  propertyAnalytics = signal<any[]>([]);
searchAnalytics = signal<any>(null);
brokerStats = signal<any[]>([]);

// 🟢 نفس الـ maps المستخدمة في home.ts (onSearch) بالظبط، بس معكوسة رقم->اسم
private propertyTypeNames: Record<number, string> = {
  0: 'Apartment', 1: 'Villa', 2: 'Shop', 3: 'Office', 4: 'Chalet', 5: 'FullFloor'
};
private listingTypeNames: Record<number, string> = {
  0: 'Resale', 1: 'Rent', 2: 'Primary', 3: 'ResaleProject'
};
private cityNames: Record<number, string> = {
  1: 'Cairo', 2: 'Alexandria', 3: 'North Coast'
};

mapPropertyType(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return this.propertyTypeNames[n] ?? `Unknown (${n})`;
}

mapListingType(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return this.listingTypeNames[n] ?? `Unknown (${n})`;
}

mapCity(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return this.cityNames[n] ?? `Unknown (${n})`;
}

// 🟢 حفظ الـ limit بتاع بروكر معين
updateBrokerLimit(brokerId: string, value: string) {
  const limit = value === '' ? null : Number(value);
  this.adminService.setBrokerLimit(brokerId, limit).subscribe({
    next: () => this.alertService.success('Limit updated successfully'),
    error: () => this.alertService.error('Failed to update limit')
  });
}

// ===================== Job Postings (Join Our Team) =====================
jobPostings = signal<any[]>([]);
newJobTitle = signal<string>('');
newJobSummary = signal<string>('');
newJobResponsibilities = signal<string>('');
newJobQualifications = signal<string>('');
newJobKPIs = signal<string>('');
isSavingJobPosting = signal(false);

loadJobPostings() {
  this.adminService.getAllJobPostings().subscribe(data => this.jobPostings.set(data));
}

addJobPosting() {
  if (!this.newJobTitle() || !this.newJobSummary()) {
    this.alertService.error('Job Title and Job Summary are required.');
    return;
  }

  this.isSavingJobPosting.set(true);
  this.adminService.addJobPosting({
    jobTitle: this.newJobTitle(),
    jobSummary: this.newJobSummary(),
    keyResponsibilities: this.newJobResponsibilities(),
    qualifications: this.newJobQualifications(),
    kpis: this.newJobKPIs()
  }).subscribe({
    next: () => {
      this.isSavingJobPosting.set(false);
      this.alertService.success('Job posting added successfully');
      this.newJobTitle.set('');
      this.newJobSummary.set('');
      this.newJobResponsibilities.set('');
      this.newJobQualifications.set('');
      this.newJobKPIs.set('');
      this.loadJobPostings();
    },
    error: () => {
      this.isSavingJobPosting.set(false);
      this.alertService.error('Failed to add job posting');
    }
  });
}

toggleJobPosting(id: number) {
  this.adminService.toggleJobPosting(id).subscribe({
    next: () => this.loadJobPostings(),
    error: () => this.alertService.error('Failed to update job posting')
  });
}

deleteJobPosting(id: number) {
  this.alertService.confirm('Delete this job posting permanently?', () => {
    this.adminService.deleteJobPosting(id).subscribe({
      next: () => {
        this.alertService.success('Job posting deleted');
        this.loadJobPostings();
      },
      error: () => this.alertService.error('Failed to delete job posting')
    });
  });
}

  newRegionName = signal<string>('');
  newRegionZoneCode = signal<string>('');

  detailData = signal<any[]>([]);

  adminForm!: FormGroup;
  pendingDeletions = signal<any[]>([]);

  userSearchText = signal('');
  userTypeFilter = signal(''); 
  userDateFilter = signal('');
  pendingProperties = signal<any[]>([]);// الكل، بروكر، أو كلاينت
  ownerProperties = signal<any[]>([]); // اتقدمت من زرار "Add Your Property" في الناف بار
  ownerPropertiesPendingCount = computed(() => this.ownerProperties().filter(p => !p.isApproved && !p.rejectionReason).length);
  // 🟢 بنستثني وحدات "Add Your Property" من تاب Pending Review العادي عشان تفضل في تاب Owners Properties بس
  brokerPendingProperties = computed(() => this.pendingProperties().filter(p => !p.isOwnerSubmitted));
  
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
  {code: 'MRC', name: 'Mercon' },
  {code: 'ALE', name: 'Alex West' }
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
  rejectedPropertiesList = computed(() => this.properties().filter(p => !p.isApproved && p.rejectionReason && !p.isOwnerSubmitted));

  // كل البروكرز النشطين (مش suspended) - تُستخدم في إعادة تعيين/نقل الوحدات (لازم نقدر نعيّن حتى لو البروكر لسه معهوش وحدات)
  brokersList = computed(() => this.users().filter(u => u.userType === 1 && u.isActive));

  // 🟢 بروكرز نشطين وليهم وحدة واحدة على الأقل - تُستخدم في قوائم الفلترة بس (Full Listing / Sold / Suspended)
  brokersWithPropertiesList = computed(() => {
    const brokerIdsWithProperties = new Set(this.properties().map(p => p.brokerId));
    return this.brokersList().filter(u => brokerIdsWithProperties.has(u.id));
  });



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

      // 🟢 فلتر المنطقة
      const matchesZone = this.propZoneFilter() === '' || p.city === this.propZoneFilter();

      // 🟢 فلتر الميزانية (Min/Max)
      let matchesBudget = true;
      const minBudget = this.propMinBudget();
      const maxBudget = this.propMaxBudget();
      if (minBudget !== null) matchesBudget = matchesBudget && p.price >= minBudget;
      if (maxBudget !== null) matchesBudget = matchesBudget && p.price <= maxBudget;

      return matchesTitle && matchesListing && matchesType && matchesOwner && matchesDev && matchesBroker && matchesProject && matchesStatus && matchesDate && matchesZone && matchesBudget;
    });

    // 🟢 الترتيب: من الأحدث للأقدم
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  // 🟢 بتنضف أي حرف أو رقم سالب من حقول الـ Budget، وترفض غير الأرقام تمامًا
  onBudgetInput(event: Event, which: 'min' | 'max') {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/[^0-9]/g, '');
    const num = digitsOnly === '' ? null : Number(digitsOnly);

    // 🟢 نعرض الرقم بفواصل الآلاف تلقائيًا وهو بيكتب (12000000 → 12,000,000)
    input.value = num !== null ? num.toLocaleString('en-US') : '';

    if (which === 'min') this.propMinBudget.set(num);
    else this.propMaxBudget.set(num);
  }

  // 🟢 عشان "NorthCoast" تتعرض "North Coast" في الجدول
  formatZone(city: string): string {
    if (!city) return '';
    return city === 'NorthCoast' ? 'North Coast' : city;
  }

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
    this.loadOwnerProperties();
    this.loadPendingDeletions();
    this.initBlogForm(); // initialize blog form on load
    this.initLaunchForm(); // initialize launch form on load
    this.initArticleForm(); // initialize article (Blogs) form on load
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
  this.loadProjectFinancialFile();
}

  loadBanners() {
    this.adminService.getBanners().subscribe((data: any[]) => { // إضافة :any[] ✅
        this.homeBanners.set(data);
    });
  }

  // 🟢 تحميل البانرات الثابتة بتوع الهوم - Array واحد مرتب حسب DisplayOrder
  loadHomeSectionBanners() {
    this.adminService.getHomeSectionBanners().subscribe({
      next: (data: any[]) => {
        this.homeSectionBanners.set([...(data || [])].sort((a, b) => a.displayOrder - b.displayOrder));
        this.bannersOrderChanged.set(false);
      },
      error: (err: any) => console.error('Home section banners error:', err)
    });
  }

  // بتجيب صورة البانر الحالية بمفتاحه (لو موجود) عشان نعرف نعرض upload ولا preview+delete
  getBannerUrl(key: string): string {
    return this.homeSectionBanners().find(b => b.key === key)?.imageUrl || '';
  }

  // 🟢 ليستة العرض في صفحة Load Banners: البانرات اللي اتحطت بالفعل بالترتيب المحفوظ الأول (قابلة للسحب)،
  // وبعدها أي مكان لسه فاضي (من غير صورة) في الآخر عشان يترفع لأول مرة
  get bannerDisplayList(): { key: string; title: string; description: string; icon: string; imageUrl?: string }[] {
    const existing = this.homeSectionBanners();
    const existingKeys = new Set(existing.map(b => b.key));

    const uploaded = existing
      .map(b => {
        const meta = this.homeSectionBannerKeys.find(m => m.key === b.key);
        return meta ? { ...meta, imageUrl: b.imageUrl } : null;
      })
      .filter((m): m is { key: string; title: string; description: string; icon: string; imageUrl: any } => m !== null);

    const empty = this.homeSectionBannerKeys.filter(m => !existingKeys.has(m.key));

    return [...uploaded, ...empty];
  }

  onUploadHomeSectionBanner(key: string, fileInput: any) {
    const file = fileInput.files[0];
    if (!file) {
      this.alertService.error('Please select an image first.');
      return;
    }

    this.homeSectionBannerSaving.set(key);
    this.adminService.uploadHomeSectionBanner(key, file).subscribe({
      next: () => {
        this.homeSectionBannerSaving.set('');
        this.alertService.success('Banner uploaded successfully!');
        this.loadHomeSectionBanners();
        fileInput.value = '';
      },
      error: () => {
        this.homeSectionBannerSaving.set('');
        this.alertService.error('Failed to upload the banner. Please try again.');
      }
    });
  }

  onDeleteHomeSectionBanner(key: string) {
    this.alertService.confirm('Delete this banner from the homepage?', () => {
      this.homeSectionBannerSaving.set(key);
      this.adminService.deleteHomeSectionBanner(key).subscribe({
        next: () => {
          this.homeSectionBannerSaving.set('');
          this.loadHomeSectionBanners();
        },
        error: () => {
          this.homeSectionBannerSaving.set('');
          this.alertService.error('Failed to delete the banner. Please try again.');
        }
      });
    });
  }

  // ===== Drag & Drop إعادة ترتيب البانرات - Pointer Events (بيشتغل موبايل/تابلت/ماوس) =====

  onBannerPointerDown(event: PointerEvent, key: string) {
    event.preventDefault();
    this.draggedBannerKey = key;
    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture(event.pointerId);
    document.body.style.userSelect = 'none';
  }

  onBannerPointerMove(event: PointerEvent) {
    if (!this.draggedBannerKey) return;
    event.preventDefault();

    const el = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-banner-key]') as HTMLElement | null;
    if (!el) return;

    const targetKey = el.getAttribute('data-banner-key');
    if (!targetKey || targetKey === this.draggedBannerKey) return;

    const list = [...this.homeSectionBanners()];
    const fromIndex = list.findIndex(b => b.key === this.draggedBannerKey);
    const toIndex = list.findIndex(b => b.key === targetKey);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);

    this.homeSectionBanners.set(list);
    this.bannersOrderChanged.set(true);
  }

  onBannerPointerUp(event: PointerEvent) {
    const handle = event.currentTarget as HTMLElement;
    handle.releasePointerCapture(event.pointerId);
    document.body.style.userSelect = '';
    this.draggedBannerKey = null;
  }

  saveBannersOrder() {
    const orderedKeys = this.homeSectionBanners().map(b => b.key);
    this.adminService.reorderHomeSectionBanners(orderedKeys).subscribe({
      next: () => {
        this.alertService.success('Banner order saved!');
        this.bannersOrderChanged.set(false);
      },
      error: () => this.alertService.error('Failed to save the order. Please try again.')
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
  else if (tab === 'recommendedVisits') {
  this.loadRecommendedVisits();
}
  else if (tab === 'lookups') {
    this.loadLookups();
  }

  else if (tab === 'suspUsers') {
    this.adminService.getSuspendedUsers().subscribe(data => this.detailData.set(data));
  }
  else if (tab === 'propertyAnalytics') {
  this.adminService.getPropertiesAnalytics().subscribe(data => this.propertyAnalytics.set(data));
}
else if (tab === 'searchAnalytics') {
  this.adminService.getSearchAnalytics().subscribe(data => this.searchAnalytics.set(data));
}
else if (tab === 'brokerLimits') {
  this.adminService.getBrokerStats().subscribe(data => this.brokerStats.set(data));
}
else if (tab === 'jobPostings') {
  this.loadJobPostings();
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

// ===================== Lookups: Developers / Projects / Regions =====================

loadLookups() {
  this.adminService.getDevelopers().subscribe(data => this.lookupDevelopers.set(data));
  this.reloadProjectsAndRegions();
}

reloadProjectsAndRegions() {
  const city = this.lookupCityFilter();
  this.adminService.getProjects(0, city).subscribe(data => this.lookupPrimaryProjects.set(data));
  this.adminService.getProjects(1, city).subscribe(data => this.lookupResaleProjects.set(data));
  this.adminService.getRegions(city).subscribe(data => this.lookupRegions.set(data));
}

onLookupCityChange(city: number) {
  this.lookupCityFilter.set(city);
  this.reloadProjectsAndRegions();
}

onAddDeveloper() {
  const name = this.newDeveloperName().trim();
  const code = this.newDeveloperCode().trim();
  if (!name || !code) return;

  this.alertService.showLoading('Adding...');
  this.adminService.addDeveloper(name, code).subscribe({
    next: () => {
      this.alertService.close();
      this.alertService.success('Developer added');
      this.newDeveloperName.set('');
      this.newDeveloperCode.set('');
      this.adminService.getDevelopers().subscribe(data => this.lookupDevelopers.set(data));
    },
    error: (err) => {
      this.alertService.close();
      this.alertService.error(err.error || 'Failed to add developer.');
    }
  });
}

onDeleteDeveloper(id: number) {
  this.alertService.confirm('Delete this developer?', () => {
    this.adminService.deleteDeveloper(id).subscribe(() => {
      this.alertService.success('Deleted');
      this.adminService.getDevelopers().subscribe(data => this.lookupDevelopers.set(data));
    });
  });
}

onAddProject(type: number) {
  const name = this.newProjectName().trim();
  const code = this.newProjectCode().trim();
  if (!name || !code) return;

  const city = this.lookupCityFilter();
  const region = this.newProjectRegion().trim();
  const devId = this.newProjectDeveloperId() ? Number(this.newProjectDeveloperId()) : undefined;

  this.alertService.showLoading('Adding...');
  this.adminService.addProject(name, code, type, city, region, devId).subscribe({
    next: () => {
      this.alertService.close();
      this.alertService.success('Project added');
      this.newProjectName.set('');
      this.newProjectCode.set('');
      this.newProjectRegion.set('');
      this.newProjectDeveloperId.set('');
      this.reloadProjectsAndRegions();
    },
    error: (err) => {
      this.alertService.close();
      this.alertService.error(err.error || 'Failed to add project.');
    }
  });
}

onDeleteProject(id: number) {
  this.alertService.confirm('Delete this project?', () => {
    this.adminService.deleteProject(id).subscribe(() => {
      this.alertService.success('Deleted');
      this.reloadProjectsAndRegions();
    });
  });
}

onAddRegion() {
  const name = this.newRegionName().trim();
  if (!name) return;

  const city = this.lookupCityFilter();
  const zoneCode = this.newRegionZoneCode().trim();

  this.alertService.showLoading('Adding...');
  this.adminService.addRegion(name, city, zoneCode).subscribe({
    next: () => {
      this.alertService.close();
      this.alertService.success('Region added');
      this.newRegionName.set('');
      this.newRegionZoneCode.set('');
      this.reloadProjectsAndRegions();
    },
    error: (err) => {
      this.alertService.close();
      this.alertService.error(err.error || 'Failed to add region.');
    }
  });
}

onDeleteRegion(id: number) {
  this.alertService.confirm('Delete this region?', () => {
    this.adminService.deleteRegion(id).subscribe(() => {
      this.alertService.success('Deleted');
      this.reloadProjectsAndRegions();
    });
  });
}

// ===================== Recommended to Visit =====================

onAddRecommendedVisit(code: string) {
  if (!code) return;

  this.alertService.showLoading('Adding...');
  this.adminService.addRecommendedVisit(code).subscribe({
    next: () => {
      this.alertService.close();
      this.alertService.success('Added to Recommended to Visit');
      this.loadRecommendedVisits();

      this.recommendedVisitSearchText.set('');
      this.selectedRecommendedVisitCode.set('');
    },
    error: (err) => {
      this.alertService.close();
      this.alertService.error(err.error || 'Failed to add.');
    }
  });
}

selectRecommendedVisit(code: string, title: string) {
  this.selectedRecommendedVisitCode.set(code);
  this.recommendedVisitSearchText.set(`${code} - ${title}`);
  this.isRecommendedVisitDropdownOpen.set(false);
}

closeRecommendedVisitDropdown() {
  setTimeout(() => {
    this.isRecommendedVisitDropdownOpen.set(false);
  }, 200);
}

onRemoveRecommendedVisit(id: number) {
  this.alertService.confirm('Remove this property from Recommended to Visit?', () => {
    this.adminService.removeRecommendedVisit(id).subscribe(() => {
      this.alertService.success('Removed successfully');
      this.loadRecommendedVisits();
    });
  });
}

loadRecommendedVisits() {
  this.adminService.getRecommendedVisits().subscribe(data => this.recommendedVisits.set(data));
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

  // ================== 🟢 إدارة ملف الحسابات (Financial) - المشاريع (Projects) ==================
  currentProjectFinancialFile = signal<any>(null);

  loadProjectFinancialFile() {
    this.adminService.getProjectFinancialFile().subscribe({
      next: (data) => this.currentProjectFinancialFile.set(data),
      error: () => this.currentProjectFinancialFile.set(null) // لو مفيش ملف هيفضل null
    });
  }

  onUploadProjectFinancial(fileInput: any) {
    const file = fileInput.files[0];
    if (!file) {
      this.alertService.error('Please select an Excel or CSV file first.');
      return;
    }

    this.alertService.showLoading('Uploading Data File...');
    this.adminService.uploadProjectFinancialFile(file).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('Project Financial Data Updated Successfully!');
        this.loadProjectFinancialFile();
        fileInput.value = '';
      },
      error: (err) => {
        this.alertService.close();
        this.alertService.error(err.error || 'Failed to upload file.');
      }
    });
  }

  onDeleteProjectFinancial(id: number) {
    this.alertService.confirm('Are you sure you want to delete the current project financial data?', () => {
      this.alertService.showLoading('Deleting...');
      this.adminService.deleteProjectFinancialFile(id).subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('File deleted.');
          this.loadProjectFinancialFile();
        }
      });
    });
  }

  loadPendingProperties() {
  this.adminService.getPendingProperties().subscribe(data => 
    this.pendingProperties.set(data)
  );
}

  loadOwnerProperties() {
    this.adminService.getOwnerProperties().subscribe(data =>
      this.ownerProperties.set(data)
    );
  }

  // 🟢 الأدمن لازم يختار البروكر وقت الموافقة (نفس الفورم بتاع duplicateProperty بالظبط)
  onApproveOwnerProperty(prop: any) {
    const brokerOptions: any = {};
    this.brokersList().forEach(b => {
      brokerOptions[b.id] = `${b.firstName} ${b.lastName} (${b.phoneNumber})`;
    });

    const swal = (window as any).Swal;
    swal.fire({
      title: 'Approve Property',
      text: `Select the broker to assign "${prop.title}" to`,
      input: 'select',
      inputOptions: brokerOptions,
      inputPlaceholder: '--- Select a Broker ---',
      showCancelButton: true,
      confirmButtonColor: '#198754',
      confirmButtonText: '<i class="bi bi-check-lg"></i> Approve & Assign',
      inputValidator: (value: string) => {
        return new Promise((resolve) => {
          if (value) resolve(null);
          else resolve('You need to select a broker!');
        });
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        const selectedBrokerId = result.value;
        this.alertService.showLoading('Approving...');
        this.adminService.approveOwnerProperty(prop.id, selectedBrokerId).subscribe({
          next: () => {
            this.alertService.close();
            this.alertService.success('Property approved and assigned to broker!');
            this.loadOwnerProperties();
          },
          error: () => {
            this.alertService.close();
            this.alertService.error('Failed to approve property.');
          }
        });
      }
    });
  }

  onRejectOwnerProperty(prop: any) {
    const swal = (window as any).Swal;
    swal.fire({
      title: 'Reject Property',
      input: 'textarea',
      inputLabel: 'Reason for rejection',
      inputPlaceholder: 'Enter the reason...',
      showCancelButton: true,
      confirmButtonColor: '#ef3341',
      confirmButtonText: 'Reject',
      inputValidator: (value: string) => {
        if (!value) return 'Please enter a reason!';
        return null;
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.alertService.showLoading('Rejecting...');
        this.adminService.rejectOwnerProperty(prop.id, result.value).subscribe({
          next: () => {
            this.alertService.close();
            this.alertService.success('Property rejected.');
            this.loadOwnerProperties();
          },
          error: () => {
            this.alertService.close();
            this.alertService.error('Failed to reject property.');
          }
        });
      }
    });
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

// ================== Projects Meetings ==================
projectMeetings = signal<any[]>([]);
meetingSearchText = signal('');
meetingContactedFilter = signal('all');

uncontactedMeetingsCount = computed(() =>
  this.projectMeetings().filter(m => !m.isContacted).length
);

filteredProjectMeetings = computed(() => {
  const search = this.meetingSearchText().toLowerCase().trim();
  const statusFilter = this.meetingContactedFilter();

  return this.projectMeetings().filter(m => {
    const matchesSearch = !search ||
      (m.fullName || '').toLowerCase().includes(search) ||
      (m.projectName || '').toLowerCase().includes(search);

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'contacted' && m.isContacted) ||
      (statusFilter === 'pending' && !m.isContacted);

    return matchesSearch && matchesStatus;
  });
});

loadProjectMeetings() {
  this.http.get<any[]>(`${environment.apiUrl}/admin/project-meetings`).subscribe({
    next: (data) => this.projectMeetings.set(data),
    error: () => this.alertService.error('Failed to load projects meetings.')
  });
}

toggleMeetingContacted(meeting: any) {
  this.http.patch<any>(`${environment.apiUrl}/admin/project-meetings/${meeting.id}/toggle-contacted`, {}).subscribe({
    next: (res) => {
      meeting.isContacted = res.isContacted;
      this.projectMeetings.update(list => [...list]);
    },
    error: () => this.alertService.error('Failed to update meeting status.')
  });
}

deleteProjectMeeting(meeting: any) {
  this.http.delete(`${environment.apiUrl}/admin/project-meetings/${meeting.id}`).subscribe({
    next: () => {
      this.projectMeetings.update(list => list.filter(m => m.id !== meeting.id));
      this.alertService.success('Meeting request deleted.');
    },
    error: () => this.alertService.error('Failed to delete meeting request.')
  });
}


// ترتيب الظهور بالـ Drag & Drop - باستخدام Pointer Events (بدل الـ HTML5 draggable القديم)
// عشان يشتغل صح على الموبايل والتابلت كمان، مش بس بالماوس (Pointer Events بتوحد الماوس واللمس والقلم)
draggedBlogIndex: number | null = null;
blogOrderChanged = signal(false);
savingBlogOrder = signal(false);

onBlogPointerDown(event: PointerEvent, index: number) {
  event.preventDefault();
  this.draggedBlogIndex = index;
  const handle = event.currentTarget as HTMLElement;
  handle.setPointerCapture(event.pointerId);
  document.body.style.userSelect = 'none';
}

onBlogPointerMove(event: PointerEvent) {
  if (this.draggedBlogIndex === null) return;
  event.preventDefault();

  const el = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-blog-index]') as HTMLElement | null;
  if (!el) return;

  const targetIndex = Number(el.getAttribute('data-blog-index'));
  if (isNaN(targetIndex) || targetIndex === this.draggedBlogIndex) return;

  const current = [...this.blogs()];
  const [moved] = current.splice(this.draggedBlogIndex, 1);
  current.splice(targetIndex, 0, moved);

  this.blogs.set(current);
  this.draggedBlogIndex = targetIndex;
  this.blogOrderChanged.set(true);
}

onBlogPointerUp(event: PointerEvent) {
  const handle = event.currentTarget as HTMLElement;
  handle.releasePointerCapture(event.pointerId);
  document.body.style.userSelect = '';
  this.draggedBlogIndex = null;
}

saveBlogOrder() {
  const orderedIds = this.blogs().map(b => b.id);
  this.savingBlogOrder.set(true);

  this.blogService.reorder(orderedIds).subscribe({
    next: () => {
      this.savingBlogOrder.set(false);
      this.blogOrderChanged.set(false);
      this.alertService.success('Order saved successfully!');
    },
    error: () => {
      this.savingBlogOrder.set(false);
      this.alertService.error('Failed to save order.');
    }
  });
}
paymentPlans = signal<any[]>([]);
articleSections = signal<any[]>([]);
faqs = signal<any[]>([]);

// --- Zone / Project / Developer ---
blogZone = signal<string>('');

zoneNameToKey: { [key: string]: number } = { 'Cairo': 1, 'Alexandria': 2, 'North Coast': 3 };

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
      'The Icon Gardens-Style Home', 'Valencia Valley-Ncb', 'Silvia-Ted', 'Yardin-Mass', 'Rivali-Samco Holding', 'Century city-Vantage', 'Amorada-Afaaq', 'Elen-Concrete', 'Wuud-Tharaa', 'Dijar-Azzar Reedy', 'Maliv-kulture', 'Noll-Kleek', 'Acasa Alma-Dar Al Alamia', 'Najm-Royal', 'Jiwar-Concrete', 'Home Residence-Home Town', 'Cairova-Rna', 'Lusail-Margins', 'Nest N Developments', 'Alca-Sag', 'Grounds - One / One']
  },
  2: { // Alexandria
    'any': [
      'Palm hills Alexandria', 'Sawari', 'The One', 'Muruj', 'Alex west', 'Skyline', 'Crystal towers',
      'Grand view', 'Twin towers', 'Valore smouha', 'Valore Antoniadis', 'East towers',
      'Saraya gardens', 'Veranda', 'Jackranda', 'Oria city', 'Elite City',
      'Alsafwa City', 'Vida', 'Abha hayat', 'Jewar', 'Ouruba royals',
      'Soly vie', 'San Stefano royals', 'Malaaz', 'Cleopatra Plaza','Smouha Gate', 'Antoniades City'
    ]
  },
  3: { // North Coast
    'Ras Al Hekma': ['Ramla', 'Azha', 'Naia Bay', 'El Masyaf', 'Fouka Bay', 'Remal', 'Hacienda West', 'Seashore', 'Ras Al-Hekma', 'Hacienda Ras Al-Hekma', 'Youd', 'Ogami', 'Seashell Playa', 'La Vista Ras El Hikma', 'Caesar', 'Koun', 'Caesar Bay', 'Lyv', 'Mountain View Ras El Hikma', 'Solare', 'Swan Lake', 'Seashell Ras El Hikma', 'The Med', 'Gaia', 'June', 'Direction White', 'Cali Coast', 'Hacienda Waters', 'Mar Bay', 'Jefaira', 'Sea View', 'Safia', 'Salt', 'Azzar Islands', 'Saada North Coast', 'Katamya Coast', 'Soul', 'Lvls','قرية لافيستا باي','قرية سواني','قرية الامارات هايتس','قرية قطامية كوست','قرية بالي','قرية ذا ووتر واي','قرية ذا شور','قرية سي فيو','قرية لاميرا','قرية وان علمين','قرية دايركشن وايت','قرية جون سوديك','قرية رملة','قرية ذا ميد','قرية كالي كوست','قرية سيتي ستارز','قرية رودس','قرية ذا كريبس جيفيرا','قرية ماونتن فيو الدبلوماسيين','قرية سيزر قيصر باي','قرية هاسيندا وايت','قرية جيفيرا','قرية بلوز تيفاني','قرية الجوهرة','قرية رويال بيتش','قرية لافيستا باي ايست','قرية كوست 82 سابقا المصيف حاليا','قرية فوكا كلوب','قرية المصيف','قرية نايا باي','قرية مينا كلوب','قرية ازها','قرية ملاذ سوديك','قرية كاي','قرية سيلفر ساندس','قرية وايت باي سيدي حنيش','قرية سيسيليا لاجونز','قرية اس باس سيدي حنيش','قرية ازميرالدا باي','قرية بورتو كريستال لاجونز','قرية جزر الجراولة'],
    'Al-Dabaa': ['Dose', 'The Water Way', 'Seazen', 'La Vista Bay', 'La Vista Bay East', 'Hacienda Blue', 'La Sirena', 'D bay', 'South Med','قرية كورونادو','قرية جاي','قرية دي باي','قرية لاسيرينا','قرية سيزين','قرية دوس'],
    'Sidi Abdulrahman': ['Telal', 'Hacienda Red', 'Hacienda White', 'Amwaj', 'Q North', 'SeaShell', 'Bianchi Ilios', 'Shamasi', 'Masaya', 'Location', 'Stella Heights', 'Alura', 'La vista Cascada', 'Maraasi', 'Stella', 'Diplo 3', 'Haceinda Bay','قرية هاسيندا باي','قرية ستيلا سيدي عبدالرحمن','قرية ليك يارد','قرية ماراسي','قرية سكايا مراسي','قرية أجورا','قرية فرح','قرية لافيستا كاسكادا','قرية سي شيل بلايا','قرية سوان ليك','قرية ريتان','قرية مسايا','قرية اوركيديا','قرية ستيلا هايتس','قرية كاسكاديا','قرية بيانكي','قرية ستيلا مارينا','قرية أمواج','قرية بلومار','قرية هاسيندا وايت','قرية خليج غزالة','قرية زويا','قرية تلال'],
    'Ghazala Bay': ['Playa Ghazala', 'Ghazala Bay', 'Zoya'],
    'Al-Alamin': ['Zahra', 'Crysta', 'Plage', 'Lagoons', 'Alma', 'Ajaza', 'IL Latini', 'Downtown', 'Plam Hills North Coast', 'Mazarine', 'Golf Porto Marina', 'Marina 1', 'Marina 2', 'Marina 3', 'Marina 4', 'Marina 5', 'Marina 6', 'Marina 7', 'Marina 8','قرية مازارين','قرية مارسيليا لاند','قرية ليفير','قرية اركو لاجون','قرية فيستا مارينا','منتجع العلمين كابيتال','قرية باب البحر','قرية بلو فالي','قرية لازوردي باي','قرية بو ايلاند','قرية بو ساندس','قرية داون تاون مارينا','قرية رو مارينا','قرية بورتو مارينا','قرية سيا فيلاجيو','قرية جولف بورتو مارينا','قرية بورتو كروز'],
    'Sahel': ['Viller', 'The Island', 'Marina 8', 'North Code', 'Wanas Master', 'London', 'Eko Mena', 'Bungalows', 'Layana', 'Glee', 'قرية المهندسين', 'فخر البحار للقوات البحرية', 'قرية سيدرا', 'قرية ريزيه', 'قرية أمون','مايوركا', 'قرية كرير باراديس','قرية ألماظة باي','قرية داليا','قرية مصر للتعمير','قرية كرير لاجون','قرية الفيروز','قرية شاطئ الشروق','قرية البنوك','قرية الأطباء','قرية الطيارين','قرية جامعة القاهرة','قرية رمسيس','قرية كازابلانكا','قرية جولدن بيتش','قرية مرسي باجوش','قرية هليو بيتش','قرية مراقيا','قرية سرايات','قرية الدبلوماسيين التجاريين','قرية زمردة','قرية روزانا','قرية غرناطة','قرية فالنسيا','قرية ديانا بيتش','قرية هايدي','قرية سيلا','قرية الريفيرا','قرية تيباروز','قرية جراند هيلز','قرية المروة','قرية سلسبيل','قرية تاهيتي',
      'قرية التجاريين','قرية بلو باي','قرية باراديس بيتش','قرية البلاح','قرية قناة السويس','قرية ماربيلا','قرية اونديكسا','قرية روز فالي','قرية الرواد بيتش','قرية الكروان','قرية بالم بيتش','قرية كازابيانكا','قرية الروضة','قرية جامعة الدول العربية','قرية جامعة عين شمس','قرية المعمورة الجديدة','قرية الصفا','قرية بانجلوز','قرية حورس والرمال الذهبية','قرية زهرة','قرية بيلا ميرا','قرية ديمورا','قرية مارسيليا بوكية','قرية وايت ساند','قرية بانوراما بيتش','قرية عايدة','قرية المعادي','قرية مرحبا بيتش','قرية ريتال فيو','قرية كاربيان','قرية ريماس','قرية الروان','قرية المنتزة','قرية ايكو','قرية المرجان','قرية قرطاج','قرية مارينا فلاورز','قرية أغادير','قرية سيرينا','قرية الصحفيين','قرية بلو بلاجا','قرية كوستا دل سول','قرية بيو بيلا','قرية روتندو كوست','قرية سانتوريني','قرية بدر','قرية فيرجينيا','قرية نيفادا هيلز','قرية كيلوباترا','قرية الزهور','قرية مارينا صن شاين','قرية البوسيت','قرية جرين بيتش','قرية سوميد','قرية جامعة أسيوط','قرية دياموند بيتش','قرية أتيك','قرية مارينا جاردنز','قرية اللوتس','قرية أكوا فيو','قرية باترسي','قرية بيترو بيتش','قرية مارينا فالي','قرية بيلا مارينا']
  }
};

blogProjectOptions = computed(() => {
  const zone = this.blogZone();
  const zoneKey = this.zoneNameToKey[zone];
  if (!zoneKey || !this.projectsMapping[zoneKey]) return [];
  const areas: any = this.projectsMapping[zoneKey];
  const all: string[] = Object.values(areas).flat() as string[];
  return [...new Set(all)].sort();
});

// --- Main/Cover image selection ---
mainExistingImageUrl = signal<string | null>(null);
mainNewImageIndex = signal<number | null>(null);

setMainExistingImage(url: string) {
  this.mainExistingImageUrl.set(url);
  this.mainNewImageIndex.set(null);
}
isMainExistingImage(url: string): boolean {
  return this.mainExistingImageUrl() === url;
}
setMainNewImage(index: number) {
  this.mainNewImageIndex.set(index);
  this.mainExistingImageUrl.set(null);
}
isMainNewImage(index: number): boolean {
  return this.mainNewImageIndex() === index;
}

// --- Resale Units selector signals ---
resaleUnitSearchText = signal<string>('');
isResaleUnitDropdownOpen = signal<boolean>(false);
selectedResaleUnits = signal<any[]>([]);

filteredResaleUnitOptions = computed(() => {
  const search = this.resaleUnitSearchText().toLowerCase();
  return this.properties()
    .filter(p =>
      (p.code && p.code.toLowerCase().includes(search)) ||
      (p.title && p.title.toLowerCase().includes(search))
    )
    .slice(0, 50);
});

isResaleUnitSelected(id: number): boolean {
  return this.selectedResaleUnits().some(u => u.id === id);
}

addResaleUnitId(prop: any) {
  if (!this.isResaleUnitSelected(prop.id)) {
    this.selectedResaleUnits.update(list => [...list, { id: prop.id, code: prop.code, title: prop.title }]);
  }
  this.resaleUnitSearchText.set('');
  this.isResaleUnitDropdownOpen.set(false);
}

removeResaleUnitId(id: number) {
  this.selectedResaleUnits.update(list => list.filter(u => u.id !== id));
}

closeResaleUnitDropdown() {
  setTimeout(() => this.isResaleUnitDropdownOpen.set(false), 150);
}

// --- Primary Units selector signals ---
primaryUnitSearchText = signal<string>('');
isPrimaryUnitDropdownOpen = signal<boolean>(false);
selectedPrimaryUnits = signal<any[]>([]);

filteredPrimaryUnitOptions = computed(() => {
  const search = this.primaryUnitSearchText().toLowerCase();
  return this.properties()
    .filter(p =>
      (p.code && p.code.toLowerCase().includes(search)) ||
      (p.title && p.title.toLowerCase().includes(search))
    )
    .slice(0, 50);
});

isPrimaryUnitSelected(id: number): boolean {
  return this.selectedPrimaryUnits().some(u => u.id === id);
}

addPrimaryUnitId(prop: any) {
  if (!this.isPrimaryUnitSelected(prop.id)) {
    this.selectedPrimaryUnits.update(list => [...list, { id: prop.id, code: prop.code, title: prop.title }]);
  }
  this.primaryUnitSearchText.set('');
  this.isPrimaryUnitDropdownOpen.set(false);
}

removePrimaryUnitId(id: number) {
  this.selectedPrimaryUnits.update(list => list.filter(u => u.id !== id));
}

closePrimaryUnitDropdown() {
  setTimeout(() => this.isPrimaryUnitDropdownOpen.set(false), 150);
}

// --- Rent Units ---
rentUnitSearchText = signal<string>('');
isRentUnitDropdownOpen = signal<boolean>(false);
selectedRentUnits = signal<any[]>([]);

filteredRentUnitOptions = computed(() => {
  const search = this.rentUnitSearchText().toLowerCase();
  return this.properties()
    .filter(p =>
      (p.code && p.code.toLowerCase().includes(search)) ||
      (p.title && p.title.toLowerCase().includes(search))
    )
    .slice(0, 50);
});

isRentUnitSelected(id: number): boolean {
  return this.selectedRentUnits().some(u => u.id === id);
}

addRentUnitId(prop: any) {
  if (!this.isRentUnitSelected(prop.id)) {
    this.selectedRentUnits.update(list => [...list, { id: prop.id, code: prop.code, title: prop.title }]);
  }
  this.rentUnitSearchText.set('');
  this.isRentUnitDropdownOpen.set(false);
}

removeRentUnitId(id: number) {
  this.selectedRentUnits.update(list => list.filter(u => u.id !== id));
}

closeRentUnitDropdown() {
  setTimeout(() => this.isRentUnitDropdownOpen.set(false), 150);
}

// --- Slider preview ---
sliderPreviewUrls = signal<string[]>([]);

removeNewSliderImage(index: number, inputEl?: HTMLInputElement) {
  const current = [...this.blogSliderFiles()];
  current.splice(index, 1);
  this.blogSliderFiles.set(current);
  // إعادة بناء الـ preview URLs
  const urls = current.map(f => URL.createObjectURL(f));
  this.sliderPreviewUrls.set(urls);

  // 👈 المتصفح بيعرض عدد الملفات ("N files") من الـ FileList الأصلية بتاعة الـ <input> نفسه،
  // فلازم نعيد بناء الـ FileList دي بعد الحذف عشان العدد الظاهر يتحدث صح
  if (inputEl) {
    const dt = new DataTransfer();
    current.forEach(f => dt.items.add(f));
    inputEl.files = dt.files;
  }
}

getSliderPreviewUrl(index: number): string {
  return this.sliderPreviewUrls()[index] || '';
}

initBlogForm(blog?: any) {
  this.blogForm = this.fb.group({
    title:                [''],
    excerpt:              [''],
    zone:                 [''],
    projectName:          [''],
    developerName:        [''],
    isPublished:          [true],
    pricePerMeterResale:  [null],
    pricePerMeterPrimary: [null],
    downPaymentPercentage: [null],
    avgDownPayment: [null],
    projectDetails:       [''],
    mapEmbedUrl:          [''],
  });
  this.blogForm.get('zone')!.valueChanges.subscribe(v => this.blogZone.set(v || ''));
  if (blog) {
    this.blogForm.patchValue({
      title:                blog.title || '',
      excerpt:              blog.excerpt || '',
      zone:                 blog.zone || '',
      projectName:          blog.projectName || '',
      developerName:        blog.developerName || '',
      isPublished:          blog.isPublished,
      pricePerMeterResale:  blog.pricePerMeterResale,
      pricePerMeterPrimary: blog.pricePerMeterPrimary,
      downPaymentPercentage: blog.downPaymentPercentage,
      avgDownPayment: blog.avgDownPayment,
      projectDetails:       blog.projectDetails || '',
      mapEmbedUrl:          blog.mapEmbedUrl || '',
    });
    this.blogZone.set(blog.zone || '');
    this.paymentPlans.set(this.parseJson(blog.paymentPlansJson));
    this.articleSections.set(this.parseJson(blog.articleSectionsJson));
    this.faqs.set(this.parseJson(blog.faqsJson));
  } else {
    this.blogZone.set('');
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
  this.selectedResaleUnits.set([]);
  this.resaleUnitSearchText.set('');
  this.selectedPrimaryUnits.set([]);
  this.primaryUnitSearchText.set('');
  this.selectedRentUnits.set([]);
  this.rentUnitSearchText.set('');
  this.mainExistingImageUrl.set(null);
  this.mainNewImageIndex.set(null);
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
  this.resaleUnitSearchText.set('');
  this.primaryUnitSearchText.set('');
  this.rentUnitSearchText.set('');

  // ملء selectedResaleUnits / selectedPrimaryUnits / selectedRentUnits من الـ blog الموجود
  const resaleIds: number[] = this.parseJson(blog.resaleUnitIdsJson);
  this.selectedResaleUnits.set(
    resaleIds
      .map(id => this.properties().find(p => p.id === id))
      .filter(p => !!p)
      .map(p => ({ id: p.id, code: p.code, title: p.title }))
  );

  const primaryIds: number[] = this.parseJson(blog.primaryUnitIdsJson);
  this.selectedPrimaryUnits.set(
    primaryIds
      .map(id => this.properties().find(p => p.id === id))
      .filter(p => !!p)
      .map(p => ({ id: p.id, code: p.code, title: p.title }))
  );

  const rentIds: number[] = this.parseJson(blog.rentUnitIdsJson);
  this.selectedRentUnits.set(
    rentIds
      .map(id => this.properties().find(p => p.id === id))
      .filter(p => !!p)
      .map(p => ({ id: p.id, code: p.code, title: p.title }))
  );

  // main/cover image: لو ال cover موجود ضمن صور السلايدر الحالية نعلّمه
  this.mainNewImageIndex.set(null);
  const sliderImgs = this.getSliderImagesArray(blog);
  this.mainExistingImageUrl.set(
    blog.coverImageUrl && sliderImgs.includes(blog.coverImageUrl) ? blog.coverImageUrl : null
  );

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
    },
    error: () => this.alertService.error('Failed to delete image. Please try again.')
  });
}

// 🟢 عتبة حركة بسيطة عشان نفرّق بين "تاب/كليك" و"سحب فعلي" على نفس العنصر (مستخدمة في الـ 4 سلايدرات تحت)
private dragPointerStart = { x: 0, y: 0 };
public dragHasMoved = false;
private readonly DRAG_THRESHOLD_PX = 6;

// ===================== Drag & Drop reordering - Existing (already uploaded) slider images - Pointer Events =====================
draggedExistingSliderIndex: number | null = null;

onExistingSliderPointerDown(event: PointerEvent, index: number) {
  this.draggedExistingSliderIndex = index;
  this.dragHasMoved = false;
  this.dragPointerStart = { x: event.clientX, y: event.clientY };
  const handle = event.currentTarget as HTMLElement;
  handle.setPointerCapture(event.pointerId);
}

onExistingSliderPointerMove(event: PointerEvent) {
  if (this.draggedExistingSliderIndex === null) return;

  if (!this.dragHasMoved) {
    const dx = Math.abs(event.clientX - this.dragPointerStart.x);
    const dy = Math.abs(event.clientY - this.dragPointerStart.y);
    if (dx < this.DRAG_THRESHOLD_PX && dy < this.DRAG_THRESHOLD_PX) return;
    this.dragHasMoved = true;
    document.body.style.userSelect = 'none';
  }
  event.preventDefault();

  const el = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-slider-index]') as HTMLElement | null;
  if (!el) return;

  const targetIndex = Number(el.getAttribute('data-slider-index'));
  if (isNaN(targetIndex) || targetIndex === this.draggedExistingSliderIndex) return;

  const blog = this.editingBlog();
  if (!blog) return;

  const imgs = this.getSliderImagesArray(blog);
  const [moved] = imgs.splice(this.draggedExistingSliderIndex, 1);
  imgs.splice(targetIndex, 0, moved);

  this.editingBlog.set({ ...blog, sliderImages: imgs.join('|') });
  this.draggedExistingSliderIndex = targetIndex;

  // 👈 بنحفظ الترتيب الجديد فورًا في الداتابيز
  this.blogService.reorderSliderImages(blog.id, imgs).subscribe({
    error: () => this.alertService.error('Failed to save the new image order. Please try again.')
  });
}

onExistingSliderPointerUp(event: PointerEvent) {
  const handle = event.currentTarget as HTMLElement;
  handle.releasePointerCapture(event.pointerId);
  document.body.style.userSelect = '';

  // لو معملش سحب فعلي، يبقى ده تاب/كليك عادي - نعمل الأكشن بتاع "خليها الصورة الرئيسية"
  if (!this.dragHasMoved && this.draggedExistingSliderIndex !== null) {
    const blog = this.editingBlog();
    const imgs = blog ? this.getSliderImagesArray(blog) : [];
    const img = imgs[this.draggedExistingSliderIndex];
    if (img) this.setMainExistingImage(img);
  }

  this.draggedExistingSliderIndex = null;
  this.dragHasMoved = false;
}

// ===================== Drag & Drop reordering - New (not-yet-uploaded) slider images - Pointer Events =====================
draggedNewSliderIndex: number | null = null;
private newSliderInputEl: HTMLInputElement | undefined;

onNewSliderPointerDown(event: PointerEvent, index: number, inputEl?: HTMLInputElement) {
  this.draggedNewSliderIndex = index;
  this.newSliderInputEl = inputEl;
  this.dragHasMoved = false;
  this.dragPointerStart = { x: event.clientX, y: event.clientY };
  const handle = event.currentTarget as HTMLElement;
  handle.setPointerCapture(event.pointerId);
}

onNewSliderPointerMove(event: PointerEvent) {
  if (this.draggedNewSliderIndex === null) return;

  if (!this.dragHasMoved) {
    const dx = Math.abs(event.clientX - this.dragPointerStart.x);
    const dy = Math.abs(event.clientY - this.dragPointerStart.y);
    if (dx < this.DRAG_THRESHOLD_PX && dy < this.DRAG_THRESHOLD_PX) return;
    this.dragHasMoved = true;
    document.body.style.userSelect = 'none';
  }
  event.preventDefault();

  const el = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-new-slider-index]') as HTMLElement | null;
  if (!el) return;

  const targetIndex = Number(el.getAttribute('data-new-slider-index'));
  if (isNaN(targetIndex) || targetIndex === this.draggedNewSliderIndex) return;

  const currentMainFile = this.mainNewImageIndex() !== null ? this.blogSliderFiles()[this.mainNewImageIndex()!] : null;

  const files = [...this.blogSliderFiles()];
  const [moved] = files.splice(this.draggedNewSliderIndex, 1);
  files.splice(targetIndex, 0, moved);
  this.blogSliderFiles.set(files);

  // إعادة بناء الـ preview URLs بنفس الترتيب الجديد
  const urls = files.map(f => URL.createObjectURL(f));
  this.sliderPreviewUrls.set(urls);

  if (currentMainFile) {
    const newIndex = files.indexOf(currentMainFile);
    this.mainNewImageIndex.set(newIndex >= 0 ? newIndex : null);
  }

  // نعيد بناء الـ FileList بتاعة الـ input نفسه عشان العداد الطبيعي للمتصفح يفضل متطابق
  if (this.newSliderInputEl) {
    const dt = new DataTransfer();
    files.forEach(f => dt.items.add(f));
    this.newSliderInputEl.files = dt.files;
  }

  this.draggedNewSliderIndex = targetIndex;
}

onNewSliderPointerUp(event: PointerEvent) {
  const handle = event.currentTarget as HTMLElement;
  handle.releasePointerCapture(event.pointerId);
  document.body.style.userSelect = '';
  this.draggedNewSliderIndex = null;
}

// Payment Plans
addPaymentPlan()         { this.paymentPlans.update(p => [...p, { name: '', avgDownPayment: '', avgInstallment: '', years: '', note: '' }]); }
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

  // Parse unit IDs from selected signals (unlimited)
  const resaleUnitIds = this.selectedResaleUnits().map(u => u.id);
  const primaryUnitIds = this.selectedPrimaryUnits().map(u => u.id);
  const rentUnitIds = this.selectedRentUnits().map(u => u.id);

  const fd = new FormData();
  fd.append('Title',                f.title);
  fd.append('Excerpt',              f.excerpt);
  fd.append('Zone',                 f.zone || '');
  fd.append('ProjectName',          f.projectName || '');
  fd.append('DeveloperName',        f.developerName || '');
  fd.append('IsPublished',          f.isPublished ? 'true' : 'false');
  fd.append('PricePerMeterResale',  f.pricePerMeterResale?.toString() || '');
  fd.append('PricePerMeterPrimary', f.pricePerMeterPrimary?.toString() || '');
  fd.append('DownPaymentPercentage', f.downPaymentPercentage?.toString() || '');
  fd.append('AvgDownPayment',       f.avgDownPayment?.toString() || '');
  fd.append('AdminPhone',           '01509064020');
  fd.append('Button1Label',         'Gallery');
  fd.append('Button2Label',         'View on Map');
  fd.append('Button3Label',         'Master Plan');
  fd.append('ProjectDetails',       f.projectDetails || '');
  fd.append('MapEmbedUrl',          f.mapEmbedUrl || '');
  fd.append('PaymentPlansJson',     JSON.stringify(this.paymentPlans()));
  fd.append('ResaleUnitIdsJson',    JSON.stringify(resaleUnitIds));
  fd.append('PrimaryUnitIdsJson',   JSON.stringify(primaryUnitIds));
  fd.append('RentUnitIdsJson',      JSON.stringify(rentUnitIds));
  fd.append('ArticleSectionsJson',  JSON.stringify(this.articleSections()));
  fd.append('FaqsJson',             JSON.stringify(this.faqs()));

  // Main/cover image selection
  if (this.mainNewImageIndex() !== null) {
    fd.append('MainNewImageIndex', this.mainNewImageIndex()!.toString());
  } else if (this.mainExistingImageUrl()) {
    fd.append('CoverImageUrl', this.mainExistingImageUrl()!);
  }

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
getBlogCoverImage(blog: any): string {
  if (blog?.coverImageUrl) return blog.coverImageUrl;
  return this.getBlogFirstImage(blog);
}

formatPrice(event: any) {
  const input = event.target;
  const raw = input.value.replace(/[^0-9]/g, '');
  input.value = raw ? Number(raw).toLocaleString('en-US') : '';
}

// 🟢 بيعرض رقم بفواصل (500,000) في الحقل بس، وبيخزن الرقم النضيف في الداتا
// (قبل كده كنا بنخزن النص المنسّق بالفواصل زي "500,000" وده كان بيبوّظ currencyService.format() في صفحة العرض ويطلع "EGP NaN")
formatPlanField(event: any, plan: any, field: string) {
  const input = event.target;
  const raw = input.value.replace(/[^0-9]/g, '');
  const formatted = raw ? Number(raw).toLocaleString('en-US') : '';
  input.value = formatted;           // للعرض في الحقل بس
  plan[field] = raw ? Number(raw) : '';  // القيمة الفعلية المخزنة = رقم نضيف من غير فواصل
}

// ================== Launches ==================
launches = signal<any[]>([]);
launchForm!: FormGroup;
editingLaunch = signal<any>(null);
launchCoverFile = signal<File | null>(null);
launchMasterPlanFile = signal<File | null>(null);
launchSliderFiles = signal<File[]>([]);
launchButtonFiles: { [key: number]: File | null } = { 1: null, 2: null, 3: null };
launchSubmitting = signal(false);

// ================== Projects Meetings ==================
launchMeetings = signal<any[]>([]);
launchMeetingSearchText = signal('');
launchMeetingContactedFilter = signal('all');

uncontactedLaunchMeetingsCount = computed(() =>
  this.launchMeetings().filter(m => !m.isContacted).length
);

filteredLaunchMeetings = computed(() => {
  const search = this.launchMeetingSearchText().toLowerCase().trim();
  const statusFilter = this.launchMeetingContactedFilter();

  return this.launchMeetings().filter(m => {
    const matchesSearch = !search ||
      (m.fullName || '').toLowerCase().includes(search) ||
      (m.projectName || '').toLowerCase().includes(search);

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'contacted' && m.isContacted) ||
      (statusFilter === 'pending' && !m.isContacted);

    return matchesSearch && matchesStatus;
  });
});

loadLaunchMeetings() {
  this.http.get<any[]>(`${environment.apiUrl}/Launches/meetings`).subscribe({
    next: (data) => this.launchMeetings.set(data),
    error: () => this.alertService.error('Failed to load projects meetings.')
  });
}

toggleLaunchMeetingContacted(meeting: any) {
  this.http.patch<any>(`${environment.apiUrl}/Launches/meetings/${meeting.id}/toggle-contacted`, {}).subscribe({
    next: (res) => {
      meeting.isContacted = res.isContacted;
      this.launchMeetings.update(list => [...list]);
    },
    error: () => this.alertService.error('Failed to update meeting status.')
  });
}

deleteLaunchMeeting(meeting: any) {
  this.http.delete(`${environment.apiUrl}/Launches/meetings/${meeting.id}`).subscribe({
    next: () => {
      this.launchMeetings.update(list => list.filter(m => m.id !== meeting.id));
      this.alertService.success('Meeting request deleted.');
    },
    error: () => this.alertService.error('Failed to delete meeting request.')
  });
}


// ترتيب الظهور بالـ Drag & Drop - Pointer Events (بيشتغل موبايل/تابلت/ماوس)
draggedLaunchIndex: number | null = null;
launchOrderChanged = signal(false);
savingLaunchOrder = signal(false);

onLaunchPointerDown(event: PointerEvent, index: number) {
  event.preventDefault();
  this.draggedLaunchIndex = index;
  const handle = event.currentTarget as HTMLElement;
  handle.setPointerCapture(event.pointerId);
  document.body.style.userSelect = 'none';
}

onLaunchPointerMove(event: PointerEvent) {
  if (this.draggedLaunchIndex === null) return;
  event.preventDefault();

  const el = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-launch-index]') as HTMLElement | null;
  if (!el) return;

  const targetIndex = Number(el.getAttribute('data-launch-index'));
  if (isNaN(targetIndex) || targetIndex === this.draggedLaunchIndex) return;

  const current = [...this.launches()];
  const [moved] = current.splice(this.draggedLaunchIndex, 1);
  current.splice(targetIndex, 0, moved);

  this.launches.set(current);
  this.draggedLaunchIndex = targetIndex;
  this.launchOrderChanged.set(true);
}

onLaunchPointerUp(event: PointerEvent) {
  const handle = event.currentTarget as HTMLElement;
  handle.releasePointerCapture(event.pointerId);
  document.body.style.userSelect = '';
  this.draggedLaunchIndex = null;
}

saveLaunchOrder() {
  const orderedIds = this.launches().map(b => b.id);
  this.savingLaunchOrder.set(true);

  this.launchService.reorder(orderedIds).subscribe({
    next: () => {
      this.savingLaunchOrder.set(false);
      this.launchOrderChanged.set(false);
      this.alertService.success('Order saved successfully!');
    },
    error: () => {
      this.savingLaunchOrder.set(false);
      this.alertService.error('Failed to save order.');
    }
  });
}
launchPaymentPlans = signal<any[]>([]);
launchArticleSections = signal<any[]>([]);
launchFaqs = signal<any[]>([]);

// --- Zone / Project / Developer ---
launchZone = signal<string>('');

launchProjectOptions = computed(() => {
  const zone = this.launchZone();
  const zoneKey = this.zoneNameToKey[zone];
  if (!zoneKey || !this.projectsMapping[zoneKey]) return [];
  const areas: any = this.projectsMapping[zoneKey];
  const all: string[] = Object.values(areas).flat() as string[];
  return [...new Set(all)].sort();
});

// --- Main/Cover image selection ---
launchMainExistingImageUrl = signal<string | null>(null);
launchMainNewImageIndex = signal<number | null>(null);

setLaunchMainExistingImage(url: string) {
  this.launchMainExistingImageUrl.set(url);
  this.launchMainNewImageIndex.set(null);
}
isLaunchMainExistingImage(url: string): boolean {
  return this.launchMainExistingImageUrl() === url;
}
setLaunchMainNewImage(index: number) {
  this.launchMainNewImageIndex.set(index);
  this.launchMainExistingImageUrl.set(null);
}
isLaunchMainNewImage(index: number): boolean {
  return this.launchMainNewImageIndex() === index;
}

// --- Resale Units selector signals ---
launchResaleUnitSearchText = signal<string>('');
isLaunchResaleUnitDropdownOpen = signal<boolean>(false);
selectedLaunchResaleUnits = signal<any[]>([]);

filteredLaunchResaleUnitOptions = computed(() => {
  const search = this.launchResaleUnitSearchText().toLowerCase();
  return this.properties()
    .filter(p =>
      (p.code && p.code.toLowerCase().includes(search)) ||
      (p.title && p.title.toLowerCase().includes(search))
    )
    .slice(0, 50);
});

isLaunchResaleUnitSelected(id: number): boolean {
  return this.selectedLaunchResaleUnits().some(u => u.id === id);
}

addLaunchResaleUnitId(prop: any) {
  if (!this.isLaunchResaleUnitSelected(prop.id)) {
    this.selectedLaunchResaleUnits.update(list => [...list, { id: prop.id, code: prop.code, title: prop.title }]);
  }
  this.launchResaleUnitSearchText.set('');
  this.isLaunchResaleUnitDropdownOpen.set(false);
}

removeLaunchResaleUnitId(id: number) {
  this.selectedLaunchResaleUnits.update(list => list.filter(u => u.id !== id));
}

closeLaunchResaleUnitDropdown() {
  setTimeout(() => this.isLaunchResaleUnitDropdownOpen.set(false), 150);
}

// --- Primary Units selector signals ---
launchPrimaryUnitSearchText = signal<string>('');
isLaunchPrimaryUnitDropdownOpen = signal<boolean>(false);
selectedLaunchPrimaryUnits = signal<any[]>([]);

filteredLaunchPrimaryUnitOptions = computed(() => {
  const search = this.launchPrimaryUnitSearchText().toLowerCase();
  return this.properties()
    .filter(p =>
      (p.code && p.code.toLowerCase().includes(search)) ||
      (p.title && p.title.toLowerCase().includes(search))
    )
    .slice(0, 50);
});

isLaunchPrimaryUnitSelected(id: number): boolean {
  return this.selectedLaunchPrimaryUnits().some(u => u.id === id);
}

addLaunchPrimaryUnitId(prop: any) {
  if (!this.isLaunchPrimaryUnitSelected(prop.id)) {
    this.selectedLaunchPrimaryUnits.update(list => [...list, { id: prop.id, code: prop.code, title: prop.title }]);
  }
  this.launchPrimaryUnitSearchText.set('');
  this.isLaunchPrimaryUnitDropdownOpen.set(false);
}

removeLaunchPrimaryUnitId(id: number) {
  this.selectedLaunchPrimaryUnits.update(list => list.filter(u => u.id !== id));
}

closeLaunchPrimaryUnitDropdown() {
  setTimeout(() => this.isLaunchPrimaryUnitDropdownOpen.set(false), 150);
}

// --- Rent Units ---
launchRentUnitSearchText = signal<string>('');
isLaunchRentUnitDropdownOpen = signal<boolean>(false);
selectedLaunchRentUnits = signal<any[]>([]);

filteredLaunchRentUnitOptions = computed(() => {
  const search = this.launchRentUnitSearchText().toLowerCase();
  return this.properties()
    .filter(p =>
      (p.code && p.code.toLowerCase().includes(search)) ||
      (p.title && p.title.toLowerCase().includes(search))
    )
    .slice(0, 50);
});

isLaunchRentUnitSelected(id: number): boolean {
  return this.selectedLaunchRentUnits().some(u => u.id === id);
}

addLaunchRentUnitId(prop: any) {
  if (!this.isLaunchRentUnitSelected(prop.id)) {
    this.selectedLaunchRentUnits.update(list => [...list, { id: prop.id, code: prop.code, title: prop.title }]);
  }
  this.launchRentUnitSearchText.set('');
  this.isLaunchRentUnitDropdownOpen.set(false);
}

removeLaunchRentUnitId(id: number) {
  this.selectedLaunchRentUnits.update(list => list.filter(u => u.id !== id));
}

closeLaunchRentUnitDropdown() {
  setTimeout(() => this.isLaunchRentUnitDropdownOpen.set(false), 150);
}

// --- Slider preview ---
launchSliderPreviewUrls = signal<string[]>([]);

removeNewLaunchSliderImage(index: number, inputEl?: HTMLInputElement) {
  const current = [...this.launchSliderFiles()];
  current.splice(index, 1);
  this.launchSliderFiles.set(current);
  // إعادة بناء الـ preview URLs
  const urls = current.map(f => URL.createObjectURL(f));
  this.launchSliderPreviewUrls.set(urls);

  // 👈 المتصفح بيعرض عدد الملفات ("N files") من الـ FileList الأصلية بتاعة الـ <input> نفسه،
  // فلازم نعيد بناء الـ FileList دي بعد الحذف عشان العدد الظاهر يتحدث صح
  if (inputEl) {
    const dt = new DataTransfer();
    current.forEach(f => dt.items.add(f));
    inputEl.files = dt.files;
  }
}

getLaunchSliderPreviewUrl(index: number): string {
  return this.launchSliderPreviewUrls()[index] || '';
}

// أول سنة مسموح بيها في حقل Delivery Year = السنة الحالية (متجددة تلقائيًا كل سنة)
get currentYear(): number {
  return new Date().getFullYear();
}

// يمنع كتابة أي حاجة غير أرقام في حقل Delivery Year (زي -, +, e, .)
blockNonDigitKeys(event: KeyboardEvent) {
  const blocked = ['-', '+', 'e', 'E', '.', ','];
  if (blocked.includes(event.key)) {
    event.preventDefault();
  }
}

initLaunchForm(launch?: any) {
  this.launchForm = this.fb.group({
    title:                [''],
    excerpt:              [''],
    zone:                 [''],
    projectName:          [''],
    developerName:        [''],
    isPublished:          [true],
    pricePerMeterResale:  [null],
    pricePerMeterPrimary: [null],
    downPaymentPercentage: [null],
    avgDownPayment: [null],
    projectDetails:       [''],
    mapEmbedUrl:          [''],
    deliveryYear:         ['', [Validators.min(this.currentYear)]],
  });
  this.launchForm.get('zone')!.valueChanges.subscribe(v => this.launchZone.set(v || ''));
  if (launch) {
    this.launchForm.patchValue({
      title:                launch.title || '',
      excerpt:              launch.excerpt || '',
      zone:                 launch.zone || '',
      projectName:          launch.projectName || '',
      developerName:        launch.developerName || '',
      isPublished:          launch.isPublished,
      pricePerMeterResale:  launch.pricePerMeterResale,
      pricePerMeterPrimary: launch.pricePerMeterPrimary,
      downPaymentPercentage: launch.downPaymentPercentage,
      avgDownPayment: launch.avgDownPayment,
      projectDetails:       launch.projectDetails || '',
      mapEmbedUrl:          launch.mapEmbedUrl || '',
      deliveryYear:         launch.deliveryDate ? new Date(launch.deliveryDate).getFullYear() : '',
    });
    this.launchZone.set(launch.zone || '');
    this.launchPaymentPlans.set(this.parseJson(launch.paymentPlansJson));
    this.launchArticleSections.set(this.parseJson(launch.articleSectionsJson));
    this.launchFaqs.set(this.parseJson(launch.faqsJson));
  } else {
    this.launchZone.set('');
    this.launchPaymentPlans.set([]);
    this.launchArticleSections.set([]);
    this.launchFaqs.set([]);
  }
}

loadLaunches() {
  this.launchService.getAll().subscribe({
    next: (data) => this.launches.set(data),
    error: () => this.alertService.error('Failed to load launches.')
  });
}

openAddLaunch() {
  this.editingLaunch.set(null);
  this.launchSliderFiles.set([]);
  this.launchSliderPreviewUrls.set([]);
  this.launchMasterPlanFile.set(null);
  this.launchButtonFiles = { 1: null, 2: null, 3: null };
  this.selectedLaunchResaleUnits.set([]);
  this.launchResaleUnitSearchText.set('');
  this.selectedLaunchPrimaryUnits.set([]);
  this.launchPrimaryUnitSearchText.set('');
  this.selectedLaunchRentUnits.set([]);
  this.launchRentUnitSearchText.set('');
  this.launchMainExistingImageUrl.set(null);
  this.launchMainNewImageIndex.set(null);
  this.initLaunchForm();
  const modal = new (window as any).bootstrap.Modal(document.getElementById('launchFormModal'));
  modal.show();
}

openEditLaunch(launch: any) {
  this.editingLaunch.set(launch);
  this.launchSliderFiles.set([]);
  this.launchSliderPreviewUrls.set([]);
  this.launchMasterPlanFile.set(null);
  this.launchButtonFiles = { 1: null, 2: null, 3: null };
  this.launchResaleUnitSearchText.set('');
  this.launchPrimaryUnitSearchText.set('');
  this.launchRentUnitSearchText.set('');

  // ملء selectedLaunchResaleUnits / selectedLaunchPrimaryUnits / selectedLaunchRentUnits من الـ launch الموجود
  const resaleIds: number[] = this.parseJson(launch.resaleUnitIdsJson);
  this.selectedLaunchResaleUnits.set(
    resaleIds
      .map(id => this.properties().find(p => p.id === id))
      .filter(p => !!p)
      .map(p => ({ id: p.id, code: p.code, title: p.title }))
  );

  const primaryIds: number[] = this.parseJson(launch.primaryUnitIdsJson);
  this.selectedLaunchPrimaryUnits.set(
    primaryIds
      .map(id => this.properties().find(p => p.id === id))
      .filter(p => !!p)
      .map(p => ({ id: p.id, code: p.code, title: p.title }))
  );

  const rentIds: number[] = this.parseJson(launch.rentUnitIdsJson);
  this.selectedLaunchRentUnits.set(
    rentIds
      .map(id => this.properties().find(p => p.id === id))
      .filter(p => !!p)
      .map(p => ({ id: p.id, code: p.code, title: p.title }))
  );

  // main/cover image: لو ال cover موجود ضمن صور السلايدر الحالية نعلّمه
  this.launchMainNewImageIndex.set(null);
  const sliderImgs = this.getSliderImagesArray(launch);
  this.launchMainExistingImageUrl.set(
    launch.coverImageUrl && sliderImgs.includes(launch.coverImageUrl) ? launch.coverImageUrl : null
  );

  this.initLaunchForm(launch);
  const modal = new (window as any).bootstrap.Modal(document.getElementById('launchFormModal'));
  modal.show();
}

onLaunchSliderImagesChange(event: any) {
  const files = Array.from(event.target.files) as File[];
  this.launchSliderFiles.set(files);
  // بناء preview URLs للصور الجديدة
  const urls = files.map(f => URL.createObjectURL(f));
  this.launchSliderPreviewUrls.set(urls);
}

onLaunchMasterPlanChange(event: any) {
  const file = event.target.files[0];
  if (file) this.launchMasterPlanFile.set(file);
}

onLaunchButtonImageChange(event: any, btn: number) {
  const file = event.target.files[0];
  if (file) this.launchButtonFiles[btn] = file;
}

onLaunchCoverChange(event: any) {
  const file = event.target.files[0];
  if (file) this.launchCoverFile.set(file);
}

removeLaunchSliderImage(filename: string) {
  const launch = this.editingLaunch();
  if (!launch) return;
  this.launchService.deleteSliderImage(launch.id, filename).subscribe({
    next: () => {
      const imgs = this.getSliderImagesArray(launch).filter(i => i !== filename);
      this.editingLaunch.set({ ...launch, sliderImages: imgs.join('|') });
      this.loadLaunches();
    },
    error: () => this.alertService.error('Failed to delete image. Please try again.')
  });
}

// ===================== Drag & Drop reordering - Existing (already uploaded) slider images - Pointer Events =====================
draggedExistingLaunchSliderIndex: number | null = null;

onExistingLaunchSliderPointerDown(event: PointerEvent, index: number) {
  this.draggedExistingLaunchSliderIndex = index;
  this.dragHasMoved = false;
  this.dragPointerStart = { x: event.clientX, y: event.clientY };
  const handle = event.currentTarget as HTMLElement;
  handle.setPointerCapture(event.pointerId);
}

onExistingLaunchSliderPointerMove(event: PointerEvent) {
  if (this.draggedExistingLaunchSliderIndex === null) return;

  if (!this.dragHasMoved) {
    const dx = Math.abs(event.clientX - this.dragPointerStart.x);
    const dy = Math.abs(event.clientY - this.dragPointerStart.y);
    if (dx < this.DRAG_THRESHOLD_PX && dy < this.DRAG_THRESHOLD_PX) return;
    this.dragHasMoved = true;
    document.body.style.userSelect = 'none';
  }
  event.preventDefault();

  const el = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-launch-slider-index]') as HTMLElement | null;
  if (!el) return;

  const targetIndex = Number(el.getAttribute('data-launch-slider-index'));
  if (isNaN(targetIndex) || targetIndex === this.draggedExistingLaunchSliderIndex) return;

  const launch = this.editingLaunch();
  if (!launch) return;

  const imgs = this.getSliderImagesArray(launch);
  const [moved] = imgs.splice(this.draggedExistingLaunchSliderIndex, 1);
  imgs.splice(targetIndex, 0, moved);

  this.editingLaunch.set({ ...launch, sliderImages: imgs.join('|') });
  this.draggedExistingLaunchSliderIndex = targetIndex;

  // 👈 بنحفظ الترتيب الجديد فورًا في الداتابيز
  this.launchService.reorderSliderImages(launch.id, imgs).subscribe({
    error: () => this.alertService.error('Failed to save the new image order. Please try again.')
  });
}

onExistingLaunchSliderPointerUp(event: PointerEvent) {
  const handle = event.currentTarget as HTMLElement;
  handle.releasePointerCapture(event.pointerId);
  document.body.style.userSelect = '';

  // لو معملش سحب فعلي، يبقى ده تاب/كليك عادي - نعمل الأكشن بتاع "خليها الصورة الرئيسية"
  if (!this.dragHasMoved && this.draggedExistingLaunchSliderIndex !== null) {
    const launch = this.editingLaunch();
    const imgs = launch ? this.getSliderImagesArray(launch) : [];
    const img = imgs[this.draggedExistingLaunchSliderIndex];
    if (img) this.setLaunchMainExistingImage(img);
  }

  this.draggedExistingLaunchSliderIndex = null;
  this.dragHasMoved = false;
}

// ===================== Drag & Drop reordering - New (not-yet-uploaded) slider images - Pointer Events =====================
draggedNewLaunchSliderIndex: number | null = null;
private newLaunchSliderInputEl: HTMLInputElement | undefined;

onNewLaunchSliderPointerDown(event: PointerEvent, index: number, inputEl?: HTMLInputElement) {
  this.draggedNewLaunchSliderIndex = index;
  this.newLaunchSliderInputEl = inputEl;
  this.dragHasMoved = false;
  this.dragPointerStart = { x: event.clientX, y: event.clientY };
  const handle = event.currentTarget as HTMLElement;
  handle.setPointerCapture(event.pointerId);
}

onNewLaunchSliderPointerMove(event: PointerEvent) {
  if (this.draggedNewLaunchSliderIndex === null) return;

  if (!this.dragHasMoved) {
    const dx = Math.abs(event.clientX - this.dragPointerStart.x);
    const dy = Math.abs(event.clientY - this.dragPointerStart.y);
    if (dx < this.DRAG_THRESHOLD_PX && dy < this.DRAG_THRESHOLD_PX) return;
    this.dragHasMoved = true;
    document.body.style.userSelect = 'none';
  }
  event.preventDefault();

  const el = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-new-launch-slider-index]') as HTMLElement | null;
  if (!el) return;

  const targetIndex = Number(el.getAttribute('data-new-launch-slider-index'));
  if (isNaN(targetIndex) || targetIndex === this.draggedNewLaunchSliderIndex) return;

  const currentMainFile = this.launchMainNewImageIndex() !== null ? this.launchSliderFiles()[this.launchMainNewImageIndex()!] : null;

  const files = [...this.launchSliderFiles()];
  const [moved] = files.splice(this.draggedNewLaunchSliderIndex, 1);
  files.splice(targetIndex, 0, moved);
  this.launchSliderFiles.set(files);

  // إعادة بناء الـ preview URLs بنفس الترتيب الجديد
  const urls = files.map(f => URL.createObjectURL(f));
  this.launchSliderPreviewUrls.set(urls);

  if (currentMainFile) {
    const newIndex = files.indexOf(currentMainFile);
    this.launchMainNewImageIndex.set(newIndex >= 0 ? newIndex : null);
  }

  // نعيد بناء الـ FileList بتاعة الـ input نفسه عشان العداد الطبيعي للمتصفح يفضل متطابق
  if (this.newLaunchSliderInputEl) {
    const dt = new DataTransfer();
    files.forEach(f => dt.items.add(f));
    this.newLaunchSliderInputEl.files = dt.files;
  }

  this.draggedNewLaunchSliderIndex = targetIndex;
}

onNewLaunchSliderPointerUp(event: PointerEvent) {
  const handle = event.currentTarget as HTMLElement;
  handle.releasePointerCapture(event.pointerId);
  document.body.style.userSelect = '';

  if (!this.dragHasMoved && this.draggedNewLaunchSliderIndex !== null) {
    this.setLaunchMainNewImage(this.draggedNewLaunchSliderIndex);
  }

  this.draggedNewLaunchSliderIndex = null;
  this.dragHasMoved = false;
}

// Payment Plans
addLaunchPaymentPlan()         { this.launchPaymentPlans.update(p => [...p, { name: '', avgDownPayment: '', avgInstallment: '', years: '', note: '' }]); }
removeLaunchPaymentPlan(i: number) { this.launchPaymentPlans.update(p => p.filter((_, idx) => idx !== i)); }

// Article Sections
addLaunchArticleSection()          { this.launchArticleSections.update(s => [...s, { headline: '', text: '' }]); }
removeLaunchArticleSection(i: number) { this.launchArticleSections.update(s => s.filter((_, idx) => idx !== i)); }

// FAQs
addLaunchFaq()       { this.launchFaqs.update(f => [...f, { question: '', answer: '' }]); }
removeLaunchFaq(i: number) { this.launchFaqs.update(f => f.filter((_, idx) => idx !== i)); }

submitLaunch() {
  if (!this.launchForm.value.title?.trim()) { this.alertService.error('Please enter a project name.'); return; }

  // ✅ Delivery Year: لازم تكون السنة الحالية أو بعدها
  const deliveryYearRaw = this.launchForm.value.deliveryYear;
  const deliveryYear = deliveryYearRaw ? Number(deliveryYearRaw) : null;
  if (deliveryYear !== null && (isNaN(deliveryYear) || deliveryYear < this.currentYear)) {
    this.alertService.error(`Delivery year must be ${this.currentYear} or later.`);
    return;
  }

  this.launchSubmitting.set(true);
  const f = this.launchForm.value;

  // Parse unit IDs from selected signals (unlimited)
  const resaleUnitIds = this.selectedLaunchResaleUnits().map(u => u.id);
  const primaryUnitIds = this.selectedLaunchPrimaryUnits().map(u => u.id);
  const rentUnitIds = this.selectedLaunchRentUnits().map(u => u.id);

  const fd = new FormData();
  fd.append('Title',                f.title);
  fd.append('Excerpt',              f.excerpt);
  fd.append('Zone',                 f.zone || '');
  fd.append('ProjectName',          f.projectName || '');
  fd.append('DeveloperName',        f.developerName || '');
  fd.append('IsPublished',          f.isPublished ? 'true' : 'false');
  fd.append('PricePerMeterResale',  f.pricePerMeterResale?.toString() || '');
  fd.append('PricePerMeterPrimary', f.pricePerMeterPrimary?.toString() || '');
  fd.append('DownPaymentPercentage', f.downPaymentPercentage?.toString() || '');
  fd.append('AvgDownPayment',       f.avgDownPayment?.toString() || '');
  fd.append('AdminPhone',           '01509064020');
  fd.append('Button1Label',         'Gallery');
  fd.append('Button2Label',         'View on Map');
  fd.append('Button3Label',         'Master Plan');
  fd.append('ProjectDetails',       f.projectDetails || '');
  fd.append('MapEmbedUrl',          f.mapEmbedUrl || '');
  fd.append('DeliveryDate',         deliveryYear ? `${deliveryYear}-01-01` : '');
  fd.append('PaymentPlansJson',     JSON.stringify(this.launchPaymentPlans()));
  fd.append('ResaleUnitIdsJson',    JSON.stringify(resaleUnitIds));
  fd.append('PrimaryUnitIdsJson',   JSON.stringify(primaryUnitIds));
  fd.append('RentUnitIdsJson',      JSON.stringify(rentUnitIds));
  fd.append('ArticleSectionsJson',  JSON.stringify(this.launchArticleSections()));
  fd.append('FaqsJson',             JSON.stringify(this.launchFaqs()));

  // Main/cover image selection
  if (this.launchMainNewImageIndex() !== null) {
    fd.append('MainNewImageIndex', this.launchMainNewImageIndex()!.toString());
  } else if (this.launchMainExistingImageUrl()) {
    fd.append('CoverImageUrl', this.launchMainExistingImageUrl()!);
  }

  this.launchSliderFiles().forEach(file => fd.append('SliderImages', file));
  if (this.launchMasterPlanFile()) fd.append('MasterPlanImage', this.launchMasterPlanFile()!);
  [1, 2, 3].forEach(btn => {
    if (this.launchButtonFiles[btn]) fd.append(`Button${btn}Image`, this.launchButtonFiles[btn]!);
  });

  const editing = this.editingLaunch();
  const req = editing ? this.launchService.update(editing.id, fd) : this.launchService.create(fd);

  req.subscribe({
    next: () => {
      this.launchSubmitting.set(false);
      this.alertService.success(editing ? 'Launch updated!' : 'Launch created!');
      this.loadLaunches();
      const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('launchFormModal'));
      modal?.hide();
    },
    error: () => { this.launchSubmitting.set(false); this.alertService.error('Failed to save launch.'); }
  });
}

deleteLaunch(id: number) {
  this.alertService.confirm('Delete this launch?', () => {
    this.launchService.delete(id).subscribe({
      next: () => { this.alertService.success('Launch deleted.'); this.loadLaunches(); },
      error: () => this.alertService.error('Failed to delete launch.')
    });
  });
}

getLaunchImageUrl(filename: string) { return this.launchService.getImageUrl(filename); }
getLaunchFirstImage(launch: any): string {
  const imgs = this.launchService.getSliderImages(launch);
  return imgs.length > 0 ? imgs[0] : '';
}
getLaunchCoverImage(launch: any): string {
  if (launch?.coverImageUrl) return launch.coverImageUrl;
  return this.getLaunchFirstImage(launch);
}

// ============================================================
// 🟢 Blogs (Articles) — تاب جديد بالكامل، منفصل عن blogs/launches الحاليين
// ============================================================

articles = signal<any[]>([]);
editingArticle = signal<any>(null);
articleSubmitting = signal(false);
articleForm!: FormGroup;

// عناوين وفقرات المقال (عدد مفتوح) + الكلمات المفتاحية
articleContentSections = signal<any[]>([]);
articleKeywords = signal<string[]>([]);
newKeywordInput: string = '';

// ملفات مرفوعة حديثًا (لسه ما اتبعتتش) — الغلاف + الـ 5 بانرات
articleCoverFile = signal<File | null>(null);
articleAd1File = signal<File | null>(null);
articleAd2File = signal<File | null>(null);
articleAd3File = signal<File | null>(null);
articleAd4File = signal<File | null>(null);
articleAd5File = signal<File | null>(null);

// روابط تحويل البانرات الخمسة - محفوظة محليًا عشان تشتغل في وضع الإضافة والتعديل مع بعض
articleAdLinks: any = { ad1Link: '', ad2Link: '', ad3Link: '', ad4Link: '', ad5Link: '' };

// أقل تاريخ مسموح بيه في حقل Published Date = النهاردة (بيتجدد تلقائيًا كل يوم)
get todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// بيمنع اختيار تاريخ نشر في الماضي
minTodayValidator = (control: any) => {
  if (!control.value) return null;
  return control.value < this.todayDate ? { pastDate: true } : null;
};

loadArticles() {
  this.articleService.getAll().subscribe({
    next: (data: any[]) => this.articles.set(data),
    error: () => this.alertService.error('Failed to load blogs.')
  });
}

initArticleForm(article?: any) {
  this.articleForm = this.fb.group({
    title:          ['', Validators.required],
    excerpt:        [''],
    coverCaption:   [''],
    writtenBy:      ['', Validators.required],
    publishedAt:    ['', [this.minTodayValidator]],
    isPublished:    [true],
  });

  this.articleCoverFile.set(null);
  this.articleAd1File.set(null);
  this.articleAd2File.set(null);
  this.articleAd3File.set(null);
  this.articleAd4File.set(null);
  this.articleAd5File.set(null);

  if (article) {
    this.articleForm.patchValue({
      title:        article.title || '',
      excerpt:      article.excerpt || '',
      coverCaption: article.coverCaption || '',
      writtenBy:    article.writtenBy || '',
      publishedAt:  article.publishedAt ? article.publishedAt.substring(0, 10) : '',
      isPublished:  article.isPublished,
    });
    this.articleContentSections.set(this.parseJson(article.sectionsJson));
    this.articleKeywords.set(this.parseJson(article.keywordsJson));
    this.articleAdLinks = {
      ad1Link: article.ad1Link || '',
      ad2Link: article.ad2Link || '',
      ad3Link: article.ad3Link || '',
      ad4Link: article.ad4Link || '',
      ad5Link: article.ad5Link || '',
    };
  } else {
    this.articleContentSections.set([]);
    this.articleKeywords.set([]);
    this.articleAdLinks = { ad1Link: '', ad2Link: '', ad3Link: '', ad4Link: '', ad5Link: '' };
  }
}

openAddArticle() {
  this.editingArticle.set(null);
  this.initArticleForm();
  const modal = new (window as any).bootstrap.Modal(document.getElementById('articleFormModal'));
  modal.show();
}

openEditArticle(article: any) {
  this.editingArticle.set(article);
  this.initArticleForm(article);
  const modal = new (window as any).bootstrap.Modal(document.getElementById('articleFormModal'));
  modal.show();
}

// ── عناوين وفقرات المقال ──
addArticleContentSection() { this.articleContentSections.update(s => [...s, { headline: '', text: '' }]); }
removeArticleContentSection(i: number) { this.articleContentSections.update(s => s.filter((_, idx) => idx !== i)); }

// ── الكلمات المفتاحية ──
addArticleKeyword() {
  const kw = this.newKeywordInput.trim();
  if (!kw) return;
  if (!this.articleKeywords().includes(kw)) {
    this.articleKeywords.update(k => [...k, kw]);
  }
  this.newKeywordInput = '';
}
removeArticleKeyword(i: number) { this.articleKeywords.update(k => k.filter((_, idx) => idx !== i)); }

// ── رفع الملفات (Cover + 5 بانرات) ──
onArticleCoverChange(event: any) {
  const file = event.target.files[0];
  if (file) this.articleCoverFile.set(file);
}
onArticleAdChange(event: any, slot: number) {
  const file = event.target.files[0];
  if (!file) return;
  if (slot === 1) this.articleAd1File.set(file);
  if (slot === 2) this.articleAd2File.set(file);
  if (slot === 3) this.articleAd3File.set(file);
  if (slot === 4) this.articleAd4File.set(file);
  if (slot === 5) this.articleAd5File.set(file);
}

// مسح بانر إعلان موجود بالفعل (بعد الحفظ، من صفحة التعديل)
onDeleteArticleAdBanner(slot: number) {
  const article = this.editingArticle();
  if (!article) return;
  this.alertService.confirm('Remove this ad banner?', () => {
    this.articleService.deleteAdBanner(article.id, slot).subscribe({
      next: () => {
        this.alertService.success('Ad banner removed.');
        this.articleService.getById(article.id).subscribe((fresh: any) => this.editingArticle.set(fresh));
      },
      error: () => this.alertService.error('Failed to remove ad banner.')
    });
  });
}

submitArticle() {
  if (this.articleForm.get('title')?.invalid || this.articleForm.get('writtenBy')?.invalid) {
    this.alertService.error('Please fill in the required fields (Title, Written By).');
    return;
  }
  if (this.articleForm.get('publishedAt')?.invalid) {
    this.alertService.error("Published date can't be in the past.");
    return;
  }

  this.articleSubmitting.set(true);
  const f = this.articleForm.value;
  const fd = new FormData();

  fd.append('Title',        f.title || '');
  fd.append('Excerpt',      f.excerpt || '');
  fd.append('CoverCaption', f.coverCaption || '');
  fd.append('WrittenBy',    f.writtenBy || '');
  if (f.publishedAt) fd.append('PublishedAt', f.publishedAt);
  fd.append('IsPublished',  String(f.isPublished));
  fd.append('SectionsJson', JSON.stringify(this.articleContentSections()));
  fd.append('KeywordsJson', JSON.stringify(this.articleKeywords()));

  if (this.articleCoverFile()) fd.append('CoverImage', this.articleCoverFile()!);
  if (this.articleAd1File())   fd.append('Ad1Media', this.articleAd1File()!);
  if (this.articleAd2File())   fd.append('Ad2Media', this.articleAd2File()!);
  if (this.articleAd3File())   fd.append('Ad3Media', this.articleAd3File()!);
  if (this.articleAd4File())   fd.append('Ad4Media', this.articleAd4File()!);
  if (this.articleAd5File())   fd.append('Ad5Media', this.articleAd5File()!);

  const editing = this.editingArticle();
  fd.append('Ad1Link', this.articleAdLinks.ad1Link || '');
  fd.append('Ad2Link', this.articleAdLinks.ad2Link || '');
  fd.append('Ad3Link', this.articleAdLinks.ad3Link || '');
  fd.append('Ad4Link', this.articleAdLinks.ad4Link || '');
  fd.append('Ad5Link', this.articleAdLinks.ad5Link || '');

  const req = editing ? this.articleService.update(editing.id, fd) : this.articleService.create(fd);
  req.subscribe({
    next: () => {
      this.articleSubmitting.set(false);
      this.alertService.success(editing ? 'Blog updated!' : 'Blog published!');
      const modalEl = document.getElementById('articleFormModal');
      const modalInstance = (window as any).bootstrap.Modal.getInstance(modalEl);
      modalInstance?.hide();
      this.loadArticles();
    },
    error: () => {
      this.articleSubmitting.set(false);
      this.alertService.error('Failed to save the blog. Please try again.');
    }
  });
}

deleteArticle(id: number) {
  this.alertService.confirm('Delete this blog?', () => {
    this.articleService.delete(id).subscribe({
      next: () => { this.alertService.success('Blog deleted.'); this.loadArticles(); },
      error: () => this.alertService.error('Failed to delete blog.')
    });
  });
}

getArticleImageUrl(url: string) { return this.articleService.getImageUrl(url); }

// ── Helpers لقراءة/تعديل حقول البانرات الخمسة (Ad1..Ad5) من الـ template بأمان ──
getArticleAdUrl(slot: number): string {
  const a = this.editingArticle();
  return a ? (a[`ad${slot}Url`] || '') : '';
}
getArticleAdLink(slot: number): string {
  return this.articleAdLinks[`ad${slot}Link`] || '';
}
setArticleAdLink(slot: number, value: string) {
  this.articleAdLinks[`ad${slot}Link`] = value;
}
}