import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const snackBar = inject(MatSnackBar);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/login')) {
        snackBar.open('Session expired, please log in again', 'Close', { duration: 3000 });
        auth.logout();
        router.navigate(['/login']);
      } else if (err.status === 0) {
        snackBar.open('Cannot connect to the server', 'Close', { duration: 3000 });
      } else if (err.status >= 500) {
        snackBar.open('A server error occurred', 'Close', { duration: 3000 });
      }
      return throwError(() => err);
    }),
  );
};
