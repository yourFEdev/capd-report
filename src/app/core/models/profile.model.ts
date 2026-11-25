export type BloodPressurePeriod = 'Morning' | 'Noon' | 'Afternoon' | 'Evening';

export interface BloodPressure {
  systolic: number;
  diastolic: number;
  period: BloodPressurePeriod;
}

export interface ProfileModel {
  name: string;
  heightCm: number | null;
  weightKg: number | null;
  bloodPressure: BloodPressure | null;
}

export type ProfileUpdate = ProfileModel;
