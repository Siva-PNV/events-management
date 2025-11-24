import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventService, Event } from '../event.service';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-past-events',
  standalone: true,
  imports: [CommonModule,NavbarComponent],
  templateUrl: './past-events.component.html',
  styleUrls: ['./past-events.component.scss']
})
export class PastEventsComponent implements OnInit {
  events: Event[] = [];
  loading = false;
  error = '';

  constructor(private eventService: EventService,private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.fetch();
  }

  fetch() {
    this.loading = true;
    this.eventService.getPastEvents().subscribe({
      next: (list) => { this.events = list || []; this.loading = false;this.changeDetectorRef.detectChanges(); },
      error: (e) => { this.error = e?.error?.error || 'Failed to load past events'; this.loading = false; }
    });
  }

  bgFor(title: string): string {
    const t = title.toLowerCase();
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
}
