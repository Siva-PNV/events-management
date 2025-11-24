import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./events-list/events-list.component').then((m) => m.EventsListComponent),
  },
  {
    path: 'upcoming-events',
    loadComponent: () =>
      import('./events-list/events-list.component').then((m) => m.EventsListComponent),
  },
  {
    path: 'post-event',
    loadComponent: () =>
      import('./post-event/post-event.component').then((m) => m.PostEventComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'manage-admins',
    loadComponent: () =>
      import('./manage-admins/manage-admins.component').then((m) => m.ManageAdminsComponent),
  },
  {
    path: 'past-events',
    loadComponent: () =>
      import('./past-events/past-events.component').then((m) => m.PastEventsComponent),
  },
];
