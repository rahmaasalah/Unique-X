import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // 👈 استيراد FormsModule مهم للفلاتر
import { CrmService } from '../../../Services/crm.services';
import { AlertService } from '../../../Services/alert';
import { AuthService } from '../../../Services/auth';
import { Router } from '@angular/router';
import { AdminService } from '../../../Services/admin'; // 👈 استيراد AdminService

@Component({
  selector: 'app-broker-profile',
  standalone: true,
  imports:[CommonModule, RouterModule, FormsModule], // 👈 ضفنا FormsModule هنا
  templateUrl: './broker-profile.html',
  styleUrls: ['./broker-profile.css']
})
export class BrokerProfileComponent implements OnInit {
  private crmService = inject(CrmService);
  private alertService = inject(AlertService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private adminService = inject(AdminService);
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

  // 🟢 الفلاتر
 searchQuery = signal<string>('');
  filterCampaign = signal<string>('');
  filterStage = signal<string>('');
  filterZone = signal<string>('');
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
  const codes = this.campaignsList()
    .map((c: any) => c.name)
    .filter((name: string) => name !== 'No Campaign');
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

  // 👇 نقلنا تعريف المناطق هنا عشان الـ HTML يقدر يشوفه
  zones =[
    { id: 1, name: 'Cairo' },
    { id: 2, name: 'Alexandria' },
    { id: 3, name: 'North Coast' }
  ];

  dummyBrokers = [
    { code: 'X7', name: 'Abdelrahman Ashraf' },
    { code: 'X10', name: 'Menna Ameen' },
    { code: 'X249', name: 'Ashraf Saad' },
    { code: 'X646', name: 'Nadia Salem' },
    { code: 'X9', name: 'Hussine Ehab' },
    { code: 'X652', name: 'Mohamed Ali' },
    { code: 'X653', name: 'Mohamed Khaled' },
    { code: 'X656', name: 'Mayar Elkhalil' },
    { code: 'X659', name: 'Yasmine Mohamed' },
    { code: 'X660', name: 'Ahmed Ramadan' },
    {code: 'X661', name: 'Ibrahim Mahmoud'},
    {code: 'X665', name: 'Belal Elsayed'},
    {code: 'X666', name: 'Mohmoud Ali'},
    {code: 'X668', name: 'Mostafa Elsayed'},
    {code: 'X2', name: 'Hagar Mohamed'},
    {code: 'X101', name: 'Alaa Ashraf'},
    {code: 'X8', name: 'Abeer Ashraf'},

  ];

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

    const q = this.searchQuery().toLowerCase();
    const broker = this.filterBroker();
    const camp = this.filterCampaign();
    const stage = this.filterStage();
    const zone = this.filterZone(); 
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
    if (zone) leads = leads.filter((l: any) => l.zoneName === zone);
    if (cDate) leads = leads.filter((l: any) => this.formatDateForFilter(l.createdAt) === cDate);
    if (uDate) leads = leads.filter((l: any) => this.formatDateForFilter(l.updatedAt || l.createdAt) === uDate);
    if (minB !== null) leads = leads.filter((l: any) => l.totalAmount >= minB);
    if (maxB !== null) leads = leads.filter((l: any) => l.totalAmount <= maxB);
    if (refBy) leads = leads.filter((l: any) => l.referredBy === refBy);
    if (propType) leads = leads.filter((l: any) => l.propertyType === propType);
if (listType) leads = leads.filter((l: any) => l.purpose === listType);
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
    this.crmService.getCampaigns().subscribe(data => this.campaignsList.set(data));
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
        },
        error: (err) => console.error('Error fetching profile data', err)
      });
    }
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
}