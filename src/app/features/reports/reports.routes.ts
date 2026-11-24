import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./report-list.component').then((m) => m.ReportListComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('./report-form.component').then((m) => m.ReportFormComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./report-form.component').then((m) => m.ReportFormComponent),
  },
];
