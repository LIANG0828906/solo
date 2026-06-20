import { useEffect, useRef } from 'react';
import { useCandleStore } from '../store/candleStore';

export const useKeyboardHeight = (): void => {
  const setHeight = useCandleStore((state) => state.setHeight);
  const height = useCandleStore((state) => state.height);
  
  const intervalIdRef = useRef<number | null>(null);
  const isArrowUpPressedRef = useRef<boolean>(false);
  const isArrowDownPressedRef = useRef<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowUp' && !isArrowUpPressedRef.current) {
        isArrowUpPressedRef.current = true;
        
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
        }

        intervalIdRef.current = window.setInterval(() => {
          setHeight(height + 0.05);
        }, 100);
      }

      if (e.key === 'ArrowDown' && !isArrowDownPressedRef.current) {
        isArrowDownPressedRef.current = true;
        
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
        }

        intervalIdRef.current = window.setInterval(() => {
          setHeight(height - 0.05);
        }, 100);
      }
    };

    const handleKeyUp = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowUp') {
        isArrowUpPressedRef.current = false;
      }

      if (e.key === 'ArrowDown') {
        isArrowDownPressedRef.current = false;
      }

      if (!isArrowUpPressedRef.current && !isArrowDownPressedRef.current) {
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);

      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [height, setHeight]);
};
