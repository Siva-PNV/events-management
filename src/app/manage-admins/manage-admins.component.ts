import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUser } from '../admin.service';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-manage-admins',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './manage-admins.component.html',
  styleUrls: ['./manage-admins.component.scss'],
})
export class ManageAdminsComponent implements OnInit {
  admins: AdminUser[] = [];
  username = '';
  password = '';
  confirm = '';
  message = '';
  messageType: 'success' | 'error' | '' = '';
  loading = false;
  isSameAdmin!: number | null;
  private messageTimer: any = null;

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadAdmins();
    this.isSameAdmin = Number(localStorage.getItem('admin_id'));
  }

  loadAdmins() {
    this.loading = true;
    console.log('Loading admins, setting loading ', this.loading);
    this.adminService.listAdmins().subscribe({
      next: (list) => {
        console.log('Loaded admins:', list);
        this.admins = Array.isArray(list) ? list : [];
        console.log('Admins after assignment:', this.admins);
        this.loading = false;
        console.log('Loading state after fetch:', this.loading);
        try {
          this.cdr.detectChanges();
        } catch (err) {
          /* ignore */
        }
      },
      error: (e) => {
        // catchError returns an observable, so this should rarely run, but keep fallback
        console.error('Error loading admins (subscribe)', e);
        this.message = e?.error?.error || 'Failed to load admins';
        this.messageType = 'error';
        this.admins = [];
        this.loading = false;
      },
    });
  }

  addAdmin() {
    const usernamePattern = /^[A-Za-z0-9]{8}$/;
    if (!this.username || !usernamePattern.test(this.username)) {
      this.message = 'Username must be exactly 8 alphanumeric characters.';
      this.messageType = 'error';
      return;
    }
    if (!this.password || this.password.length < 6) {
      this.message = 'Password must be at least 6 characters.';
      this.messageType = 'error';
      return;
    }
    if (this.password !== this.confirm) {
      this.message = 'Passwords do not match.';
      this.messageType = 'error';
      return;
    }
    const loggedinUser = localStorage.getItem('username')|| '';
    this.adminService.addAdmin(this.username, this.password, 'admin',loggedinUser).subscribe({
      next: () => {
        this.messageType = 'success';
        this.message = 'Admin user added successfully!';
        this.username = '';
        this.password = '';
        this.confirm = '';
        this.loadAdmins();
        if (this.messageTimer) clearTimeout(this.messageTimer);
        this.messageTimer = setTimeout(() => {
          this.message = '';
          this.messageType = '';
          try { this.cdr.detectChanges(); } catch (e) {}
          this.messageTimer = null;
        }, 3000);
        try { this.cdr.detectChanges(); } catch (e) {}
      },
      error: (e) => {
        this.message = e?.error?.error || 'Failed to add admin';
        this.messageType = 'error';
        try { this.cdr.detectChanges(); } catch (e) {}
      },
    });
  }

  deleteAdmin(id: number) {
    if (!confirm('Are you sure you want to delete this admin user?')) return;
    const me = localStorage.getItem('admin_id');
    if (String(id) === me) {
      this.message = 'You cannot delete your own account.';
      this.messageType = 'error';
      return;
    }
    this.adminService.deleteAdmin(id).subscribe({
      next: () => {
        this.messageType = 'success';
        this.message = 'Admin deleted.';
        this.loadAdmins();
        if (this.messageTimer) clearTimeout(this.messageTimer);
        this.messageTimer = setTimeout(() => {
          this.message = '';
          this.messageType = '';
          try { this.cdr.detectChanges(); } catch (e) {}
          this.messageTimer = null;
        }, 3000);
        try { this.cdr.detectChanges(); } catch (e) {}
      },
      error: (e) => {
        this.message = e?.error?.error || 'Failed to delete admin';
        this.messageType = 'error';
      },
    });
  }
}
