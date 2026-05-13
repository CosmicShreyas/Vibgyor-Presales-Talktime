import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ThemeService } from '../core/theme.service';
import { SidebarIconComponent, SidebarIconName } from './sidebar-icon.component';

type SidebarLink = {
  path: string;
  label: string;
  icon: SidebarIconName;
};

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, SidebarIconComponent],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {
  readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  readonly overviewLinks: SidebarLink[] = [
    { path: '/', label: 'Dashboard', icon: 'dashboard' },
    { path: '/leads', label: 'Leads', icon: 'leads' },
    { path: '/pipeline', label: 'Pipeline', icon: 'pipeline' },
    { path: '/project-photos', label: 'Project Photos', icon: 'project-photos' },
  ];

  readonly accountLinks: SidebarLink[] = [
    { path: '/partner-profile', label: 'Partner Profile', icon: 'partner-profile' },
  ];

  get isDark(): boolean {
    return this.theme.isDark();
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
