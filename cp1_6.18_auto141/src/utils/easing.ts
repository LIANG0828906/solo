import type { BezierControlPoints } from '@/types';

const NEWTON_ITERATIONS = 8;
const NEWTON_MIN_SLOPE = 0.001;
const SUBDIVISION_PRECISION = 0.0000001;
const SUBDIVISION_MAX_ITERATIONS = 12;

const kSplineTableSize = 11;
const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

function A(aA1: number, aA2: number): number {
  return 1.0 - 3.0 * aA2 + 3.0 * aA1;
}

function B(aA1: number, aA2: number): number {
  return 3.0 * aA2 - 6.0 * aA1;
}

function C(aA1: number): number {
  return 3.0 * aA1;
}

function calcBezier(aT: number, aA1: number, aA2: number): number {
  return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
}

function getSlope(aT: number, aA1: number, aA2: number): number {
  return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
}

function newtonRaphsonIterate(
  aX: number,
  aGuessT: number,
  mX1: number,
  mX2: number,
): number {
  for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
    const currentSlope = getSlope(aGuessT, mX1, mX2);
    if (currentSlope === 0.0) {
      return aGuessT;
    }
    const currentX = calcBezier(aGuessT, mX1, mX2) - aX;
    aGuessT -= currentX / currentSlope;
  }
  return aGuessT;
}

function binarySubdivide(
  aX: number,
  aA: number,
  aB: number,
  mX1: number,
  mX2: number,
): number {
  let currentX: number;
  let currentT: number;
  let i = 0;
  do {
    currentT = aA + (aB - aA) / 2.0;
    currentX = calcBezier(currentT, mX1, mX2) - aX;
    if (currentX > 0.0) {
      aB = currentT;
    } else {
      aA = currentT;
    }
  } while (
    Math.abs(currentX) > SUBDIVISION_PRECISION &&
    ++i < SUBDIVISION_MAX_ITERATIONS
  );
  return currentT;
}

export function bezier(
  mX1: number,
  mY1: number,
  mX2: number,
  mY2: number,
): (x: number) => number {
  if (!(mX1 >= 0 && mX1 <= 1 && mX2 >= 0 && mX2 <= 1)) {
    throw new Error('bezier x values must be in [0, 1] range');
  }

  const sampleValues = new Float32Array(kSplineTableSize);
  if (mX1 !== mY1 || mX2 !== mY2) {
    for (let i = 0; i < kSplineTableSize; ++i) {
      sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
    }
  }

  function getTForX(aX: number): number {
    let intervalStart = 0.0;
    let currentSample = 1;
    const lastSample = kSplineTableSize - 1;

    for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
      intervalStart += kSampleStepSize;
    }
    --currentSample;

    const dist =
      (aX - sampleValues[currentSample]) /
      (sampleValues[currentSample + 1] - sampleValues[currentSample]);
    const guessForT = intervalStart + dist * kSampleStepSize;

    const initialSlope = getSlope(guessForT, mX1, mX2);
    if (initialSlope >= NEWTON_MIN_SLOPE) {
      return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
    } else if (initialSlope === 0.0) {
      return guessForT;
    } else {
      return binarySubdivide(
        aX,
        intervalStart,
        intervalStart + kSampleStepSize,
        mX1,
        mX2,
      );
    }
  }

  return (x: number): number => {
    if (mX1 === mY1 && mX2 === mY2) return x;
    if (x === 0) return 0;
    if (x === 1) return 1;
    return calcBezier(getTForX(x), mY1, mY2);
  };
}

export function bezierFromPoints(points: BezierControlPoints): (x: number) => number {
  return bezier(points.x1, points.y1, points.x2, points.y2);
}

export function generateBezierPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  control: BezierControlPoints,
  height: number = 80,
): string {
  const width = endX - startX;
  const cp1x = startX + control.x1 * width;
  const cp1y = endY - control.y1 * height;
  const cp2x = startX + control.x2 * width;
  const cp2y = endY - control.y2 * height;
  return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
}

export function lerpNumber(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function parseColor(color: string): number[] | null {
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (hex.length !== 6) {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = color;
    const computed = ctx.fillStyle;
    if (computed.startsWith('#')) {
      hex = computed.slice(1);
    } else {
      const match = computed.match(/\d+/g);
      if (match) return match.slice(0, 3).map(Number);
      return null;
    }
  }
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

export function lerpColor(a: string, b: string, t: number): string {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return t < 0.5 ? a : b;
  return rgbToHex(
    lerpNumber(ca[0], cb[0], t),
    lerpNumber(ca[1], cb[1], t),
    lerpNumber(ca[2], cb[2], t),
  );
}

export function lerpValue(
  a: string | number,
  b: string | number,
  t: number,
): string | number {
  if (typeof a === 'number' && typeof b === 'number') {
    return lerpNumber(a, b, t);
  }
  const sa = String(a);
  const sb = String(b);
  if (sa.startsWith('#') || sb.startsWith('#')) {
    return lerpColor(sa, sb, t);
  }
  const numA = parseFloat(sa);
  const numB = parseFloat(sb);
  if (!isNaN(numA) && !isNaN(numB)) {
    const unitA = sa.replace(/^-?[\d.]+/, '');
    const unitB = sb.replace(/^-?[\d.]+/, '');
    const unit = unitA || unitB;
    return lerpNumber(numA, numB, t).toFixed(2) + unit;
  }
  return t < 0.5 ? a : b;
}

export function easingToCssString(e: BezierControlPoints): string {
  return `cubic-bezier(${e.x1.toFixed(3)}, ${e.y1.toFixed(3)}, ${e.x2.toFixed(3)}, ${e.y2.toFixed(3)})`;
}
