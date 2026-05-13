import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  showPassword = false;
  error = '';
  loading = false;

  async ngOnInit(): Promise<void> {
    await this.auth.initFromStorage();
    if (this.auth.isAuthenticated()) {
      void this.router.navigateByUrl('/');
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    this.error = '';
    this.loading = true;
    try {
      await this.auth.login(this.email, this.password);
      await this.router.navigateByUrl('/');
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Login failed';
    } finally {
      this.loading = false;
    }
  }
}
