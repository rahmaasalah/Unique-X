import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LaunchService } from '../../Services/launch.service';
import { CurrencyService } from '../../Services/currency.service';

@Component({
  selector: 'app-launch-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './launch-list.html'
})
export class LaunchListComponent implements OnInit {
  launchService = inject(LaunchService);
  currencyService = inject(CurrencyService);
  private router = inject(Router);

  launches = signal<any[]>([]);
  isLoading = signal(true);
  activeZone = signal<string>('');

  // رقم الأدمن ثابت في السيستم (نفس الرقم المستخدم في صفحة التفاصيل)
  private readonly ADMIN_PHONE = '01509064020';

  zones = computed(() => {
    const zones = this.launches().map(l => l.zone).filter((z): z is string => !!z);
    return [...new Set(zones)];
  });

  filteredLaunches = computed(() => {
    const zone = this.activeZone();
    if (!zone) return this.launches();
    return this.launches().filter(l => l.zone === zone);
  });

  ngOnInit() {
    this.launchService.getPublished().subscribe({
      next: (data) => { this.launches.set(data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  goToLaunch(id: number) {
    this.router.navigate(['/launch', id]);
  }

  getFirstImage(launch: any): string {
    return this.launchService.getCoverImage(launch);
  }

  // Download button → بيفتح واتساب الأدمن باستفسار عن اللانش + لينكه (اللينك نفسه بيعمل بريفيو تلقائي)
  sendInquiry(launch: any, event: Event): void {
    event.stopPropagation(); // منع فتح صفحة اللانش لما يدوس على الزرار

    const cleaned = '20' + this.ADMIN_PHONE.replace(/^0+/, '');
    const launchLink = this.launchService.getLaunchLink(launch);

    const msg = encodeURIComponent(
      `Interested in launch: ${launch.title}\n${launchLink}`
    );

    window.open(`https://wa.me/${cleaned}?text=${msg}`, '_blank');
  }
}