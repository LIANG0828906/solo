export interface AdVersion {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  history: HistoryEntry[];
  createdAt: number;
  updatedAt: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  snapshot: {
    title: string;
    description: string;
    imageUrl: string;
    ctaText: string;
    ctaLink: string;
  };
  note?: string;
}

export interface VersionMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cvr: number;
}

export interface MetricsHistoryPoint {
  timestamp: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cvr: number;
}

export interface Experiment {
  id: string;
  versionIds: string[];
  trafficAllocation: Record<string, number>;
  startDate: number;
  endDate: number;
  status: 'draft' | 'running' | 'completed';
  metrics: Record<string, VersionMetrics>;
  metricsHistory: Record<string, MetricsHistoryPoint[]>;
  winner?: string;
}

export interface ExperimentConfig {
  versionIds: string[];
  trafficAllocation: Record<string, number>;
  durationHours: number;
}
