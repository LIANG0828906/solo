import * as THREE from 'three';
import type { BoatState } from './boat';

export interface WaterParams {
  baseWaveAmplitude: number;
  waveFrequency: number;
  waveSpeed: number;
  waterColor: number;
}

const DEFAULT_PARAMS: WaterParams = {
  baseWaveAmplitude: 0.15,
  waveFrequency: 0.8,
  waveSpeed: 1.5,
  waterColor: 0x4A90D9
};

const WATER_SIZE = 200;
const WATER_SEGMENTS = 128;
const FOAM_PARTICLE_COUNT = 300;
const WAKE_PARTICLE_COUNT = 200;

export class RiverWater {
  public group: THREE.Group;
  private waterMesh!: THREE.Mesh;
  private waterGeometry!: THREE.PlaneGeometry;
  private waterMaterial!: THREE.MeshStandardMaterial;
  private foamParticles!: THREE.Points;
  private wakeParticles!: THREE.Points;
  private foamPositions: Float32Array;
  private wakePositions: Float32Array;
  private params: WaterParams;
  private time: number = 0;
  private boatPosition: THREE.Vector3 = new THREE.Vector3();
  private boatRoll: number = 0;
  private draftDepth: number = 0;

  constructor(params?: Partial<WaterParams>) {
    this.params = { ...DEFAULT_PARAMS, ...params };
    this.group = new THREE.Group();
    this.foamPositions = new Float32Array(FOAM_PARTICLE_COUNT * 3);
    this.wakePositions = new Float32Array(WAKE_PARTICLE_COUNT * 3);
    this.createWaterSurface();
    this.createFoamParticles();
    this.createWakeParticles();
  }

  private createWaterSurface(): void {
    this.waterGeometry = new THREE.PlaneGeometry(WATER_SIZE, WATER_SIZE, WATER_SEGMENTS, WATER_SEGMENTS);
    this.waterGeometry.rotateX(-Math.PI / 2);

    this.waterMaterial = new THREE.MeshStandardMaterial({
      color: this.params.waterColor,
      transparent: true,
      opacity: 0.85,
      roughness: 0.1,
      metalness: 0.3,
      side: THREE.DoubleSide
    });

    this.waterMesh = new THREE.Mesh(this.waterGeometry, this.waterMaterial);
    this.waterMesh.receiveShadow = true;
    this.group.add(this.waterMesh);
  }

  private createFoamParticles(): void {
    const geometry = new THREE.BufferGeometry();
    
    for (let i = 0; i < FOAM_PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 8;
      this.foamPositions[i * 3] = Math.cos(angle) * radius;
      this.foamPositions[i * 3 + 1] = 0.02;
      this.foamPositions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.foamPositions, 3));
    
    const sizes = new Float32Array(FOAM_PARTICLE_COUNT);
    for (let i = 0; i < FOAM_PARTICLE_COUNT; i++) {
      sizes[i] = 0.08 + Math.random() * 0.12;
    }
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.15,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });

    this.foamParticles = new THREE.Points(geometry, material);
    this.group.add(this.foamParticles);
  }

  private createWakeParticles(): void {
    const geometry = new THREE.BufferGeometry();
    
    for (let i = 0; i < WAKE_PARTICLE_COUNT; i++) {
      this.wakePositions[i * 3] = -50;
      this.wakePositions[i * 3 + 1] = 0.01;
      this.wakePositions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.wakePositions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.1,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true
    });

    this.wakeParticles = new THREE.Points(geometry, material);
    this.group.add(this.wakeParticles);
  }

  public update(boatState: BoatState, deltaTime: number): void {
    this.time += deltaTime * this.params.waveSpeed;
    this.boatPosition.copy(boatState.position);
    this.boatRoll = boatState.rotation.z;
    this.draftDepth = boatState.draftDepth;

    this.updateWaterSurface(deltaTime);
    this.updateFoamParticles(deltaTime);
    this.updateWakeParticles(deltaTime);
    this.updateWaterColor();
  }

  private updateWaterSurface(deltaTime: number): void {
    const positions = this.waterGeometry.attributes.position.array as Float32Array;
    const amplitude = this.params.baseWaveAmplitude + this.draftDepth * 0.05;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];

      const distToBoat = Math.sqrt(
        Math.pow(x - this.boatPosition.x, 2) + 
        Math.pow(z - this.boatPosition.z, 2)
      );

      let height = 0;

      height += Math.sin(x * this.params.waveFrequency + this.time) * amplitude * 0.4;
      height += Math.sin(z * this.params.waveFrequency * 0.7 + this.time * 0.8) * amplitude * 0.3;
      height += Math.sin((x + z) * this.params.waveFrequency * 0.5 + this.time * 1.2) * amplitude * 0.2;

      const waveInfluence = Math.max(0, 1 - distToBoat / 15);
      const boatWave = Math.sin(distToBoat * 2 - this.time * 3) * amplitude * waveInfluence * 0.5;
      height += boatWave;

      const rollInfluence = Math.sin(Math.atan2(z - this.boatPosition.z, x - this.boatPosition.x)) * this.boatRoll * 0.3;
      height += rollInfluence * waveInfluence;

      positions[i + 1] = height;
    }

    this.waterGeometry.attributes.position.needsUpdate = true;
    this.waterGeometry.computeVertexNormals();
  }

  private updateFoamParticles(deltaTime: number): void {
    const positions = this.foamParticles.geometry.attributes.position.array as Float32Array;
    const boatX = this.boatPosition.x;
    const boatZ = this.boatPosition.z;

    for (let i = 0; i < FOAM_PARTICLE_COUNT; i++) {
      const idx = i * 3;
      
      const dx = positions[idx] - boatX;
      const dz = positions[idx + 2] - boatZ;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 20 || Math.random() < deltaTime * 0.1) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 1 + Math.random() * 6;
        positions[idx] = boatX + Math.cos(angle) * radius;
        positions[idx + 2] = boatZ + Math.sin(angle) * radius;
      } else {
        const angle = Math.atan2(dz, dx);
        const outwardSpeed = 2 + this.draftDepth * 2;
        positions[idx] += Math.cos(angle) * deltaTime * outwardSpeed;
        positions[idx + 2] += Math.sin(angle) * deltaTime * outwardSpeed;
      }

      const waveHeight = Math.sin(positions[idx] * 2 + this.time * 2) * 0.1 +
                        Math.sin(positions[idx + 2] * 1.5 + this.time * 1.5) * 0.05;
      positions[idx + 1] = 0.05 + waveHeight + Math.random() * 0.05;
    }

    this.foamParticles.geometry.attributes.position.needsUpdate = true;
    const foamOpacity = Math.min(0.9, 0.4 + this.draftDepth * 0.15 + Math.abs(this.boatRoll) * 0.5);
    (this.foamParticles.material as THREE.PointsMaterial).opacity = foamOpacity;
  }

  private updateWakeParticles(deltaTime: number): void {
    const positions = this.wakeParticles.geometry.attributes.position.array as Float32Array;
    const boatX = this.boatPosition.x;
    const boatZ = this.boatPosition.z;

    for (let i = 0; i < WAKE_PARTICLE_COUNT; i++) {
      const idx = i * 3;
      
      positions[idx] += deltaTime * 8;
      
      if (positions[idx] > boatX + 15) {
        positions[idx] = boatX - 10 - Math.random() * 5;
        positions[idx + 2] = boatZ + (Math.random() - 0.5) * 4;
      }

      positions[idx + 1] = 0.02 + Math.sin(positions[idx] + this.time * 3) * 0.02;
    }

    this.wakeParticles.geometry.attributes.position.needsUpdate = true;
  }

  private updateWaterColor(): void {
    const baseColor = new THREE.Color(this.params.waterColor);
    const murkiness = Math.min(0.3, this.draftDepth * 0.02);
    
    const r = Math.max(0, Math.min(1, baseColor.r + murkiness * 0.2));
    const g = Math.max(0, Math.min(1, baseColor.g - murkiness * 0.1));
    const b = Math.max(0, Math.min(1, baseColor.b - murkiness * 0.15));
    
    this.waterMaterial.color.setRGB(r, g, b);
    this.waterMaterial.opacity = Math.max(0.7, 0.9 - this.draftDepth * 0.01);
  }

  public getWaterHeightAt(x: number, z: number): number {
    const amplitude = this.params.baseWaveAmplitude + this.draftDepth * 0.05;
    let height = 0;
    height += Math.sin(x * this.params.waveFrequency + this.time) * amplitude * 0.4;
    height += Math.sin(z * this.params.waveFrequency * 0.7 + this.time * 0.8) * amplitude * 0.3;
    return height;
  }

  public setVisible(visible: boolean): void {
    this.group.visible = visible;
  }
}
