export interface TrackPoint {
  id: string;
  trailId: string;
  lat: number;
  lng: number;
  elevation: number | null;
  timestamp: Date;
}

export interface POI {
  id: string;
  trailId: string | null;
  name: string;
  description: string;
  lat: number;
  lng: number;
  createdAt: Date;
}

export interface Trail {
  id: string;
  name: string;
  createdAt: Date;
  distance: number;
  avgElevation: number;
  isPublic: boolean;
  likes: number;
}

export interface TrailWithPoints extends Trail {
  points: TrackPoint[];
}
