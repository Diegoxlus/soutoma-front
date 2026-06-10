import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { BracketDetail, BracketRound, MatchResponse, PairDto, PairPlayerDto } from '../../models/bracket.model';
import { PublicBracketsService } from '../../services/public-brackets.service';

type LoadState = 'loading' | 'ready' | 'error';

const ROUND_ORDER: BracketRound[] = [
  'TREINTAIDOS_AVOS',
  'DIECISEIS_AVOS',
  'OCTAVOS',
  'CUARTOS',
  'SEMIFINAL',
  'FINAL',
];

const ROUND_LABELS: Record<BracketRound, string> = {
  TREINTAIDOS_AVOS: 'Treintaidosavos',
  DIECISEIS_AVOS: 'Dieciseisavos',
  OCTAVOS: 'Octavos',
  CUARTOS: 'Cuartos',
  SEMIFINAL: 'Semifinal',
  FINAL: 'Final',
};

@Component({
  selector: 'app-public-bracket-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './public-bracket-detail.component.html',
  styleUrl: './public-bracket-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicBracketDetailComponent {
  private readonly bracketsService = inject(PublicBracketsService);
  private readonly route = inject(ActivatedRoute);

  protected readonly bracket = signal<BracketDetail | null>(null);
  protected readonly state = signal<LoadState>('loading');
  protected readonly selectedPairId = signal<number | null>(null);

  protected readonly rounds = computed(() => {
    const rounds = this.bracket()?.rounds ?? {};

    return ROUND_ORDER.map((round) => ({
      key: round,
      label: ROUND_LABELS[round],
      matches: [...(rounds[round] ?? [])].sort((a, b) => a.positionNumber - b.positionNumber),
    })).filter((round) => round.matches.length > 0);
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const bracketId = Number(params.get('id'));
      this.loadBracket(bracketId);
    });
  }

  private loadBracket(bracketId: number): void {
    this.state.set('loading');
    this.selectedPairId.set(null);

    this.bracketsService.getBracket(bracketId).subscribe({
      next: (bracket) => {
        this.bracket.set(bracket);
        this.state.set('ready');
      },
      error: () => {
        this.bracket.set(null);
        this.state.set('error');
      },
    });
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

  protected selectPair(pair?: PairDto | null): void {
    if (!pair?.id) {
      return;
    }

    this.selectedPairId.set(this.selectedPairId() === pair.id ? null : pair.id);
  }

  protected isPairHighlighted(pair?: PairDto | null): boolean {
    return Boolean(pair?.id && this.selectedPairId() === pair.id);
  }
}
