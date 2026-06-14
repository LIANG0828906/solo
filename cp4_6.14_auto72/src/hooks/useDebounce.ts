import { useEffect, useRef, useCallback } from 'react';

/**
 * 防抖 Hook：合并 delay 毫秒内的多次调用，只执行最后一次
 * 适合同步位置等需要限制消息频率的场景
 *
 * 工作原理：
 *   1. 每次调用时若已有待执行的定时器，先清除
 *   2. 设置新定时器，延迟 delay 毫秒后执行最新一次调用
 *   3. 若 delay 内再次调用，重置定时器（即合并多次更新，仅发送最后一次）
 *
 * @param callback 被防抖的回调函数
 * @param delay 延迟毫秒数
 * @returns 防抖后的函数
 */
export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<number | null>(null);
  const callbackRef = useRef(callback);
  const lastCallTimeRef = useRef<number>(0);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [delay]);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTimeRef.current;

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      /**
       * 如果两次调用间隔已经超过 delay，则立即执行（保证响应性）
       * 否则设置定时器延迟执行（合并中间的多次更新）
       */
      if (timeSinceLastCall >= delay) {
        callbackRef.current(...args);
        lastCallTimeRef.current = now;
      } else {
        const remainingDelay = delay - timeSinceLastCall;
        timeoutRef.current = window.setTimeout(() => {
          callbackRef.current(...args);
          lastCallTimeRef.current = Date.now();
          timeoutRef.current = null;
        }, remainingDelay);
      }
    },
    [delay]
  ) as T;

  return debouncedFn;
}
