import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../auth/services/auth.service';
import { PlayerGender, PlayerPage, PlayerResponse } from '../../models/player.model';
import { AdminPlayersService } from '../services/admin-players.service';

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-admin-players-list',
  imports: [ReactiveFormsModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-players-list.component.html',
  styleUrl: './admin-players-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPlayersListComponent {
  private readonly auth = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly playersService = inject(AdminPlayersService);
  private readonly router = inject(Router);

  protected readonly state = signal<LoadState>('loading');
  protected readonly page = signal<PlayerPage | null>(null);

  protected readonly navItems = [
    { label: 'Inicio', description: 'Resumen general', route: '/admin' },
    { label: 'Cuadros', description: 'Gestionar torneos', route: '/admin/brackets' },
    { label: 'Jugadores', description: 'Gestionar jugadores', route: '/players' },
    { label: 'Partidos', description: 'Enfrentamientos del dia', route: '/admin/matches' },
    { label: 'Patrocinadores', description: 'Gestionar sponsors', route: '/admin/sponsors' },
  ] as const;

  protected readonly filtersForm = this.formBuilder.nonNullable.group({
    search: [''],
    gender: ['' as PlayerGender | ''],
  });

  private readonly pageSize = 10;

  constructor() {
    this.loadPlayers(0);
  }

  applyFilters(): void {
    this.loadPlayers(0);
  }

  clearFilters(): void {
    this.filtersForm.reset({ search: '', gender: '' });
    this.loadPlayers(0);
  }

  previousPage(): void {
    const current = this.page();
    if (current && !current.first) {
      this.loadPlayers(current.page - 1);
    }
  }

  nextPage(): void {
    const current = this.page();
    if (current && !current.last) {
      this.loadPlayers(current.page + 1);
    }
  }

  editPlayer(player: PlayerResponse): void {
    void this.router.navigate(['/players', player.id, 'edit'], { state: { player } });
  }

  protected displayName(player: PlayerResponse): string {
    return player.displayName || `${player.name} ${player.surnames}`.trim();
  }

  protected playerInitials(player: PlayerResponse): string {
    return this.displayName(player)
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase() || '?';
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/admin/login');
  }

  private loadPlayers(page: number): void {
    const filters = this.filtersForm.getRawValue();
    this.state.set('loading');

    this.playersService
      .listPlayers({
        search: filters.search.trim(),
        gender: filters.gender,
        page,
        size: this.pageSize,
      })
      .subscribe({
        next: (playersPage) => {
          this.page.set(playersPage);
          this.state.set('ready');
        },
        error: () => {
          this.page.set(null);
          this.state.set('error');
        },
      });
  }
}
