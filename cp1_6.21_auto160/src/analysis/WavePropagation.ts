import { Vector3, BufferAttribute } from 'three';

export interface WaveFront {
  id: number;
  origin: Vector3;
  radius: number;
  maxRadius: number;
  age: number;
  isReflection: boolean;
  reflectedFrom?: Vector3;
  reflectionNormal?: Vector3;
  birthTime: number;
}

export interface PressureVertex {
  index: number;
  pressure: number;
}

const MAX_WAVEFRONTS = 200;
const WAVE_SPEED = 2.0;
const DECAY_FACTOR = 0.12;

export class WavePropagation {
  private waveFronts: WaveFront[] = [];
  private sourcePosition: Vector3 = new Vector3(0, 0, 0);
  private sourceFrequency: number = 440;
  private sourceIntensity: number = 80;
  private wallRoughness: number = 0.5;
  private nextId = 0;
  private lastEmitTime = 0;
  private emitInterval = 0.5;
  private caveVertices: Vector3[] = [];
  private caveNormals: Vector3[] = [];
  private pressureField: Float32Array = new Float32Array(0);
  private time = 0;

  setCaveGeometry(positions: Float32Array, normals: Float32Array): void {
    this.caveVertices = [];
    this.caveNormals = [];
    for (let i = 0; i < positions.length; i += 3) {
      this.caveVertices.push(new Vector3(positions[i], positions[i + 1], positions[i + 2]));
      this.caveNormals.push(new Vector3(-normals[i], -normals[i + 1], -normals[i + 2]));
    }
    this.pressureField = new Float32Array(this.caveVertices.length / 3);
  }

  setSource(position: Vector3, frequency: number, intensity: number): void {
    this.sourcePosition.copy(position);
    this.sourceFrequency = frequency;
    this.sourceIntensity = intensity;
  }

  setRoughness(roughness: number): void {
    this.wallRoughness = roughness;
  }

  update(deltaTime: number): void {
    this.time += deltaTime;

    if (this.time - this.lastEmitTime >= this.emitInterval) {
      this.emitWave();
      this.lastEmitTime = this.time;
    }

    for (let i = this.waveFronts.length - 1; i >= 0; i--) {
      const wf = this.waveFronts[i];
      wf.age += deltaTime;
      wf.radius += WAVE_SPEED * deltaTime;

      if (wf.radius > wf.maxRadius) {
        this.waveFronts.splice(i, 1);
        continue;
      }

      if (!wf.isReflection) {
        this.checkReflection(wf);
      }
    }

    while (this.waveFronts.length > MAX_WAVEFRONTS) {
      this.waveFronts.shift();
    }

    this.computePressureField();
  }

  private emitWave(): void {
    const maxR = 30;
    this.waveFronts.push({
      id: this.nextId++,
      origin: this.sourcePosition.clone(),
      radius: 0.01,
      maxRadius: maxR,
      age: 0,
      isReflection: false,
      birthTime: this.time,
    });
  }

  private checkReflection(wf: WaveFront): void {
    const step = Math.max(1, Math.floor(this.caveVertices.length / 60));
    for (let i = 0; i < this.caveVertices.length; i += step) {
      const v = this.caveVertices[i];
      const dist = v.distanceTo(wf.origin);
      if (Math.abs(dist - wf.radius) < WAVE_SPEED * 0.5) {
        const idx = Math.floor(i / 3);
        if (idx < this.caveNormals.length) {
          const normal = this.caveNormals[idx];
          const incident = v.clone().sub(wf.origin).normalize();
          const dot = incident.dot(normal);
          if (dot > 0.1) {
            const reflected = incident.clone().sub(normal.clone().multiplyScalar(2 * dot));
            const reflectionOrigin = v.clone();
            const scatter = this.wallRoughness * 0.3;

            this.waveFronts.push({
              id: this.nextId++,
              origin: reflectionOrigin,
              radius: 0.01,
              maxRadius: 15 * (1 - this.wallRoughness * 0.5),
              age: 0,
              isReflection: true,
              reflectedFrom: reflectionOrigin.clone(),
              reflectionNormal: normal.clone(),
              birthTime: this.time,
            });
            return;
          }
        }
      }
    }
  }

  private computePressureField(): void {
    const vertexCount = this.pressureField.length;
    const k = (2 * Math.PI * this.sourceFrequency) / 343;
    const amplitude = Math.pow(10, (this.sourceIntensity - 80) / 40);

    for (let i = 0; i < vertexCount; i++) {
      const vi = i * 3;
      if (vi >= this.caveVertices.length) break;
      const vertex = this.caveVertices[vi];
      let totalPressure = 0;

      for (const wf of this.waveFronts) {
        const dist = vertex.distanceTo(wf.origin);
        const phaseDist = Math.abs(dist - wf.radius);
        if (phaseDist < 2.0) {
          const decay = Math.exp(-DECAY_FACTOR * dist) * (wf.isReflection ? 0.6 : 1.0);
          const ageDecay = Math.exp(-0.3 * wf.age);
          const waveContrib = amplitude * decay * ageDecay *
            Math.cos(k * dist - 2 * Math.PI * this.sourceFrequency * this.time / 1000) /
            Math.max(1, Math.sqrt(dist));
          totalPressure += waveContrib;
        }
      }

      this.pressureField[i] = totalPressure;
    }
  }

  getWaveFronts(): WaveFront[] {
    return this.waveFronts;
  }

  getPressureField(): Float32Array {
    return this.pressureField;
  }

  getTime(): number {
    return this.time;
  }

  reset(): void {
    this.waveFronts = [];
    this.nextId = 0;
    this.time = 0;
    this.lastEmitTime = 0;
    this.pressureField.fill(0);
  }
}
