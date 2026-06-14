import {
  AppState,
  CheckResult,
  EndpointStats,
  FailureEvent,
  MAX_FAILURE_HISTORY,
  MAX_HISTORY_PER_ENDPOINT,
  MonitoredEndpoint,
  NotificationPermissionState,
  ONE_HOUR_MS,
} from '../engine/types';
import { monitorEngine } from '../engine/monitorEngine';

const STORAGE_KEYS = {
  ENDPOINTS: 'sentinel:endpoints',
  FAILURES: 'sentinel:failures',
  ACTIVE_FAILURES: 'sentinel:activeFailures',
  START_TIME: 'sentinel:startTime',
};

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createInitialState(): AppState {
  let persistedEndpoints: MonitoredEndpoint[] = [];
  let persistedFailures: FailureEvent[] = [];
  let persistedActiveFailures: FailureEvent[] = [];
  let persistedStartTime: number = Date.now();

  try {
    const rawE = localStorage.getItem(STORAGE_KEYS.ENDPOINTS);
    if (rawE) persistedEndpoints = JSON.parse(rawE);
    const rawF = localStorage.getItem(STORAGE_KEYS.FAILURES);
    if (rawF) persistedFailures = JSON.parse(rawF);
    const rawAF = localStorage.getItem(STORAGE_KEYS.ACTIVE_FAILURES);
    if (rawAF) persistedActiveFailures = JSON.parse(rawAF);
    const rawS = localStorage.getItem(STORAGE_KEYS.START_TIME);
    if (rawS) persistedStartTime = parseInt(rawS, 10);
  } catch {
    // ignore parse errors
  }

  const activeFailuresRecord: Record<string, FailureEvent> = {};
  const consecutiveFailuresRecord: Record<string, number> = {};
  for (const f of persistedActiveFailures) {
    if (f && !f.isResolved && f.endpointId) {
      activeFailuresRecord[f.endpointId] = f;
      consecutiveFailuresRecord[f.endpointId] = f.checkResults.length;
    }
  }

  let permission: NotificationPermissionState = 'default';
  if (typeof Notification !== 'undefined') {
    permission = Notification.permission as NotificationPermissionState;
  }

  return {
    endpoints: persistedEndpoints,
    latestResults: {},
    resultHistory: {},
    consecutiveFailures: consecutiveFailuresRecord,
    activeFailures: activeFailuresRecord,
    failureHistory: persistedFailures,
    notificationPermission: permission,
    monitoringStartTime: persistedStartTime,
  };
}

type StateSubscriber = (state: AppState) => void;

class AppStore {
  private state: AppState;
  private subscribers: Set<StateSubscriber> = new Set();
  private pendingBatch: ReturnType<typeof setTimeout> | null = null;
  private batchWindowMs = 50;

  constructor() {
    this.state = createInitialState();
    monitorEngine.setOnResultCallback((result) => {
      this.publishCheckResult(result);
    });
  }

  private persistEndpoints(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ENDPOINTS, JSON.stringify(this.state.endpoints));
    } catch {
      // ignore quota errors
    }
  }

  private persistFailures(): void {
    try {
      const capped = this.state.failureHistory.slice(-MAX_FAILURE_HISTORY);
      localStorage.setItem(STORAGE_KEYS.FAILURES, JSON.stringify(capped));
    } catch {
      // ignore
    }
  }

  private persistActiveFailures(): void {
    try {
      const list = Object.values(this.state.activeFailures);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_FAILURES, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  private persistStartTime(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.START_TIME, String(this.state.monitoringStartTime));
    } catch {
      // ignore
    }
  }

  private notifySubscribers(): void {
    const snapshot = this.snapshot();
    for (const sub of this.subscribers) {
      try {
        sub(snapshot);
      } catch {
        // swallow subscriber errors
      }
    }
  }

  private scheduleNotify(): void {
    if (this.pendingBatch !== null) return;
    this.pendingBatch = setTimeout(() => {
      this.pendingBatch = null;
      this.notifySubscribers();
    }, this.batchWindowMs);
  }

  private immediateNotify(): void {
    if (this.pendingBatch !== null) {
      clearTimeout(this.pendingBatch);
      this.pendingBatch = null;
    }
    this.notifySubscribers();
  }

  snapshot(): AppState {
    return {
      endpoints: this.state.endpoints,
      latestResults: { ...this.state.latestResults },
      resultHistory: { ...this.state.resultHistory },
      consecutiveFailures: { ...this.state.consecutiveFailures },
      activeFailures: { ...this.state.activeFailures },
      failureHistory: this.state.failureHistory,
      notificationPermission: this.state.notificationPermission,
      monitoringStartTime: this.state.monitoringStartTime,
    };
  }

  subscribe(callback: StateSubscriber): () => void {
    this.subscribers.add(callback);
    queueMicrotask(() => callback(this.snapshot()));
    return () => {
      this.unsubscribe(callback);
    };
  }

  unsubscribe(callback: StateSubscriber): void {
    this.subscribers.delete(callback);
  }

  startAll(): void {
    for (const ep of this.state.endpoints) {
      monitorEngine.registerEndpoint(ep);
    }
  }

  publishCheckResult(result: CheckResult): void {
    const { endpointId } = result;
    const endpoint = this.state.endpoints.find((e) => e.id === endpointId);
    if (!endpoint) return;

    this.state.latestResults[endpointId] = result;

    if (!this.state.resultHistory[endpointId]) {
      this.state.resultHistory[endpointId] = [];
    }
    const history = this.state.resultHistory[endpointId];
    const cutoff = Date.now() - ONE_HOUR_MS;
    while (history.length > 0 && history[0].timestamp < cutoff) {
      history.shift();
    }
    history.push(result);
    if (history.length > MAX_HISTORY_PER_ENDPOINT) {
      history.splice(0, history.length - MAX_HISTORY_PER_ENDPOINT);
    }

    const prevCount = this.state.consecutiveFailures[endpointId] ?? 0;
    const activeFailure = this.state.activeFailures[endpointId];

    if (result.isSuccess) {
      this.state.consecutiveFailures[endpointId] = 0;
      if (activeFailure) {
        activeFailure.endTime = result.timestamp;
        activeFailure.duration = result.timestamp - activeFailure.startTime;
        activeFailure.isResolved = true;
        activeFailure.checkResults.push(result);
        this.state.failureHistory.push(activeFailure);
        delete this.state.activeFailures[endpointId];
        this.persistFailures();
        this.persistActiveFailures();
      }
    } else {
      const newCount = prevCount + 1;
      this.state.consecutiveFailures[endpointId] = newCount;

      if (activeFailure) {
        activeFailure.checkResults.push(result);
        this.persistActiveFailures();
      } else if (newCount >= endpoint.failureThreshold) {
        const failure: FailureEvent = {
          id: generateId(),
          endpointId,
          startTime: result.timestamp - (endpoint.failureThreshold - 1) * endpoint.interval * 1000,
          endTime: null,
          duration: null,
          checkResults: [result],
          isResolved: false,
        };
        this.state.activeFailures[endpointId] = failure;
        this.persistActiveFailures();
        this.sendFailureNotification(endpoint, failure, result);
      }
    }

    this.scheduleNotify();
  }

  private sendFailureNotification(
    endpoint: MonitoredEndpoint,
    failure: FailureEvent,
    latest: CheckResult,
  ): void {
    if (typeof Notification === 'undefined') return;
    if (this.state.notificationPermission !== 'granted') return;

    try {
      const startTimeStr = new Date(failure.startTime).toLocaleString('zh-CN');
      const body =
        `故障开始：${startTimeStr}\n` +
        `最近错误：${latest.errorMessage || `状态码 ${latest.statusCode ?? 'N/A'}`}`;

      const notification = new Notification(`⚠️ ${endpoint.name} 服务异常`, {
        body,
        tag: `sentinel-${endpoint.id}`,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (location.hash !== '#/dashboard' && location.hash !== '#/') {
          location.hash = '#/dashboard';
        }
      };
    } catch {
      // ignore notification errors
    }
  }

  addEndpoint(endpoint: Omit<MonitoredEndpoint, 'id' | 'createdAt'>): MonitoredEndpoint {
    const full: MonitoredEndpoint = {
      ...endpoint,
      id: generateId(),
      createdAt: Date.now(),
    };
    this.state.endpoints.push(full);
    this.persistEndpoints();
    monitorEngine.registerEndpoint(full);
    this.immediateNotify();
    return full;
  }

  updateEndpoint(id: string, patch: Partial<MonitoredEndpoint>): MonitoredEndpoint | null {
    const idx = this.state.endpoints.findIndex((e) => e.id === id);
    if (idx === -1) return null;

    const updated: MonitoredEndpoint = { ...this.state.endpoints[idx], ...patch };
    this.state.endpoints[idx] = updated;
    this.persistEndpoints();

    monitorEngine.unregisterEndpoint(id);
    monitorEngine.registerEndpoint(updated);

    delete this.state.latestResults[id];
    delete this.state.resultHistory[id];
    delete this.state.consecutiveFailures[id];
    if (this.state.activeFailures[id]) {
      const f = this.state.activeFailures[id];
      f.endTime = Date.now();
      f.duration = f.endTime - f.startTime;
      f.isResolved = true;
      this.state.failureHistory.push(f);
      delete this.state.activeFailures[id];
      this.persistFailures();
    }

    this.immediateNotify();
    return updated;
  }

  removeEndpoint(id: string): boolean {
    const idx = this.state.endpoints.findIndex((e) => e.id === id);
    if (idx === -1) return false;

    this.state.endpoints.splice(idx, 1);
    monitorEngine.unregisterEndpoint(id);

    delete this.state.latestResults[id];
    delete this.state.resultHistory[id];
    delete this.state.consecutiveFailures[id];

    if (this.state.activeFailures[id]) {
      const f = this.state.activeFailures[id];
      f.endTime = Date.now();
      f.duration = f.endTime - f.startTime;
      f.isResolved = true;
      this.state.failureHistory.push(f);
      delete this.state.activeFailures[id];
      this.persistFailures();
    }

    this.persistEndpoints();
    this.immediateNotify();
    return true;
  }

  triggerManualCheck(endpointId: string): void {
    const ep = this.state.endpoints.find((e) => e.id === endpointId);
    if (ep) monitorEngine.triggerImmediateCheck(ep);
  }

  async requestNotificationPermission(): Promise<NotificationPermissionState> {
    if (typeof Notification === 'undefined') {
      this.state.notificationPermission = 'denied';
      this.immediateNotify();
      return 'denied';
    }
    try {
      const result = (await Notification.requestPermission()) as NotificationPermissionState;
      this.state.notificationPermission = result;
      this.immediateNotify();
      return result;
    } catch {
      this.state.notificationPermission = 'denied';
      this.immediateNotify();
      return 'denied';
    }
  }

  exportConfig(): string {
    const data = {
      version: 1,
      exportedAt: Date.now(),
      endpoints: this.state.endpoints.map(({ id, createdAt, ...rest }) => rest),
    };
    return JSON.stringify(data, null, 2);
  }

  importConfig(json: string): { success: boolean; count: number; errors: string[] } {
    const errors: string[] = [];
    let count = 0;

    try {
      const parsed = JSON.parse(json);
      const endpointsRaw = Array.isArray(parsed) ? parsed : parsed.endpoints;
      if (!Array.isArray(endpointsRaw)) {
        return { success: false, count: 0, errors: ['JSON 格式无效：缺少 endpoints 数组'] };
      }

      for (const idx in endpointsRaw) {
        const raw = endpointsRaw[idx];
        if (!raw || typeof raw.url !== 'string') {
          errors.push(`第 ${Number(idx) + 1} 条：缺少有效 url`);
          continue;
        }
        try {
          const name =
            typeof raw.name === 'string' && raw.name.trim()
              ? raw.name.trim()
              : extractNameFromUrl(raw.url);
          this.addEndpoint({
            name,
            url: raw.url.trim(),
            interval: clampInt(raw.interval, 5, 3600 * 24, 60),
            timeout: clampInt(raw.timeout, 1, 120, 10),
            expectedStatuses: Array.isArray(raw.expectedStatuses)
              ? raw.expectedStatuses.filter((n: unknown) => typeof n === 'number')
              : [200],
            failureThreshold: clampInt(raw.failureThreshold, 1, 20, 3),
          });
          count += 1;
        } catch (e) {
          errors.push(`第 ${Number(idx) + 1} 条：${e instanceof Error ? e.message : '未知错误'}`);
        }
      }
    } catch (e) {
      return {
        success: false,
        count: 0,
        errors: [`JSON 解析失败：${e instanceof Error ? e.message : '格式错误'}`],
      };
    }

    return { success: count > 0 || errors.length === 0, count, errors };
  }

  computeEndpointStats(endpointId: string): EndpointStats {
    const history = this.state.resultHistory[endpointId] ?? [];
    const totalChecks = history.length;
    if (totalChecks === 0) {
      return { endpointId, availabilityRate: 100, avgLatency: 0, totalChecks: 0, failureCount: 0 };
    }
    let successCount = 0;
    let latencySum = 0;
    for (const r of history) {
      if (r.isSuccess) successCount += 1;
      latencySum += r.latency;
    }
    const failureCount = this.state.failureHistory.filter((f) => f.endpointId === endpointId).length;
    return {
      endpointId,
      availabilityRate: Math.round((successCount / totalChecks) * 10000) / 100,
      avgLatency: Math.round(latencySum / totalChecks),
      totalChecks,
      failureCount,
    };
  }

  computeGlobalStats() {
    const allFailures = [
      ...this.state.failureHistory,
      ...Object.values(this.state.activeFailures),
    ];
    const activeDownCount = Object.keys(this.state.activeFailures).length;

    let totalAvailabilitySamples = 0;
    let totalSuccessSamples = 0;
    for (const ep of this.state.endpoints) {
      const stats = this.computeEndpointStats(ep.id);
      totalAvailabilitySamples += stats.totalChecks;
      totalSuccessSamples += Math.round((stats.availabilityRate / 100) * stats.totalChecks);
    }

    const todayAvailability =
      totalAvailabilitySamples === 0
        ? 100
        : Math.round((totalSuccessSamples / totalAvailabilitySamples) * 10000) / 100;

    const totalMonitoringMs = Date.now() - this.state.monitoringStartTime;

    return {
      totalEndpoints: this.state.endpoints.length,
      activeDownCount,
      todayAvailability,
      totalFailureCount: allFailures.length,
      totalMonitoringMs,
    };
  }
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const n = Math.round(value);
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

export function extractNameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const path = u.pathname.replace(/\/+$/, '');
    if (path && path !== '/') {
      const lastSegment = path.split('/').pop() || '';
      if (lastSegment) return `${host}/${lastSegment}`;
    }
    return host;
  } catch {
    return url.slice(0, 40);
  }
}

export const appStore = new AppStore();
