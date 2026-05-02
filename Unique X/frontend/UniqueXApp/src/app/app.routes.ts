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
import { ComparePropertiesComponent } from './Components/compare-properties/compare-properties';
import { LeadsDashboardComponent } from './Components/CRM/leads-dashboard/leads-dashboard'; 
import { LeadDetailsComponent } from './Components/CRM/lead-details/lead-details';
import { CrmDashboardComponent } from './Components/CRM/crm-dashboard/crm-dashboard';
import { BrokerProfileComponent } from './Components/CRM/broker-profile/broker-profile';
import { AddLeadComponent } from './Components/CRM/add-lead/add-lead';
import { EditRequestComponent } from './Components/CRM/edit-request/edit-request';

export const routes: Routes = [
  { 
    path: 'admin', 
    component: AdminDashboardComponent, // الكومبوننت اللي هتعمليه للأدمن
    canActivate: [adminGuard] // تفعيل الحماية
  },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },

  { path: 'find-agent', component: FindAgentComponent },
  { path: 'home', component: HomeComponent },
  { path: 'add-property', component: AddPropertyComponent, canActivate: [authGuard] },
  { path: 'property-details/:id', component: PropertyDetailsComponent },
  { path: 'property-details/:id/:title', component: PropertyDetailsComponent },
  { path: 'forgot-password', loadComponent: () => import('./Components/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent) },
{ path: 'reset-password', loadComponent: () => import('./Components/reset-password/reset-password').then(m => m.ResetPasswordComponent) },
  { path: 'my-properties', component: MyPropertiesComponent, canActivate: [authGuard] },
  { path: 'edit-property/:id', component: EditPropertyComponent, canActivate: [authGuard] },
  { path: 'wishlist', component: WishlistComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'compare/:id1/:id2', component: ComparePropertiesComponent },
  { 
    path: 'crm/leads', 
    component: LeadsDashboardComponent 
  },
  { 
  path: 'crm/leads/:id', 
  component: LeadDetailsComponent 
},
{ 
  path: 'crm/dashboard', 
  component: CrmDashboardComponent 
},

{ 
  path: 'crm/profile', 
  component: BrokerProfileComponent 
},
{ path: 'crm/leads/:id/edit', component: EditRequestComponent },
{ path: 'crm/add-lead', component: AddLeadComponent },
 { path: '', component: HomeComponent, pathMatch: 'full' }, 
 { path: '**', redirectTo: '/login' }
];
