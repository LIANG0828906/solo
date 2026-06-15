export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

export function useDebouncedCallback<T extends (...args: Parameters<T>) => void | Promise<void>>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => Promise<ReturnType<T> | undefined> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
    return new Promise((resolve) => {
      if (timer !== null) {
        clearTimeout(timer);
      }
      timer = setTimeout(async () => {
        const result = await callback(...args);
        resolve(result as ReturnType<T>);
        timer = null;
      }, delay);
    });
  };
}
