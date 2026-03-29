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
  currentFinancialFile = signal<any>(null);

  // 2. حل مشكلة 'settings' type mismatch
  // أضفنا 'settings' للأنواع المسموحة للـ Signal
  homeBanners = signal<any[]>([]);
  activeTab = signal<'users' | 'props' | 'settings' | 'banners' | 'sold' | 'whatsapp' | 'calls' | 'suspUsers' | 'suspProps' | 'financial' | 'pending'>('users');

  detailData = signal<any[]>([]);

  adminForm!: FormGroup;

  userSearchText = signal('');
  userTypeFilter = signal(''); 
  pendingProperties = signal<any[]>([]);// الكل، بروكر، أو كلاينت
  
  propSearchText = signal('');
  propListingFilter = signal('');
  propTypeFilter = signal('');
  isSidebarOpen = false;


  // إحصائيات سريعة
  totalUsers = computed(() => this.users().length);
  totalProperties = computed(() => this.properties().length);
  activePropertiesCount = computed(() => this.properties().filter(p => p.isActive).length); // حساب النشط فقط
  suspendedUsersCount = computed(() => this.users().filter(u => !u.isActive).length);
  suspendedPropertiesCount = computed(() => this.properties().filter(p => !p.isActive && p.isApproved).length);
  soldPropertiesCount = computed(() => this.properties().filter(p => p.isSold).length);

  brokersList = computed(() => this.users().filter(u => u.userType === 1));



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
    this.loadPendingProperties();
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
  this.loadFinancialFile();
}

  loadBanners() {
    this.adminService.getBanners().subscribe((data: any[]) => { // إضافة :any[] ✅
        this.homeBanners.set(data);
    });
  }

  toggleSidebar() {
  this.isSidebarOpen = !this.isSidebarOpen;
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

  switchTab(tab: any) {
  this.activeTab.set(tab);
  this.isSidebarOpen = false;
  
  if (tab === 'sold') {
    this.adminService.getSoldProperties().subscribe(data => this.detailData.set(data));
  } 
  else if (tab === 'whatsapp') {
    this.adminService.getActivityLogs('WhatsAppClick').subscribe(data => this.detailData.set(data));
  }
  else if (tab === 'calls') {
    this.adminService.getActivityLogs('CallClick').subscribe(data => this.detailData.set(data));
  }

  else if (tab === 'suspUsers') {
    this.adminService.getSuspendedUsers().subscribe(data => this.detailData.set(data));
  }
  else if (tab === 'suspProps') {
    this.adminService.getSuspendedProperties().subscribe(data => this.detailData.set(data));
  }
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
        
        this.alertService.success('Listing visibility updated');
        this.loadAllData();
      }
    });
  }

  viewPropertyDetails(prop: any) {
  this.selectedProperty.set(prop); 
  
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

  onReassignBroker(prop: any, event: any) {
    const newBrokerId = event.target.value;
    const selectElement = event.target; // نحتفظ بالعنصر (Dropdown) للتحكم فيه

    // لو اختار نفس الشخص الحالي، ميعملش حاجة
    if (!newBrokerId || newBrokerId === prop.brokerId) return;

    this.alertService.confirm('Are you sure you want to reassign this property to another broker?', () => {
      // لو الأدمن داس موافق (OK)
      this.alertService.showLoading('Reassigning property...');
      
      this.adminService.reassignProperty(prop.id, newBrokerId).subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('Property reassigned successfully!');
          this.loadAllData(); // تحديث الجدول عشان يقرا الداتا الجديدة
        },
        error: () => {
          this.alertService.close();
          this.alertService.error('Failed to reassign property.');
          selectElement.value = prop.brokerId; // نرجعه للاسم القديم لو حصل مشكلة
        }
      });
    });

    // لو الأدمن داس Cancel في التنبيه (لو الـ alertService بتاعتك مش بتدعم دي، القائمة هتتحدث لوحدها مع ريفريش الصفحة)
    // بس للاحتياط بنرجع القيمة القديمة يدوياً في حالة إنه مكملش العملية
    setTimeout(() => {
      const swalContainer = document.querySelector('.swal2-container');
      if (!swalContainer) {
        selectElement.value = prop.brokerId;
      }
    }, 500);
  }

  // ================== 🟢 إدارة ملف الحسابات (Financial) ==================
  loadFinancialFile() {
    this.adminService.getFinancialFile().subscribe({
      next: (data) => this.currentFinancialFile.set(data),
      error: () => this.currentFinancialFile.set(null) // لو مفيش ملف هيفضل null
    });
  }

  onUploadFinancial(fileInput: any) {
    const file = fileInput.files[0];
    if (!file) {
      this.alertService.error('Please select an Excel or CSV file first.');
      return;
    }

    this.alertService.showLoading('Uploading Data File...');
    this.adminService.uploadFinancialFile(file).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('Financial Data Updated Successfully!');
        this.loadFinancialFile(); 
        fileInput.value = ''; 
      },
      error: (err) => {
        this.alertService.close();
        this.alertService.error(err.error || 'Failed to upload file.');
      }
    });
  }

  onDeleteFinancial(id: number) {
    this.alertService.confirm('Are you sure you want to delete the current financial data?', () => {
      this.alertService.showLoading('Deleting...');
      this.adminService.deleteFinancialFile(id).subscribe({
        next: () => {
          this.alertService.close();
          this.alertService.success('File deleted.');
          this.loadFinancialFile();
        }
      });
    });
  }

  loadPendingProperties() {
  this.adminService.getPendingProperties().subscribe(data => 
    this.pendingProperties.set(data)
  );
}

onApproveProperty(id: number) {
  this.alertService.confirm('Approve this property and publish it?', () => {
    this.alertService.showLoading('Approving...');
    this.adminService.approveProperty(id).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('Property approved and published!');
        this.loadPendingProperties();
        this.loadAllData();
        document.getElementById('closeModalBtn')?.click(); 
      }
    });
  });
}

onRejectProperty(id: number) {
  // أول حاجة: اقفل الـ Bootstrap modal مؤقتاً
  const modalElement = document.getElementById('adminPropModal');
  const bootstrap = (window as any).bootstrap;
  const modalInstance = bootstrap.Modal.getInstance(modalElement);
  modalInstance?.hide();

  // استنى الـ modal يقفل الأول، وبعدين افتح SweetAlert
  setTimeout(() => {
    const swal = (window as any).Swal;
    swal.fire({
      title: 'Reject Property',
      input: 'textarea',
      inputLabel: 'Reason for rejection',
      inputPlaceholder: 'Enter the reason...',
      inputAttributes: { 'aria-label': 'Reason' },
      showCancelButton: true,
      confirmButtonColor: '#ef3341',
      confirmButtonText: 'Reject',
      inputValidator: (value: string) => {
        if (!value) return 'Please enter a reason!';
        return undefined;
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.alertService.showLoading('Rejecting...');
        this.adminService.rejectProperty(id, result.value).subscribe({
          next: () => {
            this.alertService.close();
            this.alertService.success('Property rejected.');
            this.loadPendingProperties();
          }
        });
      } else {
        // لو الأدمن كانسل، افتح الـ modal تاني
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
    });
  }, 500);
}

}