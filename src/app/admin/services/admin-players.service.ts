import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PlayerListFilters, PlayerPage, PlayerRequest, PlayerResponse } from '../../models/player.model';

@Injectable({ providedIn: 'root' })
export class AdminPlayersService {
  private readonly http = inject(HttpClient);

  listPlayers(filters: PlayerListFilters): Observable<PlayerPage> {
    let params = new HttpParams().set('page', filters.page).set('size', filters.size);

    if (filters.search) {
      params = params.set('search', filters.search);
    }

    if (filters.gender) {
      params = params.set('gender', filters.gender);
    }

    if (filters.bracketId) {
      params = params.set('bracketId', filters.bracketId);
    }

    if (filters.availableOnly !== undefined) {
      params = params.set('availableOnly', filters.availableOnly);
    }

    return this.http.get<PlayerPage>(`${environment.apiBaseUrl}/admin/players`, { params });
  }

  createPlayer(request: PlayerRequest): Observable<PlayerResponse> {
    return this.http.post<PlayerResponse>(`${environment.apiBaseUrl}/admin/players`, request);
  }

  updatePlayer(id: number, request: PlayerRequest): Observable<PlayerResponse> {
    return this.http.put<PlayerResponse>(`${environment.apiBaseUrl}/admin/players/${id}`, request);
  }
}
