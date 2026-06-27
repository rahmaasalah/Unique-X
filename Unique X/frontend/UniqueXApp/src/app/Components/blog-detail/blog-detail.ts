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
  units = signal<any[]>([]);
  unitsLoading = signal(false);

  // Main slider
  activeSlide = signal(0);

  // Gallery lightbox
  galleryOpen = signal(false);
  galleryIndex = signal(0);

  // Contact form
  contactName = '';
  contactPhone = '';
  contactMessage = '';

  sliderImages = computed(() => this.blogService.getSliderImages(this.blog()));
  paymentPlans = computed(() => this.blogService.parseJson(this.blog()?.paymentPlansJson));
  articleSections = computed(() => this.blogService.parseJson(this.blog()?.articleSectionsJson));
  faqs = computed(() => this.blogService.parseJson(this.blog()?.faqsJson));
  unitIds = computed(() => this.blogService.parseJson(this.blog()?.unitIdsJson));

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
        this.loadUnits();
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadUnits() {
    const ids = this.unitIds();
    if (!ids.length) return;
    this.unitsLoading.set(true);
    const requests = ids.slice(0, 12).map((id: number) =>
      this.http.get<any>(`${environment.apiUrl}/Properties/${id}`)
    );
    Promise.all(requests.map((r: any) => r.toPromise()))
      .then(results => {
        this.units.set(results.filter(Boolean));
        this.unitsLoading.set(false);
      })
      .catch(() => this.unitsLoading.set(false));
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

  // Contact — بيروح WhatsApp
  submitContact() {
    if (!this.contactName || !this.contactPhone) return;
    const msg = encodeURIComponent(
      `New inquiry for ${this.blog()?.title}\nName: ${this.contactName}\nPhone: ${this.contactPhone}\nMessage: ${this.contactMessage}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
    this.contactName = '';
    this.contactPhone = '';
    this.contactMessage = '';
  }

  goBack() {
    this.router.navigate(['/blog']);
  }
}