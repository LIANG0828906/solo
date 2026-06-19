import * as THREE from 'three';

export interface ParticleParams {
  stormIntensity: number;
  speedMultiplier: number;
  pulseAmplitude: number;
  time: number;
  delta: number;
}

export interface ParticleData {
  baseX: Float32Array;
  baseY: Float32Array;
  baseZ: Float32Array;
  velocityZ: Float32Array;
  phase: Float32Array;
  sizeBase: Float32Array;
  colorMix: Float32Array;
}

const Z_MIN = -100;
const Z_MAX = 100;
const X_HALF_WIDTH = 100;
const Y_MIN = -20;
const Y_MAX = 30;
const BASE_COUNT = 8000;
const STORM_EXTRA_COUNT = 4000;
const TOTAL_COUNT = BASE_COUNT + STORM_EXTRA_COUNT;

const COLOR_GREEN = new THREE.Color('#00FF88');
const COLOR_PURPLE = new THREE.Color('#AA88FF');
const COLOR_STORM_RED = new THREE.Color('#FF3344');

export class ParticleSystem {
  public geometry: THREE.BufferGeometry;
  public material: THREE.PointsMaterial;
  public points: THREE.Points;
  public totalCount = TOTAL_COUNT;

  private data: ParticleData;
  private positionArray: Float32Array;
  private colorArray: Float32Array;
  private sizeArray: Float32Array;
  private tmpColor = new THREE.Color();

  constructor() {
    this.data = this.initParticleData();
    this.positionArray = new Float32Array(TOTAL_COUNT * 3);
    this.colorArray = new Float32Array(TOTAL_COUNT * 3);
    this.sizeArray = new Float32Array(TOTAL_COUNT);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positionArray, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colorArray, 3));

    this.material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.initAttributes();
  }

  private initParticleData(): ParticleData {
    const baseX = new Float32Array(TOTAL_COUNT);
    const baseY = new Float32Array(TOTAL_COUNT);
    const baseZ = new Float32Array(TOTAL_COUNT);
    const velocityZ = new Float32Array(TOTAL_COUNT);
    const phase = new Float32Array(TOTAL_COUNT);
    const sizeBase = new Float32Array(TOTAL_COUNT);
    const colorMix = new Float32Array(TOTAL_COUNT);

    for (let i = 0; i < TOTAL_COUNT; i++) {
      const xFactor = Math.random() * 2 - 1;
      baseX[i] = xFactor * X_HALF_WIDTH;
      baseY[i] = Y_MIN + Math.random() * (Y_MAX - Y_MIN);
      baseZ[i] = Z_MIN + Math.random() * (Z_MAX - Z_MIN);
      velocityZ[i] = 2 + Math.random() * 3;
      phase[i] = Math.random() * Math.PI * 2;
      sizeBase[i] = 0.15 + Math.random() * 0.25;
      const edgeT = Math.abs(xFactor);
      colorMix[i] = Math.pow(edgeT, 1.5);
    }
    return { baseX, baseY, baseZ, velocityZ, phase, sizeBase, colorMix };
  }

  private initAttributes(): void {
    for (let i = 0; i < TOTAL_COUNT; i++) {
      this.positionArray[i * 3] = this.data.baseX[i];
      this.positionArray[i * 3 + 1] = this.data.baseY[i];
      this.positionArray[i * 3 + 2] = this.data.baseZ[i];
    }
    this.geometry.attributes.position.needsUpdate = true;
  }

  public update(params: ParticleParams): void {
    const { stormIntensity, speedMultiplier, pulseAmplitude, time, delta } = params;
    const { baseX, baseY, baseZ, velocityZ, phase, sizeBase, colorMix } = this.data;

    const stormSpeedBoost = 1 + stormIntensity * 1.5;
    const effectiveSpeed = speedMultiplier * stormSpeedBoost;

    const flashCycle = stormIntensity > 0.1 ? (Math.sin(time * (Math.PI * 2 / 0.3)) * 0.5 + 0.5) : 0;
    const flashFactor = flashCycle * stormIntensity;

    const visibleCount = BASE_COUNT + Math.floor(STORM_EXTRA_COUNT * stormIntensity);
    this.geometry.setDrawRange(0, visibleCount);

    const zRange = Z_MAX - Z_MIN;

    for (let i = 0; i < TOTAL_COUNT; i++) {
      const idx = i * 3;
      let z = this.positionArray[idx + 2] + velocityZ[i] * effectiveSpeed * delta;

      if (z > Z_MAX) z -= zRange;
      if (z < Z_MIN) z += zRange;

      const waveOffset = Math.sin(time * 0.6 + phase[i]) * 1.2 * pulseAmplitude;
      const yWave = Math.sin(time * 0.8 + phase[i] * 1.3) * 0.8 * pulseAmplitude;
      const stormWaveX = stormIntensity * Math.sin(time * 3 + phase[i] * 2) * 4;
      const stormWaveY = stormIntensity * Math.sin(time * 2.5 + phase[i] * 1.7) * 2.5;

      this.positionArray[idx] = baseX[i] + waveOffset + stormWaveX;
      this.positionArray[idx + 1] = baseY[i] + yWave + stormWaveY;
      this.positionArray[idx + 2] = z;

      this.tmpColor.copy(COLOR_GREEN).lerp(COLOR_PURPLE, colorMix[i]);
      if (flashFactor > 0.001) {
        this.tmpColor.lerp(COLOR_STORM_RED, flashFactor);
      }
      this.colorArray[idx] = this.tmpColor.r;
      this.colorArray[idx + 1] = this.tmpColor.g;
      this.colorArray[idx + 2] = this.tmpColor.b;

      const pulseCycle = Math.sin((time + phase[i]) * (Math.PI * 2 / 3)) * 0.5 + 0.5;
      const pulse = 0.7 + pulseCycle * 0.6 * pulseAmplitude;
      const stormPulse = 1 + stormIntensity * (0.5 + Math.sin(time * 10 + phase[i]) * 0.3);
      this.sizeArray[i] = sizeBase[i] * pulse * stormPulse;
    }

    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;

    this.material.opacity = 0.85 + stormIntensity * 0.15;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
