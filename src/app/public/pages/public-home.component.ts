import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

import { BracketSummary, MatchResponse, PairDto, PairPlayerDto } from '../../models/bracket.model';
import { PublicBracketsService } from '../../services/public-brackets.service';

type LoadState = 'loading' | 'ready' | 'error';
type PublicSection = 'brackets' | 'matches';

@Component({
  selector: 'app-public-home',
  imports: [DatePipe, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './public-home.component.html',
  styleUrl: './public-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicHomeComponent {
  private readonly bracketsService = inject(PublicBracketsService);
  private readonly router = inject(Router);

  protected readonly brackets = signal<BracketSummary[]>([]);
  protected readonly state = signal<LoadState>('loading');
  protected readonly matchesState = signal<LoadState>('loading');
  protected readonly matches = signal<MatchResponse[]>([]);
  protected readonly totalMatches = signal(0);
  protected readonly totalMatchPages = signal(0);
  protected readonly matchPage = signal(0);
  protected readonly selectedBracketId = signal<number | null>(null);
  protected readonly selectedDate = signal(this.todayIso());
  protected readonly currentUrl = signal(this.router.url);
  protected readonly pageSize = 50;
  protected readonly mainBrackets = computed(() => this.brackets().filter((bracket) => !bracket.mainBracketId));
  protected readonly activeSection = computed<PublicSection>(() =>
    this.currentUrl().startsWith('/matches') ? 'matches' : 'brackets',
  );

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
        if (this.activeSection() === 'matches') {
          this.loadMatches();
        }
      });

    this.bracketsService.getBrackets().subscribe({
      next: (brackets) => {
        this.brackets.set(brackets);
        this.state.set('ready');
        if (this.activeSection() === 'matches') {
          this.loadMatches();
        }
      },
      error: () => {
        this.brackets.set([]);
        this.state.set('error');
        this.matchesState.set('error');
      },
    });

    if (this.activeSection() === 'matches') {
      this.loadMatches();
    }
  }

  protected onBracketFilter(value: string): void {
    this.selectedBracketId.set(value ? Number(value) : null);
    this.matchPage.set(0);
    this.loadMatches();
  }

  protected onDateFilter(value: string): void {
    this.selectedDate.set(value);
    this.matchPage.set(0);
    this.loadMatches();
  }

  protected goToMatchPage(page: number): void {
    if (page < 0 || page >= this.totalMatchPages()) {
      return;
    }

    this.matchPage.set(page);
    this.loadMatches();
  }

  protected bracketName(bracketId: number): string {
    return this.brackets().find((bracket) => bracket.id === bracketId)?.name ?? `Cuadro ${bracketId}`;
  }

  protected pairName(pair?: PairDto | null): string {
    if (!pair) {
      return 'Pendiente';
    }

    const playerOne = pair.playerOne?.displayName ?? 'Pendiente';
    const playerTwo = pair.playerTwo?.displayName ?? 'Pendiente';
    return `${playerOne} / ${playerTwo}`;
  }

  protected playerInitials(player?: PairPlayerDto | null): string {
    return (player?.displayName ?? 'Pendiente')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase() || '?';
  }

  protected isWinner(match: MatchResponse, pair?: PairDto | null): boolean {
    return Boolean(pair?.id && match.winnerPair?.id === pair.id);
  }

  private loadMatches(): void {
    this.matchesState.set('loading');

    this.bracketsService
      .getMatches({
        bracketId: this.selectedBracketId(),
        date: this.selectedDate(),
        page: this.matchPage(),
        size: this.pageSize,
      })
      .subscribe({
        next: (page) => {
          this.matches.set(page.content);
          this.totalMatches.set(page.totalElements);
          this.totalMatchPages.set(page.totalPages);
          this.matchPage.set(page.page);
          this.matchesState.set('ready');
        },
        error: () => {
          this.matches.set([]);
          this.totalMatches.set(0);
          this.totalMatchPages.set(0);
          this.matchesState.set('error');
        },
      });
  }

  private todayIso(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }
}
