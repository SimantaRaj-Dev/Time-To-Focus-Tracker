import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { StartSessionComponent } from './pages/start-session/start-session.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const appRoutes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'start', component: StartSessionComponent },
  { path: 'dashboard', component: DashboardComponent }
];

