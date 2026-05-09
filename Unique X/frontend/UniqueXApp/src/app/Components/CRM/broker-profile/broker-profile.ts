import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // 👈 استيراد FormsModule مهم للفلاتر
import { CrmService } from '../../../Services/crm.services';
import { AlertService } from '../../../Services/alert';
import { AuthService } from '../../../Services/auth';
import { Router } from '@angular/router';

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

  brokerName = signal<string>('');
  brokerImage = signal<string>('https://cdn-icons-png.flaticon.com/512/149/149071.png');
  
  profileData = signal<any>(null);
  campaignsList = signal<any[]>([]); // 👈 لستة الحملات للفلتر

  isAdmin = signal<boolean>(false);
  currentBrokerId: string = '';

  // 🟢 الفلاتر
 searchQuery = signal<string>('');
  filterCampaign = signal<string>('');
  filterStage = signal<string>('');
  filterZone = signal<string>('');
  filterCreationDate = signal<string>('');
  filterLastUpdate = signal<string>('');
  filterMinBudget = signal<number | null>(null);
  filterMaxBudget = signal<number | null>(null);

  // 👇 نقلنا تعريف المناطق هنا عشان الـ HTML يقدر يشوفه
  zones =[
    { id: 1, name: 'Cairo' },
    { id: 2, name: 'Alexandria' },
    { id: 3, name: 'North Coast' }
  ];

  // 🟢 فلترة العملاء لحظياً
  filteredLeads = computed(() => {
    const data = this.profileData();
    if (!data || !data.leads) return[];
    let leads = data.leads;

    if (!this.isAdmin()) {
      leads = leads.filter((l: any) => !(l.isDuplicate && !l.isApprovedDuplicate));
    }


    const q = this.searchQuery().toLowerCase();
    const camp = this.filterCampaign();
    const stage = this.filterStage();
    const zone = this.filterZone(); // شيلنا الـ toLowerCase عشان يطابق الاسم بالظبط
    const cDate = this.filterCreationDate();
    const uDate = this.filterLastUpdate();
    const minB = this.filterMinBudget();
    const maxB = this.filterMaxBudget();

    if (q) leads = leads.filter((l: any) => l.fullName.toLowerCase().includes(q) || l.phoneNumber.includes(q));
    if (camp) leads = leads.filter((l: any) => l.campaignName === camp);
    if (stage) leads = leads.filter((l: any) => l.statusId.toString() === stage);
    if (zone) leads = leads.filter((l: any) => l.zoneName === zone);
    if (cDate) leads = leads.filter((l: any) => this.formatDateForFilter(l.createdAt) === cDate);
    if (uDate) leads = leads.filter((l: any) => this.formatDateForFilter(l.updatedAt || l.createdAt) === uDate);
    if (minB !== null) leads = leads.filter((l: any) => l.totalAmount >= minB);
    if (maxB !== null) leads = leads.filter((l: any) => l.totalAmount <= maxB);

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

      if (isUserAdmin) {
        this.isAdmin.set(true);
        this.brokerName.set('Admin Workspace');
        fetchId = ''; 
      } else {
        this.isAdmin.set(false);
        this.brokerName.set(user.username || 'Broker Profile');
        fetchId = this.currentBrokerId;
      }
      
      if (user.profileImageUrl) this.brokerImage.set(user.profileImageUrl);
    }
    
    this.loadProfileData(fetchId);
    this.crmService.getCampaigns().subscribe(data => this.campaignsList.set(data));
  }


  loadProfileData(brokerId: string) {
    if (this.isAdmin()) {
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

  clearFilters() {
    this.searchQuery.set('');
    this.filterCampaign.set('');
    this.filterStage.set('');
    this.filterZone.set('');
    this.filterCreationDate.set('');
    this.filterLastUpdate.set('');
    this.filterMinBudget.set(null);
    this.filterMaxBudget.set(null);
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
    const parts = notes.split('[Feedback]:');
    // 👇 لازم ترجع null عشان الـ HTML يخفي السطر
    return parts[0].trim() !== '' ? parts[0].trim() : null; 
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