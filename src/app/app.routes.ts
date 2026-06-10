import { Routes } from '@angular/router';

import { authGuard, loginRedirectGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./public/pages/public-home.component').then((m) => m.PublicHomeComponent),
  },
  {
    path: 'matches',
    loadComponent: () =>
      import('./public/pages/public-home.component').then((m) => m.PublicHomeComponent),
  },
  {
    path: 'brackets/:id',
    loadComponent: () =>
      import('./public/pages/public-bracket-detail.component').then((m) => m.PublicBracketDetailComponent),
  },
  {
    path: 'admin/login',
    canMatch: [loginRedirectGuard],
    loadComponent: () => import('./auth/pages/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'admin',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./admin/pages/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
  },
  {
    path: 'admin/brackets/new',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./admin/pages/admin-bracket-form.component').then((m) => m.AdminBracketFormComponent),
  },
  {
    path: 'admin/brackets/:id/edit',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./admin/pages/admin-bracket-form.component').then((m) => m.AdminBracketFormComponent),
  },
  {
    path: 'admin/brackets/:id',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./admin/pages/admin-bracket-detail.component').then((m) => m.AdminBracketDetailComponent),
  },
  {
    path: 'players/new',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./admin/pages/admin-player-form.component').then((m) => m.AdminPlayerFormComponent),
  },
  {
    path: 'players/:id/edit',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./admin/pages/admin-player-form.component').then((m) => m.AdminPlayerFormComponent),
  },
  {
    path: 'players',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./admin/pages/admin-players-list.component').then((m) => m.AdminPlayersListComponent),
  },
  {
    path: 'admin/brackets',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./admin/pages/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
  },
  {
    path: 'admin/sponsors',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./admin/pages/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
  },
  {
    path: 'admin/players',
    redirectTo: '/players',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
