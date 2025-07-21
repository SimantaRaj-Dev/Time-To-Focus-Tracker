import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'history', loadComponent: () => import('./pages/history/history.component').then(m => m.HistoryComponent) },
  { path: 'insights', loadComponent: () => import('./pages/insight/insight.component').then(m => m.InsightComponent) },
  { path: '**', redirectTo: '' }
];



