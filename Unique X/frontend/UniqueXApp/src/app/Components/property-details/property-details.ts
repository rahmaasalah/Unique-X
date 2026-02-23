import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PropertyService } from '../../Services/property';
import { Property } from '../../Models/property.model';
import { AuthService } from '../../Services/auth';
import { Router } from '@angular/router';

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
  private router = inject(Router);
  
  property = signal<Property | null>(null);
  currentSlideIndex = signal(0);
  isDescriptionExpanded = signal(false);


  ngOnInit(): void {
    // الحصول على الـ ID من الرابط
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.propertyService.getPropertyById(id).subscribe({
        next: (data) => this.property.set(data),
        error: (err) => console.error(err)

        
      });
    }
  }

  toggleDescription() {
  this.isDescriptionExpanded.update(val => !val);
}

handleContact(event: Event, type: 'call' | 'whatsapp') {
  event.preventDefault(); // منع المتصفح من فتح أي روابط تلقائياً

  if (!this.authService.loggedIn()) {
    this.router.navigate(['/login']); // لو مش مسجل واديه للوجين ✅
    return;
  }

  const phone = this.property()?.brokerPhone;
  if (!phone) return;

  if (type === 'call') {
    window.location.href = 'tel:' + phone; // فتح الاتصال للمسجلين فقط
  } else {
    const link = this.getWhatsAppLink(phone);
    window.open(link, '_blank'); // فتح واتساب للمسجلين فقط
  }
}

  getWhatsAppLink(phone: string): string {
  if (!phone) return '#';

  let cleanedPhone = phone.replace(/\D/g, '');
  if (cleanedPhone.startsWith('0')) {
    cleanedPhone = '2' + cleanedPhone;
  }

  const message = encodeURIComponent(`Hello, I'm interested in your property: ${this.property()?.code}`);
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

  
}