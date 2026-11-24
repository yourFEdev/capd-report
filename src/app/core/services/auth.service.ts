import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private url = environment.apiUrl;

  private _token = signal<string | null>(localStorage.getItem('token'));
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());

  login(credentials: { username: string; password: string }) {
    return this.http.post<{ token: string }>(`${this.url}/auth/login`, credentials).pipe(
      tap((res) => {
        localStorage.setItem('token', res.token);
        this._token.set(res.token);
      }),
    );
  }

  register(credentials: { name: string; username: string; password: string }) {
    return this.http
      .post<{ token: string }>(`${this.url}/auth/register`, credentials)
      .pipe(tap((res) => {}));
  }

  logout() {
    localStorage.removeItem('token');
    this._token.set(null);
    this.router.navigate(['/login']);
  }
}
