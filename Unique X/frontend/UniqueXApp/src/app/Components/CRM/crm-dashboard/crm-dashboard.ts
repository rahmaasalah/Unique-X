import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CrmService } from '../../../Services/crm.services';
import { AdminDashboardDto, BrokerDashboardDto } from '../../../Models/crm.models';

@Component({
  selector: 'app-crm-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './crm-dashboard.html',
  styleUrls: ['./crm-dashboard.css']
})
export class CrmDashboardComponent implements OnInit {
  private crmService = inject(CrmService);

  isAdmin = signal<boolean>(false);
  adminStats = signal<AdminDashboardDto | null>(null);
  brokerStats = signal<BrokerDashboardDto | null>(null);

  showTasksList = signal<boolean>(false);

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
      } 
      // لو اليوزر بروكر، نجيب إحصائياته الشخصية
      else if (roles.includes('Broker')) {
        this.isAdmin.set(false);
        this.loadBrokerDashboard(brokerId);
      }
    }
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