import * as THREE from 'three';

export interface ParticleData {
  index: number;
  position: { x: number; y: number; z: number };
  baseColor: { r: number; g: number; b: number };
  currentColor: { r: number; g: number; b: number };
  nextColor: { r: number; g: number; b: number };
  size: number;
  waveAmplitude: number;
  wavePeriod: number;
  waveOffset: number;
  colorPeriod: number;
  colorOffset: number;
  alphaPeriod: number;
  alphaOffset: number;
}

export interface NeighborhoodStats {
  avgColor: { r: number; g: number; b: number };
  avgColorHex: string;
  density: number;
  neighborCount: number;
}

const COLOR_PALETTE: Array<{ r: number; g: number; b: number }> = [
  { r: 0.388, g: 0.400, b: 0.945 },
  { r: 0.925, g: 0.282, b: 0.600 },
  { r: 0.078, g: 0.722, b: 0.651 },
  { r: 0.961, g: 0.620, b: 0.043 },
  { r: 0.886, g: 0.910, b: 0.941 },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function rgbToHex(r: number, g: number, b: number): string {
  const ri = Math.max(0, Math.min(255, Math.round(r * 255)));
  const gi = Math.max(0, Math.min(255, Math.round(g * 255)));
  const bi = Math.max(0, Math.min(255, Math.round(b * 255)));
  return '#' + ((1 << 24) | (ri << 16) | (gi << 8) | bi).toString(16).slice(1).toUpperCase();
}

export class Nebula {
  public particleCount: number;
  public points: THREE.Points;
  public geometry: THREE.BufferGeometry;
  public material: THREE.ShaderMaterial;

  private basePositions: Float32Array;
  private currentPositions: Float32Array;
  private baseColors: Float32Array;
  private currentColors: Float32Array;
  private sizes: Float32Array;
  private baseSizes: Float32Array;
  private alphas: Float32Array;

  private colorIndexMap: Int32Array;
  private nextColorIndexMap: Int32Array;

  private waveAmplitudes: Float32Array;
  private wavePeriods: Float32Array;
  private waveOffsets: Float32Array;
  private waveDirections: Float32Array;

  private colorPeriods: Float32Array;
  private colorOffsets: Float32Array;

  private alphaPeriods: Float32Array;
  private alphaOffsets: Float32Array;

  private posAttr: THREE.BufferAttribute;
  private colorAttr: THREE.BufferAttribute;
  private sizeAttr: THREE.BufferAttribute;
  private alphaAttr: THREE.BufferAttribute;

  private readonly SPHERE_INNER = 50;
  private readonly SPHERE_OUTER = 100;
  private readonly ROTATION_PERIOD = 30;

  private rotationAngle = 0;
  private _elapsedTime = 0;

  constructor(count: number) {
    this.particleCount = count;
    this.geometry = new THREE.BufferGeometry();

    this.basePositions = new Float32Array(count * 3);
    this.currentPositions = new Float32Array(count * 3);
    this.baseColors = new Float32Array(count * 3);
    this.currentColors = new Float32Array(count * 3);
    this.sizes = new Float32Array(count);
    this.baseSizes = new Float32Array(count);
    this.alphas = new Float32Array(count);

    this.colorIndexMap = new Int32Array(count);
    this.nextColorIndexMap = new Int32Array(count);

    this.waveAmplitudes = new Float32Array(count);
    this.wavePeriods = new Float32Array(count);
    this.waveOffsets = new Float32Array(count);
    this.waveDirections = new Float32Array(count * 3);

    this.colorPeriods = new Float32Array(count);
    this.colorOffsets = new Float32Array(count);

    this.alphaPeriods = new Float32Array(count);
    this.alphaOffsets = new Float32Array(count);

    this.generatePoissonDisc();
    this.generateParticleProperties();

    this.posAttr = new THREE.BufferAttribute(this.currentPositions, 3);
    this.colorAttr = new THREE.BufferAttribute(this.currentColors, 3);
    this.sizeAttr = new THREE.BufferAttribute(this.sizes, 1);
    this.alphaAttr = new THREE.BufferAttribute(this.alphas, 1);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: this.createCircleTexture() },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float customSize;
        attribute float customAlpha;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          vAlpha = customAlpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = customSize * uPixelRatio * (600.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 texColor = texture2D(pointTexture, gl_PointCoord);
          if (texColor.a < 0.05) discard;
          vec3 finalColor = vColor + vColor * 0.3 * texColor.a;
          gl_FragColor = vec4(finalColor, vAlpha * texColor.a);
        }
      `,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.geometry.setAttribute('position', this.posAttr);
    this.geometry.setAttribute('color', this.colorAttr);
    this.geometry.setAttribute('customSize', this.sizeAttr);
    this.geometry.setAttribute('customAlpha', this.alphaAttr);

    this.points = new THREE.Points(this.geometry, this.material);
    this.update(0, 0, 1, 1);
  }

  private createCircleTexture(): THREE.Texture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.4)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private generatePoissonDisc(): void {
    const inner = this.SPHERE_INNER;
    const outer = this.SPHERE_OUTER;
    const volume = (4 / 3) * Math.PI * (Math.pow(outer, 3) - Math.pow(inner, 3));
    const targetDensity = this.particleCount / volume;
    const minDist = Math.pow(3 / (4 * Math.PI * targetDensity), 1 / 3) * 0.55;

    const grid: Map<number, number[]> = new Map();
    const cellSize = minDist / Math.sqrt(3);

    const pos = this.basePositions;
    let placed = 0;
    const maxAttempts = 50;
    const maxLoops = this.particleCount * 30;
    let loops = 0;

    while (placed < this.particleCount && loops < maxLoops) {
      loops++;
      let attempts = 0;
      let valid = false;
      let x = 0, y = 0, z = 0;

      while (attempts < maxAttempts && !valid) {
        attempts++;
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = inner + (outer - inner) * Math.pow(Math.random(), 1 / 3);

        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);

        const cx = Math.floor(x / cellSize);
        const cy = Math.floor(y / cellSize);
        const cz = Math.floor(z / cellSize);

        let collision = false;
        for (let dx = -1; dx <= 1 && !collision; dx++) {
          for (let dy = -1; dy <= 1 && !collision; dy++) {
            for (let dz = -1; dz <= 1 && !collision; dz++) {
              const key = ((cx + dx) * 73856093) ^ ((cy + dy) * 19349663) ^ ((cz + dz) * 83492791);
              const cell = grid.get(key);
              if (cell) {
                for (const idx of cell) {
                  const px = pos[idx * 3];
                  const py = pos[idx * 3 + 1];
                  const pz = pos[idx * 3 + 2];
                  const d2 = (x - px) ** 2 + (y - py) ** 2 + (z - pz) ** 2;
                  if (d2 < minDist * minDist) {
                    collision = true;
                    break;
                  }
                }
              }
            }
          }
        }

        if (!collision) {
          valid = true;
        }
      }

      if (valid) {
        const idx = placed;
        pos[idx * 3] = x;
        pos[idx * 3 + 1] = y;
        pos[idx * 3 + 2] = z;

        const cx = Math.floor(x / cellSize);
        const cy = Math.floor(y / cellSize);
        const cz = Math.floor(z / cellSize);
        const key = (cx * 73856093) ^ (cy * 19349663) ^ (cz * 83492791);
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key)!.push(idx);
        placed++;
      }
    }

    while (placed < this.particleCount) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = inner + (outer - inner) * Math.pow(Math.random(), 1 / 3);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      pos[placed * 3] = x;
      pos[placed * 3 + 1] = y;
      pos[placed * 3 + 2] = z;
      placed++;
    }
  }

  private generateParticleProperties(): void {
    for (let i = 0; i < this.particleCount; i++) {
      const size = 0.1 + Math.random() * 0.4;
      this.baseSizes[i] = size;
      this.sizes[i] = size;

      const c1 = Math.floor(Math.random() * COLOR_PALETTE.length);
      let c2 = Math.floor(Math.random() * COLOR_PALETTE.length);
      while (c2 === c1 && COLOR_PALETTE.length > 1) {
        c2 = Math.floor(Math.random() * COLOR_PALETTE.length);
      }
      this.colorIndexMap[i] = c1;
      this.nextColorIndexMap[i] = c2;

      const col = COLOR_PALETTE[c1];
      this.baseColors[i * 3] = col.r;
      this.baseColors[i * 3 + 1] = col.g;
      this.baseColors[i * 3 + 2] = col.b;
      this.currentColors[i * 3] = col.r;
      this.currentColors[i * 3 + 1] = col.g;
      this.currentColors[i * 3 + 2] = col.b;

      this.waveAmplitudes[i] = 0.5;
      this.wavePeriods[i] = 2 + Math.random() * 3;
      this.waveOffsets[i] = Math.random() * Math.PI * 2;

      const dx = Math.random() - 0.5;
      const dy = Math.random() - 0.5;
      const dz = Math.random() - 0.5;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      this.waveDirections[i * 3] = dx / len;
      this.waveDirections[i * 3 + 1] = dy / len;
      this.waveDirections[i * 3 + 2] = dz / len;

      this.colorPeriods[i] = 3 + Math.random() * 5;
      this.colorOffsets[i] = Math.random() * Math.PI * 2;

      this.alphaPeriods[i] = 4 + Math.random() * 2;
      this.alphaOffsets[i] = Math.random() * Math.PI * 2;
      this.alphas[i] = 0.5;
    }
  }

  public update(deltaTime: number, elapsedTime: number, rotationSpeedMultiplier: number, sizeScale: number): void {
    this._elapsedTime = elapsedTime;

    this.rotationAngle = (elapsedTime * (2 * Math.PI / this.ROTATION_PERIOD)) * rotationSpeedMultiplier;
    const cosR = Math.cos(this.rotationAngle);
    const sinR = Math.sin(this.rotationAngle);

    const base = this.basePositions;
    const curr = this.currentPositions;
    const cols = this.currentColors;
    const baseCols = this.baseColors;
    const sz = this.sizes;
    const bs = this.baseSizes;
    const al = this.alphas;

    const ciMap = this.colorIndexMap;
    const ncMap = this.nextColorIndexMap;

    const waveAmp = this.waveAmplitudes;
    const wavePer = this.wavePeriods;
    const waveOff = this.waveOffsets;
    const waveDir = this.waveDirections;

    const colPer = this.colorPeriods;
    const colOff = this.colorOffsets;

    const alpPer = this.alphaPeriods;
    const alpOff = this.alphaOffsets;

    const n = this.particleCount;
    const palette = COLOR_PALETTE;

    for (let i = 0; i < n; i++) {
      const i3 = i * 3;
      const bx = base[i3];
      const by = base[i3 + 1];
      const bz = base[i3 + 2];

      const rx = bx * cosR - bz * sinR;
      const rz = bx * sinR + bz * cosR;
      const ry = by;

      const waveT = (elapsedTime + waveOff[i]) / wavePer[i];
      const wave = Math.sin(waveT * Math.PI * 2) * waveAmp[i];

      const wdx = waveDir[i3];
      const wdy = waveDir[i3 + 1];
      const wdz = waveDir[i3 + 2];

      curr[i3] = rx + wdx * wave;
      curr[i3 + 1] = ry + wdy * wave;
      curr[i3 + 2] = rz + wdz * wave;

      const ct = (elapsedTime + colOff[i]) / colPer[i];
      const colorProgress = (Math.sin(ct * Math.PI * 2) + 1) * 0.5;

      const c1 = palette[ciMap[i]];
      const c2 = palette[ncMap[i]];
      cols[i3] = lerp(c1.r, c2.r, colorProgress);
      cols[i3 + 1] = lerp(c1.g, c2.g, colorProgress);
      cols[i3 + 2] = lerp(c1.b, c2.b, colorProgress);

      sz[i] = bs[i] * sizeScale;

      const at = (elapsedTime + alpOff[i]) / alpPer[i];
      al[i] = 0.3 + (Math.sin(at * Math.PI * 2) + 1) * 0.5 * 0.7;

      void baseCols;
    }

    this.posAttr.needsUpdate = true;
    this.colorAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;
    this.alphaAttr.needsUpdate = true;
  }

  public getParticleInfo(index: number): ParticleData | null {
    if (index < 0 || index >= this.particleCount) return null;

    const i3 = index * 3;
    const baseCol = COLOR_PALETTE[this.colorIndexMap[index]];
    const nextCol = COLOR_PALETTE[this.nextColorIndexMap[index]];

    return {
      index,
      position: {
        x: this.currentPositions[i3],
        y: this.currentPositions[i3 + 1],
        z: this.currentPositions[i3 + 2],
      },
      baseColor: { r: baseCol.r, g: baseCol.g, b: baseCol.b },
      currentColor: {
        r: this.currentColors[i3],
        g: this.currentColors[i3 + 1],
        b: this.currentColors[i3 + 2],
      },
      nextColor: { r: nextCol.r, g: nextCol.g, b: nextCol.b },
      size: this.baseSizes[index],
      waveAmplitude: this.waveAmplitudes[index],
      wavePeriod: this.wavePeriods[index],
      waveOffset: this.waveOffsets[index],
      colorPeriod: this.colorPeriods[index],
      colorOffset: this.colorOffsets[index],
      alphaPeriod: this.alphaPeriods[index],
      alphaOffset: this.alphaOffsets[index],
    };
  }

  public getNeighborhoodStats(index: number, radius: number = 10): NeighborhoodStats {
    const i3 = index * 3;
    const px = this.currentPositions[i3];
    const py = this.currentPositions[i3 + 1];
    const pz = this.currentPositions[i3 + 2];
    const r2 = radius * radius;

    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let count = 0;

    const pos = this.currentPositions;
    const cols = this.currentColors;

    for (let i = 0; i < this.particleCount; i++) {
      const j3 = i * 3;
      const dx = pos[j3] - px;
      const dy = pos[j3 + 1] - py;
      const dz = pos[j3 + 2] - pz;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 <= r2) {
        rSum += cols[j3];
        gSum += cols[j3 + 1];
        bSum += cols[j3 + 2];
        count++;
      }
    }

    const volume = (4 / 3) * Math.PI * radius * radius * radius;
    const density = count / volume;

    if (count > 0) {
      const avgR = rSum / count;
      const avgG = gSum / count;
      const avgB = bSum / count;
      return {
        avgColor: { r: avgR, g: avgG, b: avgB },
        avgColorHex: rgbToHex(avgR, avgG, avgB),
        density,
        neighborCount: count,
      };
    }

    return {
      avgColor: { r: 0, g: 0, b: 0 },
      avgColorHex: '#000000',
      density,
      neighborCount: 0,
    };
  }

  public getElapsedTime(): number {
    return this._elapsedTime;
  }

  public getRotationAngle(): number {
    return this.rotationAngle;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.basePositions = new Float32Array(0);
    this.currentPositions = new Float32Array(0);
    this.baseColors = new Float32Array(0);
    this.currentColors = new Float32Array(0);
    this.sizes = new Float32Array(0);
    this.baseSizes = new Float32Array(0);
    this.alphas = new Float32Array(0);
  }
}
