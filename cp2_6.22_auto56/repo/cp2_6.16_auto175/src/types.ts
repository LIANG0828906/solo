import * as THREE from 'three';

export interface Particle {
  id: number;
  type: 'electron' | 'proton';
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  trail: THREE.Vector3[];
  charge: number;
  mass: number;
  radius: number;
  color: THREE.Color;
  initialPosition: THREE.Vector3;
  initialVelocity: THREE.Vector3;
  highlight: boolean;
  glowScale: number;
  glowPulse: number;
}

export interface FieldParams {
  magneticFieldStrength: number;
  particleCount: number;
  emissionSpeed: number;
}

export interface Stats {
  totalParticles: number;
  electronCount: number;
  protonCount: number;
  averageSpeed: number;
}

export interface CameraState {
  theta: number;
  phi: number;
  distance: number;
  isRotating: boolean;
  lastMouseX: number;
  lastMouseY: number;
}

export interface ControlPanelState {
  activeTab: 'basic' | 'trail' | 'stats';
  fieldStrength: number;
  particleCount: number;
  emissionSpeed: number;
  trailEnabled: boolean;
  trailLength: number;
}

export const DEFAULT_FIELD_PARAMS: FieldParams = {
  magneticFieldStrength: 1.0,
  particleCount: 30,
  emissionSpeed: 5.0
};

export const ELECTRON_COLOR = new THREE.Color('#00E5FF');
export const PROTON_COLOR = new THREE.Color('#FF6F00');
export const ACCENT_COLOR = '#00BCD4';
export const TEXT_COLOR = '#E0E0E0';
export const BG_TOP = '#0A0E27';
export const BG_BOTTOM = '#1A0A2E';

export const MAX_TRAIL_LENGTH = 200;
export const BOUNDARY_RADIUS = 20;
export const FIELD_REGION_RADIUS = 8;
export const FIELD_REGION_HEIGHT = 16;
export const RK4_STEP = 0.01;
export const SHELL_MIN_RADIUS = 2;
export const SHELL_MAX_RADIUS = 4;
