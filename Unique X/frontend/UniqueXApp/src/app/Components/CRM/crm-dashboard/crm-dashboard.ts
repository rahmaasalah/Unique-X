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
  activeTab = signal<'brokers' | 'clients' | 'calendar' | 'closed_deals' | 'requests' | 'revenue' | 'all_visits' | 'all_activities' | 'closing_stage'>('brokers');

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
  
  // إحصائيات عامة للأدمن
  /* systemTotalLeads = computed(() => this.allLeads().length);
  systemClosedDeals = computed(() => this.allLeads().filter(l => l.statusId === 19).length);
  systemExpectedRevenue = computed(() => {
    return this.allLeads().reduce((sum, lead) => sum + (lead.totalAmount || 0), 0);
  });

  systemRequests = computed(() => this.allLeads().filter(l => l.statusId === 4).length); // 4 = Calls (request)
  systemClosing = computed(() => this.allLeads().filter(l => l.statusId === 18).length); // 18 = Follow up for closing
  systemVisits = computed(() => this.allLeads().reduce((sum, l) => sum + (l.visitsCount || 0), 0));
  systemActivities = computed(() => this.allLeads().reduce((sum, l) => sum + (l.activitiesCount || 0), 0)); */


systemTotalLeads = computed(() => this.baseFilteredLeads().length);
systemClosedDeals = computed(() => this.baseFilteredLeads().filter(l => l.statusId === 19).length);
systemExpectedRevenue = computed(() => this.baseFilteredLeads().reduce((sum, lead) => sum + (lead.totalAmount || 0), 0));
systemRequests = computed(() => this.baseFilteredLeads().filter(l => l.statusId === 4).length);
systemClosing = computed(() => this.baseFilteredLeads().filter(l => l.statusId === 18).length);
systemVisits = computed(() => this.baseFilteredLeads().reduce((sum, l) => sum + (l.visitsCount || 0), 0));
systemActivities = computed(() => this.baseFilteredLeads().reduce((sum, l) => sum + (l.activitiesCount || 0), 0));

  // 🟢 1. فلاتر ولوجيك تاب البروكرز
  searchBroker = signal<string>('');
  //filterSalesPerson = signal<string>('');

  globalBrokerFilter = signal<string>(''); 

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
    //const sPerson = this.filterSalesPerson();
    const sPerson = this.globalBrokerFilter();

    if (q) stats = stats.filter(b => b.fullName.toLowerCase().includes(q) || (b.phoneNumber && b.phoneNumber.includes(q)));
    if (sPerson) stats = stats.filter(b => b.fullName === sPerson);

    return stats;
  });

  // 🟢 2. فلاتر ولوجيك تاب العملاء
  searchClient = signal<string>('');
  filterClientStage = signal<string>('');
  //filterClientBroker = signal<string>('');
  
  filteredClients = computed(() => {
    let leads = this.allLeads();
    const q = this.searchClient().toLowerCase();
    const stage = this.filterClientStage();
    //const broker = this.filterClientBroker();
    const broker = this.globalBrokerFilter();

    if (q) leads = leads.filter(l => l.fullName.toLowerCase().includes(q) || l.phoneNumber.includes(q));
    if (stage) leads = leads.filter(l => l.statusId.toString() === stage);
    if (broker) leads = leads.filter(l => l.brokerName === broker);

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

  /* closedDealsList = computed(() => this.allLeads().filter(l => l.statusId === 19));
  
  // 2. الطلبات (Calls request = 4)
  requestsList = computed(() => this.allLeads().filter(l => l.statusId === 4));
  
  // 3. مرحلة الإغلاق (Follow up for closing = 18)
  closingStageList = computed(() => this.allLeads().filter(l => l.statusId === 18));
  
  // 4. تفاصيل الأرباح المتوقعة (כל العملاء اللي ليهم ميزانية) مرتبين من الأغلى للأرخص
  revenueList = computed(() => this.allLeads().filter(l => l.totalAmount > 0).sort((a, b) => b.totalAmount - a.totalAmount));

  // 5. كل الزيارات (من نتيجة الكاليندر)
  allVisitsList = computed(() => this.calendarEvents().filter(e => e.type === 'Visit').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  
  // 6. كل المكالمات والمهام (من نتيجة الكاليندر)
  allActivitiesList = computed(() => this.calendarEvents().filter(e => e.type !== 'Visit').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
 */


  closedDealsList = computed(() => this.baseFilteredLeads().filter(l => l.statusId === 19));
requestsList = computed(() => this.baseFilteredLeads().filter(l => l.statusId === 4));
closingStageList = computed(() => this.baseFilteredLeads().filter(l => l.statusId === 18));
revenueList = computed(() => this.baseFilteredLeads().filter(l => l.totalAmount > 0).sort((a, b) => b.totalAmount - a.totalAmount));

allVisitsList = computed(() => this.baseFilteredEvents().filter(e => e.type === 'Visit').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
allActivitiesList = computed(() => this.baseFilteredEvents().filter(e => e.type !== 'Visit').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  ngOnInit() {
    // 1. حماية الصفحة: لو مش أدمن، اطرده
    const userString = localStorage.getItem('user');
    if (!userString) { this.router.navigate(['/home']); return; }
    
    const user = JSON.parse(userString);
    const roles = user.roles ||[];
    const isUserAdmin = roles.includes('Admin') || user.userType === 2 || user.userType === 'Admin';
    
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
        // فلترة البروكرز المسموح ليهم يدخلوا الـ CRM
        const vipUsers = users.filter((u: any) => this.authService.ALLOWED_CRM_BROKERS.includes(u.id));
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
}