import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DashboardData } from '../models/dashboard.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  getToday() {
    return this.http.get<DashboardData>(`${environment.apiUrl}/dashboard`);
  }
}
