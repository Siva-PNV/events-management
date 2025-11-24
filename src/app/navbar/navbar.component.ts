import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  mobileOpen = false;

  toggleMobile() {
    this.mobileOpen = !this.mobileOpen;
  }

  // Flags come from localStorage
  isAdmin = false;
  isMasterAdmin = false;
  adminRole = '';
  username = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.refreshAuthState();
    // If other tabs change auth state, update here
    window.addEventListener('storage', () => this.refreshAuthState());
  }

  private refreshAuthState() {
    this.isAdmin = localStorage.getItem('is_admin') === 'true';
    const role = localStorage.getItem('admin_role') || '';
    this.adminRole = role;
    this.username = localStorage.getItem('username') || '';
    this.isMasterAdmin = role === 'master';
  }

  closeOnNavigate() {
    if (this.mobileOpen) {
      this.mobileOpen = false;
    }
  }

  logout() {
    // Clear SPA auth state
    localStorage.removeItem('is_admin');
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_id');
     localStorage.removeItem('admin_username');
    this.refreshAuthState();
    // Close mobile menu if open
    if (this.mobileOpen) this.mobileOpen = false;
    // Navigate to login page
    this.router.navigate(['/']);
  }
}
