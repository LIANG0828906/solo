import * as THREE from 'three';
import type { PresetType, PresetConfig, PRESET_CONFIGS } from './types';

const LERP_SPEED = 0.1;
const BAND_COUNT = 32;

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [r, g, b];
}

export class GeometryGenerator {
  private geometry: THREE.IcosahedronGeometry;
  private basePositions: Float32Array;
  private baseNormals: Float32Array;
  private currentPositions: Float32Array;
  private targetPositions: Float32Array;
  private vertexCount: number;
  private faceCount: number;

  constructor() {
    this.geometry = new THREE.IcosahedronGeometry(1, 3);
    this.geometry.computeVertexNormals();

    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const normAttr = this.geometry.getAttribute('normal') as THREE.BufferAttribute;

    this.vertexCount = posAttr.count;
    this.faceCount = this.vertexCount / 3;

    this.basePositions = new Float32Array(posAttr.array);
    this.baseNormals = new Float32Array(normAttr.array);
    this.currentPositions = new Float32Array(posAttr.array);
    this.targetPositions = new Float32Array(posAttr.array);

    const colors = new Float32Array(this.vertexCount * 3);
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }

  getGeometry(): THREE.IcosahedronGeometry {
    return this.geometry;
  }

  getFaceCount(): number {
    return this.faceCount;
  }

  update(bands: Float32Array, maxDisplacement: number, presetCfg: PresetConfig): void {
    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;

    for (let i = 0; i < this.vertexCount; i++) {
      const i3 = i * 3;
      const nx = this.baseNormals[i3]!;
      const ny = this.baseNormals[i3 + 1]!;
      const nz = this.baseNormals[i3 + 2]!;

      const theta = Math.atan2(nz, nx);
      const phi = Math.acos(Math.min(1, Math.max(-1, ny)));
      const horizontalBand = Math.floor(((theta + Math.PI) / (2 * Math.PI)) * BAND_COUNT) % BAND_COUNT;
      const verticalBand = Math.floor((phi / Math.PI) * BAND_COUNT) % BAND_COUNT;
      const bandIdx = (horizontalBand + verticalBand) >> 1;
      const energy = bands[bandIdx] ?? 0;

      const displacement = energy * maxDisplacement;
      this.targetPositions[i3] = this.basePositions[i3]! + nx * displacement;
      this.targetPositions[i3 + 1] = this.basePositions[i3 + 1]! + ny * displacement;
      this.targetPositions[i3 + 2] = this.basePositions[i3 + 2]! + nz * displacement;
    }

    for (let i = 0; i < this.currentPositions.length; i++) {
      this.currentPositions[i] = this.currentPositions[i]! + (this.targetPositions[i]! - this.currentPositions[i]!) * LERP_SPEED;
    }

    posAttr.array.set(this.currentPositions);
    posAttr.needsUpdate = true;
    this.geometry.computeVertexNormals();

    for (let i = 0; i < this.vertexCount; i++) {
      const i3 = i * 3;
      const nx = this.baseNormals[i3]!;
      const ny = this.baseNormals[i3 + 1]!;
      const nz = this.baseNormals[i3 + 2]!;

      const theta = Math.atan2(nz, nx);
      const phi = Math.acos(Math.min(1, Math.max(-1, ny)));
      const horizontalBand = Math.floor(((theta + Math.PI) / (2 * Math.PI)) * BAND_COUNT) % BAND_COUNT;
      const verticalBand = Math.floor((phi / Math.PI) * BAND_COUNT) % BAND_COUNT;
      const bandIdx = (horizontalBand + verticalBand) >> 1;

      let hue: number, sat: number, lum: number;
      if (bandIdx < 9) {
        hue = 0.6 - (bandIdx / 9) * 0.1;
        sat = presetCfg.saturation;
        lum = 0.4 + (bands[bandIdx] ?? 0) * 0.3;
      } else if (bandIdx < 25) {
        const t = (bandIdx - 9) / 15;
        hue = 0.5 - t * 0.38;
        sat = presetCfg.saturation;
        lum = 0.45 + (bands[bandIdx] ?? 0) * 0.25;
      } else {
        const t = (bandIdx - 25) / 6;
        hue = 0.12 - t * 0.12;
        sat = presetCfg.saturation;
        lum = 0.45 + (bands[bandIdx] ?? 0) * 0.3;
      }

      hue = (hue + presetCfg.baseHue - 0.55 + 1) % 1;
      const [r, g, b] = hslToRgb(hue, sat, lum);
      colAttr.array[i3] = r;
      colAttr.array[i3 + 1] = g;
      colAttr.array[i3 + 2] = b;
    }
    colAttr.needsUpdate = true;
  }

  reset(): void {
    this.targetPositions.set(this.basePositions);
  }
}
