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
  private oldWaveformMesh: THREE.LineSegments | null = null;
  private envelopeHelper: THREE.Mesh | null = null;
  private envelopeHelperColors: Float32Array | null = null;
  private geometry: THREE.BufferGeometry;
  private oldGeometry: THREE.BufferGeometry | null = null;
  private positions: Float32Array;
  private colors: Float32Array;

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
    const segW = 32;
    const segH = 16;
    const geometry = new THREE.PlaneGeometry(this.gridWidth, this.gridDepth, segW, segH);
    
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const vertexCount = posAttr.count;
    const colors = new Float32Array(vertexCount * 3);
    this.envelopeHelperColors = colors;

    const green = new THREE.Color(0x00ff88);
    const orange = new THREE.Color(0xffaa00);
    const blue = new THREE.Color(0x00d4ff);
    const red = new THREE.Color(0xff4466);

    for (let i = 0; i < vertexCount; i++) {
      const x = posAttr.getX(i);
      const normalizedX = (x + this.gridWidth / 2) / this.gridWidth;
      const c = new THREE.Color();

      if (normalizedX < 0.25) {
        c.lerpColors(green, orange, normalizedX / 0.25);
      } else if (normalizedX < 0.5) {
        c.lerpColors(orange, blue, (normalizedX - 0.25) / 0.25);
      } else {
        c.lerpColors(blue, red, (normalizedX - 0.5) / 0.5);
      }

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.envelopeHelper = new THREE.Mesh(geometry, material);
    this.envelopeHelper.rotation.x = -Math.PI / 2;
    this.envelopeHelper.position.y = -3;
    this.envelopeHelper.visible = false;
    this.group.add(this.envelopeHelper);
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

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.computeBoundingSphere();
  }

  public setWaveformType(newType: OscillatorType): void {
    if (newType === this.params.type && !this.transition.active) return;

    if (this.oldWaveformMesh) {
      this.group.remove(this.oldWaveformMesh);
      (this.oldWaveformMesh.material as THREE.Material).dispose();
      this.oldGeometry?.dispose();
      this.oldWaveformMesh = null;
      this.oldGeometry = null;
    }

    this.oldGeometry = this.geometry.clone();

    const oldMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.oldWaveformMesh = new THREE.LineSegments(this.oldGeometry, oldMaterial);
    this.group.add(this.oldWaveformMesh);

    (this.waveformMesh.material as THREE.LineBasicMaterial).opacity = 0;

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

    if (this.oldWaveformMesh) {
      (this.oldWaveformMesh.material as THREE.LineBasicMaterial).opacity = 1 - progress;
    }
    (this.waveformMesh.material as THREE.LineBasicMaterial).opacity = progress;

    if (progress >= 1) {
      this.transition.active = false;
      if (this.oldWaveformMesh) {
        this.group.remove(this.oldWaveformMesh);
        (this.oldWaveformMesh.material as THREE.Material).dispose();
        this.oldGeometry?.dispose();
        this.oldWaveformMesh = null;
        this.oldGeometry = null;
      }
      (this.waveformMesh.material as THREE.LineBasicMaterial).opacity = 1;
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

    let index = 0;

    for (let row = 0; row < rows && index < maxIndex; row++) {
      for (let col = 0; col < cols - 1 && index < maxIndex; col++) {
        const x1 = -halfWidth + col * stepX;
        const x2 = -halfWidth + (col + 1) * stepX;
        const z = -halfDepth + row * stepZ;

        const phaseOffset1 = (x1 / this.gridWidth) * Math.PI * 4 + this.phase;
        const phaseOffset2 = (x2 / this.gridWidth) * Math.PI * 4 + this.phase;
        const depthFactor = 1 - Math.abs(z) / halfDepth * 0.5;

        const y1 = getWaveformValue(currentType, phaseOffset1) * amplitude * 3 * depthFactor;
        const y2 = getWaveformValue(currentType, phaseOffset2) * amplitude * 3 * depthFactor;

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

        const y1 = getWaveformValue(currentType, phaseOffset) * amplitude * 3 * depthFactor1;
        const y2 = getWaveformValue(currentType, phaseOffset) * amplitude * 3 * depthFactor2;

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
    if (!this.envelopeHelper || !this.envelopeHelperColors) return;

    const material = this.envelopeHelper.material as THREE.MeshBasicMaterial;

    if (envelope.phase === 'idle') {
      this.envelopeHelper.visible = false;
      return;
    }

    this.envelopeHelper.visible = true;
    const scaleY = 0.5 + envelope.amplitude * 0.5;
    this.envelopeHelper.scale.y = scaleY;
    this.envelopeHelper.position.y = -3 + envelope.amplitude * 2;

    const colorAttr = this.envelopeHelper.geometry.getAttribute('color') as THREE.BufferAttribute;
    const baseColors = this.envelopeHelperColors;
    const colors = colorAttr.array as Float32Array;
    const vertexCount = colorAttr.count;

    const phaseRegionStart = { attack: 0, decay: 0.25, sustain: 0.5, release: 0.75 };
    const regionStart = phaseRegionStart[envelope.phase as keyof typeof phaseRegionStart] ?? 0;
    const regionWidth = 0.25;

    const posAttr = this.envelopeHelper.geometry.getAttribute('position') as THREE.BufferAttribute;

    for (let i = 0; i < vertexCount; i++) {
      const x = posAttr.getX(i);
      const normalizedX = (x + this.gridWidth / 2) / this.gridWidth;
      const distFromPhase = Math.abs(normalizedX - (regionStart + regionWidth / 2));
      const inPhase = distFromPhase < regionWidth;
      const alpha = inPhase ? 0.15 * (1 - distFromPhase / regionWidth) : 0.03;

      colors[i * 3] = baseColors[i * 3] * alpha;
      colors[i * 3 + 1] = baseColors[i * 3 + 1] * alpha;
      colors[i * 3 + 2] = baseColors[i * 3 + 2] * alpha;
    }

    colorAttr.needsUpdate = true;

    let baseOpacity = 0;
    switch (envelope.phase) {
      case 'attack':
        baseOpacity = 0.08 + envelope.progress * 0.12;
        break;
      case 'decay':
        baseOpacity = 0.15 + (1 - envelope.progress) * 0.05;
        break;
      case 'sustain':
        baseOpacity = 0.1;
        break;
      case 'release':
        baseOpacity = 0.08 + envelope.amplitude * 0.12;
        break;
    }
    material.opacity = baseOpacity;
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
    if (this.oldWaveformMesh) {
      (this.oldWaveformMesh.material as THREE.Material).dispose();
    }
    this.oldGeometry?.dispose();
    if (this.envelopeHelper) {
      this.envelopeHelper.geometry.dispose();
      (this.envelopeHelper.material as THREE.Material).dispose();
    }
  }
}
