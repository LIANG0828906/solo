import * as THREE from 'three';
import { StarProperties, EvolutionStage } from './StarEngine';

export class StarRenderer {
  private scene: THREE.Scene;
  private starMesh: THREE.Mesh;
  private starMaterial: THREE.MeshStandardMaterial;
  private starGlow: THREE.Mesh;
  private starGlowMaterial: THREE.MeshBasicMaterial;
  private particles: THREE.Points;
  private particleMaterial: THREE.PointsMaterial;
  private particleGeometry: THREE.BufferGeometry;
  private particleVelocities: Float32Array;
  private particleAngles: Float32Array;
  private particleRadii: Float32Array;
  private accretionDisk: THREE.Group | null = null;
  private currentParticleCount: number = 0;
  private nebulaRotation: number = 0;
  private starRotation: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.particleVelocities = new Float32Array(0);
    this.particleAngles = new Float32Array(0);
    this.particleRadii = new Float32Array(0);

    const starGeometry = new THREE.SphereGeometry(1, 64, 64);
    this.starMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.8,
      metalness: 0.1,
      roughness: 0.6,
    });
    this.starMesh = new THREE.Mesh(starGeometry, this.starMaterial);
    this.starMesh.scale.setScalar(1);
    this.scene.add(this.starMesh);

    const glowGeometry = new THREE.SphereGeometry(1.15, 32, 32);
    this.starGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.starGlow = new THREE.Mesh(glowGeometry, this.starGlowMaterial);
    this.starMesh.add(this.starGlow);

    this.particleGeometry = new THREE.BufferGeometry();
    this.particleMaterial = new THREE.PointsMaterial({
      color: 0x4488ff,
      size: 2.5,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particles);
  }

  update(props: StarProperties, dt: number): void {
    this.updateStarMesh(props, dt);
    this.updateParticles(props, dt);
    this.updateAccretionDisk(props, dt);
  }

  private updateStarMesh(props: StarProperties, dt: number): void {
    const targetScale = Math.max(0.01, props.radius3D);
    this.starMesh.scale.setScalar(targetScale);

    const color = new THREE.Color(props.colorR, props.colorG, props.colorB);
    this.starMaterial.color.copy(color);
    this.starMaterial.emissive.copy(color);

    if (props.isBlackHole) {
      this.starMaterial.emissiveIntensity = 0.05;
      this.starMaterial.color.setHex(0x111111);
      this.starMaterial.emissive.setHex(0x000000);
      this.starGlowMaterial.opacity = 0;
    } else if (props.isPulsing) {
      const pulse = 0.5 + 0.5 * Math.sin(props.pulsePhase * Math.PI * 2);
      this.starMaterial.emissiveIntensity = 0.5 + pulse * 1.5;
      this.starGlowMaterial.opacity = 0.1 + pulse * 0.3;
    } else {
      const baseIntensity = props.stage === EvolutionStage.MainSequence ? 0.8 :
                            props.stage === EvolutionStage.RedGiant ? 0.6 :
                            props.stage === EvolutionStage.NebulaCondensation ? 0.4 : 0.7;
      this.starMaterial.emissiveIntensity = baseIntensity;
      this.starGlowMaterial.opacity = props.stage === EvolutionStage.WhiteDwarf ? 0.2 : 0.15;
    }

    this.starGlowMaterial.color.copy(color);
    this.starGlow.scale.setScalar(1.15);

    if (props.rotationPeriod < 100 && !props.isBlackHole) {
      const rotSpeed = (2 * Math.PI) / Math.max(0.1, props.rotationPeriod);
      this.starRotation += rotSpeed * dt;
      this.starMesh.rotation.y = this.starRotation;
    }
  }

  private updateParticles(props: StarProperties, dt: number): void {
    const targetCount = props.particleCount;

    if (targetCount !== this.currentParticleCount) {
      this.rebuildParticles(targetCount, props);
    }

    if (this.currentParticleCount === 0) {
      this.particles.visible = false;
      return;
    }
    this.particles.visible = true;

    const positions = this.particleGeometry.attributes.position.array as Float32Array;

    this.nebulaRotation += dt * 0.15;

    const starR = Math.max(0.01, props.radius3D);

    for (let i = 0; i < this.currentParticleCount; i++) {
      const angle = this.particleAngles[i] + this.nebulaRotation;
      const r = this.particleRadii[i];

      if (props.nebulaRingMode) {
        const ringRadius = starR * 4 + r * 3;
        const tiltAngle = Math.PI * 0.15;
        const x = Math.cos(angle) * ringRadius;
        const z = Math.sin(angle) * ringRadius;
        const y = Math.sin(angle * 3 + i) * starR * 0.5 + Math.sin(tiltAngle) * z * 0.3;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      } else if (props.isBlackHole) {
        const spiralR = starR * 1.5 + r * 2;
        const spiralAngle = angle + r * 3;
        positions[i * 3] = Math.cos(spiralAngle) * spiralR;
        positions[i * 3 + 1] = (Math.random() - 0.5) * starR * 0.3;
        positions[i * 3 + 2] = Math.sin(spiralAngle) * spiralR;
      } else {
        const nebulaR = starR * 1.5 + r * starR * 2;
        const yOff = this.particleVelocities[i * 3 + 1] * starR;
        positions[i * 3] = Math.cos(angle) * nebulaR + this.particleVelocities[i * 3] * dt * 0.5;
        positions[i * 3 + 1] = yOff;
        positions[i * 3 + 2] = Math.sin(angle) * nebulaR + this.particleVelocities[i * 3 + 2] * dt * 0.5;
      }

      this.particleAngles[i] += this.particleVelocities[i * 3] * dt * 0.3;
    }

    this.particleGeometry.attributes.position.needsUpdate = true;

    const opacity = Math.max(0, Math.min(0.8, props.nebulaDensity * 0.7));
    this.particleMaterial.opacity = opacity;

    if (props.nebulaRingMode) {
      this.particleMaterial.color.setRGB(1.0, 0.41, 0.71);
    } else if (props.isBlackHole) {
      this.particleMaterial.color.setRGB(0.3, 0.1, 0.0);
      this.particleMaterial.size = 1.5;
    } else if (props.stage === EvolutionStage.NebulaCondensation) {
      this.particleMaterial.color.setRGB(0.3, 0.5, 1.0);
      this.particleMaterial.size = 3.0;
    } else {
      this.particleMaterial.color.setRGB(0.3, 0.45, 0.9);
      this.particleMaterial.size = 2.0;
    }
  }

  private rebuildParticles(count: number, props: StarProperties): void {
    this.currentParticleCount = count;
    this.particleAngles = new Float32Array(count);
    this.particleRadii = new Float32Array(count);
    this.particleVelocities = new Float32Array(count * 3);

    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      this.particleAngles[i] = Math.random() * Math.PI * 2;
      this.particleRadii[i] = 0.5 + Math.random() * 1.5;

      this.particleVelocities[i * 3] = (Math.random() - 0.5) * 0.4;
      this.particleVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      this.particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      sizes[i] = 2 + Math.random() * 3;
    }

    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.particleGeometry.attributes.position.needsUpdate = true;
  }

  private updateAccretionDisk(props: StarProperties, dt: number): void {
    if (props.isBlackHole && !this.accretionDisk) {
      this.createAccretionDisk();
    } else if (!props.isBlackHole && this.accretionDisk) {
      this.scene.remove(this.accretionDisk);
      this.accretionDisk = null;
    }

    if (this.accretionDisk) {
      this.accretionDisk.rotation.y += dt * 0.8;
      this.accretionDisk.rotation.x = Math.PI * 0.1;
    }
  }

  private createAccretionDisk(): void {
    this.accretionDisk = new THREE.Group();

    const ringCount = 3;
    for (let r = 0; r < ringCount; r++) {
      const innerR = 0.8 + r * 0.6;
      const outerR = innerR + 0.5;
      const ringGeom = new THREE.RingGeometry(innerR, outerR, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.08 - r * 0.02, 0.9, 0.3 + r * 0.1),
        transparent: true,
        opacity: 0.4 - r * 0.1,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.PI * 0.5;
      this.accretionDisk.add(ring);
    }

    this.scene.add(this.accretionDisk);
  }

  dispose(): void {
    this.scene.remove(this.starMesh);
    this.scene.remove(this.particles);
    if (this.accretionDisk) {
      this.scene.remove(this.accretionDisk);
    }
    this.starMesh.geometry.dispose();
    this.starMaterial.dispose();
    this.starGlowMaterial.dispose();
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
  }
}
