import type { MonitoredEndpoint, CheckResult } from './types';

export class MonitorEngine {
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private aborters: Map<string, AbortController> = new Map();
  private initialDelays: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private onResultCallback: ((result: CheckResult) => void) | null = null;
  private running: Set<string> = new Set();

  setOnResultCallback(cb: (result: CheckResult) => void): void {
    this.onResultCallback = cb;
  }

  registerEndpoint(endpoint: MonitoredEndpoint): void {
    if (this.timers.has(endpoint.id)) {
      this.unregisterEndpoint(endpoint.id);
    }

    const jitter = Math.floor(Math.random() * 500);

    const initialTimer = setTimeout(() => {
      this.scheduleCheck(endpoint);
      this.checkOnceAsync(endpoint);
    }, jitter);

    this.initialDelays.set(endpoint.id, initialTimer);
  }

  unregisterEndpoint(id: string): void {
    const initialTimer = this.initialDelays.get(id);
    if (initialTimer !== undefined) {
      clearTimeout(initialTimer);
      this.initialDelays.delete(id);
    }

    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearInterval(timer);
      this.timers.delete(id);
    }

    const aborter = this.aborters.get(id);
    if (aborter !== undefined) {
      aborter.abort();
      this.aborters.delete(id);
    }

    this.running.delete(id);
  }

  private scheduleCheck(endpoint: MonitoredEndpoint): void {
    const intervalMs = endpoint.interval * 1000;
    const timer = setInterval(() => {
      setTimeout(() => {
        this.checkOnceAsync(endpoint);
      }, 0);
    }, intervalMs);
    this.timers.set(endpoint.id, timer);
  }

  private async checkOnceAsync(endpoint: MonitoredEndpoint): Promise<void> {
    if (this.running.has(endpoint.id)) return;
    this.running.add(endpoint.id);

    try {
      const result = await this.checkOnce(endpoint);
      if (this.onResultCallback) {
        this.onResultCallback(result);
      }
    } finally {
      this.running.delete(endpoint.id);
    }
  }

  async checkOnce(endpoint: MonitoredEndpoint): Promise<CheckResult> {
    const controller = new AbortController();
    this.aborters.set(endpoint.id, controller);

    const timeoutMs = endpoint.timeout * 1000;
    const timeoutTimer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    const startTime = performance.now();
    let statusCode: number | null = null;
    let isTimeout = false;
    let isSuccess = false;
    let errorMessage: string | undefined;

    try {
      const response = await fetch(endpoint.url, {
        signal: controller.signal,
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
      });

      statusCode = response.status || 0;
      isSuccess = endpoint.expectedStatuses.includes(statusCode);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        isTimeout = true;
        errorMessage = `请求超时（超过 ${endpoint.timeout}s）`;
      } else if (err instanceof TypeError) {
        errorMessage = '网络错误或 CORS 限制';
        statusCode = null;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else {
        errorMessage = '未知错误';
      }
      isSuccess = false;
    } finally {
      clearTimeout(timeoutTimer);
      this.aborters.delete(endpoint.id);
    }

    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    if (statusCode === 0 && !isTimeout && !errorMessage) {
      isSuccess = endpoint.expectedStatuses.includes(200) || endpoint.expectedStatuses.includes(0);
      if (!isSuccess && errorMessage === undefined) {
        errorMessage = 'no-cors 模式下无法读取状态码，请确认服务可达';
      }
    }

    return {
      endpointId: endpoint.id,
      timestamp: Date.now(),
      statusCode,
      latency,
      isTimeout,
      isSuccess,
      errorMessage,
    };
  }

  triggerImmediateCheck(endpoint: MonitoredEndpoint): void {
    setTimeout(() => this.checkOnceAsync(endpoint), 0);
  }

  destroy(): void {
    for (const id of Array.from(this.initialDelays.keys())) {
      const t = this.initialDelays.get(id);
      if (t !== undefined) clearTimeout(t);
    }
    this.initialDelays.clear();

    for (const id of Array.from(this.timers.keys())) {
      const t = this.timers.get(id);
      if (t !== undefined) clearInterval(t);
    }
    this.timers.clear();

    for (const id of Array.from(this.aborters.keys())) {
      const c = this.aborters.get(id);
      if (c !== undefined) c.abort();
    }
    this.aborters.clear();

    this.running.clear();
  }
}

export const monitorEngine = new MonitorEngine();
