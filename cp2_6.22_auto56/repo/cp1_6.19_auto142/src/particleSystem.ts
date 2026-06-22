import * as THREE from 'three';
import { SoundWaveData } from './soundWave';

export class ParticleSystem {
  public points: THREE.Points;
  public geometry: THREE.BufferGeometry;
  public material: THREE.PointsMaterial;

  public trailPoints: THREE.Points[] = [];
  private trailGeometries: THREE.BufferGeometry[] = [];
  private trailMaterials: THREE.PointsMaterial[] = [];

  private count: number;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private originalPositions: Float32Array;
  private phases: Float32Array;
  private trailPositions: Float32Array[] = [];
  private trailCount: number = 3;

  private colorStart = new THREE.Color('#4FC3F7');
  private colorMid = new THREE.Color('#7E57C2');
  private colorEnd = new THREE.Color('#E53935');

  constructor(count: number = 10000) {
    this.count = count;
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    this.sizes = new Float32Array(count);
    this.originalPositions = new Float32Array(count * 3);
    this.phases = new Float32Array(count);

    this.initParticles();

    this.material = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(this.geometry, this.material);

    this.initTrails();
  }

  private initParticles(): void {
    const radius = 80;

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * Math.cbrt(Math.random());

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      this.positions[i3] = x;
      this.positions[i3 + 1] = y;
      this.positions[i3 + 2] = z;

      this.originalPositions[i3] = x;
      this.originalPositions[i3 + 1] = y;
      this.originalPositions[i3 + 2] = z;

      const t = (r / radius + 1) * 0.5;
      const color = new THREE.Color().lerpColors(this.colorStart, this.colorMid, t);
      this.colors[i3] = color.r;
      this.colors[i3 + 1] = color.g;
      this.colors[i3 + 2] = color.b;

      this.sizes[i] = 0.3 + Math.random() * 0.9;

      this.phases[i] = Math.random() * Math.PI * 2;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
  }

  private initTrails(): void {
    for (let i = 0; i < this.trailCount; i++) {
      const trailGeometry = new THREE.BufferGeometry();
      const trailPositions = new Float32Array(this.count * 3);
      const trailColors = new Float32Array(this.count * 3);

      trailPositions.set(this.positions);
      trailColors.set(this.colors);

      trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      trailGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));

      const opacity = 0.3 - i * 0.08;
      const trailMaterial = new THREE.PointsMaterial({
        size: 0.8 - i * 0.15,
        vertexColors: true,
        transparent: true,
        opacity: opacity,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });

      const trailPoint = new THREE.Points(trailGeometry, trailMaterial);

      this.trailGeometries.push(trailGeometry);
      this.trailMaterials.push(trailMaterial);
      this.trailPoints.push(trailPoint);
      this.trailPositions.push(trailPositions);
    }
  }

  update(soundWaveData: SoundWaveData, deltaTime: number): void {
    const { frequency, amplitude, time, waveform } = soundWaveData;

    for (let i = this.trailCount - 1; i >= 0; i--) {
      const sourcePositions = i === 0 ? this.positions : this.trailPositions[i - 1];
      this.trailPositions[i].set(sourcePositions);

      const sourceColors = i === 0 ? this.colors : (this.trailGeometries[i - 1].attributes.color as THREE.BufferAttribute).array as Float32Array;
      const targetColors = (this.trailGeometries[i].attributes.color as THREE.BufferAttribute).array as Float32Array;
      targetColors.set(sourceColors);
    }

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;

      const ox = this.originalPositions[i3];
      const oy = this.originalPositions[i3 + 1];
      const oz = this.originalPositions[i3 + 2];

      const len = Math.sqrt(ox * ox + oy * oy + oz * oz) || 1;
      const nx = ox / len;
      const ny = oy / len;
      const nz = oz / len;

      const phase = this.phases[i];
      let waveValue = 0;
      const t = 2 * Math.PI * (frequency / 60) * time + phase;

      switch (waveform) {
        case 'sine':
          waveValue = Math.sin(t);
          break;
        case 'square':
          waveValue = Math.sin(t) >= 0 ? 1 : -1;
          break;
        case 'sawtooth':
          waveValue = 2 * (t / (2 * Math.PI) - Math.floor(t / (2 * Math.PI) + 0.5));
          break;
        case 'triangle':
          waveValue = 2 * Math.abs(2 * (t / (2 * Math.PI) - Math.floor(t / (2 * Math.PI) + 0.5))) - 1;
          break;
      }

      const offset = amplitude * 30 * waveValue;

      this.positions[i3] = ox + nx * offset;
      this.positions[i3 + 1] = oy + ny * offset;
      this.positions[i3 + 2] = oz + nz * offset;

      let color: THREE.Color;
      if (amplitude < 0.2) {
        const t2 = amplitude / 0.2;
        color = new THREE.Color().lerpColors(
          new THREE.Color('#4FC3F7'),
          new THREE.Color('#7E57C2'),
          t2
        );
      } else if (amplitude < 0.5) {
        const t2 = (amplitude - 0.2) / 0.3;
        color = new THREE.Color().lerpColors(
          new THREE.Color('#7E57C2'),
          new THREE.Color('#E53935'),
          t2 * 0.6
        );
      } else {
        const t2 = (amplitude - 0.5) / 0.5;
        color = new THREE.Color().lerpColors(
          new THREE.Color('#E53935'),
          new THREE.Color('#FF6B6B'),
          t2
        );
      }

      const brightness = 0.7 + 0.3 * Math.abs(waveValue);
      this.colors[i3] = color.r * brightness;
      this.colors[i3 + 1] = color.g * brightness;
      this.colors[i3 + 2] = color.b * brightness;
    }

    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;

    for (let i = 0; i < this.trailCount; i++) {
      (this.trailGeometries[i].attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (this.trailGeometries[i].attributes.color as THREE.BufferAttribute).needsUpdate = true;
    }
  }

  getAverageAmplitudeResponse(): number {
    let total = 0;
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const dx = this.positions[i3] - this.originalPositions[i3];
      const dy = this.positions[i3 + 1] - this.originalPositions[i3 + 1];
      const dz = this.positions[i3 + 2] - this.originalPositions[i3 + 2];
      total += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    return total / this.count / 30;
  }

  addToScene(scene: THREE.Scene): void {
    scene.add(this.points);
    for (const trail of this.trailPoints) {
      scene.add(trail);
    }
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    for (let i = 0; i < this.trailCount; i++) {
      this.trailGeometries[i].dispose();
      this.trailMaterials[i].dispose();
    }
  }
}
