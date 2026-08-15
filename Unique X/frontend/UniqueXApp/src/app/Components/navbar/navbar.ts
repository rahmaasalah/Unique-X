import { Component, inject } from '@angular/core';
import { AuthService } from '../../Services/auth';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CurrencyService, CurrencyCode } from '../../Services/currency.service';
import { RecommendationModalService } from '../../Services/recommendation-modal.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html'
})
export class NavbarComponent {
  authService = inject(AuthService);
  router = inject(Router);
  currencyService = inject(CurrencyService);
  recommendationModalService = inject(RecommendationModalService);

  setCurrency(code: CurrencyCode) {
    this.currencyService.setCurrency(code);
  }

  // 🟢 لو مش واقفين في صفحة الهوم، نوديه للهوم الأول (المودال هيبان تلقائي بمجرد ما يوصل، لأنه بيقرا نفس الـ service)
  onGetRecommendationsClick() {
    this.recommendationModalService.open();
    const currentPath = this.router.url.split('?')[0];
    if (currentPath !== '/home' && currentPath !== '/') {
      this.router.navigate(['/home']);
    }
  }

  onLogout() {
    this.authService.logout();
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}