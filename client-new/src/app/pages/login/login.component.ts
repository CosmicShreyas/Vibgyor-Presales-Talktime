import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  error = '';
  loading = false;

  async ngOnInit(): Promise<void> {
    await this.auth.initFromStorage();
    if (this.auth.user()) {
      void this.router.navigateByUrl('/');
    }
  }

  get isDark(): boolean {
    return this.theme.isDark();
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  async submit(e: Event): Promise<void> {
    e.preventDefault();
    this.error = '';
    this.loading = true;
    const res = await this.auth.login(this.email, this.password);
    this.loading = false;
    if (!res.success) {
      this.error = res.message || 'Login failed';
      return;
    }
    await this.router.navigateByUrl('/');
  }
}
