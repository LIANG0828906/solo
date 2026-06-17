export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface CelestialBody {
  id: string;
  name: string;
  type: 'star' | 'planet';
  mass: number;
  radius: number;
  color: string;
  position: Vector3;
  velocity: Vector3;
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  emissiveIntensity?: number;
}

export interface PhysicsParams {
  gravitationalConstant: number;
  starMass: number;
}

export interface EventMap {
  'params:update': PhysicsParams;
  'bodies:update': CelestialBody[];
  'body:hover': { bodyId: string | null };
  'body:click': { body: CelestialBody };
  'body:select': { bodyId: string | null };
  'camera:rotate': { isRotating: boolean };
}
