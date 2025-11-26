import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminUser {
  id: number;
  username: string;
  role?: string;
  createdAt?: string;
  createdBy?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private api = 'http://localhost:8090/';
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  listAdmins(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.api}admin/users`, { headers: this.getAuthHeaders() });
  }

  addAdmin(username: string, password: string, role: string = 'admin',createdBy:string): Observable<any> {
    return this.http.post(`${this.api}admin/users`, { username, password, role,createdBy }, { headers: this.getAuthHeaders() });
  }

  deleteAdmin(id: number): Observable<any> {
    return this.http.delete(`${this.api}admin/users?id=${id}`, { headers: this.getAuthHeaders() });
  }
}
