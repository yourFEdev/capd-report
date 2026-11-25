import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardData, DashboardExchange } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatTableModule, MatProgressBarModule],
  template: `@if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (error()) {
      <div class="flex items-center justify-between rounded-lg bg-red-50 p-4 text-red-800">
        <span>Gagal memuat dashboard.</span>
        <button mat-button type="button" (click)="load()">Coba lagi</button>
      </div>
    }

    @if (data(); as d) {
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-semibold text-slate-800">Ringkasan Hari Ini</h1>
            <p class="text-sm text-slate-600">{{ todayLabel() }}</p>
          </div>
          <a
            routerLink="/reports/new"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-text-inverse shadow-sm transition hover:bg-primary-hover"
          >
            <mat-icon>add</mat-icon>
            Isi Laporan
          </a>
        </div>

        @if (d.alert) {
          <div class="flex items-center gap-3 rounded-lg bg-amber-100 px-4 py-3 text-amber-900">
            <mat-icon>warning</mat-icon>
            <span class="text-sm">{{ d.alert.message }}</span>
          </div>
        }

        <!-- Kartu ringkasan -->
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div class="rounded-xl bg-white p-4 shadow-sm">
            <p class="text-sm text-slate-600">Exchange selesai</p>
            <p class="mt-1 text-2xl font-bold text-slate-800">
              {{ d.summary.exchangeCompleted }} / {{ d.summary.exchangeTotal }}
            </p>
            <p class="text-sm text-slate-600">Hari ini</p>
          </div>

          <div class="rounded-xl bg-white p-4 shadow-sm">
            <p class="text-sm text-slate-600">Total balance</p>
            <p class="mt-1 text-2xl font-bold text-slate-800">
              {{ signed(d.summary.totalBalance) }} mL
            </p>
            <p class="text-sm text-slate-600">Target {{ signed(d.summary.targetBalance) }} mL</p>
          </div>

          <div class="rounded-xl bg-white p-4 shadow-sm">
            <p class="text-sm text-slate-600">Tekanan darah</p>
            <p class="mt-1 text-2xl font-bold text-slate-800">
              {{ d.summary.bloodPressure ?? '-' }}
            </p>
            <p class="text-sm text-slate-600">mmHg</p>
          </div>

          <div class="rounded-xl bg-white p-4 shadow-sm">
            <p class="text-sm text-slate-600">Berat badan</p>
            <p class="mt-1 text-2xl font-bold text-slate-800">
              {{ d.summary.weight === null ? '-' : num(d.summary.weight) + ' kg' }}
            </p>
          </div>
        </div>

        <!-- Chart balance 7 hari -->
        <section class="rounded-xl bg-white p-5 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-800">Balance cairan 7 hari (mL)</h2>

          <div class="mt-4 flex h-48 items-end gap-3 pt-6">
            @for (b of bars(); track b.date) {
              <div class="flex h-full flex-1 items-end">
                <div
                  class="relative w-full rounded-t-md"
                  [class]="b.isToday ? 'bg-teal-800' : 'bg-teal-500'"
                  [style.height.%]="b.height"
                  [attr.aria-label]="b.label + ': ' + b.balance + ' mL'"
                >
                  <span class="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-slate-700">
                    {{ b.balance }}
                  </span>
                </div>
              </div>
            }
          </div>

          <div class="mt-2 flex gap-3">
            @for (b of bars(); track b.date) {
              <span class="flex-1 text-center text-sm text-slate-700">{{ b.label }}</span>
            }
          </div>
        </section>

        <!-- Tabel exchange hari ini -->
        <section class="rounded-xl bg-white p-5 shadow-sm">
          <h2 class="mb-2 text-lg font-semibold text-slate-800">Exchange hari ini</h2>

          <div class="overflow-x-auto">
            <table mat-table [dataSource]="d.exchanges" class="w-full">
              <ng-container matColumnDef="cycle">
                <th mat-header-cell *matHeaderCellDef>Ke-</th>
                <td mat-cell *matCellDef="let e">{{ e.cycle }}</td>
              </ng-container>

              <ng-container matColumnDef="time">
                <th mat-header-cell *matHeaderCellDef>Jam</th>
                <td mat-cell *matCellDef="let e">{{ time(e.time) }}</td>
              </ng-container>

              <ng-container matColumnDef="concentration">
                <th mat-header-cell *matHeaderCellDef>Dialisat</th>
                <td mat-cell *matCellDef="let e">{{ conc(e.concentration) }}</td>
              </ng-container>

              <ng-container matColumnDef="volumeIn">
                <th mat-header-cell *matHeaderCellDef>Masuk (mL)</th>
                <td mat-cell *matCellDef="let e">{{ num(e.volumeIn) }}</td>
              </ng-container>

              <ng-container matColumnDef="volumeOut">
                <th mat-header-cell *matHeaderCellDef>Keluar (mL)</th>
                <td mat-cell *matCellDef="let e">{{ num(e.volumeOut) }}</td>
              </ng-container>

              <ng-container matColumnDef="balance">
                <th mat-header-cell *matHeaderCellDef>Balance (mL)</th>
                <td mat-cell *matCellDef="let e">{{ signed(e.balance) }}</td>
              </ng-container>

              <ng-container matColumnDef="fluidAppearance">
                <th mat-header-cell *matHeaderCellDef>Cairan keluar</th>
                <td mat-cell *matCellDef="let e">
                  @let b = badge(e);
                  <span class="rounded-full px-3 py-1 text-xs font-medium {{ b.css }}">{{
                    b.label
                  }}</span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns"></tr>
            </table>
          </div>
        </section>
      </div>
    } `,
})
export class Dashboard implements OnInit {
  private api = inject(DashboardService);

  data = signal<DashboardData | null>(null);
  loading = signal(false);
  error = signal(false);

  columns = [
    'cycle',
    'time',
    'concentration',
    'volumeIn',
    'volumeOut',
    'balance',
    'fluidAppearance',
  ];

  todayLabel = computed(() => {
    const d = this.data();
    if (!d) return '';
    return new Date(`${d.date}T00:00:00`).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });

  bars = computed(() => {
    const d = this.data();
    if (!d) return [];
    const max = Math.max(...d.balanceChart.map((b) => b.balance), 0);
    return d.balanceChart.map((b) => ({
      ...b,
      height: max > 0 ? Math.max((b.balance / max) * 100, 2) : 2,
      isToday: b.date === d.date,
    }));
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.api
      .getToday()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (d) => this.data.set(d),
        error: () => this.error.set(true),
      });
  }

  signed(n: number | null) {
    if (n === null) return '-';
    const s = n.toLocaleString('id-ID');
    return n > 0 ? `+${s}` : s;
  }
  time(t: string) {
    return t.replace(':', '.');
  }
  conc(c: string | null) {
    return c ? c.replace('.', ',') : '-';
  }
  num(n: number | null) {
    return n === null ? '-' : n.toLocaleString('id-ID');
  }
  badge(e: DashboardExchange) {
    if (e.status === 'pending') return { label: 'Menunggu', css: 'bg-amber-100 text-amber-800' };
    const clear = e.fluidAppearance?.toLowerCase() === 'jernih';
    return {
      label: e.fluidAppearance ?? '-',
      css: clear ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800',
    };
  }
}
