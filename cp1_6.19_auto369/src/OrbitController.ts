import * as THREE from 'three';
import { useCelestialStore, Vector3Tuple } from './store';

const EARTH_ORBIT_RADIUS = 10;
const MOON_ORBIT_RADIUS_BASE = 2.5;
const EARTH_ORBIT_PERIOD = 12;
const MOON_ORBIT_PERIOD = 3;
const EARTH_ROTATION_PERIOD = 0.5;

const degToRad = (deg: number) => deg * (Math.PI / 180);
const radToDeg = (rad: number) => rad * (180 / Math.PI);

export class OrbitController {
  private earthOrbitAngle: number = 0;
  private moonOrbitAngle: number = 0;
  private earthRotation: number = 0;

  update(delta: number, earthMesh: THREE.Group, moonMesh: THREE.Mesh, sunMesh: THREE.Mesh): void {
    const state = useCelestialStore.getState();
    
    state.lerpParams(delta);
    
    const { orbitSpeed, earthScale, moonOrbitScale } = state;
    
    const earthOrbitAngularSpeed = (360 / EARTH_ORBIT_PERIOD) * orbitSpeed;
    const moonOrbitAngularSpeed = (360 / MOON_ORBIT_PERIOD) * orbitSpeed;
    const earthRotationSpeed = (360 / EARTH_ROTATION_PERIOD) * orbitSpeed;
    
    this.earthOrbitAngle = (this.earthOrbitAngle + earthOrbitAngularSpeed * delta) % 360;
    this.moonOrbitAngle = (this.moonOrbitAngle + moonOrbitAngularSpeed * delta) % 360;
    this.earthRotation = (this.earthRotation + earthRotationSpeed * delta) % 360;
    
    const sunPos: Vector3Tuple = [0, 0, 0];
    sunMesh.position.set(...sunPos);
    
    const earthOrbitRad = degToRad(this.earthOrbitAngle);
    const earthPos: Vector3Tuple = [
      EARTH_ORBIT_RADIUS * Math.cos(earthOrbitRad),
      0,
      EARTH_ORBIT_RADIUS * Math.sin(earthOrbitRad),
    ];
    
    const moonOrbitRad = degToRad(this.moonOrbitAngle);
    const moonOrbitRadius = MOON_ORBIT_RADIUS_BASE * moonOrbitScale;
    const moonRelPos: Vector3Tuple = [
      moonOrbitRadius * Math.cos(moonOrbitRad),
      0,
      moonOrbitRadius * Math.sin(moonOrbitRad),
    ];
    const moonPos: Vector3Tuple = [
      earthPos[0] + moonRelPos[0],
      earthPos[1] + moonRelPos[1],
      earthPos[2] + moonRelPos[2],
    ];
    
    earthMesh.position.set(...earthPos);
    moonMesh.position.set(...moonPos);
    
    const earthInnerMesh = earthMesh.children[0] as THREE.Mesh;
    if (earthInnerMesh) {
      earthInnerMesh.rotation.y = degToRad(this.earthRotation);
    }
    
    if (earthMesh.children.length > 2) {
      const clouds = earthMesh.children[2] as THREE.Mesh;
      clouds.rotation.y = degToRad(this.earthRotation * 1.1);
    }
    
    sunMesh.rotation.y += delta * 0.1 * orbitSpeed;
    
    state.setPositions(sunPos, earthPos, moonPos);
    state.setAngles(this.earthOrbitAngle, this.moonOrbitAngle, this.earthRotation);
  }
}
