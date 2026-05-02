import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { CrmService } from '../../../Services/crm.services';
import { AlertService } from '../../../Services/alert';




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
  styleUrls: ['./lead-details.css']
})
export class LeadDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private crmService = inject(CrmService);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);
  private router = inject(Router);
  leadInfo = signal<any>(null);
  requestDetails = signal<any>(null);
  visits = signal<any[]>([]);
  activities = signal<any[]>([]);
  statusHistory = signal<any[]>([]);

  leadId!: number;
  currentBrokerId: string = '';
  minDateTime: string = '';

  // الفورمز
  visitForm!: FormGroup;
  activityForm!: FormGroup;

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


   ngOnInit() {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      this.currentBrokerId = user.id || user.userId || ''; 
    }

    const now = new Date();
    this.minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    this.leadId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.leadId) {
      this.loadLeadData(this.leadId);
      this.initForms();
    }
  }

 initForms() {
    this.visitForm = this.fb.group({
      leadId: [this.leadId],
      brokerId:[this.currentBrokerId],
      propertyId: [''],
      visitDate: ['',[Validators.required, futureDateValidator()]],
      location: ['', Validators.required]
    });

    this.activityForm = this.fb.group({
      leadId:[this.leadId],
      assignedToId: [this.currentBrokerId],
      activityType:['Call', Validators.required],
      summary: ['', Validators.required],
      dueDate: ['',[Validators.required, futureDateValidator()]],
      notes: ['']
    });
  }

  loadLeadData(id: number) {
    this.crmService.getLeadDetails(id).subscribe({
      next: (res) => {
        
        // 🟢 السطرين دول هما اللي بيحلوا مشكلة الـ 3 ساعات لتواريخ العميل
        if (res.leadInfo) {
          if (res.leadInfo.createdAt && !res.leadInfo.createdAt.endsWith('Z')) res.leadInfo.createdAt += 'Z';
          if (res.leadInfo.updatedAt && !res.leadInfo.updatedAt.endsWith('Z')) res.leadInfo.updatedAt += 'Z';
        }

        // ضبط التوقيت لسجل الحركات
        if (res.statusHistory) {
          res.statusHistory.forEach((h: any) => {
            if (h.changedAt && !h.changedAt.endsWith('Z')) h.changedAt += 'Z';
          });
        }

        // ضبط التوقيت للزيارات والمهام
        if (res.visits) {
          res.visits.forEach((v: any) => {
            if (v.visitDate && !v.visitDate.endsWith('Z')) v.visitDate += 'Z';
          });
        }
        if (res.activities) {
          res.activities.forEach((a: any) => {
            if (a.dueDate && !a.dueDate.endsWith('Z')) a.dueDate += 'Z';
          });
        }

        // حفظ الداتا بعد التعديل
        this.leadInfo.set(res.leadInfo);
        this.requestDetails.set(res.requestDetails);
        this.visits.set(res.visits ||[]);
        this.activities.set(res.activities ||[]);
        this.statusHistory.set(res.statusHistory ||[]);
      },
      error: (err) => {
        console.error('Error fetching lead details:', err);   
      }
    });
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
      this.alertService.showLoading('Scheduling visit...');
      this.crmService.scheduleVisit(this.visitForm.value).subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('Visit scheduled successfully!');
          this.visitForm.reset({ leadId: this.leadId, brokerId: this.currentBrokerId });
          this.loadLeadData(this.leadId); // تحديث الداتا
          // إغلاق المودال بتاع البوتستراب
          document.getElementById('closeVisitModal')?.click();
        },
        error: () => { this.alertService.close(); this.alertService.error('Error scheduling visit'); }
      });
    }
  }

  submitActivity() {
    if (this.activityForm.valid) {
      this.alertService.showLoading('Logging activity...');
      this.crmService.logActivity(this.activityForm.value).subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('Activity logged successfully!');
          this.activityForm.reset({ leadId: this.leadId, assignedToId: this.currentBrokerId, activityType: 'Call' });
          this.loadLeadData(this.leadId); // تحديث الداتا
          document.getElementById('closeActivityModal')?.click();
        },
        error: () => { this.alertService.close(); this.alertService.error('Error logging activity'); }
      });
    }
  }

  
}