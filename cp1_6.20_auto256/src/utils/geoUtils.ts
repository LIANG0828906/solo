export interface LatLng {
  lat: number;
  lng: number;
}

export interface ScreenCoord {
  x: number;
  y: number;
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function geoToScreen(
  geo: LatLng,
  center: LatLng,
  scale: number,
  canvasWidth: number,
  canvasHeight: number
): ScreenCoord {
  const x = canvasWidth / 2 + (geo.lng - center.lng) * scale;
  const y = canvasHeight / 2 - (geo.lat - center.lat) * scale;
  return { x, y };
}

export function screenToGeo(
  screen: ScreenCoord,
  center: LatLng,
  scale: number,
  canvasWidth: number,
  canvasHeight: number
): LatLng {
  const lng = center.lng + (screen.x - canvasWidth / 2) / scale;
  const lat = center.lat - (screen.y - canvasHeight / 2) / scale;
  return { lat, lng };
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function getBearing(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const dLng = toLng - fromLng;
  const y = Math.sin(dLng) * Math.cos(toLat);
  const x =
    Math.cos(fromLat) * Math.sin(toLat) -
    Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLng);
  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;
  return bearing;
}
