export interface Star {
  id: string;
  name: string;
  chineseName: string;
  ra: number;
  dec: number;
  magnitude: number;
  color: string;
  position: [number, number, number];
}

export interface Waypoint {
  id: string;
  position: [number, number, number];
  name: string;
  createdAt: number;
}

export interface FleetState {
  position: [number, number, number];
  rotation: [number, number, number];
  speed: number;
  currentWaypointIndex: number;
  isMoving: boolean;
}

export interface ObservationState {
  selectedStar: Star | null;
  altitude: number;
  azimuth: number;
  cameraDistance: number;
  cameraAzimuth: number;
  cameraPolar: number;
}

export interface LogEntry {
  id: string;
  dataUrl: string;
  timestamp: number;
  description: string;
}

export interface NavigationStore {
  viewMode: 'sky' | 'sea';
  observation: ObservationState;
  waypoints: Waypoint[];
  fleet: FleetState;
  logEntries: LogEntry[];
  sidebarOpen: boolean;
  passedWaypoints: Set<string>;
  
  setViewMode: (mode: 'sky' | 'sea') => void;
  updateObservation: (obs: Partial<ObservationState>) => void;
  selectStar: (star: Star | null) => void;
  addWaypoint: (position: [number, number, number]) => void;
  removeWaypoint: (id: string) => void;
  updateWaypoint: (id: string, position: [number, number, number]) => void;
  startFleet: () => void;
  stopFleet: () => void;
  updateFleetPosition: (pos: [number, number, number], rot?: [number, number, number]) => void;
  markWaypointPassed: (id: string) => void;
  setCurrentWaypointIndex: (index: number) => void;
  addLogEntry: (dataUrl: string, description: string) => void;
  removeLogEntry: (id: string) => void;
  toggleSidebar: () => void;
  clearAll: () => void;
}
