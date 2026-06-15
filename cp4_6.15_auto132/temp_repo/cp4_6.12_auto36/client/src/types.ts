export interface Route {
  id: string;
  name: string;
  distance: number;
  lightingRating: number;
  safetyRating: number;
  routeType: 'riverside' | 'park' | 'street';
  coordinates: [number, number][];
  recentReports: number;
  userTag?: string;
  createdAt: number;
}

export interface Report {
  id: string;
  type: 'streetlight' | 'stray_dog' | 'suspicious' | 'pothole';
  severity: 'low' | 'medium' | 'high';
  coordinates: [number, number];
  createdAt: number;
  expiresAt: number;
}

export type ReportType = Report['type'];
export type SeverityLevel = Report['severity'];
export type RouteType = Route['routeType'];
