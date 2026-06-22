import { Star, Camera, Settings, getStarById } from './starfield';

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface TrailNode {
  offset: number;
  progress: number;
}

interface Trail {
  starId: number;
  controlPoints: {
    p0: Vec3;
    p1: Vec3;
    p2: Vec3;
    p3: Vec3;
  };
  duration: number;
  startTime: number;
  nodes: TrailNode[];
  lastNodeTime: number;
}

const trails: Trail[] = [];
const CURVE_SAMPLES = 60;
const NODE_INTERVAL = 2;

function bezierPoint(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number): Vec3 {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
    z: mt * mt * mt * p0.z + 3 * mt * mt * t * p1.z + 3 * mt * t * t * p2.z + t * t * t * p3.z,
  };
}

function projectPoint(point: Vec3, camera: Camera, centerX: number, centerY: number): { x: number; y: number; z: number } {
  const { rotationX, rotationY, zoom, focalLength } = camera;
  const cosY = Math.cos(rotationY);
  const sinY = Math.sin(rotationY);
  const cosX = Math.cos(rotationX);
  const sinX = Math.sin(rotationX);

  let x = point.x * cosY - point.z * sinY;
  let z = point.x * sinY + point.z * cosY;
  let y = point.y * cosX - z * sinX;
  z = point.y * sinX + z * cosX;

  const perspective = focalLength / (z + focalLength);
  return {
    x: centerX + x * perspective * zoom,
    y: centerY + y * perspective * zoom,
    z: z,
  };
}

function predictStarPosition(star: Star, time: number, settings: Settings): Vec3 {
  const speedMultiplier = settings.rotationSpeed / 0.03;
  const angle = star.angle + star.angularSpeed * speedMultiplier * time;
  return {
    x: star.orbitRadius * Math.cos(angle),
    y: star.height,
    z: star.orbitRadius * Math.sin(angle),
  };
}

export function addTrail(star: Star, settings: Settings): void {
  const existingIndex = trails.findIndex(t => t.starId === star.id);
  if (existingIndex !== -1) {
    trails.splice(existingIndex, 1);
    return;
  }

  if (trails.length >= 5) {
    trails.shift();
  }

  const duration = settings.trailDuration;
  const p0 = { x: star.x, y: star.y, z: star.z };
  const p3 = predictStarPosition(star, duration, settings);
  
  const midTime = duration * 0.5;
  const midPos = predictStarPosition(star, midTime, settings);
  
  const spiralOffset = 30;
  const perpX = -p0.z / Math.max(star.orbitRadius, 1) * spiralOffset;
  const perpZ = p0.x / Math.max(star.orbitRadius, 1) * spiralOffset;
  
  const p1 = {
    x: midPos.x + perpX * 0.5,
    y: midPos.y + 20,
    z: midPos.z + perpZ * 0.5,
  };
  
  const p2 = {
    x: midPos.x - perpX * 0.3,
    y: midPos.y - 10,
    z: midPos.z - perpZ * 0.3,
  };

  trails.push({
    starId: star.id,
    controlPoints: { p0, p1, p2, p3 },
    duration: duration,
    startTime: performance.now() / 1000,
    nodes: [],
    lastNodeTime: performance.now() / 1000,
  });
}

export function updateTrails(currentTime: number, settings: Settings): void {
  const time = currentTime / 1000;

  for (let i = trails.length - 1; i >= 0; i--) {
    const trail = trails[i];
    const elapsed = time - trail.startTime;

    if (elapsed > trail.duration * 2) {
      trails.splice(i, 1);
      continue;
    }

    const star = getStarById(trail.starId);
    if (star) {
      trail.controlPoints.p0 = { x: star.x, y: star.y, z: star.z };
      trail.controlPoints.p3 = predictStarPosition(star, trail.duration, settings);
      
      const midTime = trail.duration * 0.5;
      const midPos = predictStarPosition(star, midTime, settings);
      const spiralOffset = 30;
      const perpX = -star.z / Math.max(star.orbitRadius, 1) * spiralOffset;
      const perpZ = star.x / Math.max(star.orbitRadius, 1) * spiralOffset;
      
      trail.controlPoints.p1 = {
        x: midPos.x + perpX * 0.5,
        y: midPos.y + 20,
        z: midPos.z + perpZ * 0.5,
      };
      trail.controlPoints.p2 = {
        x: midPos.x - perpX * 0.3,
        y: midPos.y - 10,
        z: midPos.z - perpZ * 0.3,
      };
    }

    if (time - trail.lastNodeTime >= NODE_INTERVAL && elapsed < trail.duration) {
      trail.nodes.push({
        offset: elapsed,
        progress: 0,
      });
      trail.lastNodeTime = time;
    }

    for (let j = trail.nodes.length - 1; j >= 0; j--) {
      const node = trail.nodes[j];
      node.progress = (elapsed - node.offset) / trail.duration;
      if (node.progress >= 1) {
        trail.nodes.splice(j, 1);
      }
    }
  }
}

export function drawTrails(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  centerX: number,
  centerY: number,
  settings: Settings
): void {
  const samples = settings.isMobile ? 30 : CURVE_SAMPLES;

  for (const trail of trails) {
    const { p0, p1, p2, p3 } = trail.controlPoints;

    ctx.beginPath();
    ctx.lineWidth = 1.5;

    const projectedPoints: { x: number; y: number; z: number; t: number }[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const point = bezierPoint(p0, p1, p2, p3, t);
      const projected = projectPoint(point, camera, centerX, centerY);
      projectedPoints.push({ ...projected, t });
    }

    for (let i = 0; i < projectedPoints.length; i++) {
      const point = projectedPoints[i];
      const alpha = 1 - point.t;
      
      ctx.strokeStyle = `rgba(255, 107, 107, ${alpha})`;
      
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        const prev = projectedPoints[i - 1];
        const prevAlpha = 1 - prev.t;
        const gradient = ctx.createLinearGradient(prev.x, prev.y, point.x, point.y);
        gradient.addColorStop(0, `rgba(255, 107, 107, ${prevAlpha})`);
        gradient.addColorStop(1, `rgba(255, 107, 107, ${alpha})`);
        ctx.strokeStyle = gradient;
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
      }
    }

    for (const node of trail.nodes) {
      if (node.progress < 0 || node.progress >= 1) continue;
      
      const point = bezierPoint(p0, p1, p2, p3, node.progress);
      const projected = projectPoint(point, camera, centerX, centerY);
      
      const nodeAlpha = 1 - node.progress;
      
      const glowGradient = ctx.createRadialGradient(
        projected.x, projected.y, 0,
        projected.x, projected.y, 12
      );
      glowGradient.addColorStop(0, `rgba(255, 107, 107, ${nodeAlpha})`);
      glowGradient.addColorStop(0.5, `rgba(255, 107, 107, ${nodeAlpha * 0.5})`);
      glowGradient.addColorStop(1, 'transparent');
      
      ctx.beginPath();
      ctx.fillStyle = glowGradient;
      ctx.arc(projected.x, projected.y, 12, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 107, 107, ${nodeAlpha})`;
      ctx.arc(projected.x, projected.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function getTrailedStarIds(): number[] {
  return trails.map(t => t.starId);
}

export function clearTrails(): void {
  trails.length = 0;
}

export { trails };
