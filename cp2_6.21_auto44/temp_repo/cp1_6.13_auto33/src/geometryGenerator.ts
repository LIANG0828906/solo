import * as THREE from 'three';
import type { PresetConfig } from './types';

const LERP_SPEED = 0.1;
const BAND_COUNT = 32;
const LATITUDE_BANDS = 8;
const LONGITUDE_BANDS = 16;

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
    const normAttr = this.geometry.getAttribute('normal') as THREE.BufferAttribute;

    for (let i = 0; i < this.vertexCount; i++) {
      const i3 = i * 3;
      const nx = this.baseNormals[i3]!;
      const ny = this.baseNormals[i3 + 1]!;
      const nz = this.baseNormals[i3 + 2]!;

      const longitude = (Math.atan2(nz, nx) + Math.PI) / (2 * Math.PI);
      const latitude = Math.acos(Math.min(1, Math.max(-1, ny))) / Math.PI;

      const lonBand = longitude * LONGITUDE_BANDS;
      const latBand = latitude * LATITUDE_BANDS;

      const lon0 = Math.floor(lonBand);
      const lat0 = Math.floor(latBand);
      const lonFrac = lonBand - lon0;
      const latFrac = latBand - lat0;

      const getBandIdx = (lon: number, lat: number): number => {
        const l = ((lon % LONGITUDE_BANDS) + LONGITUDE_BANDS) % LONGITUDE_BANDS;
        const la = Math.max(0, Math.min(LATITUDE_BANDS - 1, lat));
        return Math.floor(la * 4 + (l / LONGITUDE_BANDS) * 32) % BAND_COUNT;
      };

      const idx00 = getBandIdx(lon0, lat0);
      const idx10 = getBandIdx(lon0 + 1, lat0);
      const idx01 = getBandIdx(lon0, lat0 + 1);
      const idx11 = getBandIdx(lon0 + 1, lat0 + 1);

      const e00 = bands[idx00] ?? 0;
      const e10 = bands[idx10] ?? 0;
      const e01 = bands[idx01] ?? 0;
      const e11 = bands[idx11] ?? 0;

      const ex0 = e00 * (1 - lonFrac) + e10 * lonFrac;
      const ex1 = e01 * (1 - lonFrac) + e11 * lonFrac;
      const energy = ex0 * (1 - latFrac) + ex1 * latFrac;

      const continuousBandIdx = (latBand * 4 + (lonBand / LONGITUDE_BANDS) * 32) % BAND_COUNT;

      const displacement = energy * maxDisplacement;
      this.targetPositions[i3] = this.basePositions[i3]! + nx * displacement;
      this.targetPositions[i3 + 1] = this.basePositions[i3 + 1]! + ny * displacement;
      this.targetPositions[i3 + 2] = this.basePositions[i3 + 2]! + nz * displacement;

      let hue: number, sat: number, lum: number;
      if (continuousBandIdx < 9) {
        hue = 0.6 - (continuousBandIdx / 9) * 0.1;
        sat = presetCfg.saturation;
        lum = 0.4 + energy * 0.3;
      } else if (continuousBandIdx < 25) {
        const t = (continuousBandIdx - 9) / 15;
        hue = 0.5 - t * 0.38;
        sat = presetCfg.saturation;
        lum = 0.45 + energy * 0.25;
      } else {
        const t = (continuousBandIdx - 25) / 6;
        hue = 0.12 - t * 0.12;
        sat = presetCfg.saturation;
        lum = 0.45 + energy * 0.3;
      }

      hue = (hue + presetCfg.baseHue - 0.55 + 1) % 1;
      const [r, g, b] = hslToRgb(hue, sat, lum);
      colAttr.array[i3] = r;
      colAttr.array[i3 + 1] = g;
      colAttr.array[i3 + 2] = b;
    }

    for (let i = 0; i < this.currentPositions.length; i++) {
      this.currentPositions[i] = this.currentPositions[i]! + (this.targetPositions[i]! - this.currentPositions[i]!) * LERP_SPEED;
    }

    const positionData = posAttr.array as Float32Array;
    const normalData = normAttr.array as Float32Array;
    positionData.set(this.currentPositions);
    posAttr.updateRange.offset = 0;
    posAttr.updateRange.count = this.currentPositions.length;
    posAttr.needsUpdate = true;

    this.geometry.computeVertexNormals();
    normAttr.updateRange.offset = 0;
    normAttr.updateRange.count = normalData.length;
    normAttr.needsUpdate = true;

    colAttr.updateRange.offset = 0;
    colAttr.updateRange.count = this.vertexCount * 3;
    colAttr.needsUpdate = true;
  }

  reset(): void {
    this.targetPositions.set(this.basePositions);
  }
}
