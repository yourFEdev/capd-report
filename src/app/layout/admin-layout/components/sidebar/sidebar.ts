import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `<aside
    class="fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-surface shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:shadow-none"
    [class.translate-x-0]="isOpen"
    [class.-translate-x-full]="!isOpen"
  >
    <!-- Header -->
    <div class="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
      <div class="flex items-center gap-3">
        <div
          class="flex size-9 items-center justify-center rounded-xl bg-primary font-bold text-text-inverse"
        >
          CR
        </div>
        <span class="text-lg font-bold text-text-primary"> CAPD REPORT </span>
      </div>
      <button
        type="button"
        class="rounded-lg p-2 text-text-muted transition hover:bg-primary-soft hover:text-primary-dark lg:hidden"
        (click)="onNavigate()"
        aria-label="Close sidebar"
      >
        ✕
      </button>
    </div>

    <!-- Menu -->
    <div class="flex-1 overflow-y-auto px-4 py-6">
      <p class="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Main Menu
      </p>
      <nav class="space-y-1">
        @for (menu of menus; track menu.route) {
          <a
            [routerLink]="menu.route"
            routerLinkActive="!bg-primary !text-text-inverse shadow-[var(--shadow-card)]"
            [routerLinkActiveOptions]="{ exact: false }"
            (click)="onNavigate()"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-primary-soft hover:text-primary-dark"
          >
            <span class="w-6 text-center text-lg">{{ menu.icon }}</span>
            {{ menu.label }}
          </a>
        }
      </nav>
    </div>

    <!-- Logout -->
    <div class="mt-auto shrink-0 border-t border-border p-4">
      <button
        type="button"
        (click)="logout()"
        class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-warning-text transition-colors hover:bg-warning"
      >
        <span class="w-6 text-center text-lg">↪</span>
        Logout
      </button>
    </div>
  </aside> `,
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  private authService = inject(AuthService);
  private router = inject(Router);

  menus = [
    {
      label: 'Dashboard',
      icon: '⌂',
      route: '/dashboard',
    },
    {
      label: 'Reports',
      icon: '▤',
      route: '/reports',
    },
    {
      label: 'Setting',
      icon: '⚙',
      route: '/setting',
    },
  ];

  logout() {
    this.authService.logout();
    this.closeSidebar.emit();
    this.router.navigate(['/login']);
  }

  onNavigate() {
    this.closeSidebar.emit();
  }
}
