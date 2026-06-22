import * as THREE from 'three';
import { AudioParams, calculateWaveHeight } from '../control/AudioController';
import { heightToTerrainColor } from '../utils/ColorUtils';

export class Terrain {
  public mesh: THREE.Mesh;
  public wireframe: THREE.Mesh;
  public depositMesh!: THREE.Mesh;
  
  private geometry: THREE.PlaneGeometry;
  private baseHeights: Float32Array;
  private segments: number = 96;
  private size: number = 600;
  private time: number = 0;
  private params: AudioParams;
  private heightRequestCallbacks: Set<(x: number, z: number, height: number) => void>;
  
  private depositCounts: Uint32Array;
  private depositResolution: number = 48;

  constructor() {
    this.params = { frequency: 60, amplitude: 3, phase: 0 };
    this.heightRequestCallbacks = new Set();
    
    this.geometry = new THREE.PlaneGeometry(
      this.size,
      this.size,
      this.segments,
      this.segments
    );
    this.geometry.rotateX(-Math.PI / 2);
    
    const vertexCount = this.geometry.attributes.position.count;
    this.baseHeights = new Float32Array(vertexCount);
    this.generateBaseTerrain();
    
    const colors = new Float32Array(vertexCount * 3);
    this.applyVertexColors(colors, -30, 30);
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: false,
      metalness: 0.08,
      roughness: 0.85,
      side: THREE.DoubleSide
    });
    
    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.receiveShadow = true;
    
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00D2FF,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
      depthWrite: false
    });
    this.wireframe = new THREE.Mesh(this.geometry, wireMat);
    this.mesh.add(this.wireframe);
    
    this.depositCounts = new Uint32Array(this.depositResolution * this.depositResolution);
    this.setupDepositMesh();
  }

  private generateBaseTerrain(): void {
    const positions = this.geometry.attributes.position;
    const vertexCount = positions.count;
    const posArray = positions.array as Float32Array;
    
    for (let i = 0; i < vertexCount; i++) {
      const ix = i * 3;
      const x = posArray[ix];
      const z = posArray[ix + 2];
      
      const height = this.perlinNoise(x * 0.005, z * 0.005) * 30 +
                     this.perlinNoise(x * 0.02, z * 0.02) * 10 +
                     this.perlinNoise(x * 0.08, z * 0.08) * 3 +
                     (Math.random() - 0.5) * 2;
      
      this.baseHeights[i] = height;
      posArray[ix + 1] = height;
    }
    
    positions.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  private perlinNoise(x: number, y: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
    const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
    
    const aa = (xi * 374761393 + yi * 668265263) & 255;
    const ab = (xi * 374761393 + (yi + 1) * 668265263) & 255;
    const ba = ((xi + 1) * 374761393 + yi * 668265263) & 255;
    const bb = ((xi + 1) * 374761393 + (yi + 1) * 668265263) & 255;
    
    const h = aa & 3;
    const u1 = h < 2 ? xf : yf;
    const v1 = h < 2 ? yf : xf;
    const gaa = ((h & 1) === 0 ? u1 : -u1) + ((h & 2) === 0 ? v1 : -v1);
    
    const h2 = ba & 3;
    const u2 = h2 < 2 ? xf - 1 : yf;
    const v2 = h2 < 2 ? yf : xf - 1;
    const gba = ((h2 & 1) === 0 ? u2 : -u2) + ((h2 & 2) === 0 ? v2 : -v2);
    
    const h3 = ab & 3;
    const u3 = h3 < 2 ? xf : yf - 1;
    const v3 = h3 < 2 ? yf - 1 : xf;
    const gab = ((h3 & 1) === 0 ? u3 : -u3) + ((h3 & 2) === 0 ? v3 : -v3);
    
    const h4 = bb & 3;
    const u4 = h4 < 2 ? xf - 1 : yf - 1;
    const v4 = h4 < 2 ? yf - 1 : xf - 1;
    const gbb = ((h4 & 1) === 0 ? u4 : -u4) + ((h4 & 2) === 0 ? v4 : -v4);
    
    const x1 = gaa + u * (gba - gaa);
    const x2 = gab + u * (gbb - gab);
    
    return x1 + v * (x2 - x1);
  }

  private applyVertexColors(colors: Float32Array, minH: number, maxH: number): void {
    const positions = this.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < this.geometry.attributes.position.count; i++) {
      const h = positions[i * 3 + 1];
      const color = heightToTerrainColor(h, minH, maxH);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
  }

  private setupDepositMesh(): void {
    const depositGeo = new THREE.PlaneGeometry(
      this.size,
      this.size,
      this.depositResolution - 1,
      this.depositResolution - 1
    );
    depositGeo.rotateX(-Math.PI / 2);
    
    const total = this.depositResolution * this.depositResolution;
    const depositColors = new Float32Array(total * 3);
    
    for (let i = 0; i < total; i++) {
      depositColors[i * 3] = 0.29;
      depositColors[i * 3 + 1] = 0.56;
      depositColors[i * 3 + 2] = 0.85;
    }
    
    depositGeo.setAttribute('color', new THREE.BufferAttribute(depositColors, 3));
    
    const depositMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    this.depositMesh = new THREE.Mesh(depositGeo, depositMat);
    this.depositMesh.position.y = 0.1;
  }

  public getBaseHeight(x: number, z: number): number {
    const halfSize = this.size / 2;
    if (x < -halfSize || x > halfSize || z < -halfSize || z > halfSize) {
      return 0;
    }
    
    const fx = ((x + halfSize) / this.size) * this.segments;
    const fz = ((z + halfSize) / this.size) * this.segments;
    
    const ix = Math.floor(fx);
    const iz = Math.floor(fz);
    const tx = fx - ix;
    const tz = fz - iz;
    
    const stride = this.segments + 1;
    const i00 = Math.min(iz, this.segments) * stride + Math.min(ix, this.segments);
    const i10 = i00 + 1;
    const i01 = i00 + stride;
    const i11 = i01 + 1;
    
    const maxIdx = this.baseHeights.length - 1;
    const h00 = this.baseHeights[Math.min(i00, maxIdx)] || 0;
    const h10 = this.baseHeights[Math.min(i10, maxIdx)] || 0;
    const h01 = this.baseHeights[Math.min(i01, maxIdx)] || 0;
    const h11 = this.baseHeights[Math.min(i11, maxIdx)] || 0;
    
    const h0 = h00 + (h10 - h00) * tx;
    const h1 = h01 + (h11 - h01) * tx;
    
    return h0 + (h1 - h0) * tz;
  }

  public getCurrentHeight(x: number, z: number): number {
    return this.getBaseHeight(x, z) + calculateWaveHeight(x, z, this.time, this.params);
  }

  public findHighestPoint(): { x: number; z: number; height: number } {
    let maxH = -Infinity;
    let maxX = 0;
    let maxZ = 0;
    const positions = this.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < this.baseHeights.length; i++) {
      const h = this.baseHeights[i];
      if (h > maxH) {
        maxH = h;
        const ix = i * 3;
        maxX = positions[ix];
        maxZ = positions[ix + 2];
      }
    }
    
    return { x: maxX, z: maxZ, height: maxH };
  }

  public updateParams(params: AudioParams): void {
    this.params = { ...params };
  }

  public addDeposit(x: number, z: number): void {
    const halfSize = this.size / 2;
    if (x < -halfSize || x > halfSize || z < -halfSize || z > halfSize) return;
    
    const gx = (x + halfSize) / this.size;
    const gz = (z + halfSize) / this.size;
    const idx = ((gz * this.depositResolution) | 0) * this.depositResolution + ((gx * this.depositResolution) | 0);
    const clampedIdx = Math.min(Math.max(idx, 0), this.depositResolution * this.depositResolution - 1);
    this.depositCounts[clampedIdx]++;
  }

  public registerHeightRequestCallback(cb: (x: number, z: number, height: number) => void): () => void {
    this.heightRequestCallbacks.add(cb);
    return () => this.heightRequestCallbacks.delete(cb);
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;
    
    const posArray = this.geometry.attributes.position.array as Float32Array;
    const colorArray = (this.geometry.attributes.color as THREE.BufferAttribute).array as Float32Array;
    const vertexCount = this.baseHeights.length;
    const { frequency, amplitude, phase } = this.params;
    const omega = frequency / 100;
    const freqTime = this.time * frequency * 0.05 + phase;
    const omega07 = omega * 0.7;
    const phase05 = phase * 0.5;
    const amp03 = amplitude * 0.3;
    
    let minH = Infinity;
    let maxH = -Infinity;
    
    for (let i = 0; i < vertexCount; i++) {
      const ix = i * 3;
      const x = posArray[ix];
      const z = posArray[ix + 2];
      const baseH = this.baseHeights[i];
      
      const distance = Math.sqrt(x * x + z * z);
      const wave = Math.sin(distance * omega + freqTime) * amplitude;
      const waveX = Math.sin(x * omega07 + phase05) * amp03;
      const waveZ = Math.cos(z * omega07 + phase05) * amp03;
      const totalH = baseH + wave + waveX + waveZ;
      
      posArray[ix + 1] = totalH;
      
      if (totalH < minH) minH = totalH;
      if (totalH > maxH) maxH = totalH;
    }
    
    const range = maxH - minH || 1;
    for (let i = 0; i < vertexCount; i++) {
      const h = posArray[i * 3 + 1];
      const t = (h - minH) / range;
      const tClamped = t > 1 ? 1 : t < 0 ? 0 : t;
      const r = 0.545 + 0.145 * tClamped;
      const g = 0.616 + 0.106 * tClamped;
      const b = 0.686 + 0.07 * tClamped;
      const ic = i * 3;
      colorArray[ic] = r;
      colorArray[ic + 1] = g;
      colorArray[ic + 2] = b;
    }
    
    this.geometry.attributes.position.needsUpdate = true;
    (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    this.geometry.computeVertexNormals();
    
    this.updateDepositMesh();
    
    if (this.heightRequestCallbacks.size > 0) {
      const cbArr = Array.from(this.heightRequestCallbacks);
      for (let cb of cbArr) {
        for (let i = 0; i < vertexCount; i += 20) {
          const ix = i * 3;
          cb(posArray[ix], posArray[ix + 2], posArray[ix + 1]);
        }
      }
    }
  }

  private updateDepositMesh(): void {
    const attrColor = this.depositMesh.geometry.attributes.color as THREE.BufferAttribute;
    const colorArr = attrColor.array as Float32Array;
    const attrPos = this.depositMesh.geometry.attributes.position;
    const posArr = attrPos.array as Float32Array;
    const total = this.depositResolution * this.depositResolution;
    
    let maxCount = 1;
    for (let i = 0; i < total; i++) {
      const c = this.depositCounts[i];
      if (c > maxCount) maxCount = c;
    }
    
    const invMax = 1 / maxCount;
    for (let i = 0; i < total; i++) {
      const count = this.depositCounts[i];
      const t = Math.min(count * invMax, 1);
      
      const ic = i * 3;
      colorArr[ic] = 0.29 + 0.04 * t;
      colorArr[ic + 1] = 0.565 + 0.105 * t;
      colorArr[ic + 2] = 0.851 - 0.101 * t;
      
      const y = this.getBaseHeight(posArr[ic], posArr[ic + 2]) + 0.5 + t * 2;
      posArr[ic + 1] = y;
      
      this.depositCounts[i] = count > 0.1 ? count - 0.1 : 0;
    }
    
    attrColor.needsUpdate = true;
    attrPos.needsUpdate = true;
  }

  public dispose(): void {
    this.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    (this.wireframe.material as THREE.Material).dispose();
    this.depositMesh.geometry.dispose();
    (this.depositMesh.material as THREE.Material).dispose();
  }
}
