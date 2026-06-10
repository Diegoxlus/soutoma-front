import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  MatchPairSwapRequest,
  MatchPairSwapResponse,
  MatchResponse,
  MatchResultRequest,
  MatchScheduleRequest,
} from '../../models/bracket.model';

@Injectable({ providedIn: 'root' })
export class AdminMatchesService {
  private readonly http = inject(HttpClient);

  scheduleMatch(id: number, request: MatchScheduleRequest): Observable<MatchResponse> {
    return this.http.put<MatchResponse>(`${environment.apiBaseUrl}/admin/matches/${id}/schedule`, request);
  }

  saveResult(id: number, request: MatchResultRequest): Observable<MatchResponse> {
    return this.http.put<MatchResponse>(`${environment.apiBaseUrl}/admin/matches/${id}/result`, request);
  }

  swapPairs(request: MatchPairSwapRequest): Observable<MatchPairSwapResponse> {
    return this.http.put<MatchPairSwapResponse>(`${environment.apiBaseUrl}/admin/matches/pairs/swap`, request);
  }
}
