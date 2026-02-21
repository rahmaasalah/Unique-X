import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./Components/navbar/navbar";
import { FooterComponent } from "./Components/footer/footer";
import { Router } from '@angular/router';
import { Inject } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  router = inject(Router);  
  protected readonly title = signal('UniqueXApp');

  isAdminArea(): boolean {
  return this.router.url.includes('/admin'); // بيفحص لو الرابط فيه كلمة admin
}
}
