import { Routes } from '@angular/router';

import { guestGuard, authGuard } from './core/guard/auth.guard';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout';

export const routes: Routes = [
  {
    path: '',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./features/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
