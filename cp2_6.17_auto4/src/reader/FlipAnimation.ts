import type { FlipStyle, CurvePoint, MeshGrid, ShadowContour } from '@/types';

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

export function computeMeshDeformation(
  direction: 'next' | 'prev',
  progress: number,
  width: number,
  height: number,
  gridCols: number = 16,
  gridRows: number = 20
): MeshGrid {
  const t = Math.max(0, Math.min(1, progress));
  const easedT = easeOutCubic(t);

  let foldX: number;
  let turnedWidth: number;

  if (direction === 'next') {
    foldX = width * (1 - easedT);
    turnedWidth = width - foldX;
  } else {
    foldX = width * easedT;
    turnedWidth = foldX;
  }

  const curlRadius = Math.max(turnedWidth / Math.PI, 8);
  const sineT = Math.sin(t * Math.PI);
  const vertLift = 0.25 + sineT * 0.15;
  const perspDist = 1500;

  const vertices: CurvePoint[][] = [];

  for (let row = 0; row <= gridRows; row++) {
    const rowPts: CurvePoint[] = [];
    const baseY = (row / gridRows) * height;

    for (let col = 0; col <= gridCols; col++) {
      const baseX = (col / gridCols) * width;

      if (direction === 'next') {
        if (baseX <= foldX) {
          rowPts.push({ x: baseX, y: baseY });
        } else {
          const d = baseX - foldX;
          const theta = Math.min((d / turnedWidth) * Math.PI, Math.PI);
          const projX = foldX - curlRadius * Math.sin(theta);
          const liftZ = curlRadius * (1 - Math.cos(theta));
          const perspScale = perspDist / (perspDist - liftZ);
          const dy = -liftZ * vertLift;
          const verticalBulge = Math.sin(theta) * sineT * 6;
          rowPts.push({
            x: foldX + (projX - foldX) * perspScale,
            y: baseY + dy + verticalBulge * Math.sin((row / gridRows) * Math.PI),
          });
        }
      } else {
        if (baseX >= foldX) {
          rowPts.push({ x: baseX, y: baseY });
        } else {
          const d = foldX - baseX;
          const theta = Math.min((d / turnedWidth) * Math.PI, Math.PI);
          const projX = foldX + curlRadius * Math.sin(theta);
          const liftZ = curlRadius * (1 - Math.cos(theta));
          const perspScale = perspDist / (perspDist - liftZ);
          const dy = -liftZ * vertLift;
          const verticalBulge = Math.sin(theta) * sineT * 6;
          rowPts.push({
            x: foldX + (projX - foldX) * perspScale,
            y: baseY + dy + verticalBulge * Math.sin((row / gridRows) * Math.PI),
          });
        }
      }
    }
    vertices.push(rowPts);
  }

  return { cols: gridCols, rows: gridRows, vertices, foldX, curlRadius };
}

export function computeCurvedShadow(
  direction: 'next' | 'prev',
  progress: number,
  width: number,
  height: number,
  mesh: MeshGrid
): ShadowContour {
  const t = Math.max(0, Math.min(1, progress));
  const sineT = Math.sin(t * Math.PI);
  const curlRadius = mesh.curlRadius;
  const foldX = mesh.foldX;
  const dirSign = direction === 'next' ? -1 : 1;

  const curvature = curlRadius > 0 ? 1 / curlRadius : 0;
  const shadowBaseWidth = 15 + sineT * 35;
  const curvatureFactor = Math.min(curvature * 100, 1);
  const shadowWarpAmount = curvatureFactor * sineT * 20;

  const points: CurvePoint[] = [];
  const innerPoints: CurvePoint[] = [];
  const steps = 20;

  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    const y = frac * height;
    const verticalWarp = Math.sin(frac * Math.PI) * shadowWarpAmount;
    const rowIdx = Math.min(Math.round(frac * mesh.rows), mesh.rows);
    const foldYOffset = mesh.vertices[rowIdx]
      ? mesh.vertices[rowIdx][direction === 'next' ? 0 : mesh.cols].y - (frac * height)
      : 0;

    const shadowEdge = foldX + dirSign * (shadowBaseWidth + verticalWarp);
    const innerEdge = foldX + dirSign * (3 + verticalWarp * 0.3);

    points.push({ x: shadowEdge, y: y + foldYOffset });
    innerPoints.push({ x: innerEdge, y: y + foldYOffset * 0.5 });
  }

  const gradientStops = [
    { offset: 0, opacity: 0.3 + sineT * 0.35 },
    { offset: 0.3, opacity: 0.15 + sineT * 0.2 },
    { offset: 0.6, opacity: 0.05 + sineT * 0.08 },
    { offset: 1, opacity: 0 },
  ];

  return { points, innerPoints, gradientStops };
}

export function computeFlipStyle(
  direction: 'next' | 'prev',
  progress: number
): FlipStyle {
  const t = Math.max(0, Math.min(1, progress));
  const sineT = Math.sin(t * Math.PI);
  const dirSign = direction === 'next' ? 1 : -1;
  const easeT = easeOutCubic(t);
  const cosHalf = Math.cos((t * Math.PI) / 2);

  const foldAngle = dirSign * 180 * easeT;
  const curlHeight = sineT * 45;
  const translateZ = curlHeight * 0.6;
  const translateX = dirSign * sineT * 25;
  const translateY = -sineT * sineT * 8;
  const rotateX = -sineT * 4;
  const skewY = dirSign * sineT * 2;
  const scale = 1 - sineT * 0.015 + cosHalf * 0.005;

  const shadowOpacity = 0.15 + sineT * 0.3;
  const shadowBlur = 15 + sineT * 30;
  const shadowOffsetX = dirSign * (5 + sineT * 20);

  return {
    transform:
      `perspective(1500px) ` +
      `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) ` +
      `rotateY(${foldAngle}deg) ` +
      `rotateX(${rotateX}deg) ` +
      `skewY(${skewY}deg) ` +
      `scale(${scale})`,
    boxShadow: `${shadowOffsetX}px 2px ${shadowBlur}px rgba(0,0,0,${shadowOpacity})`,
    backfaceVisibility: 'hidden',
    transformOrigin: direction === 'next' ? 'left center' : 'right center',
  };
}

export function computeBackPageStyle(
  direction: 'next' | 'prev',
  progress: number
): FlipStyle {
  const t = Math.max(0, Math.min(1, progress));
  const sineT = Math.sin(t * Math.PI);
  const easeT = easeOutCubic(t);
  const dirSign = direction === 'next' ? 1 : -1;

  const backAngle = direction === 'next' ? -180 * (1 - easeT) : 180 * easeT;

  return {
    transform:
      `perspective(1500px) ` +
      `translate3d(${-dirSign * sineT * 8}px, ${-sineT * sineT * 6}px, ${sineT * 15}px) ` +
      `rotateY(${backAngle}deg) ` +
      `rotateX(${sineT * 2}deg) ` +
      `scale(${1 - sineT * 0.008})`,
    boxShadow: `${-dirSign * 5}px 0 15px rgba(0,0,0,0.15)`,
    backfaceVisibility: 'hidden',
    transformOrigin: direction === 'next' ? 'left center' : 'right center',
  };
}

export const easeOutCubicFn = easeOutCubic;
export { easeInOutSine };
