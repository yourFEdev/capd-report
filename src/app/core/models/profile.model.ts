export type BloodPressurePeriod = 'Pagi' | 'Siang' | 'Sore' | 'Malam';

export interface BloodPressure {
  systolic: number;
  diastolic: number;
  period: BloodPressurePeriod;
  date: string;
}

export interface ExchangeSchedule {
  cycle: number;
  time: string;
}

export interface ProfileModel {
  id: string;
  username: string;
  name: string;
  role: string;
  heightCm: number | null;
  weightKg: number | null;
  weightDate: string | null;
  bloodPressure: BloodPressure | null;
  exchangeSchedule: ExchangeSchedule[];
  targetBalance: number;
}

export type ProfileUpdate = Omit<ProfileModel, 'id' | 'username' | 'role'>;
