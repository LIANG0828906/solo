export type Vec3 = [number, number, number];

export type CellType = 'default' | 'liver' | 'neuron' | 'muscle';

export type OrganelleType = 'nucleus' | 'mitochondria' | 'er';

export interface Organelle {
  id: string;
  type: OrganelleType;
  position: Vec3;
  scale: number;
  color: string;
}

export interface MarkerData {
  id: string;
  type: 'start' | 'end';
  position: Vec3;
}

export interface PathData {
  id: string;
  startPoint: Vec3;
  endPoint: Vec3;
  controlPoints: Vec3[];
  speed: number;
}

export interface SceneParams {
  ambientLightIntensity: number;
  membraneOpacity: number;
  vesicleSize: number;
  trailLength: number;
}

export interface SceneState {
  cellType: CellType;
  organelles: Organelle[];
  paths: PathData[];
  activePathId: string | null;
  pendingStartPoint: Vec3 | null;
  isPlaying: boolean;
  progress: number;
  params: SceneParams;
  updateOrganelle: (id: string, data: Partial<Organelle>) => void;
  addPath: (start: Vec3, end: Vec3) => void;
  removePath: (id: string) => void;
  updatePathControlPoint: (pathId: string, index: number, position: Vec3) => void;
  updatePathSpeed: (pathId: string, speed: number) => void;
  setCellType: (type: CellType) => void;
  updateParams: (params: Partial<SceneParams>) => void;
  setPlaying: (playing: boolean) => void;
  setProgress: (progress: number) => void;
  setPendingStartPoint: (point: Vec3 | null) => void;
  resetScene: () => void;
  exportConfig: () => ExportConfig;
}

export interface ExportConfig {
  cellType: CellType;
  organelles: Array<{
    id: string;
    type: OrganelleType;
    position: Vec3;
    scale: number;
    color: string;
  }>;
  paths: Array<{
    id: string;
    startPoint: Vec3;
    endPoint: Vec3;
    controlPoints: Vec3[];
    speed: number;
  }>;
  params: SceneParams;
  exportTime: string;
}
