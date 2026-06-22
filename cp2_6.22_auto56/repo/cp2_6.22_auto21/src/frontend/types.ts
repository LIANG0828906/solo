export interface VersionHistory {
  id: string;
  timestamp: number;
  snapshot: Partial<AdVersion>;
  comment: string;
}

export interface AdVersion {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  createdAt: number;
  history: VersionHistory[];
}

export interface AdMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cvr: number;
}

export interface MetricsHistoryPoint {
  timestamp: number;
  metrics: Record<string, AdMetrics>;
}

export interface ExperimentData {
  id: string;
  versions: AdVersion[];
  trafficAllocation: Record<string, number>;
  durationHours: number;
  startTime: number;
  metrics: Record<string, AdMetrics>;
  history: MetricsHistoryPoint[];
  status: 'draft' | 'running' | 'ended';
  winner: string | null;
}
