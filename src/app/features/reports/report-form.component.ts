import { Component, computed, effect, inject, input, signal, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReportService } from '../../core/services/report.service';
import { ReportStore } from '../../core/state/report.store';
import { ReportCycle, ReportCyclePayload, ReportPayload } from '../../core/models/report.model';
import { HasUnsavedChanges } from '../../core/guard/unsave-changes.guard';

const UF_BASE = 2000;

type CycleFormGroup = FormGroup<{
  cycle: FormControl<number>;
  period: FormControl<ReportCycle['period']>;
  startTime: FormControl<Date | null>;
  concentration: FormControl<ReportCycle['concentration']>;
  volumeIn: FormControl<number>;
  volumeOut: FormControl<number>;
  fluidAppearance: FormControl<string>;
  notes: FormControl<string>;
}>;

type ReportFormGroup = FormGroup<{
  title: FormControl<string>;
  description: FormControl<string>;
  date: FormControl<Date | null>;
  cycles: FormArray<CycleFormGroup>;
}>;

interface ReportTotals {
  totalVolumeIn: number;
  totalVolumeOut: number;
  totalUF: number;
}

const pad = (n: number): string => String(n).padStart(2, '0');

function dateToString(d: Date | null): string {
  if (!d) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function timeToString(d: Date | null): string {
  if (!d) return '';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function stringToTime(s: string | null | undefined): Date | null {
  if (!s) return null;
  const [h, m] = s.split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

@Component({
  selector: 'app-report-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatTimepickerModule,
    MatButtonModule,
    MatIconModule,
  ],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'en-US' }],
  template: `
    <div class="mx-auto flex flex-col gap-4 p-4">
      <h1 class="text-xl font-semibold text-text-primary sm:text-2xl">
        {{ id() ? 'Edit report' : 'Create report' }}
      </h1>

      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
        <section
          class="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-6"
        >
          <h2 class="mb-4 text-base font-semibold text-primary-dark">General information</h2>

          <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <mat-form-field appearance="outline" class="w-full sm:col-span-2">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" />
              @if (form.controls.title.hasError('required')) {
                <mat-error>Title is required</mat-error>
              } @else if (form.controls.title.hasError('minlength')) {
                <mat-error>Minimum 5 characters</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full sm:col-span-2">
              <mat-label>Date</mat-label>
              <input matInput [matDatepicker]="datePicker" formControlName="date" />
              <mat-datepicker-toggle matIconSuffix [for]="datePicker" />
              <mat-datepicker #datePicker />
              <mat-error>Date is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full sm:col-span-2">
              <mat-label>Description</mat-label>
              <textarea matInput rows="3" formControlName="description"></textarea>
            </mat-form-field>
          </div>
        </section>

        <section class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-primary-dark">Cycles</h2>
            <button
              mat-stroked-button
              type="button"
              (click)="addCycle()"
              class="!border-primary !text-primary"
            >
              <mat-icon>add</mat-icon>
              Add cycle
            </button>
          </div>

          <div formArrayName="cycles" class="flex flex-col gap-4">
            @for (group of cycles.controls; track group; let i = $index) {
              <fieldset
                [formGroupName]="i"
                class="min-w-0 rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-6"
              >
                <legend
                  class="rounded-full bg-primary-soft px-3 py-0.5 text-sm font-semibold text-primary-dark"
                >
                  Cycle {{ i + 1 }}
                </legend>

                <div class="mt-2 grid grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Period</mat-label>
                    <mat-select formControlName="period">
                      @for (p of periods; track p) {
                        <mat-option [value]="p">{{ p }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Start time</mat-label>
                    <input matInput [matTimepicker]="timePicker" formControlName="startTime" />
                    <mat-timepicker-toggle matIconSuffix [for]="timePicker" />
                    <mat-timepicker #timePicker />
                    <mat-error>Start time is required</mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Concentration</mat-label>
                    <mat-select formControlName="concentration">
                      @for (c of concentrations; track c) {
                        <mat-option [value]="c">{{ c }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Volume in (ml)</mat-label>
                    <input matInput type="number" formControlName="volumeIn" />
                    @if (group.controls.volumeIn.hasError('min')) {
                      <mat-error>Must not be negative</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Volume out (ml)</mat-label>
                    <input matInput type="number" formControlName="volumeOut" />
                    @if (group.controls.volumeOut.hasError('min')) {
                      <mat-error>Must not be negative</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Fluid appearance</mat-label>
                    <input matInput formControlName="fluidAppearance" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full sm:col-span-2 lg:col-span-3">
                    <mat-label>Notes</mat-label>
                    <input matInput formControlName="notes" />
                  </mat-form-field>
                </div>

                <div
                  class="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span
                    class="inline-flex w-fit items-center rounded-lg bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary-dark"
                  >
                    UF for this cycle: {{ cycleUfs()[i] ?? 0 }} ml
                  </span>
                  <button
                    mat-button
                    type="button"
                    (click)="removeCycle(i)"
                    [disabled]="cycles.length === 1"
                    class="!text-warning-text disabled:!text-disabled-text"
                  >
                    <mat-icon>delete</mat-icon>
                    Delete cycle
                  </button>
                </div>
              </fieldset>
            }
          </div>
        </section>

        <section
          class="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:grid-cols-3 sm:p-6"
        >
          <div class="rounded-lg bg-background px-4 py-3">
            <p class="text-xs text-text-muted">Total volume in</p>
            <p class="text-lg font-semibold text-text-primary">{{ totals().totalVolumeIn }} ml</p>
          </div>
          <div class="rounded-lg bg-background px-4 py-3">
            <p class="text-xs text-text-muted">Total volume out</p>
            <p class="text-lg font-semibold text-text-primary">{{ totals().totalVolumeOut }} ml</p>
          </div>
          <div class="rounded-lg bg-primary-soft px-4 py-3">
            <p class="text-xs text-primary-dark">Total UF</p>
            <p class="text-lg font-semibold text-primary-dark">{{ totals().totalUF }} ml</p>
          </div>
        </section>

        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <a mat-stroked-button routerLink="/reports" class="!border-border !text-text-secondary">
            Cancel
          </a>
          <button
            mat-flat-button
            type="submit"
            [disabled]="form.invalid || saving()"
            class="!bg-primary !text-text-inverse disabled:!bg-disabled disabled:!text-disabled-text"
          >
            {{ saving() ? 'Saving...' : 'Save report' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ReportFormComponent implements HasUnsavedChanges {
  private fb: NonNullableFormBuilder = inject(FormBuilder).nonNullable;
  private api: ReportService = inject(ReportService);
  private store: ReportStore = inject(ReportStore);
  private router: Router = inject(Router);
  private snackBar: MatSnackBar = inject(MatSnackBar);

  id = input<number | undefined, string | undefined>(undefined, {
    transform: (v: string | undefined): number | undefined => (v ? Number(v) : undefined),
  });

  saving = signal<boolean>(false);

  periods: ReportCycle['period'][] = ['Morning', 'Noon', 'Afternoon', 'Evening'];
  concentrations: ReportCycle['concentration'][] = ['1.5%', '2.5%', '4.25%'];

  form: ReportFormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: [''],
    date: [new Date() as Date | null, Validators.required],
    cycles: this.fb.array<CycleFormGroup>([this.createCycleGroup()]),
  });

  get cycles(): FormArray<CycleFormGroup> {
    return this.form.controls.cycles;
  }

  private formChange = toSignal(this.form.valueChanges, { initialValue: null });

  cycleUfs: Signal<number[]> = computed<number[]>(() => {
    this.formChange();
    return this.cycles.getRawValue().map((c) => this.num(c.volumeOut) - UF_BASE);
  });

  totals: Signal<ReportTotals> = computed<ReportTotals>(() => {
    this.formChange();
    const rows = this.cycles.getRawValue();
    const totalVolumeIn = rows.reduce((sum, c) => sum + this.num(c.volumeIn), 0);
    const totalVolumeOut = rows.reduce((sum, c) => sum + this.num(c.volumeOut), 0);
    const totalUF = rows.reduce((sum, c) => sum + (this.num(c.volumeOut) - UF_BASE), 0);
    return { totalVolumeIn, totalVolumeOut, totalUF };
  });

  constructor() {
    effect((): void => {
      const id: number | undefined = this.id();
      if (!id) return;

      this.api.getById(id).subscribe((report) => {
        this.form.patchValue({
          title: report.title,
          description: report.description,
          date: new Date(report.date),
        });

        this.cycles.clear();
        report.cycles.forEach((c) => this.cycles.push(this.createCycleGroup(c)));

        this.form.markAsPristine();
      });
    });
  }

  private createCycleGroup(c?: Partial<ReportCyclePayload>): CycleFormGroup {
    return this.fb.group({
      cycle: [c?.cycle ?? 1],
      period: [c?.period ?? ('Morning' as ReportCycle['period']), Validators.required],
      startTime: [stringToTime(c?.startTime), Validators.required],
      concentration: [
        c?.concentration ?? ('1.5%' as ReportCycle['concentration']),
        Validators.required,
      ],
      volumeIn: [c?.volumeIn ?? 0, [Validators.required, Validators.min(0)]],
      volumeOut: [c?.volumeOut ?? 0, [Validators.required, Validators.min(0)]],
      fluidAppearance: [c?.fluidAppearance ?? ''],
      notes: [c?.notes ?? ''],
    });
  }

  addCycle(): void {
    this.cycles.push(this.createCycleGroup({ cycle: this.cycles.length + 1 }));
    this.form.markAsDirty();
  }

  removeCycle(index: number): void {
    this.cycles.removeAt(index);
    this.cycles.controls.forEach((group, i) => group.controls.cycle.setValue(i + 1));
    this.form.markAsDirty();
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const raw = this.form.getRawValue();
    const payload: ReportPayload = {
      title: raw.title,
      description: raw.description,
      date: dateToString(raw.date),
      cycles: raw.cycles.map((c): ReportCyclePayload => ({
        ...c,
        startTime: timeToString(c.startTime),
        volumeIn: this.num(c.volumeIn),
        volumeOut: this.num(c.volumeOut),
        uf: this.num(c.volumeOut) - UF_BASE,
      })),
      ...this.totals(),
    };

    const id: number | undefined = this.id();
    const request$: Observable<unknown> = id
      ? this.store.update(id, payload)
      : this.store.add(payload);

    request$.subscribe({
      next: () => {
        this.form.markAsPristine();
        this.snackBar.open('Report saved', 'Close', { duration: 2500 });
        this.router.navigate(['/reports']);
      },
      error: () => this.saving.set(false),
    });
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  private num(v: number | null | undefined): number {
    return Number(v) || 0;
  }
}
