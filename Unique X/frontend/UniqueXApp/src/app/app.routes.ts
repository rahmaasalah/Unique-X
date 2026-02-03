import { Routes } from '@angular/router';
import { LoginComponent } from './Components/login/login';
import { RegisterComponent } from './Components/register/register';
import { HomeComponent } from './Components/home/home';
import { authGuard } from './Guards/auth-guard';
import { guestGuard } from './Guards/guest-guard';
import { PropertyDetailsComponent } from './Components/property-details/property-details';
import { AddPropertyComponent } from './Components/add-property/add-property';

export const routes: Routes = [
  //{ path: 'login', component: LoginComponent },
  //{ path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },


  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'add-property', component: AddPropertyComponent, canActivate: [authGuard] },
  { path: 'property-details/:id', component: PropertyDetailsComponent, canActivate: [authGuard] },

  //{ path: 'home', component: HomeComponent, canActivate: [authGuard] },
  //{ path: 'property-details/:id', component: PropertyDetailsComponent, canActivate: [authGuard] },
  //{ path: 'add-property', component: AddPropertyComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' }, 
  { path: '**', redirectTo: '/login' }
];
