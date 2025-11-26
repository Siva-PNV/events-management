import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService, Event } from '../event.service';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-post-event',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './post-event.component.html',
  styleUrls: ['./post-event.component.scss'],
})
export class PostEventComponent implements OnInit {
  event: Event = {
    eventTitle: '',
    eventDate: '',
    location: '',
    details: '',
  };
  // UI state
  submitting = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';

  // min value for datetime-local input (YYYY-MM-DDTHH:mm)
  minDateTime = '';
  // separate mins for date/time inputs
  minDate = '';
  minTime = '';
   editDateISO: string = '';
  editTimeISO: string = '';
  editDisplayDate: string = '';
  editDisplayTime: string = '';
  // toast UI (same pattern as events-list)
  toastMessage: string = '';
  toastType: 'success' | 'error' | '' = '';
  toastVisible = false;
  private toastTimer: any = null;

  constructor(private eventService: EventService,private cdr:ChangeDetectorRef) {}
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

  submitEvent() {
    console.log('[PostEvent] submitEvent called');
    if (this.submitting) return;
   
    this.submitting = true;

    // Validate date/time selection isn't in the past
    if (!this.editDateISO || !this.editTimeISO) {
      this.messageType = 'error';
      this.message = 'Please select a valid date and time for the event.';
      this.showToast(this.message, 'error');
      return;
    }

    const normalizedDateTime = `${this.editDateISO} ${this.editTimeISO}:00`;
    const selected = new Date(`${this.editDateISO}T${this.editTimeISO}:00`);
    const now = new Date();
    if (selected.getTime() < now.getTime()) {
      this.messageType = 'error';
      this.message = 'Selected date and time is in the past. Please pick a future date/time.';
      return;
    }
    const payload: Event = { ...this.event };
      payload.eventDate = normalizedDateTime;
      payload.createdAt = now.toISOString().slice(0, 19).replace('T', ' ');


    console.log('[PostEvent] Submitting payload:', payload);
    this.eventService.postEvent(payload).subscribe({
      next: (res) => {
        console.log('[PostEvent] POST success response:', res);
        const successMsg = 'Your event has been added to the upcoming events list.';
        this.messageType = 'success';
        this.message = successMsg;
         this.resetFormState();
        // show floating toast with explicit message before clearing it
        this.showToast(successMsg, 'success');
        // reset model and form-related fields (do not clear `message` here)
       
        // clear success message after showing toast
        this.submitting = false;
      },
      error: (err) => {
        console.error('Post event error', err);
        this.messageType = 'error';
        this.message = err?.error?.error || 'Failed to post event.';
        this.submitting = false;
        // show floating toast for errors as well
        this.showToast(this.message, 'error');
      },
    });
  }

  private resetFormState() {
    this.event = { eventTitle: '', eventDate: '', location: '', details: '' };
    this.editDateISO = '';
    this.editTimeISO = '';
    this.editDisplayDate = '';
    this.editDisplayTime = '';
    this.setMinDateTime();
    console.log('[PostEvent] Form state reset');
    this.cdr.detectChanges();

  }

  private showToast(message: string, type: 'success' | 'error') {
    // clear any existing timer to avoid multiple visible timers
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    // ensure view updates immediately
    try { this.cdr.detectChanges(); } catch (e) {}
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
      this.toastMessage = '';
      this.toastType = '';
      this.toastTimer = null;
      // ensure view updates when timer hides the toast
      try { this.cdr.detectChanges(); } catch (e) {}
    }, 3000);
  }

  clearMessage() {
    this.message = '';
    this.messageType = '';
  }

  isSelectedInPast(): boolean {
    if (!this.editDateISO || !this.editTimeISO) return false;
    const selected = new Date(`${this.editDateISO}T${this.editTimeISO}:00`);
    return selected.getTime() < new Date().getTime();
  }
}
