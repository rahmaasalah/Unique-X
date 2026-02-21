import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../Services/admin';
import { AlertService } from '../../Services/alert';
import { AuthService } from '../../Services/auth'; // مهم جداً
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms'; // 1. حل مشكلة formGroup

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  // أضفنا ReactiveFormsModule هنا
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule], 
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private alertService = inject(AlertService);
  public authService = inject(AuthService); // لجلب بيانات البروفايل
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // --- السجنلز ---
  users = signal<any[]>([]);
  properties = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  stats = signal<any>({});
  userData = signal<any>(null); // بيانات الأدمن الشخصية
  selectedProperty = signal<any>(null); 

  // 2. حل مشكلة 'settings' type mismatch
  // أضفنا 'settings' للأنواع المسموحة للـ Signal
  activeTab = signal<'users' | 'props' | 'settings'>('users');

  adminForm!: FormGroup;

  userSearchText = signal('');
  userTypeFilter = signal(''); // الكل، بروكر، أو كلاينت
  
  propSearchText = signal('');
  propListingFilter = signal('');
  propTypeFilter = signal('');

  // إحصائيات سريعة
  totalUsers = computed(() => this.users().length);
  totalProperties = computed(() => this.properties().length);
  suspendedUsersCount = computed(() => this.users().filter(u => !u.isActive).length);
  soldPropertiesCount = computed(() => this.properties().filter(p => p.isSold).length);


  filteredUsers = computed(() => {
    return this.users().filter(u => {
      const search = this.userSearchText().toLowerCase();
      const matchesName = (u.firstName + ' ' + u.lastName).toLowerCase().includes(search) || u.email.toLowerCase().includes(search);
      const matchesType = this.userTypeFilter() === '' || u.userType.toString() === this.userTypeFilter();
      return matchesName && matchesType;
    });
  });

  // فلترة العقارات لحظياً
  filteredProperties = computed(() => {
    return this.properties().filter(p => {
      const search = this.propSearchText().toLowerCase();
      const matchesTitle = p.title.toLowerCase().includes(search) || (p.code && p.code.toLowerCase().includes(search));
      const matchesListing = this.propListingFilter() === '' || p.listingType === this.propListingFilter();
      const matchesType = this.propTypeFilter() === '' || p.propertyType === this.propTypeFilter();
      return matchesTitle && matchesListing && matchesType;
    });
  });


  ngOnInit(): void {
    // تعريف فورم الإعدادات
    this.adminForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      phoneNumber: ['', Validators.required]
    });

    this.loadAllData();
    this.loadAdminProfile();
  }

  loadAllData() {
    this.isLoading.set(true);
    this.adminService.getStats().subscribe(data => this.stats.set(data));
    this.adminService.getAllUsers().subscribe(data => this.users.set(data));
    this.adminService.getDetailedProperties().subscribe(data => {
      this.properties.set(data);
      this.isLoading.set(false);
    });
  }

  loadAdminProfile() {
    this.authService.getProfile().subscribe(data => {
      this.userData.set(data);
      this.adminForm.patchValue(data);
    });
  }

  // 3. كود دالة رفع صور البروفايل للأدمن
  onImageChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.alertService.showLoading('Uploading your photo...');
      this.authService.uploadProfileImage(file).subscribe({
        next: (res: any) => {
          this.alertService.close();
          // تحديث الصورة في السجنل فوراً
          this.userData.update(current => ({ ...current, profileImageUrl: res.url }));
          
          // تحديث الـ LocalStorage عشان النافبار (لو لسه بتستخدميه)
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          user.profileImageUrl = res.url;
          localStorage.setItem('user', JSON.stringify(user));
          
          this.alertService.success('Profile photo updated!');
        },
        error: () => {
          this.alertService.close();
          this.alertService.error('Upload failed');
        }
      });
    }
  }

  // 4. حل مشكلة Property 'onUpdateProfile' does not exist
  onUpdateProfile() {
    if (this.adminForm.valid) {
      this.alertService.showLoading('Updating system data...');
      this.authService.updateProfile(this.adminForm.getRawValue()).subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('Your profile has been updated!');
          this.loadAdminProfile(); // ريفريش للبيانات
        },
        error: () => {
          this.alertService.close();
          this.alertService.error('Update failed');
        }
      });
    }
  }

  switchTab(tab: 'users' | 'props' | 'settings') {
    this.activeTab.set(tab);
  }

  toggleUser(userId: string, currentStatus: boolean) {
    this.adminService.toggleUserStatus(userId).subscribe({
      next: () => {
        this.loadAllData();
        this.alertService.success('Status Changed');
      }
    });
  }

  toggleProperty(propId: number, currentStatus: boolean) {
    this.adminService.togglePropertyStatus(propId).subscribe({
      next: () => {
        this.loadAllData();
        this.alertService.success('Listing visibility updated');
      }
    });
  }

  viewPropertyDetails(prop: any) {
  // وضع بيانات العقار اللي ضغطتي عليه جوه السجنل
  this.selectedProperty.set(prop); 
  
  // تشغيل المودال الخاص ببوتستراب برمجياً
  const bootstrap = (window as any).bootstrap;
  const modalElement = document.getElementById('adminPropModal');
  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }
}

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserTypeLabel(type: number) {
    return type === 1 ? 'Broker' : type === 2 ? 'Admin' : 'Client';
  }
}