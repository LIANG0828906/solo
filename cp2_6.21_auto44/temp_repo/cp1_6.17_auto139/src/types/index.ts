export interface Point {
  x: number;
  y: number;
  timestamp: number;
  speed: number;
}

export interface Tag {
  id: string;
  text: string;
  pointIndex: number;
  x: number;
  y: number;
}

export interface Route {
  id: string;
  name: string;
  date: string;
  points: Point[];
  tags: Tag[];
}

export interface AppState {
  routes: Route[];
  currentRouteId: string | null;
  currentTime: number;
  isPlaying: boolean;
  speed: number;
  selectedTagId: string | null;
}
