import { TrajectoryPoint, Platform, Spike, HazardZone } from '@/types/shared';
import { segmentIntersectsRect, segmentIntersectsPolygon, getTriangleVertices, pointInRect, pointInTriangle } from './geometry';

export function detectHazards(points:TrajectoryPoint[], platforms:Platform[], spikes:Spike[], canvasW:number, canvasH:number): HazardZone[] {
  const zones: HazardZone[] = [];
  if (points.length < 2) return zones;
  type PendingZone = { type: HazardZone['type']; startIndex: number; endIndex: number; collisionX: number; collisionY: number; elementId?: string };
  let pending: PendingZone | null = null;
  let idCounter = 0;
  const genId = (): string => `hz_${Date.now()}_${idCounter++}`;
  const finalizePending = (): void => {
    if (pending) {
      zones.push({ ...pending, id: genId() });
      pending = null;
    }
  };
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const hit = checkSegment(a, b, i, spikes, canvasW, canvasH);
    if (hit) {
      if (pending && pending.type === hit.type && pending.elementId === hit.elementId && pending.endIndex === i) {
        pending.endIndex = i + 1;
        pending.collisionX = hit.collisionX;
        pending.collisionY = hit.collisionY;
      } else {
        finalizePending();
        pending = {
          type: hit.type,
          startIndex: i,
          endIndex: i + 1,
          collisionX: hit.collisionX,
          collisionY: hit.collisionY,
          elementId: hit.elementId,
        };
      }
    }
  }
  finalizePending();
  return zones;
}

type HitResult = { type: HazardZone['type']; collisionX: number; collisionY: number; elementId?: string };

function checkSegment(a:TrajectoryPoint, b:TrajectoryPoint, segIndex:number, spikes:Spike[], canvasW:number, canvasH:number): HitResult | null {
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;
  const aOutOfBounds = a.x < 0 || a.x > canvasW || a.y < 0 || a.y > canvasH;
  const bOutOfBounds = b.x < 0 || b.x > canvasW || b.y < 0 || b.y > canvasH;
  if (aOutOfBounds || bOutOfBounds) {
    return { type: 'out_of_bounds', collisionX: aOutOfBounds ? a.x : b.x, collisionY: aOutOfBounds ? a.y : b.y };
  }
  for (const spike of spikes) {
    const verts = getTriangleVertices(spike.x, spike.y, spike.size, spike.rotation);
    const aInTri = pointInTriangle(a.x, a.y, verts);
    const bInTri = pointInTriangle(b.x, b.y, verts);
    const segHit = segmentIntersectsPolygon(a.x, a.y, b.x, b.y, verts);
    if (aInTri || bInTri || segHit) {
      return { type: 'spike_hit', collisionX: aInTri ? a.x : (bInTri ? b.x : midX), collisionY: aInTri ? a.y : (bInTri ? b.y : midY), elementId: spike.id };
    }
  }
  return null;
}
