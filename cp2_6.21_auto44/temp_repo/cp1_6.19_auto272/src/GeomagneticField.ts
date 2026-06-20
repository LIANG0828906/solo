import * as THREE from 'three';

const LINE_COUNT = 30;
const POINTS_PER_LINE = 100;
const TOTAL_VERTICES = LINE_COUNT * POINTS_PER_LINE;

const Y_GROUND = -50;
const Y_AURORA_BOTTOM = -15;

interface LineSeed {
  xCenter: number;
  zCenter: number;
  xSpan: number;
  curvature: number;
  phase: number;
  twistFreq: number;
}

export class GeomagneticField {
  public geometry: THREE.BufferGeometry;
  public material: THREE.LineBasicMaterial;
  public lines: THREE.LineSegments;

  private seeds: LineSeed[] = [];
  private positionArray: Float32Array;
  private basePositions: Float32Array;

  constructor() {
    this.positionArray = new Float32Array(TOTAL_VERTICES * 3);
    this.basePositions = new Float32Array(TOTAL_VERTICES * 3);
    this.seeds = this.generateSeeds();

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positionArray, 3));

    const indices: number[] = [];
    for (let l = 0; l < LINE_COUNT; l++) {
      const start = l * POINTS_PER_LINE;
      for (let p = 0; p < POINTS_PER_LINE - 1; p++) {
        indices.push(start + p, start + p + 1);
      }
    }
    this.geometry.setIndex(indices);

    this.material = new THREE.LineBasicMaterial({
      color: 0x88ddff,
      transparent: true,
      opacity: 0.3,
      linewidth: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.lines = new THREE.LineSegments(this.geometry, this.material);
    this.computeBasePositions();
  }

  private generateSeeds(): LineSeed[] {
    const seeds: LineSeed[] = [];
    for (let i = 0; i < LINE_COUNT; i++) {
      const t = i / (LINE_COUNT - 1);
      const xCenter = (t - 0.5) * 160;
      seeds.push({
        xCenter,
        zCenter: (Math.random() - 0.5) * 60,
        xSpan: 20 + Math.random() * 40,
        curvature: 0.6 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        twistFreq: 0.8 + Math.random() * 1.2,
      });
    }
    return seeds;
  }

  private computeBasePositions(): void {
    for (let l = 0; l < LINE_COUNT; l++) {
      const seed = this.seeds[l];
      const lineStart = l * POINTS_PER_LINE * 3;

      for (let p = 0; p < POINTS_PER_LINE; p++) {
        const t = p / (POINTS_PER_LINE - 1);
        const idx = lineStart + p * 3;

        const xOffset = (t - 0.5) * 2;
        const bell = Math.exp(-xOffset * xOffset * 2.5);
        const yCurve = (Y_AURORA_BOTTOM - Y_GROUND) * bell * seed.curvature;
        const y = Y_GROUND + yCurve;

        const x = seed.xCenter + (t - 0.5) * seed.xSpan;
        const z = seed.zCenter + Math.sin(t * Math.PI) * 8;

        this.basePositions[idx] = x;
        this.basePositions[idx + 1] = y;
        this.basePositions[idx + 2] = z;
      }
    }
    this.positionArray.set(this.basePositions);
    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  public update(stormIntensity: number, time: number): void {
    const bendBoost = 1 + stormIntensity * 0.3;
    const waveAmplitude = stormIntensity * 6;
    const waveFreq = 1 + stormIntensity * 2;

    for (let l = 0; l < LINE_COUNT; l++) {
      const seed = this.seeds[l];
      const lineStart = l * POINTS_PER_LINE * 3;

      for (let p = 0; p < POINTS_PER_LINE; p++) {
        const t = p / (POINTS_PER_LINE - 1);
        const idx = lineStart + p * 3;

        const baseX = this.basePositions[idx];
        const baseY = this.basePositions[idx + 1];
        const baseZ = this.basePositions[idx + 2];

        const midFactor = Math.sin(t * Math.PI);
        const bendY = (baseY - Y_GROUND) * (bendBoost - 1) * midFactor;

        const wavePhase = time * waveFreq + seed.phase + t * seed.twistFreq * 3;
        const waveX = Math.sin(wavePhase) * waveAmplitude * midFactor;
        const waveZ = Math.cos(wavePhase * 0.7 + t * 2) * waveAmplitude * 0.5 * midFactor;
        const waveY = Math.sin(wavePhase * 1.3) * waveAmplitude * 0.4 * midFactor;

        this.positionArray[idx] = baseX + waveX;
        this.positionArray[idx + 1] = baseY + bendY + waveY;
        this.positionArray[idx + 2] = baseZ + waveZ;
      }
    }
    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

    this.material.opacity = 0.3 + stormIntensity * 0.25;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
