import { useState, useEffect, useRef } from 'react';

export function useFPS(): number {
  const [fps, setFps] = useState<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      frameCountRef.current++;
      const elapsed = now - lastTimeRef.current;

      if (elapsed >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / elapsed));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  return fps;
}

interface BreakpointResult {
  isDesktop: boolean;
  isTablet: boolean;
}

export function useResponsiveBreakpoint(): BreakpointResult {
  const [breakpoint, setBreakpoint] = useState<BreakpointResult>(() => {
    if (typeof window === 'undefined') {
      return { isDesktop: true, isTablet: false };
    }
    return {
      isDesktop: window.matchMedia('(min-width: 1024px)').matches,
      isTablet:
        window.matchMedia('(min-width: 768px)').matches &&
        !window.matchMedia('(min-width: 1024px)').matches,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const tabletQuery = window.matchMedia(
      '(min-width: 768px) and (max-width: 1023px)'
    );

    const updateBreakpoint = () => {
      setBreakpoint({
        isDesktop: desktopQuery.matches,
        isTablet: tabletQuery.matches,
      });
    };

    desktopQuery.addEventListener('change', updateBreakpoint);
    tabletQuery.addEventListener('change', updateBreakpoint);

    return () => {
      desktopQuery.removeEventListener('change', updateBreakpoint);
      tabletQuery.removeEventListener('change', updateBreakpoint);
    };
  }, []);

  return breakpoint;
}
