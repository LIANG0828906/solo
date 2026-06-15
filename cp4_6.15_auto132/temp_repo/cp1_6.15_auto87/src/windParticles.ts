import * as THREE from 'three';

interface ParticleLine {
  points: THREE.Points;
  baseY: number;
  startX: number;
  speed: number;
  phase: number;
  lineLength: number;
  particleCount: number;
  positions: Float32Array;
  basePositions: Float32Array;
}

export class WindParticles {
  private scene: THREE.Scene;
  public group: THREE.Group;
  private particleLines: ParticleLine[] = [];
  private lineCount: number;
  private sceneBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  private updateEveryNFrames: number = 1;
  private frameCounter: number = 0;
  private time: number = 0;

  constructor(
    scene: THREE.Scene,
    lineCount: number = 20,
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number } = {
      minX: -150,
      maxX: 150,
      minZ: -120,
      maxZ: 120
    }
  ) {
    this.scene = scene;
    this.lineCount = lineCount;
    this.sceneBounds = bounds;

    this.group = new THREE.Group();
    this.group.name = 'windParticlesGroup';
    this.scene.add(this.group);

    this.createLines();
  }

  private createLines(): void {
    const particlesPerLine = 10;

    for (let i = 0; i < this.lineCount; i++) {
      this.createSingleLine(particlesPerLine, i);
    }
  }

  private createSingleLine(particlesPerLine: number, index: number): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesPerLine * 3);
    const basePositions = new Float32Array(particlesPerLine * 3);
    const alphas = new Float32Array(particlesPerLine);

    const zSpread = this.sceneBounds.maxZ - this.sceneBounds.minZ;
    const baseZ = this.sceneBounds.minZ + (index / (this.lineCount - 1 || 1)) * zSpread + (Math.random() - 0.5) * 8;
    const baseY = 5 + Math.random() * 40;
    const startX = this.sceneBounds.minX - Math.random() * 100;
    const speed = 15 + Math.random() * 20;
    const lineLength = 20;
    const phase = Math.random() * Math.PI * 2;

    for (let j = 0; j < particlesPerLine; j++) {
      const t = j / (particlesPerLine - 1);
      basePositions[j * 3] = startX - t * lineLength;
      basePositions[j * 3 + 1] = baseY;
      basePositions[j * 3 + 2] = baseZ;

      positions[j * 3] = basePositions[j * 3];
      positions[j * 3 + 1] = baseY;
      positions[j * 3 + 2] = baseZ;

      alphas[j] = 1 - Math.pow(t, 1.5);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(220, 235, 255, 0.8)');
    gradient.addColorStop(0.7, 'rgba(180, 210, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(150, 190, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.PointsMaterial({
      size: 3,
      map: texture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: false,
      sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;

    this.group.add(points);

    this.particleLines.push({
      points,
      baseY,
      startX,
      speed,
      phase,
      lineLength,
      particleCount: particlesPerLine,
      positions,
      basePositions
    });
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;
    this.frameCounter++;

    if (this.frameCounter < this.updateEveryNFrames) {
      return;
    }
    this.frameCounter = 0;

    const waveAmplitude = 2;
    const waveFrequency = 0.3;
    const totalXRange = this.sceneBounds.maxX - this.sceneBounds.minX + 150;

    for (const line of this.particleLines) {
      const posAttr = line.points.geometry.attributes.position as THREE.BufferAttribute;

      for (let j = 0; j < line.particleCount; j++) {
        const t = j / (line.particleCount - 1);
        const particleOffset = t * line.lineLength;

        let currentX =
          line.startX + this.time * line.speed - particleOffset;

        currentX = this.sceneBounds.minX - 50 +
          (((currentX - (this.sceneBounds.minX - 50)) % totalXRange) + totalXRange) % totalXRange;

        const waveY = Math.sin(this.time * Math.PI * 2 * waveFrequency + line.phase + t * 3) * waveAmplitude;
        const currentY = line.baseY + waveY;

        line.positions[j * 3] = currentX;
        line.positions[j * 3 + 1] = currentY;
        line.positions[j * 3 + 2] = line.basePositions[j * 3 + 2];
      }

      posAttr.needsUpdate = true;
    }
  }

  public setUpdateFrequency(frames: number): void {
    this.updateEveryNFrames = Math.max(1, frames);
  }

  public setParticleCount(count: number): void {
    const targetCount = Math.min(count, 200);
    const linesNeeded = Math.ceil(targetCount / 10);

    while (this.particleLines.length > linesNeeded) {
      const line = this.particleLines.pop()!;
      this.group.remove(line.points);
      line.points.geometry.dispose();
      (line.points.material as THREE.Material).dispose();
    }

    while (this.particleLines.length < linesNeeded) {
      const idx = this.particleLines.length;
      this.createSingleLine(10, idx);
    }

    this.lineCount = this.particleLines.length;
  }

  public setVisible(visible: boolean): void {
    this.group.visible = visible;
  }

  public getTotalParticles(): number {
    return this.particleLines.reduce((sum, line) => sum + line.particleCount, 0);
  }
}
