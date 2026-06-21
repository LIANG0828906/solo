/**
 * 缓动函数模块
 *
 * 职责：提供各种缓动函数供动画使用。
 * 调用方：explosionStore 中 explodeAll / resetAll 动画。
 */

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export const easeInCubic = (t: number): number => t * t * t;

export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOutExpo = (t: number): number =>
  t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

export const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

/**
 * 通用 rAF 驱动的动画函数，基于真实时间戳计算，避免帧率波动影响时长。
 *
 * @param start 起始值
 * @param end 结束值
 * @param duration 动画时长（毫秒）
 * @param onUpdate 每帧回调，传入当前插值
 * @param easing 缓动函数，默认 easeOutCubic
 */
export const animateValue = (
  start: number,
  end: number,
  duration: number,
  onUpdate: (value: number) => void,
  easing: (t: number) => number = easeOutCubic
): Promise<void> => {
  return new Promise((resolve) => {
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      const currentValue = start + (end - start) * easedProgress;

      onUpdate(currentValue);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(step);
  });
};
