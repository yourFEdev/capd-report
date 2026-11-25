import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthResponse, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private url = environment.apiUrl;

  private _token = signal<string | null>(localStorage.getItem('token'));
  private _user = signal<User | null>(null);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();

  readonly isLoggedIn = computed(() => !!this._token());

  login(credentials: { username: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.url}/auth/login`, credentials).pipe(
      tap((res) => {
        console.log('[AUTH] Login response:', res);
        console.log('[AUTH] User response:', res.user);

        localStorage.setItem('token', res.token);

        this._token.set(res.token);
        this._user.set(res.user);

        console.log('[AUTH] User signal:', this._user());
      }),
    );
  }

  register(credentials: { name: string; username: string; password: string }) {
    return this.http.post(`${this.url}/auth/register`, credentials);
  }

  logout() {
    localStorage.removeItem('token');

    this._token.set(null);
    this._user.set(null);

    this.router.navigate(['/login']);
  }
}
