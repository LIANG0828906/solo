import * as THREE from 'three';

export type VisualMode = 'particles' | 'waveform' | 'both';

export interface VisualParams {
  sensitivity: number;
  rotationSpeed: number;
  spread: number;
  mode: VisualMode;
  isMobile: boolean;
}

export class Visualization {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private particles: THREE.Points | null = null;
  private particleGeometry: THREE.BufferGeometry | null = null;
  private particlePositions: Float32Array | null = null;
  private particleColors: Float32Array | null = null;
  private particleSizes: Float32Array | null = null;
  private baseParticlePositions: Float32Array | null = null;
  private particleRandomOffsets: Float32Array | null = null;
  private waveform: THREE.Mesh | null = null;
  private waveformGeometry: THREE.PlaneGeometry | null = null;
  private waveformBasePositions: Float32Array | null = null;
  private waveformGridLines: THREE.LineSegments | null = null;
  private rotationAngle: number = 0;
  private particleCount: number = 5000;
  private particleTime: number = 0;

  private static readonly LOW_COLOR = new THREE.Color(0xff3366);
  private static readonly MID_COLOR = new THREE.Color(0x33ff66);
  private static readonly HIGH_COLOR = new THREE.Color(0x3366ff);

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
  }

  init(isMobile: boolean): void {
    this.particleCount = isMobile ? 2000 : 5000;
    this.createParticles();
    this.createWaveform();
    this.setupLighting();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(5, 10, 7);
    this.scene.add(directionalLight);
  }

  private createParticles(): void {
    this.particleGeometry = new THREE.BufferGeometry();
    const count = this.particleCount;

    this.particlePositions = new Float32Array(count * 3);
    this.particleColors = new Float32Array(count * 3);
    this.particleSizes = new Float32Array(count);
    this.baseParticlePositions = new Float32Array(count * 3);
    this.particleRandomOffsets = new Float32Array(count * 3);

    const baseRadius = 4;
    const height = 6;
    const spiralTurns = 6;

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const theta = t * spiralTurns * Math.PI * 2;
      const y = (t - 0.5) * height;
      const r = baseRadius * (0.3 + t * 0.7);

      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);

      const i3 = i * 3;
      this.baseParticlePositions[i3] = x;
      this.baseParticlePositions[i3 + 1] = y;
      this.baseParticlePositions[i3 + 2] = z;

      this.particleRandomOffsets[i3] = (Math.random() - 0.5) * 0.6;
      this.particleRandomOffsets[i3 + 1] = (Math.random() - 0.5) * 0.6;
      this.particleRandomOffsets[i3 + 2] = (Math.random() - 0.5) * 0.6;

      this.particlePositions[i3] = x + this.particleRandomOffsets[i3];
      this.particlePositions[i3 + 1] = y + this.particleRandomOffsets[i3 + 1];
      this.particlePositions[i3 + 2] = z + this.particleRandomOffsets[i3 + 2];

      const colorRatio = t;
      let color: THREE.Color;
      if (colorRatio < 0.33) {
        const blendVal = colorRatio / 0.33;
        color = Visualization.LOW_COLOR.clone().lerp(Visualization.MID_COLOR, blendVal);
      } else if (colorRatio < 0.66) {
        const blendVal = (colorRatio - 0.33) / 0.33;
        color = Visualization.MID_COLOR.clone().lerp(Visualization.HIGH_COLOR, blendVal);
      } else {
        color = Visualization.HIGH_COLOR.clone();
      }

      this.particleColors[i3] = color.r;
      this.particleColors[i3 + 1] = color.g;
      this.particleColors[i3 + 2] = color.b;

      this.particleSizes[i] = 0.05;
    }

    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));
    this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(this.particleSizes, 1));
    this.particleGeometry.computeBoundingSphere();
    this.particleGeometry.computeVertexNormals();

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(this.particleGeometry, particleMaterial);
    this.scene.add(this.particles);
  }

  private createWaveform(): void {
    const gridSize = 20;
    const cellSize = 0.3;
    const totalSize = gridSize * cellSize;

    this.waveformGeometry = new THREE.PlaneGeometry(totalSize, totalSize, gridSize - 1, gridSize - 1);
    this.waveformGeometry.rotateX(-Math.PI / 2);

    const positions = this.waveformGeometry.attributes.position.array as Float32Array;
    this.waveformBasePositions = new Float32Array(positions.length);
    this.waveformBasePositions.set(positions);

    const colors = new Float32Array(positions.length);
    const halfSize = totalSize / 2;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      const dist = Math.sqrt(x * x + z * z) / halfSize;
      const t = Math.min(dist, 1.0);

      const centerColor = new THREE.Color(0xffffff);
      const edgeColor = new THREE.Color(0x00aaff);
      const color = centerColor.clone().lerp(edgeColor, t);

      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }

    this.waveformGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const posAttr = this.waveformGeometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      if (isNaN(y)) {
        posAttr.setY(i, 0);
      }
    }
    posAttr.needsUpdate = true;
    this.waveformGeometry.computeBoundingSphere();
    this.waveformGeometry.computeVertexNormals();

    const waveformMaterial = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      wireframe: false
    });

    this.waveform = new THREE.Mesh(this.waveformGeometry, waveformMaterial);
    this.waveform.position.y = -4;
    this.scene.add(this.waveform);

    this.createWaveformGridLines();
  }

  private createWaveformGridLines(): void {
    if (!this.waveformGeometry) return;

    const gridSize = 20;
    const cellSize = 0.3;
    const totalSize = gridSize * cellSize;
    const halfSize = totalSize / 2;
    const positions: number[] = [];

    for (let i = 0; i <= gridSize; i++) {
      const pos = -halfSize + i * cellSize;

      positions.push(pos, 0, -halfSize, pos, 0, halfSize);

      positions.push(-halfSize, 0, pos, halfSize, 0, pos);
    }

    const gridGeometry = new THREE.BufferGeometry();
    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x66ffcc,
      transparent: true,
      opacity: 0.2
    });

    this.waveformGridLines = new THREE.LineSegments(gridGeometry, gridMaterial);
    this.waveformGridLines.position.y = -4;
    this.scene.add(this.waveformGridLines);
  }

  update(freqData: Uint8Array, params: VisualParams, deltaTime: number): void {
    this.particleTime += deltaTime;
    this.rotationAngle += params.rotationSpeed * deltaTime * 0.5;

    if (params.mode === 'particles' || params.mode === 'both') {
      this.updateParticles(freqData, params, deltaTime);
    }

    if (params.mode === 'waveform' || params.mode === 'both') {
      this.updateWaveform(freqData, params);
    }

    this.camera.position.x = 12 * Math.cos(this.rotationAngle);
    this.camera.position.z = 12 * Math.sin(this.rotationAngle);
    this.camera.lookAt(0, 0, 0);
  }

  private updateParticles(freqData: Uint8Array, params: VisualParams, _deltaTime: number): void {
    if (!this.particleGeometry || !this.baseParticlePositions || !this.particlePositions || !this.particleSizes || !this.particleRandomOffsets || freqData.length === 0) return;

    const positions = this.particleGeometry.attributes.position.array as Float32Array;
    const sizes = this.particleGeometry.attributes.size.array as Float32Array;
    const colors = this.particleGeometry.attributes.color.array as Float32Array;
    const count = this.particleCount;

    const totalEnergy = freqData.reduce((a, b) => a + b, 0) / freqData.length;
    const rhythmMultiplier = 1 + (totalEnergy / 255) * 2;

    const spiralTurns = 6;
    const height = 6;
    const baseRadius = 4;
    const spreadAmount = params.spread * 1.5;

    const breathIntensity = totalEnergy / 255;

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const freqIndex = Math.floor(t * freqData.length);
      const safeFreqIndex = Math.max(0, Math.min(freqIndex, freqData.length - 1));
      const amplitude = (freqData[safeFreqIndex] / 255) * params.sensitivity;

      const dynamicTheta = t * spiralTurns * Math.PI * 2 + this.particleTime * 0.3 * rhythmMultiplier;
      const y = (t - 0.5) * height;
      const r = baseRadius * (0.3 + t * 0.7) + amplitude * 0.5;

      const offsetX = Math.sin(this.particleTime * 2 + i * 0.1) * spreadAmount * amplitude * 0.3;
      const offsetZ = Math.cos(this.particleTime * 1.5 + i * 0.15) * spreadAmount * amplitude * 0.3;

      const i3 = i * 3;

      const breathTremorX = this.particleRandomOffsets[i3] * (1 + breathIntensity * 0.4 * Math.sin(this.particleTime * 2.5 + i * 0.07));
      const breathTremorY = this.particleRandomOffsets[i3 + 1] * (1 + breathIntensity * 0.4 * Math.sin(this.particleTime * 1.8 + i * 0.09));
      const breathTremorZ = this.particleRandomOffsets[i3 + 2] * (1 + breathIntensity * 0.4 * Math.sin(this.particleTime * 2.2 + i * 0.11));

      const spiralX = r * Math.cos(dynamicTheta) + offsetX;
      const spiralY = y + amplitude * 0.5 * Math.sin(this.particleTime * 3 + i * 0.2);
      const spiralZ = r * Math.sin(dynamicTheta) + offsetZ;

      const x = spiralX + breathTremorX;
      const finalY = spiralY + breathTremorY;
      const z = spiralZ + breathTremorZ;

      positions[i3] = isNaN(x) ? this.baseParticlePositions[i3] : x;
      positions[i3 + 1] = isNaN(finalY) ? this.baseParticlePositions[i3 + 1] : finalY;
      positions[i3 + 2] = isNaN(z) ? this.baseParticlePositions[i3 + 2] : z;

      const lowIdx = Math.max(0, Math.min(Math.floor(freqIndex * 0.3), freqData.length - 1));
      const midIdx = Math.max(0, Math.min(Math.floor(freqIndex * 0.6), freqData.length - 1));
      const highIdx = Math.max(0, Math.min(freqIndex, freqData.length - 1));

      const lowFreq = freqData[lowIdx] / 255;
      const midFreq = freqData[midIdx] / 255;
      const highFreq = freqData[highIdx] / 255;

      const flicker = 1 + 0.3 * Math.sin(this.particleTime * 8 + i * 1.7) * amplitude;
      const baseSize = 0.05 + amplitude * 0.25;
      const size = baseSize * flicker;
      sizes[i] = isNaN(size) ? 0.05 : Math.min(size, 0.3);

      const rCol = Visualization.LOW_COLOR.r * lowFreq * amplitude + 0.2;
      const gCol = Visualization.MID_COLOR.g * midFreq * amplitude + 0.2;
      const bCol = Visualization.HIGH_COLOR.b * highFreq * amplitude + 0.2;

      colors[i3] = Math.min(Math.max(rCol, 0.2), 1.0);
      colors[i3 + 1] = Math.min(Math.max(gCol, 0.2), 1.0);
      colors[i3 + 2] = Math.min(Math.max(bCol, 0.2), 1.0);
    }

    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleGeometry.attributes.size.needsUpdate = true;
    this.particleGeometry.attributes.color.needsUpdate = true;
  }

  private updateWaveform(freqData: Uint8Array, params: VisualParams): void {
    if (!this.waveformGeometry || !this.waveformBasePositions || freqData.length === 0) return;

    const positions = this.waveformGeometry.attributes.position.array as Float32Array;
    const vertexCount = positions.length / 3;
    const gridSize = 20;

    for (let i = 0; i < vertexCount; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;

      const freqRow = Math.floor((row / (gridSize - 1)) * (freqData.length * 0.5));
      const freqCol = Math.floor((col / (gridSize - 1)) * (freqData.length * 0.5));
      const freqIndex = Math.floor((freqRow + freqCol) * 0.5);

      const safeIndex = Math.max(0, Math.min(freqIndex, freqData.length - 1));
      const value = freqData[safeIndex] / 255;
      const height = (value * 2 - 1) * params.sensitivity;

      const safeHeight = isNaN(height) ? 0 : height;

      const i3 = i * 3;
      positions[i3 + 1] = this.waveformBasePositions[i3 + 1] + safeHeight;
    }

    this.waveformGeometry.attributes.position.needsUpdate = true;
    this.waveformGeometry.computeVertexNormals();

    this.updateGridLineHeights(freqData, params);
  }

  private updateGridLineHeights(freqData: Uint8Array, params: VisualParams): void {
    if (!this.waveformGridLines) return;

    const gridPositions = this.waveformGridLines.geometry.attributes.position.array as Float32Array;
    const gridSize = 20;
    const cellSize = 0.3;
    const totalSize = gridSize * cellSize;
    const halfSize = totalSize / 2;
    let idx = 0;

    for (let i = 0; i <= gridSize; i++) {
      const pos = -halfSize + i * cellSize;

      const rowI = Math.min(i, gridSize - 1);
      const freqRow = Math.floor((rowI / (gridSize - 1)) * (freqData.length * 0.5));

      for (let j = 0; j <= 1; j++) {
        const sampleCol = j * (gridSize - 1);
        const freqCol = Math.floor((sampleCol / (gridSize - 1)) * (freqData.length * 0.5));
        const freqIndex = Math.floor((freqRow + freqCol) * 0.5);
        const safeIndex = Math.max(0, Math.min(freqIndex, freqData.length - 1));
        const value = freqData[safeIndex] / 255;
        const h = (value * 2 - 1) * params.sensitivity;

        gridPositions[idx] = pos;
        gridPositions[idx + 1] = isNaN(h) ? 0 : h;
        gridPositions[idx + 2] = j === 0 ? -halfSize : halfSize;
        idx += 3;
      }

      const colI = Math.min(i, gridSize - 1);
      const freqColIdx = Math.floor((colI / (gridSize - 1)) * (freqData.length * 0.5));

      for (let j = 0; j <= 1; j++) {
        const sampleRow = j * (gridSize - 1);
        const freqRowIdx = Math.floor((sampleRow / (gridSize - 1)) * (freqData.length * 0.5));
        const freqIndex = Math.floor((freqRowIdx + freqColIdx) * 0.5);
        const safeIndex = Math.max(0, Math.min(freqIndex, freqData.length - 1));
        const value = freqData[safeIndex] / 255;
        const h = (value * 2 - 1) * params.sensitivity;

        gridPositions[idx] = j === 0 ? -halfSize : halfSize;
        gridPositions[idx + 1] = isNaN(h) ? 0 : h;
        gridPositions[idx + 2] = pos;
        idx += 3;
      }
    }

    this.waveformGridLines.geometry.attributes.position.needsUpdate = true;
  }

  resize(width: number, height: number): void {
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  updateParticleCount(isMobile: boolean): void {
    const newCount = isMobile ? 2000 : 5000;
    if (newCount !== this.particleCount) {
      if (this.particles) {
        this.scene.remove(this.particles);
        this.particleGeometry?.dispose();
      }
      this.particleCount = newCount;
      this.createParticles();
    }
  }
}
