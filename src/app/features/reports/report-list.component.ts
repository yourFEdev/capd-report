import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ReportStore } from '../../core/state/report.store';
import { Report } from '../../core/models/report.model';

@Component({
  selector: 'app-report-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatTableModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="mx-auto flex max-w-6xl flex-col gap-5">
      <!-- Header -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-text-primary">Reports</h1>
        </div>

        <a
          routerLink="new"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-text-inverse shadow-sm transition hover:bg-primary-hover"
        >
          Create Report
        </a>
      </div>

      <!-- Search -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full sm:max-w-sm">
          <mat-label>Search report</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [formControl]="searchControl" placeholder="Find title" />
        </mat-form-field>
      </div>

      <!-- Loading -->
      @if (store.loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      <!-- Desktop Table -->
      <div
        class="hidden overflow-hidden rounded-xl border border-border bg-surface shadow-sm md:block"
      >
        <table mat-table [dataSource]="store.filtered()" class="w-full">
          <!-- Title -->
          <ng-container matColumnDef="title">
            <th
              mat-header-cell
              *matHeaderCellDef
              class="!bg-surface-secondary !px-5 !py-4 !text-xs !font-semibold !uppercase !tracking-wider !text-text-muted"
            >
              Title
            </th>

            <td mat-cell *matCellDef="let r" class="!px-5 !py-4">
              <span class="font-semibold text-text-primary">
                {{ r.title }}
              </span>
            </td>
          </ng-container>

          <!-- Description -->
          <ng-container matColumnDef="description">
            <th
              mat-header-cell
              *matHeaderCellDef
              class="!bg-surface-secondary !px-5 !py-4 !text-xs !font-semibold !uppercase !tracking-wider !text-text-muted"
            >
              Description
            </th>

            <td mat-cell *matCellDef="let r" class="!px-5 !py-4">
              <p class="max-w-sm truncate text-sm text-text-secondary" [title]="r.description">
                {{ r.description || '-' }}
              </p>
            </td>
          </ng-container>

          <!-- Cycle Progress -->
          <ng-container matColumnDef="cycleProgress">
            <th
              mat-header-cell
              *matHeaderCellDef
              class="!bg-surface-secondary !px-5 !py-4 !text-xs !font-semibold !uppercase !tracking-wider !text-text-muted"
            >
              Cycle Progress
            </th>

            <td mat-cell *matCellDef="let r" class="!px-5 !py-4">
              <div class="flex min-w-28 flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-text-primary">
                    {{ getCycleCount(r) }}/4 Cycle
                  </span>

                  <span class="text-xs font-medium text-text-muted">
                    {{ getCycleProgress(r) }}%
                  </span>
                </div>

                <div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
                  <div
                    class="h-full rounded-full bg-primary transition-all duration-300"
                    [style.width.%]="getCycleProgress(r)"
                  ></div>
                </div>
              </div>
            </td>
          </ng-container>

          <!-- Date -->
          <ng-container matColumnDef="date">
            <th
              mat-header-cell
              *matHeaderCellDef
              class="!bg-surface-secondary !px-5 !py-4 !text-xs !font-semibold !uppercase !tracking-wider !text-text-muted"
            >
              Date
            </th>

            <td mat-cell *matCellDef="let r" class="!px-5 !py-4">
              <span class="text-sm text-text-secondary">
                {{ r.date | date: 'dd MMM yyyy' }}
              </span>
            </td>
          </ng-container>

          <!-- Actions -->
          <ng-container matColumnDef="actions">
            <th
              mat-header-cell
              *matHeaderCellDef
              class="!bg-surface-secondary !px-5 !py-4 !text-right !text-xs !font-semibold !uppercase !tracking-wider !text-text-muted"
            >
              Actions
            </th>

            <td mat-cell *matCellDef="let r" class="!px-5 !py-3">
              <div class="flex justify-end gap-2">
                <a
                  [routerLink]="[r.id, 'edit']"
                  title="Edit report"
                  class="flex size-9 items-center justify-center rounded-lg text-text-secondary transition hover:bg-primary-soft hover:text-primary"
                >
                  <mat-icon>edit</mat-icon>
                </a>

                <button
                  type="button"
                  (click)="remove(r)"
                  title="Delete report"
                  class="flex size-9 items-center justify-center rounded-lg text-text-secondary transition hover:bg-warning hover:text-warning-text"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>

          <tr
            mat-row
            *matRowDef="let row; columns: columns"
            class="transition hover:bg-surface-hover"
          ></tr>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="flex flex-col gap-3 md:hidden">
        @for (r of store.filtered(); track r.id) {
          <div
            class="rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:border-primary/30"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <h3 class="truncate font-semibold text-text-primary">
                  {{ r.title }}
                </h3>

                <p class="mt-1 line-clamp-2 text-sm leading-relaxed text-text-secondary">
                  {{ r.description || '-' }}
                </p>

                <!-- Cycle Progress -->
                <div class="mt-3">
                  <div class="mb-1.5 flex items-center justify-between">
                    <span class="text-xs font-medium text-text-muted"> Cycle Progress </span>

                    <span class="text-xs font-semibold text-primary">
                      {{ getCycleCount(r) }}/4 Cycle ({{ getCycleProgress(r) }}%)
                    </span>
                  </div>

                  <div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
                    <div
                      class="h-full rounded-full bg-primary transition-all duration-300"
                      [style.width.%]="getCycleProgress(r)"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 flex items-center justify-between border-t border-border pt-3">
              <div class="flex items-center gap-2 text-xs text-text-muted">
                <mat-icon class="!size-4 !text-base"> calendar_today </mat-icon>

                {{ r.date | date: 'dd MMM yyyy' }}
              </div>

              <div class="flex gap-2">
                <a
                  [routerLink]="[r.id, 'edit']"
                  title="Edit report"
                  class="flex size-9 items-center justify-center rounded-lg text-text-secondary transition hover:bg-primary-soft hover:text-primary"
                >
                  <mat-icon>edit</mat-icon>
                </a>

                <button
                  type="button"
                  (click)="remove(r)"
                  title="Delete report"
                  class="flex size-9 items-center justify-center rounded-lg text-text-secondary transition hover:bg-warning hover:text-warning-text"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Empty State -->
      @if (!store.loading() && store.filtered().length === 0) {
        <div
          class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-4 py-14 text-center"
        >
          <div class="mb-3 flex size-14 items-center justify-center rounded-full bg-primary-soft">
            <mat-icon class="!size-7 !text-2xl text-primary"> description </mat-icon>
          </div>

          <h3 class="font-semibold text-text-primary">No reports found</h3>

          <p class="mt-1 text-sm text-text-muted">No reports match your search. Re</p>
        </div>
      }
    </div>
  `,
})
export class ReportListComponent implements OnInit {
  store = inject(ReportStore);

  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  columns = ['title', 'description', 'cycleProgress', 'date', 'actions'];

  getCycleCount(report: Report): number {
    return report.cycles?.length ?? 0;
  }

  getCycleProgress(report: Report): number {
    return Math.min((this.getCycleCount(report) / 4) * 100, 100);
  }

  searchControl = new FormControl('', {
    nonNullable: true,
  });

  ngOnInit() {
    this.store.load();

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.store.search.set(value);
      });
  }

  remove(report: Report) {
    if (!confirm(`Delete report "${report.title}"?`)) return;

    this.store.remove(report.id).subscribe({
      next: () => {
        this.snackBar.open('report delete successfully', 'close', { duration: 2500 });
      },
      error: () => {
        this.snackBar.open('failed delete report', 'close', { duration: 2500 });
      },
    });
  }
}
