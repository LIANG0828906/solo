import type { PathPoint, DrawPath, InkRegion } from '@/types';
import { GRID_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from '@/types';

export function smoothBezier(points: PathPoint[]): string {
  if (points.length < 2) {
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;
    }
    return '';
  }
  
  let d = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  
  return d;
}

export function optimizePoints(points: PathPoint[], threshold: number = 1): PathPoint[] {
  if (points.length <= 10000) return points;
  
  const result: PathPoint[] = [points[0]];
  
  for (let i = 1; i < points.length; i++) {
    const last = result[result.length - 1];
    const dist = Math.sqrt(
      Math.pow(points[i].x - last.x, 2) + 
      Math.pow(points[i].y - last.y, 2)
    );
    
    if (dist >= threshold) {
      result.push(points[i]);
    }
  }
  
  return result;
}

function isPointCoveredByPaths(px: number, py: number, paths: DrawPath[], tolerance: number = 6): boolean {
  for (const path of paths) {
    const halfWidth = path.strokeWidth / 2 + tolerance;
    
    for (let i = 0; i < path.points.length - 1; i++) {
      const p1 = path.points[i];
      const p2 = path.points[i + 1];
      
      const dist = distanceToSegment(px, py, p1.x, p1.y, p2.x, p2.y);
      
      if (dist <= halfWidth) {
        return true;
      }
    }
  }
  
  return false;
}

function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  let param = -1;
  if (lenSq !== 0) {
    param = dot / lenSq;
  }
  
  let xx: number, yy: number;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = px - xx;
  const dy = py - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
}

export function checkInkRegions(paths: DrawPath[], existingRegions: InkRegion[]): InkRegion[] {
  const cols = Math.ceil(CANVAS_WIDTH / GRID_SIZE);
  const rows = Math.ceil(CANVAS_HEIGHT / GRID_SIZE);
  const regions: InkRegion[] = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const regionX = col * GRID_SIZE;
      const regionY = row * GRID_SIZE;
      
      const existingRegion = existingRegions.find(
        r => r.x === regionX && r.y === regionY
      );
      
      if (existingRegion?.completed) {
        regions.push({ ...existingRegion, animating: false });
        continue;
      }
      
      const samplePoints = [
        [regionX + 10, regionY + 10],
        [regionX + 40, regionY + 10],
        [regionX + 70, regionY + 10],
        [regionX + 10, regionY + 40],
        [regionX + 40, regionY + 40],
        [regionX + 70, regionY + 40],
        [regionX + 10, regionY + 70],
        [regionX + 40, regionY + 70],
        [regionX + 70, regionY + 70],
      ];
      
      const allCovered = samplePoints.every(([px, py]) => 
        isPointCoveredByPaths(px, py, paths)
      );
      
      regions.push({
        x: regionX,
        y: regionY,
        completed: allCovered,
        animated: existingRegion?.animated || false,
        animating: allCovered && !existingRegion?.animated,
      });
    }
  }
  
  return regions;
}

export function formatTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}
