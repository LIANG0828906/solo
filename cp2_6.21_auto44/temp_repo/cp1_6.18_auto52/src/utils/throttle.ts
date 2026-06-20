export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function throttleByRaf(fn: (timestamp: number) => void): {
  start: () => void;
  stop: () => void;
} {
  let rafId: number | null = null;

  const loop = (timestamp: number) => {
    fn(timestamp);
    rafId = requestAnimationFrame(loop);
  };

  return {
    start: () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(loop);
      }
    },
    stop: () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
  };
}
