import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CrmService } from '../../../Services/crm.services';
import { AdminService } from '../../../Services/admin';
import { AuthService } from '../../../Services/auth';
import { AlertService } from '../../../Services/alert';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-crm-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './crm-dashboard.html',
  styleUrls: ['./crm-dashboard.css'] // لو عندك ملف ستايل، لو مفيش ممكن تمسحي السطر ده
})
export class CrmDashboardComponent implements OnInit {
  private crmService = inject(CrmService);
  private adminService = inject(AdminService);
  public authService = inject(AuthService);
  private alertService = inject(AlertService);
  private router = inject(Router);

  isAdmin = signal<boolean>(false);
  activeTab = signal<'brokers' | 'clients' | 'calendar' | 'closed_deals' | 'requests' | 'revenue' | 'all_visits' | 'all_activities' | 'closing_stage' | 'add_broker'  | 'transfer_leads'>('brokers');

  dummyBrokers = [
    { code: 'X7', name: 'Abdelrahman Ashraf' },
    { code: 'X10', name: 'Menna Ameen' },
    { code: 'X249', name: 'Ashraf Saad' },
    { code: 'X646', name: 'Nadia Salem' },
    { code: 'X9', name: 'Hussein Ehab' },
    { code: 'X652', name: 'Mohamed Ali' },
    { code: 'X653', name: 'Mohamed Khaled' },
    { code: 'X656', name: 'Mayar Elkhalil' },
    { code: 'X659', name: 'Yasmin Mohamed' },
    { code: 'X660', name: 'Ahmed Ramadan' },
    {code: 'X661', name: 'Ibrahim Mahmoud'},
    {code: 'X665', name: 'Belal Elsayed'},
    {code: 'X666', name: 'Mahmoud Ali'},
    {code: 'X668', name: 'Mostafa Elsayed'},
    {code: 'X2', name: 'Hager Mohammed'},
    {code: 'X2', name: 'Hagar Mohamed issa'},
    {code: 'X101', name: 'Alaa Ashraf'},
    {code: 'X8', name: 'Abeer Ashraf'},

  ];

  // الداتا الأساسية
  allLeads = signal<any[]>([]);
  vipBrokers = signal<any[]>([]);

  allBrokersList = signal<any[]>([]); // كل البروكرز اللي في السيستم
selectedBrokerToAdd = signal<string>(''); // البروكر اللي الأدمن اختاره من القائمة

// 🟢 فلتر بيجيب البروكرز اللي معندهمش صلاحية بس
availableBrokersToAdd = computed(() => {
  const vipIds = this.vipBrokers().map(v => v.id);
  return this.allBrokersList().filter(b => !vipIds.includes(b.id) && b.isActive);
});

systemTotalLeads = computed(() => this.baseFilteredLeads().length);
systemClosedDeals = computed(() => this.baseFilteredLeads().filter(l => l.statusId === 19).length);
systemExpectedRevenue = computed(() => this.baseFilteredLeads().reduce((sum, lead) => sum + (lead.totalAmount || 0), 0));
systemRequests = computed(() => this.baseFilteredLeads().filter(l => l.statusId === 4).length);
systemClosing = computed(() => this.baseFilteredLeads().filter(l => l.statusId === 18).length);
systemVisits = computed(() => this.baseFilteredLeads().reduce((sum, l) => sum + (l.visitsCount || 0), 0));
systemActivities = computed(() => this.baseFilteredLeads().reduce((sum, l) => sum + (l.activitiesCount || 0), 0));

  // 🟢 1. فلاتر ولوجيك تاب البروكرز
  searchBroker = signal<string>('');

  globalBrokerFilter = signal<string>(''); 

  selectedLeadsForTransfer = signal<number[]>([]);
  targetBrokerForTransfer = signal<string>('');

  baseFilteredLeads = computed(() => {
  const broker = this.globalBrokerFilter();
  if (!broker) return this.allLeads();
  return this.allLeads().filter(l => l.brokerName === broker);
});

// 🟢 الداتا الأساسية للأحداث (الكاليندر) بعد تطبيق فلتر البروكر
baseFilteredEvents = computed(() => {
  const broker = this.globalBrokerFilter();
  if (!broker) return this.calendarEvents();
  return this.calendarEvents().filter(e => e.brokerName === broker);
});
  
  brokersStats = computed(() => {
    let stats = this.vipBrokers().map(broker => {
      const bName = broker.firstName + ' ' + broker.lastName;
      const myLeads = this.allLeads().filter(l => l.brokerName === bName);
      
      // 🟢 دالة سحرية لتنظيف الأسماء من المسافات الزايدة وتوحيد الحروف للمطابقة
      const normalizeName = (name: string) => name.toLowerCase().replace(/\s+/g, '').trim();
      const dbNameClean = normalizeName(bName);

      // 🟢 البحث عن الكود باستخدام الاسم المتنظف
      const foundBroker = this.dummyBrokers.find(d => normalizeName(d.name) === dbNameClean);
      const bCode = foundBroker ? foundBroker.code : 'N/A';

      // تجميع التقسيمات 
      const callsTotal = myLeads.reduce((sum, l) => sum + (l.activitiesCount || 0), 0);
      const callsDone = myLeads.reduce((sum, l) => sum + (l.completedActivities || 0), 0);
      const callsPend = myLeads.reduce((sum, l) => sum + (l.pendingActivities || 0), 0);
      const callsCanc = myLeads.reduce((sum, l) => sum + (l.cancelledActivities || 0), 0);
      const callsResch = myLeads.reduce((sum, l) => sum + (l.rescheduledActivities || 0), 0);

      const visitsTotal = myLeads.reduce((sum, l) => sum + (l.visitsCount || 0), 0);
      const visitsDone = myLeads.reduce((sum, l) => sum + (l.completedVisits || 0), 0);
      const visitsPend = myLeads.reduce((sum, l) => sum + (l.pendingVisits || 0), 0);
      const visitsCanc = myLeads.reduce((sum, l) => sum + (l.cancelledVisits || 0), 0);
      const visitsResch = myLeads.reduce((sum, l) => sum + (l.rescheduledVisits || 0), 0);

      const closedDeals = myLeads.filter(l => l.statusId === 19);

      return {
        ...broker,
        fullName: bName,
        brokerCode: bCode,
        leads: myLeads,
        totalLeads: myLeads.length,
        
        totalCalls: callsTotal, callsDone, callsPend, callsCanc, callsResch,
        totalVisits: visitsTotal, visitsDone, visitsPend, visitsCanc, visitsResch,
        
        closedDeals: closedDeals,
        isExpanded: false 
      };
    });

    const q = this.searchBroker().toLowerCase();
    const sPerson = this.globalBrokerFilter();

    if (q) stats = stats.filter(b => b.fullName.toLowerCase().includes(q) || (b.phoneNumber && b.phoneNumber.includes(q)));
    if (sPerson) stats = stats.filter(b => b.fullName === sPerson);

    if (this.isAdmin() && !this.showHiddenItems()) {
      stats = stats.filter(b => !this.hiddenBrokers().includes(b.id));
    }

    return stats;
  });

  // 🟢 2. فلاتر ولوجيك تاب العملاء
  searchClient = signal<string>('');
  filterClientStage = signal<string>('');
  
  filteredClients = computed(() => {
    let leads = this.allLeads();
    const q = this.searchClient().toLowerCase();
    const stage = this.filterClientStage();
    const broker = this.globalBrokerFilter();

    if (q) leads = leads.filter(l => l.fullName.toLowerCase().includes(q) || l.phoneNumber.includes(q));
    if (stage) leads = leads.filter(l => l.statusId.toString() === stage);
    if (broker) leads = leads.filter(l => l.brokerName === broker);
    if (!this.showHiddenItems()) {
      leads = leads.filter(l => !this.hiddenLeads().includes(l.id));
    }

    return leads;
  });

  // المودال
  selectedRequest = signal<any>(null);

  stages =[
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


  // ================= 🟢 متغيرات الكاليندر (النتيجة) =================
  calendarEvents = signal<any[]>([]);
  currentMonth = signal<Date>(new Date());
  selectedEvent = signal<any>(null);
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  calendarDays = computed(() => {
    const year = this.currentMonth().getFullYear();
    const month = this.currentMonth().getMonth();
    const firstDay = new Date(year, month, 1).getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate(); 
    
    const days = [];
    for (let i = 0; i < firstDay; i++) { days.push({ date: null, events: [] }); }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDateStr = new Date(year, month, i).toISOString().split('T')[0];
      const dayEvents = this.calendarEvents().filter(e => {
        if (!e.date) return false;
        const evDate = new Date(e.date);
        return evDate.getFullYear() === year && evDate.getMonth() === month && evDate.getDate() === i;
      });
      days.push({ date: i, fullDate: currentDateStr, events: dayEvents });
    }
    return days;
  });


  closedDealsList = computed(() => this.baseFilteredLeads().filter(l => l.statusId === 19));
requestsList = computed(() => this.baseFilteredLeads().filter(l => l.statusId === 4));
closingStageList = computed(() => this.baseFilteredLeads().filter(l => l.statusId === 18));
revenueList = computed(() => this.baseFilteredLeads().filter(l => l.totalAmount > 0).sort((a, b) => b.totalAmount - a.totalAmount));

//allVisitsList = computed(() => this.baseFilteredEvents().filter(e => e.type === 'Visit').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
allVisitsList = computed(() => {
  let visits = this.baseFilteredEvents().filter(e => e.type === 'Visit');
  if (!this.showHiddenItems()) visits = visits.filter(v => !this.hiddenTasks().includes('Visit_' + v.id));
  return visits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});
//allActivitiesList = computed(() => this.baseFilteredEvents().filter(e => e.type !== 'Visit').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

allActivitiesList = computed(() => {
  let activities = this.baseFilteredEvents().filter(e => e.type !== 'Visit');
  if (!this.showHiddenItems()) activities = activities.filter(a => !this.hiddenTasks().includes(a.type + '_' + a.id));
  return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});


hiddenLeads = signal<number[]>([]);
  hiddenTasks = signal<string[]>([]); // صيغته: 'visit_1' أو 'activity_2'
  showHiddenItems = signal<boolean>(false);
  hiddenBrokers = signal<string[]>([]);


  ngOnInit() {
    // 1. حماية الصفحة: لو مش أدمن، اطرده
    const userString = localStorage.getItem('user');
    if (!userString) { this.router.navigate(['/home']); return; }
    
    const user = JSON.parse(userString);
    const roles = user.roles ||[];
    const isUserAdmin = roles.includes('Admin') || user.userType === 2 || user.userType === 'Admin';

    const sLeads = localStorage.getItem('crm_hidden_leads');
    if (sLeads) this.hiddenLeads.set(JSON.parse(sLeads));

    const sBrokers = localStorage.getItem('crm_hidden_brokers');
    if (sBrokers) this.hiddenBrokers.set(JSON.parse(sBrokers));
    
    const sTasks = localStorage.getItem('crm_hidden_tasks');
    if (sTasks) this.hiddenTasks.set(JSON.parse(sTasks));
    
    if (!isUserAdmin) {
      this.router.navigate(['/home']);
      return;
    }

    this.isAdmin.set(true);
    this.loadAdminData();
  }

  loadAdminData() {
    this.alertService.showLoading('Loading CRM Data...');
    
    // 🟢 بنجيب المستخدمين والعملاء في نفس الوقت
    forkJoin({
      users: this.adminService.getAllUsers(),
      leads: this.crmService.getLeads(''),
      calendar: this.crmService.getAdminCalendarEvents() // ID فاضي يعني هات كل العملاء
    }).subscribe({
      next: ({ users, leads, calendar }) => {
        
        // 🟢 1. بنفلتر كل البروكرز من المستخدمين (UserType === 1) ونحفظهم
        const brokers = users.filter((u: any) => u.userType === 1);
        this.allBrokersList.set(brokers);

        // 🟢 2. بنجيب البروكرز اللي معاهم الصلاحية فقط من الداتا بيز
        const vipUsers = brokers.filter((u: any) => u.hasCrmAccess === true);
        this.vipBrokers.set(vipUsers);

        // تظبيط توقيت العملاء
        leads.forEach((lead: any) => {
          if (lead.createdAt && !lead.createdAt.endsWith('Z')) lead.createdAt += 'Z';
          if (lead.updatedAt && !lead.updatedAt.endsWith('Z')) lead.updatedAt += 'Z';
        });
        this.allLeads.set(leads);
        
        calendar.forEach((e: any) => {
          if (e.date && !e.date.endsWith('Z')) e.date += 'Z';
        });
        this.calendarEvents.set(calendar);
        
        this.alertService.close();
      },
      error: (err) => {
        console.error(err);
        this.alertService.close();
        this.alertService.error('Failed to load CRM data.');
      }
    });
  }

  isSidebarOpen = signal<boolean>(false);

  toggleSidebar() {
    this.isSidebarOpen.update(val => !val);
  }

  toggleHideBroker(brokerId: string) {
    let current = [...this.hiddenBrokers()];
    current.includes(brokerId) ? current = current.filter(x => x !== brokerId) : current.push(brokerId);
    this.hiddenBrokers.set(current);
    localStorage.setItem('crm_hidden_brokers', JSON.stringify(current));
  }

  toggleHideLead(id: number) {
    let current = [...this.hiddenLeads()];
    current.includes(id) ? current = current.filter(x => x !== id) : current.push(id);
    this.hiddenLeads.set(current);
    localStorage.setItem('crm_hidden_leads', JSON.stringify(current));
  }

  toggleHideTask(id: number, type: string) {
    const key = `${type}_${id}`;
    let current = [...this.hiddenTasks()];
    current.includes(key) ? current = current.filter(x => x !== key) : current.push(key);
    this.hiddenTasks.set(current);
    localStorage.setItem('crm_hidden_tasks', JSON.stringify(current));
  }

  // دالة بتقفل القائمة أوتوماتيك لما اليوزر يختار تاب في الموبايل
  switchTab(tab: any) {
    this.activeTab.set(tab);
    if (window.innerWidth <= 991) {
      this.isSidebarOpen.set(false);
    }
  }


  grantAccess() {
  const userId = this.selectedBrokerToAdd();
  if (!userId) return;

  this.alertService.showLoading('Granting access...');
  this.adminService.grantCrmAccess(userId).subscribe({
    next: () => {
      this.alertService.close();
      this.alertService.success('Broker added to CRM successfully!');
      this.selectedBrokerToAdd.set('');
      this.loadAdminData(); // تحديث القوائم فوراً
    }
  });
}

revokeAccess(userId: string) {
  this.alertService.confirm('Are you sure you want to remove CRM access from this broker?', () => {
    this.alertService.showLoading('Revoking access...');
    this.adminService.revokeCrmAccess(userId).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('CRM access removed.');
        this.loadAdminData();
      }
    });
  });
}

  toggleBrokerExpand(brokerIndex: number) {
    // فتح وقفل قائمة العملاء جوا صف البروكر
    const stats = this.brokersStats();
    stats[brokerIndex].isExpanded = !stats[brokerIndex].isExpanded;
  }

  clearBrokerFilters() {
    this.searchBroker.set('');
    //this.filterSalesPerson.set('');
    this.globalBrokerFilter.set('');
    
  }

  openRequestModal(lead: any) {
    this.selectedRequest.set(lead);
    const bootstrap = (window as any).bootstrap;
    new bootstrap.Modal(document.getElementById('requestModal')).show();
  }

  clearClientFilters() {
    this.searchClient.set('');
    this.filterClientStage.set('');
    //this.filterClientBroker.set('');
    this.globalBrokerFilter.set('');
  }

  changeMonth(offset: number) {
    const current = this.currentMonth();
    this.currentMonth.set(new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  openEventDetails(evt: any) {
    this.selectedEvent.set(evt);
    const bootstrap = (window as any).bootstrap;
    new bootstrap.Modal(document.getElementById('eventModal')).show();
  }

  toggleLeadSelection(leadId: number) {
    let current = [...this.selectedLeadsForTransfer()];
    if (current.includes(leadId)) {
      current = current.filter(id => id !== leadId);
    } else {
      current.push(leadId);
    }
    this.selectedLeadsForTransfer.set(current);
  }

  // تحديد/إلغاء تحديد الكل (بناءً على الفلتر الحالي)
  toggleSelectAll(event: any) {
    if (event.target.checked) {
      const allFilteredIds = this.filteredClients().map(l => l.id);
      this.selectedLeadsForTransfer.set(allFilteredIds);
    } else {
      this.selectedLeadsForTransfer.set([]);
    }
  }

  // تنفيذ النقل المجمع
  executeBulkTransfer() {
    const leadIds = this.selectedLeadsForTransfer();
    const newBroker = this.targetBrokerForTransfer();
    
    if (leadIds.length === 0 || !newBroker) return;

    this.alertService.confirm(`Are you sure you want to transfer ${leadIds.length} leads to the selected broker?`, () => {
      this.alertService.showLoading('Transferring leads...');
      
      const adminString = localStorage.getItem('user');
      const adminId = adminString ? JSON.parse(adminString).id : '';

      this.crmService.bulkTransferLeads(leadIds, newBroker, adminId).subscribe({
        next: (res) => {
          this.alertService.close();
          this.alertService.success(res.message);
          this.selectedLeadsForTransfer.set([]); // تفريغ التحديد
          this.targetBrokerForTransfer.set(''); // تفريغ البروكر
          this.loadAdminData(); // تحديث الداتا كلها
        },
        error: () => {
          this.alertService.close();
          this.alertService.error('Failed to transfer leads.');
        }
      });
    });
  }
}