import { Routes } from '@angular/router';
import { AuthForm } from './auth-form.component';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    component: AuthForm,
    data: { mode: 'login' },
  },
  {
    path: 'register',
    component: AuthForm,
    data: { mode: 'register' },
  },
];
