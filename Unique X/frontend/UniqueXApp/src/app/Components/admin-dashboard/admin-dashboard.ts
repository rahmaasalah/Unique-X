import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../Services/admin';
import { AlertService } from '../../Services/alert';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {
  // --- الخدمات ---
  private adminService = inject(AdminService);
  private alertService = inject(AlertService);

  // --- السجنلز (Signals) لإدارة الحالة ---
  users = signal<any[]>([]);
  properties = signal<any[]>([]);
  activeTab = signal<'users' | 'props'>('users'); // التبويب النشط حالياً
  isLoading = signal<boolean>(false);

  // --- إحصائيات محسوبة (Computed Signals) ---
  totalUsers = computed(() => this.users().length);
  totalProperties = computed(() => this.properties().length);
  suspendedUsersCount = computed(() => this.users().filter(u => !u.isActive).length);

  ngOnInit(): void {
    // تحميل البيانات عند فتح الصفحة
    this.loadAllData();
  }

  // تحميل كل البيانات من الباك اند
  loadAllData() {
    this.isLoading.set(true);
    
    // جلب المستخدمين
    this.adminService.getAllUsers().subscribe({
      next: (data) => this.users.set(data),
      error: (err) => console.error('Error fetching users', err)
    });

    // جلب العقارات
    this.adminService.getAllProperties().subscribe({
      next: (data) => {
        this.properties.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error fetching properties', err);
      }
    });
  }

  // تغيير التبويب (Tabs)
  switchTab(tabName: 'users' | 'props') {
    this.activeTab.set(tabName);
  }

  // --- إدارة المستخدمين ---
  toggleUser(userId: string, currentStatus: boolean) {
    const action = currentStatus ? 'Suspend' : 'Activate';
    
    this.alertService.confirm(`Are you sure you want to ${action} this user?`, () => {
      this.adminService.toggleUserStatus(userId).subscribe({
        next: () => {
          this.alertService.success(`User has been ${action}ed successfully.`);
          this.loadAllData(); // إعادة تحميل القائمة لتحديث الحالة في الجدول
        },
        error: () => this.alertService.error('Failed to change user status.')
      });
    });
  }

  // --- إدارة العقارات ---
  toggleProperty(propId: number, currentStatus: boolean) {
    const action = currentStatus ? 'Deactivate' : 'Activate';

    this.alertService.confirm(`Are you sure you want to ${action} this property listing?`, () => {
      this.adminService.togglePropertyStatus(propId).subscribe({
        next: () => {
          this.alertService.success(`Property is now ${action}d.`);
          this.loadAllData(); // تحديث الجدول فوراً
        },
        error: () => this.alertService.error('Failed to change property status.')
      });
    });
  }

  // دالة مساعدة لتنسيق نوع المستخدم
  getUserTypeLabel(type: number): string {
    return type === 1 ? 'Broker' : 'Client';
  }
}