import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'; // 👈 استيراد FormsModule مهم للفلاتر
import { CrmService } from '../../../Services/crm.services';
import { AlertService } from '../../../Services/alert';
import { AuthService } from '../../../Services/auth';
import { Router } from '@angular/router';
import { AdminService } from '../../../Services/admin'; // 👈 استيراد AdminService
import { AuthorizationService } from '../../../Services/authorization.service';

@Component({
  selector: 'app-broker-profile',
  standalone: true,
  imports:[CommonModule, RouterModule, FormsModule, ReactiveFormsModule], // 👈 ضفنا FormsModule هنا
  templateUrl: './broker-profile.html',
  styleUrls: ['./broker-profile.css']
})
export class BrokerProfileComponent implements OnInit, OnDestroy {

  // 🟢 helper بسيط لعرض القيم Multi-select (Comma-separated) بشكل مقروء أكتر
  csvDisplay(value: string | null | undefined): string {
    if (!value) return '-';
    return value.split(',').map(v => v.trim()).filter(v => v).join(', ');
  }
  private crmService = inject(CrmService);
  private alertService = inject(AlertService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private adminService = inject(AdminService);
  private authorizationService = inject(AuthorizationService);
  private fb = inject(FormBuilder);

  // 🟢 true لو معاه custom role جوه crm-dashboard (Team Leader مثلاً) - مش فُل أدمن
  hasLimitedCrmRole = signal(false);
  brokerName = signal<string>('');
  brokerImage = signal<string>('https://cdn-icons-png.flaticon.com/512/149/149071.png');
  
  profileData = signal<any>(null);
  campaignsList = signal<any[]>([]); // 👈 لستة الحملات للفلتر

  isAdmin = signal<boolean>(false);
  currentBrokerId: string = '';

  brokerTitle = signal<string>('');
  brokerDescription = signal<string>('');

  brokersList = signal<any[]>([]);
  filterBroker = signal<string>('');

  // 🟢 Tracker الـ 48 ساعة: بيتحدث كل دقيقة عشان العداد يفضل حي من غير ما يحتاج refresh
  nowTick = signal<number>(Date.now());
  private trackerInterval: any;

  // 🟢 الفلاتر
 searchQuery = signal<string>('');
  filterCampaign = signal<string>('');
  filterStage = signal<string>('');
  filterZone = signal<string>('');
  // 🟢 فلتر التراكر الموحّد الجديد - Active / Late / TooLate (جاي من الباك إند lead.lateStatus)
  filterTrackerStatus = signal<string>('');
  filterCreationDate = signal<string>('');
  filterLastUpdate = signal<string>('');
  filterMinBudget = signal<number | null>(null);
  filterMaxBudget = signal<number | null>(null);
  filterReferredBy = signal<string>('');

  filterPropertyType = signal<string>('');
filterListingType = signal<string>('');
filterCampaignCode = signal<string>('');
searchCampaignCode = signal<string>('');
isCampaignDropdownOpen = signal<boolean>(false);

filteredCampaignCodes = computed(() => {
  const q = this.searchCampaignCode().toLowerCase();
  const codes = this.campaignsList();
  return q ? codes.filter((c: string) => c.toLowerCase().includes(q)) : codes;
});

selectCampaign(code: string) {
  this.filterCampaignCode.set(code);
  this.searchCampaignCode.set(code);
  this.isCampaignDropdownOpen.set(false);
}

closeCampaignDropdown() {
  setTimeout(() => this.isCampaignDropdownOpen.set(false), 200);
}

  hiddenLeads = signal<number[]>([]);
  showHiddenLeads = signal<boolean>(false);
  favouriteLeads = signal<number[]>([]);
showFavouritesOnly = signal<boolean>(false);

  // 👇 نقلنا تعريف المناطق هنا عشان الـ HTML يقدر يشوفه
  zones =[
    { id: 1, name: 'Cairo' },
    { id: 2, name: 'Alexandria' },
    { id: 3, name: 'North Coast' }
  ];

  dummyBrokers = signal<any[]>([]);

  // 🟢 فلترة العملاء لحظياً
  
filteredLeads = computed(() => {
    const data = this.profileData();
    if (!data || !data.leads) return [];
    let leads = data.leads;

    // 1. إخفاء المكرر للبروكر العادي
    if (!this.isAdmin()) {
      leads = leads.filter((l: any) => !(l.isDuplicate && !l.isApprovedDuplicate));
    }

    // 🟢 2. التعديل الجديد: إخفاء العملاء اللي الأدمن خفاهم (إلا لو دايس إظهار المخفي)
    if (this.isAdmin() && !this.showHiddenLeads()) {
      leads = leads.filter((l: any) => !this.hiddenLeads().includes(l.id));
    }

    if (this.showFavouritesOnly()) {
  leads = leads.filter((l: any) => this.favouriteLeads().includes(l.id));
}

    const q = this.searchQuery().toLowerCase();
    const broker = this.filterBroker();
    const camp = this.filterCampaign();
    const stage = this.filterStage();
    const zone = this.filterZone(); 
    const trackerStatus = this.filterTrackerStatus();
    const cDate = this.filterCreationDate();
    const uDate = this.filterLastUpdate();
    const minB = this.filterMinBudget();
    const maxB = this.filterMaxBudget();
    const refBy = this.filterReferredBy();

    const propType = this.filterPropertyType();
const listType = this.filterListingType();
const campCode = this.filterCampaignCode();

    if (q) leads = leads.filter((l: any) => l.fullName.toLowerCase().includes(q) || l.phoneNumber.includes(q));
    if (broker) leads = leads.filter((l: any) => l.brokerName === broker);
    if (camp) leads = leads.filter((l: any) => l.campaignName === camp);
    if (stage) leads = leads.filter((l: any) => l.statusId.toString() === stage);
    // 🟢 zoneName بقى ممكن يبقى فيه أكتر من مدينة (زي "Cairo, Alexandria") - بنفلتر بـ includes بدل exact match
    if (zone) leads = leads.filter((l: any) => (l.zoneName || '').split(',').map((x: string) => x.trim()).includes(zone));
    // 🟢 فلتر بالتراكر الموحّد - lateStatus جاي جاهز من الباك إند (نفس المصدر في كل الصفحات)
    if (trackerStatus) leads = leads.filter((l: any) => (l.lateStatus || 'Active') === trackerStatus);
    if (cDate) leads = leads.filter((l: any) => this.formatDateForFilter(l.createdAt) === cDate);
    if (uDate) leads = leads.filter((l: any) => this.formatDateForFilter(l.updatedAt || l.createdAt) === uDate);
    // 🟢 الفلتر بقى بياخد بالباله Min/Max Budget (لو موجودين)، ولو مش موجودين بيرجع لـ totalAmount القديم
    if (minB !== null) leads = leads.filter((l: any) => {
      const upperBound = l.maxBudget > 0 ? l.maxBudget : (l.minBudget > 0 ? l.minBudget : l.totalAmount);
      return upperBound >= minB;
    });
    if (maxB !== null) leads = leads.filter((l: any) => {
      const lowerBound = l.minBudget > 0 ? l.minBudget : (l.maxBudget > 0 ? l.maxBudget : l.totalAmount);
      return lowerBound > 0 ? lowerBound <= maxB : true;
    });
    if (refBy) leads = leads.filter((l: any) => l.referredBy === refBy);
    // 🟢 propertyType/purpose بقوا Multi-select (Comma-separated) - بنفلتر بـ includes بدل exact match
    if (propType) leads = leads.filter((l: any) => (l.propertyType || '').split(',').map((x: string) => x.trim()).includes(propType));
if (listType) leads = leads.filter((l: any) => (l.purpose || '').split(',').map((x: string) => x.trim()).includes(listType));
if (campCode) leads = leads.filter((l: any) => l.campaignName === campCode);

    const ids = leads.map((l: any) => l.id);
    sessionStorage.setItem('crm_filtered_leads', JSON.stringify(ids));

    return leads;
  });

   visitSearch = signal<string>('');
  visitStatus = signal<string>('');
  visitDate = signal<string>('');

  filteredVisits = computed(() => {
    const data = this.profileData();
    if (!data || !data.visits) return[];
    let visits = data.visits;
    
    const q = this.visitSearch().toLowerCase();
    const status = this.visitStatus();
    const date = this.visitDate();

    if (q) visits = visits.filter((v:any) => v.leadName.toLowerCase().includes(q) || v.leadPhone.includes(q) || (v.location || '').toLowerCase().includes(q));
    if (status) visits = visits.filter((v:any) => (v.status || 'Pending') === status);
    if (date) visits = visits.filter((v:any) => this.formatDateForFilter(v.visitDate) === date);

    return visits;
  });

  clearVisitFilters() {
    this.visitSearch.set('');
    this.visitStatus.set('');
    this.visitDate.set('');
  }

  // ================== فلاتر المهام والمكالمات ==================
  activitySearch = signal<string>('');
  activityStatus = signal<string>('');
  activityDate = signal<string>('');
  activityType = signal<string>('');

  filteredActivities = computed(() => {
    const data = this.profileData();
    if (!data || !data.activities) return[];
    let activities = data.activities;

    const q = this.activitySearch().toLowerCase();
    const status = this.activityStatus();
    const date = this.activityDate();
    const type = this.activityType();

    if (q) activities = activities.filter((a:any) => a.leadName.toLowerCase().includes(q) || (a.summary || '').toLowerCase().includes(q));
    if (status) activities = activities.filter((a:any) => (a.status || 'Pending') === status);
    if (date) activities = activities.filter((a:any) => this.formatDateForFilter(a.dueDate) === date);
    if (type) activities = activities.filter((a:any) => a.activityType === type);

    return activities;
  });

  clearActivityFilters() {
    this.activitySearch.set('');
    this.activityStatus.set('');
    this.activityDate.set('');
    this.activityType.set('');
  }

  ngOnInit() {
    this.trackerInterval = setInterval(() => this.nowTick.set(Date.now()), 60000);

    this.authorizationService.getMyPermissions().subscribe({
      next: (perm) => {
        this.hasLimitedCrmRole.set(!perm.isFullAdmin && perm.crmRoleNames.length > 0);
      },
      error: () => {}
    });

    if (!this.authService.isAllowedToOpenCrm()) {
      this.router.navigate(['/home']);
      return; // وقف تنفيذ باقي الكود
    }
    const userString = localStorage.getItem('user');
    let fetchId = '';

    if (userString) {
      const user = JSON.parse(userString);
      this.currentBrokerId = user.id || user.userId || '';
      
      const roles = user.roles ||[];
      const isUserAdmin = roles.includes('Admin') || user.userType === 2 || user.userType === 'Admin';

      const savedHiddenLeads = localStorage.getItem('crm_hidden_leads');
    if (savedHiddenLeads) {
      this.hiddenLeads.set(JSON.parse(savedHiddenLeads));
    }

    const savedFavourites = localStorage.getItem('crm_favourite_leads');
    if (savedFavourites) {
      this.favouriteLeads.set(JSON.parse(savedFavourites));
    }

    // نجيب الـ favorites من الـ DB (الأصح والأحدث)
    if (this.currentBrokerId) {
      this.crmService.getFavoriteIds(this.currentBrokerId).subscribe({
        next: (ids) => this.favouriteLeads.set(ids),
        error: () => {} // لو فشل نسيب الـ localStorage كـ fallback
      });
    }

      if (isUserAdmin) {
        this.adminService.getAllUsers().subscribe(users => {
        this.brokersList.set(users.filter((u: any) => u.userType === 1));
      });
        this.isAdmin.set(true);
        this.brokerName.set('Admin Workspace');
        fetchId = ''; 
      } else {
        this.isAdmin.set(false);
        this.brokerName.set(user.username || 'Broker Profile');
        fetchId = this.currentBrokerId;

        this.authService.getProfile().subscribe({
          next: (data: any) => {
            if (data) {
              this.brokerTitle.set(data.brokerTitle || '');
              this.brokerDescription.set(data.brokerDescription || '');
            }
          }
        });
      
      }
      
      if (user.profileImageUrl) this.brokerImage.set(user.profileImageUrl);
    }
    
    this.loadProfileData(fetchId);
    this.crmService.getPropertyCodes().subscribe(data => this.campaignsList.set(data));
    this.adminService.getBrokersWithCodes().subscribe({
      next: (data) => {
        const formatted = data
          .filter((b: any) => b.brokerCode)
          .map((b: any) => ({ code: b.brokerCode, name: `${b.firstName} ${b.lastName}` }));
        this.dummyBrokers.set(formatted);
      }
    });
  }


  loadProfileData(brokerId: string) {
    /* if (this.isAdmin()) {
      this.crmService.getLeads('').subscribe({
        next: (data) => {
          if (data) {
            data.forEach((lead: any) => {
              if (lead.createdAt && !lead.createdAt.endsWith('Z')) lead.createdAt += 'Z';
              if (lead.updatedAt && !lead.updatedAt.endsWith('Z')) lead.updatedAt += 'Z';
            });
          }
          this.profileData.set({ leads: data, visits: [], activities:[] });
        },
        error: (err) => console.error('Error fetching admin data', err)
      });
    }  */
   if (this.isAdmin()) {
    this.crmService.getLeads('').subscribe({
      next: (data) => {
        if (data) {
          data.forEach((lead: any) => {
            if (lead.createdAt && !lead.createdAt.endsWith('Z')) lead.createdAt += 'Z';
            if (lead.updatedAt && !lead.updatedAt.endsWith('Z')) lead.updatedAt += 'Z';
          });
        }
        // ✅ جيب visits وactivities كمان للأدمن
        // بس الأدمن مش ليه brokerId معين، فهنجيب كلهم
        this.profileData.set({ leads: data, visits: [], activities: [] });
        this.resumeVisitIfNeeded();
        // الـ visits والactivities للأدمن مش محتاجينهم في صفحة البروفايل
        // لأن الأدمن بيتعامل مع كل العملاء مش مع بروكر معين
      }
    });
  }
    else {
      this.crmService.getBrokerProfileData(brokerId).subscribe({
        next: (data) => {
          if (data && data.leads) {
            data.leads.forEach((lead: any) => {
              if (lead.createdAt && !lead.createdAt.endsWith('Z')) lead.createdAt += 'Z';
              if (lead.updatedAt && !lead.updatedAt.endsWith('Z')) lead.updatedAt += 'Z';
            });
          }
          this.profileData.set(data);
          this.resumeVisitIfNeeded();
        },
        error: (err) => console.error('Error fetching profile data', err)
      });
    }
  }

  ngOnDestroy() {
    if (this.trackerInterval) clearInterval(this.trackerInterval);
  }

  // بيرجع الوقت المتبقي من الـ 48 ساعة تراكر، بيتحسب من آخر تحديث للـ lead (updatedAt)
  // ولو مفيش updatedAt بيرجع للـ createdAt
  getTrackerRemaining(lead: any): { text: string; expired: boolean; level: 'safe' | 'warning' | 'danger' } {
    const baseDate = lead?.updatedAt || lead?.createdAt;
    if (!baseDate) return { text: '-', expired: false, level: 'safe' };

    const deadline = new Date(baseDate).getTime() + 48 * 60 * 60 * 1000;
    const diffMs = deadline - this.nowTick();

    if (diffMs <= 0) {
      return { text: 'Tracker Expired', expired: true, level: 'danger' };
    }

    const hours = Math.floor(diffMs / (60 * 60 * 1000));
    const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
    const level = hours >= 24 ? 'safe' : hours >= 6 ? 'warning' : 'danger';

    return { text: `${hours}h ${minutes}m left`, expired: false, level };
  }

  toggleHideLead(leadId: number, event?: Event) {
    if (event) event.stopPropagation();
    let current = [...this.hiddenLeads()];
    
    if (current.includes(leadId)) {
      current = current.filter(id => id !== leadId); // لو مخفي، نظهره
    } else {
      current.push(leadId); // لو ظاهر، نخفيه
    }
    
    this.hiddenLeads.set(current);
    localStorage.setItem('crm_hidden_leads', JSON.stringify(current));
  }

  // 👇 دالة موافقة الأدمن على العميل المتكرر (زي ما عملناها في البايبلاين)
  approveDuplicate(leadId: number) {
    this.alertService.confirm('Approve this duplicate lead?', () => {
      this.alertService.showLoading('Approving...');
      this.crmService.approveDuplicateLead(leadId).subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('Lead Approved!');
          this.loadProfileData(''); // ريفريش لبيانات الأدمن
        },
        error: () => {
          this.alertService.close();
          this.alertService.error('Failed to approve lead.');
        }
      });
    });
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

  clearFilters() {
    this.searchQuery.set('');
    this.filterCampaign.set('');
    this.filterStage.set('');
    this.filterZone.set('');
    this.filterTrackerStatus.set('');
    this.filterCreationDate.set('');
    this.filterBroker.set('');
    this.filterLastUpdate.set('');
    this.filterMinBudget.set(null);
    this.filterMaxBudget.set(null);
    this.filterReferredBy.set('');
    this.filterPropertyType.set('');
this.filterListingType.set('');
this.filterCampaignCode.set('');
this.searchCampaignCode.set('');
  }

  // دالة لاستخراج الفيدباك من المكالمات
  extractFeedback(notes: string): string | null {
    if (!notes) return null;
    const parts = notes.split('[Feedback]:');
    return parts.length > 1 ? parts[1].trim() : null;
  }

  // دالة لاستخراج الملاحظات الأصلية
 extractOriginalNotes(notes: string): string | null {
  if (!notes) return null;
  let cleaned = notes.replace(/^\[Admin:[^\]]*\]\n?/, '');
  const parts = cleaned.split('[Feedback]:');
  return parts[0].trim() !== '' ? parts[0].trim() : null;
}

cleanAdminPrefix(text: string | null): string | null {
  if (!text) return null;
  return text.replace(/^\[Admin:[^\]]*\]\s?/, '');
}

  formatDateForFilter(dateString: string): string {
    if (!dateString) return '';
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  toggleFavouriteLead(id: number) {
    const isFav = this.favouriteLeads().includes(id);

    if (isFav) {
      this.crmService.removeFavorite(this.currentBrokerId, id).subscribe({
        next: () => {
          this.favouriteLeads.update(ids => ids.filter(x => x !== id));
          localStorage.setItem('crm_favourite_leads', JSON.stringify(this.favouriteLeads()));
        },
        error: () => console.error('Failed to remove favorite')
      });
    } else {
      this.crmService.addFavorite(this.currentBrokerId, id).subscribe({
        next: () => {
          this.favouriteLeads.update(ids => [...ids, id]);
          localStorage.setItem('crm_favourite_leads', JSON.stringify(this.favouriteLeads()));
        },
        error: () => console.error('Failed to add favorite')
      });
    }
  }

  // ===================== Request Leads (نفس فكرة مودال Get Recommendation بالظبط) =====================
  showRequestLeadsModal = signal<boolean>(false);
  isSubmittingRequest = signal<boolean>(false);

  requestLeadsForm: {
    cities: string[];
    listingTypes: string[];
    propertyTypes: string[];
    minRooms: string; maxRooms: string;
    minBathrooms: string; maxBathrooms: string;
  } = {
    cities: [],
    listingTypes: [],
    propertyTypes: [],
    minRooms: '', maxRooms: '',
    minBathrooms: '', maxBathrooms: ''
  };


  // =====================================================================
  // 🟢 Add Visit (من بروفايل الـ CRM) - بيدوّر على العميل برقمه الأول
  // =====================================================================
  showVisitModal = signal<boolean>(false);
  visitPhoneQuery = signal<string>('');
  visitSelectedLead = signal<any>(null);
  // idle | checking | other | none
  visitLookupState = signal<'idle' | 'checking' | 'other' | 'none'>('idle');
  visitSaving = signal<boolean>(false);
  visitRegions = signal<string[]>([]);
  visitProjects = signal<string[]>([]);
  visitForm!: FormGroup;
  private visitLookupTimer: any;
  private readonly VISIT_DRAFT_KEY = 'addVisitDraft';
  private readonly VISIT_RESUME_KEY = 'addVisitResume';

  private digitsTail(phone: string): string {
    const d = (phone || '').replace(/\D/g, '');
    return d.length > 10 ? d.slice(-10) : d;
  }

  // العملاء اللي عند البروكر ده (من غير المتكرر المستني موافقة)
  private myVisitLeads = computed(() => {
    const leads = this.profileData()?.leads || [];
    return leads.filter((l: any) => !(l.isDuplicate && !l.isApprovedDuplicate) && !l.isUnassigned);
  });

  // الاقتراحات اللي بتظهر وهو بيكتب الرقم
  visitSuggestions = computed(() => {
    const q = this.visitPhoneQuery().replace(/\D/g, '');
    if (!q || this.visitSelectedLead()) return [];
    return this.myVisitLeads()
      .filter((l: any) => (l.phoneNumber || '').replace(/\D/g, '').includes(q))
      .slice(0, 8);
  });

  private buildVisitForm() {
    this.visitForm = this.fb.group({
      visitDate: ['', Validators.required],
      location: ['', Validators.required],
      visitType: ['', Validators.required],
      zoneId: ['', Validators.required],
      listingType: ['', Validators.required],
      region: [''],
      project: [''],
      propertyCode: [''],
      propertyName: [''],
      brokerPhone: [''],
      notes: [''],
      status: [''],
      feedback: ['']
    });

    this.visitForm.get('visitDate')?.valueChanges.subscribe(v => {
      const past = v ? new Date(v).getTime() <= Date.now() : false;
      const st = this.visitForm.get('status'); const fb = this.visitForm.get('feedback');
      if (past) { st?.setValidators(Validators.required); }
      else { st?.clearValidators(); st?.setValue('', { emitEvent: false }); fb?.clearValidators(); fb?.setValue('', { emitEvent: false }); }
      st?.updateValueAndValidity({ emitEvent: false }); fb?.updateValueAndValidity({ emitEvent: false });
    });
    this.visitForm.get('status')?.valueChanges.subscribe(st => {
      const fb = this.visitForm.get('feedback');
      if (st === 'Completed') fb?.setValidators(Validators.required); else fb?.clearValidators();
      fb?.updateValueAndValidity({ emitEvent: false });
    });
    this.visitForm.get('zoneId')?.valueChanges.subscribe(z => {
      this.visitForm.patchValue({ region: '', project: '' });
      this.loadVisitRegionsProjects(z);
    });
    this.visitForm.get('listingType')?.valueChanges.subscribe(t => {
      this.visitForm.patchValue({ region: '', project: '' });
      const r = this.visitForm.get('region'); const p = this.visitForm.get('project');
      r?.clearValidators(); p?.clearValidators();
      if (t === 'Resale') r?.setValidators(Validators.required);
      else if (t === 'Primary' || t === 'Resale Project') p?.setValidators(Validators.required);
      r?.updateValueAndValidity(); p?.updateValueAndValidity();
    });
    this.visitForm.get('visitType')?.valueChanges.subscribe(t => {
      const c = this.visitForm.get('propertyCode');
      if (t === 'Broker') c?.setValidators(Validators.required); else c?.clearValidators();
      c?.updateValueAndValidity();
    });
  }

  private loadVisitRegionsProjects(zoneId: any) {
    this.visitRegions.set([]); this.visitProjects.set([]);
    if (!zoneId) return;
    this.adminService.getRegions(Number(zoneId)).subscribe({
      next: (r: any[]) => this.visitRegions.set((r || []).map(x => x.name).sort()),
      error: () => this.visitRegions.set([])
    });
    this.adminService.getProjects(undefined, Number(zoneId)).subscribe({
      next: (p: any[]) => this.visitProjects.set((p || []).map(x => x.name).sort()),
      error: () => this.visitProjects.set([])
    });
  }

  get showVisitRegion() { return ['Resale', 'Rent'].includes(this.visitForm?.get('listingType')?.value); }
  get showVisitProject() { return ['Primary', 'Resale Project', 'Rent'].includes(this.visitForm?.get('listingType')?.value); }
  get isVisitDatePast(): boolean {
    const v = this.visitForm?.get('visitDate')?.value;
    return v ? new Date(v).getTime() <= Date.now() : false;
  }

  openAddVisitModal() {
    if (!this.visitForm) this.buildVisitForm();
    this.visitForm.reset({
      visitDate: '', location: '', visitType: '', zoneId: '', listingType: '', region: '', project: '',
      propertyCode: '', propertyName: '', brokerPhone: '', status: '', feedback: '',
      notes: this.isAdmin() ? `[Admin: ${this.currentAdminName()}]\n` : ''
    });
    this.visitPhoneQuery.set('');
    this.visitSelectedLead.set(null);
    this.visitLookupState.set('idle');
    this.showVisitModal.set(true);
  }

  closeAddVisitModal() {
    clearTimeout(this.visitLookupTimer);
    this.showVisitModal.set(false);
  }

  private currentAdminName(): string {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.username || ((u.firstName || '') + ' ' + (u.lastName || '')).trim() || 'Admin';
    } catch { return 'Admin'; }
  }

  onVisitPhoneInput(value: string) {
    this.visitPhoneQuery.set(value);
    this.visitSelectedLead.set(null);
    this.visitLookupState.set('idle');
    clearTimeout(this.visitLookupTimer);

    const digits = (value || '').replace(/\D/g, '');
    if (digits.length < 10) return;

    // لو الرقم موجود عند البروكر في الليستة المحلية مش محتاجين نسأل السيرفر - بيظهر في الاقتراحات
    const tail = this.digitsTail(value);
    const local = this.myVisitLeads().find((l: any) => this.digitsTail(l.phoneNumber) === tail);
    if (local) return;

    this.visitLookupState.set('checking');
    this.visitLookupTimer = setTimeout(() => {
      this.crmService.checkLeadPhone(value, this.currentBrokerId).subscribe({
        next: (res) => {
          if (this.visitPhoneQuery() !== value) return; // الرقم اتغير تاني
          if (res.status === 'mine') {
            this.selectVisitLead({ id: res.leadId, fullName: res.fullName, phoneNumber: res.phoneNumber, brokerId: this.currentBrokerId });
          } else {
            this.visitLookupState.set(res.status === 'other' ? 'other' : 'none');
          }
        },
        error: () => { this.visitLookupState.set('idle'); this.alertService.error('Could not check this number. Please try again.'); }
      });
    }, 400);
  }

  selectVisitLead(lead: any) {
    this.visitSelectedLead.set(lead);
    this.visitPhoneQuery.set(lead.phoneNumber);
    this.visitLookupState.set('idle');
  }

  clearVisitLead() {
    this.visitSelectedLead.set(null);
    this.visitPhoneQuery.set('');
    this.visitLookupState.set('idle');
  }

  // عميل جديد: نحفظ اللي اتكتب في المودال ونروح لصفحة Add Lead (وهترجعنا بعد الحفظ)
  goAddLeadFromVisit() {
    try {
      sessionStorage.setItem(this.VISIT_DRAFT_KEY, JSON.stringify(this.visitForm.getRawValue()));
    } catch {}
    const phone = this.visitPhoneQuery().trim();
    this.showVisitModal.set(false);
    this.router.navigate(['/crm/add-lead'], { queryParams: { fromVisit: 1, phone } });
  }

  // بيتنادى بعد ما البروفايل يتحمل: لو راجعين من Add Lead نفتح المودال تاني بنفس البيانات
  private resumeVisitIfNeeded() {
    let resume: any = null;
    try {
      const raw = sessionStorage.getItem(this.VISIT_RESUME_KEY);
      if (raw) resume = JSON.parse(raw);
    } catch {}
    if (!resume) return;
    sessionStorage.removeItem(this.VISIT_RESUME_KEY);

    let draft: any = null;
    try {
      const raw = sessionStorage.getItem(this.VISIT_DRAFT_KEY);
      if (raw) draft = JSON.parse(raw);
    } catch {}
    sessionStorage.removeItem(this.VISIT_DRAFT_KEY);

    this.openAddVisitModal();
    if (draft) {
      const zone = draft.zoneId; const listing = draft.listingType; const region = draft.region; const project = draft.project;
      this.visitForm.patchValue({ ...draft, zoneId: zone, listingType: listing, region: '', project: '' });
      // الـ valueChanges بتصفّر المنطقة والمشروع، فبنرجعهم بعد ما القوائم تتحمل
      setTimeout(() => this.visitForm.patchValue({ region, project }), 700);
    }
    const found = (this.profileData()?.leads || []).find((l: any) => l.id === resume.leadId);
    this.selectVisitLead(found || { id: resume.leadId, fullName: resume.fullName, phoneNumber: resume.phoneNumber, brokerId: resume.brokerId });
  }

  submitAddVisit() {
    const lead = this.visitSelectedLead();
    if (!lead || this.visitForm.invalid || this.visitSaving()) return;

    const data: any = { ...this.visitForm.getRawValue() };
    data.leadId = lead.id;
    data.brokerId = lead.brokerId || this.currentBrokerId;
    data.zoneId = data.zoneId ? Number(data.zoneId) : 0;

    this.visitSaving.set(true);
    this.alertService.showLoading('Saving visit...');
    this.crmService.scheduleVisit(data).subscribe({
      next: () => {
        this.visitSaving.set(false);
        this.alertService.close();
        this.alertService.success('Visit scheduled successfully!');
        this.showVisitModal.set(false);
        this.loadProfileData(this.isAdmin() ? '' : this.currentBrokerId);
      },
      error: () => {
        this.visitSaving.set(false);
        this.alertService.close();
        this.alertService.error('Error scheduling visit.');
      }
    });
  }

  openRequestLeadsModal() {
    this.requestLeadsForm = {
      cities: [], listingTypes: [], propertyTypes: [],
      minRooms: '', maxRooms: '', minBathrooms: '', maxBathrooms: ''
    };
    this.showRequestLeadsModal.set(true);
  }

  closeRequestLeadsModal() {
    this.showRequestLeadsModal.set(false);
  }

  isRequestValueSelected(list: string[], value: string): boolean {
    return list.includes(value);
  }

  toggleRequestValue(list: string[], value: string) {
    const idx = list.indexOf(value);
    if (idx > -1) list.splice(idx, 1);
    else list.push(value);
  }

  formatRequestPrice(event: any) {
    const input = event.target;
    const raw = input.value.replace(/[^0-9]/g, '');
    input.value = raw ? Number(raw).toLocaleString('en-US') : '';
  }

  submitRequestLeads(minBudgetEl: HTMLInputElement, maxBudgetEl: HTMLInputElement) {
    const f = this.requestLeadsForm;
    const minBudget = minBudgetEl?.value?.replace(/,/g, '');
    const maxBudget = maxBudgetEl?.value?.replace(/,/g, '');

    const dto = {
      cities: f.cities,
      listingTypes: f.listingTypes,
      propertyTypes: f.propertyTypes,
      minRooms: f.minRooms ? Number(f.minRooms) : null,
      maxRooms: f.maxRooms ? Number(f.maxRooms) : null,
      minBathrooms: f.minBathrooms ? Number(f.minBathrooms) : null,
      maxBathrooms: f.maxBathrooms ? Number(f.maxBathrooms) : null,
      minBudget: minBudget ? Number(minBudget) : null,
      maxBudget: maxBudget ? Number(maxBudget) : null
    };

    this.isSubmittingRequest.set(true);
    this.crmService.submitBrokerLeadRequest(this.currentBrokerId, dto).subscribe({
      next: () => {
        this.isSubmittingRequest.set(false);
        this.showRequestLeadsModal.set(false);
        this.alertService.success('Your request has been sent to the admin. We will get back to you soon!');
      },
      error: () => {
        this.isSubmittingRequest.set(false);
        this.alertService.error('Failed to submit your request. Please try again.');
      }
    });
  }
}