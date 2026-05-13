import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'leads',
        loadComponent: () => import('./pages/leads/leads.component').then((m) => m.LeadsComponent),
      },
      {
        path: 'pipeline',
        loadComponent: () => import('./pages/pipeline/pipeline.component').then((m) => m.PipelineComponent),
      },
      {
        path: 'project-photos',
        loadComponent: () => import('./pages/project-photos/project-photos.component').then((m) => m.ProjectPhotosComponent),
      },
      {
        path: 'partner-profile',
        loadComponent: () => import('./pages/partner-profile/partner-profile.component').then((m) => m.PartnerProfileComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
