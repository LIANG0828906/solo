import { TrackPoint } from './types';

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateTotalDistance(points: TrackPoint[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(
      points[i - 1].lat, points[i - 1].lng,
      points[i].lat, points[i].lng
    );
  }
  return total;
}

export function calculateAvgElevation(points: TrackPoint[]): number {
  const elevations = points.filter(p => p.elevation !== null).map(p => p.elevation as number);
  if (elevations.length === 0) return 0;
  return elevations.reduce((sum, e) => sum + e, 0) / elevations.length;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return (meters / 1000).toFixed(2) + ' km';
  }
  return Math.round(meters) + ' m';
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}小时${mins}分`;
  }
  if (mins > 0) {
    return `${mins}分${secs}秒`;
  }
  return `${secs}秒`;
}

export function exportToGPX(trailName: string, points: TrackPoint[]): string {
  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TrailScope" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${escapeXml(trailName)}</name>
    <trkseg>
`;
  
  const gpxPoints = points.map(point => {
    const ele = point.elevation !== null ? `      <ele>${point.elevation}</ele>\n` : '';
    const time = point.timestamp ? `      <time>${new Date(point.timestamp).toISOString()}</time>\n` : '';
    return `      <trkpt lat="${point.lat}" lon="${point.lng}">\n${ele}${time}    </trkpt>`;
  }).join('\n');
  
  const gpxFooter = `
    </trkseg>
  </trk>
</gpx>`;

  return gpxHeader + gpxPoints + gpxFooter;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function downloadFile(filename: string, content: string, mimeType: string = 'text/xml'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function simplifyTrackPoints(points: TrackPoint[], tolerance: number = 5): TrackPoint[] {
  if (points.length <= 2) return points;
  
  const result: TrackPoint[] = [points[0]];
  let lastAdded = points[0];
  
  for (let i = 1; i < points.length - 1; i++) {
    const dist = haversineDistance(lastAdded.lat, lastAdded.lng, points[i].lat, points[i].lng);
    if (dist >= tolerance) {
      result.push(points[i]);
      lastAdded = points[i];
    }
  }
  
  result.push(points[points.length - 1]);
  return result;
}

export function getBounds(points: { lat: number; lng: number }[]): [[number, number], [number, number]] | null {
  if (points.length === 0) return null;
  
  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;
  
  for (const point of points) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
  }
  
  return [[minLat, minLng], [maxLat, maxLng]];
}
