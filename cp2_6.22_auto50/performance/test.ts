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
    avgPlaybackLatency: 0
  };

  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  private lastFrameTime: number = 0;
  private testStartTime: number = 0;
  private running: boolean = false;

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
      avgPlaybackLatency: 0
    };
    this.frameCount = 0;
    this.lastFpsTime = performance.now();
    this.lastFrameTime = performance.now();
  }

  public start(): void {
    this.reset();
    this.testStartTime = performance.now();
    this.running = true;
  }

  public stop(): PerformanceMetrics {
    this.running = false;
    this.metrics.totalDuration = performance.now() - this.testStartTime;
    this.calculateAverages();
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

    if (now - this.lastFpsTime >= 1000) {
      const currentFps = this.frameCount * 1000 / (now - this.lastFpsTime);
      this.metrics.fps.push(currentFps);
      this.metrics.minFps = Math.min(this.metrics.minFps, currentFps);
      this.metrics.maxFps = Math.max(this.metrics.maxFps, currentFps);
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    if (this.metrics.totalFrames % 60 === 0) {
      const mem = this.getMemoryUsage();
      if (mem > 0) {
        this.metrics.memoryUsage.push(mem);
        this.metrics.peakMemory = Math.max(this.metrics.peakMemory, mem);
      }
    }
  }

  public recordPlaybackLatency(latencyMs: number): void {
    this.metrics.playbackLatency.push(latencyMs);
  }

  public setRecordedFrames(count: number): void {
    this.metrics.recordedFrames = count;
  }

  private getMemoryUsage(): number {
    if ((performance as any).memory) {
      const mem = (performance as any).memory;
      return mem.usedJSHeapSize / (1024 * 1024);
    }
    return 0;
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

  public formatReport(): string {
    const m = this.metrics;
    const lines = [
      '======== 性能测试报告 ========',
      `测试时长: ${(m.totalDuration / 1000).toFixed(2)} 秒`,
      `总帧数: ${m.totalFrames}`,
      '',
      '--- FPS ---',
      `平均 FPS: ${m.avgFps.toFixed(2)}`,
      `最低 FPS: ${m.minFps.toFixed(2)}`,
      `最高 FPS: ${m.maxFps.toFixed(2)}`,
      `FPS 达标率 (>=60): ${this.calculatePassRate(m.fps, 60).toFixed(1)}%`,
      '',
      '--- 帧时间 ---',
      `平均帧时间: ${m.avgFrameTime.toFixed(2)} ms`,
      `帧时间达标率 (<=16.67ms): ${this.calculatePassRate(m.frameTimes, 16.67, true).toFixed(1)}%`,
      '',
      '--- 内存 (MB) ---',
      `平均内存: ${m.avgMemory.toFixed(2)}`,
      `峰值内存: ${m.peakMemory.toFixed(2)}`,
      `内存限制 (<=200MB): ${m.peakMemory <= 200 ? '✓ 通过' : '✗ 未通过'}`,
      '',
      '--- 回放延迟 ---',
      `采样次数: ${m.playbackLatency.length}`,
      `平均延迟: ${m.avgPlaybackLatency.toFixed(2)} ms`,
      `延迟达标率 (<=50ms): ${this.calculatePassRate(m.playbackLatency, 50, true).toFixed(1)}%`,
      '',
      '--- 录制数据 ---',
      `录制帧数: ${m.recordedFrames}`,
      `估计内存占用: ${(m.recordedFrames * 64 / 1024).toFixed(2)} KB`,
      '==============================='
    ];
    return lines.join('\n');
  }

  private calculatePassRate(values: number[], threshold: number, lessThan: boolean = false): number {
    if (values.length === 0) return 0;
    const passes = values.filter(v => lessThan ? v <= threshold : v >= threshold).length;
    return (passes / values.length) * 100;
  }

  public isWithinRequirements(): boolean {
    return (
      this.metrics.avgFps >= 55 &&
      this.metrics.peakMemory <= 200 &&
      this.metrics.avgPlaybackLatency <= 50
    );
  }
}

export function runAutomatedTest(durationSeconds: number = 60): Promise<PerformanceMetrics> {
  return new Promise((resolve) => {
    const tester = new PerformanceTest();
    tester.start();

    console.log(`开始性能测试，预计 ${durationSeconds} 秒...`);

    const testInterval = setInterval(() => {
      for (let i = 0; i < 60; i++) {
        tester.onFrame();
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(testInterval);
      const metrics = tester.stop();
      console.log(tester.formatReport());
      resolve(metrics);
    }, durationSeconds * 1000);
  });
}
