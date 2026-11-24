import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  template: `
<header class="bg-surface sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
  <div class="flex items-center gap-3">
    <button
      type="button"
      (click)="onToggleSidebar()"
      class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground none md:hidden cursor-pointer"
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
  <div class="flex items-center gap-2 sm:gap-3">
    <div class="flex items-center gap-2 pl-3 sm:gap-3 sm:pl-4">
      <div class="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        AD
      </div>
      <div class="hidden sm:block">
        <p class="text-sm font-semibold">Admin User</p>
        <p class="text-xs text-muted-foreground">Administrator</p>
      </div>
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
}
