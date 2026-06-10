import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../auth/services/auth.service';
import {
  BracketDetail,
  BracketRound,
  MatchResponse,
  MatchSide,
  PairDto,
  PairPlayerDto,
} from '../../models/bracket.model';
import { RegisteredPairPage, RegisteredPairResponse } from '../../models/pair.model';
import { PlayerGender, PlayerResponse } from '../../models/player.model';
import { AdminBracketsService } from '../services/admin-brackets.service';
import { AdminMatchesService } from '../services/admin-matches.service';
import { AdminPairsService } from '../services/admin-pairs.service';
import { AdminPlayersService } from '../services/admin-players.service';

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

interface DragPairPayload {
  matchId: number;
  side: MatchSide;
}

interface TouchSwapSelection extends DragPairPayload {
  pairId: number | null;
}

@Component({
  selector: 'app-admin-bracket-detail',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-bracket-detail.component.html',
  styleUrl: './admin-bracket-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminBracketDetailComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly bracketsService = inject(AdminBracketsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly matchesService = inject(AdminMatchesService);
  private readonly pairsService = inject(AdminPairsService);
  private readonly playersService = inject(AdminPlayersService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly bracketId = signal(0);
  protected readonly bracket = signal<BracketDetail | null>(null);
  protected readonly bracketState = signal<LoadState>('loading');
  protected readonly pairsPage = signal<RegisteredPairPage | null>(null);
  protected readonly pairsState = signal<LoadState>('loading');
  protected readonly modalOpen = signal(false);
  protected readonly scheduleModalOpen = signal(false);
  protected readonly resultModalOpen = signal(false);
  protected readonly activeMatch = signal<MatchResponse | null>(null);
  protected readonly selectedPairId = signal<number | null>(null);
  protected readonly touchSwapSelection = signal<TouchSwapSelection | null>(null);
  protected readonly playersOne = signal<PlayerResponse[]>([]);
  protected readonly playersTwo = signal<PlayerResponse[]>([]);
  protected readonly selectedPairPlayerOneId = signal(0);
  protected readonly modalError = signal<string | null>(null);
  protected readonly savingPair = signal(false);
  protected readonly deletingPairId = signal<number | null>(null);
  protected readonly savingMatch = signal(false);
  protected readonly generating = signal(false);
  protected readonly generateError = signal<string | null>(null);

  protected readonly pairForm = this.formBuilder.nonNullable.group({
    playerOneId: [0, [Validators.required, Validators.min(1)]],
    playerTwoId: [0, [Validators.required, Validators.min(1)]],
  });

  protected readonly scheduleForm = this.formBuilder.nonNullable.group({
    scheduledAt: [''],
    status: ['PROGRAMADO'],
  });

  protected readonly resultForm = this.formBuilder.nonNullable.group({
    winnerPairId: [0, [Validators.required, Validators.min(1)]],
    resultText: [''],
  });

  protected readonly navItems = [
    { label: 'Inicio', description: 'Resumen general', route: '/admin' },
    { label: 'Cuadros', description: 'Gestionar torneos', route: '/admin/brackets' },
    { label: 'Jugadores', description: 'Gestionar jugadores', route: '/players' },
    { label: 'Patrocinadores', description: 'Gestionar sponsors', route: '/admin/sponsors' },
  ] as const;

  protected readonly rounds = computed(() => {
    const rounds = this.bracket()?.rounds ?? {};

    return ROUND_ORDER.map((round) => ({
      key: round,
      label: ROUND_LABELS[round],
      matches: [...(rounds[round] ?? [])].sort((a, b) => a.positionNumber - b.positionNumber),
    })).filter((round) => round.matches.length > 0);
  });

  protected readonly hasGeneratedMatches = computed(() => this.rounds().length > 0);

  protected readonly touchSwapText = computed(() => {
    const selection = this.touchSwapSelection();
    return selection
      ? 'Origen seleccionado. Toca otra pareja o BYE para intercambiar.'
      : 'En móvil: toca una pareja o BYE y luego toca el destino para intercambiar.';
  });

  protected readonly pairSlotsText = computed(() => {
    const bracket = this.bracket();
    const total = this.pairsPage()?.totalElements ?? 0;
    return bracket ? `${total} de ${bracket.numberOfPairs} parejas inscritas` : '';
  });

  protected readonly resultWinnerOptions = computed(() => {
    const match = this.activeMatch();
    return [match?.pairA, match?.pairB].filter((pair): pair is PairDto => Boolean(pair?.id));
  });

  protected readonly availablePlayersTwo = computed(() => {
    const selectedPlayerOneId = this.selectedPairPlayerOneId();
    return this.playersTwo().filter((player) => player.id !== selectedPlayerOneId);
  });

  private readonly pageSize = 8;
  private dragScrollFrame: number | null = null;
  private dragScrollY = 0;
  private isDraggingPair = false;

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const bracketId = Number(params.get('id'));
      this.bracketId.set(bracketId);
      this.selectedPairId.set(null);
      this.touchSwapSelection.set(null);
      this.generateError.set(null);
      this.closePairModal();
      this.closeMatchModals();
      this.loadBracket();
      this.loadPairs(0);
    });
  }

  ngOnDestroy(): void {
    this.stopDragAutoScroll();
  }

  openPairModal(): void {
    const bracket = this.bracket();
    if (!bracket) {
      return;
    }

    this.modalOpen.set(true);
    this.modalError.set(null);
    this.pairForm.reset({ playerOneId: 0, playerTwoId: 0 });
    this.selectedPairPlayerOneId.set(0);

    if (bracket.gender === 'MIXTO') {
      this.loadAvailablePlayers('MASCULINO', this.playersOne);
      this.loadAvailablePlayers('FEMENINO', this.playersTwo);
      return;
    }

    this.loadAvailablePlayers(bracket.gender, this.playersOne);
    this.loadAvailablePlayers(bracket.gender, this.playersTwo);
  }

  closePairModal(): void {
    this.modalOpen.set(false);
  }

  onPairPlayerOneChange(): void {
    const playerOneId = Number(this.pairForm.controls.playerOneId.value);
    this.selectedPairPlayerOneId.set(playerOneId);

    if (playerOneId === Number(this.pairForm.controls.playerTwoId.value)) {
      this.pairForm.controls.playerTwoId.setValue(0);
    }
  }

  generateMatches(): void {
    if (this.generating()) {
      return;
    }

    this.generating.set(true);
    this.generateError.set(null);

    this.bracketsService.generateBracket(this.bracketId()).subscribe({
      next: (bracket) => {
        this.bracket.set(bracket);
        this.generating.set(false);
      },
      error: () => {
        this.generating.set(false);
        this.generateError.set('No se pudieron generar los enfrentamientos. Revisa las parejas inscritas.');
      },
    });
  }

  savePair(): void {
    if (this.pairForm.invalid || this.savingPair()) {
      this.pairForm.markAllAsTouched();
      return;
    }

    const value = this.pairForm.getRawValue();
    if (value.playerOneId === value.playerTwoId) {
      this.modalError.set('Selecciona dos jugadores distintos.');
      return;
    }

    this.savingPair.set(true);
    this.modalError.set(null);

    this.bracketsService
      .addPair(this.bracketId(), {
        playerOneId: value.playerOneId,
        playerTwoId: value.playerTwoId,
      })
      .subscribe({
        next: () => {
          this.savingPair.set(false);
          this.modalOpen.set(false);
          this.loadBracket();
          this.loadPairs(0);
        },
        error: () => {
          this.savingPair.set(false);
          this.modalError.set('No se pudo añadir la pareja. Revisa disponibilidad y sesión.');
        },
      });
  }

  openScheduleModal(match: MatchResponse): void {
    this.activeMatch.set(match);
    this.scheduleForm.reset({
      scheduledAt: this.toDateTimeLocalValue(match.scheduledAt),
      status: match.status ?? 'PROGRAMADO',
    });
    this.modalError.set(null);
    this.scheduleModalOpen.set(true);
  }

  openResultModal(match: MatchResponse): void {
    this.activeMatch.set(match);
    this.resultForm.reset({
      winnerPairId: match.winnerPair?.id ?? 0,
      resultText: match.resultText ?? '',
    });
    this.modalError.set(null);
    this.resultModalOpen.set(true);
  }

  closeMatchModals(): void {
    this.scheduleModalOpen.set(false);
    this.resultModalOpen.set(false);
    this.activeMatch.set(null);
  }

  cancelTouchSwap(): void {
    this.touchSwapSelection.set(null);
  }

  saveSchedule(): void {
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
          this.loadBracket();
        },
        error: () => {
          this.savingMatch.set(false);
          this.modalError.set('No se pudo guardar la fecha/hora del encuentro.');
        },
      });
  }

  saveResult(): void {
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
          this.loadBracket();
        },
        error: () => {
          this.savingMatch.set(false);
          this.modalError.set('No se pudo guardar el resultado del encuentro.');
        },
      });
  }

  onPairDragStart(event: DragEvent, match: MatchResponse, side: MatchSide): void {
    const pair = side === 'A' ? match.pairA : match.pairB;
    const payload: DragPairPayload = { matchId: match.id, side };
    event.dataTransfer?.setData('application/json', JSON.stringify(payload));
    event.dataTransfer?.setData('text/plain', JSON.stringify(payload));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
    event.dataTransfer?.setDragImage(event.currentTarget as Element, 20, 20);
    this.isDraggingPair = true;
    this.updateDragAutoScroll(event);
  }

  onPairDragEnd(): void {
    this.stopDragAutoScroll();
  }

  allowDrop(event: DragEvent): void {
    event.preventDefault();
    this.updateDragAutoScroll(event);
  }

  onPairDrop(event: DragEvent, targetMatch: MatchResponse, targetSide: MatchSide): void {
    event.preventDefault();
    this.stopDragAutoScroll();
    const rawPayload = event.dataTransfer?.getData('application/json') || event.dataTransfer?.getData('text/plain');
    if (!rawPayload) {
      return;
    }

    const payload = JSON.parse(rawPayload) as DragPairPayload;
    if (payload.matchId === targetMatch.id && payload.side === targetSide) {
      return;
    }

    this.swapMatchPairs(payload, { matchId: targetMatch.id, side: targetSide });
  }

  deletePair(registeredPair: RegisteredPairResponse): void {
    const pairName = this.pairName(registeredPair.pair);
    if (
      this.deletingPairId() ||
      !confirm(`Eliminar la pareja "${pairName}" de este cuadro? Esta accion no se puede deshacer.`)
    ) {
      return;
    }

    const currentPage = this.pairsPage();
    const nextPage = currentPage && currentPage.content.length === 1 && currentPage.page > 0
      ? currentPage.page - 1
      : currentPage?.page ?? 0;

    this.deletingPairId.set(registeredPair.id);
    this.generateError.set(null);

    this.pairsService.deletePair(registeredPair.id).subscribe({
      next: () => {
        this.deletingPairId.set(null);
        this.loadBracket();
        this.loadPairs(nextPage);
      },
      error: () => {
        this.deletingPairId.set(null);
        this.generateError.set('No se pudo eliminar la pareja.');
      },
    });
  }

  selectPair(match: MatchResponse, side: MatchSide): void {
    const pair = side === 'A' ? match.pairA : match.pairB;

    if (!this.isTouchSwapMode()) {
      if (!pair?.id) {
        return;
      }

      this.selectedPairId.set(this.selectedPairId() === pair.id ? null : pair.id);
      return;
    }

    const currentSelection = this.touchSwapSelection();
    const target: TouchSwapSelection = { matchId: match.id, side, pairId: pair?.id ?? null };

    if (currentSelection) {
      if (currentSelection.matchId === target.matchId && currentSelection.side === target.side) {
        this.touchSwapSelection.set(null);
        return;
      }

      if (!confirm('¿Intercambiar estas dos posiciones del cuadro?')) {
        return;
      }

      this.swapMatchPairs(currentSelection, target);
      return;
    }

    this.touchSwapSelection.set(target);

    if (!pair?.id) {
      this.selectedPairId.set(null);
      return;
    }

    this.selectedPairId.set(this.selectedPairId() === pair.id ? null : pair.id);
  }

  pairName(pair?: PairDto | null): string {
    if (!pair) {
      return 'Pendiente';
    }

    return `${pair.playerOne?.displayName ?? 'Pendiente'} / ${pair.playerTwo?.displayName ?? 'Pendiente'}`;
  }

  playerInitials(player?: PairPlayerDto | null): string {
    return (player?.displayName ?? 'Pendiente')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase() || '?';
  }

  isWinner(match: MatchResponse, pair?: PairDto | null): boolean {
    return Boolean(pair?.id && match.winnerPair?.id === pair.id);
  }

  isPairHighlighted(pair?: PairDto | null): boolean {
    return Boolean(pair?.id && this.selectedPairId() === pair.id);
  }

  isTouchSwapOrigin(match: MatchResponse, side: MatchSide): boolean {
    const selection = this.touchSwapSelection();
    return Boolean(selection && selection.matchId === match.id && selection.side === side);
  }

  previousPairsPage(): void {
    const page = this.pairsPage();
    if (page && !page.first) {
      this.loadPairs(page.page - 1);
    }
  }

  nextPairsPage(): void {
    const page = this.pairsPage();
    if (page && !page.last) {
      this.loadPairs(page.page + 1);
    }
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/admin/login');
  }

  @HostListener('document:dragover', ['$event'])
  protected onDocumentDragOver(event: DragEvent): void {
    if (this.isDraggingPair) {
      this.updateDragAutoScroll(event);
    }
  }

  @HostListener('document:drop')
  @HostListener('document:dragend')
  protected onDocumentDragFinished(): void {
    this.stopDragAutoScroll();
  }

  private loadBracket(): void {
    this.bracketState.set('loading');

    this.bracketsService.getBracket(this.bracketId()).subscribe({
      next: (bracket) => {
        this.bracket.set(bracket);
        this.bracketState.set('ready');
      },
      error: () => {
        this.bracket.set(null);
        this.bracketState.set('error');
      },
    });
  }

  private loadPairs(page: number): void {
    this.pairsState.set('loading');

    this.pairsService.listPairs(this.bracketId(), page, this.pageSize).subscribe({
      next: (pairsPage) => {
        this.pairsPage.set(pairsPage);
        this.pairsState.set('ready');
      },
      error: () => {
        this.pairsPage.set(null);
        this.pairsState.set('error');
      },
    });
  }

  private loadAvailablePlayers(gender: PlayerGender, target: { set(players: PlayerResponse[]): void }): void {
    this.playersService
      .listPlayers({
        gender,
        bracketId: this.bracketId(),
        availableOnly: true,
        page: 0,
        size: 200,
      })
      .subscribe({
        next: (page) => target.set(page.content),
        error: () => {
          target.set([]);
          this.modalError.set('No se pudieron cargar jugadores disponibles.');
        },
      });
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

  private swapMatchPairs(source: DragPairPayload, target: DragPairPayload): void {
    if (source.matchId === target.matchId && source.side === target.side) {
      return;
    }

    this.generateError.set(null);

    this.matchesService
      .swapPairs({
        sourceMatchId: source.matchId,
        sourceSide: source.side,
        targetMatchId: target.matchId,
        targetSide: target.side,
      })
      .subscribe({
        next: () => {
          this.touchSwapSelection.set(null);
          this.loadBracket();
        },
        error: () => {
          this.touchSwapSelection.set(null);
          this.generateError.set('No se pudo intercambiar la pareja.');
        },
      });
  }

  private isTouchSwapMode(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches;
  }

  private updateDragAutoScroll(event: DragEvent): void {
    if (!this.isDraggingPair) {
      return;
    }

    const margin = 110;
    const maxSpeed = 14;
    const viewportHeight = window.innerHeight;
    const y = event.clientY;

    if (y < margin) {
      this.dragScrollY = -Math.ceil(((margin - y) / margin) * maxSpeed);
    } else if (y > viewportHeight - margin) {
      this.dragScrollY = Math.ceil(((y - (viewportHeight - margin)) / margin) * maxSpeed);
    } else {
      this.dragScrollY = 0;
    }

    if (this.dragScrollY !== 0 && this.dragScrollFrame === null) {
      this.dragScrollFrame = window.requestAnimationFrame(() => this.performDragAutoScroll());
    }
  }

  private performDragAutoScroll(): void {
    this.dragScrollFrame = null;

    if (!this.isDraggingPair || this.dragScrollY === 0) {
      return;
    }

    window.scrollBy({ top: this.dragScrollY, behavior: 'instant' });
    this.dragScrollFrame = window.requestAnimationFrame(() => this.performDragAutoScroll());
  }

  private stopDragAutoScroll(): void {
    this.isDraggingPair = false;
    this.dragScrollY = 0;

    if (this.dragScrollFrame !== null) {
      window.cancelAnimationFrame(this.dragScrollFrame);
      this.dragScrollFrame = null;
    }
  }
}
