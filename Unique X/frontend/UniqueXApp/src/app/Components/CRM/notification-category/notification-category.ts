import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CrmService } from '../../../Services/crm.services';

@Component({
  selector: 'app-notification-category',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-category.html',
  styleUrls: ['./notification-category.css']
})
export class NotificationCategoryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private crmService = inject(CrmService);

  // 'today' | 'late' | 'too-late'
  category = signal<string>('today');
  items = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  // عناوين وألوان كل category عشان الصفحة تتلون حسب اللي البروكر جاي منه
  categoryTitle = computed(() => {
    const c = this.category();
    if (c === 'late') return 'Late';
    if (c === 'too-late') return 'Too Late';
    return 'Today';
  });

  categoryColorClass = computed(() => {
    const c = this.category();
    if (c === 'late') return 'text-warning';
    if (c === 'too-late') return 'text-danger';
    return 'text-primary';
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.category.set(params.get('category') || 'today');
      this.loadItems();
    });
  }

  loadItems() {
    this.isLoading.set(true);
    const userString = localStorage.getItem('user');
    if (!userString) { this.isLoading.set(false); return; }
    const user = JSON.parse(userString);
    const brokerId = user.id || user.userId || '';
    if (!brokerId) { this.isLoading.set(false); return; }

    this.crmService.getBrokerDashboard(brokerId).subscribe({
      next: (res: any) => {
        const c = this.category();
        let tasks: any[] = [];
        let visits: any[] = [];

        if (c === 'today') { tasks = res.todayTasks || []; visits = res.todayVisits || []; }
        else if (c === 'late') { tasks = res.lateTasks || []; visits = res.lateVisits || []; }
        else { tasks = res.tooLateTasks || []; visits = res.tooLateVisits || []; }

        const mappedTasks = tasks.map((t: any) => ({
          leadId: t.leadId, leadName: t.leadName, type: t.activityType,
          summary: t.summary, date: t.dueDate, lateStatus: t.lateStatus
        }));
        const mappedVisits = visits.map((v: any) => ({
          leadId: v.leadId, leadName: v.leadName, type: 'Visit',
          summary: 'Location: ' + v.location, date: v.visitDate, lateStatus: v.lateStatus
        }));

        this.items.set([...mappedTasks, ...mappedVisits].sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        ));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}