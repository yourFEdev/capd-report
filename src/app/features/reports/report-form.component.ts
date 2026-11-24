import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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

const pad = (n: number) => String(n).padStart(2, '0');

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
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'id-ID' }],
  template: `
    <div class="mx-auto flex max-w-4xl flex-col gap-4 p-4 sm:p-6">
      <h1 class="text-xl font-semibold text-text-primary sm:text-2xl">
        {{ id() ? 'Edit laporan' : 'Buat laporan' }}
      </h1>

      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
        <!-- Informasi umum -->
        <section
          class="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-6"
        >
          <h2 class="mb-4 text-base font-semibold text-primary-dark">Informasi umum</h2>

          <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <mat-form-field appearance="outline" class="w-full sm:col-span-2">
              <mat-label>Judul</mat-label>
              <input matInput formControlName="title" />
              @if (form.controls.title.hasError('required')) {
                <mat-error>Judul wajib diisi</mat-error>
              } @else if (form.controls.title.hasError('minlength')) {
                <mat-error>Minimal 5 karakter</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full sm:col-span-2">
              <mat-label>Tanggal</mat-label>
              <input matInput [matDatepicker]="datePicker" formControlName="date" />
              <mat-datepicker-toggle matIconSuffix [for]="datePicker" />
              <mat-datepicker #datePicker />
              <mat-error>Tanggal wajib diisi</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full sm:col-span-2">
              <mat-label>Deskripsi</mat-label>
              <textarea matInput rows="3" formControlName="description"></textarea>
            </mat-form-field>
          </div>
        </section>

        <!-- Siklus -->
        <section class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-primary-dark">Siklus</h2>
            <button
              mat-stroked-button
              type="button"
              (click)="addCycle()"
              class="!border-primary !text-primary"
            >
              <mat-icon>add</mat-icon>
              Tambah siklus
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
                  Siklus {{ i + 1 }}
                </legend>

                <div class="mt-2 grid grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Periode</mat-label>
                    <mat-select formControlName="period">
                      @for (p of periods; track p) {
                        <mat-option [value]="p">{{ p }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Jam mulai</mat-label>
                    <input matInput [matTimepicker]="timePicker" formControlName="startTime" />
                    <mat-timepicker-toggle matIconSuffix [for]="timePicker" />
                    <mat-timepicker #timePicker />
                    <mat-error>Jam mulai wajib diisi</mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Konsentrasi</mat-label>
                    <mat-select formControlName="concentration">
                      @for (c of concentrations; track c) {
                        <mat-option [value]="c">{{ c }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Volume masuk (ml)</mat-label>
                    <input matInput type="number" formControlName="volumeIn" />
                    @if (group.controls.volumeIn.hasError('min')) {
                      <mat-error>Tidak boleh negatif</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Volume keluar (ml)</mat-label>
                    <input matInput type="number" formControlName="volumeOut" />
                    @if (group.controls.volumeOut.hasError('min')) {
                      <mat-error>Tidak boleh negatif</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Tampilan cairan</mat-label>
                    <input matInput formControlName="fluidAppearance" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full sm:col-span-2 lg:col-span-3">
                    <mat-label>Catatan</mat-label>
                    <input matInput formControlName="notes" />
                  </mat-form-field>
                </div>

                <div
                  class="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span
                    class="inline-flex w-fit items-center rounded-lg bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary-dark"
                  >
                    UF siklus ini: {{ cycleUfs()[i] ?? 0 }} ml
                  </span>
                  <button
                    mat-button
                    type="button"
                    (click)="removeCycle(i)"
                    [disabled]="cycles.length === 1"
                    class="!text-warning-text disabled:!text-disabled-text"
                  >
                    <mat-icon>delete</mat-icon>
                    Hapus siklus
                  </button>
                </div>
              </fieldset>
            }
          </div>
        </section>

        <!-- Ringkasan -->
        <section
          class="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:grid-cols-3 sm:p-6"
        >
          <div class="rounded-lg bg-background px-4 py-3">
            <p class="text-xs text-text-muted">Total volume masuk</p>
            <p class="text-lg font-semibold text-text-primary">{{ totals().totalVolumeIn }} ml</p>
          </div>
          <div class="rounded-lg bg-background px-4 py-3">
            <p class="text-xs text-text-muted">Total volume keluar</p>
            <p class="text-lg font-semibold text-text-primary">{{ totals().totalVolumeOut }} ml</p>
          </div>
          <div class="rounded-lg bg-primary-soft px-4 py-3">
            <p class="text-xs text-primary-dark">Total UF</p>
            <p class="text-lg font-semibold text-primary-dark">{{ totals().totalUF }} ml</p>
          </div>
        </section>

        <!-- Aksi -->
        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <a mat-stroked-button routerLink="/reports" class="!border-border !text-text-secondary">
            Batal
          </a>
          <button
            mat-flat-button
            type="submit"
            [disabled]="form.invalid || saving()"
            class="!bg-primary !text-text-inverse disabled:!bg-disabled disabled:!text-disabled-text"
          >
            {{ saving() ? 'Menyimpan...' : 'Simpan laporan' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ReportFormComponent implements HasUnsavedChanges {
  private fb = inject(FormBuilder).nonNullable;
  private api = inject(ReportService);
  private store = inject(ReportStore);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  id = input<number, string | undefined>(undefined, {
    transform: (v) => (v ? Number(v) : undefined),
  });

  saving = signal(false);

  periods: ReportCycle['period'][] = ['Pagi', 'Siang', 'Sore', 'Malam'];
  concentrations: ReportCycle['concentration'][] = ['1.5%', '2.5%', '4.25%'];

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: [''],
    date: [new Date() as Date | null, Validators.required],
    cycles: this.fb.array([this.createCycleGroup()]),
  });

  get cycles() {
    return this.form.controls.cycles;
  }

  private formChange = toSignal(this.form.valueChanges, { initialValue: null });

  cycleUfs = computed(() => {
    this.formChange(); // dibaca supaya computed ini ikut ter-update
    return this.cycles.getRawValue().map((c) => this.num(c.volumeOut) - UF_BASE);
  });

  totals = computed(() => {
    this.formChange();
    const rows = this.cycles.getRawValue();
    const totalVolumeIn = rows.reduce((sum, c) => sum + this.num(c.volumeIn), 0);
    const totalVolumeOut = rows.reduce((sum, c) => sum + this.num(c.volumeOut), 0);
    const totalUF = rows.reduce((sum, c) => sum + (this.num(c.volumeOut) - UF_BASE), 0);
    return { totalVolumeIn, totalVolumeOut, totalUF };
  });

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) return;

      this.api.getById(id).subscribe((report) => {
        this.form.patchValue({
          title: report.title,
          description: report.description,
          date: new Date(report.date),
        });

        // patchValue TIDAK menambah/mengurangi jumlah item FormArray,
        // jadi kosongkan dulu lalu isi ulang sesuai data dari API
        this.cycles.clear();
        report.cycles.forEach((c) => this.cycles.push(this.createCycleGroup(c)));

        this.form.markAsPristine();
      });
    });
  }

  private createCycleGroup(c?: Partial<ReportCyclePayload>) {
    return this.fb.group({
      cycle: [c?.cycle ?? 1],
      period: [c?.period ?? ('Pagi' as ReportCycle['period']), Validators.required],
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

  addCycle() {
    this.cycles.push(this.createCycleGroup({ cycle: this.cycles.length + 1 }));
    this.form.markAsDirty(); // push/removeAt tidak otomatis menandai form "berubah"
  }

  removeCycle(index: number) {
    this.cycles.removeAt(index);
    // nomor siklus dirapikan lagi: 1, 2, 3, ...
    this.cycles.controls.forEach((group, i) => group.controls.cycle.setValue(i + 1));
    this.form.markAsDirty();
  }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);

    const raw = this.form.getRawValue();
    const payload: ReportPayload = {
      title: raw.title,
      description: raw.description,
      date: dateToString(raw.date), // Date -> 'yyyy-MM-dd'
      cycles: raw.cycles.map((c) => ({
        ...c,
        startTime: timeToString(c.startTime), // Date -> 'HH:mm'
        volumeIn: this.num(c.volumeIn),
        volumeOut: this.num(c.volumeOut),
        uf: this.num(c.volumeOut) - UF_BASE,
      })),
      ...this.totals(), // totalVolumeIn, totalVolumeOut, totalUF
    };

    const id = this.id();
    const request$ = id ? this.store.update(id, payload) : this.store.add(payload);

    request$.subscribe({
      next: () => {
        this.form.markAsPristine(); // supaya unsavedChangesGuard tidak menahan navigasi
        this.snackBar.open('Laporan disimpan', 'Tutup', { duration: 2500 });
        this.router.navigate(['/reports']);
      },
      error: () => this.saving.set(false),
    });
  }

  hasUnsavedChanges() {
    return this.form.dirty;
  }

  private num(v: number | null | undefined) {
    return Number(v) || 0;
  }
}
