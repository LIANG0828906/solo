export interface MonitoredEndpoint {
  id: string;
  name: string;
  url: string;
  interval: number;
  timeout: number;
  expectedStatuses: number[];
  failureThreshold: number;
  createdAt: number;
}

export interface CheckResult {
  endpointId: string;
  timestamp: number;
  statusCode: number | null;
  latency: number;
  isTimeout: boolean;
  isSuccess: boolean;
  errorMessage?: string;
}

export interface FailureEvent {
  id: string;
  endpointId: string;
  startTime: number;
  endTime: number | null;
  duration: number | null;
  checkResults: CheckResult[];
  isResolved: boolean;
}

export type NotificationPermissionState = 'default' | 'granted' | 'denied';

export type EndpointStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

export interface AppState {
  endpoints: MonitoredEndpoint[];
  latestResults: Record<string, CheckResult>;
  resultHistory: Record<string, CheckResult[]>;
  consecutiveFailures: Record<string, number>;
  activeFailures: Record<string, FailureEvent>;
  failureHistory: FailureEvent[];
  notificationPermission: NotificationPermissionState;
  monitoringStartTime: number;
}

export interface EndpointStats {
  endpointId: string;
  availabilityRate: number;
  avgLatency: number;
  totalChecks: number;
  failureCount: number;
}

export const ONE_HOUR_MS = 60 * 60 * 1000;
export const MAX_HISTORY_PER_ENDPOINT = 3600;
export const MAX_FAILURE_HISTORY = 500;
export const LATENCY_DEGRADATION_THRESHOLD_MS = 2000;
export const LATENCY_CHART_CAP_MS = 5000;
