import * as THREE from 'three';

export interface StarData {
  id: number;
  name: string;
  constellation: string;
  brightness: number;
  distance: number;
  position: THREE.Vector3;
}

const CONSTELLATIONS = [
  '猎户座', '大熊座', '小熊座', '仙女座', '英仙座',
  '仙后座', '狮子座', '天蝎座', '射手座', '双子座',
  '处女座', '天秤座', '水瓶座', '白羊座', '金牛座',
  '巨蟹座', '摩羯座', '双鱼座', '天鹅座', '天琴座'
];

const STAR_PREFIXES = ['NGC', 'HD', 'HIP', 'SAO', 'BD', 'Gliese', 'Alpha', 'Beta', 'Gamma', 'Delta'];
const STAR_SUFFIXES = ['A', 'B', 'C', 'D', 'I', 'II', 'III', 'IV', 'V', 'X'];

function generateStarName(id: number): string {
  const prefix = STAR_PREFIXES[Math.floor(Math.random() * STAR_PREFIXES.length)];
  const suffix = STAR_SUFFIXES[Math.floor(Math.random() * STAR_SUFFIXES.length)];
  const number = Math.floor(id * 137.5 + Math.random() * 999) % 9999;
  return `${prefix}-${number.toString().padStart(4, '0')}${suffix}`;
}

function getRandomConstellation(): string {
  return CONSTELLATIONS[Math.floor(Math.random() * CONSTELLATIONS.length)];
}

export class StarField {
  private scene: THREE.Scene;
  private count: number;
  private starsMesh!: THREE.Points;
  private starsGeometry!: THREE.BufferGeometry;
  private starsMaterial!: THREE.PointsMaterial;

  private haloMesh!: THREE.Points;
  private haloGeometry!: THREE.BufferGeometry;
  private haloMaterial!: THREE.PointsMaterial;

  private trailMesh!: THREE.Points;
  private trailGeometry!: THREE.BufferGeometry;
  private trailPositions!: Float32Array;

  private positions!: Float32Array;
  private colors!: Float32Array;
  private sizes!: Float32Array;
  private alphas!: Float32Array;

  private twinkleSpeeds!: Float32Array;
  private twinkleAmplitudes!: Float32Array;
  private twinkleOffsets!: Float32Array;

  private starDataList: StarData[] = [];
  private time: number = 0;

  private lodDistance1: number = 600;
  private lodDistance2: number = 1000;

  private pixelRatio: number = Math.min(window.devicePixelRatio, 2);

  private starColor1 = new THREE.Color(0xffffff);
  private starColor2 = new THREE.Color(0xffd700);
  private starColor3 = new THREE.Color(0x8ab4f8);

  constructor(scene: THREE.Scene, count: number = 5200) {
    this.scene = scene;
    this.count = count;
    this.init();
  }

  private init(): void {
    this.starsGeometry = new THREE.BufferGeometry();
    this.haloGeometry = new THREE.BufferGeometry();
    this.trailGeometry = new THREE.BufferGeometry();

    this.positions = new Float32Array(this.count * 3);
    this.colors = new Float32Array(this.count * 3);
    this.sizes = new Float32Array(this.count);
    this.alphas = new Float32Array(this.count);

    this.twinkleSpeeds = new Float32Array(this.count);
    this.twinkleAmplitudes = new Float32Array(this.count);
    this.twinkleOffsets = new Float32Array(this.count);

    const trailCount = this.count;
    this.trailPositions = new Float32Array(trailCount * 3);

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;

      const radius = 200 + Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
      const z = radius * Math.cos(phi);

      this.positions[i3] = x;
      this.positions[i3 + 1] = y;
      this.positions[i3 + 2] = z;

      this.trailPositions[i3] = x;
      this.trailPositions[i3 + 1] = y;
      this.trailPositions[i3 + 2] = z;

      const colorRandom = Math.random();
      let color: THREE.Color;
      if (colorRandom < 0.6) {
        color = this.starColor1.clone().lerp(this.starColor2, Math.random() * 0.3);
      } else if (colorRandom < 0.85) {
        color = this.starColor3.clone().lerp(this.starColor1, Math.random() * 0.5);
      } else {
        color = new THREE.Color().setHSL(0.8 + Math.random() * 0.1, 0.3, 0.7);
      }

      this.colors[i3] = color.r;
      this.colors[i3 + 1] = color.g;
      this.colors[i3 + 2] = color.b;

      const sizeFactor = Math.pow(Math.random(), 2);
      this.sizes[i] = 1.5 + sizeFactor * 4.5;

      this.alphas[i] = 0.4 + Math.random() * 0.6;

      this.twinkleSpeeds[i] = 0.5 + Math.random() * 3.5;
      this.twinkleAmplitudes[i] = 0.15 + Math.random() * 0.5;
      this.twinkleOffsets[i] = Math.random() * Math.PI * 2;

      this.starDataList.push({
        id: i,
        name: generateStarName(i),
        constellation: getRandomConstellation(),
        brightness: 0.1 + Math.random() * 4.8,
        distance: 10 + Math.random() * 490,
        position: new THREE.Vector3(x, y, z)
      });
    }

    this.starsGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.starsGeometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.haloGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions.slice(), 3));
    this.haloGeometry.setAttribute('color', new THREE.BufferAttribute(this.colors.slice(), 3));

    this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    this.trailGeometry.setAttribute('color', new THREE.BufferAttribute(this.colors.slice(), 3));

    const starCanvas = this.createStarTexture();
    const haloCanvas = this.createHaloTexture();
    const trailCanvas = this.createTrailTexture();

    const starTexture = new THREE.CanvasTexture(starCanvas);
    const haloTexture = new THREE.CanvasTexture(haloCanvas);
    const trailTexture = new THREE.CanvasTexture(trailCanvas);

    this.starsMaterial = new THREE.PointsMaterial({
      size: 3,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: starTexture,
      alphaMap: starTexture
    });

    this.haloMaterial = new THREE.PointsMaterial({
      size: 12,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: haloTexture,
      alphaMap: haloTexture
    });

    const trailMaterial = new THREE.PointsMaterial({
      size: 1.5,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: trailTexture,
      alphaMap: trailTexture
    });

    this.starsMesh = new THREE.Points(this.starsGeometry, this.starsMaterial);
    this.haloMesh = new THREE.Points(this.haloGeometry, this.haloMaterial);
    this.trailMesh = new THREE.Points(this.trailGeometry, trailMaterial);

    this.starsMesh.userData.isStarField = true;
    this.starsMesh.userData.starData = this.starDataList;

    this.scene.add(this.trailMesh);
    this.scene.add(this.haloMesh);
    this.scene.add(this.starsMesh);
  }

  private createStarTexture(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 230, 0.6)');
    gradient.addColorStop(0.7, 'rgba(255, 200, 150, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 150, 100, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    return canvas;
  }

  private createHaloTexture(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.3, 'rgba(255, 215, 0, 0.2)');
    gradient.addColorStop(0.6, 'rgba(138, 180, 248, 0.08)');
    gradient.addColorStop(1, 'rgba(45, 27, 105, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    return canvas;
  }

  private createTrailTexture(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(0.5, 'rgba(200, 200, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(100, 100, 200, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    return canvas;
  }

  public update(camera: THREE.Camera, deltaTime: number): void {
    this.time += deltaTime;

    const positions = this.starsGeometry.attributes.position.array as Float32Array;
    const colors = this.starsGeometry.attributes.color.array as Float32Array;

    const trailPositions = this.trailGeometry.attributes.position.array as Float32Array;

    const cameraPos = camera.position;

    const starSizes = new Float32Array(this.count);
    const starAlphas = new Float32Array(this.count);
    const haloSizes = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;

      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];

      const dx = cameraPos.x - x;
      const dy = cameraPos.y - y;
      const dz = cameraPos.z - z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const speed = this.twinkleSpeeds[i];
      const amplitude = this.twinkleAmplitudes[i];
      const offset = this.twinkleOffsets[i];

      const slowFactor = distance > this.lodDistance2 ? 0.3 : (distance > this.lodDistance1 ? 0.6 : 1);
      const twinkle = Math.sin(this.time * speed * slowFactor + offset);
      const twinkleValue = 0.5 + twinkle * 0.5;

      const baseSize = this.sizes[i];
      const lodFactor = distance > this.lodDistance2 ? 0.3 : (distance > this.lodDistance1 ? 0.6 : 1);

      starSizes[i] = baseSize * (1 + twinkle * amplitude * 0.4) * lodFactor;
      starAlphas[i] = (0.5 + twinkleValue * 0.5) * this.alphas[i] * lodFactor;

      const colorIntensity = 0.8 + twinkleValue * 0.2;
      colors[i3] = Math.min(1, this.colors[i3] * colorIntensity);
      colors[i3 + 1] = Math.min(1, this.colors[i3 + 1] * colorIntensity);
      colors[i3 + 2] = Math.min(1, this.colors[i3 + 2] * colorIntensity);

      haloSizes[i] = starSizes[i] * 4 * (0.8 + twinkleValue * 0.4) * lodFactor;

      const trailSpeed = 0.015 * lodFactor;
      trailPositions[i3] += (x - trailPositions[i3]) * trailSpeed;
      trailPositions[i3 + 1] += (y - trailPositions[i3 + 1]) * trailSpeed;
      trailPositions[i3 + 2] += (z - trailPositions[i3 + 2]) * trailSpeed;
    }

    this.starsMaterial.size = this.computeAverageSize(starSizes) * this.pixelRatio;
    this.starsMaterial.opacity = this.computeAverageOpacity(starAlphas);
    this.haloMaterial.size = this.computeAverageSize(haloSizes) * this.pixelRatio;

    this.starsGeometry.attributes.color.needsUpdate = true;
    this.trailGeometry.attributes.position.needsUpdate = true;
  }

  private computeAverageSize(sizes: Float32Array): number {
    let sum = 0;
    const samples = Math.min(200, sizes.length);
    const step = Math.floor(sizes.length / samples);
    for (let i = 0; i < sizes.length; i += step) {
      sum += sizes[i];
    }
    return Math.max(0.5, sum / samples);
  }

  private computeAverageOpacity(alphas: Float32Array): number {
    let sum = 0;
    const samples = Math.min(200, alphas.length);
    const step = Math.floor(alphas.length / samples);
    for (let i = 0; i < alphas.length; i += step) {
      sum += alphas[i];
    }
    return Math.max(0.1, sum / samples);
  }

  public getStarsMesh(): THREE.Points {
    return this.starsMesh;
  }

  public getStarData(index: number): StarData | undefined {
    return this.starDataList[index];
  }

  public getAllStarData(): StarData[] {
    return this.starDataList;
  }

  public highlightStar(index: number): void {
    const colors = this.starsGeometry.attributes.color.array as Float32Array;

    const i3 = index * 3;

    colors[i3] = Math.min(1, this.colors[i3] * 1.5 + 0.2);
    colors[i3 + 1] = Math.min(1, this.colors[i3 + 1] * 1.5 + 0.2);
    colors[i3 + 2] = Math.min(1, this.colors[i3 + 2] * 1.2);

    this.starsGeometry.attributes.color.needsUpdate = true;

    this.starsMaterial.size = this.sizes[index] * 2.5 * this.pixelRatio;
    this.starsMaterial.opacity = 1;
  }

  public resetHighlight(index: number): void {
    const colors = this.starsGeometry.attributes.color.array as Float32Array;

    const i3 = index * 3;

    colors[i3] = this.colors[i3];
    colors[i3 + 1] = this.colors[i3 + 1];
    colors[i3 + 2] = this.colors[i3 + 2];

    this.starsGeometry.attributes.color.needsUpdate = true;
  }

  public dispose(): void {
    this.starsGeometry.dispose();
    this.starsMaterial.dispose();
    this.haloGeometry.dispose();
    this.haloMaterial.dispose();
    this.trailGeometry.dispose();
    this.scene.remove(this.starsMesh);
    this.scene.remove(this.haloMesh);
    this.scene.remove(this.trailMesh);
  }
}
