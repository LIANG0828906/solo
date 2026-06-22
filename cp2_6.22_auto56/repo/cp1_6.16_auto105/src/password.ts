import * as THREE from 'three';

export interface HelixConfig {
  radius: number;
  pitch: number;
  height: number;
  centerOffset: number;
  particleCount: number;
  orbitSpeed: number;
}

interface PasswordParticle {
  mesh: THREE.Mesh;
  phase: number;
  flickerFreq: number;
  flickerPhase: number;
  hue: number;
  speed: number;
}

export class PasswordHelix {
  private scene: THREE.Scene;
  private config: HelixConfig;
  private sphereCenter: THREE.Vector3;

  private particles: PasswordParticle[] = [];
  private group: THREE.Group;
  private orbitAngle: number = 0;

  private helixCenter: THREE.Vector3;

  constructor(
    scene: THREE.Scene,
    config: HelixConfig,
    sphereCenter: THREE.Vector3
  ) {
    this.scene = scene;
    this.config = config;
    this.sphereCenter = sphereCenter;