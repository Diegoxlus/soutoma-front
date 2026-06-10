import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RegisteredPairPage } from '../../models/pair.model';

@Injectable({ providedIn: 'root' })
export class AdminPairsService {
  private readonly http = inject(HttpClient);

  listPairs(bracketId: number, page: number, size: number): Observable<RegisteredPairPage> {
    const params = new HttpParams().set('bracketId', bracketId).set('page', page).set('size', size);

    return this.http.get<RegisteredPairPage>(`${environment.apiBaseUrl}/admin/pairs`, { params });
  }

  deletePair(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/admin/pairs/${id}`);
  }
}
