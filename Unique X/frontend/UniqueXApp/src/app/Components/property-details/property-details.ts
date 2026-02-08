import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PropertyService } from '../../Services/property';
import { Property } from '../../Models/property.model';

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

  getWhatsAppLink(phone: string): string {
  if (!phone) return '#';

  // 1. مسح أي حروف أو مسافات، نسيب الأرقام فقط
  let cleanedPhone = phone.replace(/\D/g, '');

  // 2. لو الرقم بيبدأ بـ 0 (زي 012...)، نضيف كود مصر 2 في الأول
  if (cleanedPhone.startsWith('0')) {
    cleanedPhone = '2' + cleanedPhone;
  }

  // 3. نرجع الرابط مع رسالة ترحيب اختيارية (عشان البروكر يعرف العميل جاي من انهي شقة)
  const message = encodeURIComponent(`Hello, I'm interested in your property: ${this.property()?.title}`);
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