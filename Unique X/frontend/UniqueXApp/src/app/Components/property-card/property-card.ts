import { Component, Input, inject } from '@angular/core'; // تأكدي من وجود Input
import { CommonModule } from '@angular/common'; // مهم لاستخدام الـ Pipes مثل | number
import { Property } from '../../Models/property.model';
import { RouterModule } from '@angular/router'; 
import { PropertyService } from '../../Services/property';
import { AlertService } from '../../Services/alert';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth';
import { AdminService } from '../../Services/admin';
import { GoogleAnalyticsService } from 'ngx-google-analytics';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './property-card.html',
  styleUrl: './property-card.css'
})
export class PropertyCardComponent {
  @Input() property!: Property;
  isLiked: boolean = false; 
  private propertyService = inject(PropertyService);
  private alertService = inject(AlertService);
  public authService = inject(AuthService); 
  private router = inject(Router);
  private adminService = inject(AdminService);
  private gaService = inject(GoogleAnalyticsService);


   ngOnInit() {
  this.isLiked = this.property.isFavorite;
  if (this.router.url.includes('wishlist')) {
    this.isLiked = true;
  }
}

get displayRooms(): number {
    if (this.property.propertyType === 'Villa') {
      return (this.property.groundRooms || 0) + 
             (this.property.firstRooms || 0) + 
             (this.property.secondRooms || 0);
    }
    return this.property.rooms || 0;
  }

  get displayBaths(): number {
    if (this.property.propertyType === 'Villa') {
      return (this.property.groundBaths || 0) + 
             (this.property.firstBaths || 0) + 
             (this.property.secondBaths || 0);
    }
    return this.property.bathrooms || 0;
  }

getWhatsAppLink(phone: string, code: string): string {
  if (!phone) return '#';
  // تنظيف الرقم وإضافة كود مصر
  let cleanedPhone = phone.replace(/\D/g, '');
  if (cleanedPhone.startsWith('0')) {
    cleanedPhone = '2' + cleanedPhone;
  }
  // الرسالة تشمل كود العقار لسهولة التواصل
  const message = encodeURIComponent(`Hello, I'm interested in property code: #${code}`);
  return `https://wa.me/${cleanedPhone}?text=${message}`;
}

handleContact(event: Event, type: 'whatsapp' | 'call') {
  event.stopPropagation(); // منع فتح صفحة التفاصيل
  event.preventDefault();  // منع فتح الرابط لو مش مسجل

  if (!this.authService.loggedIn()) {
    this.router.navigate(['/login']); // حماية التواصل ✅
    return;
  }

  this.adminService.trackAction(type === 'whatsapp' ? 'WhatsAppClick' : 'CallClick', this.property.id).subscribe();
  this.gaService.event('contact_click', type, this.property.id.toString());

  const phone = this.property.brokerPhone;
  if (type === 'call') {
    window.location.href = 'tel:' + phone;
  } else {
    window.open(this.getWhatsAppLink(phone, this.property.code), '_blank');
  }
}


onToggleWishlist(event: Event) {
  event.stopPropagation();

  if (!this.authService.loggedIn()) {
    this.router.navigate(['/login']); // لو مش مسجل واديه للوجين فوراً ✅
    return;
  }
  
  this.propertyService.toggleWishlist(this.property.id).subscribe({
      next: (res: any) => {
        this.isLiked = res.isFavorite; 
        
        this.property.isFavorite = res.isFavorite;
      },
      error: (err) => {
        console.error('Login required or server error');
      }
    });
  }
}