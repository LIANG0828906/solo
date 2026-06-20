import { get, set, del, keys, createStore, UseStore } from 'idb-keyval';
import { Trail, TrackPoint, POI, TrailWithPoints } from './types';
import { v4 as uuidv4 } from 'uuid';

const trailsStore: UseStore = createStore('trailscope-db', 'trails');
const trackPointsStore: UseStore = createStore('trailscope-db', 'trackPoints');
const poisStore: UseStore = createStore('trailscope-db', 'pois');

export async function saveTrail(trail: Omit<Trail, 'id'> & { id?: string }): Promise<Trail> {
  const id = trail.id || uuidv4();
  const fullTrail: Trail = {
    ...trail,
    id,
    createdAt: trail.createdAt ? new Date(trail.createdAt) : new Date(),
  } as Trail;
  await set(id, fullTrail, trailsStore);
  return fullTrail;
}

export async function getTrail(id: string): Promise<Trail | undefined> {
  const trail = await get<Trail>(id, trailsStore);
  return trail;
}

export async function getAllTrails(): Promise<Trail[]> {
  const allKeys = await keys(trailsStore);
  const trails: Trail[] = [];
  for (const key of allKeys) {
    const trail = await get<Trail>(key as string, trailsStore);
    if (trail) {
      trails.push(trail);
    }
  }
  return trails.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getPublicTrails(): Promise<Trail[]> {
  const allTrails = await getAllTrails();
  return allTrails.filter(t => t.isPublic);
}

export async function deleteTrail(id: string): Promise<void> {
  await del(id, trailsStore);
  const allKeys = await keys(trackPointsStore);
  for (const key of allKeys) {
    const point = await get<TrackPoint>(key as string, trackPointsStore);
    if (point && point.trailId === id) {
      await del(key as string, trackPointsStore);
    }
  }
  const poiKeys = await keys(poisStore);
  for (const key of poiKeys) {
    const poi = await get<POI>(key as string, poisStore);
    if (poi && poi.trailId === id) {
      await del(key as string, poisStore);
    }
  }
}

export async function saveTrackPoint(point: Omit<TrackPoint, 'id'> & { id?: string }): Promise<TrackPoint> {
  const id = point.id || uuidv4();
  const fullPoint: TrackPoint = {
    ...point,
    id,
    timestamp: point.timestamp ? new Date(point.timestamp) : new Date(),
  } as TrackPoint;
  await set(id, fullPoint, trackPointsStore);
  return fullPoint;
}

export async function saveTrackPointsBatch(points: Omit<TrackPoint, 'id'>[]): Promise<TrackPoint[]> {
  const saved: TrackPoint[] = [];
  for (const point of points) {
    const savedPoint = await saveTrackPoint(point);
    saved.push(savedPoint);
  }
  return saved;
}

export async function getTrackPoints(trailId: string): Promise<TrackPoint[]> {
  const allKeys = await keys(trackPointsStore);
  const points: TrackPoint[] = [];
  for (const key of allKeys) {
    const point = await get<TrackPoint>(key as string, trackPointsStore);
    if (point && point.trailId === trailId) {
      points.push(point);
    }
  }
  return points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export async function getTrailWithPoints(trailId: string): Promise<TrailWithPoints | null> {
  const trail = await getTrail(trailId);
  if (!trail) return null;
  const points = await getTrackPoints(trailId);
  return { ...trail, points };
}

export async function savePOI(poi: Omit<POI, 'id' | 'createdAt'> & { id?: string; createdAt?: Date }): Promise<POI> {
  const id = poi.id || uuidv4();
  const fullPOI: POI = {
    ...poi,
    id,
    createdAt: poi.createdAt ? new Date(poi.createdAt) : new Date(),
  } as POI;
  await set(id, fullPOI, poisStore);
  return fullPOI;
}

export async function getPOIsByTrail(trailId: string | null): Promise<POI[]> {
  const allKeys = await keys(poisStore);
  const pois: POI[] = [];
  for (const key of allKeys) {
    const poi = await get<POI>(key as string, poisStore);
    if (poi && poi.trailId === trailId) {
      pois.push(poi);
    }
  }
  return pois.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getAllPOIs(): Promise<POI[]> {
  const allKeys = await keys(poisStore);
  const pois: POI[] = [];
  for (const key of allKeys) {
    const poi = await get<POI>(key as string, poisStore);
    if (poi) {
      pois.push(poi);
    }
  }
  return pois;
}

export async function deletePOI(id: string): Promise<void> {
  await del(id, poisStore);
}

export async function updatePOI(id: string, updates: Partial<POI>): Promise<POI | null> {
  const poi = await get<POI>(id, poisStore);
  if (!poi) return null;
  const updated = { ...poi, ...updates };
  await set(id, updated, poisStore);
  return updated;
}

export async function likeTrail(trailId: string): Promise<Trail | null> {
  const trail = await getTrail(trailId);
  if (!trail) return null;
  const updated = { ...trail, likes: trail.likes + 1 };
  await set(trailId, updated, trailsStore);
  return updated;
}

export async function toggleTrailPublic(trailId: string): Promise<Trail | null> {
  const trail = await getTrail(trailId);
  if (!trail) return null;
  const updated = { ...trail, isPublic: !trail.isPublic };
  await set(trailId, updated, trailsStore);
  return updated;
}
