import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthorizationService, MyPermissions, PermissionCatalogItem } from '../../Services/authorization.service';

@Component({
  selector: 'app-my-permissions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-permissions.html',
  styleUrl: './my-permissions.css'
})
export class MyPermissionsComponent implements OnInit {
  private authorizationService = inject(AuthorizationService);
  private route = inject(ActivatedRoute);

  // 'Admin' لو جاي من صفحة profile، 'Crm' لو جاي من broker-profile
  dashboard = signal<'Admin' | 'Crm'>('Admin');

  isLoading = signal(true);
  myPermissions = signal<MyPermissions | null>(null);
  catalog = signal<PermissionCatalogItem[]>([]);

  isFullAccess = computed(() => this.myPermissions()?.isFullAdmin ?? false);

  roleNames = computed(() => {
    const mine = this.myPermissions();
    if (!mine) return [];
    return this.dashboard() === 'Admin' ? mine.adminRoleNames : mine.crmRoleNames;
  });

  grantedKeys = computed(() => {
    const mine = this.myPermissions();
    if (!mine) return new Set<string>();
    if (mine.isFullAdmin) return new Set(this.catalog().map(c => c.key));
    const keys = this.dashboard() === 'Admin' ? mine.adminPermissions : mine.crmPermissions;
    return new Set(keys || []);
  });

  ngOnInit(): void {
    const dashboardParam = this.route.snapshot.queryParamMap.get('dashboard');
    this.dashboard.set(dashboardParam === 'Crm' ? 'Crm' : 'Admin');

    this.authorizationService.getCatalog(this.dashboard()).subscribe({
      next: (list) => this.catalog.set(list)
    });

    this.authorizationService.getMyPermissions().subscribe({
      next: (data) => { this.myPermissions.set(data); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); }
    });
  }

  isGranted(key: string): boolean {
    return this.grantedKeys().has(key);
  }
}