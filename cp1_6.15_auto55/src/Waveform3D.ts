import * as THREE from 'three';
import {
  WaveformParams,
  EnvelopePhase,
  WaveformTransition,
  lerp,
  easeInOutCubic,
  getWaveformValue,
  freqToGridDensity,
  freqToAmplitudeScale
} from './types';

export class Waveform3D {
  private scene: THREE.Scene;
  private group: THREE.Group;
  private waveformMesh: THREE.LineSegments;
  private envelopeHelpers: Map<string, THREE.Mesh> = new Map();
  private geometry: THREE.BufferGeometry;
  private positions: Float32Array;
  private colors: Float32Array;
  private targetPositions: Float32Array;

  private params: WaveformParams;
  private transition: WaveformTransition;
  private currentDensity: number = 64;
  private targetDensity: number = 64;
  private maxVertices: number = 5000;

  private phase: number = 0;
  private time: number = 0;
  private displayAmplitude: number = 0;
  private targetAmplitude: number = 0;

  private baseColor: THREE.Color = new THREE.Color(0x00d4ff);
  private gridWidth: number = 16;
  private gridDepth: number = 8;

  constructor(scene: THREE.Scene, params: WaveformParams) {
    this.scene = scene;
    this.params = params;
    this.transition = {
      active: false,
      startTime: 0,
      duration: 500,
      fromType: 'sine',
      toType: 'sine'
    };

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.currentDensity = freqToGridDensity(params.frequency);
    this.targetDensity = this.currentDensity;

    const vertexCount = this.calculateVertexCount(this.currentDensity);
    this.positions = new Float32Array(vertexCount * 3);
    this.targetPositions = new Float32Array(vertexCount * 3);
    this.colors = new Float32Array(vertexCount * 3);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.waveformMesh = new THREE.LineSegments(this.geometry, material);
    this.group.add(this.waveformMesh);

    this.createEnvelopeHelper();
    this.initializeGrid();
  }

  private calculateVertexCount(density: number): number {
    const cols = density;
    const rows = Math.max(8, Math.floor(density / 4));
    const lineCount = (cols - 1) * rows + (rows - 1) * cols;
    return Math.min(lineCount * 2, this.maxVertices);
  }

  private createEnvelopeHelper(): void {
    const phases: Array<{name: string; color: number; opacity: number}> = [
      { name: 'attack', color: 0x00ff88, opacity: 0.08 },
      { name: 'decay', color: 0xffaa00, opacity: 0.07 },
      { name: 'sustain', color: 0x00d4ff, opacity: 0.06 },
      { name: 'release', color: 0xff4466, opacity: 0.08 }
    ];

    for (const p of phases) {
      const geometry = new THREE.PlaneGeometry(this.gridWidth, this.gridDepth, 1, 1);
      const material = new THREE.MeshBasicMaterial({
        color: p.color,
        transparent: true,
        opacity: p.opacity,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = -3;
      mesh.visible = false;
      this.group.add(mesh);
      this.envelopeHelpers.set(p.name, mesh);
    }
  }

  private initializeGrid(): void {
    const cols = Math.min(this.currentDensity, 128);
    const rows = Math.max(8, Math.floor(this.currentDensity / 4));
    const halfWidth = this.gridWidth / 2;
    const halfDepth = this.gridDepth / 2;
    const stepX = this.gridWidth / (cols - 1);
    const stepZ = this.gridDepth / (rows - 1);

    let index = 0;
    const maxIndex = Math.floor(this.maxVertices / 2);

    for (let row = 0; row < rows && index < maxIndex; row++) {
      for (let col = 0; col < cols - 1 && index < maxIndex; col++) {
        const x1 = -halfWidth + col * stepX;
        const x2 = -halfWidth + (col + 1) * stepX;
        const z = -halfDepth + row * stepZ;

        this.positions[index * 6] = x1;
        this.positions[index * 6 + 1] = 0;
        this.positions[index * 6 + 2] = z;
        this.positions[index * 6 + 3] = x2;
        this.positions[index * 6 + 4] = 0;
        this.positions[index * 6 + 5] = z;

        for (let i = 0; i < 2; i++) {
          this.colors[index * 6 + i * 3] = this.baseColor.r;
          this.colors[index * 6 + i * 3 + 1] = this.baseColor.g;
          this.colors[index * 6 + i * 3 + 2] = this.baseColor.b;
        }

        index++;
      }
    }

    for (let col = 0; col < cols && index < maxIndex; col++) {
      for (let row = 0; row < rows - 1 && index < maxIndex; row++) {
        const x = -halfWidth + col * stepX;
        const z1 = -halfDepth + row * stepZ;
        const z2 = -halfDepth + (row + 1) * stepZ;

        this.positions[index * 6] = x;
        this.positions[index * 6 + 1] = 0;
        this.positions[index * 6 + 2] = z1;
        this.positions[index * 6 + 3] = x;
        this.positions[index * 6 + 4] = 0;
        this.positions[index * 6 + 5] = z2;

        for (let i = 0; i < 2; i++) {
          this.colors[index * 6 + i * 3] = this.baseColor.r;
          this.colors[index * 6 + i * 3 + 1] = this.baseColor.g;
          this.colors[index * 6 + i * 3 + 2] = this.baseColor.b;
        }

        index++;
      }
    }

    this.targetPositions.set(this.positions);
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.computeBoundingSphere();
  }

  public setWaveformType(newType: OscillatorType): void {
    if (newType === this.params.type && !this.transition.active) return;

    this.transition = {
      active: true,
      startTime: performance.now(),
      duration: 500,
      fromType: this.params.type,
      toType: newType
    };

    this.params.type = newType;
  }

  public setFrequency(freq: number): void {
    this.params.frequency = freq;
    this.targetDensity = freqToGridDensity(freq);
  }

  public setEnvelopeParams(params: Partial<WaveformParams>): void {
    Object.assign(this.params, params);
  }

  public update(deltaTime: number, envelope: EnvelopePhase, isPlaying: boolean): void {
    this.time += deltaTime;

    const freqFactor = this.params.frequency / 440;
    this.phase += deltaTime * freqFactor * 2 * Math.PI;

    this.targetAmplitude = envelope.amplitude * freqToAmplitudeScale(this.params.frequency);
    this.displayAmplitude = lerp(this.displayAmplitude, this.targetAmplitude, deltaTime * 10);

    if (this.transition.active) {
      this.updateTransition();
    }

    this.updateGridShape(isPlaying, deltaTime);
    this.updateEnvelopeHelper(envelope);
    this.updateColors(envelope);

    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  private updateTransition(): void {
    const elapsed = performance.now() - this.transition.startTime;
    const progress = easeInOutCubic(Math.min(elapsed / this.transition.duration, 1));

    if (progress >= 1) {
      this.transition.active = false;
    }
  }

  private updateGridShape(isPlaying: boolean, deltaTime: number): void {
    const cols = Math.min(this.currentDensity, 128);
    const rows = Math.max(8, Math.floor(this.currentDensity / 4));
    const halfWidth = this.gridWidth / 2;
    const halfDepth = this.gridDepth / 2;
    const stepX = this.gridWidth / (cols - 1);
    const stepZ = this.gridDepth / (rows - 1);

    const currentType = this.params.type;
    const amplitude = isPlaying ? this.displayAmplitude : 0.3;
    const maxIndex = Math.floor(this.maxVertices / 2);

    let transitionProgress = 0;
    if (this.transition.active) {
      const elapsed = performance.now() - this.transition.startTime;
      transitionProgress = easeInOutCubic(Math.min(elapsed / this.transition.duration, 1));
    }

    let index = 0;

    for (let row = 0; row < rows && index < maxIndex; row++) {
      for (let col = 0; col < cols - 1 && index < maxIndex; col++) {
        const x1 = -halfWidth + col * stepX;
        const x2 = -halfWidth + (col + 1) * stepX;
        const z = -halfDepth + row * stepZ;

        const phaseOffset1 = (x1 / this.gridWidth) * Math.PI * 4 + this.phase;
        const phaseOffset2 = (x2 / this.gridWidth) * Math.PI * 4 + this.phase;
        const depthFactor = 1 - Math.abs(z) / halfDepth * 0.5;

        let y1 = getWaveformValue(currentType, phaseOffset1) * amplitude * 3 * depthFactor;
        let y2 = getWaveformValue(currentType, phaseOffset2) * amplitude * 3 * depthFactor;

        if (this.transition.active) {
          const oldY1 = getWaveformValue(this.transition.fromType, phaseOffset1) * amplitude * 3 * depthFactor;
          const oldY2 = getWaveformValue(this.transition.fromType, phaseOffset2) * amplitude * 3 * depthFactor;

          y1 = lerp(oldY1, y1, transitionProgress);
          y2 = lerp(oldY2, y2, transitionProgress);
        }

        this.positions[index * 6] = x1;
        this.positions[index * 6 + 1] = y1;
        this.positions[index * 6 + 2] = z;
        this.positions[index * 6 + 3] = x2;
        this.positions[index * 6 + 4] = y2;
        this.positions[index * 6 + 5] = z;

        index++;
      }
    }

    for (let col = 0; col < cols && index < maxIndex; col++) {
      for (let row = 0; row < rows - 1 && index < maxIndex; row++) {
        const x = -halfWidth + col * stepX;
        const z1 = -halfDepth + row * stepZ;
        const z2 = -halfDepth + (row + 1) * stepZ;

        const phaseOffset = (x / this.gridWidth) * Math.PI * 4 + this.phase;
        const depthFactor1 = 1 - Math.abs(z1) / halfDepth * 0.5;
        const depthFactor2 = 1 - Math.abs(z2) / halfDepth * 0.5;

        let y1 = getWaveformValue(currentType, phaseOffset) * amplitude * 3 * depthFactor1;
        let y2 = getWaveformValue(currentType, phaseOffset) * amplitude * 3 * depthFactor2;

        if (this.transition.active) {
          const oldY1 = getWaveformValue(this.transition.fromType, phaseOffset) * amplitude * 3 * depthFactor1;
          const oldY2 = getWaveformValue(this.transition.fromType, phaseOffset) * amplitude * 3 * depthFactor2;

          y1 = lerp(oldY1, y1, transitionProgress);
          y2 = lerp(oldY2, y2, transitionProgress);
        }

        this.positions[index * 6] = x;
        this.positions[index * 6 + 1] = y1;
        this.positions[index * 6 + 2] = z1;
        this.positions[index * 6 + 3] = x;
        this.positions[index * 6 + 4] = y2;
        this.positions[index * 6 + 5] = z2;

        index++;
      }
    }

    this.currentDensity = lerp(this.currentDensity, this.targetDensity, deltaTime * 5);
  }

  private updateEnvelopeHelper(envelope: EnvelopePhase): void {
    const phaseNames = ['attack', 'decay', 'sustain', 'release'];

    for (const name of phaseNames) {
      const mesh = this.envelopeHelpers.get(name);
      if (!mesh) continue;

      if (envelope.phase === 'idle' || envelope.phase !== name) {
        mesh.visible = false;
        continue;
      }

      mesh.visible = true;
      const material = mesh.material as THREE.MeshBasicMaterial;

      switch (envelope.phase) {
        case 'attack': {
          mesh.scale.y = 0.5 + envelope.amplitude * 0.5;
          mesh.position.y = -3 + envelope.amplitude * 2;
          material.opacity = 0.06 + envelope.progress * 0.04;
          break;
        }
        case 'decay': {
          mesh.scale.y = 0.5 + envelope.amplitude * 0.5;
          mesh.position.y = -3 + envelope.amplitude * 2;
          material.opacity = 0.06 + (1 - envelope.progress) * 0.04;
          break;
        }
        case 'sustain': {
          mesh.scale.y = 0.5 + envelope.amplitude * 0.5;
          mesh.position.y = -3 + envelope.amplitude * 2;
          material.opacity = 0.06;
          break;
        }
        case 'release': {
          mesh.scale.y = 0.5 + envelope.amplitude * 0.5;
          mesh.position.y = -3 + envelope.amplitude * 2;
          material.opacity = 0.06 + envelope.amplitude * 0.04;
          break;
        }
      }
    }
  }

  private updateColors(envelope: EnvelopePhase): void {
    const colorAttribute = this.geometry.attributes.color as THREE.BufferAttribute;
    const colors = colorAttribute.array as Float32Array;

    const baseR = this.baseColor.r;
    const baseG = this.baseColor.g;
    const baseB = this.baseColor.b;

    let intensityMod = 1;
    if (envelope.phase === 'attack') {
      intensityMod = 0.8 + envelope.progress * 0.4;
    } else if (envelope.phase === 'release') {
      intensityMod = 1 - envelope.progress * 0.3;
    }

    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = baseR * intensityMod;
      colors[i + 1] = baseG * intensityMod;
      colors[i + 2] = baseB * intensityMod;
    }

    colorAttribute.needsUpdate = true;
  }

  public resize(): void {
    this.group.position.y = 0;
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public dispose(): void {
    this.geometry.dispose();
    (this.waveformMesh.material as THREE.Material).dispose();
    for (const mesh of this.envelopeHelpers.values()) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.envelopeHelpers.clear();
  }
}
