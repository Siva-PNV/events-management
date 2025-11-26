import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Event {
  eventId?: number;
  eventTitle: string;
  eventDate: string;
  location: string;
  details: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  // private apiUrl = 'http://localhost:3001/api/events';
    private apiUrl = 'http://localhost:8090/events';
    private  adminApiUrl = 'http://localhost:8090/admin/events';


  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getUpcomingEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(this.apiUrl+`/upcoming`);
  }

  getPastEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/past-events`,{ headers: this.getAuthHeaders() });
  }

  postEvent(event: Event): Observable<any> {
    return this.http.post(this.adminApiUrl, event,{ headers: this.getAuthHeaders(), observe: 'response' });
  }

  updateEvent(id: number, event: Event): Observable<any> {
    return this.http.put(`${this.adminApiUrl}/${id}`, event, { headers: this.getAuthHeaders(), observe: 'response' });
  }

  deleteEvent(id: number): Observable<any> {
    return this.http.delete(`${this.adminApiUrl}/${id}`,{headers: this.getAuthHeaders() });
  }
}
