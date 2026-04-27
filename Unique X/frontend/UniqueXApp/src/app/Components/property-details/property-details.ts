import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PropertyService } from '../../Services/property';
import { Property } from '../../Models/property.model';
import { AuthService } from '../../Services/auth';
import { Router } from '@angular/router';
import { AdminService } from '../../Services/admin';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { AlertService } from '../../Services/alert';
import { Chart, registerables } from 'chart.js';
import { CrmService } from '../../Services/crm.services';
Chart.register(...registerables);

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './property-details.html',
  styleUrl: './property-details.css'
})
export class PropertyDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private propertyService = inject(PropertyService);
  public authService = inject(AuthService);
  public alertService = inject(AlertService);
  private router = inject(Router);
  private adminService = inject(AdminService);
  private location = inject(Location);
  private gaService = inject(GoogleAnalyticsService);
  chart: any;
  financialHistory = signal<any[]>([]);

  
  property = signal<Property | null>(null);
  currentSlideIndex = signal(0);
  isDescriptionExpanded = signal(false);


  private crmService = inject(CrmService);
  propertyId: number = 123; // (أكيد المتغير ده عندك بياخد رقم العقار الحالي)

  // الدالة دي هتتنفذ لما العميل يدوس على واتساب أو اتصال
  onContactClick(method: 'whatsapp' | 'call', brokerPhone: string) {
    
    // 1. نجيب بيانات العميل اللي فاتح دلوقتي
    const userString = localStorage.getItem('user');
    let isClient = false;
    let clientData: any = null;

    if (userString) {
      clientData = JSON.parse(userString);
      // نتأكد إن اللي فاتح ده عميل (مش بروكر بيشوف عقاره مثلاً)
      isClient = clientData.roles && clientData.roles.includes('Client');
    }

    // 2. لو هو عميل، نبعت بياناته للـ CRM في الخلفية بصمت!
    if (isClient && clientData) {
      const inquiryData = {
        clientName: clientData.username || 'Website Client',
        clientPhone: clientData.phoneNumber || '0000000000', 
        clientEmail: clientData.email,
        propertyId: this.propertyId,
        message: `Client clicked the [${method.toUpperCase()}] button from the website.` // رسالة توضح هو داس على إيه
      };

      // بنبعت الطلب ومش بنستنى الرد عشان مانعطلش العميل
      this.crmService.sendWebsiteInquiry(inquiryData).subscribe({
        next: () => console.log('Lead saved to CRM successfully in background.'),
        error: (err) => console.error('Failed to save lead', err)
      });
    }

    // 3. ننفذ الأكشن الطبيعي بتاع الزرار (يفتح واتساب أو يتصل)
    if (method === 'whatsapp') {
      const waMessage = encodeURIComponent(`Hello, I am interested in property ID: ${this.propertyId}`);
      window.open(`https://wa.me/${brokerPhone}?text=${waMessage}`, '_blank');
    } 
    else if (method === 'call') {
      window.location.href = `tel:${brokerPhone}`;
    }
  }



  ngOnInit(): void {
  const id = Number(this.route.snapshot.paramMap.get('id'));
  if (id) {
    this.propertyService.getPropertyById(id).subscribe({
      next: (data) => {
        this.property.set(data);
        
        // تجميع تفاصيل العقار الإنجليزية لعمل لينك احترافي (النوع + الحالة + المنطقة + الكود)
        // مثال: Apartment Resale Loran AR123
        const slugText = `${data.propertyType} ${data.listingType} ${data.region} ${data.code || ''}`;
        
        // تحويل النص للينك
        const slug = this.generateSlug(slugText);
        
        // تحديث اللينك في المتصفح
        const baseUrl = this.router.url.split('/')[1]; 
        this.location.replaceState(`/${baseUrl}/${data.id}/${slug}`);

        if (data.code) {
          this.propertyService.getFinancialHistory(data.code).subscribe({
            next: (history) => {
              if (history && history.length > 0) {
                // ترتيب السنين من الأقدم للأحدث
                history.sort((a, b) => a.year - b.year);
                this.financialHistory.set(history);
                
                // تأخير بسيط للسماح للـ HTML برسم الـ Canvas أولاً
                setTimeout(() => this.renderChart(history, data.listingType), 200);
              }
            }
          });
        }
      },
      error: (err) => console.error(err)
    });
  }
}

  // دالة لعمل اللينك بالإنجليزي فقط لضمان عدم ظهور رموز الـ %
generateSlug(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase() // تحويل الحروف لـ Small
    .replace(/\s+/g, '-') // استبدال المسافات بشرطة
    .replace(/[^a-z0-9\-]/g, '') // مسح أي حروف عربية أو رموز غريبة (الاحتفاظ بالإنجليزي والأرقام والشرط فقط)
    .replace(/-+/g, '-') // منع تكرار الشرطات المتتالية (مثال: --)
    .replace(/^-|-$/g, ''); // مسح أي شرطة في أول أو آخر اللينك
}

  toggleDescription() {
  this.isDescriptionExpanded.update(val => !val);
}

handleContact(event: Event, method: 'call' | 'whatsapp', brokerPhone: string) {
    event.preventDefault(); 

    // 👇 1. هنجيب العقار الحالي من السجنال
    const currentProp = this.property();
    if (!currentProp) return;

    // 2. نجيب بيانات العميل اللي فاتح دلوقتي
    const userString = localStorage.getItem('user');
    let isClient = false;
    let clientData: any = null;

    if (userString) {
      clientData = JSON.parse(userString);
      isClient = clientData.roles && clientData.roles.includes('Client');
    }

    // 3. لو هو عميل، نبعت بياناته للـ CRM في الخلفية بصمت!
    if (isClient && clientData) {
      const inquiryData = {
        clientName: clientData.username || 'Website Client',
        clientPhone: clientData.phoneNumber || '0000000000', 
        clientEmail: clientData.email,
        propertyId: currentProp.id, // 👈 صلحنا الإيرور الأول هنا
        message: `Client clicked the [${method.toUpperCase()}] button from the website.`
      };

      this.crmService.sendWebsiteInquiry(inquiryData).subscribe({
        next: () => console.log('Lead saved to CRM successfully in background.'),
        error: (err) => console.error('Failed to save lead to CRM', err)
      });
    }

    // 4. ننفذ الأكشن الطبيعي بتاع الزرار
    if (!brokerPhone) {
      console.warn('Broker phone number is not available.');
      return;
    }

    if (method === 'whatsapp') {
      // بنجيب لينك الصفحة الحالي
      const currentUrl = window.location.href;
      // بنجيب كود العقار (ولو مفيش كود بنحط الـ ID كبديل)
      const propCode = currentProp.code ? currentProp.code : currentProp.id;
      
      // بنجهز الرسالة بالشكل اللي طلبتيه بالظبط
      const waMessage = encodeURIComponent(`Hello, I'm interested in property code: #${propCode}\nLink: ${currentUrl}`);
      
      // فتح الواتساب
      window.open(`https://wa.me/${brokerPhone}?text=${waMessage}`, '_blank');
    } 
    else if (method === 'call') {
      window.location.href = `tel:${brokerPhone}`;
    }
  }

  getWhatsAppLink(phone: string): string {
  if (!phone) return '#';

  let cleanedPhone = phone.replace(/\D/g, '');
  if (cleanedPhone.startsWith('0')) {
    cleanedPhone = '2' + cleanedPhone;
  }
  const currentUrl = window.location.href;

  const message = encodeURIComponent(`Hello, I'm interested in your property: #${this.property()?.code}\nLink: ${currentUrl}`);
  return `https://wa.me/${cleanedPhone}?text=${message}`;
}

goToSlide(index: number) {
  const bootstrap = (window as any).bootstrap;
  const carouselElement = document.querySelector('#propertyCarousel');
  if (carouselElement && bootstrap) {
    const carousel = bootstrap.Carousel.getInstance(carouselElement) || new bootstrap.Carousel(carouselElement);
    carousel.to(index); // هذه الدالة تجعل الكاراسول يذهب للصورة رقم index
    this.currentSlideIndex.set(index);
  }
}

onSlideChange(event: any) {
  this.currentSlideIndex.set(event.to);
}

openGallery(index: number) {
  const bootstrap = (window as any).bootstrap;
  
  // 1. تشغيل المودال
  const modalElement = document.getElementById('fullGalleryModal');
  const modal = new bootstrap.Modal(modalElement);
  modal.show();

  // 2. توجيه الكاراسول للصورة المختارة
  setTimeout(() => {
    const carouselElement = document.getElementById('modalCarousel');
    const carousel = new bootstrap.Carousel(carouselElement);
    carousel.to(index);
  }, 200);
}

startCompare() {
    const prop = this.property();
    if (prop) {
      // 🟢 حفظ الـ ID في ذاكرة المتصفح عشان مننساهوش
      localStorage.setItem('compare_prop_1', prop.id.toString());
      this.alertService.success('Please select the second property from the home page to compare.');
      // 🟢 توجيه لصفحة الهوم
      this.router.navigate(['/home']);
    }
  }

  // 🟢 دالة رسم المنحنى البياني
  renderChart(history: any[], listingType: string) {
    const ctx = document.getElementById('financialChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    if (this.chart) this.chart.destroy(); // مسح الرسمة القديمة لو موجودة

    const years = history.map(h => h.year);
    const prices = history.map(h => h.price);
    const labelTitle = listingType === 'Rent' ? 'Rental Price Trend (EGP)' : 'Property Value Trend (EGP)';

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: years,
        datasets:[{
          label: labelTitle,
          data: prices,
          borderColor: '#ef3341', // لون بيتك الأحمر
          backgroundColor: 'rgba(239, 51, 65, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4, // بيخلي الخطوط انسيابية وناعمة
          pointBackgroundColor: '#fff',
          pointBorderColor: '#ef3341',
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: function(context) {
                return ' EGP ' + context.parsed.y.toLocaleString('en-US');
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: false } // عشان المنحنى ميبدأش من الصفر ويكون واقعي
        }
      }
    });
  }

  copyLink() {
  const currentUrl = window.location.href;
  navigator.clipboard.writeText(currentUrl).then(() => {
    this.alertService.success('Link copied successfully!');
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}

  
}