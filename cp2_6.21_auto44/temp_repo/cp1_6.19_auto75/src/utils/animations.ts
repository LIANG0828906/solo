export const ANIMATION_DURATIONS = {
  fast: 100,
  normal: 300,
  slow: 500,
  verySlow: 800
} as const;

export const EASING = {
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  cubicBezier: 'cubic-bezier(0.4, 0, 0.2, 1)'
} as const;

export const slideInRight = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
  transition: { duration: 0.3, ease: EASING.easeOut }
};

export const fadeInScale = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0, opacity: 0 },
  transition: { duration: 0.2, ease: EASING.easeOut }
};

export const slideUp = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.2, ease: EASING.easeOut }
};

export const pulseScale = (scale: number = 1.3) => ({
  animate: {
    scale: [1, scale, 1],
    transition: {
      duration: 0.3,
      ease: EASING.easeInOut
    }
  }
});

export const glowSpread = {
  boxShadow: [
    '0 0 0 0 rgba(255, 255, 255, 0)',
    '0 0 10px 3px rgba(255, 255, 255, 0.6)',
    '0 0 0 0 rgba(255, 255, 255, 0)'
  ],
  transition: {
    duration: 0.1,
    ease: EASING.easeOut
  }
};

export const toastSlideIn = {
  initial: { y: 100, x: '-50%', opacity: 0 },
  animate: { y: -20, x: '-50%', opacity: 1 },
  exit: { y: 100, x: '-50%', opacity: 0 },
  transition: {
    duration: 0.4,
    ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
  }
};

export const staggeredFadeIn = (index: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: {
    delay: index * 0.1,
    duration: 0.5,
    ease: EASING.easeOut
  }
});

export const leafSpin = {
  animation: 'spin 1.5s linear infinite',
  style: {
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' }
    }
  }
};

export const scoreCountUp = (target: number, duration: number = 500) => {
  return {
    animate: {
      innerHTML: [0, target] as unknown as number,
      transition: {
        duration: duration / 1000,
        ease: EASING.easeOut,
        onUpdate: (value: { innerHTML: number }) => {
          return Math.round(value.innerHTML * 10) / 10;
        }
      }
    }
  };
};
