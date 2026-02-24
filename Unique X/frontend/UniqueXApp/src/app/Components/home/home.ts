import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'; // مهم جداً للأوامر مثل *ngIf
import { PropertyCardComponent } from '../property-card/property-card'; // مهم لكي يتعرف على الكارت
import { PropertyService } from '../../Services/property';
import { Property } from '../../Models/property.model';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth';
import { AdminService } from '../../Services/admin';


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
/* ads = [
  { 
    image: 'https://th.bing.com/th/id/R.703c1580dd8de27f32ef89574aff3adb?rik=zOsxkXRIpkC%2fZw&riu=http%3a%2f%2fwww.justinhavre.com%2fuploads%2fagent-1%2fmultiple-offers-header.png&ehk=gKELJJ1d1MFgnS%2fDMdafCRozl%2fEjKDbnAk5O6qsFZvM%3d&risl=&pid=ImgRaw&r=0', 
    message: 'Hello, I am interested in the Yearly Luxury Offers!' 
  },
  { 
    image: 'https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/db483d201999007.667e38210b0b8.png', 
    message: 'I want to know more about the New Projects Installment plans.' 
  },
  { 
    image: 'https://mir-s3-cdn-cf.behance.net/projects/404/2313f6165481709.Y3JvcCwxMjAwLDkzOCwwLDEzMA.png', 
    message: 'Interested in the Cash Discount for this month!' 
  }
]; */

  isLoading = signal<boolean>(false);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef); 
  constructor(private propertyService: PropertyService, 
    private router: Router, private activatedRoute: ActivatedRoute, private authService: AuthService,
  private adminService: AdminService) {}

  // تأكدي من عمل inject للـ ChangeDetectorRef فوق مع باقي الخدمات
//private cdr = inject(ChangeDetectorRef); 

ngOnInit(): void {
  // 1. مراقبة فلاتر البحث في الرابط
  this.route.queryParams.subscribe(params => {
    this.loadProperties(params);
  });

  // 2. سحب الإعلانات (Banners) من الباك اند
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
  const msg = encodeURIComponent("Hello, I have an inquiry regarding Unique X properties.");
  return `https://wa.me/${phone}?text=${msg}`;
}

// أضيفي هذه الدالة داخل كلاس HomeComponent في ملف home.ts

handleAdminContact(event: Event, type: 'whatsapp' | 'call') {
  event.preventDefault(); // منع المتصفح من فتح الرابط تلقائياً

  // 1. فحص هل المستخدم مسجل دخول؟
  if (!this.authService.loggedIn()) {
    // 2. توجيه لصفحة اللوجن لو مش مسجل
    this.router.navigate(['/login']);
    return;
  }

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