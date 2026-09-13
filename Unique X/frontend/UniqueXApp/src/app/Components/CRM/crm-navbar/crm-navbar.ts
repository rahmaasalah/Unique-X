import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CrmService } from '../../../Services/crm.services';
import { AlertService } from '../../../Services/alert';
import { AuthService } from '../../../Services/auth';

@Component({
  selector: 'app-crm-navbar',
  standalone: true,
  imports:[CommonModule, RouterModule],
  templateUrl: './crm-navbar.html',
  styleUrls:['./crm-navbar.css']
})
export class CrmNavbarComponent implements OnInit {
  private crmService = inject(CrmService);
  private alertService = inject(AlertService);
  private authService = inject(AuthService);
  private router = inject(Router);

  brokerName = signal<string>('');
  brokerImage = signal<string>('https://cdn-icons-png.flaticon.com/512/149/149071.png');
  notifications = signal<any[]>([]); 

  // 🟢 الإشعارات بقت 3 categories: Today / Late / Too Late
  todayCount = signal<number>(0);
  lateCount = signal<number>(0);
  tooLateCount = signal<number>(0);

  // 🟢 إشعارات دائمة (زي تنبيه سحب عميل) - منفصلة عن الـ Reminders بتاعة المهام
  leadAlerts = signal<any[]>([]);
  leadAlertsUnreadCount = signal<number>(0);
  private seenLeadAlertIds = new Set<number>();
  
  private pollingInterval: any; // مؤقت التحديث التلقائي
  private alertedItems = new Set<string>();

  isAdmin = signal<boolean>(false); // 👈 متغير جديد لتحديد الأدمن


   ngOnInit() {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      
      // 🟢 فحص هل المستخدم أدمن
      const roles = user.roles ||[];
      const isUserAdmin = roles.includes('Admin') || user.userType === 2 || user.userType === 'Admin';
      this.isAdmin.set(isUserAdmin);

      // تحديد الاسم بناءً على الصلاحية
      if (isUserAdmin) {
        this.brokerName.set('Admin Control');
      } else {
        this.brokerName.set(user.username || 'Broker');
      }

      if (user.profileImageUrl) this.brokerImage.set(user.profileImageUrl);

      // 🟢 تحميل الإشعارات وتشغيل الجرس (فقط لو مش أدمن)
      if (!isUserAdmin) {
        const brokerId = user.id || user.userId || '';
        if (brokerId) {
          this.loadNotifications(brokerId);
          this.loadLeadAlerts(brokerId);

          this.pollingInterval = setInterval(() => {
            this.loadNotifications(brokerId);
            this.loadLeadAlerts(brokerId);
          }, 60000); 

          this.crmService.refreshNavbar$.subscribe(() => {
            this.loadNotifications(brokerId);
            this.loadLeadAlerts(brokerId);
          });
        }
      }
    }
  }

  goToMainWebsite() {
    const userString = localStorage.getItem('user');
    
    if (userString) {
      const user = JSON.parse(userString);
      const roles = user.roles || [];
      
      const isAdmin = roles.includes('Admin') || user.userType === 2 || user.userType === 'Admin';
      const isBroker = roles.includes('Broker') || user.userType === 1;

      if (isAdmin) {
        this.router.navigate(['/admin-dashboard']);
      } else if (isBroker) {
        this.router.navigate(['/my-properties']); // مسار لوحة البروكر
      } else {
        this.router.navigate(['/home']); // لو عميل عادي يروح الرئيسية
      }
    } else {
      // لو مش عامل لوجن أصلاً يروح الرئيسية
      this.router.navigate(['/home']);
    }
  }

  ngOnDestroy() {
    // مسح المؤقت لما البروكر يقفل الشاشة
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  // 🟢 إشعارات سحب العملاء (وأي إشعارات دائمة تانية بعدين)
  loadLeadAlerts(brokerId: string) {
    this.crmService.getBrokerNotifications(brokerId).subscribe({
      next: (res: any[]) => {
        const list = res || [];
        this.leadAlerts.set(list);
        this.leadAlertsUnreadCount.set(list.filter(n => !n.isRead).length);

        // 🟢 لو فيه إشعار جديد لسه مشفتوش من قبل، نطلعله بوب أب فوري
        list.filter(n => !n.isRead && !this.seenLeadAlertIds.has(n.id)).forEach(n => {
          this.seenLeadAlertIds.add(n.id);
          this.alertService.error(n.message, 'Client Removed');
        });
      }
    });
  }

  markAlertRead(notification: any) {
    if (notification.isRead) return;
    this.crmService.markNotificationAsRead(notification.id).subscribe(() => {
      notification.isRead = true;
      this.leadAlertsUnreadCount.set(this.leadAlerts().filter(n => !n.isRead).length);
    });
  }

  loadNotifications(brokerId: string) {
    this.crmService.getBrokerDashboard(brokerId).subscribe({
      next: (res: any) => {
        if (res) {
          // 🟢 عدد كل category - جاهز من الباك إند
          this.todayCount.set(res.todayCount || 0);
          this.lateCount.set(res.lateCount || 0);
          this.tooLateCount.set(res.tooLateCount || 0);

          // بنحول كل الأنشطة/الزيارات (من الـ 3 categories) لشكل موحد عشان البوب أب بتاع التذكير
          const mapTask = (t: any) => {
            let dStr = t.dueDate;
            if (dStr && typeof dStr === 'string' && !dStr.endsWith('Z')) dStr += 'Z';
            return {
              id: 'task_' + t.id, leadId: t.leadId, leadName: t.leadName,
              type: t.activityType, summary: t.summary, date: new Date(dStr)
            };
          };
          const mapVisit = (v: any) => {
            let dStr = v.visitDate;
            if (dStr && typeof dStr === 'string' && !dStr.endsWith('Z')) dStr += 'Z';
            return {
              id: 'visit_' + v.id, leadId: v.leadId, leadName: v.leadName,
              type: 'Visit', summary: 'Location: ' + v.location, date: new Date(dStr)
            };
          };

          const allNotifs = [
            ...(res.todayTasks || []).map(mapTask),
            ...(res.lateTasks || []).map(mapTask),
            ...(res.tooLateTasks || []).map(mapTask),
            ...(res.todayVisits || []).map(mapVisit),
            ...(res.lateVisits || []).map(mapVisit),
            ...(res.tooLateVisits || []).map(mapVisit),
          ].sort((a, b) => b.date.getTime() - a.date.getTime());

          this.notifications.set(allNotifs);
          this.checkForImmediateAlerts(allNotifs);
        }
      }
    });
  }

  checkForImmediateAlerts(notifs: any[]) {
    const now = new Date();
    
    notifs.forEach(item => {
      // لو ميعاد المهمة عدى أو فاضل عليه 5 دقايق مثلاً
      const timeDiffMinutes = (item.date.getTime() - now.getTime()) / 60000;
      
      // نطلع إشعار لو الميعاد فاضل عليه بين 0 لـ 5 دقايق (أو لو ميعادها جه ولسه متعلمتش إنها خلصت)
      if (timeDiffMinutes <= 5 && timeDiffMinutes >= -60) {
        // بنتأكد إننا مطلعناش الإشعار ده قبل كده عشان ميزعجش البروكر
        if (!this.alertedItems.has(item.id)) {
          this.alertedItems.add(item.id);
          
          // إشعار بالصوت أو بوب أب
          this.alertService.warning(`Reminder: You have a ${item.type} with ${item.leadName} scheduled for ${item.date.toLocaleTimeString()}.`, 'Upcoming Action!');
        }
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/home']).then(() => {
      window.location.reload();
    });
  }
}