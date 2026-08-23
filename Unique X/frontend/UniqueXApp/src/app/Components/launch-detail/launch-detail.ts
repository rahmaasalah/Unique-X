import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LaunchService } from '../../Services/launch.service';
import { CurrencyService } from '../../Services/currency.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-launch-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './launch-detail.html'
})
export class LaunchDetailComponent implements OnInit {
  launchService = inject(LaunchService);
  currencyService = inject(CurrencyService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private location = inject(Location);

  launch = signal<any>(null);
  isLoading = signal(true);
  modalImageUrl = signal<string>('');
  units = signal<any[]>([]);
  primaryUnits = signal<any[]>([]);
  resaleUnits = signal<any[]>([]);
  rentUnits = signal<any[]>([]);
  unitsLoading = signal(false);

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

  // "Schedule Meeting" modal state
  meetingModalOpen = signal(false);
  meetingName: string = '';
  meetingPhone: string = '';
  meetingDate: string = '';
  meetingNotes: string = '';
  isSubmittingMeeting = signal(false);
  meetingErrorMessage = signal<string>('');
  meetingSuccessMessage = signal<string>('');

  // بيرجع تاريخ ووقت اللحظة الحالية بصيغة datetime-local عشان نمنع اختيار ميعاد فات
  get minMeetingDate(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }

  sliderImages = computed(() => this.launchService.getSliderImages(this.launch()));
  paymentPlans = computed(() => this.launchService.parseJson(this.launch()?.paymentPlansJson));
  articleSections = computed(() => this.launchService.parseJson(this.launch()?.articleSectionsJson));
  faqs = computed(() => this.launchService.parseJson(this.launch()?.faqsJson));
  unitIds = computed(() => this.launchService.parseJson(this.launch()?.unitIdsJson));
  resaleUnitIds = computed(() => this.launchService.parseJson(this.launch()?.resaleUnitIdsJson));
  primaryUnitIds = computed(() => this.launchService.parseJson(this.launch()?.primaryUnitIdsJson));
  rentUnitIds = computed(() => this.launchService.parseJson(this.launch()?.rentUnitIdsJson));
  allUnitIds = computed(() => [
    ...this.primaryUnitIds(),
    ...this.resaleUnitIds(),
    ...this.rentUnitIds(),
    ...this.unitIds() // fallback للقديم
  ].filter((v, i, a) => a.indexOf(v) === i)); // unique

  // بنعالج الـ mapEmbedUrl عشان نشيل منه الـ iframe لو موجود
  safeMapUrl(): SafeResourceUrl {
    let url = this.launch()?.mapEmbedUrl || '';
    // لو بعتوا iframe كامل نشيل منه الـ src بس
    const srcMatch = url.match(/src="([^"]+)"/);
    if (srcMatch) url = srcMatch[1];
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.launchService.getById(id).subscribe({
      next: (data) => {
        this.launch.set(data);
        this.isLoading.set(false);
        this.loadUnits();

        // تحديث اللينك في المتصفح ليشمل اسم المشروع بدل الاعتماد على الـ id لوحده
        const slug = this.launchService.generateSlug(data.title);
        const newPath = slug ? `/launch/${data.id}/${slug}` : `/launch/${data.id}`;
        this.location.replaceState(newPath);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadUnits() {
    const allIds = this.allUnitIds();
    if (!allIds.length) return;
    this.unitsLoading.set(true);

    const fetchUnit = (id: number) =>
      this.http.get<any>(`${environment.apiUrl}/Properties/${id}`).toPromise();

    Promise.all(allIds.map(fetchUnit))
      .then(results => {
        const all = results.filter(Boolean);
        const primaryIds = this.primaryUnitIds();
        const resaleIds = this.resaleUnitIds();
        const rentIds = this.rentUnitIds();

        this.primaryUnits.set(all.filter(u => primaryIds.includes(u.id)));
        this.resaleUnits.set(all.filter(u => resaleIds.includes(u.id)));
        this.rentUnits.set(all.filter(u => rentIds.includes(u.id)));
        // fallback للقديم
        this.units.set(all);
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

  // رقم الأدمن ثابت في السيستم
  private readonly ADMIN_PHONE = '01509064020';

  getAdminPhone(type: 'tel' | 'wa'): string {
    if (type === 'tel') return `tel:${this.ADMIN_PHONE}`;
    const cleaned = '20' + this.ADMIN_PHONE.replace(/^0+/, '');
    return `https://wa.me/${cleaned}`;
  }

  // WhatsApp link للبروكر مع كود الوحدة ورابط الصفحة
  getBrokerWhatsAppLink(phone: string, unitCode?: string): string {
    if (!phone) return '#';
    let cleaned = phone.replace(/\D/g, '');
    
    const currentUrl = window.location.href;
    const msg = encodeURIComponent(
      `Hello, I'm interested in property: #${unitCode || ''}\nLink: ${currentUrl}`
    );
    return `https://wa.me/${cleaned}?text=${msg}`;
  }

  // Contact form → بيروح WhatsApp الأدمن مباشرة مع لينك الصفحة (بيعمل بريفيو تلقائي)
  submitContact() {
    if (!this.contactName || !this.contactPhone) return;
    const adminWa = this.getAdminPhone('wa');
    const launchTitle = this.launch()?.title || '';
    const launchLink = window.location.href;
    const msg = encodeURIComponent(
      `New inquiry for: ${launchTitle}\nName: ${this.contactName}\nPhone: ${this.contactPhone}\nMessage: ${this.contactMessage || 'N/A'}\n${launchLink}`
    );
    window.open(`${adminWa}?text=${msg}`, '_blank');
    this.contactName = '';
    this.contactPhone = '';
    this.contactMessage = '';
  }

  goBack() {
    this.router.navigate(['/launch']);
  }

  // ===================== Schedule Meeting =====================

  openMeetingModal() {
    this.meetingName = '';
    this.meetingPhone = '';
    this.meetingDate = '';
    this.meetingNotes = '';
    this.meetingErrorMessage.set('');
    this.meetingModalOpen.set(true);
  }

  closeMeetingModal() {
    this.meetingModalOpen.set(false);
  }

  submitMeetingRequest() {
    const launch = this.launch();
    if (!launch || !this.meetingName || !this.meetingPhone || !this.meetingDate) return;

    // تأكيد إضافي إن الميعاد في المستقبل (حتى لو حصل تلاعب في الـ input)
    const selectedDate = new Date(this.meetingDate);
    if (selectedDate.getTime() < Date.now()) {
      this.meetingErrorMessage.set('Please select a future date and time for the meeting.');
      return;
    }

    this.meetingErrorMessage.set('');
    this.isSubmittingMeeting.set(true);

    this.http.post(`${environment.apiUrl}/Launches/${launch.id}/schedule-meeting`, {
      fullName: this.meetingName,
      phone: this.meetingPhone,
      meetingDate: this.meetingDate,
      notes: this.meetingNotes
    }).subscribe({
      next: () => {
        this.isSubmittingMeeting.set(false);
        this.meetingModalOpen.set(false);
        this.meetingSuccessMessage.set('Meeting request sent! Our team will confirm it with you soon.');
        setTimeout(() => this.meetingSuccessMessage.set(''), 4000);
      },
      error: () => {
        this.isSubmittingMeeting.set(false);
        this.meetingErrorMessage.set('Failed to send meeting request. Please try again.');
      }
    });
  }

  // 🟢 سكرول أفقي بأسهم يمين وشمال لأقسام الوحدات (نفس اللي في صفحة الهوم)
  scrollH(container: HTMLElement, dir: number) {
    if (!container) return;
    const amount = container.clientWidth * 0.8 * dir;
    container.scrollBy({ left: amount, behavior: 'smooth' });
  }

  formatNumber(value: any): string {
    if (!value && value !== 0) return '';
    const num = typeof value === 'string'
      ? parseFloat(value.replace(/,/g, ''))
      : Number(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('en-US');
  }

  // 🟢 بيحول أي قيمة (رقم أو نص فيه فواصل زي "500,000") لرقم نضيف صالح لـ currencyService.format()
  cleanNum(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : Number(value);
    return isNaN(num) ? 0 : num;
  }
}