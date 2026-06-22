export interface Building {
  id: string;
  position: [number, number, number];
  width: number;
  height: number;
  depth: number;
  color: string;
}

export type CameraMode = 'top45' | 'south' | 'free';

export interface SceneState {
  buildings: Building[];
  selectedBuildingId: string | null;
  timeOfDay: number;
  cameraMode: CameraMode;
  selectBuilding: (id: string | null) => void;
  updateBuilding: (id: string, updates: Partial<Building>) => void;
  setTimeOfDay: (time: number) => void;
  setCameraMode: (mode: CameraMode) => void;
}

export interface ShadowPolygon {
  points: [number, number][];
  buildingId: string;
}
