import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';

export interface CelestialBodyData {
  id?: string;
  name?: string;
  type: 'star' | 'planet';
  mass: number;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  color: string;
}

const MAX_TRAIL_POINTS = 200;

export class CelestialBody {
  public id: string;
  public name: string;
  public type: 'star' | 'planet';
  public mass: number;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public color: string;
  public trail: THREE.Vector3[];
  public mesh?: THREE.Mesh;
  public glowMesh?: THREE.Mesh;
  public trailLine?: THREE.Line;
  public scale: number = 0;
  public targetScale: number = 1;

  constructor(data: CelestialBodyData) {
    this.id = data.id || uuidv4();
    this.name = data.name || (data.type === 'star' ? '主星' : '行星');
    this.type = data.type;
    this.mass = data.mass;
    this.position = new THREE.Vector3(data.position.x, data.position.y, data.position.z);
    this.velocity = new THREE.Vector3(data.velocity.x, data.velocity.y, data.velocity.z);
    this.color = data.color;
    this.trail = [];
  }

  public getRadius(): number {
    if (this.type === 'star') {
      return Math.pow(this.mass, 0.4) * 0.8;
    }
    return Math.pow(this.mass, 0.4) * 0.5;
  }

  public addTrailPoint(): void {
    this.trail.push(this.position.clone());
    if (this.trail.length > MAX_TRAIL_POINTS) {
      this.trail.shift();
    }
  }

  public getSpeed(): number {
    return this.velocity.length();
  }

  public getDistanceTo(other: CelestialBody): number {
    return this.position.distanceTo(other.position);
  }

  public toData(): CelestialBodyData {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      mass: this.mass,
      position: {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z
      },
      velocity: {
        x: this.velocity.x,
        y: this.velocity.y,
        z: this.velocity.z
      },
      color: this.color
    };
  }
}
