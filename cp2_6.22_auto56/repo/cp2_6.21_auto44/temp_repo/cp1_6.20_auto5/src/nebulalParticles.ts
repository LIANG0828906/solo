import * as THREE from 'three';
import { getColorAtDistance, updateBlend } from './colorThemes';

export class NebulaParticles {
  private scene: THREE.Scene;
  private particleCount: number;
  private rotationSpeed: number;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private angles: Float32Array;
  private radii: Float32Array;
  private heights: Float32Array;
  private rotationAngle: number = 0;
  private tempColor: THREE.Color;

  constructor(scene: THREE.Scene, particleCount: number = 8000) {
    this.scene = scene;
    this.particleCount = particleCount;
    this.rotationSpeed = 1.0;
    this.tempColor = new THREE.Color();

    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.sizes = new Float32Array(this.particleCount);
    this.angles = new Float32Array(this.particleCount);
    this.radii = new Float32Array(this.particleCount);
    this.heights = new Float32Array(this.particleCount);

    this.material = new THREE.PointsMaterial({
      size: 2.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.initializeParticles();
    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  private initializeParticles(): void {
    const arms = 4;
    const maxRadius = 120;

    for (let i = 0; i < this.particleCount; i++) {
      const arm = i % arms;
      const armAngle = (arm / arms) * Math.PI * 2;

      const radiusFactor = Math.pow(Math.random(), 0.5);
      const radius = radiusFactor * maxRadius + Math.random() * 10;
      const spiralAngle = radius * 0.08 + armAngle + (Math.random() - 0.5) * 0.6;

      const height = (Math.random() - 0.5) * 15 * (1 - radiusFactor * 0.7);

      this.radii[i] = radius;
      this.angles[i] = spiralAngle;
      this.heights[i] = height;

      this.updateParticlePosition(i);
      this.updateParticleColor(i, radius / maxRadius);

      this.sizes[i] = 1.0 + Math.random() * 3.0;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
  }

  private updateParticlePosition(index: number): void {
    const angle = this.angles[index];
    const radius = this.radii[index];
    const height = this.heights[index];

    this.positions[index * 3] = Math.cos(angle) * radius;
    this.positions[index * 3 + 1] = height;
    this.positions[index * 3 + 2] = Math.sin(angle) * radius;
  }

  private updateParticleColor(index: number, normalizedDistance: number): void {
    getColorAtDistance(normalizedDistance, this.tempColor);
    this.colors[index * 3] = this.tempColor.r;
    this.colors[index * 3 + 1] = this.tempColor.g;
    this.colors[index * 3 + 2] = this.tempColor.b;
  }

  public update(deltaTime: number): void {
    updateBlend(deltaTime);

    const baseRotation = 0.15 * this.rotationSpeed;
    this.rotationAngle += baseRotation * deltaTime;

    const maxRadius = 120;

    for (let i = 0; i < this.particleCount; i++) {
      const radiusFactor = this.radii[i] / maxRadius;
      const speedFactor = 1.0 - radiusFactor * 0.6;
      const rotationOffset = baseRotation * speedFactor * deltaTime;
      this.angles[i] += rotationOffset;

      this.updateParticlePosition(i);
      this.updateParticleColor(i, radiusFactor);
    }

    const positionAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;

    this.points.rotation.y = this.rotationAngle;
  }

  public setParticleCount(count: number): void {
    if (count === this.particleCount) return;

    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();

    this.particleCount = count;
    this.positions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.sizes = new Float32Array(this.particleCount);
    this.angles = new Float32Array(this.particleCount);
    this.radii = new Float32Array(this.particleCount);
    this.heights = new Float32Array(this.particleCount);

    this.geometry = new THREE.BufferGeometry();
    this.initializeParticles();
    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  public setRotationSpeed(speed: number): void {
    this.rotationSpeed = speed;
  }

  public dispose(): void {
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}
