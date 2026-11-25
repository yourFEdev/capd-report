import { Component, EventEmitter, Output } from '@angular/core';
import { inject } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  template: `
    <header
      class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-4"
    >
      <!-- Left: Hamburger -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          (click)="onToggleSidebar()"
          class="flex size-10 cursor-pointer items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary lg:hidden"
          aria-label="Toggle sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div class="flex items-center gap-3">
        <div
          class="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
        >
          {{ auth.user()?.name.charAt(0)?.toUpperCase() ?? 'G' }}
        </div>

        <div class="hidden sm:block">
          <p class="text-sm font-semibold text-text-primary">
            {{ auth.user()?.name ?? 'Guest' }}
          </p>

          <p class="text-xs text-text-muted">
            {{ auth.user()?.role ?? 'Guest' }}
          </p>
        </div>
      </div>
    </header>
  `,
})
export class NavbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  auth = inject(AuthService);
}
