export type BracketRound =
  | 'TREINTAIDOS_AVOS'
  | 'DIECISEIS_AVOS'
  | 'OCTAVOS'
  | 'CUARTOS'
  | 'SEMIFINAL'
  | 'FINAL';

export type BracketGender = 'MASCULINO' | 'FEMENINO' | 'MIXTO';

export interface PairPlayerDto {
  id: number;
  displayName: string;
  imageBase64?: string | null;
}

export interface PairDto {
  id: number;
  playerOne?: PairPlayerDto | null;
  playerTwo?: PairPlayerDto | null;
}

export type MatchStatus = 'PENDIENTE' | 'PROGRAMADO' | 'FINALIZADO';

export interface MatchResponse {
  id: number;
  bracketId: number;
  round: BracketRound;
  positionNumber: number;
  pairA?: PairDto | null;
  pairB?: PairDto | null;
  byeA?: boolean;
  byeB?: boolean;
  winnerPair?: PairDto | null;
  resultText?: string | null;
  scheduledAt?: string | null;
  status?: MatchStatus | null;
}

export interface MatchPageResponse {
  content: MatchResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export type MatchSide = 'A' | 'B';

export interface MatchScheduleRequest {
  scheduledAt?: string | null;
  status?: MatchStatus | null;
}

export interface MatchResultRequest {
  winnerPairId?: number | null;
  winnerSide?: MatchSide | null;
  resultText?: string | null;
}

export interface MatchPairSwapRequest {
  sourceMatchId: number;
  sourceSide: MatchSide;
  targetMatchId: number;
  targetSide: MatchSide;
}

export interface MatchPairSwapResponse {
  sourceMatch: MatchResponse;
  targetMatch: MatchResponse;
}

export interface BracketSummary {
  id: number;
  name: string;
  description?: string | null;
  numberOfPairs: number;
  gender: BracketGender;
  mainBracketId?: number | null;
  consolationBracketId?: number | null;
  orderNumber: number;
  publicVisible: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BracketDetail extends BracketSummary {
  rounds?: Partial<Record<BracketRound, MatchResponse[]>>;
}

export interface BracketRequest {
  name: string;
  description?: string | null;
  numberOfPairs: number;
  gender: BracketGender;
  orderNumber: number;
  publicVisible: boolean;
}

export interface BracketPairRequest {
  playerOneId: number;
  playerTwoId: number;
}

export interface BracketPairResponse {
  id: number;
  bracketId: number;
  pair: PairDto;
  createdAt?: string;
}
