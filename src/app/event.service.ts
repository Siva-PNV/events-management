import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Event {
  event_id?: number;
  event_title: string;
  event_date: string;
  location: string;
  details: string;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private apiUrl = 'http://localhost:3001/api/events';

  constructor(private http: HttpClient) {}

  getUpcomingEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(this.apiUrl);
  }

  getPastEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/past`);
  }

  postEvent(event: Event): Observable<any> {
    return this.http.post(this.apiUrl, event);
  }

  updateEvent(id: number, event: Event): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, event);
  }

  deleteEvent(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
