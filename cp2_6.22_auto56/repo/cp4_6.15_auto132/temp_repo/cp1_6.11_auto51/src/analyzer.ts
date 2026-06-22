export interface ViewRange {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  xTickStep: number;
  yTickStep: number;
}

export interface ExtremumPoint {
  x: number;
  y: number;
  type: 'maximum' | 'minimum';
}

export interface InflectionPoint {
  x: number;
  y: number;
}

export type Monotonicity = 'increasing' | 'decreasing';
export type Concavity = 'convex' | 'concave';

export interface MonoInterval {
  start: number;
  end: number;
  property: Monotonicity;
}

export interface ConcInterval {
  start: number;
  end: number;
  property: Concavity;
}

export interface AnalysisResult {
  extrema: ExtremumPoint[];
  inflections: InflectionPoint[];
  monotonicity: MonoInterval[];
  concavity: ConcInterval[];
}

const DERIV_H = 1e-5;

function firstDerivative(f: (x: number) => number, x: number): number {
  return (f(x + DERIV_H) - f(x - DERIV_H)) / (2 * DERIV_H);
}

function secondDerivative(f: (x: number) => number, x: number): number {
  return (f(x + DERIV_H) - 2 * f(x) + f(x - DERIV_H)) / (DERIV_H * DERIV_H);
}

function sign(n: number): number {
  if (n > 1e-9) return 1;
  if (n < -1e-9) return -1;
  return 0;
}

function refineZero(
  f: (x: number) => number,
  a: number,
  b: number,
  maxIter: number = 50
): number | null {
  let fa = f(a);
  let fb = f(b);
  if (sign(fa) === sign(fb)) {
    let bestX = a, bestAbs = Math.abs(fa);
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = a + (b - a) * t;
      const v = Math.abs(f(x));
      if (v < bestAbs) {
        bestAbs = v;
        bestX = x;
      }
    }
    if (bestAbs < 1e-3) return bestX;
    return null;
  }

  for (let i = 0; i < maxIter; i++) {
    const m = (a + b) / 2;
    const fm = f(m);
    if (Math.abs(fm) < 1e-12 || (b - a) < 1e-10) return m;
    if (sign(fa) === sign(fm)) {
      a = m;
      fa = fm;
    } else {
      b = m;
      fb = fm;
    }
  }
  return (a + b) / 2;
}

export function analyzeFunction(
  f: (x: number) => number,
  range: { xMin: number; xMax: number }
): AnalysisResult {
  const extrema: ExtremumPoint[] = [];
  const inflections: InflectionPoint[] = [];

  const xMin = range.xMin;
  const xMax = range.xMax;
  const span = xMax - xMin;
  if (span <= 0) {
    return { extrema, inflections, monotonicity: [], concavity: [] };
  }

  const step = Math.max(0.005, span / 4000);
  const n = Math.ceil(span / step);
  const actualStep = span / n;

  const d1Arr = new Float64Array(n + 1);
  const d2Arr = new Float64Array(n + 1);
  const xArr = new Float64Array(n + 1);
  const yArr = new Float64Array(n + 1);

  for (let i = 0; i <= n; i++) {
    const x = xMin + i * actualStep;
    const y = f(x);
    xArr[i] = x;
    yArr[i] = y;
    d1Arr[i] = isFinite(y) ? firstDerivative(f, x) : NaN;
    d2Arr[i] = isFinite(y) ? secondDerivative(f, x) : NaN;
  }

  for (let i = 0; i < n; i++) {
    const d1a = d1Arr[i], d1b = d1Arr[i + 1];
    if (!isFinite(d1a) || !isFinite(d1b)) continue;
    const s1a = sign(d1a), s1b = sign(d1b);

    if ((s1a > 0 && s1b < 0) || (s1a < 0 && s1b > 0)) {
      const zero = refineZero((xv) => firstDerivative(f, xv), xArr[i], xArr[i + 1]);
      if (zero !== null) {
        const y = f(zero);
        if (isFinite(y)) {
          const d2 = secondDerivative(f, zero);
          if (sign(d2) !== 0) {
            extrema.push({
              x: zero,
              y,
              type: d2 < 0 ? 'maximum' : 'minimum'
            });
          }
        }
      }
    }

    const d2a = d2Arr[i], d2b = d2Arr[i + 1];
    if (!isFinite(d2a) || !isFinite(d2b)) continue;
    const s2a = sign(d2a), s2b = sign(d2b);

    if ((s2a > 0 && s2b < 0) || (s2a < 0 && s2b > 0)) {
      const zero = refineZero((xv) => secondDerivative(f, xv), xArr[i], xArr[i + 1]);
      if (zero !== null) {
        const y = f(zero);
        if (isFinite(y)) {
          inflections.push({ x: zero, y });
        }
      }
    }
  }

  extrema.sort((a, b) => a.x - b.x);
  inflections.sort((a, b) => a.x - b.x);

  for (let rep = 0; rep < 2; rep++) {
    const merged: ExtremumPoint[] = [];
    for (let i = 0; i < extrema.length; i++) {
      if (merged.length > 0 &&
          Math.abs(extrema[i].x - merged[merged.length - 1].x) < actualStep * 2) {
        const prev = merged[merged.length - 1];
        if (Math.abs(extrema[i].y) < Math.abs(prev.y)) {
          merged[merged.length - 1] = extrema[i];
        }
      } else {
        merged.push(extrema[i]);
      }
    }
    extrema.length = 0;
    extrema.push(...merged);
  }

  for (let rep = 0; rep < 2; rep++) {
    const merged: InflectionPoint[] = [];
    for (let i = 0; i < inflections.length; i++) {
      if (merged.length > 0 &&
          Math.abs(inflections[i].x - merged[merged.length - 1].x) < actualStep * 2) {
        const prev = merged[merged.length - 1];
        if (Math.abs(secondDerivative(f, inflections[i].x)) < Math.abs(secondDerivative(f, prev.x))) {
          merged[merged.length - 1] = inflections[i];
        }
      } else {
        merged.push(inflections[i]);
      }
    }
    inflections.length = 0;
    inflections.push(...merged);
  }

  const monotonicity: MonoInterval[] = [];
  const concavity: ConcInterval[] = [];

  let monoStart = xMin;
  let lastMonoSign = 0;
  for (let i = 0; i <= n; i++) {
    const s = sign(d1Arr[i]);
    if (s === 0) continue;
    if (lastMonoSign === 0) {
      lastMonoSign = s;
    } else if (s !== lastMonoSign) {
      monotonicity.push({
        start: monoStart,
        end: xArr[i],
        property: lastMonoSign > 0 ? 'increasing' : 'decreasing'
      });
      monoStart = xArr[i];
      lastMonoSign = s;
    }
  }
  if (lastMonoSign !== 0 && monoStart < xMax) {
    monotonicity.push({
      start: monoStart,
      end: xMax,
      property: lastMonoSign > 0 ? 'increasing' : 'decreasing'
    });
  }

  let concStart = xMin;
  let lastConcSign = 0;
  for (let i = 0; i <= n; i++) {
    const s = sign(d2Arr[i]);
    if (s === 0) continue;
    if (lastConcSign === 0) {
      lastConcSign = s;
    } else if (s !== lastConcSign) {
      concavity.push({
        start: concStart,
        end: xArr[i],
        property: lastConcSign > 0 ? 'convex' : 'concave'
      });
      concStart = xArr[i];
      lastConcSign = s;
    }
  }
  if (lastConcSign !== 0 && concStart < xMax) {
    concavity.push({
      start: concStart,
      end: xMax,
      property: lastConcSign > 0 ? 'convex' : 'concave'
    });
  }

  return { extrema, inflections, monotonicity, concavity };
}
