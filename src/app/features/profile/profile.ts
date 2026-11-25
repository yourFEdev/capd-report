import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProfileService } from '../../core/services/profile.service';
import {
  BloodPressurePeriod,
  ExchangeSchedule,
  ProfileModel,
  ProfileUpdate,
} from '../../core/models/profile.model';
import { HasUnsavedChanges } from '../../core/guard/unsave-changes.guard';

type ScheduleGroup = FormGroup<{
  cycle: FormControl<number | null>;
  time: FormControl<string>;
}>;

const uniqueCycles: ValidatorFn = (control) => {
  const cycles = (control as FormArray<ScheduleGroup>).controls.map((g) => g.controls.cycle.value);
  return new Set(cycles).size === cycles.length ? null : { duplicateCycle: true };
};

const bpComplete: ValidatorFn = (group) => {
  const v = group.value as Record<string, unknown>;
  const filled = ['systolic', 'diastolic', 'period', 'date'].filter(
    (k) => v[k] !== null && v[k] !== '' && v[k] !== undefined,
  ).length;
  return filled === 0 || filled === 4 ? null : { incomplete: true };
};

@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
  ],
  template: `@if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (error()) {
      <div class="flex items-center justify-between rounded-lg bg-red-50 p-4 text-red-800">
        <span>Gagal memuat profil.</span>
        <button mat-button type="button" (click)="load()">Coba lagi</button>
      </div>
    }

    @if (profile(); as p) {
      <form [formGroup]="form" (ngSubmit)="submit()" class="mx-auto max-w-3xl space-y-6">
        <h1 class="text-2xl font-semibold text-slate-800">Profil</h1>

        <!-- Kartu identitas (read-only) -->
        <section class="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
          <div
            class="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-teal-800 text-lg font-semibold text-white"
          >
            {{ initials() }}
          </div>
          <div class="min-w-0">
            <p class="truncate text-lg font-semibold text-slate-800">{{ p.name }}</p>
            <p class="text-sm text-slate-600">{{ '@' + p.username }}</p>
          </div>
          <span
            class="ml-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
          >
            {{ p.role }}
          </span>
        </section>

        <!-- Data diri -->
        <section class="rounded-xl bg-white p-5 shadow-sm">
          <h2 class="mb-4 text-lg font-semibold text-slate-800">Data diri</h2>
          <div class="grid gap-x-4 sm:grid-cols-2">
            <mat-form-field appearance="outline" class="sm:col-span-2">
              <mat-label>Nama</mat-label>
              <input matInput formControlName="name" />
              @if (form.controls.name.hasError('required')) {
                <mat-error>Nama wajib diisi</mat-error>
              } @else if (form.controls.name.hasError('minlength')) {
                <mat-error>Minimal 2 karakter</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Tinggi badan (cm)</mat-label>
              <input matInput type="number" formControlName="heightCm" />
              <mat-error>Isi antara 50 sampai 250</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Target balance harian (mL)</mat-label>
              <input matInput type="number" formControlName="targetBalance" />
              <mat-error>Target balance wajib diisi</mat-error>
            </mat-form-field>
          </div>
        </section>

        <!-- Berat badan -->
        <section class="rounded-xl bg-white p-5 shadow-sm">
          <h2 class="mb-4 text-lg font-semibold text-slate-800">Berat badan terakhir</h2>
          <div class="grid gap-x-4 sm:grid-cols-2">
            <mat-form-field appearance="outline">
              <mat-label>Berat (kg)</mat-label>
              <input matInput type="number" step="0.1" formControlName="weightKg" />
              <mat-error>Isi antara 20 sampai 300</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Tanggal ditimbang</mat-label>
              <input matInput type="date" formControlName="weightDate" />
            </mat-form-field>
          </div>
        </section>

        <!-- Tekanan darah -->
        <section class="rounded-xl bg-white p-5 shadow-sm" formGroupName="bloodPressure">
          <h2 class="mb-4 text-lg font-semibold text-slate-800">Tekanan darah terakhir</h2>
          <div class="grid gap-x-4 sm:grid-cols-2">
            <mat-form-field appearance="outline">
              <mat-label>Sistolik (mmHg)</mat-label>
              <input matInput type="number" formControlName="systolic" />
              <mat-error>Isi antara 50 sampai 260</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Diastolik (mmHg)</mat-label>
              <input matInput type="number" formControlName="diastolic" />
              <mat-error>Isi antara 30 sampai 160</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Waktu pengukuran</mat-label>
              <mat-select formControlName="period">
                <mat-option [value]="null">-</mat-option>
                @for (p of periods; track p) {
                  <mat-option [value]="p">{{ p }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Tanggal pengukuran</mat-label>
              <input matInput type="date" formControlName="date" />
            </mat-form-field>
          </div>

          @if (
            form.controls.bloodPressure.hasError('incomplete') &&
            form.controls.bloodPressure.touched
          ) {
            <p class="text-sm text-red-700">
              Lengkapi sistolik, diastolik, waktu, dan tanggal, atau kosongkan semuanya.
            </p>
          }
        </section>

        <!-- Jadwal exchange -->
        <section class="rounded-xl bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-800">Jadwal exchange</h2>
            <button mat-stroked-button type="button" (click)="addSchedule()">
              <mat-icon>add</mat-icon> Tambah jadwal
            </button>
          </div>

          <div formArrayName="exchangeSchedule">
            @for (group of schedule.controls; track group; let i = $index) {
              <div [formGroupName]="i" class="flex items-start gap-3">
                <mat-form-field appearance="outline" class="w-32">
                  <mat-label>Exchange ke-</mat-label>
                  <input matInput type="number" formControlName="cycle" />
                  <mat-error>Minimal 1</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Jam</mat-label>
                  <input matInput type="time" formControlName="time" />
                  <mat-error>Jam wajib diisi</mat-error>
                </mat-form-field>

                <button
                  mat-icon-button
                  type="button"
                  class="mt-2"
                  (click)="removeSchedule(i)"
                  aria-label="Hapus jadwal"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            } @empty {
              <p class="text-sm text-slate-600">Belum ada jadwal. Klik "Tambah jadwal".</p>
            }
          </div>

          @if (schedule.hasError('duplicateCycle')) {
            <p class="text-sm text-red-700">Nomor exchange tidak boleh sama.</p>
          }
        </section>

        <!-- Aksi -->
        <div class="flex justify-end gap-3">
          <button
            mat-button
            type="button"
            (click)="resetForm()"
            [disabled]="form.pristine || saving()"
          >
            Batalkan perubahan
          </button>
          <button
            mat-flat-button
            class="cta"
            type="submit"
            [disabled]="form.invalid || form.pristine || saving()"
          >
            {{ saving() ? 'Menyimpan...' : 'Simpan perubahan' }}
          </button>
        </div>
      </form>
    } `,
})
export class Profile implements OnInit, HasUnsavedChanges {
  private api = inject(ProfileService);
  private snackBar = inject(MatSnackBar);

  profile = signal<ProfileModel | null>(null);
  loading = signal(false);
  error = signal(false);
  saving = signal(false);

  periods: BloodPressurePeriod[] = ['Pagi', 'Siang', 'Sore', 'Malam'];

  form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    heightCm: new FormControl<number | null>(null, [Validators.min(50), Validators.max(250)]),
    weightKg: new FormControl<number | null>(null, [Validators.min(20), Validators.max(300)]),
    weightDate: new FormControl<string | null>(null),
    bloodPressure: new FormGroup(
      {
        systolic: new FormControl<number | null>(null, [Validators.min(50), Validators.max(260)]),
        diastolic: new FormControl<number | null>(null, [Validators.min(30), Validators.max(160)]),
        period: new FormControl<BloodPressurePeriod | null>(null),
        date: new FormControl<string | null>(null),
      },
      { validators: bpComplete },
    ),
    exchangeSchedule: new FormArray<ScheduleGroup>([], { validators: uniqueCycles }),
    targetBalance: new FormControl<number | null>(null, Validators.required),
  });

  get schedule() {
    return this.form.controls.exchangeSchedule;
  }

  initials = computed(() => {
    const name = this.profile()?.name ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.api
      .get()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (p) => this.applyProfile(p),
        error: () => this.error.set(true),
      });
  }


   private applyProfile(p: ProfileModel) {
    this.profile.set(p);

    this.form.reset({
      name: p.name,
      heightCm: p.heightCm ?? null,
      weightKg: p.weightKg ?? null,
      weightDate: p.weightDate ?? null,
      bloodPressure: p.bloodPressure ?? {
        systolic: null,
        diastolic: null,
        period: null,
        date: null,
      },
      targetBalance: p.targetBalance,
    });

    this.schedule.clear();
    [...p.exchangeSchedule]
      .sort((a, b) => a.cycle - b.cycle)
      .forEach((s) => this.schedule.push(this.scheduleGroup(s)));

    this.form.markAsPristine();
  }

  private scheduleGroup(s?: ExchangeSchedule): ScheduleGroup {
    return new FormGroup({
      cycle: new FormControl<number | null>(s?.cycle ?? null, [
        Validators.required,
        Validators.min(1),
      ]),
      time: new FormControl(s?.time ?? '', { nonNullable: true, validators: Validators.required }),
    });
  }

  addSchedule() {
    const max = Math.max(0, ...this.schedule.controls.map((g) => g.controls.cycle.value ?? 0));
    this.schedule.push(this.scheduleGroup({ cycle: max + 1, time: '' }));
    this.form.markAsDirty();
  }

  removeSchedule(index: number) {
    this.schedule.removeAt(index);
    this.form.markAsDirty();
  }

  resetForm() {
    const p = this.profile();
    if (p) this.applyProfile(p);
  }

  submit() {
    if (this.form.invalid || this.form.pristine) return;

    const v = this.form.getRawValue();
    const bp = v.bloodPressure;
    const hasBp = bp.systolic !== null && bp.diastolic !== null && !!bp.period && !!bp.date;

    const payload: ProfileUpdate = {
      name: v.name.trim(),
      heightCm: v.heightCm,
      weightKg: v.weightKg,
      weightDate: v.weightDate,
      bloodPressure: hasBp
        ? { systolic: bp.systolic!, diastolic: bp.diastolic!, period: bp.period!, date: bp.date! }
        : null,
      exchangeSchedule: v.exchangeSchedule
        .map((s) => ({ cycle: Number(s.cycle), time: s.time }))
        .sort((a, b) => a.cycle - b.cycle),
      targetBalance: Number(v.targetBalance),
    };

    this.saving.set(true);
    this.api
      .update(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (p) => {
          this.applyProfile(p);
          this.snackBar.open('Profil disimpan', 'Tutup', { duration: 2500 });
        },
      });
  }

  hasUnsavedChanges() {
    return this.form.dirty;
  }
}
