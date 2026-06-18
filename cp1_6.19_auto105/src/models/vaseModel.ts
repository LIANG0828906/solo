import * as THREE from 'three';

export interface VaseDimensions {
  height: number;
  rimRadius: number;
  footRadius: number;
  bodyMaxRadius: number;
  bodyMaxHeight: number;
}

export const vaseDimensions: VaseDimensions = {
  height: 8.5,
  rimRadius: 8.1,
  footRadius: 3.4,
  bodyMaxRadius: 7.8,
  bodyMaxHeight: 2.5,
};

const BODY_SEGMENTS = 64;
const HEIGHT_SEGMENTS = 48;

export function generateBowlProfile(dim: VaseDimensions): THREE.Vector2[] {
  const points: THREE.Vector2[] = [];
  const steps = 40;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = dim.height * t;

    let x: number;
    if (t < 0.1) {
      const ft = t / 0.1;
      x = dim.footRadius + (dim.bodyMaxRadius * 0.6 - dim.footRadius) * ft;
    } else if (t < 0.4) {
      const ft = (t - 0.1) / 0.3;
      const curve = Math.sin(ft * Math.PI * 0.5);
      x = dim.bodyMaxRadius * 0.6 + (dim.bodyMaxRadius - dim.bodyMaxRadius * 0.6) * curve;
    } else if (t < 0.85) {
      const ft = (t - 0.4) / 0.45;
      const curve = Math.sin((1 - ft) * Math.PI * 0.3);
      x = dim.bodyMaxRadius - (dim.bodyMaxRadius - dim.rimRadius * 0.95) * (1 - curve);
    } else {
      const ft = (t - 0.85) / 0.15;
      const ease = 1 - Math.pow(1 - ft, 2);
      x = dim.rimRadius * 0.95 + (dim.rimRadius - dim.rimRadius * 0.95) * ease;
    }

    points.push(new THREE.Vector2(x, y));
  }

  return points;
}

export function generateBowlGeometry(dim: VaseDimensions): THREE.BufferGeometry {
  const profile = generateBowlProfile(dim);
  const geometry = new THREE.LatheGeometry(profile, BODY_SEGMENTS);
  geometry.computeVertexNormals();
  return geometry;
}

export function generateInnerBowlGeometry(dim: VaseDimensions, thickness: number): THREE.BufferGeometry {
  const innerPoints: THREE.Vector2[] = [];
  const outerProfile = generateBowlProfile(dim);

  for (let i = 0; i < outerProfile.length; i++) {
    const point = outerProfile[i].clone();
    const nextPoint = outerProfile[Math.min(i + 1, outerProfile.length - 1)];
    const dx = nextPoint.x - point.x;
    const dy = nextPoint.y - point.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len;
    const ny = dx / len;

    const innerX = point.x - nx * thickness;
    const innerY = point.y + ny * thickness;

    if (innerX > 0.5) {
      innerPoints.push(new THREE.Vector2(innerX, innerY));
    }
  }

  const bottomThickness = thickness * 1.5;
  innerPoints.unshift(new THREE.Vector2(0.1, bottomThickness));

  const geometry = new THREE.LatheGeometry(innerPoints, BODY_SEGMENTS);
  geometry.scale(-1, 1, 1);
  geometry.computeVertexNormals();
  return geometry;
}

export function generateBlueWhiteTexture(isDamaged: boolean, repairProgress: number = 0): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const baseColor = '#F5F0E8';
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  drawLotusPattern(ctx, size, 0.15, 0.25, 1.2);
  drawLotusPattern(ctx, size, 0.5, 0.25, 1.0);
  drawLotusPattern(ctx, size, 0.85, 0.25, 1.2);
  drawLotusPattern(ctx, size, 0.3, 0.5, 0.9);
  drawLotusPattern(ctx, size, 0.7, 0.5, 0.9);
  drawLotusPattern(ctx, size, 0.15, 0.7, 1.1);
  drawLotusPattern(ctx, size, 0.5, 0.7, 1.0);
  drawLotusPattern(ctx, size, 0.85, 0.7, 1.1);

  drawScrollWork(ctx, size);
  drawRimBorder(ctx, size);
  drawFootBorder(ctx, size);

  if (isDamaged) {
    drawDamageAreas(ctx, size, repairProgress);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
  texture.needsUpdate = true;

  return texture;
}

function drawLotusPattern(
  ctx: CanvasRenderingContext2D,
  size: number,
  cx: number,
  cy: number,
  scale: number
) {
  const centerX = cx * size;
  const centerY = cy * size;
  const petalCount = 8;
  const petalLength = 0.08 * size * scale;
  const petalWidth = 0.035 * size * scale;

  ctx.strokeStyle = '#1A5BB5';
  ctx.lineWidth = 1.5;
  ctx.fillStyle = 'rgba(26, 91, 181, 0.15)';

  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(
      petalWidth,
      petalLength * 0.3,
      petalWidth * 0.8,
      petalLength * 0.7,
      0,
      petalLength
    );
    ctx.bezierCurveTo(
      -petalWidth * 0.8,
      petalLength * 0.7,
      -petalWidth,
      petalLength * 0.3,
      0,
      0
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  ctx.fillStyle = '#0A3A75';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 0.015 * size * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawScrollWork(ctx: CanvasRenderingContext2D, size: number) {
  ctx.strokeStyle = '#1A5BB5';
  ctx.lineWidth = 1.2;

  const bands = [0.35, 0.6];
  bands.forEach((bandY) => {
    const y = bandY * size;
    for (let x = 0; x < size; x += 0.08 * size) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(
        x + 0.02 * size,
        y - 0.015 * size,
        x + 0.04 * size,
        y + 0.015 * size,
        x + 0.06 * size,
        y
      );
      ctx.bezierCurveTo(
        x + 0.07 * size,
        y - 0.008 * size,
        x + 0.075 * size,
        y + 0.005 * size,
        x + 0.08 * size,
        y
      );
      ctx.stroke();
    }
  });
}

function drawRimBorder(ctx: CanvasRenderingContext2D, size: number) {
  const y1 = 0.02 * size;
  const y2 = 0.06 * size;

  ctx.strokeStyle = '#0A3A75';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, y1);
  ctx.lineTo(size, y1);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, y2);
  ctx.lineTo(size, y2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(10, 58, 117, 0.2)';
  ctx.fillRect(0, y1, size, y2 - y1);
}

function drawFootBorder(ctx: CanvasRenderingContext2D, size: number) {
  const y1 = 0.92 * size;
  const y2 = 0.96 * size;

  ctx.strokeStyle = '#0A3A75';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, y1);
  ctx.lineTo(size, y1);
  ctx.stroke();

  ctx.fillStyle = 'rgba(10, 58, 117, 0.15)';
  ctx.fillRect(0, y1, size, y2 - y1);
}

function drawDamageAreas(
  ctx: CanvasRenderingContext2D,
  size: number,
  repairProgress: number
) {
  const alpha = 1 - repairProgress;

  if (alpha <= 0) return;

  ctx.globalAlpha = alpha;

  ctx.fillStyle = '#8B7355';
  ctx.beginPath();
  ctx.moveTo(0.1 * size, 0);
  ctx.lineTo(0.18 * size, 0.08 * size);
  ctx.lineTo(0.22 * size, 0.04 * size);
  ctx.lineTo(0.28 * size, 0);
  ctx.lineTo(0.1 * size, 0);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#3A2A1A';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0.6 * size, 0.05 * size);
  ctx.lineTo(0.58 * size, 0.2 * size);
  ctx.lineTo(0.61 * size, 0.35 * size);
  ctx.lineTo(0.59 * size, 0.5 * size);
  ctx.stroke();

  ctx.strokeStyle = '#5A4A3A';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 3; i++) {
    const offset = (i - 1) * 0.01 * size;
    ctx.beginPath();
    ctx.moveTo(0.6 * size + offset, 0.05 * size);
    ctx.lineTo(0.58 * size + offset * 0.5, 0.5 * size);
    ctx.stroke();
  }

  ctx.fillStyle = '#C8B898';
  ctx.beginPath();
  ctx.ellipse(0.82 * size, 0.45 * size, 0.04 * size, 0.025 * size, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#8B7355';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.ellipse(0.82 * size, 0.45 * size, 0.04 * size, 0.025 * size, 0.3, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

export function generateCutawayGeometry(
  dim: VaseDimensions,
  thickness: number
): {
  outerSlice: THREE.BufferGeometry;
  innerSlice: THREE.BufferGeometry;
  coreSlice: THREE.BufferGeometry;
} {
  const outerProfile = generateBowlProfile(dim);

  const innerProfile: THREE.Vector2[] = [];
  for (let i = 0; i < outerProfile.length; i++) {
    const point = outerProfile[i].clone();
    const nextPoint = outerProfile[Math.min(i + 1, outerProfile.length - 1)];
    const dx = nextPoint.x - point.x;
    const dy = nextPoint.y - point.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len;
    const ny = dx / len;

    const innerX = point.x - nx * thickness;
    const innerY = point.y + ny * thickness;

    if (innerX > 0.5) {
      innerProfile.push(new THREE.Vector2(innerX, innerY));
    }
  }

  const midProfile: THREE.Vector2[] = [];
  const midThickness = thickness * 0.5;
  for (let i = 0; i < outerProfile.length; i++) {
    const point = outerProfile[i].clone();
    const nextPoint = outerProfile[Math.min(i + 1, outerProfile.length - 1)];
    const dx = nextPoint.x - point.x;
    const dy = nextPoint.y - point.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len;
    const ny = dx / len;

    const midX = point.x - nx * midThickness;
    const midY = point.y + ny * midThickness;

    if (midX > 0.5) {
      midProfile.push(new THREE.Vector2(midX, midY));
    }
  }

  const outerSlice = createSliceGeometry(outerProfile, dim.height);
  const coreSlice = createSliceGeometryBetween(midProfile, innerProfile, dim.height);
  const innerSlice = createInnerSliceGeometry(innerProfile, dim.height);

  return { outerSlice, innerSlice, coreSlice };
}

function createSliceGeometry(profile: THREE.Vector2[], height: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);

  for (let i = 0; i < profile.length; i++) {
    shape.lineTo(profile[i].x, profile[i].y);
  }

  shape.lineTo(0, height);
  shape.lineTo(0, 0);

  const geometry = new THREE.ShapeGeometry(shape);
  geometry.computeVertexNormals();
  return geometry;
}

function createSliceGeometryBetween(
  outerProfile: THREE.Vector2[],
  innerProfile: THREE.Vector2[],
  height: number
): THREE.BufferGeometry {
  const shape = new THREE.Shape();

  shape.moveTo(innerProfile[0].x, innerProfile[0].y);
  for (let i = 1; i < innerProfile.length; i++) {
    shape.lineTo(innerProfile[i].x, innerProfile[i].y);
  }

  for (let i = outerProfile.length - 1; i >= 0; i--) {
    shape.lineTo(outerProfile[i].x, outerProfile[i].y);
  }

  shape.lineTo(innerProfile[0].x, innerProfile[0].y);

  const geometry = new THREE.ShapeGeometry(shape);
  geometry.computeVertexNormals();
  return geometry;
}

function createInnerSliceGeometry(profile: THREE.Vector2[], height: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);

  for (let i = 0; i < profile.length; i++) {
    shape.lineTo(profile[i].x, profile[i].y);
  }

  shape.lineTo(0, height);
  shape.lineTo(0, 0);

  const geometry = new THREE.ShapeGeometry(shape);
  geometry.scale(-1, 1, 1);
  geometry.computeVertexNormals();
  return geometry;
}

export const BODY_THICKNESS = 0.25;
