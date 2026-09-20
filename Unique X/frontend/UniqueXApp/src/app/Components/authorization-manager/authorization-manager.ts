import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AuthorizationService,
  CustomRole,
  CustomRoleMember,
  PermissionCatalogItem
} from '../../Services/authorization.service';
import { AlertService } from '../../Services/alert';

@Component({
  selector: 'app-authorization-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './authorization-manager.html',
  styleUrl: './authorization-manager.css'
})
export class AuthorizationManagerComponent implements OnInit {
  // 'Admin' لو التاب دي جوه admin-dashboard، 'Crm' لو جوه crm-dashboard
  @Input({ required: true }) dashboard!: 'Admin' | 'Crm';

  private authorizationService = inject(AuthorizationService);
  private alertService = inject(AlertService);

  isLoading = signal(false);
  roles = signal<CustomRole[]>([]);
  catalog = signal<PermissionCatalogItem[]>([]);
  allBrokers = signal<CustomRoleMember[]>([]);

  // فورم إنشاء/تعديل رول
  showForm = signal(false);
  editingRoleId = signal<number | null>(null);
  formName = signal('');
  formDescription = signal('');
  formSelectedPermissions = signal<Set<string>>(new Set());
  formSelectedMembers = signal<Set<string>>(new Set());
  brokerSearchText = signal('');

  filteredBrokers = computed(() => {
    const term = this.brokerSearchText().trim().toLowerCase();
    if (!term) return this.allBrokers();
    return this.allBrokers().filter(b =>
      b.fullName.toLowerCase().includes(term) ||
      (b.brokerCode || '').toLowerCase().includes(term) ||
      (b.phoneNumber || '').includes(term)
    );
  });

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll() {
    this.isLoading.set(true);
    this.authorizationService.getCatalog(this.dashboard).subscribe({
      next: (list) => this.catalog.set(list),
      error: () => {}
    });
    this.authorizationService.getBrokers().subscribe({
      next: (list) => this.allBrokers.set(list),
      error: () => {}
    });
    this.authorizationService.getRoles(this.dashboard).subscribe({
      next: (list) => { this.roles.set(list); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); }
    });
  }

  openCreateForm() {
    this.editingRoleId.set(null);
    this.formName.set('');
    this.formDescription.set('');
    this.formSelectedPermissions.set(new Set());
    this.formSelectedMembers.set(new Set());
    this.brokerSearchText.set('');
    this.showForm.set(true);
  }

  openEditForm(role: CustomRole) {
    this.editingRoleId.set(role.id);
    this.formName.set(role.name);
    this.formDescription.set(role.description || '');
    this.formSelectedPermissions.set(new Set(role.permissions));
    this.formSelectedMembers.set(new Set(role.members.map(m => m.userId)));
    this.brokerSearchText.set('');
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
  }

  togglePermission(key: string) {
    const set = new Set(this.formSelectedPermissions());
    if (set.has(key)) set.delete(key); else set.add(key);
    this.formSelectedPermissions.set(set);
  }

  toggleMember(userId: string) {
    const set = new Set(this.formSelectedMembers());
    if (set.has(userId)) set.delete(userId); else set.add(userId);
    this.formSelectedMembers.set(set);
  }

  isPermissionChecked(key: string): boolean {
    return this.formSelectedPermissions().has(key);
  }

  isMemberChecked(userId: string): boolean {
    return this.formSelectedMembers().has(userId);
  }

  saveRole() {
    if (!this.formName().trim()) {
      this.alertService.error('Please enter a role name');
      return;
    }
    if (this.formSelectedPermissions().size === 0) {
      this.alertService.error('Please select at least one permission');
      return;
    }
    if (this.formSelectedMembers().size === 0) {
      this.alertService.error('Please assign at least one broker to this role');
      return;
    }

    const payload = {
      name: this.formName().trim(),
      dashboard: this.dashboard,
      description: this.formDescription().trim() || null,
      permissionKeys: Array.from(this.formSelectedPermissions()),
      memberUserIds: Array.from(this.formSelectedMembers())
    };

    const roleId = this.editingRoleId();
    const request$ = roleId
      ? this.authorizationService.updateRole(roleId, payload)
      : this.authorizationService.createRole(payload);

    request$.subscribe({
      next: () => {
        this.alertService.success(roleId ? 'Role updated successfully' : 'Role created successfully');
        this.showForm.set(false);
        this.loadAll();
      },
      error: (err) => {
        this.alertService.error(err?.error?.message || err?.error || 'Something went wrong, please try again');
      }
    });
  }

  deleteRole(role: CustomRole) {
    if (!confirm(`Are you sure you want to delete the role "${role.name}"?`)) return;
    this.authorizationService.deleteRole(role.id).subscribe({
      next: () => {
        this.alertService.success('Role deleted successfully');
        this.loadAll();
      },
      error: (err) => this.alertService.error(err?.error?.message || 'Something went wrong while deleting')
    });
  }

  permissionLabel(key: string): string {
    return this.catalog().find(c => c.key === key)?.label || key;
  }
}