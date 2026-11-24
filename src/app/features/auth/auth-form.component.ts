import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

export type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-auth-form',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-background p-4">
      <div
        class="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8"
      >
        <h1 class="mb-6 text-2xl font-semibold text-text-primary">{{ title() }}</h1>

        <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
          @if (isRegister()) {
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-text-secondary" for="name">Name</label>
              <input
                id="name"
                formControlName="name"
                class="rounded-lg border border-border bg-surface px-3 py-2 text-text-primary outline-none transition focus:border-border-focus focus:ring-2 focus:ring-primary-soft"
              />
              @if (form.controls.name.touched && form.controls.name.invalid) {
                <span class="text-xs text-warning-text">Name is required</span>
              }
            </div>
          }

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-text-secondary" for="username">Username</label>
            <input
              id="username"
              formControlName="username"
              class="rounded-lg border border-border bg-surface px-3 py-2 text-text-primary outline-none transition focus:border-border-focus focus:ring-2 focus:ring-primary-soft"
            />
            @if (form.controls.username.touched && form.controls.username.invalid) {
              <span class="text-xs text-warning-text">Username is required</span>
            }
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-text-secondary" for="password">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              class="rounded-lg border border-border bg-surface px-3 py-2 text-text-primary outline-none transition focus:border-border-focus focus:ring-2 focus:ring-primary-soft"
            />
            @if (form.controls.password.touched && form.controls.password.invalid) {
              <span class="text-xs text-warning-text">Password is required</span>
            }
          </div>

          @if (error()) {
            <p class="rounded-lg bg-warning px-3 py-2 text-sm text-warning-text">{{ error() }}</p>
          }

          <button
            type="submit"
            [disabled]="form.invalid || loading()"
            class="cursor-pointer rounded-lg bg-primary py-2.5 font-medium text-text-inverse transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-text"
          >
            {{ loading() ? 'Loading...' : title() }}
          </button>
        </form>

        <p class="mt-4 text-center text-sm text-text-muted">
          @if (isRegister()) {
            have account?
            <a
              routerLink="/login"
              class="font-medium text-primary hover:text-primary-hover hover:underline"
              >Login</a
            >
          } @else {
            dont have account?
            <a
              routerLink="/register"
              class="font-medium text-primary hover:text-primary-hover hover:underline"
              >Register</a
            >
          }
        </p>
      </div>
    </div>
  `,
})
export class AuthForm {
  private fb = inject(FormBuilder).nonNullable;
  private auth = inject(AuthService);
  private router = inject(Router);

  mode = input<AuthMode>('login');
  returnUrl = input<string>();

  isRegister = computed(() => this.mode() === 'register');
  title = computed(() => (this.isRegister() ? 'Register' : 'Login'));

  loading = signal(false);
  error = signal('');

  form = this.fb.group({
    name: [''],
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      const name = this.form.controls.name;
      if (this.isRegister()) {
        name.addValidators(Validators.required);
      } else {
        name.clearValidators();
      }
      name.updateValueAndValidity();
    });

    effect(() => {
      this.mode();
      this.error.set('');
      this.form.reset();
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    const { name, username, password } = this.form.getRawValue();

    const request$ = this.isRegister()
      ? this.auth.register({ name, username, password })
      : this.auth.login({ username, password });

    request$.subscribe({
      next: () => {
        const fallback = this.isRegister() ? '/login' : '/reports';

        this.router
          .navigateByUrl(this.returnUrl() ?? fallback)
          .then((success) => {
            if (!success) {
              this.loading.set(false);
              this.error.set('Gagal berpindah halaman');
            }
          })
          .catch(() => {
            this.loading.set(false);
            this.error.set('Terjadi kesalahan navigasi');
          });
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.isRegister() ? 'register failed' : 'Username or password wrong');
      },
    });
  }
}
