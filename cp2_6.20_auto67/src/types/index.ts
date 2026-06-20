export interface Star {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  temperature: number;
  magnitude: number;
  distance: number;
  spectralType: string;
  size: number;
}

export interface ConstellationLine {
  id: string;
  startStarId: string;
  endStarId: string;
  distance: number;
  createdAt: number;
}

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
}

export interface StarStore {
  stars: Star[];
  visibleStarCount: number;
  maxStars: number;
  selectedStarId: string | null;
  constellationLines: ConstellationLine[];
  isDragging: boolean;
  dragStartStarId: string | null;
  dragCurrentPosition: { x: number; y: number; z: number } | null;
  cameraState: CameraState;
  isFlying: boolean;
  fps: number;

  selectStar: (id: string | null) => void;
  addConstellationLine: (startId: string, endId: string) => boolean;
  removeLastLine: () => void;
  clearAllLines: () => void;
  setVisibleStarCount: (count: number) => void;
  setCameraState: (state: Partial<CameraState>) => void;
  startDragging: (starId: string) => void;
  updateDragPosition: (pos: { x: number; y: number; z: number }) => void;
  endDragging: (endStarId?: string) => void;
  cancelDragging: () => void;
  setIsFlying: (flying: boolean) => void;
  setFps: (fps: number) => void;
  findStarByName: (name: string) => Star | undefined;
  getStarById: (id: string) => Star | undefined;
}

export interface ScreenPosition {
  x: number;
  y: number;
}

export interface ConstellationExport {
  version: string;
  exportedAt: number;
  lines: Array<{
    startStar: {
      id: string;
      name: string;
      position: [number, number, number];
    };
    endStar: {
      id: string;
      name: string;
      position: [number, number, number];
    };
    distance: number;
  }>;
}
