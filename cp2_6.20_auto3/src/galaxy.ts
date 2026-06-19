import * as THREE from 'three';

export class Galaxy {
  private scene: THREE.Scene;
  private armCount: number = 4;
  private particleCount: number = 12000;

  private mesh!: THREE.Points;
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.PointsMaterial;

  private positions!: Float32Array;
  private colors!: Float32Array;
  private sizes!: Float32Array;
  private alphas!: Float32Array;

  private basePositions!: Float32Array;
  private baseColors!: Float32Array;

  private rotationSpeed: number = 0.015;
  private time: number = 0;

  private pixelRatio: number = Math.min(window.devicePixelRatio, 2);

  private color1 = new THREE.Color(0x1a0a3e);
  private color2 = new THREE.Color(0x4c1d95);
  private color3 = new THREE.Color(0x7c3aed);
  private color4 = new THREE.Color(0x2d1b69);

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.init();
  }

  private init(): void {
    this.geometry = new THREE.BufferGeometry();

    this.positions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.sizes = new Float32Array(this.particleCount);
    this.alphas = new Float32Array(this.particleCount);

    this.basePositions = new Float32Array(this.particleCount * 3);
    this.baseColors = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      const armIndex = i % this.armCount;
      const armProgress = Math.floor(i / this.armCount) / (this.particleCount / this.armCount);

      const radius = 120 + armProgress * 650;
      const armAngle = (armIndex / this.armCount) * Math.PI * 2;
      const spiralAngle = armProgress * Math.PI * 2.5;

      const spread = (1 - armProgress * 0.7) * 80;
      const randomOffsetX = (Math.random() - 0.5) * spread;
      const randomOffsetY = (Math.random() - 0.5) * spread * 0.4;
      const randomOffsetZ = (Math.random() - 0.5) * spread;

      const finalAngle = armAngle + spiralAngle;

      const x = Math.cos(finalAngle) * radius + randomOffsetX;
      const z = Math.sin(finalAngle) * radius + randomOffsetZ;
      const y = randomOffsetY;

      this.positions[i3] = x;
      this.positions[i3 + 1] = y;
      this.positions[i3 + 2] = z;

      this.basePositions[i3] = x;
      this.basePositions[i3 + 1] = y;
      this.basePositions[i3 + 2] = z;

      const distanceFactor = Math.min(1, radius / 770);

      let baseColor: THREE.Color;
      if (distanceFactor < 0.3) {
        baseColor = this.color1.clone().lerp(this.color2, distanceFactor / 0.3);
      } else if (distanceFactor < 0.6) {
        baseColor = this.color2.clone().lerp(this.color3, (distanceFactor - 0.3) / 0.3);
      } else {
        baseColor = this.color3.clone().lerp(this.color4, (distanceFactor - 0.6) / 0.4);
      }

      const hueShift = (Math.random() - 0.5) * 0.08;
      const satShift = (Math.random() - 0.5) * 0.2;
      const lightShift = (Math.random() - 0.5) * 0.15;

      const hsl = { h: 0, s: 0, l: 0 };
      baseColor.getHSL(hsl);
      hsl.h = Math.max(0, Math.min(1, hsl.h + hueShift));
      hsl.s = Math.max(0.2, Math.min(0.9, hsl.s + satShift));
      hsl.l = Math.max(0.1, Math.min(0.5, hsl.l + lightShift));
      baseColor.setHSL(hsl.h, hsl.s, hsl.l);

      this.colors[i3] = baseColor.r;
      this.colors[i3 + 1] = baseColor.g;
      this.colors[i3 + 2] = baseColor.b;

      this.baseColors[i3] = baseColor.r;
      this.baseColors[i3 + 1] = baseColor.g;
      this.baseColors[i3 + 2] = baseColor.b;

      this.sizes[i] = 1 + Math.random() * 3 + (1 - distanceFactor) * 3;
      this.alphas[i] = 0.15 + Math.random() * 0.4 + (1 - distanceFactor) * 0.3;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    const texture = this.createCloudTexture();

    this.material = new THREE.PointsMaterial({
      size: 4,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: texture,
      alphaMap: texture
    });

    this.mesh = new THREE.Points(this.geometry, this.material);
    this.mesh.rotation.x = Math.PI / 8;
    this.scene.add(this.mesh);
  }

  private createCloudTexture(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(180, 160, 255, 0.6)');
    gradient.addColorStop(0.3, 'rgba(138, 100, 220, 0.35)');
    gradient.addColorStop(0.6, 'rgba(90, 60, 160, 0.15)');
    gradient.addColorStop(1, 'rgba(45, 27, 105, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    for (let i = 0; i < 12; i++) {
      const x = Math.random() * 64;
      const y = Math.random() * 64;
      const r = 2 + Math.random() * 6;

      const spotGradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      spotGradient.addColorStop(0, `rgba(200, 180, 255, ${0.1 + Math.random() * 0.2})`);
      spotGradient.addColorStop(1, 'rgba(100, 80, 180, 0)');

      ctx.fillStyle = spotGradient;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    return canvas;
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;
    this.mesh.rotation.y += this.rotationSpeed * deltaTime;

    const positions = this.geometry.attributes.position.array as Float32Array;
    const colors = this.geometry.attributes.color.array as Float32Array;

    let avgAlpha = 0;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      const wave = Math.sin(this.time * 0.5 + this.basePositions[i3] * 0.01 + this.basePositions[i3 + 2] * 0.01);
      avgAlpha += this.alphas[i] * (0.85 + wave * 0.15);

      const colorWave = Math.sin(this.time * 0.3 + i * 0.002) * 0.05;
      colors[i3] = Math.max(0, Math.min(1, this.baseColors[i3] + colorWave));
      colors[i3 + 1] = Math.max(0, Math.min(1, this.baseColors[i3 + 1] + colorWave * 0.8));
      colors[i3 + 2] = Math.max(0, Math.min(1, this.baseColors[i3 + 2] + colorWave * 0.6));

      positions[i3 + 1] = this.basePositions[i3 + 1] + Math.sin(this.time * 0.3 + this.basePositions[i3] * 0.005 + this.basePositions[i3 + 2] * 0.005) * 0.5;
    }

    this.material.opacity = Math.max(0.1, avgAlpha / this.particleCount) * 0.6;
    this.material.size = this.computeAverageSize() * this.pixelRatio;

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  private computeAverageSize(): number {
    let sum = 0;
    const samples = Math.min(200, this.sizes.length);
    const step = Math.floor(this.sizes.length / samples);
    for (let i = 0; i < this.sizes.length; i += step) {
      sum += this.sizes[i];
    }
    return Math.max(0.5, sum / samples);
  }

  public getMesh(): THREE.Points {
    return this.mesh;
  }

  public setRotationSpeed(speed: number): void {
    this.rotationSpeed = speed;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.scene.remove(this.mesh);
  }
}
