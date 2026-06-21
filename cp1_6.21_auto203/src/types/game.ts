export type MechanismType = 'mirror' | 'prism' | 'translucent';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Mechanism {
  id: string;
  type: MechanismType;
  position: Vector3;
  rotation: number;
  size: Vector3;
}

export interface Wall {
  position: Vector3;
  size: Vector3;
}

export interface LightEmitter {
  position: Vector3;
  direction: Vector3;
}

export interface LightSensor {
  position: Vector3;
  radius: number;
}

export interface LevelConfig {
  id: string;
  name: string;
  mazeSize: Vector3;
  walls: Wall[];
  mechanisms: Mechanism[];
  emitter: LightEmitter;
  sensor: LightSensor;
}

export interface LightSegment {
  start: Vector3;
  end: Vector3;
  color: string;
  intensity: number;
}

export interface GameState {
  currentLevel: string;
  steps: number;
  selectedMechanismId: string | null;
  mechanisms: Record<string, Mechanism>;
  lightPath: LightSegment[];
  isCompleted: boolean;
  isPathBroken: boolean;
  isVictoryAnimating: boolean;
}
