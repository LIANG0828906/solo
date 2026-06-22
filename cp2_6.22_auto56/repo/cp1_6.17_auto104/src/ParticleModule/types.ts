import { Vector3, Color } from 'three';

export interface Particle {
  position: Vector3;
  velocity: Vector3;
  color: Color;
  baseColor: Color;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
  bounced: boolean;
  sourceType: 'building' | 'advertisement' | 'streetLamp';
}

export interface LightParams {
  ambientColor: Color;
  gravity: number;
  windForce: Vector3;
  bounceCoefficient: number;
}

export interface BuildingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}
