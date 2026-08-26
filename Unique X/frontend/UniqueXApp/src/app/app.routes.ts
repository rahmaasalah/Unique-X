import { Routes } from '@angular/router';
import { authGuard } from './Guards/auth-guard';
import { guestGuard } from './Guards/guest-guard';
import { adminGuard } from './Guards/admin-guard';
import { leadFeedbackGuard } from './Guards/lead-feedback-guard';
import { InvestmentCalculatorComponent } from './Components/investment-calculator/investment-calculator';
import { LaunchDetailComponent } from './Components/launch-detail/launch-detail';
import { LaunchListComponent } from './Components/launch-list/launch-list';

export const routes: Routes = [
  // ===== Public =====
  { path: '', loadComponent: () => import('./Components/home/home').then(m => m.HomeComponent), pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./Components/home/home').then(m => m.HomeComponent) },
  { path: 'login', loadComponent: () => import('./Components/login/login').then(m => m.LoginComponent), canActivate: [guestGuard] },
  { path: 'register', loadComponent: () => import('./Components/register/register').then(m => m.RegisterComponent), canActivate: [guestGuard] },
  { path: 'forgot-password', loadComponent: () => import('./Components/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./Components/reset-password/reset-password').then(m => m.ResetPasswordComponent) },
  { path: 'find-agent', loadComponent: () => import('./Components/find-agent/find-agent').then(m => m.FindAgentComponent) },
  { path: 'property-details/:id', loadComponent: () => import('./Components/property-details/property-details').then(m => m.PropertyDetailsComponent) },
  { path: 'property-details/:id/:title', loadComponent: () => import('./Components/property-details/property-details').then(m => m.PropertyDetailsComponent) },
  { path: 'compare/:ids', loadComponent: () => import('./Components/compare-properties/compare-properties').then(m => m.ComparePropertiesComponent) },
  { path: 'compare', loadComponent: () => import('./Components/compare-properties/compare-properties').then(m => m.ComparePropertiesComponent) },
  { path: 'price-per-meter-search', loadComponent: () => import('./Components/price-range-search/price-range-search').then(m => m.PriceRangeSearchComponent) },
  { path: 'recommendation-results', loadComponent: () => import('./Components/recommendation-results/recommendation-results').then(m => m.RecommendationResultsComponent), canActivate: [authGuard] },
  { path: 'join-our-team', loadComponent: () => import('./Components/join-our-team/join-our-team').then(m => m.JoinOurTeamComponent) },
  { path: 'blog', loadComponent: () => import('./Components/blog-list/blog-list').then(m => m.BlogListComponent) },
  { path: 'blog/:id', loadComponent: () => import('./Components/blog-detail/blog-detail').then(m => m.BlogDetailComponent) },
  { path: 'explore-home', loadComponent: () => import('./Components/explore-home/explore-home').then(m => m.ExploreHomeComponent) },
  // 🟢 Blogs (Articles) - منفصلين تمامًا عن /blog (اللي هو في الحقيقة Projects)
  { path: 'blogs', loadComponent: () => import('./Components/article-list/article-list').then(m => m.ArticleListComponent) },
  { path: 'blogs/:id', loadComponent: () => import('./Components/article-detail/article-detail').then(m => m.ArticleDetailComponent) },
  { path: 'blogs/:id/:slug', loadComponent: () => import('./Components/article-detail/article-detail').then(m => m.ArticleDetailComponent) },

  // ===== Auth Required =====
  { path: 'add-property', loadComponent: () => import('./Components/add-property/add-property').then(m => m.AddPropertyComponent), canActivate: [authGuard] },
  { path: 'add-your-property', loadComponent: () => import('./Components/add-property/add-property').then(m => m.AddPropertyComponent), canActivate: [authGuard], data: { ownerMode: true } },
  { path: 'my-properties', loadComponent: () => import('./Components/my-properties/my-properties').then(m => m.MyPropertiesComponent), canActivate: [authGuard] },
  { path: 'edit-property/:id', loadComponent: () => import('./Components/edit-property/edit-property').then(m => m.EditPropertyComponent), canActivate: [authGuard] },
  { path: 'wishlist', loadComponent: () => import('./Components/wishlist/wishlist').then(m => m.WishlistComponent), canActivate: [authGuard] },
  { path: 'settings', loadComponent: () => import('./Components/settings/settings').then(m => m.SettingsComponent), canActivate: [authGuard] },
  { path: 'shortlist', loadComponent: () => import('./Components/shortlist/shortlist').then(m => m.ShortlistComponent), canActivate: [authGuard] },
  { path: 'visit-list', loadComponent: () => import('./Components/visitlist/visitlist').then(m => m.VisitListComponent), canActivate: [authGuard] },
  { path: 'profile', loadComponent: () => import('./Components/profile/profile').then(m => m.ProfileComponent), canActivate: [authGuard] },

  // ===== Admin =====
  { path: 'admin', loadComponent: () => import('./Components/admin-dashboard/admin-dashboard').then(m => m.AdminDashboardComponent), canActivate: [adminGuard] },
  { path: 'investment-calculator', component: InvestmentCalculatorComponent },
  { path: 'launch', component: LaunchListComponent },
{ path: 'launch/:id', component: LaunchDetailComponent },
{ path: 'launch/:id/:slug', component: LaunchDetailComponent },
  // ===== CRM =====
  { path: 'crm/leads', loadComponent: () => import('./Components/CRM/leads-dashboard/leads-dashboard').then(m => m.LeadsDashboardComponent) },
  { path: 'crm/leads/:id', loadComponent: () => import('./Components/CRM/lead-details/lead-details').then(m => m.LeadDetailsComponent), canDeactivate: [leadFeedbackGuard] },
  { path: 'crm/notifications/:category', loadComponent: () => import('./Components/CRM/notification-category/notification-category').then(m => m.NotificationCategoryComponent) },
  { path: 'crm/leads/:id/edit', loadComponent: () => import('./Components/CRM/edit-request/edit-request').then(m => m.EditRequestComponent) },
  { path: 'crm/dashboard', loadComponent: () => import('./Components/CRM/crm-dashboard/crm-dashboard').then(m => m.CrmDashboardComponent) },
  { path: 'crm/profile', loadComponent: () => import('./Components/CRM/broker-profile/broker-profile').then(m => m.BrokerProfileComponent) },
  { path: 'crm/campaigns', loadComponent: () => import('./Components/CRM/campaigns-manager/campaigns-manager').then(m => m.CampaignsManagerComponent) },
  { path: 'crm/add-lead', loadComponent: () => import('./Components/CRM/add-lead/add-lead').then(m => m.AddLeadComponent) },

  // ===== Fallback =====
  { path: '**', redirectTo: '/login' }
];