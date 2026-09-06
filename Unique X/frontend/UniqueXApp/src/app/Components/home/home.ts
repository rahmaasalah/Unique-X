import { Component, inject, OnInit, signal, ChangeDetectorRef, computed, WritableSignal  } from '@angular/core';
import { CommonModule } from '@angular/common'; // مهم جداً للأوامر مثل *ngIf
import { FormsModule } from '@angular/forms';
import { PropertyCardComponent } from '../property-card/property-card'; // مهم لكي يتعرف على الكارت
import { PropertyService } from '../../Services/property';
import { Property } from '../../Models/property.model';
import { ActivatedRoute } from '@angular/router';
import { Router, RouterModule } from '@angular/router';
import { PhoneInputComponent } from '../phone-input/phone-input';
import { AuthService } from '../../Services/auth';
import { AdminService } from '../../Services/admin';
import { BlogService } from '../../Services/blog.service';
import { ArticleService } from '../../Services/article.service';
import { RecommendationModalService } from '../../Services/recommendation-modal.service';
import { CrmService } from '../../Services/crm.services';
import { RecommendationLeadDto } from '../../Models/crm.models';
import { LaunchService } from '../../Services/launch.service';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { CurrencyService } from '../../Services/currency.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';



@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, PropertyCardComponent, RouterModule, PhoneInputComponent], 
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  message = signal<string>('');
  ads = signal<any[]>([]);
  blogs = signal<any[]>([]);
  launches = signal<any[]>([]);
  private http = inject(HttpClient);

  // 🟢 Pagination (Load More) - كل نوع (Resale/ResaleProject/Primary/Rent) له صفحته وزراره الخاص بيه لوحده
  private readonly pageSize = 12;
  private lastFilters: any = {};
  isLoading = signal<boolean>(false);

  resaleProps = signal<Property[]>([]);
  resaleTotal = signal(0);
  resalePage = signal(1);
  resaleLoadingMore = signal(false);
  resaleHasMore = computed(() => this.resaleProps().length < this.resaleTotal());

  resaleProjectProps = signal<Property[]>([]);
  resaleProjectTotal = signal(0);
  resaleProjectPage = signal(1);
  resaleProjectLoadingMore = signal(false);
  resaleProjectHasMore = computed(() => this.resaleProjectProps().length < this.resaleProjectTotal());

  primaryProps = signal<Property[]>([]);
  primaryTotal = signal(0);
  primaryPage = signal(1);
  primaryLoadingMore = signal(false);
  primaryHasMore = computed(() => this.primaryProps().length < this.primaryTotal());

  rentProps = signal<Property[]>([]);
  rentTotal = signal(0);
  rentPage = signal(1);
  rentLoadingMore = signal(false);
  rentHasMore = computed(() => this.rentProps().length < this.rentTotal());

  // 🟢 خريطة صغيرة بتربط كود نوع الإعلان (زي اللي في الباك إند) بالـ signals بتاعته - عشان مانكررش نفس الكود 4 مرات
  private categoryState: Record<number, {
    props: WritableSignal<Property[]>;
    total: WritableSignal<number>;
    page: WritableSignal<number>;
    loadingMore: WritableSignal<boolean>;
  }> = {
    0: { props: this.resaleProps, total: this.resaleTotal, page: this.resalePage, loadingMore: this.resaleLoadingMore },
    1: { props: this.rentProps, total: this.rentTotal, page: this.rentPage, loadingMore: this.rentLoadingMore },
    2: { props: this.primaryProps, total: this.primaryTotal, page: this.primaryPage, loadingMore: this.primaryLoadingMore },
    3: { props: this.resaleProjectProps, total: this.resaleProjectTotal, page: this.resaleProjectPage, loadingMore: this.resaleProjectLoadingMore },
  };

  anyResultsFound = computed(() =>
    this.resaleProps().length > 0 || this.resaleProjectProps().length > 0 ||
    this.primaryProps().length > 0 || this.rentProps().length > 0
  );

  // 🟢 بانرات ثابتة بين قسمي Launches و Hot Deals - Array واحد مرتب حسب ترتيب الأدمن
  homeSectionBanners = signal<any[]>([]);

  // 🟢 "Get Recommendation" — مودال اختيار المواصفات (بيفتح من البانر مباشرة، من غير بوب أب تأكيد الأول)
  // 🟢 حالة مودال "Get Recommendation" بقت في service مشترك عشان زرار الناف بار يقدر يفتحه من أي صفحة
  recommendationForm: {
    cities: string[];
    listingTypes: string[];
    propertyTypes: string[];
    minRooms: string; maxRooms: string;
    minBathrooms: string; maxBathrooms: string;
  } = {
    cities: [],
    listingTypes: [],
    propertyTypes: [],
    minRooms: '', maxRooms: '',
    minBathrooms: '', maxBathrooms: ''
  };

  adminPhone = signal<string>('');
  showAdvancedFilters = signal<boolean>(false);
  private gaService = inject(GoogleAnalyticsService);
  private blogService = inject(BlogService);
  private articleService = inject(ArticleService);
  recommendationModalService = inject(RecommendationModalService);
  private crmService = inject(CrmService);
  private launchService = inject(LaunchService);
  currencyService = inject(CurrencyService);

  hotDealsList = signal<any[]>([]);
  recommendedVisitsList = signal<any[]>([]);
  articles = signal<any[]>([]);

  activeQueryParams = signal<any>({});

  // 🟢 2. التحقق هل المستخدم يبحث من شريط البحث (Search Bar) أم لا
   hasSearchFilters = computed(() => {
    const q = this.activeQueryParams();
    return !!(
      q['searchTerm'] || q['city'] || q['projectName'] || q['code'] || 
      q['minPrice'] || q['maxPrice'] || q['minPricePerMeter'] || q['maxPricePerMeter'] || q['area'] || q['minRooms'] || 
      q['maxRooms'] || q['minBathrooms'] || q['maxBathrooms'] || 
      q['minFloor'] || q['maxFloor'] || 
      q['brokerId'] || q['brokerName'] || q['broker'] || // 👈 ضفنا فحص البروكر
      q['listingType'] // 👈 ضفنا فحص الناف بار (Resale, Rent...)
    );
  });

  // 🟢 نوع الإعلان النشط (Resale/Rent/Primary/Resale Project) — بيتحدد من الـ Query Param، ونستخدمه لتمييز التاب النشط
  activeType = computed(() => {
    const q = this.activeQueryParams();
    return q['listingType'] !== undefined ? q['listingType'].toString() : null;
  });

  // 🟢 3. فلترة الـ Hot Deals بناءً على الناف بار (Listing Type)
  filteredHotDeals = computed(() => {
    const params = this.activeQueryParams(); 
    let deals = this.hotDealsList();
    
    const listingType = params['listingType']?.toString() || null;
    
    // لو اختار Primary مثلاً، هنعرض الـ Hot Deals اللي نوعها Primary بس
    if (listingType && listingType !== 'null') {
      deals = deals.filter(d => d.listingType === listingType);
    }
    
    return deals;
  });

  // 🟢 نفس فكرة الـ Hot Deals بالظبط - فلترة Recommended to Visit بناءً على الناف بار (Listing Type)
  filteredRecommendedVisits = computed(() => {
    const params = this.activeQueryParams();
    let visits = this.recommendedVisitsList();

    const listingType = params['listingType']?.toString() || null;

    if (listingType && listingType !== 'null') {
      visits = visits.filter(v => v.listingType === listingType);
    }

    return visits;
  });


  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef); 
  constructor(private propertyService: PropertyService, 
  private router: Router, private activatedRoute: ActivatedRoute, public authService: AuthService,
  private adminService: AdminService) {}

  currentListingType: string | null = null;
  currentProjectName: string | null = null;

  // 🟢 Region & Project typeahead - بيتقروا لايف من الداتا بيز (api/properties/regions-list و api/properties/projects-list)
  // بدل الـ object الثابت اللي كان متسجل يدوي واللي مكنش بيتحدث لما الأدمن يضيف منطقة/مشروع جديد
  allRegions = signal<any[]>([]);
  regionSearchText = signal<string>('');
  isRegionDropdownOpen = signal<boolean>(false);
  selectedRegionName = signal<string>('');

  allProjects = signal<any[]>([]);
  projectSearchText = signal<string>('');
  isProjectDropdownOpen = signal<boolean>(false);
  selectedProjectNameValue = signal<string>('');

  filteredRegionOptions = computed(() => {
    const search = this.regionSearchText().toLowerCase();
    return this.allRegions().filter(r => r.name.toLowerCase().includes(search)).slice(0, 50);
  });

  filteredProjectOptions = computed(() => {
    const search = this.projectSearchText().toLowerCase();
    return this.allProjects().filter(p => p.name.toLowerCase().includes(search)).slice(0, 50);
  });

  // بيجيب المناطق والمشاريع من الداتا بيز، ولو city اتحددت بيفلتر عليها بس
  loadRegionsAndProjects(cityId?: any) {
    const cityParam = cityId ? `?city=${cityId}` : '';

    this.http.get<any[]>(`${environment.apiUrl}/Properties/regions-list${cityParam}`).subscribe({
      next: (data) => this.allRegions.set(data || []),
      error: () => this.allRegions.set([])
    });

    this.http.get<any[]>(`${environment.apiUrl}/Properties/projects-list${cityParam}`).subscribe({
      next: (data) => this.allProjects.set(data || []),
      error: () => this.allProjects.set([])
    });
  }

  selectRegion(name: string) {
    this.selectedRegionName.set(name);
    this.regionSearchText.set(name);
    this.isRegionDropdownOpen.set(false);
  }

  clearRegionSelection() {
    this.selectedRegionName.set('');
    this.regionSearchText.set('');
  }

  closeRegionDropdown() {
    setTimeout(() => this.isRegionDropdownOpen.set(false), 200);
  }

  selectProject(name: string) {
    this.selectedProjectNameValue.set(name);
    this.projectSearchText.set(name);
    this.isProjectDropdownOpen.set(false);
  }

  clearProjectSelection() {
    this.selectedProjectNameValue.set('');
    this.projectSearchText.set('');
  }

  closeProjectDropdown() {
    setTimeout(() => this.isProjectDropdownOpen.set(false), 200);
  }


ngOnInit(): void {
  // 🟢 1. نقلنا الـ Hot Deals بره عشان تحمل مرة واحدة بس ومتبقاش بطيئة!
  this.loadHotDeals();
  this.loadRecommendedVisits();

  // 🟢 "Get Recommendation": لو المستخدم رجع من صفحة اللوجين وكان عبّى المودال قبل كده وهو مش مسجل دخول،
  // نوديه لصفحة النتائج على طول (من غير ما نعيد فتح المودال تاني)
  const pendingParams = localStorage.getItem('pendingRecommendationParams');
  if (this.authService.loggedIn() && pendingParams) {
    localStorage.removeItem('pendingRecommendationParams');
    try {
      const params = JSON.parse(pendingParams);
      // 🟢 دلوقتي بقى مسجل دخول - نبعت نفس الطلب اللي كان ملاه قبل اللوجين كـ Lead للـ CRM
      this.submitRecommendationToCrm({
        cities: params.city ? params.city.split(',') : [],
        listingTypes: params.listingType ? params.listingType.split(',') : [],
        propertyTypes: params.propertyType ? params.propertyType.split(',') : [],
        minRooms: params.minRooms || '', maxRooms: params.maxRooms || '',
        minBathrooms: params.minBathrooms || '', maxBathrooms: params.maxBathrooms || ''
      }, params.minBudget, params.maxBudget);
      this.router.navigate(['/recommendation-results'], { queryParams: params });
    } catch { }
  } else if (!this.authService.loggedIn()) {
    // 🟢 لو مش مسجل دخول، مودال الـ Recommendation بيفتح تلقائي أول ما يوصل الهوم (من غير بوب أب تأكيد)
    setTimeout(() => this.recommendationModalService.open(), 600);
  }

  this.route.queryParams.subscribe(params => {
    this.currentListingType = params['listingType']?.toString() || null;
    this.currentProjectName = params['projectName'] || '';
    this.activeQueryParams.set(params);

    if (params['projectName']) this.selectProject(params['projectName']);
    if (params['region']) this.selectRegion(params['region']);

    this.updateProjectsList(params['city']);
    this.loadProperties(params);
  });

  // (باقي كود الإعلانات ورقم الأدمن زي ما هو عندك بدون تغيير)
  this.adminService.getPublicBanners().subscribe({
    next: (data: any[]) => {
      const formattedAds = data.map((b: any) => ({
        image: b.imageUrl, 
        message: `Hello, I am interested in your Ad: ${b.messageTitle}`
      }));
      this.ads.set(formattedAds);
      setTimeout(() => {
        this.cdr.detectChanges(); 
        const bootstrap = (window as any).bootstrap;
        const carouselElement = document.querySelector('#adsCarousel');
        if (carouselElement && bootstrap) {
          const carousel = new bootstrap.Carousel(carouselElement, {
            interval: 3000, ride: 'carousel', pause: 'hover'
          });
          carousel.cycle();
        }
      }, 100);
    },
    error: (err) => console.error('Banners Error:', err)
  });

  this.authService.getAdminContact().subscribe(res => {
    this.adminPhone.set(res.phoneNumber);
  });

  this.loadBlogs();
  this.loadArticles();
  this.loadLaunches();
  this.loadHomeSectionBanners();
}
loadHotDeals() {
  // افترضي وجود هذه الدالة في الـ PropertyService
  this.propertyService.getHotDeals().subscribe(data => this.hotDealsList.set(data));
}

// 🟢 نفس فكرة loadHotDeals بالظبط - افترضي وجود getRecommendedVisits() في الـ PropertyService
loadRecommendedVisits() {
  this.propertyService.getRecommendedVisits().subscribe(data => this.recommendedVisitsList.set(data));
}

// ===== "Get Recommendation" (بتفتح تلقائي لليوزر مش المسجل دخول، أو من بانر Recommendation) =====

onRecommendationBannerClick() {
  // بقى مفتوح لأي حد يملاه، تسجيل الدخول بقى بس وقت الـ Submit
  this.recommendationModalService.open();
}

closeRecommendationModal() {
  this.recommendationModalService.close();
}

// checkboxes الاختيار المتعدد (Zone / Listing Type / Property Type)
toggleRecommendationValue(list: string[], value: string): void {
  const idx = list.indexOf(value);
  if (idx > -1) list.splice(idx, 1);
  else list.push(value);
}

isRecommendationValueSelected(list: string[], value: string): boolean {
  return list.includes(value);
}

submitRecommendation(minBudgetEl: HTMLInputElement, maxBudgetEl: HTMLInputElement) {
  const f = this.recommendationForm;
  const queryParams: any = {};

  if (f.cities.length) queryParams.city = f.cities.join(',');
  if (f.listingTypes.length) queryParams.listingType = f.listingTypes.join(',');
  if (f.propertyTypes.length) queryParams.propertyType = f.propertyTypes.join(',');

  if (f.minRooms) queryParams.minRooms = f.minRooms;
  if (f.maxRooms) queryParams.maxRooms = f.maxRooms;
  if (f.minBathrooms) queryParams.minBathrooms = f.minBathrooms;
  if (f.maxBathrooms) queryParams.maxBathrooms = f.maxBathrooms;

  const minBudget = minBudgetEl?.value?.replace(/,/g, '');
  const maxBudget = maxBudgetEl?.value?.replace(/,/g, '');
  if (minBudget) queryParams.minBudget = minBudget;
  if (maxBudget) queryParams.maxBudget = maxBudget;

  this.recommendationModalService.close();

  // 🟢 لو مسجل دخول: نبعت طلبه كـ Lead للـ CRM في الخلفية (Fire & Forget - مبيأثرش على تجربة البحث العادية)
  if (this.authService.loggedIn()) {
    this.submitRecommendationToCrm(f, minBudget, maxBudget);
  }

  // 🟢 لو مش مسجل دخول: نحفظ المواصفات اللي ملاها ونوديه يسجل دخول الأول، وبعد الرجوع هيتوجه لصفحة
  // النتائج تلقائي (اتعمل فوق في ngOnInit). لو مسجل دخول بالفعل: يروح لصفحة النتائج على طول
  if (!this.authService.loggedIn()) {
    localStorage.setItem('pendingRecommendationParams', JSON.stringify(queryParams));
    this.router.navigate(['/login']);
  } else {
    this.router.navigate(['/recommendation-results'], { queryParams });
  }
}

// 🟢 بتبعت مواصفات مودال "Get Recommendation" كـ Lead جديد/تحديث لليد موجود على الـ CRM
// شغالة في الخلفية بس - مبتأثرش على تنقل المستخدم لصفحة النتائج
private submitRecommendationToCrm(
  f: { cities: string[]; listingTypes: string[]; propertyTypes: string[]; minRooms: string; maxRooms: string; minBathrooms: string; maxBathrooms: string; },
  minBudget?: string, maxBudget?: string
) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // 🟢 AuthModel بيرجع "username" بس (مفيش fullName ولا firstName/lastName) - كان بيفشل دايمًا ويرجع لـ "Website Client"
  const fullName = user.username || 'Website Client';
  const phoneNumber = user.phoneNumber || user.phone || '';
  if (!phoneNumber) return; // من غير رقم موبايل مقدرش أعمل/أحدث Lead

  const dto: RecommendationLeadDto = {
    fullName,
    phoneNumber,
    email: user.email || undefined,
    cities: f.cities,
    listingTypes: f.listingTypes,
    propertyTypes: f.propertyTypes,
    minRooms: f.minRooms ? Number(f.minRooms) : null,
    maxRooms: f.maxRooms ? Number(f.maxRooms) : null,
    minBathrooms: f.minBathrooms ? Number(f.minBathrooms) : null,
    maxBathrooms: f.maxBathrooms ? Number(f.maxBathrooms) : null,
    minBudget: minBudget ? Number(minBudget) : null,
    maxBudget: maxBudget ? Number(maxBudget) : null,
  };

  this.crmService.submitRecommendationLead(dto).subscribe({
    error: (err) => console.error('Failed to sync recommendation request to CRM', err)
  });
}

loadBlogs() {
  this.blogService.getAll().subscribe({
    next: (data: any[]) => {
      // بنعرض البلوجز المنشورة بس
      this.blogs.set(data.filter(b => b.isPublished));
    },
    error: () => {}
  });
}

// 🟢 المقالات (Articles) - بتظهر تحت Recommended to Visit مباشرة
loadArticles() {
  this.articleService.getPublished().subscribe({
    next: (data: any[]) => this.articles.set(data || []),
    error: () => {}
  });
}

getArticleThumbnail(article: any): string {
  const raw = article?.coverImageUrl || article?.imageUrl || article?.thumbnailUrl || article?.coverImage;
  return raw ? this.articleService.getImageUrl(raw) : '';
}

goToArticle(article: any): void {
  const slug = this.articleService.generateSlug(article?.title);
  if (slug) {
    this.router.navigate(['/blogs', article.id, slug]);
  } else {
    this.router.navigate(['/blogs', article.id]);
  }
}

loadLaunches() {
  this.launchService.getAll().subscribe({
    next: (data: any[]) => {
      // بنعرض اللانشز المنشورة بس
      this.launches.set(data.filter(l => l.isPublished));
    },
    error: () => {}
  });
}

// 🟢 البانرات الثابتة اللي الأدمن حددها ورتبها - Array واحد بترتيب الأدمن
loadHomeSectionBanners() {
  this.adminService.getHomeSectionBanners().subscribe({
    next: (data: any[]) => {
      this.homeSectionBanners.set([...(data || [])].sort((a, b) => a.displayOrder - b.displayOrder));
    },
    error: () => {}
  });
}

// 🟢 بتحدد الرابط/الأكشن المناسب لكل بانر حسب الـ key بتاعه (بيدعم أكتر من مفتاح لنفس الرابط، زي add-property و add-property-2)
// 🟢 بترجع بانر معين حسب الـ key بتاعه عشان نوزعهم في أماكن مختلفة في الصفحة (بدل ما يبقوا كلهم مجمعين مكان واحد)
getBanner(key: string): any {
  return this.homeSectionBanners().find(b => b.key === key) || null;
}

onBannerClick(key: string): void {
  if (key === 'explore-home') {
    this.router.navigate(['/explore-home']);
  } else if (key === 'add-property' || key === 'add-property-2') {
    this.router.navigate(['/add-your-property']);
  } else if (key === 'compare') {
    this.router.navigate(['/compare']);
  } else if (key === 'price-range') {
    this.router.navigate(['/price-per-meter-search']);
  } else if (key === 'recommendation') {
    this.onRecommendationBannerClick();
  }
}

// 🟢 بدل ما كنا بنبني الليست من object ثابت، دلوقتي بنجيبها لايف من الداتا بيز حسب المدينة المختارة
// 🟢 بتحدّث currentListingType فورًا لحظة اختيار Listing Type (بدل ما تتحدث بس بعد الضغط على Search)
// عشان حقل Project Name (اللي بيظهر بس مع Primary/Resale Project) يظهر فورًا زي ما المفروض
onListingTypeChange(value: string) {
  const listingTypeMap: any = { 'Resale': '0', 'Rent': '1', 'Primary': '2', 'ResaleProject': '3' };
  this.currentListingType = value ? (listingTypeMap[value] ?? value) : null;
}

updateProjectsList(cityId: any) {
    this.loadRegionsAndProjects(cityId);
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



  // 🟢 بتحوّل أي شكل بيوصل بيه فلتر نوع الإعلان (رقم، نص رقم، أو اسم زي 'Resale') لكود رقمي موحّد (0-3)، أو null لو مفيش فلتر أصلاً
  private resolveListingTypeCode(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const nameMap: Record<string, number> = { Resale: 0, Rent: 1, Primary: 2, ResaleProject: 3 };
    if (typeof value === 'string' && nameMap[value] !== undefined) return nameMap[value];
    const n = Number(value);
    return isNaN(n) ? null : n;
  }

  private updateNoResultsMessage(filters: any) {
    if (!this.anyResultsFound()) {
      if (filters.brokerId || filters.brokerName)
        this.message.set("This agent hasn't listed any properties yet.");
      else
        this.message.set("No properties match your search criteria.");
    } else {
      this.message.set('');
    }
  }

  // 🟢 بتجيب صفحة واحدة من نوع إعلان معين (Resale/Rent/Primary/ResaleProject) وتحدّث الـ signals بتاعته بس
  private fetchCategoryPage(listingTypeCode: number, filters: any, page: number, append: boolean, onDone?: () => void) {
    const state = this.categoryState[listingTypeCode];
    if (!state) { onDone?.(); return; }

    if (append) this.categoryState[listingTypeCode].loadingMore.set(true);

    // تنظيف الفلاتر من القيم الفارغة أو null قبل الإرسال
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v != null && v !== "" && v !== "null")
    );

    const apiFilters: any = { ...cleanFilters, listingType: listingTypeCode, pageNumber: page, pageSize: this.pageSize };

    if (apiFilters['searchTerm']) {
      apiFilters['searchTerm'] = this.getSmartSearchTerm(apiFilters['searchTerm'] as string);
    }
    if (apiFilters['projectName']) {
      apiFilters['projectName'] = this.getSmartSearchTerm(apiFilters['projectName'] as string);
    }

    this.propertyService.getProperties(apiFilters).subscribe({
      next: (response: any) => {
        state.loadingMore.set(false);
        const data = response?.data ?? [];
        const total = response?.totalCount ?? data.length;
        state.props.update(prev => append ? [...prev, ...data] : data);
        state.total.set(total);
        onDone?.();
      },
      error: (err) => {
        state.loadingMore.set(false);
        console.error(err);
        onDone?.();
      }
    });
  }

  loadProperties(filters: any = {}, append: boolean = false) {
    if (!append) {
      this.isLoading.set(true);
      this.lastFilters = filters;
    }

    const explicitCode = this.resolveListingTypeCode(filters.listingType);

    if (explicitCode !== null) {
      // 🟢 المستخدم فلتر بنوع إعلان معين بنفسه (من الناف بار مثلاً) - نجيب النوع ده بس
      // ونصفّر باقي الأنواع عشان أقسامهم متفضلش شايلة نتايج قديمة من قبل الفلترة
      if (!append) {
        Object.keys(this.categoryState).forEach(codeStr => {
          const code = Number(codeStr);
          const state = this.categoryState[code];
          if (code !== explicitCode) {
            state.props.set([]);
            state.total.set(0);
          }
          state.page.set(1);
        });
      }
      this.fetchCategoryPage(explicitCode, filters, this.categoryState[explicitCode].page(), append, () => {
        this.isLoading.set(false);
        this.updateNoResultsMessage(filters);
      });
      return;
    }

    // 🟢 مفيش فلتر بنوع معين - كل الأنواع بتتحمل مع بعض، كل واحد بصفحته وزراره لوحده
    const codes = Object.keys(this.categoryState).map(Number);
    if (!append) {
      codes.forEach(code => this.categoryState[code].page.set(1));
    }

    let remaining = codes.length;
    codes.forEach(code => {
      this.fetchCategoryPage(code, filters, this.categoryState[code].page(), append, () => {
        remaining--;
        if (remaining === 0) {
          this.isLoading.set(false);
          this.updateNoResultsMessage(filters);
        }
      });
    });
  }

  // 🟢 بتحمّل صفحة إضافية من نوع إعلان معين بس - الأنواع التانية متتأثرش خالص
  loadMoreCategory(listingTypeCode: number) {
    const state = this.categoryState[listingTypeCode];
    if (!state) return;
    if (state.loadingMore() || state.props().length >= state.total()) return;
    const nextPage = state.page() + 1;
    state.page.set(nextPage);
    this.fetchCategoryPage(listingTypeCode, this.lastFilters, nextPage, true);
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
  formatPrice(event: any) {
  const input = event.target;
  const raw = input.value.replace(/[^0-9]/g, '');
  input.value = raw ? Number(raw).toLocaleString('en-US') : '';
}

  
 onSearch(params: any) {

  const listingTypeMap: any = {
    'Resale': 0,
    'Rent': 1,
    'Primary': 2,
    'ResaleProject': 3
  };

  const propertyTypeMap: any = {
    'Apartment': 0,
    'Villa': 1,
    'Shop': 2,
    'Office': 3,
    'Chalet': 4,
    'FullFloor': 5
  };

  const rawType = params.listingType;
  const resolvedType = rawType ? (listingTypeMap[rawType] ?? rawType) : null;

  const rawPropertyType = params.propertyType;
  const resolvedPropertyType = rawPropertyType ? (propertyTypeMap[rawPropertyType] ?? rawPropertyType) : null;

  const filters = {
    searchTerm: params.searchTerm || null,
    city: params.city || null,
    region: params.region || null,
    minPrice: params.minPrice ? params.minPrice.replace(/,/g, '') : null,
    maxPrice: params.maxPrice ? params.maxPrice.replace(/,/g, '') : null,
    minPricePerMeter: params.minPricePerMeter ? params.minPricePerMeter.replace(/,/g, '') : null,
    maxPricePerMeter: params.maxPricePerMeter ? params.maxPricePerMeter.replace(/,/g, '') : null,
    listingType: resolvedType,
    propertyType: resolvedPropertyType,
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

  // 🟢 لازم نبعت أرقام فعلية (مش نصوص) للـ log-search، لأن الـ DTO في الباك اند int? وبيرفض النصوص
  const toNum = (v: any): number | null => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  const searchLogPayload = {
    searchTerm: filters.searchTerm,
    projectName: filters.projectName,
    city: toNum(filters.city),
    propertyType: toNum(filters.propertyType),
    listingType: toNum(filters.listingType),
    minPrice: toNum(filters.minPrice),
    maxPrice: toNum(filters.maxPrice),
    minPricePerMeter: toNum(filters.minPricePerMeter),
    maxPricePerMeter: toNum(filters.maxPricePerMeter),
    minRooms: toNum(filters.minRooms),
    maxRooms: toNum(filters.maxRooms),
    minBathrooms: toNum(filters.minBathrooms),
    maxBathrooms: toNum(filters.maxBathrooms),
    minFloor: toNum(filters.minFloor),
    maxFloor: toNum(filters.maxFloor)
  };

  this.adminService.logSearch(searchLogPayload).subscribe({ error: () => {} });
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

// ===== "Need Expert Advice?" form =====
expertName: string = '';
expertLocation: string = '';
expertPhone: string = '';
expertMessage: string = '';
expertFormError = signal<string>('');

submitExpertAdvice() {
  if (!this.expertName.trim() || !this.expertLocation || !this.expertPhone.trim()) {
    this.expertFormError.set('Please fill in your name, location and phone number.');
    return;
  }
  this.expertFormError.set('');

  if (!this.adminPhone()) return;
  let phone = this.adminPhone().replace(/\D/g, '');
  if (phone.startsWith('0')) phone = '2' + phone;

  const msg = encodeURIComponent(
    `Hello, I need expert advice.\nName: ${this.expertName}\nPreferred Location: ${this.expertLocation}\nPhone: ${this.expertPhone}\nMessage: ${this.expertMessage || 'N/A'}`
  );
  window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');

  // تصفير الفورم بعد الإرسال
  this.expertName = '';
  this.expertLocation = '';
  this.expertPhone = '';
  this.expertMessage = '';
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

addToCompare(propertyId: number) {
  // 1. نجيب الـ IDs القديمة من الـ URL أو الـ LocalStorage
  // الأسهل: نمرر الـ IDs في الـ URL
  const currentUrl = this.router.url;
  // لو المستخدم في صفحة المقارنة بالفعل، نضيف الـ ID الجديد
  if (currentUrl.includes('/compare/')) {
    const ids = currentUrl.split('/').pop()?.split(',') || [];
    if (!ids.includes(propertyId.toString())) {
       ids.push(propertyId.toString());
       this.router.navigate(['/compare', ids.join(',')]);
    }
  } else {
    // لو من الهوم، نبدأ مقارنة جديدة
    this.router.navigate(['/compare', propertyId]);
  }
}

getBlogImageUrl(filename: string): string {
  if (!filename) return '';
  return this.blogService.getImageUrl(filename);
}

getBlogThumbnail(blog: any): string {
  // لو في cover image نستخدمه
  if (blog.coverImageUrl) return this.blogService.getImageUrl(blog.coverImageUrl);
  // fallback: أول صورة من الـ sliderImages
  if (blog.sliderImages) {
    const first = blog.sliderImages.split('|').find((s: string) => s.trim());
    if (first) return first.trim();
  }
  return '';
}

goToBlog(id: number) {
  this.router.navigate(['/blog', id]);
}

// رقم الأدمن ثابت في السيستم (نفس الرقم المستخدم في صفحة تفاصيل المشروع)
private readonly BLOG_ADMIN_PHONE = '01509064020';

// Download Brochure → بيفتح واتساب الأدمن باستفسار عن المشروع + لينكه
sendBlogInquiry(blog: any, event: Event): void {
  event.stopPropagation(); // منع فتح صفحة البلوج لما يدوس على الزرار

  const cleaned = '20' + this.BLOG_ADMIN_PHONE.replace(/^0+/, '');
  const blogLink = this.blogService.getBlogLink(blog);

  const msg = encodeURIComponent(
    `Interested in project: ${blog.title}\n${blogLink}`
  );

  window.open(`https://wa.me/${cleaned}?text=${msg}`, '_blank');
}

getLaunchImageUrl(filename: string): string {
  if (!filename) return '';
  return this.launchService.getImageUrl(filename);
}

getLaunchThumbnail(launch: any): string {
  // لو في cover image نستخدمه
  if (launch.coverImageUrl) return this.launchService.getImageUrl(launch.coverImageUrl);
  // fallback: أول صورة من الـ sliderImages
  if (launch.sliderImages) {
    const first = launch.sliderImages.split('|').find((s: string) => s.trim());
    if (first) return first.trim();
  }
  return '';
}

// "Delivery in {year}" — بتستخدم الـ helper الجاهزة في LaunchService
getLaunchDeliveryLabel(launch: any): string {
  return this.launchService.getDeliveryLabel(launch);
}

goToLaunch(id: number) {
  this.router.navigate(['/launch', id]);
}

// 🟢 سكرول أفقي بأسهم يمين وشمال لأقسام Projects / Launches / Hot Deals / الوحدات
scrollH(container: HTMLElement, dir: number) {
  if (!container) return;
  const amount = container.clientWidth * 0.8 * dir;
  container.scrollBy({ left: amount, behavior: 'smooth' });
}

// رقم الأدمن ثابت في السيستم (نفس الرقم المستخدم في صفحة تفاصيل اللانش)
private readonly LAUNCH_ADMIN_PHONE = '01509064020';

// Download Brochure → بيفتح واتساب الأدمن باستفسار عن اللانش + لينكه
sendLaunchInquiry(launch: any, event: Event): void {
  event.stopPropagation(); // منع فتح صفحة اللانش لما يدوس على الزرار

  const cleaned = '20' + this.LAUNCH_ADMIN_PHONE.replace(/^0+/, '');
  const launchLink = this.launchService.getLaunchLink(launch);

  const msg = encodeURIComponent(
    `Interested in launch: ${launch.title}\n${launchLink}`
  );

  window.open(`https://wa.me/${cleaned}?text=${msg}`, '_blank');
}
}