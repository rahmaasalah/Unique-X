import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// 👇 استيراد أدوات السحب والإفلات من Angular Material
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop'; 
import { CrmService } from '../../../Services/crm.services';
import { AlertService } from '../../../Services/alert';
import { LeadResponseDto } from '../../../Models/crm.models';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-leads-dashboard',
  standalone: true,
  imports:[CommonModule, FormsModule, ReactiveFormsModule, DragDropModule, RouterModule], // ضفنا DragDropModule
  templateUrl: './leads-dashboard.html',
  styleUrls: ['./leads-dashboard.css']
})
export class LeadsDashboardComponent implements OnInit {
  private crmService = inject(CrmService);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);

  leadForm!: FormGroup;
  currentBrokerId: string = ''; 
  campaignsList = signal<any[]>([]);

  allLeads = signal<any[]>([]); // دي النسخة الأصلية اللي مش بتتمسح
  searchText = signal<string>(''); // نص البحث
  filterCampaign = signal<string>('');
  filterStatus = signal<string>('');
  filterPropertyType = signal<string>('');
  filterPurpose = signal<string>('');
  filterDate = signal<string>('');

  // 👇 أعمدة الـ Kanban Board (تقدري تغيري الأسماء والـ IDs حسب اللي عندك في الداتابيز)
  boardColumns = signal<any[]>([
    { id: 1, name: 'New "To Call"', leads: [] },
    { id: 2, name: 'Visit Scheduled', leads: [] },
    { id: 4, name: 'Meeting Scheduled', leads:[] },
    { id: 5, name: 'Deal Closed', leads:[] }
  ]);

  ngOnInit() {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      this.currentBrokerId = user.id || user.userId || ''; 
    }
    this.initForm();
    this.loadLeads(this.currentBrokerId);
    this.loadCampaigns();
  }

  loadCampaigns() {
    this.crmService.getCampaigns().subscribe({
      next: (data) => this.campaignsList.set(data),
      error: (err) => console.error('Error fetching campaigns', err)
    });
  }

  initForm() {
    this.leadForm = this.fb.group({
      fullName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      email: [''],
      brokerId: [this.currentBrokerId, Validators.required],
      leadStatusId: [1, Validators.required], // العميل الجديد بينزل في عمود رقم 1
      propertyType: ['Apartment', Validators.required],
      purpose: ['Sale', Validators.required],
      totalAmount: [0, [Validators.min(0)]],
      paymentMethod: ['Cash'],
      preferredLocation: [''],
      campaignId: [''],
      notes: ['']
    });
  }

  loadLeads(brokerId: string) {
    if (!brokerId) return; 
    
    this.crmService.getLeads(brokerId).subscribe({
      next: (data) => {
        this.allLeads.set(data); // بنحفظ النسخة الأصلية
        this.applyFilters(); // 👈 بننادي دالة الفلترة عشان توزعهم في الأعمدة
      },
      error: (err) => console.error('Error fetching leads:', err)
    });
  }

  // 👇 الدالة السحرية الجديدة اللي بتفلتر وتوزع العملاء
  applyFilters(isUserAction: boolean = false) {
    const search = this.searchText().toLowerCase();
    const campaign = this.filterCampaign();
    const status = this.filterStatus();
    const propType = this.filterPropertyType();
    const purpose = this.filterPurpose();
    const date = this.filterDate();

    const filtered = this.allLeads().filter(lead => {
      const matchSearch = lead.fullName.toLowerCase().includes(search) || lead.phoneNumber.includes(search);
      const matchCamp = campaign === '' || lead.campaignName === campaign;
      const matchStatus = status === '' || lead.statusId.toString() === status;
      const matchPropType = propType === '' || lead.propertyType === propType;
      const matchPurpose = purpose === '' || lead.purpose === purpose;
      
      let matchDate = true;
      if (date !== '') {
        const leadDate = new Date(lead.createdAt).toISOString().split('T')[0];
        matchDate = leadDate === date;
      }

      return matchSearch && matchCamp && matchStatus && matchPropType && matchPurpose && matchDate;
    });

    const freshColumns =[
      { id: 1, name: 'New "To Call"', leads: [] as any[] },
      { id: 2, name: 'Visit Scheduled', leads: [] as any[] },
      { id: 4, name: 'Meeting Scheduled', leads:[] as any[] },
      { id: 5, name: 'Deal Closed', leads: [] as any[] }
    ];

    filtered.forEach(lead => {
      const column = freshColumns.find(c => c.id === lead.statusId);
      if (column) column.leads.push(lead);
    });

    this.boardColumns.set(freshColumns); 

    // 👇 هنا السحر: الشاشة هتنزل بس لو اليوزر هو اللي استخدم الفلتر
    if (isUserAction) {
      const element = document.getElementById('pipeline-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  // دالة صغيرة لتفريغ الفلاتر بضغطة زرار
  clearFilters() {
    this.searchText.set('');
    this.filterCampaign.set('');
    this.filterStatus.set('');
    this.filterPropertyType.set('');
    this.filterPurpose.set('');
    this.filterDate.set('');
    this.applyFilters(true);
  }

  preventNegative(event: any) {
    if (event.key === '-' || event.key === 'e' || event.key === '+') {
      event.preventDefault();
    }
  }

  onSubmit() {
    if (this.leadForm.valid) {
      this.alertService.showLoading('Adding new lead...'); 
      this.crmService.createLead(this.leadForm.value).subscribe({
        next: (res) => {
          this.alertService.close();
          this.alertService.success('Lead has been added!');
          this.leadForm.reset();
          this.initForm(); 
          this.loadLeads(this.currentBrokerId); 
        },
        error: (err) => {
          this.alertService.close();
          this.alertService.error('Failed to add the lead.');
        }
      });
    }
  }

  // 👇 دالة السحب والإفلات السحرية
  drop(event: CdkDragDrop<LeadResponseDto[]>, newStatusId: number) {
    if (event.previousContainer === event.container) {
      // لو حركه في نفس العمود (مجرد ترتيب)
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // لو نقله لعمود تاني
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      const movedLead = event.container.data[event.currentIndex];
      
      // 🟢 الجزء الجديد: تحديث حالة العميل في النسخة الأصلية عشان الفلتر ميبوظهاش
      const masterLeads = this.allLeads();
      const index = masterLeads.findIndex(l => l.id === movedLead.id);
      if (index > -1) {
        masterLeads[index].statusId = newStatusId;
        // بنعمل نسخة جديدة من المصفوفة عشان الـ Signal يحس بالتغيير
        this.allLeads.set([...masterLeads]); 
      }
      
      this.alertService.showLoading('Updating Pipeline...');
      
      // بنبعت للباك إند إن العميل ده حالته اتغيرت
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
          this.loadLeads(this.currentBrokerId); // نرجع الداتا زي ما كانت لو حصل إيرور
        }
      });
    }
  }
}