import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CrmService } from '../../../Services/crm.services';
import { AlertService } from '../../../Services/alert';
import { AdminDashboardDto, BrokerDashboardDto } from '../../../Models/crm.models';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-crm-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './crm-dashboard.html',
  styleUrls: ['./crm-dashboard.css']
})
export class CrmDashboardComponent implements OnInit {
  private crmService = inject(CrmService);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);
  isAdmin = signal<boolean>(false);
  adminStats = signal<AdminDashboardDto | null>(null);
  brokerStats = signal<BrokerDashboardDto | null>(null);

  showTasksList = signal<boolean>(false);

  campaignsList = signal<any[]>([]);
  campaignForm!: FormGroup;

  toggleTasks() {
    this.showTasksList.update(v => !v);
  }

  ngOnInit() {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      const brokerId = user.id || user.userId || '';
      const roles = user.roles ||[];

      // لو اليوزر أدمن، نجيب إحصائيات الشركة
      if (roles.includes('Admin')) {
       this.isAdmin.set(true);
       this.loadAdminDashboard();
       // 👇 تحميل الحملات وتعريف الفورم
       this.loadCampaigns();
       this.campaignForm = this.fb.group({
         name: ['', Validators.required],
         source: ['Facebook', Validators.required]
       });
    }
      // لو اليوزر بروكر، نجيب إحصائياته الشخصية
      else if (roles.includes('Broker')) {
        this.isAdmin.set(false);
        this.loadBrokerDashboard(brokerId);
      }
    }
  }

  loadCampaigns() {
    this.crmService.getCampaigns().subscribe(data => this.campaignsList.set(data));
  }

  onSubmitCampaign() {
    if (this.campaignForm.valid) {
      this.alertService.showLoading('Adding Campaign...');
      this.crmService.createCampaign(this.campaignForm.value).subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('Campaign Added!');
          this.campaignForm.reset({ source: 'Facebook' });
          this.loadCampaigns();
        }
      });
    }
  }

  onDeleteCampaign(id: number) {
    this.alertService.confirm('Delete this campaign?', () => {
      this.crmService.deleteCampaign(id).subscribe(() => this.loadCampaigns());
    });
  }

  loadAdminDashboard() {
    this.crmService.getAdminDashboard().subscribe({
      next: (data) => this.adminStats.set(data),
      error: (err) => console.error('Error loading admin dashboard', err)
    });
  }

  loadBrokerDashboard(brokerId: string) {
    this.crmService.getBrokerDashboard(brokerId).subscribe({
      next: (data) => this.brokerStats.set(data),
      error: (err) => console.error('Error loading broker dashboard', err)
    });
  }
}