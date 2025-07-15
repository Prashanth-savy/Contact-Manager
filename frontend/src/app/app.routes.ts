import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/contacts', pathMatch: 'full' },
  { path: 'contacts', loadComponent: () => import('./app.component').then(m => m.AppComponent) },
  { path: '**', redirectTo: '/contacts' }
];