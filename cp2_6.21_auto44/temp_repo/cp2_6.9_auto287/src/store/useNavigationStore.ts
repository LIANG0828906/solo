import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { NavigationStore, Star, Waypoint, LogEntry, ObservationState, FleetState } from '../types';
import { NAVIGATION_CONSTANTS, SCENE_CONSTANTS } from '../utils/constants';

const initialObservation: ObservationState = {
  selectedStar: null,
  altitude: 45,
  azimuth: 0,
  cameraDistance: 15,
  cameraAzimuth: 0,
  cameraPolar: Math.PI / 4,
};

const initialFleet: FleetState = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  speed: NAVIGATION_CONSTANTS.FLEET_SPEED,
  currentWaypointIndex: 0,
  isMoving: false,
};

const initialState: Omit<NavigationStore, keyof {
  setViewMode: never;
  updateObservation: never;
  selectStar: never;
  addWaypoint: never;
  removeWaypoint: never;
  updateWaypoint: never;
  startFleet: never;
  stopFleet: never;
  updateFleetPosition: never;
  markWaypointPassed: never;
  setCurrentWaypointIndex: never;
  addLogEntry: never;
  removeLogEntry: never;
  toggleSidebar: never;
  clearAll: never;
}> = {
  viewMode: 'sky',
  observation: initialObservation,
  waypoints: [],
  fleet: initialFleet,
  logEntries: [],
  sidebarOpen: true,
  passedWaypoints: new Set<string>(),
};

export const useNavigationStore = create<NavigationStore>((set, get) => ({
  ...initialState,

  setViewMode: (mode: 'sky' | 'sea') => {
    set({ viewMode: mode });
  },

  updateObservation: (obs: Partial<ObservationState>) => {
    set((state) => ({
      observation: { ...state.observation, ...obs },
    }));
  },

  selectStar: (star: Star | null) => {
    set((state) => ({
      observation: { ...state.observation, selectedStar: star },
    }));
  },

  addWaypoint: (position: [number, number, number]) => {
    const { waypoints } = get();
    if (waypoints.length >= NAVIGATION_CONSTANTS.MAX_WAYPOINTS) return;

    const newWaypoint: Waypoint = {
      id: uuidv4(),
      position,
      name: `航点 ${waypoints.length + 1}`,
      createdAt: Date.now(),
    };

    set({
      waypoints: [...waypoints, newWaypoint],
    });
  },

  removeWaypoint: (id: string) => {
    const { waypoints, passedWaypoints, fleet } = get();
    const newPassed = new Set(passedWaypoints);
    newPassed.delete(id);
    
    const index = waypoints.findIndex((w) => w.id === id);
    let newCurrentIndex = fleet.currentWaypointIndex;
    if (index !== -1 && index < fleet.currentWaypointIndex) {
      newCurrentIndex = Math.max(0, fleet.currentWaypointIndex - 1);
    }

    set({
      waypoints: waypoints.filter((w) => w.id !== id),
      passedWaypoints: newPassed,
      fleet: { ...fleet, currentWaypointIndex: newCurrentIndex },
    });
  },

  updateWaypoint: (id: string, position: [number, number, number]) => {
    set((state) => ({
      waypoints: state.waypoints.map((w) =>
        w.id === id ? { ...w, position } : w
      ),
    }));
  },

  startFleet: () => {
    const { waypoints } = get();
    if (waypoints.length < 2) return;
    
    set((state) => ({
      fleet: { ...state.fleet, isMoving: true },
    }));
  },

  stopFleet: () => {
    set((state) => ({
      fleet: { ...state.fleet, isMoving: false },
    }));
  },

  updateFleetPosition: (pos: [number, number, number], rot?: [number, number, number]) => {
    set((state) => ({
      fleet: {
        ...state.fleet,
        position: pos,
        rotation: rot || state.fleet.rotation,
      },
    }));
  },

  markWaypointPassed: (id: string) => {
    set((state) => {
      const newPassed = new Set(state.passedWaypoints);
      newPassed.add(id);
      return { passedWaypoints: newPassed };
    });
  },

  setCurrentWaypointIndex: (index: number) => {
    set((state) => ({
      fleet: { ...state.fleet, currentWaypointIndex: index },
    }));
  },

  addLogEntry: (dataUrl: string, description: string) => {
    const { logEntries } = get();
    const newEntry: LogEntry = {
      id: uuidv4(),
      dataUrl,
      timestamp: Date.now(),
      description,
    };

    let newEntries = [newEntry, ...logEntries];
    if (newEntries.length > NAVIGATION_CONSTANTS.MAX_LOG_ENTRIES) {
      newEntries = newEntries.slice(0, NAVIGATION_CONSTANTS.MAX_LOG_ENTRIES);
    }

    set({ logEntries: newEntries });
  },

  removeLogEntry: (id: string) => {
    set((state) => ({
      logEntries: state.logEntries.filter((e) => e.id !== id),
    }));
  },

  toggleSidebar: () => {
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    }));
  },

  clearAll: () => {
    set({
      waypoints: [],
      logEntries: [],
      passedWaypoints: new Set<string>(),
      fleet: {
        ...initialFleet,
        position: [0, 0, 0],
      },
      observation: {
        ...initialObservation,
        cameraDistance: 15,
        cameraAzimuth: get().observation.cameraAzimuth,
        cameraPolar: get().viewMode === 'sea' ? Math.PI / 6 : Math.PI / 4,
      },
    });
  },
}));
