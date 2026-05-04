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
  
  private pollingInterval: any; // مؤقت التحديث التلقائي
  private alertedItems = new Set<string>();

  ngOnInit() {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      this.brokerName.set(user.username || 'Broker');
      if (user.profileImageUrl) this.brokerImage.set(user.profileImageUrl);

      const brokerId = user.id || user.userId || '';
      if (brokerId) {
        this.loadNotifications(brokerId);

        this.pollingInterval = setInterval(() => {
          this.loadNotifications(brokerId);
        }, 60000); 

         this.crmService.refreshNavbar$.subscribe(() => {
          this.loadNotifications(brokerId);
        });
      }
    }
  }

  ngOnDestroy() {
    // مسح المؤقت لما البروكر يقفل الشاشة
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  loadNotifications(brokerId: string) {
    this.crmService.getBrokerDashboard(brokerId).subscribe({
      next: (res) => {
        if (res) {
          
          // 1. دمج المهام وضبط فرق التوقيت (استخدمنا t: any عشان نحل الإيرور)
          const tasks = (res.pendingTasksList ||[]).map((t: any) => {
            let dStr = t.dueDate;
            if (dStr && typeof dStr === 'string' && !dStr.endsWith('Z')) dStr += 'Z';
            return {
              id: 'task_' + t.id,
              leadId: t.leadId,
              leadName: t.leadName,
              type: t.activityType,
              summary: t.summary,
              date: new Date(dStr)
            };
          });

          // 2. دمج الزيارات وضبط فرق التوقيت (استخدمنا v: any عشان نحل الإيرور)
          const visits = (res.pendingVisitsList ||[]).map((v: any) => {
            let dStr = v.visitDate;
            if (dStr && typeof dStr === 'string' && !dStr.endsWith('Z')) dStr += 'Z';
            return {
              id: 'visit_' + v.id,
              leadId: v.leadId,
              leadName: v.leadName,
              type: 'Visit',
              summary: 'Location: ' + v.location,
              date: new Date(dStr)
            };
          });

          // 3. 🟢 الفلترة السحرية: متظهرش المهمة إلا لو وقتها جه أو عدى!
          const now = new Date().getTime();
          
          const allNotifs =[...tasks, ...visits]
            .filter(item => item.date.getTime() <= now) // 👈 لو وقت المهمة أصغر من أو يساوي وقتك الحالي، تظهر
            .sort((a, b) => b.date.getTime() - a.date.getTime()); // الأحدث يظهر فوق

          // 4. تحديث الجرس
          this.notifications.set(allNotifs);

          // 5. بوب أب التنبيهات
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