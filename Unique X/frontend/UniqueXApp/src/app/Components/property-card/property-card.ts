import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Property } from '../../Models/property.model';
import { RouterModule } from '@angular/router';
import { PropertyService } from '../../Services/property';
import { AlertService } from '../../Services/alert';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth';
import { AdminService } from '../../Services/admin';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { CrmService } from '../../Services/crm.services';
import { CurrencyService } from '../../Services/currency.service';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './property-card.html',
  styleUrl: './property-card.css'
})
export class PropertyCardComponent {
  @Input() property!: Property;
  @Output() removedFromWishlist = new EventEmitter<number>();

  isLiked: boolean = false;
  isShortlisted: boolean = false;
  isVisitListed: boolean = false;

  // "Visit Now" modal state
  visitDateValue: string = '';
  visitNotes: string = '';
  isSubmittingVisit = signal(false);

  private propertyService = inject(PropertyService);
  private alertService = inject(AlertService);
  public authService = inject(AuthService);
  private router = inject(Router);
  private adminService = inject(AdminService);
  private gaService = inject(GoogleAnalyticsService);
  private crmService = inject(CrmService);
  currencyService = inject(CurrencyService);

  ngOnInit() {
    this.isLiked = this.property.isFavorite;
    this.isShortlisted = this.property.isShortlisted ?? false;
    this.isVisitListed = this.property.isVisitListed ?? false;
    if (this.router.url.includes('wishlist')) {
      this.isLiked = true;
    }
    if (this.router.url.includes('shortlist')) {
      this.isShortlisted = true;
    }
    if (this.router.url.includes('visit-list')) {
      this.isVisitListed = true;
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

  // 🟢 خطة الدفع الربع سنوية (لو موجودة) — بتُستخدم لعرض "القسط الربع سنوي / عدد السنين" تحت السعر
  // ملحوظة: حقل QuarterInstallment في الموديل هو دايمًا قيمة القسط الربع سنوي بغض النظر عن قيمة Frequency،
  // فبناخد أول خطة دفع موجودة للوحدة من غير ما نفلتر على frequency
  get quarterlyPlan(): any {
    const plans = this.property.paymentPlans;
    if (!plans || !plans.length) return null;
    return plans[0];
  }

  getWhatsAppLink(phone: string, code: string, id: number): string {
    if (!phone) return '#';
    let cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.startsWith('0')) {
      cleanedPhone = '20' + cleanedPhone.replace(/^0+/, '');
    }
    const propertyUrl = `${window.location.origin}/property-details/${this.property.id}`;
    const message = encodeURIComponent(`Hello, I'm interested in property code: #${code}\nLink: ${propertyUrl}`);
    return `https://wa.me/${cleanedPhone}?text=${message}`;
  }

  handleContact(event: Event, type: 'whatsapp' | 'call') {
    event.stopPropagation();
    event.preventDefault();

    if (!this.authService.loggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.adminService.trackAction(type === 'whatsapp' ? 'WhatsAppClick' : 'CallClick', this.property.id).subscribe();
    this.gaService.event('contact_click', type, this.property.id.toString());

    const userString = localStorage.getItem('user');
    if (userString) {
      const clientData = JSON.parse(userString);
      const isClient = clientData.roles && clientData.roles.includes('Client');

      if (isClient) {
        const inquiryData = {
          clientName: clientData.username || 'Website Client',
          clientPhone: clientData.phoneNumber || '0000000000',
          clientEmail: clientData.email,
          propertyId: this.property.id,
          message: `Client clicked the [${type.toUpperCase()}] button from the property card.`
        };

        this.crmService.sendWebsiteInquiry(inquiryData).subscribe({
          next: () => console.log('Lead saved to CRM successfully in background.'),
          error: (err) => console.error('Failed to save lead to CRM', err)
        });
      }
    }

    const phone = this.property.brokerPhone;
    if (type === 'call') {
      window.location.href = 'tel:' + phone;
    } else {
      window.open(this.getWhatsAppLink(phone, this.property.code, this.property.id), '_blank');
    }
  }

  // 🟢 زرار "Visit Now" - بيفتح مودال بسيط لاختيار الميعاد (لكلاينت أو بروكر، لازم يكون مسجل دخول)
  openVisitModal(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    if (!this.authService.loggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.visitDateValue = '';
    this.visitNotes = '';

    const bootstrap = (window as any).bootstrap;
    const modalEl = document.getElementById(`visitNowModal-${this.property.id}`);
    if (modalEl && bootstrap) {
      new bootstrap.Modal(modalEl).show();
    }
  }

  submitVisitRequest(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    if (!this.visitDateValue) return;

    const userString = localStorage.getItem('user');
    if (!userString) { this.router.navigate(['/login']); return; }
    const userData = JSON.parse(userString);

    this.isSubmittingVisit.set(true);

    this.crmService.requestVisit({
      propertyId: this.property.id,
      clientName: userData.username || userData.firstName + ' ' + userData.lastName || 'Website Client',
      clientPhone: userData.phoneNumber || '0000000000',
      clientEmail: userData.email,
      visitDate: this.visitDateValue,
      visitType: 'Client',
      notes: this.visitNotes
    }).subscribe({
      next: () => {
        this.isSubmittingVisit.set(false);
        this.alertService.success('Visit request sent! The broker will confirm it with you soon.');
        document.getElementById(`closeVisitNowModal-${this.property.id}`)?.click();
      },
      error: () => {
        this.isSubmittingVisit.set(false);
        this.alertService.error('Failed to send visit request. Please try again.');
      }
    });
  }

  onToggleWishlist(event: Event) {
    event.stopPropagation();
    if (!this.authService.loggedIn()) { this.router.navigate(['/login']); return; }

    this.isLiked = !this.isLiked;
    this.property.isFavorite = this.isLiked;

    if (!this.isLiked && this.router.url.includes('wishlist')) {
      this.removedFromWishlist.emit(this.property.id);
    }

    this.propertyService.toggleWishlist(this.property.id).subscribe({
      next: (res: any) => {
        const actualState = res.isFavorite ?? res.IsFavorite;
        this.isLiked = actualState;
        this.property.isFavorite = actualState;
      },
      error: () => {
        this.isLiked = !this.isLiked;
        this.property.isFavorite = this.isLiked;
      }
    });
  }

  onToggleShortlist(event: Event) {
    event.stopPropagation();
    if (!this.authService.loggedIn()) { this.router.navigate(['/login']); return; }

    this.isShortlisted = !this.isShortlisted;

    this.propertyService.toggleShortlist(this.property.id).subscribe({
      next: (res: any) => {
        this.isShortlisted = res.isShortlisted ?? res.IsShortlisted;
      },
      error: () => {
        this.isShortlisted = !this.isShortlisted;
      }
    });
  }

  onToggleVisitList(event: Event) {
    event.stopPropagation();
    if (!this.authService.loggedIn()) { this.router.navigate(['/login']); return; }

    this.isVisitListed = !this.isVisitListed;

    this.propertyService.toggleVisitList(this.property.id).subscribe({
      next: (res: any) => {
        this.isVisitListed = res.isVisitListed ?? res.IsVisitListed;
      },
      error: () => {
        this.isVisitListed = !this.isVisitListed;
      }
    });
  }

  // 🟢 زرار "Compare" - بيبدأ مقارنة جديدة بالوحدة دي، أو يضيفها لمقارنة شغالة بالفعل
  onCompareClick(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    const compareMode = localStorage.getItem('compare_mode');

    if (compareMode === 'add_to_existing') {
      const existingIds = localStorage.getItem('compare_existing_ids');
      localStorage.removeItem('compare_mode');
      localStorage.removeItem('compare_existing_ids');
      const newIds = existingIds
        ? `${existingIds},${this.property.id}`
        : `${this.property.id}`;
      this.router.navigate(['/compare', newIds]);
    } else {
      this.router.navigate(['/compare', this.property.id]);
    }
  }

  onCardClick() {
    const compareMode = localStorage.getItem('compare_mode');

    if (compareMode === 'active') {
      const compareId = localStorage.getItem('compare_prop_1');
      if (Number(compareId) === this.property.id) {
        this.alertService.error('Please select a DIFFERENT property to compare.');
        return;
      }
      localStorage.removeItem('compare_mode');
      localStorage.removeItem('compare_prop_1');
      this.router.navigate(['/compare', `${compareId},${this.property.id}`]);

    } else if (compareMode === 'add_to_existing') {
      const existingIds = localStorage.getItem('compare_existing_ids');
      localStorage.removeItem('compare_mode');
      localStorage.removeItem('compare_existing_ids');
      const newIds = existingIds
        ? `${existingIds},${this.property.id}`
        : `${this.property.id}`;
      this.router.navigate(['/compare', newIds]);

    } else {
      this.router.navigate(['/property-details', this.property.id]);
    }
  }
}