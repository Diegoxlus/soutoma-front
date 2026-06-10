import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { BracketDetail, BracketSummary, MatchPageResponse } from '../models/bracket.model';

@Injectable({ providedIn: 'root' })
export class PublicBracketsService {
  private readonly http = inject(HttpClient);

  getBrackets(): Observable<BracketSummary[]> {
    return this.http.get<BracketSummary[]>(`${environment.apiBaseUrl}/public/brackets`);
  }

  getBracket(id: number): Observable<BracketDetail> {
    return this.http.get<BracketDetail>(`${environment.apiBaseUrl}/public/brackets/${id}`);
  }

  getMatches(filters: {
    bracketId?: number | null;
    date?: string | null;
    page?: number;
    size?: number;
  }): Observable<MatchPageResponse> {
    const params: Record<string, string> = {
      page: String(filters.page ?? 0),
      size: String(filters.size ?? 50),
    };

    if (filters.bracketId) {
      params['bracketId'] = String(filters.bracketId);
    }

    if (filters.date) {
      params['date'] = filters.date;
    }

    return this.http.get<MatchPageResponse>(`${environment.apiBaseUrl}/public/matches`, { params });
  }
}
