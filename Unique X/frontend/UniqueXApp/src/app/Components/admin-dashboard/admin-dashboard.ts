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
  homeBanners = signal<any[]>([]);
  activeTab = signal<'users' | 'props' | 'settings' |'banners'>('users');

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
  
  // نستخدم subscribe بذكاء لضمان تحميل البيانات
  this.adminService.getStats().subscribe({
    next: (data: any) => this.stats.set(data),
    error: (err) => console.error('Stats Error:', err)
  });

  this.adminService.getAllUsers().subscribe({
    next: (data: any[]) => this.users.set(data),
    error: (err) => console.error('Users Error:', err)
  });

  this.adminService.getDetailedProperties().subscribe({
    next: (data: any[]) => {
      this.properties.set(data);
      this.isLoading.set(false); // وقف التحميل هنا
    },
    error: (err) => {
      this.isLoading.set(false);
      console.error('Properties Error:', err);
    }
  });

  this.loadBanners(); 
}

  loadBanners() {
    this.adminService.getBanners().subscribe((data: any[]) => { // إضافة :any[] ✅
        this.homeBanners.set(data);
    });
  }

  onAddBanner(title: string, fileInput: any) {
    const file = fileInput.files[0];
    if (!file || !title) {
        this.alertService.error('Please provide a title and select an image.');
        return;
    }

    this.alertService.showLoading('Uploading banner...');
    this.adminService.addBanner(file, title).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('Banner added successfully!');
        this.loadBanners(); // ريفريش للقائمة
        fileInput.value = ''; // تصفير الـ input
      }
    });
  }

  onDeleteBanner(id: number) {
    this.alertService.confirm('Delete this banner from homepage?', () => {
      this.adminService.deleteBanner(id).subscribe(() => this.loadBanners());
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

  switchTab(tab: 'users' | 'props' | 'settings' | 'banners') {
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