import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  username = '';
  password = '';
  submitting = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';
  redirect = '/post-event';

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('redirect');
    if (r) this.redirect = r;
  }

  submit() {
    if (!this.username || !this.password) {
      this.messageType = 'error';
      this.message = 'Please enter both username and password.';
      return;
    }
    this.submitting = true;
    this.auth.login(this.username, this.password).subscribe({
      next: (res) => {
        // store minimal session in localStorage for SPA behavior
        localStorage.setItem('is_admin', 'true');
        localStorage.setItem('admin_role', res.role || 'admin');
        localStorage.setItem('username', res.username);
        localStorage.setItem('admin_id', String(res.id));
        this.messageType = 'success';
        this.message = 'Login successful. Redirecting...';
        setTimeout(() => this.router.navigateByUrl(this.redirect), 700);
      },
      error: (err) => {
        this.messageType = 'error';
        this.message = err?.error?.error || 'Login failed. Please check credentials.';
        this.submitting = false;
        setTimeout(() => {
          this.message = '';
          this.messageType = '';
        }, 4000);
      },
    });
  }
}
