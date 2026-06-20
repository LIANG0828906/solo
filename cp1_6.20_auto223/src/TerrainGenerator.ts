import * as THREE from 'three';
import type { SpectrumFrame, TerrainData } from './types';

const TERRAIN_WIDTH = 60;
const TERRAIN_DEPTH = 80;
const HEIGHT_SCALE = 15;
const SMOOTH_ITERATIONS = 2;

export class TerrainGenerator {
  private spectrumData: SpectrumFrame[];
  private terrainData: TerrainData | null = null;
  private maxAmplitude: number = 0;

  constructor(spectrumData: SpectrumFrame[]) {
    this.spectrumData = spectrumData;
    this.computeMaxAmplitude();
  }

  private computeMaxAmplitude(): void {
    let max = 0;
    for (const frame of this.spectrumData) {
      for (let i = 0; i < frame.frequencies.length; i++) {
        if (frame.frequencies[i] > max) {
          max = frame.frequencies[i];
        }
      }
    }
    this.maxAmplitude = max || 1;
  }

  generateGeometry(): TerrainData {
    const numFrames = this.spectrumData.length;
    const numFreqBins = Math.min(this.spectrumData[0]?.frequencies.length || 256, 128);

    const resampled = this.resampleData(numFrames, numFreqBins);
    const smoothed = this.smoothData(resampled, numFrames, numFreqBins);

    const widthSegments = numFreqBins - 1;
    const depthSegments = numFrames - 1;

    const vertices = new Float32Array((numFreqBins * numFrames) * 3);
    const colors = new Float32Array((numFreqBins * numFrames) * 3);
    const indices = new Uint32Array(widthSegments * depthSegments * 6);

    const xStep = TERRAIN_WIDTH / (numFreqBins - 1);
    const zStep = TERRAIN_DEPTH / (numFrames - 1);

    for (let frameIndex = 0; frameIndex < numFrames; frameIndex++) {
      for (let freqIndex = 0; freqIndex < numFreqBins; freqIndex++) {
        const vertexIndex = frameIndex * numFreqBins + freqIndex;
        const posIndex = vertexIndex * 3;
        const colorIndex = vertexIndex * 3;

        const x = (freqIndex * xStep) - TERRAIN_WIDTH / 2;
        const z = (frameIndex * zStep) - TERRAIN_DEPTH / 2;
        const amplitude = smoothed[frameIndex][freqIndex];
        const normalizedAmp = amplitude / this.maxAmplitude;
        const y = normalizedAmp * HEIGHT_SCALE;

        vertices[posIndex] = x;
        vertices[posIndex + 1] = y;
        vertices[posIndex + 2] = z;

        const color = this.getFrequencyColor(freqIndex / (numFreqBins - 1), normalizedAmp);
        colors[colorIndex] = color.r;
        colors[colorIndex + 1] = color.g;
        colors[colorIndex + 2] = color.b;
      }
    }

    let index = 0;
    for (let z = 0; z < depthSegments; z++) {
      for (let x = 0; x < widthSegments; x++) {
        const a = z * numFreqBins + x;
        const b = a + numFreqBins;
        const c = a + 1;
        const d = b + 1;

        indices[index++] = a;
        indices[index++] = b;
        indices[index++] = c;
        indices[index++] = b;
        indices[index++] = d;
        indices[index++] = c;
      }
    }

    this.terrainData = {
      vertices,
      colors,
      indices,
      dimensions: {
        width: TERRAIN_WIDTH,
        depth: TERRAIN_DEPTH,
        heightScale: HEIGHT_SCALE
      }
    };

    return this.terrainData;
  }

  private resampleData(numFrames: number, numFreqBins: number): number[][] {
    const result: number[][] = [];
    const originalBins = this.spectrumData[0]?.frequencies.length || 256;

    for (let f = 0; f < numFrames; f++) {
      const frame: number[] = [];
      const originalFrame = this.spectrumData[f];

      for (let b = 0; b < numFreqBins; b++) {
        const originalPos = (b / (numFreqBins - 1)) * (originalBins - 1);
        const lower = Math.floor(originalPos);
        const upper = Math.min(lower + 1, originalBins - 1);
        const t = originalPos - lower;

        const val1 = originalFrame?.frequencies[lower] || 0;
        const val2 = originalFrame?.frequencies[upper] || 0;
        frame.push(val1 * (1 - t) + val2 * t);
      }
      result.push(frame);
    }

    return result;
  }

  private smoothData(data: number[][], numFrames: number, numFreqBins: number): number[][] {
    let current = data.map(row => [...row]);

    for (let iter = 0; iter < SMOOTH_ITERATIONS; iter++) {
      const next: number[][] = [];

      for (let f = 0; f < numFrames; f++) {
        const row: number[] = [];
        for (let b = 0; b < numFreqBins; b++) {
          let sum = 0;
          let count = 0;

          for (let df = -1; df <= 1; df++) {
            for (let db = -1; db <= 1; db++) {
              const nf = f + df;
              const nb = b + db;
              if (nf >= 0 && nf < numFrames && nb >= 0 && nb < numFreqBins) {
                sum += current[nf][nb];
                count++;
              }
            }
          }

          row.push(sum / count);
        }
        next.push(row);
      }

      current = next;
    }

    return current;
  }

  private getFrequencyColor(freqRatio: number, amplitude: number): { r: number; g: number; b: number } {
    const colorStops = [
      { pos: 0, r: 0.1, g: 0.3, b: 0.9 },
      { pos: 0.3, r: 0.2, g: 0.7, b: 0.8 },
      { pos: 0.5, r: 0.4, g: 0.85, b: 0.5 },
      { pos: 0.7, r: 0.9, g: 0.75, b: 0.3 },
      { pos: 1, r: 0.95, g: 0.25, b: 0.25 }
    ];

    let lower = colorStops[0];
    let upper = colorStops[colorStops.length - 1];

    for (let i = 0; i < colorStops.length - 1; i++) {
      if (freqRatio >= colorStops[i].pos && freqRatio <= colorStops[i + 1].pos) {
        lower = colorStops[i];
        upper = colorStops[i + 1];
        break;
      }
    }

    const range = upper.pos - lower.pos || 1;
    const t = (freqRatio - lower.pos) / range;

    const brightness = 0.4 + amplitude * 0.6;

    return {
      r: (lower.r + (upper.r - lower.r) * t) * brightness,
      g: (lower.g + (upper.g - lower.g) * t) * brightness,
      b: (lower.b + (upper.b - lower.b) * t) * brightness
    };
  }

  getMesh(): THREE.Mesh {
    if (!this.terrainData) {
      this.generateGeometry();
    }
    if (!this.terrainData) {
      throw new Error('Terrain data not generated');
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.terrainData.vertices, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.terrainData.colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(this.terrainData.indices, 1));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      roughness: 0.4,
      metalness: 0.1,
      wireframe: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    mesh.userData.terrainDimensions = this.terrainData.dimensions;
    mesh.userData.spectrumData = this.spectrumData;

    return mesh;
  }

  getWireframeMesh(): THREE.LineSegments {
    if (!this.terrainData) {
      this.generateGeometry();
    }
    if (!this.terrainData) {
      throw new Error('Terrain data not generated');
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.terrainData.vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(this.terrainData.indices, 1));

    const edges = new THREE.EdgesGeometry(geometry, 20);
    const material = new THREE.LineBasicMaterial({
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0.25
    });

    return new THREE.LineSegments(edges, material);
  }

  getVertexAt(timeIndex: number, freqIndex: number): THREE.Vector3 {
    if (!this.terrainData) {
      this.generateGeometry();
    }
    if (!this.terrainData) {
      throw new Error('Terrain data not generated');
    }

    const numFreqBins = Math.min(this.spectrumData[0]?.frequencies.length || 256, 128);
    const vertexIndex = timeIndex * numFreqBins + freqIndex;
    const posIndex = vertexIndex * 3;

    return new THREE.Vector3(
      this.terrainData.vertices[posIndex],
      this.terrainData.vertices[posIndex + 1],
      this.terrainData.vertices[posIndex + 2]
    );
  }

  getPositionFromTimeAndFreq(time: number, freqIndex: number): THREE.Vector3 {
    if (!this.terrainData) {
      this.generateGeometry();
    }
    if (!this.terrainData) {
      throw new Error('Terrain data not generated');
    }

    const numFrames = this.spectrumData.length;
    const duration = this.spectrumData[numFrames - 1]?.time || 1;

    const frameIndex = Math.min(Math.floor((time / duration) * numFrames), numFrames - 1);
    return this.getVertexAt(frameIndex, freqIndex);
  }

  highlightTimeRange(startTime: number, endTime: number): THREE.Mesh {
    if (!this.terrainData) {
      this.generateGeometry();
    }
    if (!this.terrainData) {
      throw new Error('Terrain data not generated');
    }

    const numFrames = this.spectrumData.length;
    const duration = this.spectrumData[numFrames - 1]?.time || 1;

    const startFrame = Math.floor((startTime / duration) * numFrames);
    const endFrame = Math.ceil((endTime / duration) * numFrames);

    const { width, depth } = this.terrainData.dimensions;
    const zStep = depth / (numFrames - 1);

    const zStart = (startFrame * zStep) - depth / 2;
    const zEnd = (endFrame * zStep) - depth / 2;
    const zCenter = (zStart + zEnd) / 2;
    const zSize = Math.abs(zEnd - zStart) || zStep;

    const geometry = new THREE.PlaneGeometry(width * 1.02, zSize * 1.02, 1, 1);
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.MeshBasicMaterial({
      color: 0xffeb96,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0.05, zCenter);

    return mesh;
  }

  getSpectrumData(): SpectrumFrame[] {
    return this.spectrumData;
  }

  getDimensions(): { width: number; depth: number; heightScale: number } {
    if (!this.terrainData) {
      this.generateGeometry();
    }
    return this.terrainData?.dimensions || { width: TERRAIN_WIDTH, depth: TERRAIN_DEPTH, heightScale: HEIGHT_SCALE };
  }

  getMaxAmplitude(): number {
    return this.maxAmplitude;
  }
}
