import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  BracketDetail,
  BracketPairRequest,
  BracketPairResponse,
  BracketRequest,
  BracketSummary,
} from '../../models/bracket.model';

@Injectable({ providedIn: 'root' })
export class AdminBracketsService {
  private readonly http = inject(HttpClient);

  listBrackets(): Observable<BracketSummary[]> {
    return this.http.get<BracketSummary[]>(`${environment.apiBaseUrl}/admin/brackets`);
  }

  createBracket(request: BracketRequest): Observable<BracketSummary> {
    return this.http.post<BracketSummary>(`${environment.apiBaseUrl}/admin/brackets`, request);
  }

  getBracket(id: number): Observable<BracketDetail> {
    return this.http.get<BracketDetail>(`${environment.apiBaseUrl}/admin/brackets/${id}`);
  }

  updateBracket(id: number, request: BracketRequest): Observable<BracketSummary> {
    return this.http.put<BracketSummary>(`${environment.apiBaseUrl}/admin/brackets/${id}`, request);
  }

  deleteBracket(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/admin/brackets/${id}`);
  }

  addPair(bracketId: number, request: BracketPairRequest): Observable<BracketPairResponse> {
    return this.http.post<BracketPairResponse>(
      `${environment.apiBaseUrl}/admin/brackets/${bracketId}/pairs`,
      request,
    );
  }

  generateBracket(id: number): Observable<BracketDetail> {
    return this.http.post<BracketDetail>(`${environment.apiBaseUrl}/admin/brackets/${id}/generate`, {});
  }
}
