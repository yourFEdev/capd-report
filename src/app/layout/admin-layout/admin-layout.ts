import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavbarComponent } from './components/navbar/navbar';
import { SidebarComponent } from './components/sidebar/sidebar';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent],
  templateUrl: './admin-layout.html',
})
export class AdminLayoutComponent {
  isSidebarOpen = signal(false);

  toggleSidebar() {
    this.isSidebarOpen.update((value) => !value);
  }

  closeSidebar() {
    this.isSidebarOpen.set(false);
  }
}
