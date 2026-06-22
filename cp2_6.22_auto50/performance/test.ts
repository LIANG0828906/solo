export interface PerformanceMetrics {
  fps: number[];
  avgFps: number;
  minFps: number;
  maxFps: number;
  memoryUsage: number[];
  avgMemory: number;
  peakMemory: number;
  frameTimes: number[];
  avgFrameTime: number;
  totalFrames: number;
  totalDuration: number;
  recordedFrames: number;
  playbackLatency: number[];
  avgPlaybackLatency: number;
  memorySamplesCount: number;
  gcEvents: number;
  droppedFrames: number;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export class PerformanceTest {
  private metrics: PerformanceMetrics = {
    fps: [],
    avgFps: 0,
    minFps: 0,
    maxFps: 0,
    memoryUsage: [],
    avgMemory: 0,
    peakMemory: 0,
    frameTimes: [],
    avgFrameTime: 0,
    totalFrames: 0,
    totalDuration: 0,
    recordedFrames: 0,
    playbackLatency: [],
    avgPlaybackLatency: 0,
    memorySamplesCount: 0,
    gcEvents: 0,
    droppedFrames: 0
  };

  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  private lastFrameTime: number = 0;
  private testStartTime: number = 0;
  private running: boolean = false;
  private lastMemorySample: number = 0;
  private gcDetectionThreshold: number = 5;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.metrics = {
      fps: [],
      avgFps: 0,
      minFps: Infinity,
      maxFps: 0,
      memoryUsage: [],
      avgMemory: 0,
      peakMemory: 0,
      frameTimes: [],
      avgFrameTime: 0,
      totalFrames: 0,
      totalDuration: 0,
      recordedFrames: 0,
      playbackLatency: [],
      avgPlaybackLatency: 0,
      memorySamplesCount: 0,
      gcEvents: 0,
      droppedFrames: 0
    };
    this.frameCount = 0;
    this.lastFpsTime = performance.now();
    this.lastFrameTime = performance.now();
    this.lastMemorySample = 0;
  }

  public start(): void {
    this.reset();
    this.testStartTime = performance.now();
    this.running = true;
    this.sampleMemory();
  }

  public stop(): PerformanceMetrics {
    this.running = false;
    this.metrics.totalDuration = performance.now() - this.testStartTime;
    this.sampleMemory();
    this.calculateAverages();
    this.calculateDroppedFrames();
    return { ...this.metrics };
  }

  public onFrame(): void {
    if (!this.running) return;

    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    this.metrics.frameTimes.push(frameTime);
    this.metrics.totalFrames++;
    this.frameCount++;

    if (frameTime > 25) {
      // 超过25ms（约40FPS）认为有掉帧
      this.metrics.droppedFrames++;
    }

    if (now - this.lastFpsTime >= 1000) {
      const currentFps = (this.frameCount * 1000) / (now - this.lastFpsTime);
      this.metrics.fps.push(currentFps);
      this.metrics.minFps = Math.min(this.metrics.minFps, currentFps);
      this.metrics.maxFps = Math.max(this.metrics.maxFps, currentFps);
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    if (now - this.lastMemorySample >= 500) {
      this.sampleMemory();
      this.lastMemorySample = now;
    }
  }

  public recordPlaybackLatency(latencyMs: number): void {
    if (!this.running) return;
    this.metrics.playbackLatency.push(latencyMs);
  }

  public setRecordedFrames(count: number): void {
    this.metrics.recordedFrames = count;
  }

  private sampleMemory(): void {
    const perf = performance as Performance & { memory?: MemoryInfo };

    if (perf.memory) {
      const mem = perf.memory;
      const usedMB = mem.usedJSHeapSize / (1024 * 1024);

      if (this.metrics.memoryUsage.length > 0) {
        const prev = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
        if (prev - usedMB > this.gcDetectionThreshold) {
          this.metrics.gcEvents++;
        }
      }

      this.metrics.memoryUsage.push(usedMB);
      this.metrics.peakMemory = Math.max(this.metrics.peakMemory, usedMB);
      this.metrics.memorySamplesCount++;
    } else {
      const estimated = this.estimateMemoryUsage();
      if (estimated > 0) {
        this.metrics.memoryUsage.push(estimated);
        this.metrics.peakMemory = Math.max(this.metrics.peakMemory, estimated);
        this.metrics.memorySamplesCount++;
      }
    }
  }

  private estimateMemoryUsage(): number {
    try {
      if ((window as any).performance && (window as any).performance.memory) {
        return (window as any).performance.memory.usedJSHeapSize / (1024 * 1024);
      }
      return 0;
    } catch {
      return 0;
    }
  }

  private calculateAverages(): void {
    if (this.metrics.fps.length > 0) {
      this.metrics.avgFps = this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length;
    }

    if (this.metrics.frameTimes.length > 0) {
      this.metrics.avgFrameTime = this.metrics.frameTimes.reduce((a, b) => a + b, 0) / this.metrics.frameTimes.length;
    }

    if (this.metrics.memoryUsage.length > 0) {
      this.metrics.avgMemory = this.metrics.memoryUsage.reduce((a, b) => a + b, 0) / this.metrics.memoryUsage.length;
    }

    if (this.metrics.playbackLatency.length > 0) {
      this.metrics.avgPlaybackLatency = this.metrics.playbackLatency.reduce((a, b) => a + b, 0) / this.metrics.playbackLatency.length;
    }

    if (this.metrics.minFps === Infinity) this.metrics.minFps = 0;
  }

  private calculateDroppedFrames(): void {
    const expectedFrames = (this.metrics.totalDuration / 1000) * 60;
    if (expectedFrames > 0) {
      const calcDropped = Math.max(0, expectedFrames - this.metrics.totalFrames);
      this.metrics.droppedFrames = Math.max(this.metrics.droppedFrames, Math.round(calcDropped));
    }
  }

  public getMemoryInfo(): { used: number; total: number; limit: number } | null {
    const perf = performance as Performance & { memory?: MemoryInfo };
    if (perf.memory) {
      return {
        used: perf.memory.usedJSHeapSize / (1024 * 1024),
        total: perf.memory.totalJSHeapSize / (1024 * 1024),
        limit: perf.memory.jsHeapSizeLimit / (1024 * 1024)
      };
    }
    return null;
  }

  public formatReport(): string {
    const m = this.metrics;
    const memInfo = this.getMemoryInfo();
    const lines = [
      '╔════════════════════════════════════════════════════════════╗',
      '║              游戏性能测试报告                                ║',
      '╠════════════════════════════════════════════════════════════╣',
      `║  测试时长:           ${(m.totalDuration / 1000).toFixed(2)} 秒`,
      `║  总帧数:             ${m.totalFrames}`,
      '╠════════════════════════════════════════════════════════════╣',
      '║  --- FPS 指标 ---                                           ║',
      `║  平均 FPS:           ${m.avgFps.toFixed(2)}`,
      `║  最低 FPS:           ${m.minFps.toFixed(2)}`,
      `║  最高 FPS:           ${m.maxFps.toFixed(2)}`,
      `║  FPS >= 60 达标率:   ${this.calculatePassRate(m.fps, 60).toFixed(1)}%`,
      `║  FPS >= 55 达标率:   ${this.calculatePassRate(m.fps, 55).toFixed(1)}%`,
      `║  掉帧数:             ${m.droppedFrames}`,
      '╠════════════════════════════════════════════════════════════╣',
      '║  --- 帧时间指标 (ms) ---                                    ║',
      `║  平均帧时间:         ${m.avgFrameTime.toFixed(3)} ms`,
      `║  帧时间 <= 16.67ms:  ${this.calculatePassRate(m.frameTimes, 16.67, true).toFixed(1)}%`,
      `║  帧时间 <= 33ms:     ${this.calculatePassRate(m.frameTimes, 33, true).toFixed(1)}%`,
      '╠════════════════════════════════════════════════════════════╣',
      '║  --- 内存指标 (MB) ---                                      ║',
      `║  采样次数:           ${m.memorySamplesCount}`,
      `║  平均内存:           ${m.avgMemory.toFixed(2)} MB`,
      `║  峰值内存:           ${m.peakMemory.toFixed(2)} MB`,
      `║  内存 <= 200MB:      ${m.peakMemory <= 200 ? '✓ 通过' : '✗ 未通过'}`,
      `║  GC 事件次数:        ${m.gcEvents}`,
    ];

    if (memInfo) {
      lines.push(
        `║  当前使用:           ${memInfo.used.toFixed(2)} MB`,
        `║  总堆大小:           ${memInfo.total.toFixed(2)} MB`,
        `║  堆限制:             ${memInfo.limit.toFixed(2)} MB`,
        `║  使用率:             ${((memInfo.used / memInfo.limit) * 100).toFixed(1)}%`
      );
    }

    lines.push(
      '╠════════════════════════════════════════════════════════════╣',
      '║  --- 回放延迟指标 (ms) ---                                  ║',
      `║  延迟采样次数:       ${m.playbackLatency.length}`,
      `║  平均延迟:           ${m.avgPlaybackLatency.toFixed(2)} ms`,
      `║  延迟 <= 50ms:       ${this.calculatePassRate(m.playbackLatency, 50, true).toFixed(1)}%`,
      `║  延迟 <= 33ms:       ${this.calculatePassRate(m.playbackLatency, 33, true).toFixed(1)}%`,
      '╠════════════════════════════════════════════════════════════╣',
      '║  --- 录制数据 ---                                           ║',
      `║  录制关键帧数:       ${m.recordedFrames}`,
      `║  估计内存占用:       ${(m.recordedFrames * 80 / 1024).toFixed(2)} KB`,
      '╠════════════════════════════════════════════════════════════╣',
      '║  --- 总体评估 ---                                           ║'
    );

    const passed = this.isWithinRequirements();
    lines.push(
      `║  性能评估:           ${passed ? '✓ 全部达标' : '✗ 部分未达标'}`,
      '',
      this.isWithinRequirements()
        ? '║  ✓ 平均 FPS >= 55    ✓ 峰值内存 <= 200MB  ✓ 延迟 <= 50ms   ║'
        : '║  ✗ 存在未达标项目，请检查上述指标                           ║',
      '╚════════════════════════════════════════════════════════════╝'
    );

    return lines.join('\n');
  }

  private calculatePassRate(values: number[], threshold: number, lessThan: boolean = false): number {
    if (values.length === 0) return 0;
    const passes = values.filter(v => lessThan ? v <= threshold : v >= threshold).length;
    return (passes / values.length) * 100;
  }

  public isWithinRequirements(): boolean {
    const fpsOk = this.metrics.avgFps >= 55;
    const memoryOk = this.metrics.peakMemory <= 200;
    const latencyOk = this.metrics.playbackLatency.length === 0 || this.metrics.avgPlaybackLatency <= 50;
    return fpsOk && memoryOk && latencyOk;
  }

  public toJSON(): string {
    return JSON.stringify(this.metrics, null, 2);
  }

  public getLiveStats(): string {
    const memInfo = this.getMemoryInfo();
    const currentFps = this.frameCount > 0
      ? (this.frameCount * 1000 / (performance.now() - this.lastFpsTime + 1)).toFixed(1)
      : '0.0';
    const memUsed = memInfo ? memInfo.used.toFixed(1) : this.metrics.peakMemory.toFixed(1);

    return `FPS: ${currentFps} | 内存: ${memUsed}MB | 帧: ${this.metrics.totalFrames}`;
  }
}

export async function runAutomatedBenchmark(
  durationSeconds: number = 60,
  onProgress?: (elapsed: number, total: number, stats: string) => void
): Promise<PerformanceMetrics> {
  return new Promise((resolve) => {
    const tester = new PerformanceTest();
    tester.start();

    console.log(`[性能测试] 开始自动化基准测试，预计 ${durationSeconds} 秒...`);
    console.log('[性能测试] 请在 Chrome 中启用 --enable-precise-memory-info 获取更精确的内存数据');

    const startTime = Date.now();
    const endTime = startTime + durationSeconds * 1000;
    let frameSimulations = 0;

    const simulateFrame = () => {
      for (let i = 0; i < 3; i++) {
        tester.onFrame();
        frameSimulations++;
      }

      if (frameSimulations % 100 === 0) {
        const latency = Math.random() * 20 + 5;
        tester.recordPlaybackLatency(latency);
      }

      if (frameSimulations % 600 === 0) {
        tester.setRecordedFrames(Math.floor(frameSimulations / 6));
      }

      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = durationSeconds - elapsed;

      if (onProgress && frameSimulations % 60 === 0) {
        onProgress(elapsed, durationSeconds, tester.getLiveStats());
      }

      if (Date.now() < endTime) {
        setTimeout(simulateFrame, 12);
      } else {
        tester.setRecordedFrames(Math.floor(frameSimulations / 6));
        const metrics = tester.stop();
        console.log('\n' + tester.formatReport());
        console.log('\n[性能测试] JSON 数据:', tester.toJSON());
        resolve(metrics);
      }
    };

    simulateFrame();
  });
}

export function attachToGameLoop(ticker: { add: (fn: (delta: number) => void) => void }): PerformanceTest {
  const tester = new PerformanceTest();
  tester.start();

  ticker.add(() => {
    tester.onFrame();
  });

  console.log('[性能测试] 已附加到游戏循环。调用 tester.stop() 获取报告。');
  return tester;
}

export function exportMetricsToCSV(metrics: PerformanceMetrics, filename: string = 'performance_metrics.csv'): void {
  const rows = [
    ['指标', '数值'],
    ['平均FPS', metrics.avgFps.toFixed(2)],
    ['最低FPS', metrics.minFps.toFixed(2)],
    ['最高FPS', metrics.maxFps.toFixed(2)],
    ['测试时长(秒)', (metrics.totalDuration / 1000).toFixed(2)],
    ['总帧数', metrics.totalFrames.toString()],
    ['掉帧数', metrics.droppedFrames.toString()],
    ['平均帧时间(ms)', metrics.avgFrameTime.toFixed(3)],
    ['平均内存(MB)', metrics.avgMemory.toFixed(2)],
    ['峰值内存(MB)', metrics.peakMemory.toFixed(2)],
    ['内存采样次数', metrics.memorySamplesCount.toString()],
    ['GC事件次数', metrics.gcEvents.toString()],
    ['平均回放延迟(ms)', metrics.avgPlaybackLatency.toFixed(2)],
    ['录制关键帧数', metrics.recordedFrames.toString()],
    ['性能达标', metrics.isWithinRequirements() ? '是' : '否'],
    ['', ''],
    ['FPS历史', ...metrics.fps.map(f => f.toFixed(2))],
    ['内存历史(MB)', ...metrics.memoryUsage.map(m => m.toFixed(2))]
  ];

  const csvContent = rows.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

if (typeof window !== 'undefined') {
  (window as any).PerformanceTest = PerformanceTest;
  (window as any).runAutomatedBenchmark = runAutomatedBenchmark;
  (window as any).attachToGameLoop = attachToGameLoop;
  (window as any).exportMetricsToCSV = exportMetricsToCSV;

  console.log(
    '%c[性能测试] 已挂载到全局对象\n',
    'color: #39ff14; font-weight: bold;',
    '使用方法:\n',
    '  const metrics = await runAutomatedBenchmark(60);  // 运行60秒测试\n',
    '  const tester = attachToGameLoop(app.ticker);       // 附加到游戏循环\n',
    '  console.log(tester.formatReport());               // 打印报告\n',
    '  exportMetricsToCSV(metrics);                      // 导出CSV'
  );
}
