import { useState, useEffect } from 'react';

export interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const BREAKPOINTS = {
  xs: 480,
  sm: 768,
  md: 1024,
  lg: 1440,
  xl: 1920
};

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return computeState(w, h);
  });

  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        setState(computeState(window.innerWidth, window.innerHeight));
      });
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return state;
}

function computeState(width: number, height: number): ResponsiveState {
  let breakpoint: ResponsiveState['breakpoint'] = 'md';
  if (width < BREAKPOINTS.xs) breakpoint = 'xs';
  else if (width < BREAKPOINTS.sm) breakpoint = 'sm';
  else if (width < BREAKPOINTS.md) breakpoint = 'md';
  else if (width < BREAKPOINTS.lg) breakpoint = 'lg';
  else breakpoint = 'xl';

  return {
    width,
    height,
    isMobile: width < BREAKPOINTS.sm,
    isTablet: width >= BREAKPOINTS.sm && width < BREAKPOINTS.md,
    isDesktop: width >= BREAKPOINTS.md,
    breakpoint
  };
}
