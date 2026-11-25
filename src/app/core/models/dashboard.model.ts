export interface DashboardAlert {
  type: string;
  cycle: number;
  time: string;
  message: string;
}

export interface DashboardSummary {
  exchangeCompleted: number;
  exchangeTotal: number;
  totalBalance: number;
  targetBalance: number;
  bloodPressure: string | null;
  weight: number | null;
}

export interface BalanceBar {
  date: string;
  label: string;
  balance: number;
}

export interface DashboardExchange {
  cycle: number;
  time: string;
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
