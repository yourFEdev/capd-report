export type ReportStatus = 'draft' | 'submitted' | 'approved';

export interface ReportCycle {
  id: number;
  cycle: number;
  period: 'Pagi' | 'Siang' | 'Sore' | 'Malam';
  startTime: string;
  concentration: '1.5%' | '2.5%' | '4.25%';
  volumeIn: number;
  volumeOut: number;
  uf: number;
  fluidAppearance: string;
  notes: string;
}

export interface Report {
  id: number;
  title: string;
  description: string;
  date: string;

  cycles: ReportCycle[];

  totalVolumeIn: number;
  totalVolumeOut: number;
  totalUF: number;

  // status: ReportStatus;
  createdAt: string;
}

export type ReportCyclePayload = Omit<ReportCycle, 'id'>;

export type ReportPayload = Omit<Report, 'id' | 'createdAt' | 'cycles'> & {
  cycles: ReportCyclePayload[];
};
