import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop'; 
import { CrmService } from '../../../Services/crm.services';
import { AlertService } from '../../../Services/alert';
import { LeadResponseDto } from '../../../Models/crm.models';
import { RouterModule } from '@angular/router';

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

  currentBrokerId: string = ''; 
  campaignsList = signal<any[]>([]);

  viewMode = signal<'kanban' | 'list'>('kanban'); 
  filteredLeadsForList = signal<any[]>([]);

  allLeads = signal<any[]>([]); 
  
  // 🟢 الفلاتر الشاملة (نفس اللي في البروفايل)
  searchText = signal<string>(''); 
  filterCampaign = signal<string>('');
  filterStatus = signal<string>('');
  filterZone = signal<string>('');
  filterCreationDate = signal<string>('');
  filterLastUpdate = signal<string>('');
  filterMinBudget = signal<number | null>(null);
  filterMaxBudget = signal<number | null>(null);

  zones =[{ id: 1, name: 'Cairo' }, { id: 2, name: 'Alexandria' }, { id: 3, name: 'North Coast' }];

  boardColumns = signal<any[]>([]);

  ngOnInit() {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      this.currentBrokerId = user.id || user.userId || ''; 
    }
    this.loadLeads(this.currentBrokerId);
    this.loadCampaigns();
  }

  loadCampaigns() {
    this.crmService.getCampaigns().subscribe({
      next: (data) => this.campaignsList.set(data),
      error: (err) => console.error('Error fetching campaigns', err)
    });
  }

  loadLeads(brokerId: string) {
    if (!brokerId) return; 
    
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

  // دالة ضبط التواريخ للفلتر
  formatDateForFilter(dateString: string): string {
    if (!dateString) return '';
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  applyFilters(isUserAction: boolean = false) {
    const search = this.searchText().toLowerCase();
    const campaign = this.filterCampaign();
    const status = this.filterStatus();
    const zone = this.filterZone(); 
    const cDate = this.filterCreationDate();
    const uDate = this.filterLastUpdate();
    const minB = this.filterMinBudget();
    const maxB = this.filterMaxBudget();

    const filtered = this.allLeads().filter(lead => {
      const matchSearch = lead.fullName.toLowerCase().includes(search) || lead.phoneNumber.includes(search);
      const matchCamp = campaign === '' || lead.campaignName === campaign;
      const matchStatus = status === '' || lead.statusId.toString() === status;
      const matchZone = zone === '' || lead.zoneName === zone;
      
      const matchCDate = cDate === '' || this.formatDateForFilter(lead.createdAt) === cDate;
      const matchUDate = uDate === '' || this.formatDateForFilter(lead.updatedAt || lead.createdAt) === uDate;
      
      const matchMinB = minB === null || lead.totalAmount >= minB;
      const matchMaxB = maxB === null || lead.totalAmount <= maxB;

      return matchSearch && matchCamp && matchStatus && matchZone && matchCDate && matchUDate && matchMinB && matchMaxB;
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
    this.filterCampaign.set('');
    this.filterStatus.set('');
    this.filterZone.set('');
    this.filterCreationDate.set('');
    this.filterLastUpdate.set('');
    this.filterMinBudget.set(null);
    this.filterMaxBudget.set(null);
    this.applyFilters(true);
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
}