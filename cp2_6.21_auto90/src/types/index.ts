export type GeometryType = 'dingBody' | 'ear' | 'leg' | 'pattern' | 'inscription';

export interface SubMeshData {
  geometryType: GeometryType;
  position: [number, number, number];
  rotation?: [number, number, number];
}

export interface PartData {
  id: string;
  name: string;
  color: string;
  defaultPosition: [number, number, number];
  explodeAxis: [number, number, number];
  label: string;
  explodeTargetOffset: number;
  subMeshes: SubMeshData[];
}

export interface ExplosionState {
  partOffsets: Record<string, number>;
  selectedParts: string[];
  autoRotate: boolean;
  isAnimating: boolean;
  selectedCount: number;
  setPartOffset: (partId: string, value: number) => void;
  togglePartSelection: (partId: string) => void;
  toggleAutoRotate: () => void;
  explodeAll: () => Promise<void>;
  resetAll: () => Promise<void>;
}
