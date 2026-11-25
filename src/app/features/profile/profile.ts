import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProfileService } from '../../core/services/profile.service';
import { BloodPressurePeriod, ProfileModel, ProfileUpdate } from '../../core/models/profile.model';
import { HasUnsavedChanges } from '../../core/guard/unsave-changes.guard';

const bpComplete: ValidatorFn = (group) => {
  const v = group.value as Record<string, unknown>;
  const filled = ['systolic', 'diastolic', 'period'].filter(
    (k) => v[k] !== null && v[k] !== '' && v[k] !== undefined,
  ).length;
  return filled === 0 || filled === 3 ? null : { incomplete: true };
};

@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
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
      <form [formGroup]="form" (ngSubmit)="submit()" class="mx-auto p-4 space-y-6">
        <h1 class="text-2xl font-semibold text-slate-800">Profil</h1>

        <section class="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
          <div
            class="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-teal-800 text-lg font-semibold text-white"
          >
            {{ initials() }}
          </div>
          <div class="min-w-0">
            <p class="truncate text-lg font-semibold text-slate-800">{{ p.name }}</p>
          </div>
        </section>

        <section class="rounded-xl bg-white p-5 shadow-sm">
          <h2 class="mb-4 text-lg font-semibold text-slate-800">Personal data</h2>
          <div class="grid gap-x-4 sm:grid-cols-2">
            <mat-form-field appearance="outline" class="sm:col-span-2">
              <mat-label>Nama</mat-label>
              <input matInput formControlName="name" />
              @if (form.controls.name.hasError('required')) {
                <mat-error>Nama is required</mat-error>
              } @else if (form.controls.name.hasError('minlength')) {
                <mat-error>Minimum 2 character</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Height (cm)</mat-label>
              <input matInput type="number" formControlName="heightCm" />
              <mat-error>50 - 250</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Weight (kg)</mat-label>
              <input matInput type="number" step="0.1" formControlName="weightKg" />
              <mat-error>20 - 300</mat-error>
            </mat-form-field>
          </div>
        </section>

        <section class="rounded-xl bg-white p-5 shadow-sm" formGroupName="bloodPressure">
          <h2 class="mb-4 text-lg font-semibold text-slate-800">Blood pressure</h2>
          <div class="grid gap-x-4 sm:grid-cols-2">
            <mat-form-field appearance="outline">
              <mat-label>Systolic (mmHg)</mat-label>
              <input matInput type="number" formControlName="systolic" />
              <mat-error>50 - 260</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Diastolic (mmHg)</mat-label>
              <input matInput type="number" formControlName="diastolic" />
              <mat-error>30 - 160</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="sm:col-span-2">
              <mat-label>Measurement time</mat-label>
              <mat-select formControlName="period">
                <mat-option [value]="null">-</mat-option>
                @for (p of periods; track p) {
                  <mat-option [value]="p">{{ p }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          @if (
            form.controls.bloodPressure.hasError('incomplete') &&
            form.controls.bloodPressure.touched
          ) {
            <p class="text-sm text-red-700">
              Fill in the systolic, diastolic, and time, or leave them all blank.
            </p>
          }
        </section>

        <div class="flex justify-end gap-3">
          <button
            mat-button
            type="button"
            (click)="resetForm()"
            [disabled]="form.pristine || saving()"
          >
            Discard
          </button>
          <button
            mat-flat-button
            class="cta"
            type="submit"
            [disabled]="form.invalid || form.pristine || saving()"
          >
            {{ saving() ? 'saving...' : 'Save' }}
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

  periods: BloodPressurePeriod[] = ['Morning', 'Noon', 'Afternoon', 'Evening'];

  form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    heightCm: new FormControl<number | null>(null, [Validators.min(50), Validators.max(250)]),
    weightKg: new FormControl<number | null>(null, [Validators.min(20), Validators.max(300)]),
    bloodPressure: new FormGroup(
      {
        systolic: new FormControl<number | null>(null, [Validators.min(50), Validators.max(260)]),
        diastolic: new FormControl<number | null>(null, [Validators.min(30), Validators.max(160)]),
        period: new FormControl<BloodPressurePeriod | null>(null),
      },
      { validators: bpComplete },
    ),
  });

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
      bloodPressure: {
        systolic: p.bloodPressure?.systolic ?? null,
        diastolic: p.bloodPressure?.diastolic ?? null,
        period: p.bloodPressure?.period ?? null,
      },
    });

    this.form.markAsPristine();
  }

  resetForm() {
    const p = this.profile();
    if (p) this.applyProfile(p);
  }

  submit() {
    if (this.form.invalid || this.form.pristine) return;

    const v = this.form.getRawValue();
    const bp = v.bloodPressure;
    const hasBp = bp.systolic !== null && bp.diastolic !== null && !!bp.period;

    const payload: ProfileUpdate = {
      name: v.name.trim(),
      heightCm: v.heightCm,
      weightKg: v.weightKg,
      bloodPressure: hasBp
        ? { systolic: bp.systolic!, diastolic: bp.diastolic!, period: bp.period! }
        : null,
    };

    this.saving.set(true);
    this.api
      .update(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (p) => {
          this.applyProfile(p);
          this.snackBar.open('Profile saved', 'Close', { duration: 2500 });
        },
      });
  }

  hasUnsavedChanges() {
    return this.form.dirty;
  }
}
