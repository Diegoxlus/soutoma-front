import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../../auth/services/auth.service';
import { BracketSummary } from '../../models/bracket.model';
import { AdminBracketsService } from '../services/admin-brackets.service';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-admin-dashboard',
  imports: [DatePipe, RouterLink, RouterLinkActive],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent {
  private readonly auth = inject(AuthService);
  private readonly bracketsService = inject(AdminBracketsService);
  private readonly router = inject(Router);
  private readonly currentUrl = signal(this.router.url);

  protected readonly brackets = signal<BracketSummary[]>([]);
  protected readonly bracketsState = signal<LoadState>('idle');
  protected readonly isBracketsSection = computed(() => this.currentUrl().startsWith('/admin/brackets'));
  protected readonly mainBrackets = computed(() => this.brackets().filter((bracket) => !bracket.mainBracketId));

  protected readonly navItems = [
    { label: 'Inicio', description: 'Resumen general', route: '/admin' },
    { label: 'Cuadros', description: 'Gestionar torneos', route: '/admin/brackets' },
    { label: 'Jugadores', description: 'Gestionar jugadores', route: '/players' },
    { label: 'Patrocinadores', description: 'Gestionar sponsors', route: '/admin/sponsors' },
  ] as const;

  protected readonly section = computed(() => {
    const url = this.currentUrl();

    if (url.startsWith('/admin/brackets')) {
      return {
        eyebrow: 'Gestión',
        title: 'Cuadros',
        description: 'Crea, publica y ordena los cuadros del torneo.',
        action: 'Nuevo cuadro',
        actionRoute: '/admin/brackets/new',
        emptyTitle: 'Todavía no hay cuadros cargados',
        emptyText: 'Crea el primer cuadro para empezar a gestionar partidos.',
      };
    }

    if (url.startsWith('/admin/sponsors')) {
      return {
        eyebrow: 'Gestión',
        title: 'Patrocinadores',
        description: 'Administra los patrocinadores visibles en la zona pública.',
        action: 'Nuevo patrocinador',
        actionRoute: '/admin/sponsors/new',
        emptyTitle: 'Todavía no hay patrocinadores cargados',
        emptyText: 'El listado de sponsors se mostrará aquí con opciones para crear, editar y borrar.',
      };
    }

    return {
      eyebrow: 'Panel principal',
      title: 'Administración',
      description: 'Accede a las secciones de gestión de cuadros y patrocinadores.',
      action: null,
      actionRoute: null,
      emptyTitle: 'Selecciona una sección del menú',
      emptyText: 'Usa el menú lateral para moverte por las herramientas de administración.',
    };
  });

  constructor() {
    this.loadSectionData(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
        this.loadSectionData(event.urlAfterRedirects);
      });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/admin/login');
  }

  deleteBracket(id: number, name: string): void {
    if (!confirm(`¿Eliminar el cuadro "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.bracketsService.deleteBracket(id).subscribe({
      next: () => this.loadSectionData('/admin/brackets'),
      error: () => this.bracketsState.set('error'),
    });
  }

  private loadSectionData(url: string): void {
    if (url !== '/admin/brackets') {
      return;
    }

    this.bracketsState.set('loading');

    this.bracketsService.listBrackets().subscribe({
      next: (brackets) => {
        this.brackets.set(brackets);
        this.bracketsState.set('ready');
      },
      error: () => {
        this.brackets.set([]);
        this.bracketsState.set('error');
      },
    });
  }
}
