/**
 * 缓动函数模块
 *
 * 职责：提供各种缓动函数供动画使用，支持可配置的缓动函数接口。
 * 调用方：explosionStore 中 explodeAll / resetAll 动画。
 */

export type EasingFunction = (t: number) => number;

export const easeOutCubic: EasingFunction = (t) => 1 - Math.pow(1 - t, 3);

export const easeInCubic: EasingFunction = (t) => t * t * t;

export const easeInOutCubic: EasingFunction = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * 指数衰减缓动函数 - 先快后慢，符合自然运动规律
 * 公式: f(t) = 1 - 2^(-10 * t)
 * 参数 exponent 可调节衰减速度，值越大衰减越快
 */
export const createEaseOutExpo = (exponent: number = 10): EasingFunction => {
  return (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -exponent * t));
};

export const easeOutExpo: EasingFunction = createEaseOutExpo(10);

export const easeOutQuart: EasingFunction = (t) => 1 - Math.pow(1 - t, 4);

/**
 * 通用 rAF 驱动的动画函数，基于真实时间戳计算，避免帧率波动影响时长。
 * 支持通过 easing 参数传入自定义缓动函数。
 *
 * @param start 起始值
 * @param end 结束值
 * @param duration 动画时长（毫秒）
 * @param onUpdate 每帧回调，传入当前插值
 * @param easing 缓动函数，默认使用指数衰减 easeOutExpo
 */
export const animateValue = (
  start: number,
  end: number,
  duration: number,
  onUpdate: (value: number) => void,
  easing: EasingFunction = easeOutExpo
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
