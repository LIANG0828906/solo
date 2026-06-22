import { XMLParser } from 'fast-xml-parser';

export interface GPXPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: string;
}

export interface GPXResult {
  points: GPXPoint[];
  distance: number;
  elevationGain: number;
  elevationLoss: number;
  movingTime: number;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function parseISO(time?: string): number | null {
  if (!time) return null;
  const t = Date.parse(time);
  return isNaN(t) ? null : t;
}

export function parseGPX(gpxContent: string): GPXResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    allowBooleanAttributes: true,
    parseTagValue: true,
    parseAttributeValue: true,
  });

  const json = parser.parse(gpxContent);
  const gpx = json?.gpx;
  if (!gpx) {
    throw new Error('无效的 GPX 文件');
  }

  const rawPoints: GPXPoint[] = [];

  const trk = gpx.trk;
  if (trk) {
    const trks = Array.isArray(trk) ? trk : [trk];
    for (const t of trks) {
      const trkseg = t.trkseg;
      if (!trkseg) continue;
      const segs = Array.isArray(trkseg) ? trkseg : [trkseg];
      for (const seg of segs) {
        const trkpt = seg.trkpt;
        if (!trkpt) continue;
        const pts = Array.isArray(trkpt) ? trkpt : [trkpt];
        for (const p of pts) {
          if (p['@_lat'] !== undefined && p['@_lon'] !== undefined) {
            rawPoints.push({
              lat: Number(p['@_lat']),
              lon: Number(p['@_lon']),
              ele: p.ele !== undefined ? Number(p.ele) : undefined,
              time: p.time,
            });
          }
        }
      }
    }
  }

  const rte = gpx.rte;
  if (rte && rawPoints.length === 0) {
    const rtes = Array.isArray(rte) ? rte : [rte];
    for (const r of rtes) {
      const rtept = r.rtept;
      if (!rtept) continue;
      const pts = Array.isArray(rtept) ? rtept : [rtept];
      for (const p of pts) {
        if (p['@_lat'] !== undefined && p['@_lon'] !== undefined) {
          rawPoints.push({
            lat: Number(p['@_lat']),
            lon: Number(p['@_lon']),
            ele: p.ele !== undefined ? Number(p.ele) : undefined,
            time: p.time,
          });
        }
      }
    }
  }

  if (rawPoints.length === 0) {
    throw new Error('GPX 中未找到轨迹点');
  }

  let distance = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  let movingTime = 0;

  for (let i = 1; i < rawPoints.length; i++) {
    const prev = rawPoints[i - 1];
    const cur = rawPoints[i];
    distance += haversine(prev.lat, prev.lon, cur.lat, cur.lon);
    if (prev.ele !== undefined && cur.ele !== undefined) {
      const diff = cur.ele - prev.ele;
      if (diff > 0) {
        elevationGain += diff;
      } else {
        elevationLoss += Math.abs(diff);
      }
    }
    const t1 = parseISO(prev.time);
    const t2 = parseISO(cur.time);
    if (t1 !== null && t2 !== null && t2 > t1) {
      movingTime += (t2 - t1) / 1000;
    }
  }

  if (movingTime === 0) {
    movingTime = distance / 5;
  }

  return {
    points: rawPoints,
    distance: Math.round(distance),
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(elevationLoss),
    movingTime: Math.round(movingTime),
  };
}
