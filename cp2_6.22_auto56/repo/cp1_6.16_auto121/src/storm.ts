import * as THREE from 'three';
import { ParticleSystem } from './particles';

export class StormSystem {
  public readonly group: THREE.Group;
  public readonly eyeWall: THREE.Mesh;
  public readonly particleSystem: ParticleSystem;

  private currentRotationSpeed: number = 0.3;
  private targetRotationSpeed: number = 0.3;
  private currentWindStrength: number = 5;
  private targetWindStrength: number = 5;

  private readonly eyeRadius: number = 2.0;
  private readonly wallHeight: number = 0.5;

  constructor() {
    this.group = new THREE.Group();
    this.particleSystem = new ParticleSystem();

    this.eyeWall = this.createEyeWall();
    this.group.add(this.eyeWall);

    if (this.particleSystem.rainBandParticles) {
      this.group.add(this.particleSystem.rainBandParticles);
    }
    if (this.particleSystem.innerWallParticles) {
      this.group.add(this.particleSystem.innerWallParticles);
    }
    if (this.particleSystem.trailLines) {
      this.group.add(this.particleSystem.trailLines);
    }
  }

  private createEyeWall(): THREE.Mesh {
    const geometry = new THREE.TorusGeometry(this.eyeRadius, 0.15, 16, 128);

    const colors = new Float32Array(geometry.attributes.position.count * 3);
    const positions = geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < geometry.attributes.position.count; i++) {
      const x = positions[i * 3];
      const z = positions[i * 3 + 2];
      const angle = Math.atan2(z, x);
      const t = (angle + Math.PI) / (Math.PI * 2);

      const r1 = 0.529, g1 = 0.808, b1 = 0.922;
      const r2 = 0.275, g2 = 0.510, b2 = 0.706;

      colors[i * 3] = r1 + (r2 - r1) * t;
      colors[i * 3 + 1] = g1 + (g2 - g1) * t;
      colors[i * 3 + 2] = b1 + (b2 - b1) * t;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2;
    mesh.scale.y = this.wallHeight / 0.3;

    return mesh;
  }

  public update(deltaTime: number, windStrength: number, showTrails: boolean): number {
    this.targetWindStrength = windStrength;
    this.currentWindStrength += (this.targetWindStrength - this.currentWindStrength) * Math.min(1, deltaTime / 0.3);

    this.targetRotationSpeed = 0.3 + (this.currentWindStrength - 1) * (0.5 / 9);
    this.currentRotationSpeed += (this.targetRotationSpeed - this.currentRotationSpeed) * Math.min(1, deltaTime / 0.3);

    this.group.rotation.y += this.currentRotationSpeed * deltaTime;

    const activeParticles = this.particleSystem.update(deltaTime, windStrength, showTrails);

    return activeParticles;
  }

  public getRotationSpeed(): number {
    return this.currentRotationSpeed;
  }

  public getWindStrength(): number {
    return this.currentWindStrength;
  }
}
