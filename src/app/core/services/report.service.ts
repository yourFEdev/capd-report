import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Report, ReportPayload } from '../models/report.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private url = environment.apiUrl;

  getAll() {
    return this.http.get<Report[]>(`${this.url}/reports`);
  }
  getById(id: number) {
    return this.http.get<Report>(`${this.url}/reports/${id}`);
  }
  create(payload: ReportPayload) {
    return this.http.post<Report>(`${this.url}/reports`, payload);
  }
  update(id: number, payload: ReportPayload) {
    return this.http.put<Report>(`${this.url}/reports/${id}`, payload);
  }
  delete(id: number) {
    return this.http.delete<void>(`${this.url}/reports/${id}`);
  }
}
