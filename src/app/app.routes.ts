import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { StartSessionComponent } from './pages/start-session/start-session.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const appRoutes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'start', loadComponent: () => import('./pages/start-session/start-session.component').then(m => m.StartSessionComponent) },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
];

