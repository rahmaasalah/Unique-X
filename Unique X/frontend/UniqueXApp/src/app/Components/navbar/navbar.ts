import { Component, inject } from '@angular/core';
import { AuthService } from '../../Services/auth';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CurrencyService, CurrencyCode } from '../../Services/currency.service';

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

  setCurrency(code: CurrencyCode) {
    this.currencyService.setCurrency(code);
  }

  onLogout() {
    this.authService.logout();
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}