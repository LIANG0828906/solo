export interface Record {
  id: string;
  timestamp: number;
  description: string;
  imageUrl: string;
}

export interface Waypoint {
  id: string;
  x: number;
  y: number;
  elevation: number;
  records: Record[];
  createdAt: number;
}

export interface RouteData {
  waypoints: Waypoint[];
  routeCoordinates: { x: number; y: number; elevation: number }[];
  exportedAt: number;
}

export interface Ripple {
  id: string;
  x: number;
  y: number;
  startTime: number;
}
