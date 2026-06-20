export interface Log {
  id: string;
  name: string;
  date: string;
  description: string;
  photos: string[];
  lat: number;
  lng: number;
  createdAt: string;
  updatedAt: string;
}

export interface Route {
  id: string;
  name: string;
  logIds: string[];
  createdAt: string;
}

export interface MarkerInfo {
  log: Log;
  isNew?: boolean;
}
