export interface Vector2D {
  x: number;
  y: number;
}

export interface PendulumState {
  pivot: Vector2D;
  angle: number;
  angularVelocity: number;
  ropeLength: number;
  bobRadius: number;
  bobPosition: Vector2D;
}

export type MechanismType = 'trigger' | 'portal' | 'moving_plank' | 'goal' | 'gem';

export interface BaseMechanism {
  id: string;
  type: MechanismType;
  position: Vector2D;
  active: boolean;
  triggered?: boolean;
  basePosition?: Vector2D;
}

export interface RectMechanism extends BaseMechanism {
  shape: 'rectangle';
  width: number;
  height: number;
  rotation: number;
}

export interface CircleMechanism extends BaseMechanism {
  shape: 'circle';
  radius: number;
}

export interface PortalMechanism extends CircleMechanism {
  pairedPortalId: string;
}

export interface MovingPlank extends RectMechanism {
  motionAxis: 'x' | 'y';
  motionRange: number;
  motionPeriod: number;
  phase: number;
}

export type Mechanism = RectMechanism | CircleMechanism | PortalMechanism | MovingPlank;

export interface CollisionResult {
  collided: boolean;
  mechanism?: Mechanism;
  point?: Vector2D;
  normal?: Vector2D;
  penetrationDepth?: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  pivot: Vector2D;
  initialAngle: number;
  ropeLength: number;
  timeLimit?: number;
  mechanisms: Mechanism[];
  totalGems: number;
}

export interface Particle {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface GameStoreState {
  currentView: 'menu' | 'playing';
  currentLevelIndex: number;
  completedLevels: number[];
  interactionMode: 'idle' | 'dragging' | 'swinging';
  dragStart: Vector2D | null;
  dragCurrent: Vector2D | null;
  pendulum: PendulumState;
  mechanisms: Mechanism[];
  collectedGems: number;
  swingCount: number;
  timeRemaining: number;
  levelStartTime: number;
  particles: Particle[];
  levelWon: boolean;
  gameTimeSec: number;
}

export interface GameStoreActions {
  setView: (view: 'menu' | 'playing') => void;
  selectLevel: (index: number) => void;
  resetLevel: () => void;
  completeLevel: () => void;
  startDrag: (pos: Vector2D) => void;
  updateDrag: (pos: Vector2D) => void;
  releaseDrag: () => void;
  updatePendulum: (state: PendulumState) => void;
  collectGem: (mechanismId: string) => void;
  triggerMechanism: (mechanismId: string) => void;
  teleportPendulum: (targetPivot: Vector2D, targetAngle: number, preserveVelocity: boolean) => void;
  addParticles: (origin: Vector2D, count: number) => void;
  updateParticles: (dt: number) => void;
  setLevelWon: (won: boolean) => void;
  updateTime: (elapsedMs: number) => void;
  updateMechanisms: (timeSec: number) => void;
  setMechanisms: (mechanisms: Mechanism[]) => void;
}

export type GameStore = GameStoreState & GameStoreActions;
