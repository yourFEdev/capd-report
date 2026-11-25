export interface DashboardAlert {
  type: string;
  cycle: number;
  message: string;
}

export interface BloodPressureSummary {
  systolic: number;
  diastolic: number;
  period: string; // backend mengirim "Morning"
}

export interface DashboardSummary {
  exchangeCompleted: number;
  exchangeTotal: number;
  totalBalance: number;
  targetBalance?: number | null; // opsional: tidak ada di response sekarang
  bloodPressure: BloodPressureSummary | null;
  weightKg: number | null;
}

export interface BalanceBar {
  date: string;
  label: string;
  balance: number;
}

export interface DashboardExchange {
  cycle: number;
  time: string | null;
  concentration: string | null;
  volumeIn: number | null;
  volumeOut: number | null;
  balance: number | null;
  fluidAppearance: string | null;
  status: 'pending' | 'completed';
}

export interface DashboardData {
  date: string;
  alert: DashboardAlert | null;
  summary: DashboardSummary;
  balanceChart: BalanceBar[];
  exchanges: DashboardExchange[];
}
