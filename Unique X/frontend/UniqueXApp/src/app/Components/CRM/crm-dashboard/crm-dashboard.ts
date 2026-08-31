import { Component, OnInit, inject, signal, computed , effect } from '@angular/core';

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

  activeTab = signal<'brokers' | 'clients' | 'calendar' | 'closed_deals' | 'requests' | 'revenue' | 'all_visits' | 'all_activities' | 'closing_stage' | 'add_broker'  | 'transfer_leads' | 'favorites' | 'admin_favorites' | 'pending_duplicates' | 'rejected_duplicates' | 'report' | 'pending_clients' | 'broker_codes' | 'broker_limits' | 'new_leads'>('brokers');

  // 🟢 تاب "New Leads" - عملاء جايين من مودال Get Recommendation ولسه محتاجين توزيع على بروكر
  newLeadsList = signal<any[]>([]);
  newLeadsSelectedBroker: { [leadId: number]: string } = {};

  loadNewLeads() {
    this.crmService.getNewLeads().subscribe({
      next: (res: any[]) => this.newLeadsList.set(res || []),
      error: (err) => console.error('Error loading new leads', err)
    });
  }

  // 🟢 بترجع نسخة محدّثة بس من allLeads (من غير ما نعيد تحميل البروكرز والكالندر زي loadAdminData الكاملة)
  // مستخدمة بعد أي عملية بتغيّر البروكر بتاع Lead من تاب تاني (زي New Leads) عشان تاب All Clients Data يعكس التغيير فورًا
  refreshAllLeads() {
    this.crmService.getLeads('').subscribe({
      next: (leads: any[]) => {
        leads.forEach((lead: any) => {
          if (lead.createdAt && !lead.createdAt.endsWith('Z')) lead.createdAt += 'Z';
          if (lead.updatedAt && !lead.updatedAt.endsWith('Z')) lead.updatedAt += 'Z';
        });
        this.allLeads.set(leads);
      },
      error: (err) => console.error('Error refreshing all leads', err)
    });
  }

  assignNewLeadToBroker(leadId: number) {
    const newBrokerId = this.newLeadsSelectedBroker[leadId];
    if (!newBrokerId) { this.alertService.error('Please select a broker first.'); return; }

    this.alertService.showLoading('Assigning broker...');
    this.crmService.transferLead(leadId, newBrokerId, this.currentBrokerId).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('Lead assigned successfully!');
        this.loadNewLeads();
        this.refreshAllLeads(); // 🟢 السطر الجديد - عشان الليد يظهر فورًا في All Clients Data وفلتر البروكر
      },
      error: () => {
        this.alertService.close();
        this.alertService.error('Something went wrong while assigning the broker.');
      }
    });
  }

  pendingClients = signal<any[]>([]);

  pendingClientsLoading = signal<boolean>(false);

  selectedNewBroker: { [leadId: number]: string } = {};

  pendingSearchName = signal<string>('');

  pendingFilterBroker = signal<string>('');

  brokersWithCodes = signal<any[]>([]);

  brokerCodeInputs: { [id: string]: string } = {};



  get filteredPendingClients() {

    const search = this.pendingSearchName().toLowerCase();

    const broker = this.pendingFilterBroker();

    return this.pendingClients().filter(c => {

      const matchName = !search || c.fullName.toLowerCase().includes(search);

      // 🟢 بقى previousBrokerName بدل brokerName - ده اسم البروكر اللي اتسحب منه العميل

      const matchBroker = !broker || c.previousBrokerName === broker;

      return matchName && matchBroker;

    });

  }





  filterPropertyType = signal<string>('');

filterListingType = signal<string>('');

filterCampaignCode = signal<string>('');

searchCampaignCode = signal<string>('');

isCampaignDropdownOpen = signal<boolean>(false);



// Report tab signals

reportBrokerId = signal<string>('');

reportDateFrom = signal<string>('');

reportDateTo = signal<string>('');

reportData = signal<any>(null);

reportLoading = signal<boolean>(false);



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

  dummyBrokers = [

    { code: 'X7', name: 'Abdelrahman Ashraf' },

    { code: 'X10', name: 'Menna Ameen' },

    { code: 'X249', name: 'Ashraf Saad' },

    { code: 'X646', name: 'Nadia Salem' },

    { code: 'X9', name: 'Hussine Ehab' },

    { code: 'X656', name: 'Mayar Elkhalil' },

    { code: 'X659', name: 'Yasmine Mohamed' },

    {code: 'X666', name: 'Mohmoud Ali'},

    {code: 'X2', name: 'Hagar Mohamed'},

    {code: 'X101', name: 'Alaa Ashraf'},

    {code: 'X8', name: 'Abeer Ashraf'},

    {code: 'X110', name: 'Malak nasser Yousef'},

    {code: 'X675', name: 'Abdelrahman Abdala'},

    {code: 'X669', name: 'Muhammad Elsayied'},

  ];



  visitSearch = signal<string>('');

visitStatusFilter = signal<string>('');

visitDateFrom = signal<string>('');

visitDateTo = signal<string>('');

activitySearch = signal<string>('');

activityStatusFilter = signal<string>('');

activityDateFrom = signal<string>('');

activityDateTo = signal<string>('');



// دالة فلترة الزيارات

filteredVisits = computed(() => {

  let list = this.allVisitsList();

  const q = this.visitSearch().toLowerCase();

  const status = this.visitStatusFilter();

  const from = this.visitDateFrom();

  const to = this.visitDateTo();



  if (q) list = list.filter(v => v.clientName.toLowerCase().includes(q));

  if (status) list = list.filter(v => v.status === status);

  if (from) list = list.filter(v => new Date(v.date) >= new Date(from));

  if (to) {

    const toEnd = new Date(to); toEnd.setHours(23, 59, 59, 999);

    list = list.filter(v => new Date(v.date) <= toEnd);

  }

  return list;

});



// دالة فلترة الأنشطة

filteredActivities = computed(() => {

  let list = this.allActivitiesList();

  const q = this.activitySearch().toLowerCase();

  const status = this.activityStatusFilter();

  const from = this.activityDateFrom();

  const to = this.activityDateTo();



  if (q) list = list.filter(a => a.clientName.toLowerCase().includes(q));

  if (status) list = list.filter(a => a.status === status);

  if (from) list = list.filter(a => new Date(a.date) >= new Date(from));

  if (to) {

    const toEnd = new Date(to); toEnd.setHours(23, 59, 59, 999);

    list = list.filter(a => new Date(a.date) <= toEnd);

  }

  return list;

});



clearFilters(type: 'visit' | 'activity') {

  if (type === 'visit') {

    this.visitSearch.set('');

    this.visitStatusFilter.set('');

    this.visitDateFrom.set('');

    this.visitDateTo.set('');

  } else {

    this.activitySearch.set('');

    this.activityStatusFilter.set('');

    this.activityDateFrom.set('');

    this.activityDateTo.set('');

  }

}



  // الداتا الأساسية

  allLeads = signal<any[]>([]);

  vipBrokers = signal<any[]>([]);

  // 🟢 مودال عرض عملاء Late/TooLate بتوع بروكر معين
  viewClientsBroker = signal<any>(null);
  viewClientsFilter = signal<'late' | 'tooLate'>('late');

  openViewClients(broker: any, filter: 'late' | 'tooLate') {
    this.viewClientsBroker.set(broker);
    this.viewClientsFilter.set(filter);
    const modalEl = document.getElementById('viewLateClientsModal');
    if (modalEl) new (window as any).bootstrap.Modal(modalEl).show();
  }

  get viewClientsList() {
    const b = this.viewClientsBroker();
    if (!b) return [];
    return this.viewClientsFilter() === 'late' ? b.lateClients : b.tooLateClients;
  }

  // 🟢 تاب Broker Limits - قيمة الـ input بتاعة كل بروكر قبل الحفظ
  brokerLimitInputs: { [brokerId: string]: number | null } = {};

  saveLeadLimit(broker: any) {
    const raw = this.brokerLimitInputs[broker.id];
    const limitToSave = (raw === undefined || raw === null || (raw as any) === '') ? null : Number(raw);

    this.adminService.setBrokerLimit(broker.id, limitToSave).subscribe({
      next: () => {
        this.alertService.success('Lead limit updated successfully!');
        broker.leadLimit = limitToSave; // تحديث فوري من غير ما نستنى إعادة تحميل كاملة
      },
      error: () => this.alertService.error('Failed to update lead limit.')
    });
  }

  favoriteLeads = signal<number[]>([]);

  allFavoriteLeads = signal<any[]>([]); // للأدمن - كل المفضلة من كل البروكرز



  // فلاتر تاب Admin Favorites

  adminFavSearch = signal<string>('');

  adminFavBroker = signal<string>('');



  filteredAdminFavorites = computed(() => {

    let list = this.allFavoriteLeads();

    const q = this.adminFavSearch().toLowerCase();

    const broker = this.adminFavBroker();

    if (q) list = list.filter(f =>

      f.fullName?.toLowerCase().includes(q) ||

      f.phoneNumber?.includes(q)

    );

    if (broker) list = list.filter(f => f.brokerName === broker);

    return list;

  });



allBrokersList = signal<any[]>([]); // كل البروكرز اللي في السيستم

selectedBrokerToAdd = signal<string>('');

  



selectedDayEvents = signal<any>(null);



searchDuplicate = signal<string>('');

filterBroker = signal<string>('');



filteredPendingDuplicates = computed(() => {

  let list = this.pendingDuplicates();

  const q = this.searchDuplicate().toLowerCase();

  const broker = this.filterBroker();



  if (q) list = list.filter(l => l.fullName.toLowerCase().includes(q) || (l.code && l.code.toLowerCase().includes(q)));

  if (broker) list = list.filter(l => l.brokerName === broker);

  return list;

});





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

  currentBrokerId: string = '';



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



pendingDuplicates = computed(() => 

  this.allLeads().filter(l => l.isDuplicate && !l.isApprovedDuplicate && !l.isRejectedDuplicate)

);



rejectedDuplicates = computed(() => 

  this.allLeads().filter(l => l.isDuplicate && l.isRejectedDuplicate)

);



filteredRejectedDuplicates = computed(() => {

  let list = this.rejectedDuplicates();

  const q = this.searchDuplicate().toLowerCase();

  const broker = this.filterBroker();



  if (q) list = list.filter(l => l.fullName.toLowerCase().includes(q));

  if (broker) list = list.filter(l => l.brokerName === broker);

  return list;

});



// 2. دالة تصفير الفلاتر

clearDuplicateFilters() {

  this.searchDuplicate.set('');

  this.filterBroker.set('');

}

  

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



      // 🟢 عملاء الـ Late و Too Late بتاعت البروكر ده - من نفس الداتا الموجودة (lateStatus جاي من الباك إند)

      const lateClients = myLeads.filter(l => l.lateStatus === 'Late');

      const tooLateClients = myLeads.filter(l => l.lateStatus === 'TooLate');



      // 🟢 عدد العملاء اللي اتنقلوله من الأدمن (Transfer)

      const transferredInCount = myLeads.filter(l => l.isTransferredIn).length;



      return {

        ...broker,

        fullName: bName,

        brokerCode: bCode,

        leads: myLeads,

        totalLeads: myLeads.length,

        leadLimit: broker.leadLimit ?? null,

        transferredInCount,



        lateClients, tooLateClients,

        lateCount: lateClients.length,

        tooLateCount: tooLateClients.length,



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

filterCampaign = signal<string>('');

filterZone = signal<string>('');

filterCreationDate = signal<string>('');

filterLastUpdate = signal<string>('');

filterMinBudget = signal<number | null>(null);

filterMaxBudget = signal<number | null>(null);

campaignsList = signal<any[]>([]);

  

  filteredClients = computed(() => {

  let leads = this.allLeads();

  const q = this.searchClient().toLowerCase();

  const stage = this.filterClientStage();

  const broker = this.globalBrokerFilter();

  const campaign = this.filterCampaign();

  const zone = this.filterZone();

  const cDate = this.filterCreationDate();

  const uDate = this.filterLastUpdate();

  const minB = this.filterMinBudget();

  const maxB = this.filterMaxBudget();

  const propType = this.filterPropertyType();

const listType = this.filterListingType();

const campCode = this.filterCampaignCode();



  if (q) leads = leads.filter(l => l.fullName.toLowerCase().includes(q) || l.phoneNumber.includes(q));

  if (stage) leads = leads.filter(l => l.statusId.toString() === stage);

  if (broker) leads = leads.filter(l => l.brokerName === broker);

  if (campaign) leads = leads.filter(l => l.campaignName === campaign);

  if (zone) leads = leads.filter(l => l.zoneName === zone);

  if (cDate) leads = leads.filter(l => this.formatDateForFilter(l.createdAt) === cDate);

  if (uDate) leads = leads.filter(l => this.formatDateForFilter(l.updatedAt || l.createdAt) === uDate);

  if (minB !== null) leads = leads.filter(l => l.totalAmount >= minB);

  if (maxB !== null) leads = leads.filter(l => l.totalAmount <= maxB);

  if (propType) leads = leads.filter(l => l.propertyType === propType);

if (listType) leads = leads.filter(l => l.purpose === listType);

if (campCode) leads = leads.filter(l => l.campaignName === campCode);

  if (!this.showHiddenItems()) leads = leads.filter(l => !this.hiddenLeads().includes(l.id));



  return leads;

});

  filteredFavoritesList = computed(() => {

    return this.filteredClients().filter(l => this.favoriteLeads().includes(l.id));

  });



  // المودال

  selectedRequest = signal<any>(null);



  stages =[
    { id: 1, name: 'New "To Call"' },
    { id: 4, name: 'Calls (request)' },
    { id: 6, name: 'Follow Up For Visit' },
    { id: 7, name: 'Visit scheduled' },
    { id: 10, name: 'Follow up for Meeting' },
    { id: 11, name: 'Meeting Scheduled' },
    { id: 8, name: 'Follow up After visit' },
    { id: 18, name: 'Follow up for closing' },
    { id: 19, name: 'Deal closed' },
    { id: 23, name: 'Low Budget' },
    { id: 22, name: 'Lost Not interested' },
    { id: 24, name: 'Number Issue' },
    { id: 21, name: 'N/A "unreachable"' },
    { id: 25, name: 'Broker' },
    { id: 26, name: 'Recommend to shift' }
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



// --- فلاتر تاب Requests ---

reqSearch = signal<string>('');

reqBroker = signal<string>('');

reqCategory = signal<string>('');   // purpose: Primary / Resale / Rent / Resale Project

reqMinBudget = signal<number | null>(null);

reqMaxBudget = signal<number | null>(null);

reqDateFrom = signal<string>('');

reqDateTo = signal<string>('');

reqCampaignCode = signal<string>('');

reqSearchCampaign = signal<string>('');

isReqCampaignOpen = signal<boolean>(false);



filteredReqCampaignCodes = computed(() => {

  const q = this.reqSearchCampaign().toLowerCase();

  const codes = this.campaignsList();

  return q ? codes.filter((c: string) => c.toLowerCase().includes(q)) : codes;

});



selectReqCampaign(code: string) {

  this.reqCampaignCode.set(code);

  this.reqSearchCampaign.set(code);

  this.isReqCampaignOpen.set(false);

}



closeReqCampaignDropdown() {

  setTimeout(() => this.isReqCampaignOpen.set(false), 200);

}



filteredRequestsList = computed(() => {

  let list = this.requestsList();

  const q = this.reqSearch().toLowerCase();

  const broker = this.reqBroker();

  const category = this.reqCategory();

  const minB = this.reqMinBudget();

  const maxB = this.reqMaxBudget();

  const from = this.reqDateFrom();

  const to = this.reqDateTo();

  const campaign = this.reqCampaignCode();



  if (q) list = list.filter(l => l.fullName.toLowerCase().includes(q) || l.phoneNumber.includes(q));

  if (broker) list = list.filter(l => l.brokerName === broker);

  if (category) list = list.filter(l => l.purpose === category);

  if (campaign) list = list.filter(l => l.campaignName === campaign);

  if (minB !== null) list = list.filter(l => l.totalAmount >= minB);

  if (maxB !== null) list = list.filter(l => l.totalAmount <= maxB);

  if (from) list = list.filter(l => new Date(l.createdAt) >= new Date(from));

  if (to) {

    const toEnd = new Date(to); toEnd.setHours(23, 59, 59, 999);

    list = list.filter(l => new Date(l.createdAt) <= toEnd);

  }

  return list;

});



clearRequestFilters() {

  this.reqSearch.set('');

  this.reqBroker.set('');

  this.reqCategory.set('');

  this.reqMinBudget.set(null);

  this.reqMaxBudget.set(null);

  this.reqDateFrom.set('');

  this.reqDateTo.set('');

  this.reqCampaignCode.set('');

  this.reqSearchCampaign.set('');

}



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



  constructor() {

    // 🟢 سحر الـ Signals: الدالة دي بتشتغل لوحدها في الخلفية

    // وأي تغيير هتعمليه في التاب أو الفلتر، هتحفظه فوراً في المتصفح

    effect(() => {

      const dashboardState = {

        tab: this.activeTab(),

        broker: this.globalBrokerFilter(),

        search: this.searchClient(),

        stage: this.filterClientStage()

      };

      sessionStorage.setItem('crm_dashboard_state', JSON.stringify(dashboardState));

    });

  }





  ngOnInit() {

    const savedState = sessionStorage.getItem('crm_dashboard_state');

    if (savedState) {

      const parsed = JSON.parse(savedState);

      this.activeTab.set(parsed.tab || 'brokers');

      this.globalBrokerFilter.set(parsed.broker || '');

      this.searchClient.set(parsed.search || '');

      this.filterClientStage.set(parsed.stage || '');

    }

    // 1. حماية الصفحة: لو مش أدمن، اطرده

    const userString = localStorage.getItem('user');

    if (!userString) { this.router.navigate(['/home']); return; }

    

    const user = JSON.parse(userString);



    this.currentBrokerId = user.id || user.userId || '';



    const roles = user.roles ||[];

    const isUserAdmin = roles.includes('Admin') || user.userType === 2 || user.userType === 'Admin';



    const sFavs = localStorage.getItem(`crm_fav_leads_${this.currentBrokerId}`);

    if (sFavs) this.favoriteLeads.set(JSON.parse(sFavs));



    // نجيب الـ favorites من الـ DB كمان

    if (this.currentBrokerId) {

      this.crmService.getFavoriteIds(this.currentBrokerId).subscribe({

        next: (ids) => this.favoriteLeads.set(ids),

        error: () => {} // لو فشل نسيب الـ localStorage كـ fallback

      });

    }

    

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

    

    // بنجيب المستخدمين والعملاء والكاليندر في نفس الوقت

    // property-codes منفصلة عشان لو فشلت متأثرش على باقي الداتا

    forkJoin({

      users: this.adminService.getAllUsers(),

      leads: this.crmService.getLeads(''),

      calendar: this.crmService.getAdminCalendarEvents()

    }).subscribe({

      next: ({ users, leads, calendar }) => {

        // بنفلتر كل البروكرز من المستخدمين (UserType === 1) ونحفظهم

        const brokers = users.filter((u: any) => u.userType === 1);

        this.allBrokersList.set(brokers);



        // بنجيب البروكرز اللي معاهم الصلاحية فقط من الداتا بيز

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



        // بنجيب كل المفضلة من كل البروكرز للأدمن

        this.crmService.getAllFavorites().subscribe({

          next: (favs) => this.allFavoriteLeads.set(favs),

          error: () => {}

        });



        // بنجيب أكواد الحملات بشكل منفصل عشان لو فشلوا متأثروش على باقي الداتا

        this.loadCampaignCodes();

      },

      error: (err) => {

        console.error(err);

        this.alertService.close();

        this.alertService.error('Failed to load CRM data.');

      }

    });

  }



  loadCampaignCodes() {

    this.crmService.getPropertyCodes().subscribe({

      next: (codes) => {

        this.campaignsList.set(codes);

      },

      error: (err) => {

        // لو فشلت مش هتعرض error للمستخدم، بس هنسجلها في الـ console

        console.warn('Could not load campaign codes:', err);

        this.campaignsList.set([]);

      }

    });

  }



  isSidebarOpen = signal<boolean>(false);



  toggleSidebar() {

    this.isSidebarOpen.update(val => !val);

  }



  formatDateForFilter(dateString: string): string {

  if (!dateString) return '';

  const d = new Date(dateString);

  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

}



  rejectDuplicate(leadId: number) {

  this.alertService.showLoading('Rejecting...');

  this.crmService.rejectDuplicateLead(leadId).subscribe({

    next: (res) => {

      this.alertService.close();

      this.alertService.success('Lead Rejected!');

      // 🟢 أهم خطوة: استدعاء دالة تحديث الداتا

      this.loadAdminData(); 

    },

    error: (err) => {

      this.alertService.close();

      console.error('Error details:', err); // 🟢 لرؤية الخطأ في الـ Console

      this.alertService.error('Failed to reject lead.');

    }

  });

}



  toggleFavorite(leadId: number, event?: Event) {

    if (event) event.stopPropagation();

    const isFav = this.favoriteLeads().includes(leadId);



    if (isFav) {

      // إزالة من المفضلة

      this.crmService.removeFavorite(this.currentBrokerId, leadId).subscribe({

        next: () => {

          this.favoriteLeads.update(ids => ids.filter(id => id !== leadId));

          localStorage.setItem(`crm_fav_leads_${this.currentBrokerId}`, JSON.stringify(this.favoriteLeads()));

        },

        error: () => this.alertService.error('Failed to remove from favorites.')

      });

    } else {

      // إضافة للمفضلة

      this.crmService.addFavorite(this.currentBrokerId, leadId).subscribe({

        next: () => {

          this.favoriteLeads.update(ids => [...ids, leadId]);

          localStorage.setItem(`crm_fav_leads_${this.currentBrokerId}`, JSON.stringify(this.favoriteLeads()));

        },

        error: () => this.alertService.error('Failed to add to favorites.')

      });

    }

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

    if (tab === 'pending_clients') this.loadPendingClients();

    if (tab === 'new_leads') this.loadNewLeads();

    if (tab === 'broker_codes') this.loadBrokersWithCodes();

    if (window.innerWidth <= 991) {

      this.isSidebarOpen.set(false);

    }

  }



  loadBrokersWithCodes() {

    this.adminService.getBrokersWithCodes().subscribe({

      next: (data) => {

        this.brokersWithCodes.set(data);

        data.forEach((b: any) => {

          this.brokerCodeInputs[b.id] = b.brokerCode || '';

        });

      },

      error: () => this.alertService.error('Failed to load brokers.')

    });

  }



  saveBrokerCode(userId: string) {

    const code = this.brokerCodeInputs[userId]?.trim();

    if (!code) { this.alertService.error('Please enter a code.'); return; }

    this.adminService.setBrokerCode(userId, code).subscribe({

      next: () => {

        this.alertService.success(`Code "${code}" saved!`);

        this.loadBrokersWithCodes();

      },

      error: (err) => this.alertService.error(err.error || 'Code may already be in use.')

    });

  }



  removeBrokerCode(userId: string) {

    this.alertService.confirm('Remove this broker code?', () => {

      this.adminService.clearBrokerCode(userId).subscribe({

        next: () => {

          this.alertService.success('Code removed.');

          this.loadBrokersWithCodes();

        },

        error: () => this.alertService.error('Failed to remove code.')

      });

    });

  }



  loadPendingClients() {

    this.pendingClientsLoading.set(true);

    this.crmService.getPendingClients().subscribe({

      next: (data) => { this.pendingClients.set(data); this.pendingClientsLoading.set(false); },

      error: () => this.pendingClientsLoading.set(false)

    });

  }



  transferPendingLead(leadId: number) {

    const newBrokerId = this.selectedNewBroker[leadId];

    if (!newBrokerId) { this.alertService.error('Please select a broker first.'); return; }

    const adminId = this.currentBrokerId;

    this.alertService.confirm('Assign this client to the selected broker? All counters (Feedback, etc.) will be reset for them.', () => {

      // 🟢 بنستخدم endpoint التعيين الجديد بدل الـ transfer العادي - ده بيصفر العدادات ويشيل العميل من Pending

      this.crmService.assignNewBroker(leadId, newBrokerId, adminId).subscribe({

        next: () => {

          this.alertService.success('Client assigned to the new broker successfully! All counters were reset.');

          this.loadPendingClients();

          this.refreshAllLeads(); // 🟢 السطر الجديد - نفس إصلاح تاب New Leads

        },

        error: () => this.alertService.error('Assignment failed.')

      });

    });

  }



  exportReportToExcel() {

    const data = this.reportData();

    if (!data) return;



    // بنجيب اسم البروكر من القايمة

    const broker = this.vipBrokers().find((b: any) => b.id === this.reportBrokerId());

    const brokerName = broker ? `${broker.firstName} ${broker.lastName}` : 'Broker';



    // لازم نعمل import للـ xlsx

    import('xlsx').then(XLSX => {

      const wb = XLSX.utils.book_new();



      // Sheet 1: Daily Activity Summary

      const activitySummaryRows = (data.dailySummary || []).map((d: any) => ({

        'Date': d.date,

        'Total Calls': d.totalCalls,

        'Total WhatsApp': d.totalWhatsApp,

        'Total Activities': d.totalActivities,

        'Completed': d.completedActivities

      }));

      const ws1 = XLSX.utils.json_to_sheet(activitySummaryRows);

      XLSX.utils.book_append_sheet(wb, ws1, 'Daily Activity Summary');



      // Sheet 2: Daily Visit Summary

      const visitSummaryRows = (data.dailyVisitSummary || []).map((d: any) => ({

        'Date': d.date,

        'Total Visits': d.totalVisits,

        'Completed': d.completedVisits,

        'Pending': d.pendingVisits

      }));

      const ws2 = XLSX.utils.json_to_sheet(visitSummaryRows);

      XLSX.utils.book_append_sheet(wb, ws2, 'Daily Visit Summary');



      // Sheet 3: Activity Details

      const activityRows = (data.activities || []).map((a: any) => ({

        'Client Name': a.leadName,

        'Phone': a.leadPhone,

        'Type': a.activityType,

        'Summary': a.summary,

        'Date': new Date(a.dueDate).toLocaleString('en-GB'),

        'Status': a.status,

        'Feedback': a.feedback || ''

      }));

      const ws3 = XLSX.utils.json_to_sheet(activityRows);

      XLSX.utils.book_append_sheet(wb, ws3, 'Activity Details');



      // Sheet 4: Visit Details

      const visitRows = (data.visits || []).map((v: any) => ({

        'Client Name': v.leadName,

        'Phone': v.leadPhone,

        'Property Code': v.propertyCode || '',

        'Visit Date': new Date(v.visitDate).toLocaleString('en-GB'),

        'Location': v.location,

        'Status': v.status,

        'Feedback': v.feedback || ''

      }));

      const ws4 = XLSX.utils.json_to_sheet(visitRows);

      XLSX.utils.book_append_sheet(wb, ws4, 'Visit Details');



      // Sheet 5: New Leads

      const newLeadRows = (data.newLeads?.leads || []).map((l: any) => ({

        'Client Name': l.fullName,

        'Phone': l.phoneNumber,

        'Created At': new Date(l.createdAt).toLocaleDateString('en-GB')

      }));

      const ws5 = XLSX.utils.json_to_sheet(newLeadRows);

      XLSX.utils.book_append_sheet(wb, ws5, 'New Leads');



      // Sheet 6: Requests

      const requestRows = (data.requestLeads?.leads || []).map((l: any) => ({

        'Client Name': l.fullName,

        'Phone': l.phoneNumber,

        'Created At': new Date(l.createdAt).toLocaleDateString('en-GB')

      }));

      const ws6 = XLSX.utils.json_to_sheet(requestRows);

      XLSX.utils.book_append_sheet(wb, ws6, 'Requests');



      // Sheet 7: Follow Up For Visit

      const followUpRows = (data.followUpVisitLeads?.leads || []).map((l: any) => ({

        'Client Name': l.fullName,

        'Phone': l.phoneNumber,

        'Created At': new Date(l.createdAt).toLocaleDateString('en-GB')

      }));

      const ws7 = XLSX.utils.json_to_sheet(followUpRows);

      XLSX.utils.book_append_sheet(wb, ws7, 'Follow Up For Visit');



      // Sheet 8: Request Details

      const requestDetailRows = (data.requestDetails || []).map((r: any) => ({

        'Client Name': r.leadName,

        'Phone': r.leadPhone,

        'Property Type': r.propertyType || '',

        'Listing Type': r.purpose || '',

        'Zone': r.zoneName || '',

        'Budget (EGP)': r.totalAmount || 0,

        'Payment Method': r.paymentMethod || '',

        'Down Payment': r.downPayment || 0,

        'Installment Years': r.installmentYears || 0,

        'Notes': r.notes || ''

      }));

      const ws8 = XLSX.utils.json_to_sheet(requestDetailRows);

      XLSX.utils.book_append_sheet(wb, ws8, 'Request Details');



      // تسمية الملف باسم البروكر والتاريخ

      const fileName = `Report_${brokerName}_${this.reportDateFrom() || 'all'}_to_${this.reportDateTo() || 'all'}.xlsx`;

      XLSX.writeFile(wb, fileName);

    });

  }



  loadReport() {

    const brokerId = this.reportBrokerId();

    const from = this.reportDateFrom();

    const to = this.reportDateTo();



    if (!brokerId) {

      this.alertService.error('Please select a broker first.');

      return;

    }



    this.reportLoading.set(true);

    this.crmService.getBrokerReport(brokerId, from, to).subscribe({

      next: (data) => {

        this.reportData.set(data);

        this.reportLoading.set(false);

      },

      error: () => {

        this.reportLoading.set(false);

        this.alertService.error('Failed to load report.');

      }

    });

  }



  approveDuplicate(leadId: number) {

  this.alertService.showLoading('Approving...');

  this.crmService.approveDuplicateLead(leadId).subscribe({

    next: () => {

      this.alertService.close();

      this.alertService.success('Lead Approved!');

      this.loadAdminData(); // 🟢 ضروري جداً لتحديث القوائم (نقل العميل من Rejected إلى القائمة الأساسية)

    },

    error: (err) => {

      this.alertService.close();

      console.error(err);

      this.alertService.error('Failed to approve lead.');

    }

  });

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



  daysAgo(hours: number): number {

    return Math.floor((hours || 0) / 24);

  }



  // الـ pending clients list بيرجع بيانات مختصرة بس، فبندور على الـ lead الكامل

  // من allLeads (اللي فيه كل تفاصيل الـ request) قبل ما نفتح المودال

  openRequestModalForClient(client: any) {

    const fullLead = this.allLeads().find(l => l.id === client.id);

    this.openRequestModal(fullLead || client);

  }



  clearClientFilters() {

  this.searchClient.set('');

  this.filterClientStage.set('');

  this.globalBrokerFilter.set('');

  this.filterCampaign.set('');

  this.filterZone.set('');

  this.filterCreationDate.set('');

  this.filterLastUpdate.set('');

  this.filterMinBudget.set(null);

  this.filterMaxBudget.set(null);

  this.filterPropertyType.set('');

this.filterListingType.set('');

this.filterCampaignCode.set('');

this.searchCampaignCode.set('');

}



  changeMonth(offset: number) {

    const current = this.currentMonth();

    this.currentMonth.set(new Date(current.getFullYear(), current.getMonth() + offset, 1));

  }



  openDayModal(day: any) {

    if (!day.date || day.events.length === 0) return; // لو يوم فاضي متفتحش حاجة

    this.selectedDayEvents.set(day);

    const bootstrap = (window as any).bootstrap;

    new bootstrap.Modal(document.getElementById('dayEventsModal')).show();

  }



  openEventDetails(evt: any) {

    this.selectedEvent.set(evt);

    const bootstrap = (window as any).bootstrap;

    

    // 🟢 نقفل مودال اليوم (لو كان مفتوح) الأول

    const dayModalEl = document.getElementById('dayEventsModal');

    if (dayModalEl) {

      const dayModal = bootstrap.Modal.getInstance(dayModalEl);

      if (dayModal) dayModal.hide();

    }



    // نفتح مودال التفاصيل

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