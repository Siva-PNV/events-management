import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminUser {
  id: number;
  username: string;
  role?: string;
  created_at?: string;
  created_by?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private api = 'http://localhost:3001/api';
  constructor(private http: HttpClient) {}

  listAdmins(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.api}/admin/users`);
  }

  addAdmin(username: string, password: string, role: string = 'admin',loggedinUser:string): Observable<any> {
    return this.http.post(`${this.api}/admin/users`, { username, password, role,loggedinUser });
  }

  deleteAdmin(id: number): Observable<any> {
    return this.http.request('delete', `${this.api}/admin/users`, { body: { id } });
  }
}
