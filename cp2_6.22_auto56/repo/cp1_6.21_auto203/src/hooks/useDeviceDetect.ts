import { useState, useEffect } from 'react';

interface DeviceDetectResult {
  isMobile: boolean;
  isTouch: boolean;
}

function checkIsMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const mq: MediaQueryList = window.matchMedia('(max-width: 768px)');
  const hasTouch: boolean = 'ontouchstart' in window;
  return mq.matches || hasTouch;
}

function checkIsTouch(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window;
}

export function useDeviceDetect(): DeviceDetectResult {
  const [isMobile, setIsMobile] = useState<boolean>(checkIsMobile());
  const [isTouch, setIsTouch] = useState<boolean>(checkIsTouch());

  useEffect((): (() => void) => {
    const handleResize = (): void => {
      setIsMobile(checkIsMobile());
      setIsTouch(checkIsTouch());
    };

    window.addEventListener('resize', handleResize);
    return (): void => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return { isMobile, isTouch };
}
