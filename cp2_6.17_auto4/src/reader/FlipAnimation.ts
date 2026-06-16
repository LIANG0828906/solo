import type { FlipStyle } from '@/types';

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function computeFlipStyle(
  direction: 'next' | 'prev',
  progress: number
): FlipStyle {
  const t = easeOut(Math.max(0, Math.min(1, progress)));
  const angle = direction === 'next' ? -180 * t : 180 * (1 - t);
  const dirSign = direction === 'next' ? 1 : -1;
  const curlOffset = Math.sin(t * Math.PI) * 30;
  const shadowOpacity = 0.2 + Math.sin(t * Math.PI) * 0.4;
  const shadowBlur = 10 + Math.sin(t * Math.PI) * 20;
  const shadowOffsetX = dirSign * Math.sin(t * Math.PI) * 15;

  return {
    transform: `perspective(1500px) rotateY(${angle}deg) translateZ(${curlOffset}px) translateX(${dirSign * curlOffset * 0.3}px)`,
    boxShadow: `${shadowOffsetX}px 0 ${shadowBlur}px rgba(0,0,0,${shadowOpacity})`,
    backfaceVisibility: 'hidden',
    transformOrigin: direction === 'next' ? 'left center' : 'right center',
  };
}

export function computeBackPageStyle(
  direction: 'next' | 'prev',
  progress: number
): FlipStyle {
  const t = easeOut(Math.max(0, Math.min(1, progress)));
  const angle = direction === 'next' ? -180 * (1 - t) : 180 * t;
  const dirSign = direction === 'next' ? 1 : -1;
  const curlOffset = Math.sin(t * Math.PI) * 20;

  return {
    transform: `perspective(1500px) rotateY(${angle}deg) translateZ(${curlOffset}px) translateX(${-dirSign * curlOffset * 0.3}px)`,
    boxShadow: `${-dirSign * 5}px 0 15px rgba(0,0,0,0.15)`,
    backfaceVisibility: 'hidden',
    transformOrigin: direction === 'next' ? 'left center' : 'right center',
  };
}
