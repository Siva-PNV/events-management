import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService, Event } from '../event.service';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.scss'],
})
export class EventsListComponent implements OnInit {
  events$!: Observable<Event[]>;
  selectedEvent: Event | null = null;
  isAdmin = false;
  editSelectedEvent: Event | null = null;
  editModel: { eventTitle: string; eventDate: string; location: string; details: string } | null = null;
  editDateISO: string = '';
  editTimeISO: string = '';
  editDisplayDate: string = '';
  editDisplayTime: string = '';
  toastMessage: string = '';
  toastType: 'success' | 'error' | '' = '';
  toastVisible = false;
    minDate = '';
  minTime = '';
    minDateTime = '';

  constructor(private eventService: EventService,private changeDetectorRef: ChangeDetectorRef) {
    this.refreshEvents();
    this.isAdmin = localStorage.getItem('is_admin') === 'true';
  }

  ngOnInit() {
    this.setMinDateTime();
  }

setMinDateTime() {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    this.minDateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    this.minDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    this.minTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  bgFor(title: string): string {
    const t =  title.toLowerCase();
    if (t.includes('singing') || t.includes('music')) return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';
    if (t.includes('dance')) return 'assets/dance.jpeg';
    if (t.includes('sports')) return 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80';
    if (t.includes('tech') || t.includes('robot')) return 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80';
    if (t.includes('art')) return 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=600&q=80';
    if (t.includes('quiz')) return 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=600&q=80';
    if (t.includes('campus recruitment') || t.includes('hiring') || t.includes('drive')) return 'assets/drive.jpeg';
    if (t.includes('test') || t.includes('assignments') || t.includes('exam')) return 'assets/test.jpeg';
    return 'https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=600&q=80';
  }

  closeModal() {
    this.selectedEvent = null;
  }

  refreshEvents() {
    this.events$ = this.eventService.getUpcomingEvents().pipe(
      tap(() => console.log('Refreshed events list', new Date().toISOString()))
    );
  }

  openEdit(event: Event) {
    if (!event) return;
    // Do NOT close detail modal; allow edit modal to stack above
    this.editSelectedEvent = event;
    const info = this.parseDateTime(event.eventDate);
    this.editDateISO = info.isoDate;
    this.editTimeISO = info.isoTime;
    this.editDisplayDate = info.displayDate;
    this.editDisplayTime = info.displayTime;
    this.editModel = {
      eventTitle: event.eventTitle,
      eventDate: `${info.isoDate} ${info.isoTime}:00`,
      location: event.location,
      details: event.details,
    };
    console.log('Opened edit modal', { id: event.eventId, raw: event.eventDate, isoDate: this.editDateISO, isoTime: this.editTimeISO, displayDate: this.editDisplayDate, displayTime: this.editDisplayTime });
    // Focus will move to edit modal (tabindex on container); ensure change detection
    this.changeDetectorRef.markForCheck();
  }

  onEditClick(event: Event, domEvent: any) {
    domEvent?.stopPropagation?.();
    this.openEdit(event);
  }

  selectEvent(event: Event, domEvent: MouseEvent) {
    // If click originated within admin actions bar, ignore (handled separately)
    const target = domEvent.target as HTMLElement | null;
    if (target && target.closest('.admin-actions')) {
      return; // admin action handler will manage its own logic
    }
    // Ensure any previous edit modal is closed so only detail modal shows
    if (this.editSelectedEvent) {
      this.closeEditModal();
    }
    this.selectedEvent = event;
  }

  confirmDelete(event: Event) {
    if (!event.eventId) return;
    const ok = confirm('Are you sure you want to delete this event?');
    if (!ok) return;
    console.log('Attempting delete for event', event.eventId);
    this.eventService.deleteEvent(event.eventId).subscribe({
      next: () => {
        console.log('Delete success for event', event.eventId);
        // Manual fetch to verify network call before assigning observable
        this.eventService.getUpcomingEvents().subscribe({
          next: (events) => {
            console.log('Manual fetch after delete. Events length:', events);
            this.refreshEvents();
            this.changeDetectorRef.detectChanges();
            this.showToast('Event deleted successfully', 'success');
          },
          error: (e) => {
            console.error('Manual fetch after delete failed', e);
            this.showToast('Failed to refresh after delete', 'error');
          }
        });
        if (this.selectedEvent && this.selectedEvent.eventId === event.eventId) {
          this.closeModal();
        }
      },
      error: (err) => {
        console.error('Delete failed', err);
        this.showToast('Failed to delete event', 'error');
      },
    });
  }

  closeEditModal() {
    this.editSelectedEvent = null;
    this.editModel = null;
    console.log('Closed edit modal');
  }

  saveEdit() {
    if (!this.editSelectedEvent || !this.editSelectedEvent.eventId || !this.editModel) return;
    const id = this.editSelectedEvent.eventId;
    const normalizedDateTime = `${this.editDateISO} ${this.editTimeISO}:00`;
    const payload: Event = {
      eventTitle: this.editModel.eventTitle.trim(),
      eventDate: normalizedDateTime,
      location: this.editModel.location.trim(),
      details: this.editModel.details.trim(),
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    if (!payload.eventTitle || !payload.eventDate || !payload.location) {
      alert('Title, date, and location are required');
      return;
    }
    this.eventService.updateEvent(id, payload).subscribe({
      next: () => {
        console.log('Update success for event', id);
        if (this.selectedEvent && this.selectedEvent.eventId === id) {
          this.selectedEvent = { ...this.selectedEvent, ...payload };
        }
        this.closeEditModal();
        this.refreshEvents();
        this.showToast('Event updated successfully', 'success');
      },
      error: (err) => {
        console.error('Update failed', err);
        this.showToast('Failed to update event', 'error');
      },
    });
  }

  private parseDateTime(raw: string): { isoDate: string; isoTime: string; displayDate: string; displayTime: string } {
    let d: Date;
    if (!raw) {
      d = new Date();
    } else {
      const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
      d = new Date(normalized);
      if (isNaN(d.getTime())) {
        d = new Date(normalized + 'Z');
      }
      if (isNaN(d.getTime())) {
        d = new Date();
      }
    }
    const isoDate = this.toIsoDateParts(d);
    const isoTime = this.toIsoTimeParts(d);
    return { isoDate, isoTime, displayDate: this.toDisplayDate(isoDate), displayTime: this.toDisplayTime(isoTime) };
  }

  private toIsoDateParts(d: Date): string {
    return `${d.getFullYear()}-${this.pad(d.getMonth()+1)}-${this.pad(d.getDate())}`;
  }
  private toIsoTimeParts(d: Date): string {
    return `${this.pad(d.getHours())}:${this.pad(d.getMinutes())}`;
  }
  private pad(n: number): string { return n < 10 ? '0' + n : '' + n; }
  private toDisplayDate(isoDate: string): string {
    const [y,m,d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  }
  private toDisplayTime(isoTime: string): string {
    const [hh,mm] = isoTime.split(':');
    let hour = parseInt(hh,10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12; if (hour === 0) hour = 12;
    return `${this.pad(hour)}:${mm} ${ampm}`;
  }

  private showToast(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    this.changeDetectorRef.markForCheck();
    setTimeout(() => {
      this.toastVisible = false;
      this.toastMessage = '';
      this.toastType = '';
      this.changeDetectorRef.markForCheck();
    }, 3000);
  }

   onDateChange(value: string) {
    this.editDateISO = value;
    this.editDisplayDate = value ? new Date(value).toLocaleDateString() : '';
    // if selected date is today, keep minTime as now; otherwise allow any time
    const today = new Date();
    const sel = value ? new Date(value) : null;
    if (sel && sel.getFullYear() === today.getFullYear() && sel.getMonth() === today.getMonth() && sel.getDate() === today.getDate()) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      this.minTime = `${pad(today.getHours())}:${pad(today.getMinutes())}`;
    } else {
      this.minTime = '00:00';
    }
  }

  onTimeChange(value: string) {
    this.editTimeISO = value;
    this.editDisplayTime = value || '';
  }

  isSelectedInPast(): boolean {
    if (!this.editDateISO || !this.editTimeISO) return false;
    const selected = new Date(`${this.editDateISO}T${this.editTimeISO}:00`);
    return selected.getTime() < new Date().getTime();
  }
}
