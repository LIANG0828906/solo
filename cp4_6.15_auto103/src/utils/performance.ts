/**
 * 性能优化工具函数
 * 包含节流、防抖、requestAnimationFrame 批量更新等优化手段
 */

/**
 * 节流函数 - 限制函数在指定时间内最多执行一次
 * 用于滚轮缩放、拖拽等高频事件
 */
export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timerId: number | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = delay - (now - lastTime);

    if (remaining <= 0) {
      if (timerId) {
        cancelAnimationFrame(timerId);
        timerId = null;
      }
      lastTime = now;
      fn.apply(this, args);
    } else if (!timerId) {
      timerId = requestAnimationFrame(() => {
        lastTime = Date.now();
        timerId = null;
        fn.apply(this, args);
      });
    }
  };
}

/**
 * 防抖函数 - 函数在最后一次调用后延迟执行
 * 用于输入框、搜索等需要等待用户停止操作的场景
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timerId: number | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timerId) {
      clearTimeout(timerId);
    }
    timerId = window.setTimeout(() => {
      timerId = null;
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * requestAnimationFrame 批量更新器
 * 用于合并多次状态更新为一次，避免重复渲染
 */
export class RAFBatchUpdater<T = any> {
  private pendingUpdate: Partial<T> | null = null;
  private rafId: number | null = null;
  private applyUpdate: (update: Partial<T>) => void;

  constructor(applyUpdate: (update: Partial<T>) => void) {
    this.applyUpdate = applyUpdate;
  }

  /**
   * 排队更新，同一帧内多次调用会被合并
   */
  queueUpdate(update: Partial<T>): void {
    this.pendingUpdate = { ...this.pendingUpdate, ...update };

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;
        if (this.pendingUpdate) {
          this.applyUpdate(this.pendingUpdate);
          this.pendingUpdate = null;
        }
      });
    }
  }

  /**
   * 取消待处理的更新
   */
  cancel(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pendingUpdate = null;
  }
}

/**
 * 高性能计时器
 * 用于性能测量
 */
export class PerformanceTimer {
  private startTime: number;
  private marks: Map<string, number>;

  constructor() {
    this.startTime = performance.now();
    this.marks = new Map();
  }

  /**
   * 标记时间点
   */
  mark(label: string): void {
    this.marks.set(label, performance.now());
  }

  /**
   * 获取从开始到现在的耗时（毫秒）
   */
  elapsed(): number {
    return performance.now() - this.startTime;
  }

  /**
   * 获取两个标记之间的耗时
   */
  between(startLabel: string, endLabel: string): number | null {
    const start = this.marks.get(startLabel);
    const end = this.marks.get(endLabel);
    if (start === undefined || end === undefined) return null;
    return end - start;
  }

  /**
   * 打印所有时间标记
   */
  print(): void {
    console.group('⏱️ 性能分析');
    console.log(`总耗时: ${this.elapsed().toFixed(2)}ms`);
    this.marks.forEach((time, label) => {
      console.log(`${label}: ${(time - this.startTime).toFixed(2)}ms`);
    });
    console.groupEnd();
  }
}

/**
 * 虚拟滚动计算
 * 用于优化大量图层列表的渲染
 */
export function calculateVirtualRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 3
): { startIndex: number; endIndex: number } {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  return { startIndex, endIndex };
}

/**
 * 测量函数执行时间
 * 装饰器风格的性能测量
 */
export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const timer = new PerformanceTimer();
  try {
    const result = await fn();
    console.log(`⏱️ ${label}: ${timer.elapsed().toFixed(2)}ms`);
    return result;
  } catch (error) {
    console.log(`⏱️ ${label} (失败): ${timer.elapsed().toFixed(2)}ms`);
    throw error;
  }
}

/**
 * 同步版本的性能测量
 */
export function measure<T>(label: string, fn: () => T): T {
  const start = performance.now();
  try {
    const result = fn();
    console.log(`⏱️ ${label}: ${(performance.now() - start).toFixed(2)}ms`);
    return result;
  } catch (error) {
    console.log(`⏱️ ${label} (失败): ${(performance.now() - start).toFixed(2)}ms`);
    throw error;
  }
}

/**
 * 懒加载 IntersectionObserver 包装
 */
export function createLazyLoader(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') {
    console.warn('⚠️ IntersectionObserver 不可用，降级为非懒加载模式');
    return null;
  }

  return new IntersectionObserver(callback, {
    rootMargin: '100px',
    threshold: 0.1,
    ...options,
  });
}

/**
 * 内存使用监控（仅开发环境）
 */
export function monitorMemory(): void {
  if (import.meta.env.DEV && 'memory' in performance) {
    const mem = (performance as any).memory;
    if (mem) {
      const usedMB = Math.round(mem.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(mem.jsHeapSizeLimit / 1024 / 1024);
      const usagePercent = Math.round((usedMB / totalMB) * 100);

      if (usagePercent > 80) {
        console.warn(`⚠️ 内存使用过高: ${usedMB}MB / ${totalMB}MB (${usagePercent}%)`);
      }
    }
  }
}

// 定期内存检查（开发环境）
if (import.meta.env.DEV) {
  setInterval(monitorMemory, 10000);
}
