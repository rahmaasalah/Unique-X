import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { CrmService } from '../../../Services/crm.services';
import { AlertService } from '../../../Services/alert';
import { AdminService } from '../../../Services/admin';
import { CanComponentDeactivate } from '../../../Guards/lead-feedback-guard';




export function futureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null; 
    const selectedDate = new Date(control.value).getTime();
    const now = new Date().getTime();
    return selectedDate < now ? { pastDate: true } : null; // لو الماضي، يرجع إيرور
  };
}


@Component({
  selector: 'app-lead-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './lead-details.html',
  styleUrls: ['./lead-details.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeadDetailsComponent implements OnInit, CanComponentDeactivate {
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private crmService = inject(CrmService);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private adminService = inject(AdminService);
  leadInfo = signal<any>(null);
  requestDetails = signal<any>(null);
  visits = signal<any[]>([]);
  activities = signal<any[]>([]);

  // 🟢 فلترة الـ Action Plan: All / Late / TooLate
  timelineFilter = signal<'all' | 'Late' | 'TooLate'>('all');
  get filteredTimeline() {
    const filter = this.timelineFilter();
    const all = this.combinedTimeline();
    if (filter === 'all') return all;
    return all.filter((item: any) => item.lateStatus === filter);
  }
  statusHistory = signal<any[]>([]);

  leadId!: number;
  currentBrokerId: string = '';
  minDateTime: string = '';

  combinedTimeline = signal<any[]>([]); // اللستة المجمعة

  filteredIds: number[] =[];
  hasPrev = signal<boolean>(false);
  hasNext = signal<boolean>(false);

  
  // متغيرات الـ Reschedule
  isRescheduling = signal<boolean>(false);
  rescheduleId = signal<number | null>(null);
  rescheduleType = signal<'visit' | 'activity' | null>(null);

  // متغيرات الـ Edit الكامل (بس للـ Pending)
  isEditing = signal<boolean>(false);
  editId = signal<number | null>(null);
  editType = signal<'visit' | 'activity' | null>(null);

  recommendations = signal<any[]>([]); // لتخزين العقارات المرشحة

  // الفورمز
  visitForm!: FormGroup;
  activityForm!: FormGroup;
  actionFeedbackForm!: FormGroup;
  generalNoteForm!: FormGroup;

  // 🟢 الليستة الكاملة القديمة - بنسيبها موجودة بس كمرجع (مش بتتعرض في أي Dropdown دلوقتي)
  // أي Stage هنا مش موجودة في qualifiedStages ولا unqualifiedStages بقت "يتيمة":
  // لو عميل حالته الحالية واحدة منها، هتفضل معروضة زي ما هي كـ Label لحد ما البروكر يختار Qualified/Unqualified
  // ويحدد حالة جديدة من الليستة الجديدة - وبعدها مش هترجعله تاني.
  allStages = [
    { id: 1, name: 'New "To Call"' }, { id: 2, name: 'Waiting response on wtp msg' }, { id: 3, name: 'Request call another time' },
    { id: 4, name: 'Calls (request)' }, { id: 5, name: 'Waiting Client Feedback on unit' }, { id: 6, name: 'Follow Up For Visit' },
    { id: 7, name: 'Visit scheduled' }, { id: 8, name: 'Follow up After visit' }, { id: 9, name: 'Waiting feedback on project' },
    { id: 10, name: 'Follow up for Meeting' }, { id: 11, name: 'Meeting Scheduled' }, { id: 12, name: 'Follow up after meeting' },
    { id: 13, name: 'Follow up for developer meeting' }, { id: 14, name: 'Follow up for site visit' }, { id: 15, name: 'Site visit scheduled' },
    { id: 16, name: 'Follow up for event' }, { id: 17, name: 'Follow up after event' }, { id: 18, name: 'Follow up for closing' },
    { id: 19, name: 'Deal closed' }, { id: 20, name: 'Follow up, not now' }, { id: 21, name: 'N/A "unreachable"' },
    { id: 22, name: 'Lost Not interested' }, { id: 23, name: 'Low Budget' }, { id: 24, name: 'Number Issue' },
    { id: 25, name: 'Broker' }, { id: 26, name: 'Recommend to shift' }
  ];

  // 🟢 الحالات اللي بتظهر لو البروكر دوس Qualified
  qualifiedStages = [
    { id: 1, name: 'New "To Call"' },
    { id: 4, name: 'Calls (request)' },
    { id: 6, name: 'Follow Up For Visit' },
    { id: 10, name: 'Follow up for Meeting' },
    { id: 7, name: 'Visit scheduled' },
    { id: 11, name: 'Meeting Scheduled' },
    { id: 8, name: 'Follow up After visit' },
    { id: 18, name: 'Follow up for closing' },
    { id: 19, name: 'Deal closed' }
  ];

  // 🟢 الحالات اللي بتظهر لو البروكر دوس Unqualified
  unqualifiedStages = [
    { id: 23, name: 'Low Budget' },
    { id: 22, name: 'Lost Not interested' },
    { id: 24, name: 'Number Issue' },
    { id: 21, name: 'N/A "unreachable"' },
    { id: 25, name: 'Broker' },
    { id: 26, name: 'Recommend to shift' }
  ];

  // 🟢 الحالة المختارة دلوقتي: Qualified / Unqualified / null (لسه محددش أو حالته يتيمة)
  leadQualification = signal<'qualified' | 'unqualified' | null>(null);

  // الليستة اللي هتتعرض فعليًا في الـ Dropdown حسب الاختيار
  get visibleStages() {
    if (this.leadQualification() === 'qualified') return this.qualifiedStages;
    if (this.leadQualification() === 'unqualified') return this.unqualifiedStages;
    return [];
  }

  // هل الحالة الحالية للعميل "يتيمة" (مش موجودة في أي من الليستين الجديدة)؟
  get isOrphanStatus(): boolean {
    const statusId = this.leadInfo()?.statusId;
    if (statusId == null) return false;
    const inQualified = this.qualifiedStages.some(s => s.id === statusId);
    const inUnqualified = this.unqualifiedStages.some(s => s.id === statusId);
    return !inQualified && !inUnqualified;
  }

  zones =[{ id: 1, name: 'Cairo' }, { id: 2, name: 'Alexandria' }, { id: 3, name: 'North Coast' }];

  visitAvailableRegions: string[] = [];
  visitAvailableProjects: string[] =[];

  isAdmin = signal<boolean>(false);
  brokersList = signal<any[]>([]);
  selectedTransferBroker = signal<string>('');
  adminName = signal<string>('');
  adminId = signal<string>('');

  // 🟢 نظام الـ Feedback الإجباري: لو أدمن أو صاحب الليد، لازم يضيف فيدباك قبل ما يخرج من الصفحة
  feedbackAddedThisVisit = signal<boolean>(false);

  // بيحدد هل شرط الفيدباك الإجباري لازم يتفعل مع الليد ده ولا لأ
  get requiresMandatoryFeedback(): boolean {
    const info = this.leadInfo();
    if (!info) return false;
    return this.isAdmin() || info.brokerId === this.currentBrokerId;
  }

  // عدد الفيدباكات الكلي المسجلة على الليد ده (مستخرج من نفس الحقل الموجود بالفعل)
  get feedbackCount(): number {
    const info = this.leadInfo();
    if (!info || !info.generalFeedback) return 0;
    const allEntries = this.parseFeedbacks(info.generalFeedback);

    // 🟢 لو العميل ده اتصفر عداده قبل كده (بعد ما اتحول لبروكر جديد)، منحسبش غير الفيدباكات
    // اللي اتضافت بعد وقت التصفير - القديمة بتفضل موجودة في السجل بس مش بتتحسب في العداد
    if (info.feedbackCounterResetAt) {
      const resetTime = new Date(info.feedbackCounterResetAt).getTime();
      return allEntries.filter((e: any) => e.date && new Date(e.date).getTime() > resetTime).length;
    }
    return allEntries.length;
  }

  // بيبان تنبيه/هايلايت لما العدد يوصل لمضاعف 6 (6, 12, 18...)
  get isFeedbackCountAlert(): boolean {
    const count = this.feedbackCount;
    return count > 0 && count % 6 === 0;
  }


   ngOnInit() {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      this.currentBrokerId = user.id || user.userId || ''; 
      
      // 🟢 فحص هل المستخدم أدمن
      if (user.roles && user.roles.includes('Admin')) {
        this.isAdmin.set(true);
  this.adminId.set(user.id || user.userId || '');
  this.adminName.set(user.username || user.firstName + ' ' + user.lastName || 'Admin');
        // جلب قائمة البروكرز عشان الأدمن يختار منهم
        this.adminService.getAllUsers().subscribe(users => {
          this.brokersList.set(users.filter((u: any) => u.userType === 1));
        });
      }
    }

    const now = new Date();
    this.minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    const storedIds = sessionStorage.getItem('crm_filtered_leads');
    if (storedIds) {
      this.filteredIds = JSON.parse(storedIds);
    }

    this.route.paramMap.subscribe(params => {
      this.leadId = Number(params.get('id'));
      if (this.leadId) {
        // 🟢 لو سبق وحطيت فيدباك على العميل ده في نفس الجلسة (حتى لو راح صفحة تعديل ورجع)، منطلبوش تاني
        const alreadyGivenThisSession = sessionStorage.getItem('feedbackGiven_' + this.leadId) === '1';
        this.feedbackAddedThisVisit.set(alreadyGivenThisSession);
        this.checkPagination(); 
        this.initForms(); 
        this.loadLeadData(this.leadId); 
      }
    });
  }

  // 🟢 لو حاول يقفل التاب أو يعمل Refresh وهو لسه محتاج يضيف فيدباك، المتصفح هيوريه تحذيره الافتراضي
  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: BeforeUnloadEvent) {
    if (this.requiresMandatoryFeedback && !this.feedbackAddedThisVisit()) {
      event.preventDefault();
      event.returnValue = ''; // لازم السطر ده عشان أغلب المتصفحات تعرض التحذير
    }
  }

  // 🟢 الدالة اللي بيسألها الـ Guard قبل ما يسمح بأي تنقل جوه التطبيق
  canDeactivate(): boolean {
    if (!this.requiresMandatoryFeedback || this.feedbackAddedThisVisit()) {
      return true;
    }
    this.alertService.warning(
      'You must add a Feedback for this lead before leaving the page.',
      'Feedback Required'
    );
    // نفتحله المودال بنفسنا عشان يبقى سهل يضيف الفيدباك على طول
    const bootstrap = (window as any).bootstrap;
    const modalEl = document.getElementById('generalNoteModal');
    if (bootstrap && modalEl) {
      new bootstrap.Modal(modalEl).show();
    }
    return false;
  }

  submitTransfer() {
    const newBroker = this.selectedTransferBroker();
    if (!newBroker) return;

    this.alertService.showLoading('Transferring Lead...');
    this.crmService.transferLead(this.leadId, newBroker, this.currentBrokerId).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('Lead transferred successfully!');
        this.loadLeadData(this.leadId); // تحديث الداتا بعد النقل
        document.getElementById('closeTransferModal')?.click(); // قفل المودال
      },
      error: () => {
        this.alertService.close();
        this.alertService.error('Failed to transfer lead.');
      }
    });
  }

  // 👇 دالة لمعرفة هل فيه عميل سابق أو تالي
  checkPagination() {
    if (this.filteredIds.length > 0) {
      const currentIndex = this.filteredIds.indexOf(this.leadId);
      this.hasPrev.set(currentIndex > 0);
      this.hasNext.set(currentIndex < this.filteredIds.length - 1 && currentIndex !== -1);
    }
  }

  // 👇 دالة التقليب
  navigateLead(direction: 'prev' | 'next') {
    const currentIndex = this.filteredIds.indexOf(this.leadId);
    if (direction === 'prev' && currentIndex > 0) {
      const prevId = this.filteredIds[currentIndex - 1];
      this.router.navigate(['/crm/leads', prevId]);
    } else if (direction === 'next' && currentIndex < this.filteredIds.length - 1) {
      const nextId = this.filteredIds[currentIndex + 1];
      this.router.navigate(['/crm/leads', nextId]);
    }
  }

 initForms() {
    this.visitForm = this.fb.group({
      leadId: [this.leadId],
      brokerId:[this.currentBrokerId],
      propertyCode: [''], // اختياري
      propertyName: [''], // اختياري
      brokerPhone: [''], // اختياري
      zoneId: ['', Validators.required],
      listingType:['', Validators.required],
      region: [''], // اختياري مبدئياً وهيتغير برمجياً
      project: [''], // اختياري مبدئياً وهيتغير برمجياً
      visitDate: ['', Validators.required],
      location: ['', Validators.required],
      visitType: ['', Validators.required],
      notes:[''],
      status: [''],   // بيتفعل لو الميعاد فات
      feedback: ['']  // بيتفعل لو الـ status = Completed
    });

    // فورم الملاحظة العمومية
    this.generalNoteForm = this.fb.group({
      note: ['', Validators.required]
    });

    // فورم الفيدباك الخاص بزيارة أو مكالمة
    this.actionFeedbackForm = this.fb.group({
      feedback: ['', Validators.required]
    });

    this.activityForm = this.fb.group({
      leadId:[this.leadId],
      assignedToId: [this.currentBrokerId],
      activityType:['Call', Validators.required],
      summary: ['', Validators.required],
      dueDate: ['', Validators.required],
      notes: [''],
      status: [''],   // بيتفعل لو الميعاد فات
      feedback: ['']  // بيتفعل لو الـ status = Completed
    });

    this.setupVisitDynamicFields();
    this.setupPastDateStageLogic(this.visitForm, 'visitDate');
    this.setupPastDateStageLogic(this.activityForm, 'dueDate');
  }

  // 👇 بتراقب تاريخ الزيارة/المهمة: لو فات، الـ status بيبقى إجباري (بدون Pending)
  // ولو الـ status اتحط Completed، الـ feedback بيبقى إجباري كمان
  setupPastDateStageLogic(form: FormGroup, dateField: string) {
    const dateCtrl = form.get(dateField);
    const statusCtrl = form.get('status');
    const feedbackCtrl = form.get('feedback');

    dateCtrl?.valueChanges.subscribe((value) => {
      const isPast = value ? new Date(value).getTime() <= Date.now() : false;

      if (isPast) {
        statusCtrl?.setValidators(Validators.required);
      } else {
        statusCtrl?.clearValidators();
        statusCtrl?.setValue('', { emitEvent: false });
        feedbackCtrl?.clearValidators();
        feedbackCtrl?.setValue('', { emitEvent: false });
      }
      statusCtrl?.updateValueAndValidity({ emitEvent: false });
      feedbackCtrl?.updateValueAndValidity({ emitEvent: false });
    });

    statusCtrl?.valueChanges.subscribe((status) => {
      if (status === 'Completed') {
        feedbackCtrl?.setValidators(Validators.required);
      } else {
        feedbackCtrl?.clearValidators();
      }
      feedbackCtrl?.updateValueAndValidity({ emitEvent: false });
    });
  }

  setupVisitDynamicFields() {
    // لما الـ Zone تتغير
    this.visitForm.get('zoneId')?.valueChanges.subscribe(zoneId => {
      this.visitForm.patchValue({ region: '', project: '' });
      this.loadVisitRegionsAndProjects(zoneId);
    });

    // لما הـ Listing Type يتغير (لتفعيل الإجباري/الاختياري)
    this.visitForm.get('listingType')?.valueChanges.subscribe(type => {
      this.visitForm.patchValue({ region: '', project: '' });
      
      const regionCtrl = this.visitForm.get('region');
      const projectCtrl = this.visitForm.get('project');

      regionCtrl?.clearValidators();
      projectCtrl?.clearValidators();

      // 🟢 التعديل هنا:
      if (type === 'Resale') {
        // لو ريسيل -> المنطقة إجباري
        regionCtrl?.setValidators(Validators.required);
      } 
      else if (type === 'Primary' || type === 'Resale Project') {
        // لو برايماري أو ريسيل بروجيكت -> المشروع إجباري
        projectCtrl?.setValidators(Validators.required);
      }
      // 🟢 لو Rent -> مش هنحط أي Validators (هيبقوا اختياريين)

      regionCtrl?.updateValueAndValidity();
      projectCtrl?.updateValueAndValidity();
    });

    this.visitForm.get('visitType')?.valueChanges.subscribe(type => {
      const codeCtrl = this.visitForm.get('propertyCode');
      
      if (type === 'Broker') {
        codeCtrl?.setValidators(Validators.required); // إجباري
      } else {
        codeCtrl?.clearValidators(); // اختياري
      }
      
      codeCtrl?.updateValueAndValidity(); // تحديث الفورم
    });
  }

  // 🟢 المناطق/المشاريع بقت جايه من الداتابيز (تاب Lookups بتاع الأدمن) بدل ليستة ثابتة في الكود
  loadVisitRegionsAndProjects(zoneId: number) {
    this.visitAvailableRegions = [];
    this.visitAvailableProjects = [];
    if (!zoneId) return;

    this.adminService.getRegions(zoneId).subscribe({
      next: (regions: any[]) => this.visitAvailableRegions = (regions || []).map(r => r.name).sort(),
      error: () => this.visitAvailableRegions = []
    });

    this.adminService.getProjects(undefined, zoneId).subscribe({
      next: (projects: any[]) => this.visitAvailableProjects = (projects || []).map(p => p.name).sort(),
      error: () => this.visitAvailableProjects = []
    });
  }

   get showVisitRegion() {
    const type = this.visitForm.get('listingType')?.value;
    return['Resale', 'Rent'].includes(type);
  }

  get showVisitProject() {
    const type = this.visitForm.get('listingType')?.value;
    return ['Primary', 'Resale Project', 'Rent'].includes(type);
  }

  get isVisitDatePast(): boolean {
    const val = this.visitForm.get('visitDate')?.value;
    return val ? new Date(val).getTime() <= Date.now() : false;
  }

  get isActivityDatePast(): boolean {
    const val = this.activityForm.get('dueDate')?.value;
    return val ? new Date(val).getTime() <= Date.now() : false;
  }

  isTimePassed(dateValue: any): boolean {
    if (!dateValue) return false;
    const taskTime = new Date(dateValue).getTime();
    const nowTime = new Date().getTime();
    return taskTime <= nowTime;
  }

  loadLeadData(id: number) {
    this.crmService.getLeadDetails(id).subscribe({
      next: (res) => {
        
        // 🟢 1. بنسيب حرف الـ Z لتواريخ الإنشاء والتعديل بس (عشان دول بيتولدوا من السيرفر)
        if (res.leadInfo) {
          if (res.leadInfo.createdAt && !res.leadInfo.createdAt.endsWith('Z')) res.leadInfo.createdAt += 'Z';
          if (res.leadInfo.updatedAt && !res.leadInfo.updatedAt.endsWith('Z')) res.leadInfo.updatedAt += 'Z';
        }
        if (res.statusHistory) {
          res.statusHistory.forEach((h: any) => {
            if (h.changedAt && !h.changedAt.endsWith('Z')) h.changedAt += 'Z';
          });
        }

        // ❌ شيلنا أكواد الـ Z بتاعة الزيارات والمهام عشان تقرأ توقيتك صح 100%

        // حفظ الداتا 
        this.leadInfo.set(res.leadInfo);
        this.requestDetails.set(res.requestDetails);

        // 🟢 حماية: لو العميل ده اتسحب (IsUnassigned) والمستخدم مش أدمن، منسمحش له يشوف أي بيانات
        if (res.leadInfo?.isUnassigned && !this.isAdmin()) {
          this.alertService.error('This lead has been reassigned and is no longer accessible to you.', 'Access Denied');
          this.router.navigate(['/crm/leads']);
          return;
        }

        // 🟢 تحديد هل الحالة الحالية Qualified ولا Unqualified ولا يتيمة (لسه محددش)
        const currentStatusId = res.leadInfo?.statusId;
        if (this.qualifiedStages.some(s => s.id === currentStatusId)) {
          this.leadQualification.set('qualified');
        } else if (this.unqualifiedStages.some(s => s.id === currentStatusId)) {
          this.leadQualification.set('unqualified');
        } else {
          this.leadQualification.set(null); // حالة يتيمة - تفضل زي ما هي لحد ما البروكر يختار
        }
        this.visits.set(res.visits ||[]);
        this.activities.set(res.activities ||[]);
        this.statusHistory.set(res.statusHistory ||[]);

        // تجميع وترتيب التايم لاين المجمع
        const v = (res.visits ||[]).map((x: any) => ({ ...x, _type: 'visit', _date: x.visitDate }));
        const a = (res.activities ||[]).map((x: any) => ({ ...x, _type: 'activity', _date: x.dueDate }));
        const combined = [...v, ...a].sort((a, b) => new Date(b._date).getTime() - new Date(a._date).getTime());

        // 🟢 بنحسب القيم المشتقة مرة واحدة هنا بدل ما الـ template يستدعي
        // extractFeedback / extractOriginalNotes / cleanAdminPrefix / isAdminAction
        // في كل دورة change detection (وده كان بيسبب البطء أثناء الكتابة)
        combined.forEach((item: any) => {
          const rawFeedback = item._type === 'visit' ? item.feedback : this.extractFeedback(item.notes);
          item._feedback = this.cleanAdminPrefix(rawFeedback);
          item._originalNotes = this.extractOriginalNotes(item.notes);
          item._isAdminAction = this.isAdminAction(item);
        });

        this.combinedTimeline.set(combined);
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error fetching lead details:', err)
    });

    this.crmService.getLeadRecommendations(id).subscribe({
      next: (recs) => { this.recommendations.set(recs); this.cdr.markForCheck(); },
      error: (err) => console.error('Error fetching recommendations', err)
    });
  }

  // 👇 دالة اختيار Qualified / Unqualified - بس بتغيّر الليستة المعروضة، مش بتحدث حالة العميل لحد ما يختار Stage فعلي
  selectQualification(type: 'qualified' | 'unqualified') {
    this.leadQualification.set(type);
  }

  // 👇 الدالة الجديدة لتغيير الحالة من الـ Dropdown
  onStageChange(event: any) {
    const newStatusId = Number(event.target.value);
    
    this.alertService.showLoading('Updating Stage...');
    this.crmService.updateLeadStatus(this.leadId, {
      newStatusId: newStatusId,
      brokerId: this.currentBrokerId,
      notes: 'Stage updated from Profile'
    }).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('Stage updated successfully!');
        this.loadLeadData(this.leadId); // تحديث الداتا عشان الهيستوري يتكتب فيه
      },
      error: () => {
        this.alertService.close();
        this.alertService.error('Failed to update stage.');
        this.loadLeadData(this.leadId); // نرجعها زي ما كانت لو حصل خطأ
      }
    });
  }

  submitVisit() {
    if (this.visitForm.valid) {
      this.alertService.showLoading('Saving visit...');

      // 🟢 1. لو إحنا في وضع "تأجيل الميعاد" (Reschedule)
      if (this.isRescheduling() && this.rescheduleId()) {
        const newDate = this.visitForm.get('visitDate')?.value; // بناخد التاريخ الجديد بس
        
        this.crmService.rescheduleVisit(this.rescheduleId()!, newDate).subscribe({
          next: () => {
            this.alertService.close();
            this.alertService.success('Visit rescheduled successfully!');
            this.loadLeadData(this.leadId); // تحديث التايم لاين
            document.getElementById('closeVisitModal')?.click(); // قفل المودال
          },
          error: (err) => {
            console.error(err);
            this.alertService.close();
            this.alertService.error('Error rescheduling visit.');
          }
        });
      } 
      // 🟢 2.b لو إحنا في وضع "تعديل زيارة Pending" (تعديل كامل مش مجرد تأجيل)
      else if (this.isEditing() && this.editId()) {
        const submitData = { ...this.visitForm.getRawValue() };
        submitData.zoneId = submitData.zoneId ? Number(submitData.zoneId) : 0;

        this.crmService.updateVisit(this.editId()!, submitData).subscribe({
          next: () => {
            this.alertService.close();
            this.alertService.success('Visit updated successfully!');
            this.isEditing.set(false);
            this.editId.set(null);
            this.visitForm.reset({ leadId: this.leadId, brokerId: this.currentBrokerId });
            this.loadLeadData(this.leadId);
            document.getElementById('closeVisitModal')?.click();
          },
          error: (err) => {
            console.error(err);
            this.alertService.close();
            this.alertService.error('Error updating visit.');
          }
        });
      }
      // 🟢 2.c لو إحنا في وضع "إنشاء زيارة جديدة"
      else {
        const submitData = { ...this.visitForm.getRawValue() }; 
        
        // 🟢 تأكيد تحويل zoneId لرقم عشان ميضربش 400 Bad Request
        submitData.zoneId = submitData.zoneId ? Number(submitData.zoneId) : 0;

        this.crmService.scheduleVisit(submitData).subscribe({
          next: () => {
            this.alertService.close();
            this.alertService.success('Visit scheduled successfully!');
            this.visitForm.reset({ leadId: this.leadId, brokerId: this.currentBrokerId });
            this.loadLeadData(this.leadId); 
            document.getElementById('closeVisitModal')?.click();
          },
          error: (err) => {
            console.error(err);
            this.alertService.close();
            this.alertService.error('Error scheduling visit.');
          }
        });
      }
    }
  }

  // 🟢 helper بسيط لتقسيم القيم Multi-select (Comma-separated) اللي جايه من الباك إند لعرضها كـ badges
  splitCsv(value: string): string[] {
    if (!value) return [];
    return value.split(',').map(v => v.trim()).filter(v => v);
  }

  parseFeedbacks(feedbackStr: string) {
    if (!feedbackStr) return[];
    
    // لو دي داتا قديمة قبل التعديل
    if (!feedbackStr.includes('_#|#_')) {
      return [{ broker: 'System/Legacy', date: null, text: feedbackStr }];
    }

    const records = feedbackStr.split('_@|@_');
    return records.map(rec => {
      const parts = rec.split('_#|#_');
      if (parts.length >= 3) {
        return { broker: parts[0], date: parts[1], text: parts[2] };
      }
      return { broker: 'Unknown', date: null, text: rec };
    });
  }

  submitActivity() {
    if (this.activityForm.valid) {
      this.alertService.showLoading('Saving activity...');

      if (this.isRescheduling() && this.rescheduleId()) {
        const newDate = this.activityForm.get('dueDate')?.value; 
        
        this.crmService.rescheduleActivity(this.rescheduleId()!, newDate).subscribe({
          next: () => {
            this.alertService.close();
            this.alertService.success('Activity rescheduled successfully!');
            this.loadLeadData(this.leadId);
            document.getElementById('closeActivityModal')?.click();
          },
          error: (err) => {
            console.error(err);
            this.alertService.close();
            this.alertService.error('Error rescheduling activity.');
          }
        });
      } else if (this.isEditing() && this.editId()) {
        const submitData = { ...this.activityForm.getRawValue() };

        this.crmService.updateActivity(this.editId()!, submitData).subscribe({
          next: () => {
            this.alertService.close();
            this.alertService.success('Activity updated successfully!');
            this.isEditing.set(false);
            this.editId.set(null);
            this.activityForm.reset({ leadId: this.leadId, assignedToId: this.currentBrokerId, activityType: 'Call' });
            this.loadLeadData(this.leadId);
            document.getElementById('closeActivityModal')?.click();
          },
          error: (err) => {
            console.error(err);
            this.alertService.close();
            this.alertService.error('Error updating activity.');
          }
        });
      } else {
        // إنشاء مهمة جديدة
        const submitData = { ...this.activityForm.getRawValue() };

        submitData.zoneId = 0;
        submitData.listingType = '';
        submitData.propertyCode = '';
        submitData.propertyName = '';
        submitData.brokerPhone = '';
        submitData.region = '';
        submitData.project = '';
        
        this.crmService.logActivity(submitData).subscribe({
          next: () => {
            this.alertService.close();
            this.alertService.success('Activity logged successfully!');
            this.activityForm.reset({ leadId: this.leadId, assignedToId: this.currentBrokerId, activityType: 'Call' });
            this.loadLeadData(this.leadId); 
            document.getElementById('closeActivityModal')?.click();
          },
          error: (err) => {
            console.error(err);
            this.alertService.close();
            this.alertService.error('Error logging activity.');
          }
        });
      }
    }
  }
  onStatusChange(item: any, event: any) {
    const newStatus = event.target.value;
    
    // لو اختار تأجيل، نفتح المودال ونرجع السهم لـ Pending مؤقتاً
    if (newStatus === 'Rescheduled') {
      this.openRescheduleModal(item);
      event.target.value = item.status || 'Pending'; 
      return;
    }

    this.alertService.showLoading('Updating status...');
    const apiCall = item._type === 'visit' 
      ? this.crmService.updateVisitStatus(item.id, newStatus)
      : this.crmService.updateActivityStatus(item.id, newStatus);

    apiCall.subscribe({
      next: () => {
        this.alertService.close();
        this.loadLeadData(this.leadId);
        this.crmService.refreshNavbar$.next(); // تحديث الجرس
      }
    });
  }

  // 👇 2. دالة فتح مودال التأجيل (بتقفل كل الخانات وتفتح التاريخ بس)
  openRescheduleModal(item: any) {
    this.isRescheduling.set(true);
    this.isEditing.set(false);
    this.rescheduleId.set(item.id);
    this.rescheduleType.set(item._type);

    const bootstrap = (window as any).bootstrap;
    if (item._type === 'visit') {
      this.visitForm.patchValue(item); 
      this.visitForm.disable(); 
      this.visitForm.get('visitDate')?.enable(); 
      new bootstrap.Modal(document.getElementById('visitModal')).show();
    } else {
      this.activityForm.patchValue(item);
      this.activityForm.disable();
      this.activityForm.get('dueDate')?.enable();
      new bootstrap.Modal(document.getElementById('activityModal')).show();
    }
  }

  // 👇 3. دالة فتح المودال لإضافة جديدة (عشان نلغي وضع التأجيل ونفتح الخانات)
  openNewModal(type: 'visit' | 'activity') {
  this.isRescheduling.set(false);
  this.isEditing.set(false);
  if (type === 'visit') {
    this.visitForm.enable();
    this.visitForm.reset({ 
      leadId: this.leadId, 
      brokerId: this.currentBrokerId,
      // لو أدمن، نحط في النوتس تلقائياً [Admin] كـ marker
      notes: this.isAdmin() ? `[Admin: ${this.adminName()}]\n` : ''
    });
  } else {
    this.activityForm.enable();
    this.activityForm.reset({ 
      leadId: this.leadId, 
      assignedToId: this.currentBrokerId, 
      activityType: 'Call',
      notes: this.isAdmin() ? `[Admin: ${this.adminName()}]\n` : ''
    });
  }
}

  // 👇 4. تعديل كامل لزيارة/مهمة لسه Pending (بيفتح المودال بكل الحقول متاحة، مش التاريخ بس)
  openEditModal(item: any) {
    this.isRescheduling.set(false);
    this.isEditing.set(true);
    this.editId.set(item.id);
    this.editType.set(item._type);

    const bootstrap = (window as any).bootstrap;
    if (item._type === 'visit') {
      this.visitForm.enable();
      this.visitForm.patchValue(item);
      new bootstrap.Modal(document.getElementById('visitModal')).show();
    } else {
      this.activityForm.enable();
      this.activityForm.patchValue(item);
      new bootstrap.Modal(document.getElementById('activityModal')).show();
    }
  }

  // متغيرات عشان نعرف احنا بنعمل فيدباك لأنهي أكشن
  feedbackActionId = signal<number | null>(null);
  feedbackActionType = signal<'visit' | 'activity' | null>(null);

  openFeedbackModal(item: any) {
    this.feedbackActionId.set(item.id);
    this.feedbackActionType.set(item._type);
    this.actionFeedbackForm.reset();
    const bootstrap = (window as any).bootstrap;
    new bootstrap.Modal(document.getElementById('actionFeedbackModal')).show();
  }

  submitActionFeedback() {
  if (this.actionFeedbackForm.valid && this.feedbackActionId()) {
    this.alertService.showLoading('Saving feedback...');
    
    // لو أدمن، نحط prefix قبل الفيدباك
    const rawFeedback = this.actionFeedbackForm.value.feedback;
    const feedbackText = this.isAdmin() 
      ? `[Admin: ${this.adminName()}] ${rawFeedback}` 
      : rawFeedback;

    const apiCall = this.feedbackActionType() === 'visit'
      ? this.crmService.addVisitFeedback(this.feedbackActionId()!, feedbackText)
      : this.crmService.addActivityFeedback(this.feedbackActionId()!, feedbackText);

    apiCall.subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('Feedback saved!');
        this.loadLeadData(this.leadId);
        document.getElementById('closeActionFeedbackModal')?.click();
      }
    });
  }
}

cleanAdminPrefix(text: string | null): string | null {
  if (!text) return null;
  return text.replace(/^\[Admin:[^\]]*\]\s?/, '');
}

isAdminAction(item: any): boolean {
  if (item.notes?.startsWith('[Admin:')) return true;
  // بنقارن الـ brokerId أو assignedToId بالـ admin ID
  const itemOwnerId = item.brokerId || item.assignedToId || '';
  return itemOwnerId !== '' && itemOwnerId === this.adminId();
}

  // 🟢 بعد إضافة الفيدباك، لازم يختار Next Action (Activity أو Visit) قبل ما يكمل
  showNextActionPrompt = signal<boolean>(false);

  chooseNextAction(type: 'visit' | 'activity') {
    this.showNextActionPrompt.set(false);
    const bootstrap = (window as any).bootstrap;

    // نقفل مودال اختيار الـ Next Action لو لسه فاتح
    const promptEl = document.getElementById('nextActionModal');
    if (bootstrap && promptEl) {
      const promptInstance = bootstrap.Modal.getInstance(promptEl) || new bootstrap.Modal(promptEl);
      promptInstance.hide();
    }

    // نفتح نفس مودال الـ Activity/Visit العادي ونجهزه زي ما بيحصل بالظبط من زرار +Add
    this.openNewModal(type);
    setTimeout(() => {
      const targetEl = document.getElementById(type === 'visit' ? 'visitModal' : 'activityModal');
      if (bootstrap && targetEl) {
        new bootstrap.Modal(targetEl).show();
      }
    }, 300); // 👈 استنى قفل المودال اللي قبله الأول عشان مايحصلش تصادم بين المودالز
  }

  submitGeneralNote() {
    if (this.generalNoteForm.valid) {
      this.alertService.showLoading('Adding Note...');
      this.crmService.addGeneralNote(this.leadId, this.currentBrokerId, this.generalNoteForm.value.note).subscribe({
        next: () => {
          this.alertService.close();

          // 🟢 تم إضافة الفيدباك المطلوب - يقدر يخرج من الصفحة دلوقتي (طول الجلسة، حتى لو راح صفحة تانية ورجع)
          this.feedbackAddedThisVisit.set(true);
          sessionStorage.setItem('feedbackGiven_' + this.leadId, '1');

          // 🟢 +1 لأن الداتا القديمة لسه في الذاكرة والريكوست الجديد لسه بيترفريشها
          const newCount = this.feedbackCount + 1;

          this.alertService.success('Feedback saved successfully!');
          this.generalNoteForm.reset();
          this.loadLeadData(this.leadId);
          document.getElementById('closeGeneralNoteModal')?.click();

          // 🟢 بعد ما يقفل مودال الفيدباك، لازم يختار Next Action (Activity أو Visit) فورًا
          setTimeout(() => {
            this.showNextActionPrompt.set(true);
            const bootstrap = (window as any).bootstrap;
            const promptEl = document.getElementById('nextActionModal');
            if (bootstrap && promptEl) {
              new bootstrap.Modal(promptEl, { backdrop: 'static', keyboard: false }).show();
            }
          }, 400);

          // 🟢 لما يوصل مضاعف 6 (6, 12, 18...)، ننبه البروكر إن العميل ده أخد وقت طويل
          if (newCount > 0 && newCount % 6 === 0) {
            setTimeout(() => {
              this.alertService.warning(
                `This lead has reached ${newCount} Feedback entries - it's been taking a long time to follow up on. You may want to review your plan for this lead.`,
                'Lead Needs Attention'
              );
            }, 3200);
          }
        }
      });
    }
  }

  // دالة صغيرة تفصل الفيدباك من الـ Notes بتاعت الـ Activity
  extractFeedback(notes: string): string | null {
    if (!notes) return null;
    const parts = notes.split('[Feedback]:');
    return parts.length > 1 ? parts[1].trim() : null;
  }
  extractOriginalNotes(notes: string): string | null {
  if (!notes) return null;
  let cleaned = notes.replace(/^\[Admin:[^\]]*\]\n?/, '');
  const parts = cleaned.split('[Feedback]:');
  return parts[0].trim() !== '' ? parts[0].trim() : null;
}

  onRecommendClick(prop: any) {
    // 1. فتح العقار في تاب جديد للموقع الأساسي
    const baseUrl = window.location.origin;
    window.open(`${baseUrl}/property-details/${prop.id}`, '_blank');

    // 2. لو مكنش متداس عليه قبل كده، هنعلم عليه في الداتابيز ونلونه أخضر
    if (!prop.isProposed) {
      prop.isProposed = true; // تحويل وهمي سريع للعين
      
      this.crmService.markPropertyAsProposed(this.leadId, prop.id).subscribe({
        error: () => prop.isProposed = false // نرجعه لو حصل إيرور
      });
    }
  }
  
}