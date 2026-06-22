import axios from "axios";

export type RoutePoint = [number, number];

export interface Route {
  id: string;
  name: string;
  color: string;
  distance: number;
  duration: number;
  congestionIndex: number;
  isRecommended: boolean;
  path: RoutePoint[];
}

export async function fetchRoutes(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<Route[]> {
  const response = await axios.post<Route[]>("/api/routes", {
    startLat,
    startLng,
    endLat,
    endLng,
  });
  return response.data;
}

const KNOWN_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  北京站: { lat: 39.9025, lng: 116.427 },
  天安门: { lat: 39.9087, lng: 116.3975 },
  首都机场: { lat: 40.0802, lng: 116.5855 },
  西单: { lat: 39.9133, lng: 116.374 },
  国贸: { lat: 39.9089, lng: 116.4594 },
};

export async function geocodeLocation(
  location: string
): Promise<{ lat: number; lng: number }> {
  const known = KNOWN_LOCATIONS[location];
  if (known) {
    return known;
  }
  return {
    lat: 39.9042 + (Math.random() - 0.5) * 0.1,
    lng: 116.4074 + (Math.random() - 0.5) * 0.1,
  };
}
