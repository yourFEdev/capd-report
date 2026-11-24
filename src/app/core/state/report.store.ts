import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs';
import { ReportPayload, Report } from '../models/report.model';
import { ReportService } from '../services/report.service';

@Injectable({ providedIn: 'root' })
export class ReportStore {
  private api = inject(ReportService);

  private _reports = signal<Report[]>([]);
  readonly reports = this._reports.asReadonly();
  readonly loading = signal(false);
  readonly search = signal('');

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this._reports();
    return this._reports().filter(
      (r) => r.title.toLowerCase().includes(q) ,
    );
  });
  readonly total = computed(() => this._reports().length);
  // readonly approvedCount = computed(
  //   () => this._reports().filter((r) => r.status === 'approved').length,
  // );

  load() {
    this.loading.set(true);
    this.api
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((data) => this._reports.set(data));
  }

  add(payload: ReportPayload) {
    return this.api.create(payload).pipe(tap((r) => this._reports.update((list) => [r, ...list])));
  }

  update(id: number, payload: ReportPayload) {
    return this.api
      .update(id, payload)
      .pipe(tap((r) => this._reports.update((list) => list.map((x) => (x.id === id ? r : x)))));
  }

  remove(id: number) {
    return this.api
      .delete(id)
      .pipe(tap(() => this._reports.update((list) => list.filter((x) => x.id !== id))));
  }
}
