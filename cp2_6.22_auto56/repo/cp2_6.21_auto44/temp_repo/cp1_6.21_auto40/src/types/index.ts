export type ToolType = 'carve' | 'stack' | 'spray' | 'smooth';

export type CameraMode = 'orthographic' | 'perspective';

export interface ParticleSnapshot {
  timestamp: number;
  positions: Float32Array;
  colors: Float32Array;
}

export interface ToolConfig {
  brushSize: number;
  brushStrength: number;
}

export interface SceneState {
  cameraMode: CameraMode;
  currentTool: ToolType;
  isRecording: boolean;
  isPlaying: boolean;
  brushSize: number;
  brushStrength: number;
}

export interface BrushCommand {
  type: ToolType;
  centerX: number;
  centerY: number;
  centerZ: number;
  radius: number;
  strength: number;
  colorPalette?: string[];
}

export interface WorkerRequest {
  type: 'applyBrush' | 'resetParticles' | 'lerpSnapshots' | 'getSnapshot';
  payload: {
    positions?: Float32Array;
    colors?: Float32Array;
    command?: BrushCommand;
    snapshotA?: ParticleSnapshot;
    snapshotB?: ParticleSnapshot;
    t?: number;
    initialPositions?: Float32Array;
    initialColors?: Float32Array;
  };
}

export interface WorkerResponse {
  type: 'positionsUpdated' | 'snapshotTaken' | 'resetComplete' | 'lerpComplete';
  payload: {
    positions?: Float32Array;
    colors?: Float32Array;
    snapshot?: ParticleSnapshot;
  };
}
