import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./Components/navbar/navbar";
import { FooterComponent } from "./Components/footer/footer";
import { CrmNavbarComponent } from './Components/CRM/crm-navbar/crm-navbar'; 
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs'; // 👈 ضفنا استيراد filter هنا
import { Inject } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, CrmNavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);  


  isCrmRoute = false; 
  protected readonly title = signal('UniqueXApp');

  isAdminArea(): boolean {
  return this.router.url.includes('/admin'); // بيفحص لو الرابط فيه كلمة admin
}

constructor() {
    // بنراقب الرابط، لو اتغير وفي كلمة crm/ بنخلي المتغير true
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isCrmRoute = event.urlAfterRedirects.includes('/crm');
    });
  }
}
