import type { FlipStyle, CurvePoint } from '@/types';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export function bezierPoint(
  p0: CurvePoint,
  p1: CurvePoint,
  p2: CurvePoint,
  p3: CurvePoint,
  t: number
): CurvePoint {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

export interface CurlGeometry {
  foldAngle: number;
  curlHeight: number;
  curlRadius: number;
  spineBend: number;
  tipOffset: CurvePoint;
}

export function computeCurlGeometry(
  direction: 'next' | 'prev',
  progress: number
): CurlGeometry {
  const t = Math.max(0, Math.min(1, progress));
  const sineT = Math.sin(t * Math.PI);
  const dirSign = direction === 'next' ? 1 : -1;

  const foldAngle = dirSign * 180 * easeOutCubic(t);
  const curlHeight = sineT * 45;
  const curlRadius = 15 + sineT * 35;
  const spineBend = sineT * 8;
  const tipOffset = {
    x: dirSign * sineT * 20,
    y: -sineT * sineT * 15,
  };

  return { foldAngle, curlHeight, curlRadius, spineBend, tipOffset };
}

export interface ShadowLayers {
  layer1: { offsetX: number; offsetY: number; blur: number; opacity: number };
  layer2: { offsetX: number; offsetY: number; blur: number; opacity: number };
  layer3: { offsetX: number; offsetY: number; blur: number; opacity: number };
  spineShadow: { offsetX: number; blur: number; opacity: number };
}

export function computeShadowLayers(
  direction: 'next' | 'prev',
  progress: number
): ShadowLayers {
  const t = Math.max(0, Math.min(1, progress));
  const sineT = Math.sin(t * Math.PI);
  const dirSign = direction === 'next' ? 1 : -1;
  const easeT = easeInOutSine(t);

  return {
    layer1: {
      offsetX: dirSign * (5 + sineT * 20),
      offsetY: 2 + sineT * 8,
      blur: 15 + sineT * 25,
      opacity: 0.15 + sineT * 0.25,
    },
    layer2: {
      offsetX: dirSign * (2 + sineT * 10),
      offsetY: 1 + sineT * 4,
      blur: 8 + sineT * 15,
      opacity: 0.1 + sineT * 0.2,
    },
    layer3: {
      offsetX: 0,
      offsetY: 0,
      blur: 3 + sineT * 8,
      opacity: 0.05 + sineT * 0.1,
    },
    spineShadow: {
      offsetX: -dirSign * sineT * 3,
      blur: 3 + sineT * 10,
      opacity: 0.1 + easeT * 0.25,
    },
  };
}

function shadowLayersToString(layers: ShadowLayers): string {
  const parts: string[] = [];
  parts.push(
    `${layers.layer1.offsetX}px ${layers.layer1.offsetY}px ${layers.layer1.blur}px rgba(0,0,0,${layers.layer1.opacity})`
  );
  parts.push(
    `${layers.layer2.offsetX}px ${layers.layer2.offsetY}px ${layers.layer2.blur}px rgba(0,0,0,${layers.layer2.opacity})`
  );
  parts.push(
    `${layers.layer3.offsetX}px ${layers.layer3.offsetY}px ${layers.layer3.blur}px rgba(0,0,0,${layers.layer3.opacity})`
  );
  parts.push(
    `inset ${layers.spineShadow.offsetX}px 0 ${layers.spineShadow.blur}px rgba(0,0,0,${layers.spineShadow.opacity})`
  );
  return parts.join(', ');
}

export function computeFlipStyle(
  direction: 'next' | 'prev',
  progress: number
): FlipStyle {
  const t = Math.max(0, Math.min(1, progress));
  const curl = computeCurlGeometry(direction, progress);
  const layers = computeShadowLayers(direction, progress);
  const dirSign = direction === 'next' ? 1 : -1;
  const sineT = Math.sin(t * Math.PI);
  const cosHalf = Math.cos((t * Math.PI) / 2);

  const perspective = 1500;
  const rotateY = curl.foldAngle;
  const translateZ = curl.curlHeight * 0.6;
  const translateX = dirSign * (curl.tipOffset.x + sineT * 5);
  const translateY = curl.tipOffset.y * 0.5;
  const rotateX = -curl.spineBend * 0.5;
  const skewY = dirSign * sineT * 2;
  const scale = 1 - sineT * 0.015 + cosHalf * 0.005;

  return {
    transform:
      `perspective(${perspective}px) ` +
      `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) ` +
      `rotateY(${rotateY}deg) ` +
      `rotateX(${rotateX}deg) ` +
      `skewY(${skewY}deg) ` +
      `scale(${scale})`,
    boxShadow: shadowLayersToString(layers),
    backfaceVisibility: 'hidden',
    transformOrigin: direction === 'next' ? 'left center' : 'right center',
  };
}

export function computeBackPageStyle(
  direction: 'next' | 'prev',
  progress: number
): FlipStyle {
  const t = Math.max(0, Math.min(1, progress));
  const curl = computeCurlGeometry(direction, progress);
  const dirSign = direction === 'next' ? 1 : -1;
  const sineT = Math.sin(t * Math.PI);

  const backAngle = direction === 'next' ? -180 * (1 - easeOutCubic(t)) : 180 * easeOutCubic(t);
  const backLayers = computeShadowLayers(direction === 'next' ? 'prev' : 'next', 1 - t);

  return {
    transform:
      `perspective(1500px) ` +
      `translate3d(${-dirSign * sineT * 8}px, ${-sineT * sineT * 8}px, ${curl.curlHeight * 0.3}px) ` +
      `rotateY(${backAngle}deg) ` +
      `rotateX(${curl.spineBend * 0.25}deg) ` +
      `scale(${1 - sineT * 0.008})`,
    boxShadow: shadowLayersToString(backLayers),
    backfaceVisibility: 'hidden',
    transformOrigin: direction === 'next' ? 'left center' : 'right center',
  };
}

export function computeCurlClipPath(
  direction: 'next' | 'prev',
  progress: number,
  width: number,
  height: number
): string {
  const t = Math.max(0, Math.min(1, progress));
  const dirSign = direction === 'next' ? 1 : -1;
  const sineT = Math.sin(t * Math.PI);
  const curlAmount = sineT * 0.25;

  if (direction === 'next') {
    const foldX = width * t;
    const curveDepth = height * curlAmount;
    return `polygon(
      0 0,
      ${foldX - width * 0.02} 0,
      ${foldX} ${height * 0.05 + curveDepth * 0.3},
      ${foldX + width * 0.01} ${height * 0.5 + curveDepth * 0.5},
      ${foldX} ${height * 0.95 + curveDepth * 0.3},
      ${foldX - width * 0.02} ${height},
      0 ${height}
    )`;
  } else {
    const foldX = width * (1 - t);
    const curveDepth = height * curlAmount;
    return `polygon(
      ${width} 0,
      ${foldX + width * 0.02} 0,
      ${foldX} ${height * 0.05 + curveDepth * 0.3},
      ${foldX - width * 0.01} ${height * 0.5 + curveDepth * 0.5},
      ${foldX} ${height * 0.95 + curveDepth * 0.3},
      ${foldX + width * 0.02} ${height},
      ${width} ${height}
    )`;
  }
}

export const easeOutCubicFn = easeOutCubic;
