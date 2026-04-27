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

  ngOnInit() {
    // جلب الـ ID بتاع البروكر
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      this.currentBrokerId = user.id || user.userId || ''; 
    }

    this.leadId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.leadId) {
      this.loadLeadData(this.leadId);
      this.initForms();
    }

    // حساب الوقت الحالي لمنع اختيار تواريخ سابقة
  const now = new Date();
  this.minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  initForms() {
    this.visitForm = this.fb.group({
      leadId:[this.leadId],
      brokerId: [this.currentBrokerId],
      propertyId: [''],
      visitDate: ['', [Validators.required, futureDateValidator()]], 
      location:['', Validators.required]
    });

    this.activityForm = this.fb.group({
      leadId:[this.leadId],
      assignedToId: [this.currentBrokerId],
      activityType: ['Call', Validators.required],
      summary: ['', Validators.required],
      // 👇 وضفنا المُدقق هنا
      dueDate: ['',[Validators.required, futureDateValidator()]],
      notes: ['']
    });
  }

  loadLeadData(id: number) {
    this.crmService.getLeadDetails(id).subscribe({
      next: (res) => {
        this.leadInfo.set(res.leadInfo);
        this.requestDetails.set(res.requestDetails);
        this.visits.set(res.visits || []);
        this.activities.set(res.activities ||[]);
        this.statusHistory.set(res.statusHistory ||[]);
      },
      error: (err) => console.error('Error fetching lead details:', err)
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

  onDeleteLead() {
  this.alertService.confirm('Are you sure you want to completely delete this lead? All associated visits and calls will be permanently removed.', () => {
    this.alertService.showLoading('Deleting Lead...');
    this.crmService.deleteLead(this.leadId).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('Lead deleted permanently.');
        this.router.navigate(['/crm/leads']); // نرجعه لصفحة الأعمدة
      },
      error: () => {
        this.alertService.close();
        this.alertService.error('Failed to delete lead.');
      }
    });
  });
}
}