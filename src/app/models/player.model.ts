export type PlayerGender = 'MASCULINO' | 'FEMENINO';

export interface PlayerRequest {
  name: string;
  surnames: string;
  dni?: string | null;
  phone?: string | null;
  gender?: PlayerGender | null;
  imageBase64?: string | null;
}

export interface PlayerResponse extends PlayerRequest {
  id: number;
  displayName?: string;
}

export interface PlayerPage {
  content: PlayerResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  page: number;
  first: boolean;
  last: boolean;
  number?: number;
  numberOfElements?: number;
  empty?: boolean;
}

export interface PlayerListFilters {
  search?: string;
  gender?: PlayerGender | '';
  bracketId?: number;
  availableOnly?: boolean;
  page: number;
  size: number;
}
