import { PairDto } from './bracket.model';

export interface RegisteredPairResponse {
  id: number;
  bracketId: number;
  pair: PairDto;
  createdAt?: string;
}

export interface RegisteredPairPage {
  content: RegisteredPairResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
