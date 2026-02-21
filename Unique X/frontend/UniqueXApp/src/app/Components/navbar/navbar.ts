import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../Services/auth';
import { Router, RouterModule, ActivatedRoute} from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html'
})
export class NavbarComponent {
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  activeType = signal<string | null>(null);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const type = params['listingType'];
      console.log('Current Active ListingType:', type); // للـ Debugging: شوفي الكونسول هل الرقم بيتغير؟
      
      // نستخدم الـ toString للتأكد من مطابقة النوع في الـ HTML
      this.activeType.set(type !== undefined ? type.toString() : null);
    });
  }

  onLogout() {
    this.authService.logout();
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}