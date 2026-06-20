export interface FossilDetail {
  id: string;
  speciesName: string;
  latinName: string;
  period: string;
  location: string;
  description: string;
  reconstructionImageData?: string;
}

export interface SandParticle {
  id: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  alpha: number;
  removing: boolean;
  removeProgress: number;
  burstParticles?: BurstParticle[];
}

export interface BurstParticle {
  ox: number;
  oy: number;
  oz: number;
  dx: number;
  dy: number;
  dz: number;
  life: number;
}

export interface StarParticle {
  x: number;
  y: number;
  z: number;
  size: number;
  alpha: number;
  drift: number;
}

export type BoneType = 'skull' | 'spine' | 'rib' | 'pelvis' | 'femur' | 'tibia' | 'fibula' | 'humerus' | 'radius' | 'ulna';

export interface BoneFragment {
  id: number;
  name: BoneType;
  x: number;
  y: number;
  z: number;
  originalX: number;
  originalY: number;
  originalZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  targetRotX: number;
  targetRotY: number;
  targetRotZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  length: number;
  shape: 'cylinder' | 'box' | 'compound';
  radius: number;
  cleaned: boolean;
  assembled: boolean;
  glowUntil: number;
  assembleAnimation: number;
  liftOffset: number;
}

export interface ToolSettings {
  brushSize: number;
  sandHardness: number;
}

export interface AssemblyRipple {
  x: number;
  y: number;
  z: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FossilStoreState {
  sandParticles: SandParticle[];
  starParticles: StarParticle[];
  boneFragments: BoneFragment[];
  allCleaned: boolean;
  fullyAssembled: boolean;
  assemblyRipples: AssemblyRipple[];
  toolSettings: ToolSettings;
  fossilDetail: FossilDetail | null;
  fossilDetailLoading: boolean;
  selectedBoneId: number | null;
  initScene: () => void;
  removeParticlesInRadius: (worldX: number, worldZ: number, dt: number) => number;
  checkBoneCollision: (worldX: number, worldZ: number) => boolean;
  triggerAssembly: () => void;
  setToolSettings: (patch: Partial<ToolSettings>) => void;
  fetchFossilDetail: (id: string) => Promise<void>;
  resetScene: () => void;
  updateAnimations: (dt: number, now: number) => void;
}

export const FOSSIL_ID = 'trex-001';
export const SANDBOX_SIZE = 30;
export const SAND_COUNT = 500;
export const STAR_COUNT = 50;
export const BONE_COUNT = 10;
export const MAX_REMOVE_PER_SEC = 30;
