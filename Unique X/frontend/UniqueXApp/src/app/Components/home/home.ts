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
  availableProjects: string[] =[];

  projectsMapping: any = {
    1: { 'any':['Twin towers', 'Valore smouha', 'Valore antoniadis', 'East towers'] },
    2: { 'any':[ 'Palm hills', 'Sawari', 'The One', 'Muruj', 'Alex west', 'Skyline', 'Crystal towers', 'Grand view', 'Twin towers', 'Valore smouha', 'Valore antoniadis', 'East towers', 'Fayroza smouha', 'Saraya gardens', 'Veranda', 'Jackranda', 'Jara', 'Oria city', 'El safwa city', 'Vida', 'Abha hayat', 'Pharma city', 'Jewar', 'Ouruba royals', 'Soly vie', 'San Stefano royals', 'Malaaz' ] },
    3: {
      'Ras Al Hekma':['Ramla', 'Azha', 'Naia Bay', 'El Masyaf', 'Fouka Bay', 'Remal', 'Hacienda West', 'Seashore', 'Ogami', 'Seashell Playa', 'La Vista Ras El Hikma', 'Caesar', 'Koun', 'Caesar Bay', 'Lyv', 'Mountain View Ras El Hikma', 'Solare', 'Swan Lake', 'Seashell Ras El Hikma', 'The Med', 'Gaia', 'June', 'Direction White', 'Cali Coast', 'Hacienda Waters', 'Mar Bay', 'Jefaira', 'Sea View', 'Safia', 'Salt', 'Azzar Islands', 'Saada North Coast', 'Katamya Coast', 'Soul', 'Lvls'],
      'Al-Dabaa':['Dose', 'The Water Way', 'Seazen', 'La Vista Bay', 'La Vista Bay East', 'Hacienda Blue', 'La Sirena', 'D bay', 'South Med'],
      'Sidi Abdulrahman':['Telal', 'Hacienda Red', 'Hacienda White', 'Amwaj', 'Q North', 'SeaShell', 'Bianchi Ilios', 'Shamasi', 'Masaya', 'Location', 'Stella Heights', 'Alura', 'La vista Cascada', 'Maraasi', 'Stella', 'Diplo 3', 'Haceinda Bay'],
      'Ghazala Bay':['Playa Ghazala', 'Ghazala Bay', 'Zoya'],
      'Al-Alamin':['Zahra', 'Crysta', 'Plage', 'Lagoons', 'Alma', 'IL Latini', 'Downtown', 'Plam Hills North Coast', 'Mazarine', 'Golf Porto Marina'],
      'sahel':['Viller', 'The Island', 'Marina 8', 'North Code', 'Wanas Master', 'London', 'Eko Mena', 'Bungalows', 'Layana', 'Glee']
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
    let projects = new Set<string>(); // استخدام Set لمنع التكرار

    if (cityId && cityId !== 'null' && cityId !== '') {
      // لو اختار مدينة معينة، نجيب مشاريعها بس
      const cityData = this.projectsMapping[Number(cityId)];
      if (cityData) {
        Object.values(cityData).forEach((arr: any) => {
          arr.forEach((p: string) => projects.add(p));
        });
      }
    } else {
      // لو مفيش مدينة، نلف على كل المدن وكل المناطق ونجيب كل المشاريع
      Object.values(this.projectsMapping).forEach((cityData: any) => {
        Object.values(cityData).forEach((arr: any) => {
          arr.forEach((p: string) => projects.add(p));
        });
      });
    }

    // تحويل الـ Set لمصفوفة وترتيبها أبجدياً لسهولة البحث
    this.availableProjects = Array.from(projects).sort();
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


  loadProperties(filters: any = {}) {
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