import { Routes } from '@angular/router';
import { LoginComponent } from './Components/login/login';
import { RegisterComponent } from './Components/register/register';
import { HomeComponent } from './Components/home/home';
import { authGuard } from './Guards/auth-guard';
import { guestGuard } from './Guards/guest-guard';
import { PropertyDetailsComponent } from './Components/property-details/property-details';
import { AddPropertyComponent } from './Components/add-property/add-property';
import { MyPropertiesComponent } from './Components/my-properties/my-properties';
import { EditPropertyComponent } from './Components/edit-property/edit-property';
import { WishlistComponent } from './Components/wishlist/wishlist';
import { ProfileComponent } from './Components/profile/profile';
import {adminGuard } from './Guards/admin-guard';
import { AdminDashboardComponent } from './Components/admin-dashboard/admin-dashboard';
import { FindAgentComponent } from './Components/find-agent/find-agent';

export const routes: Routes = [
  //{ path: 'login', component: LoginComponent },
  //{ path: 'register', component: RegisterComponent },

  { 
    path: 'admin', 
    component: AdminDashboardComponent, // الكومبوننت اللي هتعمليه للأدمن
    canActivate: [adminGuard] // تفعيل الحماية
  },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },

  { path: 'find-agent', component: FindAgentComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'add-property', component: AddPropertyComponent, canActivate: [authGuard] },
  { path: 'property-details/:id', component: PropertyDetailsComponent, canActivate: [authGuard] },
  { path: 'my-properties', component: MyPropertiesComponent, canActivate: [authGuard] },
  { path: 'edit-property/:id', component: EditPropertyComponent, canActivate: [authGuard] },
  { path: 'wishlist', component: WishlistComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },

  //{ path: 'home', component: HomeComponent, canActivate: [authGuard] },
  //{ path: 'property-details/:id', component: PropertyDetailsComponent, canActivate: [authGuard] },
  //{ path: 'add-property', component: AddPropertyComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' }, 
  { path: '**', redirectTo: '/login' }
];
