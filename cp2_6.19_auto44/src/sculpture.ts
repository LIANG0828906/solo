import * as THREE from 'three';
import type { SculptureParams } from './types';

export class Sculpture {
  private mesh: THREE.Mesh | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.MeshStandardMaterial | null = null;
  private baseGeometry: THREE.IcosahedronGeometry | null = null;
  private originalPositions: Float32Array | null = null;
  private modifiedPositions: Float32Array | null = null;
  private colors: Float32Array | null = null;
  private particleSystem: THREE.Points | null = null;
  private explosionParticles: THREE.BufferGeometry | null = null;

  constructor() {}

  public create(params: SculptureParams): THREE.Mesh {
    this.dispose();
    this.baseGeometry = new THREE.IcosahedronGeometry(1, Math.floor(params.subdivision / 4));
    this.originalPositions = new Float32Array(this.baseGeometry.attributes.position.array as Float32Array);
    this.modifiedPositions = new Float32Array(this.originalPositions.length);
    this.colors = new Float32Array(this.originalPositions.length);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.modifiedPositions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(params.baseColor),
      metalness: params.metalness,
      roughness: params.roughness,
      emissive: new THREE.Color(params.emissiveColor),
      emissiveIntensity: params.emissiveIntensity,
      vertexColors: params.colorMode === 'gradient',
      flatShading: true,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.updateGeometry(params);
    return this.mesh;
  }

  public update(params: SculptureParams, explosionScale: number = 1): void {
    if (!this.mesh || !this.material) return;

    this.updateGeometry(params, explosionScale);

    this.material.color.set(params.baseColor);
    this.material.metalness = params.metalness;
    this.material.roughness = params.roughness;
    this.material.emissive.set(params.emissiveColor);
    this.material.emissiveIntensity = params.emissiveIntensity;
    this.material.vertexColors = params.colorMode === 'gradient';
    this.material.needsUpdate = true;
  }

  private updateGeometry(params: SculptureParams, explosionScale: number = 1): void {
    if (!this.originalPositions || !this.modifiedPositions || !this.colors || !this.geometry) return;

    const twistAmount = params.twistIntensity;
    const expansion = params.expansionRadius * explosionScale;
    const stretch = params.verticalStretch;
    const contraction = params.topContraction;
    const rotationRad = (params.rotationOffset * Math.PI) / 180;

    const pos = this.originalPositions;
    const modPos = this.modifiedPositions;
    const cols = this.colors;

    const gradientStart = new THREE.Color(params.gradientStart);
    const gradientEnd = new THREE.Color(params.gradientEnd);

    for (let i = 0; i < pos.length; i += 3) {
      let x = pos[i];
      let y = pos[i + 1];
      let z = pos[i + 2];

      const normalizedY = (y + 1) / 2;
      const heightFactor = Math.pow(1 - normalizedY, contraction);
      const twistAngle = twistAmount * y * 0.5;

      const cosT = Math.cos(twistAngle);
      const sinT = Math.sin(twistAngle);
      const newX = x * cosT - z * sinT;
      const newZ = x * sinT + z * cosT;
      x = newX;
      z = newZ;

      const radius = Math.sqrt(x * x + z * z) * expansion * heightFactor;
      const angle = Math.atan2(z, x) + rotationRad;
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius;
      y = y * stretch;

      modPos[i] = x;
      modPos[i + 1] = y;
      modPos[i + 2] = z;

      const colorT = Math.max(0, Math.min(1, (y + stretch) / (2 * stretch)));
      const r = THREE.MathUtils.lerp(gradientStart.r, gradientEnd.r, colorT);
      const g = THREE.MathUtils.lerp(gradientStart.g, gradientEnd.g, colorT);
      const b = THREE.MathUtils.lerp(gradientStart.b, gradientEnd.b, colorT);
      cols[i] = r;
      cols[i + 1] = g;
      cols[i + 2] = b;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  public createExplosionParticles(count: number = 200): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.1;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const speed = 2 + Math.random() * 3;
      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      velocities[i * 3 + 2] = Math.cos(phi) * speed;

      const hue = Math.random() * 0.3 + 0.5;
      const color = new THREE.Color().setHSL(hue, 1, 0.6);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 0.05 + Math.random() * 0.1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.explosionParticles = geometry;
    return this.particleSystem;
  }

  public updateExplosionParticles(deltaTime: number, progress: number): void {
    if (!this.particleSystem || !this.explosionParticles) return;

    const positions = this.explosionParticles.attributes.position.array as Float32Array;
    const velocities = this.explosionParticles.attributes.velocity.array as Float32Array;
    const material = this.particleSystem.material as THREE.PointsMaterial;

    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += velocities[i] * deltaTime;
      positions[i + 1] += velocities[i + 1] * deltaTime - 2 * deltaTime;
      positions[i + 2] += velocities[i + 2] * deltaTime;

      velocities[i + 1] -= 3 * deltaTime;
    }

    this.explosionParticles.attributes.position.needsUpdate = true;
    material.opacity = Math.max(0, 1 - progress);
  }

  public getMesh(): THREE.Mesh | null {
    return this.mesh;
  }

  public getParticleSystem(): THREE.Points | null {
    return this.particleSystem;
  }

  public dispose(): void {
    if (this.baseGeometry) this.baseGeometry.dispose();
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    if (this.explosionParticles) this.explosionParticles.dispose();
    if (this.particleSystem?.material) {
      (this.particleSystem.material as THREE.Material).dispose();
    }
    this.baseGeometry = null;
    this.geometry = null;
    this.material = null;
    this.mesh = null;
    this.originalPositions = null;
    this.modifiedPositions = null;
    this.colors = null;
    this.explosionParticles = null;
    this.particleSystem = null;
  }
}
