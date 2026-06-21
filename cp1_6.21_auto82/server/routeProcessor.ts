import { v4 as uuidv4 } from "uuid";

interface Route {
  id: string;
  name: string;
  color: string;
  distance: number;
  duration: number;
  congestionIndex: number;
  isRecommended: boolean;
  path: [number, number][];
}

function generatePath(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  count: number
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const jitter = (1 - Math.abs(2 * t - 1)) * 0.008;
    const lat = startLat + (endLat - startLat) * t + (Math.random() - 0.5) * jitter * 2;
    const lng = startLng + (endLng - startLng) * t + (Math.random() - 0.5) * jitter * 2;
    points.push([lat, lng]);
  }
  points[0] = [startLat, startLng];
  points[points.length - 1] = [endLat, endLng];
  return points;
}

export function calculateRoutes(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Route[] {
  const straightDist = Math.sqrt(
    (endLat - startLat) ** 2 + (endLng - startLng) ** 2
  );
  const baseKm = straightDist * 111;

  const fastest: Route = {
    id: uuidv4(),
    name: "最快路线",
    color: "#2196F3",
    distance: parseFloat((baseKm * 1.15).toFixed(1)),
    duration: parseFloat((baseKm * 1.15 / 0.7).toFixed(0)),
    congestionIndex: 20,
    isRecommended: true,
    path: generatePath(startLat, startLng, endLat, endLng, 10),
  };

  const shortest: Route = {
    id: uuidv4(),
    name: "最短路线",
    color: "#4CAF50",
    distance: parseFloat((baseKm * 1.0).toFixed(1)),
    duration: parseFloat((baseKm * 1.0 / 0.5).toFixed(0)),
    congestionIndex: 50,
    isRecommended: false,
    path: generatePath(startLat, startLng, endLat, endLng, 8),
  };

  const avoidCongestion: Route = {
    id: uuidv4(),
    name: "避开拥堵",
    color: "#FF9800",
    distance: parseFloat((baseKm * 1.3).toFixed(1)),
    duration: parseFloat((baseKm * 1.3 / 0.6).toFixed(0)),
    congestionIndex: 15,
    isRecommended: false,
    path: generatePath(startLat, startLng, endLat, endLng, 12),
  };

  return [fastest, shortest, avoidCongestion];
}
