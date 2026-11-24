import { Routes } from '@angular/router';

import { guestGuard, authGuard } from './core/guard/auth.guard';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout';
import { Dashboard } from './features/dashboard/dashboard';
import { Setting } from './features/setting/setting';

export const routes: Routes = [
  // AUTH ROUTES (LOGIN & REGISTER)
  {
    path: '',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // PROTECTED ROUTES (ADMIN)
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: Dashboard,
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./features/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
      },
      {
        path: 'setting',
        component: Setting,
      },
    ],
  },

  // NOT FOUND
  {
    path: '**',
    redirectTo: '/login',
  },
];
