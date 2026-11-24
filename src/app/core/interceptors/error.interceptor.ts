import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/login')) {
        snackBar.open('Sesi habis, silakan login lagi', 'Close', { duration: 3000 });
        auth.logout();
      } else if (err.status === 0) {
        snackBar.open('Tidak bisa terhubung ke server', 'Close', { duration: 3000 });
      } else if (err.status >= 500) {
        snackBar.open('Terjadi kesalahan di server', 'Close', { duration: 3000 });
      }
      return throwError(() => err);
    }),
  );
};
