import * as THREE from 'three';
import type { AudioData, ScaleType } from './AudioAnalyzer';

const GRID_SIZE = 80;
const GRID_SPACING = 0.08;
const TOTAL_SIZE = GRID_SIZE * GRID_SPACING;
const HEIGHT_MAX = 0.6;
const HEIGHT_LOW = 0.15;
const FREQ_REF = 500;

export class TerrainMesh {
  private mesh: THREE.Mesh;
  private wireframe: THREE.LineSegments;
  private geometry: THREE.PlaneGeometry;
  private positions: Float32Array;
  private colors: Float32Array;
  private baseHeights: Float32Array;
  private colorLow = new THREE.Color(0x1A237E);
  private colorHigh = new THREE.Color(0xFFD54F);
  private tmpColor = new THREE.Color();
  private targetHeights: Float32Array;
  private scalePulseX: number = -TOTAL_SIZE / 2;
  private lastTime: number = 0;
  private frameCount: number = 0;

  constructor(scene: THREE.Scene) {
    this.geometry = new THREE.PlaneGeometry(
      TOTAL_SIZE, TOTAL_SIZE,
      GRID_SIZE - 1, GRID_SIZE - 1
    );
    this.geometry.rotateX(-Math.PI / 2);

    this.positions = this.geometry.attributes.position.array as Float32Array;
    this.colors = new Float32Array(this.positions.length);
    this.baseHeights = new Float32Array(GRID_SIZE * GRID_SIZE);
    this.targetHeights = new Float32Array(GRID_SIZE * GRID_SIZE);

    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const x = (i % GRID_SIZE) * GRID_SPACING - TOTAL_SIZE / 2;
      const z = Math.floor(i / GRID_SIZE) * GRID_SPACING - TOTAL_SIZE / 2;
      const dist = Math.sqrt(x * x + z * z);
      this.baseHeights[i] = 0.02 * Math.sin(dist * 5);
      this.targetHeights[i] = 0;
    }

    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      flatShading: false,
      shininess: 30
    });

    this.mesh = new THREE.Mesh(this.geometry, material);

    const edges = new THREE.EdgesGeometry(this.geometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x3A3A5A,
      transparent: true,
      opacity: 0.2
    });
    this.wireframe = new THREE.LineSegments(edges, lineMaterial);

    const gridHelper = new THREE.GridHelper(
      TOTAL_SIZE + 0.5, GRID_SIZE,
      0xFFFFFF, 0xFFFFFF
    );
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.15;
    gridHelper.position.y = -0.05;
    scene.add(gridHelper);

    scene.add(this.mesh);
    scene.add(this.wireframe);
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  getPeakPositions(count: number): Array<{ x: number; y: number; z: number }> {
    const peaks: Array<{ idx: number; height: number; x: number; y: number; z: number }> = [];

    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const y = this.positions[i * 3 + 1];
      if (peaks.length < count) {
        peaks.push({
          idx: i,
          height: y,
          x: this.positions[i * 3],
          y,
          z: this.positions[i * 3 + 2]
        });
        peaks.sort((a, b) => b.height - a.height);
      } else if (y > peaks[peaks.length - 1].height) {
        peaks[peaks.length - 1] = {
          idx: i,
          height: y,
          x: this.positions[i * 3],
          y,
          z: this.positions[i * 3 + 2]
        };
        peaks.sort((a, b) => b.height - a.height);
      }
    }

    return peaks.map(p => ({ x: p.x, y: p.y, z: p.z }));
  }

  update(audioData: AudioData, scaleMode: ScaleType | null, time: number, speed: number): void {
    this.frameCount++;
    if (this.frameCount % 2 !== 0) return;

    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    const ampRange = 0.05 + audioData.volume * (HEIGHT_MAX - 0.05);

    if (scaleMode) {
      this.scalePulseX += dt * (TOTAL_SIZE / 2) * speed;
      if (this.scalePulseX > TOTAL_SIZE / 2 + 0.5) {
        this.scalePulseX = -TOTAL_SIZE / 2 - 0.5;
      }

      const targetFreq = audioData.currentFrequency;
      const normalizedFreq = Math.min(1, Math.max(0.1, targetFreq / FREQ_REF));
      const pulseHeight = HEIGHT_LOW + normalizedFreq * (HEIGHT_MAX - HEIGHT_LOW);

      for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const x = this.positions[i * 3];
        const z = this.positions[i * 3 + 2];
        const dx = x - this.scalePulseX;
        const dist = Math.sqrt(dx * dx + z * z * 0.5);
        const pulse = Math.exp(-dist * dist * 25) * pulseHeight;
        this.targetHeights[i] = this.baseHeights[i] + pulse * ampRange * 2;
      }
    } else {
      for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const x = this.positions[i * 3];
        const z = this.positions[i * 3 + 2];

        const freqIdx1 = Math.floor(((x + TOTAL_SIZE / 2) / TOTAL_SIZE) * 200);
        const freqIdx2 = Math.floor(((z + TOTAL_SIZE / 2) / TOTAL_SIZE) * 100);
        const freqIdx = Math.min(255, freqIdx1 + freqIdx2 * 2);

        const freqVal = audioData.frequencies[freqIdx] || 0;

        const avgFreq = audioData.frequencies.reduce((a, b) => a + b, 0) / 256;
        const normalizedAvg = Math.min(1, avgFreq);
        const baseHeight = HEIGHT_LOW + normalizedAvg * (HEIGHT_MAX - HEIGHT_LOW);

        this.targetHeights[i] = this.baseHeights[i] + baseHeight * 0.3 + freqVal * ampRange;
      }
    }

    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const currentY = this.positions[i * 3 + 1];
      const targetY = this.targetHeights[i];
      const newY = currentY + (targetY - currentY) * 0.25;
      this.positions[i * 3 + 1] = newY;

      const heightNorm = Math.min(1, Math.max(0, (newY - HEIGHT_LOW * 0.5) / HEIGHT_MAX));
      this.tmpColor.copy(this.colorLow).lerp(this.colorHigh, heightNorm);

      this.colors[i * 3] = this.tmpColor.r;
      this.colors[i * 3 + 1] = this.tmpColor.g;
      this.colors[i * 3 + 2] = this.tmpColor.b;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.computeVertexNormals();

    const edgePositions = this.wireframe.geometry.attributes.position.array as Float32Array;
    const srcPositions = this.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < edgePositions.length; i += 3) {
      edgePositions[i + 1] = srcPositions[i + 1];
    }
    this.wireframe.geometry.attributes.position.needsUpdate = true;
  }
}
