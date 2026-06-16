import { useEffect, useRef } from 'react';

export function useAutoSave(
  callback: () => void,
  interval: number,
  deps: React.DependencyList = []
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const timer = setInterval(() => {
      callbackRef.current();
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, [interval, ...deps]);
}
