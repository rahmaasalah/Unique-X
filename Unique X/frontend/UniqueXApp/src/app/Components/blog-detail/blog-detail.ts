import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BlogService } from '../../Services/blog.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './blog-detail.html'
})
export class BlogDetailComponent implements OnInit {
  blogService = inject(BlogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  blog = signal<any>(null);
  isLoading = signal(true);
  modalImageUrl = signal<string>('');
  resaleUnits = signal<any[]>([]);
  resaleUnitsLoading = signal(false);
  primaryUnits = signal<any[]>([]);
  primaryUnitsLoading = signal(false);

  // Main slider
  activeSlide = signal(0);

  // Gallery lightbox
  galleryOpen = signal(false);
  galleryIndex = signal(0);

  // Map modal
  mapModalOpen = signal(false);

  // Contact form
  contactName = '';
  contactPhone = '';
  contactMessage = '';

  sliderImages = computed(() => this.blogService.getSliderImages(this.blog()));
  paymentPlans = computed(() => this.blogService.parseJson(this.blog()?.paymentPlansJson));
  articleSections = computed(() => this.blogService.parseJson(this.blog()?.articleSectionsJson));
  faqs = computed(() => this.blogService.parseJson(this.blog()?.faqsJson));
  resaleUnitIds = computed(() => this.blogService.getResaleUnitIds(this.blog()));
  primaryUnitIds = computed(() => this.blogService.getPrimaryUnitIds(this.blog()));

  // بنعالج الـ mapEmbedUrl عشان نشيل منه الـ iframe لو موجود
  safeMapUrl(): SafeResourceUrl {
    let url = this.blog()?.mapEmbedUrl || '';
    // لو بعتوا iframe كامل نشيل منه الـ src بس
    const srcMatch = url.match(/src="([^"]+)"/);
    if (srcMatch) url = srcMatch[1];
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.blogService.getById(id).subscribe({
      next: (data) => {
        this.blog.set(data);
        this.isLoading.set(false);
        this.loadUnits(this.resaleUnitIds(), this.resaleUnits, this.resaleUnitsLoading);
        this.loadUnits(this.primaryUnitIds(), this.primaryUnits, this.primaryUnitsLoading);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadUnits(ids: number[], target: any, loadingFlag: any) {
    if (!ids.length) return;
    loadingFlag.set(true);
    const requests = ids.map((id: number) =>
      this.http.get<any>(`${environment.apiUrl}/Properties/${id}`)
    );
    Promise.all(requests.map((r: any) => r.toPromise()))
      .then(results => {
        target.set(results.filter(Boolean));
        loadingFlag.set(false);
      })
      .catch(() => loadingFlag.set(false));
  }

  // Main slider controls
  prevSlide() {
    const len = this.sliderImages().length;
    this.activeSlide.set((this.activeSlide() - 1 + len) % len);
  }

  nextSlide() {
    const len = this.sliderImages().length;
    this.activeSlide.set((this.activeSlide() + 1) % len);
  }

  // Gallery lightbox
  openGallery(index: number) {
    this.galleryIndex.set(index);
    this.galleryOpen.set(true);
  }

  closeGallery() {
    this.galleryOpen.set(false);
  }

  prevGallery() {
    const len = this.sliderImages().length;
    this.galleryIndex.set((this.galleryIndex() - 1 + len) % len);
  }

  nextGallery() {
    const len = this.sliderImages().length;
    this.galleryIndex.set((this.galleryIndex() + 1) % len);
  }

  // Image modal (for buttons)
  openImageModal(url: string) {
    if (url) this.modalImageUrl.set(url);
  }

  closeModal() {
    this.modalImageUrl.set('');
  }

  // رقم الأدمن ثابت في السيستم
  private readonly ADMIN_PHONE = '01509064020';

  getAdminPhone(type: 'tel' | 'wa'): string {
    if (type === 'tel') return `tel:${this.ADMIN_PHONE}`;
    // كود مصر هو 20 - بنشيل الصفر الأول ونحط 20 قبله
    const cleaned = '20' + this.ADMIN_PHONE.replace(/^0+/, '');
    return `https://wa.me/${cleaned}`;
  }

  // WhatsApp link للبروكر مع كود الوحدة ورابط الصفحة
  getBrokerWhatsAppLink(phone: string, unitCode?: string): string {
    if (!phone) return '#';
    let cleaned = phone.replace(/\D/g, '');
    // لو الرقم بيبدأ بـ 0 نشيله ونحط كود مصر 20
    if (cleaned.startsWith('0')) cleaned = '20' + cleaned.substring(1);
    // بنشتق الـ base URL من الـ apiUrl (بنشيل /api من الآخر)
    const baseUrl = environment.apiUrl.replace(/\/api$/, '');
    const pageUrl = baseUrl + window.location.pathname;
    const msg = encodeURIComponent(
      `Hello, I'm interested in property: #${unitCode || ''}\nLink: ${pageUrl}`
    );
    return `https://wa.me/${cleaned}?text=${msg}`;
  }

  // Contact form → بيروح WhatsApp الأدمن مباشرة
  submitContact() {
    if (!this.contactName || !this.contactPhone) return;
    const adminWa = this.getAdminPhone('wa');
    const msg = encodeURIComponent(
      `New inquiry for: ${this.blog()?.title}\nName: ${this.contactName}\nPhone: ${this.contactPhone}\nMessage: ${this.contactMessage || 'N/A'}`
    );
    window.open(`${adminWa}?text=${msg}`, '_blank');
    this.contactName = '';
    this.contactPhone = '';
    this.contactMessage = '';
  }

  goBack() {
    this.router.navigate(['/blog']);
  }
}