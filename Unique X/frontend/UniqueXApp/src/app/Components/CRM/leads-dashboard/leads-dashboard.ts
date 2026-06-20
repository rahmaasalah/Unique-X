import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop'; 
import { CrmService } from '../../../Services/crm.services';
import { AlertService } from '../../../Services/alert';
import { LeadResponseDto } from '../../../Models/crm.models';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../Services/auth';
import { Router } from '@angular/router';
import { AdminService } from '../../../Services/admin';

@Component({
  selector: 'app-leads-dashboard',
  standalone: true,
  imports:[CommonModule, FormsModule, DragDropModule, RouterModule], 
  templateUrl: './leads-dashboard.html',
  styleUrls:['./leads-dashboard.css']
})
export class LeadsDashboardComponent implements OnInit {
  private crmService = inject(CrmService);
  private alertService = inject(AlertService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private adminService = inject(AdminService);
  currentBrokerId: string = ''; 
  campaignsList = signal<any[]>([]);

  brokersList = signal<any[]>([]);
  filterBroker = signal<string>('');
  filterReferredBy = signal<string>('');
  hiddenLeads = signal<number[]>([]);
  showHiddenLeads = signal<boolean>(false);

  viewMode = signal<'kanban' | 'list'>('kanban'); 
  filteredLeadsForList = signal<any[]>([]);
  filteredLeadsCount = computed(() => this.filteredLeadsForList().length);

  allLeads = signal<any[]>([]); 
  
  // 🟢 الفلاتر الشاملة (نفس اللي في البروفايل)
  searchText = signal<string>(''); 
  //filterCampaign = signal<string>('');
  filterStatus = signal<string>('');
  filterZone = signal<string>('');
  filterCreationDate = signal<string>('');
  filterLastUpdate = signal<string>('');
  filterMinBudget = signal<number | null>(null);
  filterMaxBudget = signal<number | null>(null);

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
  this.applyFilters(true);
}

closeCampaignDropdown() {
  setTimeout(() => this.isCampaignDropdownOpen.set(false), 200);
}

  zones =[{ id: 1, name: 'Cairo' }, { id: 2, name: 'Alexandria' }, { id: 3, name: 'North Coast' }];

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
    {code: 'X110', name: 'Malak Nasser'},

  ];

  boardColumns = signal<any[]>([]);
  isAdmin = signal<boolean>(false); // 👈 متغير جديد
  selectedRequest = signal<any>(null);

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
      
      // 🟢 فحص ذكي وشامل عشان نلقط الأدمن (بكل الطرق اللي بيرجع بيها من الباك إند)
      const roles = user.roles ||[];
      const isUserAdmin = roles.includes('Admin') || user.userType === 2 || user.userType === 'Admin';
      const savedHiddenLeads = localStorage.getItem('crm_hidden_leads');
    if (savedHiddenLeads) this.hiddenLeads.set(JSON.parse(savedHiddenLeads));
      
      if (isUserAdmin) {

        this.adminService.getAllUsers().subscribe(users => {
        this.brokersList.set(users.filter((u: any) => u.userType === 1));
      });
        this.isAdmin.set(true);
        fetchId = ''; // للأدمن بنبعت ID فاضي عشان يجيب كل العملاء بتوع كل البروكرز
      } else {
        this.isAdmin.set(false);
        fetchId = this.currentBrokerId; // للبروكر بنبعت الـ ID بتاعه هو بس
      }
    }
    
    this.loadLeads(fetchId);
    this.loadCampaigns();
  }

  loadCampaigns() {
    this.crmService.getPropertyCodes().subscribe({
      next: (data) => this.campaignsList.set(data),
      error: (err) => console.error('Error fetching property codes', err)
    });
  }

  loadLeads(brokerId: string) {
    // لو مش أدمن ومفيش بروكر ID، ميحملش
    if (!brokerId && !this.isAdmin()) return; 
    
    this.crmService.getLeads(brokerId).subscribe({
      next: (data) => {
        data.forEach((lead: any) => {
          if (lead.createdAt && !lead.createdAt.endsWith('Z')) lead.createdAt += 'Z';
          if (lead.updatedAt && !lead.updatedAt.endsWith('Z')) lead.updatedAt += 'Z';
        });
        this.allLeads.set(data); 
        this.applyFilters(); 
      },
      error: (err) => console.error('Error fetching leads:', err)
    });
  }

  // 👇 دالة فتح مودال الطلب
  openRequestModal(lead: any) {
    this.selectedRequest.set(lead);
    const bootstrap = (window as any).bootstrap;
    new bootstrap.Modal(document.getElementById('requestModal')).show();
  }

  // دالة ضبط التواريخ للفلتر
  formatDateForFilter(dateString: string): string {
    if (!dateString) return '';
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    this.applyFilters(false); // تحديث الجدول
  }

  applyFilters(isUserAction: boolean = false) {
    const search = this.searchText().toLowerCase();
    //const campaign = this.filterCampaign();
    const status = this.filterStatus();
    const zone = this.filterZone(); 
    const cDate = this.filterCreationDate();
    const uDate = this.filterLastUpdate();
    const minB = this.filterMinBudget();
    const maxB = this.filterMaxBudget();
    const broker = this.filterBroker();
    const refBy = this.filterReferredBy();
    const propType = this.filterPropertyType();
const listType = this.filterListingType();
const campCode = this.filterCampaignCode();

    const filtered = this.allLeads().filter(lead => {
      if (!this.isAdmin() && lead.isDuplicate && !lead.isApprovedDuplicate) {
        return false;
      }

      const matchSearch = lead.fullName.toLowerCase().includes(search) || lead.phoneNumber.includes(search);
      //const matchCamp = campaign === '' || lead.campaignName === campaign;
      const matchStatus = status === '' || lead.statusId.toString() === status;
      const matchZone = zone === '' || lead.zoneName === zone;
      //const matchBroker = broker === '' || lead.brokerId === broker;
      const matchBroker = broker === '' || lead.brokerName === broker; 
      const matchRefBy = refBy === '' || lead.referredBy === refBy;

      const matchCDate = cDate === '' || this.formatDateForFilter(lead.createdAt) === cDate;
      const matchUDate = uDate === '' || this.formatDateForFilter(lead.updatedAt || lead.createdAt) === uDate;
      
      const matchMinB = minB === null || lead.totalAmount >= minB;
      const matchMaxB = maxB === null || lead.totalAmount <= maxB;

      const matchHidden = this.showHiddenLeads() || !this.hiddenLeads().includes(lead.id);
      const matchPropType = propType === '' || lead.propertyType === propType;
const matchListType = listType === '' || lead.purpose === listType;
const matchCampCode = campCode === '' || lead.campaignName === campCode;

      return matchSearch && matchStatus && matchZone && matchBroker 
    && matchCDate && matchUDate && matchMinB && matchMaxB && matchRefBy 
    && matchHidden && matchPropType && matchListType && matchCampCode;

      
    });

    this.filteredLeadsForList.set(filtered);

    const freshColumns =[
      { id: 1, name: 'New "To Call"', leads: [] as any[] },
      { id: 2, name: 'Wait response on wtp msg', leads: [] as any[] },
      { id: 3, name: 'Request call another time', leads: [] as any[] },
      { id: 4, name: 'Calls (request)', leads: [] as any[] },
      { id: 5, name: 'Wait Client Feedback on unit', leads: [] as any[] },
      { id: 6, name: 'Follow Up For Visit', leads:[] as any[] },
      { id: 7, name: 'Visit scheduled', leads: [] as any[] },
      { id: 8, name: 'Follow up After visit', leads:[] as any[] },
      { id: 9, name: 'Wait feedback on project', leads:[] as any[] },
      { id: 10, name: 'Follow up for Meeting', leads:[] as any[] },
      { id: 11, name: 'Meeting Scheduled', leads: [] as any[] },
      { id: 12, name: 'Follow up after meeting', leads: [] as any[] },
      { id: 13, name: 'Follow up for dev meeting', leads: [] as any[] },
      { id: 14, name: 'Follow up for site visit', leads:[] as any[] },
      { id: 15, name: 'Site visit scheduled', leads: [] as any[] },
      { id: 16, name: 'Follow up for event', leads: [] as any[] },
      { id: 17, name: 'Follow up after event', leads: [] as any[] },
      { id: 18, name: 'Follow up for closing', leads: [] as any[] },
      { id: 19, name: 'Deal closed', leads: [] as any[] },
      { id: 20, name: 'Follow up, not now', leads: [] as any[] },
      { id: 21, name: 'N/A "unreachable"', leads:[] as any[] },
      { id: 22, name: 'Lost Not interested', leads: [] as any[] },
      { id: 23, name: 'Low Budget', leads: [] as any[] },
      { id: 24, name: 'Number Issue', leads: [] as any[] },
      { id: 25, name: 'Broker', leads:[] as any[] },
      { id: 26, name: 'Recommend to shift', leads:[] as any[] }
    ];

    filtered.forEach((lead: any) => {
      const column = freshColumns.find(c => c.id === lead.statusId);
      if (column) column.leads.push(lead);
    });

    this.boardColumns.set(freshColumns);

    if (isUserAction) {
      const element = document.getElementById('pipeline-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    const ids = filtered.map((l: any) => l.id);
    sessionStorage.setItem('crm_filtered_leads', JSON.stringify(ids));
  }

  clearFilters() {
    this.searchText.set('');
    //this.filterCampaign.set('');
    this.filterStatus.set('');
    this.filterZone.set('');
    this.filterCreationDate.set('');
    this.filterLastUpdate.set('');
    this.filterMinBudget.set(null);
    this.filterMaxBudget.set(null);
    this.applyFilters(true);
    this.filterBroker.set('');
    this.filterReferredBy.set('');
    this.filterPropertyType.set('');
this.filterListingType.set('');
this.filterCampaignCode.set('');
this.searchCampaignCode.set('');
  }

  drop(event: CdkDragDrop<LeadResponseDto[]>, newStatusId: number) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      const movedLead = event.container.data[event.currentIndex];
      
      movedLead.statusId = newStatusId;
      movedLead.updatedAt = new Date() as any; 
      
      const masterLeads = this.allLeads();
      const index = masterLeads.findIndex(l => l.id === movedLead.id);
      if (index > -1) {
        masterLeads[index].statusId = newStatusId;
        masterLeads[index].updatedAt = movedLead.updatedAt;
        this.allLeads.set([...masterLeads]); 
      }
      
      this.alertService.showLoading('Updating Pipeline...');
      
      this.crmService.updateLeadStatus(movedLead.id, {
        newStatusId: newStatusId,
        brokerId: this.currentBrokerId,
        notes: 'Moved via Kanban Board'
      }).subscribe({
        next: () => {
          this.alertService.close();
        },
        error: (err) => {
          this.alertService.close();
          this.alertService.error('Failed to update pipeline.');
          this.loadLeads(this.currentBrokerId); 
        }
      });
    }
  }

  approveDuplicate(leadId: number) {
    this.alertService.confirm('Approve this duplicate lead? This will allow the broker to work on it.', () => {
      this.alertService.showLoading('Approving...');
      this.crmService.approveDuplicateLead(leadId).subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('Lead Approved!');
          this.loadLeads(this.currentBrokerId); // ريفريش للداتا
        },
        error: () => {
          this.alertService.close();
          this.alertService.error('Failed to approve lead.');
        }
      });
    });
  }
}