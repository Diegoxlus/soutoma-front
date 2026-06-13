import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../auth/services/auth.service';
import { BracketSummary, MatchResponse, MatchSide, PairDto, PairPlayerDto } from '../../models/bracket.model';
import { PlayerResponse } from '../../models/player.model';
import { PublicBracketsService } from '../../services/public-brackets.service';
import { AdminBracketsService } from '../services/admin-brackets.service';
import { AdminMatchesService } from '../services/admin-matches.service';
import { AdminPlayersService } from '../services/admin-players.service';

type LoadState = 'loading' | 'ready' | 'error';

interface PlayerContactView {
  key: string;
  pending: boolean;
  displayName: string;
  name: string;
  surnames: string;
  phone: string | null;
  email: string | null;
  imageBase64: string | null;
}

interface MatchPlayersPairView {
  label: string;
  players: PlayerContactView[];
}

@Component({
  selector: 'app-admin-day-matches',
  imports: [DatePipe, FormsModule, ReactiveFormsModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-day-matches.component.html',
  styleUrl: './admin-day-matches.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDayMatchesComponent {
  private readonly auth = inject(AuthService);
  private readonly adminBracketsService = inject(AdminBracketsService);
  private readonly publicBracketsService = inject(PublicBracketsService);
  private readonly matchesService = inject(AdminMatchesService);
  private readonly playersService = inject(AdminPlayersService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly brackets = signal<BracketSummary[]>([]);
  protected readonly bracketsState = signal<LoadState>('loading');
  protected readonly matchesState = signal<LoadState>('loading');
  protected readonly matches = signal<MatchResponse[]>([]);
  protected readonly totalMatches = signal(0);
  protected readonly totalMatchPages = signal(0);
  protected readonly matchPage = signal(0);
  protected readonly selectedBracketId = signal<number | null>(null);
  protected readonly selectedDate = signal(this.todayIso());
  protected readonly scheduleModalOpen = signal(false);
  protected readonly resultModalOpen = signal(false);
  protected readonly playersModalOpen = signal(false);
  protected readonly activeMatch = signal<MatchResponse | null>(null);
  protected readonly activePlayersMatch = signal<MatchResponse | null>(null);
  protected readonly bracketPlayers = signal<PlayerResponse[]>([]);
  protected readonly playersModalState = signal<LoadState>('ready');
  protected readonly modalError = signal<string | null>(null);
  protected readonly savingMatch = signal(false);
  protected readonly pageSize = 50;

  protected readonly navItems = [
    { label: 'Inicio', description: 'Resumen general', route: '/admin' },
    { label: 'Cuadros', description: 'Gestionar torneos', route: '/admin/brackets' },
    { label: 'Jugadores', description: 'Gestionar jugadores', route: '/players' },
    { label: 'Partidos', description: 'Enfrentamientos del dia', route: '/admin/matches' },
    { label: 'Patrocinadores', description: 'Gestionar sponsors', route: '/admin/sponsors' },
  ] as const;

  protected readonly scheduleForm = this.formBuilder.nonNullable.group({
    scheduledAt: [''],
    status: ['PROGRAMADO'],
  });

  protected readonly resultForm = this.formBuilder.nonNullable.group({
    winnerPairId: [0, [Validators.required, Validators.min(1)]],
    resultText: [''],
  });

  protected readonly resultWinnerOptions = computed(() => {
    const match = this.activeMatch();
    return [match?.pairA, match?.pairB].filter((pair): pair is PairDto => Boolean(pair?.id));
  });

  protected readonly matchPlayerPairs = computed<MatchPlayersPairView[]>(() => {
    const match = this.activePlayersMatch();

    return [
      {
        label: 'Pareja A',
        players: [
          this.toPlayerContact(match?.pairA?.playerOne, 'A1'),
          this.toPlayerContact(match?.pairA?.playerTwo, 'A2'),
        ],
      },
      {
        label: 'Pareja B',
        players: [
          this.toPlayerContact(match?.pairB?.playerOne, 'B1'),
          this.toPlayerContact(match?.pairB?.playerTwo, 'B2'),
        ],
      },
    ];
  });

  constructor() {
    this.loadBrackets();
    this.loadMatches();
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

  protected pairName(pair?: PairDto | null): string {
    if (!pair) {
      return 'Pendiente';
    }

    return `${pair.playerOne?.displayName ?? 'Pendiente'} / ${pair.playerTwo?.displayName ?? 'Pendiente'}`;
  }

  protected openScheduleModal(match: MatchResponse): void {
    this.activeMatch.set(match);
    this.scheduleForm.reset({
      scheduledAt: this.toDateTimeLocalValue(match.scheduledAt),
      status: match.status ?? 'PROGRAMADO',
    });
    this.modalError.set(null);
    this.scheduleModalOpen.set(true);
  }

  protected openResultModal(match: MatchResponse): void {
    this.activeMatch.set(match);
    this.resultForm.reset({
      winnerPairId: match.winnerPair?.id ?? 0,
      resultText: match.resultText ?? '',
    });
    this.modalError.set(null);
    this.resultModalOpen.set(true);
  }

  protected closeMatchModals(): void {
    this.scheduleModalOpen.set(false);
    this.resultModalOpen.set(false);
    this.activeMatch.set(null);
  }

  protected saveSchedule(): void {
    const match = this.activeMatch();
    if (!match || this.savingMatch()) {
      return;
    }

    const value = this.scheduleForm.getRawValue();
    this.savingMatch.set(true);
    this.modalError.set(null);

    this.matchesService
      .scheduleMatch(match.id, {
        scheduledAt: value.scheduledAt ? new Date(value.scheduledAt).toISOString() : null,
        status: value.status as 'PENDIENTE' | 'PROGRAMADO' | 'FINALIZADO',
      })
      .subscribe({
        next: () => {
          this.savingMatch.set(false);
          this.closeMatchModals();
          this.loadMatches();
        },
        error: () => {
          this.savingMatch.set(false);
          this.modalError.set('No se pudo guardar la fecha/hora del encuentro.');
        },
      });
  }

  protected saveResult(): void {
    const match = this.activeMatch();
    if (!match || this.resultForm.invalid || this.savingMatch()) {
      this.resultForm.markAllAsTouched();
      return;
    }

    const value = this.resultForm.getRawValue();
    const winnerPair = this.resultWinnerOptions().find((pair) => pair.id === value.winnerPairId);
    this.savingMatch.set(true);
    this.modalError.set(null);

    this.matchesService
      .saveResult(match.id, {
        winnerPairId: value.winnerPairId,
        winnerSide: this.matchSideForPair(match, winnerPair),
        resultText: value.resultText || null,
      })
      .subscribe({
        next: () => {
          this.savingMatch.set(false);
          this.closeMatchModals();
          this.loadMatches();
        },
        error: () => {
          this.savingMatch.set(false);
          this.modalError.set('No se pudo guardar el resultado del encuentro.');
        },
      });
  }

  protected openPlayersModal(match: MatchResponse): void {
    this.activePlayersMatch.set(match);
    this.playersModalOpen.set(true);
    this.playersModalState.set('loading');
    this.loadBracketPlayers(match.bracketId);
  }

  protected closePlayersModal(): void {
    this.playersModalOpen.set(false);
    this.activePlayersMatch.set(null);
    this.playersModalState.set('ready');
  }

  protected whatsappUrl(phone: string | null): string | null {
    const phoneNumber = this.whatsappPhone(phone);
    return phoneNumber ? `https://wa.me/${phoneNumber}` : null;
  }

  protected callUrl(phone: string | null): string | null {
    const phoneNumber = this.whatsappPhone(phone);
    return phoneNumber ? `tel:+${phoneNumber}` : null;
  }

  protected emailUrl(email: string | null): string | null {
    const cleanEmail = email?.trim();
    return cleanEmail ? `mailto:${cleanEmail}` : null;
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/admin/login');
  }

  private loadBrackets(): void {
    this.bracketsState.set('loading');

    this.adminBracketsService.listBrackets().subscribe({
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

  private loadMatches(): void {
    this.matchesState.set('loading');

    this.publicBracketsService
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

  private loadBracketPlayers(bracketId: number): void {
    this.playersService
      .listPlayers({
        bracketId,
        availableOnly: false,
        page: 0,
        size: 500,
      })
      .subscribe({
        next: (page) => {
          this.bracketPlayers.set(page.content);
          this.playersModalState.set('ready');
        },
        error: () => {
          this.playersModalState.set('error');
        },
      });
  }

  private toPlayerContact(player: PairPlayerDto | null | undefined, slot: string): PlayerContactView {
    if (!player) {
      return {
        key: slot,
        pending: true,
        displayName: 'Jugador pendiente',
        name: 'Jugador pendiente',
        surnames: '',
        phone: null,
        email: null,
        imageBase64: null,
      };
    }

    const details = this.bracketPlayers().find((bracketPlayer) => bracketPlayer.id === player.id);
    const displayName = details?.displayName || player.displayName || `${details?.name ?? ''} ${details?.surnames ?? ''}`.trim();

    return {
      key: `${slot}-${player.id}`,
      pending: false,
      displayName: displayName || 'Jugador pendiente',
      name: details?.name || player.name || displayName || 'Jugador',
      surnames: details?.surnames || player.surnames || '',
      phone: details?.phone || player.phone || null,
      email: details?.email || player.email || null,
      imageBase64: details?.imageBase64 || player.imageBase64 || null,
    };
  }

  private toDateTimeLocalValue(value?: string | null): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  }

  private matchSideForPair(match: MatchResponse, pair?: PairDto): MatchSide | null {
    if (!pair) {
      return null;
    }

    if (match.pairA?.id === pair.id) {
      return 'A';
    }

    if (match.pairB?.id === pair.id) {
      return 'B';
    }

    return null;
  }

  private whatsappPhone(phone: string | null): string | null {
    const digits = phone?.replace(/\D/g, '') ?? '';
    if (!digits) {
      return null;
    }

    if (digits.startsWith('34') || digits.length > 9) {
      return digits;
    }

    return `34${digits}`;
  }

  private todayIso(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }
}
