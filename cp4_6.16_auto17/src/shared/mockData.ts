import { saveTrail, saveTrackPoint, savePOI } from './db';
import { v4 as uuidv4 } from 'uuid';

function generateMockTrailPoints(
  trailId: string,
  startLat: number,
  startLng: number,
  numPoints: number,
  distancePerPoint: number
) {
  const points = [];
  let currentLat = startLat;
  let currentLng = startLng;
  const startTime = Date.now() - numPoints * 5000;

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 0.8 + Math.random() * 0.2;
    const latDelta = (Math.sin(angle) * distancePerPoint) / 111000;
    const lngDelta = (Math.cos(angle) * distancePerPoint) / (111000 * Math.cos(currentLat * Math.PI / 180));

    currentLat += latDelta;
    currentLng += lngDelta;

    const elevation = 100 + i * 3 + Math.sin(i * 0.3) * 20 + Math.random() * 10;

    points.push({
      id: uuidv4(),
      trailId,
      lat: currentLat,
      lng: currentLng,
      elevation,
      timestamp: new Date(startTime + i * 5000),
    });
  }

  return points;
}

export async function initMockData() {
  const trail1Id = uuidv4();
  const trail2Id = uuidv4();
  const trail3Id = uuidv4();

  const trail1Points = generateMockTrailPoints(trail1Id, 39.9042, 116.4074, 40, 80);
  const trail2Points = generateMockTrailPoints(trail2Id, 39.9142, 116.4274, 50, 60);
  const trail3Points = generateMockTrailPoints(trail3Id, 39.8942, 116.3874, 35, 70);

  const calculateDistance = (points: { lat: number; lng: number }[]) => {
    let total = 0;
    const R = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    for (let i = 1; i < points.length; i++) {
      const dLat = toRad(points[i].lat - points[i - 1].lat);
      const dLng = toRad(points[i].lng - points[i - 1].lng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(points[i - 1].lat)) * Math.cos(toRad(points[i].lat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      total += R * c;
    }
    return total;
  };

  const calculateAvgElevation = (points: { elevation: number | null }[]) => {
    const elevations = points.filter(p => p.elevation !== null).map(p => p.elevation as number);
    if (elevations.length === 0) return 0;
    return elevations.reduce((sum, e) => sum + e, 0) / elevations.length;
  };

  const trail1 = await saveTrail({
    id: trail1Id,
    name: '香山公园徒步',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    distance: calculateDistance(trail1Points),
    avgElevation: calculateAvgElevation(trail1Points),
    isPublic: true,
    likes: 42,
  });

  const trail2