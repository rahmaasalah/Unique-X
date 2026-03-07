import { Component, inject, signal, OnInit } from '@angular/core';
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
      // نستخدم الـ toString للتأكد من مطابقة النوع في الـ HTML
      this.activeType.set(type !== undefined ? type.toString() : null);
    });
  }

  closeMenu() {
    const navbarCollapse = document.getElementById('navbarNav');
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
      navbarCollapse.classList.remove('show');
    }
  }

  onLogout() {
    this.authService.logout();
    localStorage.clear();
    this.closeMenu();
    this.router.navigate(['/login']);
  }
}