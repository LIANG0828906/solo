import * as THREE from 'three';

export interface StarData {
  id: number;
  name: string;
  constellation: string;
  brightness: number;
  distance: number;
  position: THREE.Vector3;
}

interface ConstellationRegion {
  name: string;
  centerRA: number;
  centerDec: number;
  spread: number;
}

const CONSTELLATION_REGIONS: ConstellationRegion[] = [
  { name: '猎户座', centerRA: 5.5, centerDec: 0, spread: 25 },
  { name: '大熊座', centerRA: 11, centerDec: 55, spread: 30 },
  { name: '小熊座', centerRA: 15, centerDec: 78, spread: 18 },
  { name: '仙女座', centerRA: 0.5, centerDec: 38, spread: 25 },
  { name: '英仙座', centerRA: 3.5, centerDec: 45, spread: 22 },
  { name: '仙后座', centerRA: 1, centerDec: 60, spread: 22 },
  { name: '狮子座', centerRA: 10.5, centerDec: 15, spread: 25 },
  { name: '天蝎座', centerRA: 16.5, centerDec: -30, spread: 25 },
  { name: '射手座', centerRA: 18.5, centerDec: -28, spread: 25 },
  { name: '双子座', centerRA: 7, centerDec: 23, spread: 20 },
  { name: '处女座', centerRA: 13, centerDec: -2, spread: 25 },
  { name: '天秤座', centerRA: 15, centerDec: -15, spread: 18 },
  { name: '水瓶座', centerRA: 22, centerDec: -10, spread: 25 },
  { name: '白羊座', centerRA: 2.5, centerDec: 20, spread: 18 },
  { name: '金牛座', centerRA: 4.5, centerDec: 16, spread: 22 },
  { name: '巨蟹座', centerRA: 8.5, centerDec: 18, spread: 15 },
  { name: '摩羯座', centerRA: 21, centerDec: -20, spread: 20 },
  { name: '双鱼座', centerRA: 0.5, centerDec: 8, spread: 25 },
  { name: '天鹅座', centerRA: 20.5, centerDec: 42, spread: 22 },
  { name: '天琴座', centerRA: 19, centerDec: 38, spread: 15 },
];

function assignConstellation(x: number, y: number, z: number): string {
  const radius = Math.sqrt(x * x + y * y + z * z);
  if (radius < 0.001) return CONSTELLATION_REGIONS[0].name;

  const dec = Math.asin(y / radius) * (180 / Math.PI);

  let ra = Math.atan2(z, x) * (12 / Math.PI);
  if (ra < 0) ra += 24;

  let bestName = CONSTELLATION_REGIONS[0].name;
  let bestDist = Infinity;

  for (const region of CONSTELLATION_REGIONS) {
    const raDiff = Math.abs(ra - region.centerRA);
    const raDist = Math.min(raDiff, 24 - raDiff) * 15;
    const decDist = dec - region.centerDec;
    const dist = Math.sqrt(raDist * raDist + decDist * decDist) / region.spread;

    if (dist < bestDist) {
      bestDist = dist;
      bestName = region.name;
    }
  }

  return bestName;
}

const STAR_PREFIXES = ['NGC', 'HD', 'HIP', 'SAO', 'BD', 'Gliese', 'Alpha', 'Beta', 'Gamma', 'Delta'];
const STAR_SUFFIXES = ['A', 'B', 'C', 'D', 'I', 'II', 'III', 'IV', 'V', 'X'];

function generateStarName(id: number): string {
  const prefix = STAR_PREFIXES[Math.floor(Math.random() * STAR_PREFIXES.length)];
  const suffix = STAR_SUFFIXES[Math.floor(Math.random() * STAR_SUFFIXES.length)];
  const number = Math.floor(id * 137.5 + Math.random() * 999) % 9999;
  return `${prefix}-${number.toString().padStart(4, '0')}${suffix}`;
}

export class StarField {
  private scene: THREE.Scene;
  private count: number;
  private starsMesh!: THREE.Points;
  private starsGeometry!: THREE.BufferGeometry;
  private starsMaterial!: THREE.PointsMaterial;

  private haloMesh!: THREE.Points;
  private haloGeometry!: THREE.BufferGeometry;

  private trailMesh!: THREE.Points;
  private trailGeometry!: THREE.BufferGeometry;
  private trailPositions!: Float32Array;

  private positions!: Float32Array;
  private colors!: Float32Array;
  private baseColors!: Float32Array;
  private sizes!: Float32Array;
  private alphas!: Float32Array;

  private twinkleSpeeds!: Float32Array;
  private twinkleAmplitudes!: Float32Array;
  private twinkleOffsets!: Float32Array;

  private starDataList: StarData[] = [];
  private time: number = 0;

  private lodDistance1: number = 600;
  private lodDistance2: number = 1000;

  private highlightedIndex: number | null = null;

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
    this.baseColors = new Float32Array(this.count * 3);
    this.sizes = new Float32Array(this.count);
    this.alphas = new Float32Array(this.count);

    this.twinkleSpeeds = new Float32Array(this.count);
    this.twinkleAmplitudes = new Float32Array(this.count);
    this.twinkleOffsets = new Float32Array(this.count);

    this.trailPositions = new Float32Array(this.count * 3);

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
      this.baseColors[i3] = color.r;
      this.baseColors[i3 + 1] = color.g;
      this.baseColors[i3 + 2] = color.b;

      const sizeFactor = Math.pow(Math.random(), 2);
      this.sizes[i] = 1.5 + sizeFactor * 4.5;

      this.alphas[i] = 0.4 + Math.random() * 0.6;

      this.twinkleSpeeds[i] = 0.5 + Math.random() * 3.5;
      this.twinkleAmplitudes[i] = 0.15 + Math.random() * 0.5;
      this.twinkleOffsets[i] = Math.random() * Math.PI * 2;

      this.starDataList.push({
        id: i,
        name: generateStarName(i),
        constellation: assignConstellation(x, y, z),
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

    const starTexture = new THREE.CanvasTexture(this.createStarTexture());
    const haloTexture = new THREE.CanvasTexture(this.createHaloTexture());
    const trailTexture = new THREE.CanvasTexture(this.createTrailTexture());

    this.starsMaterial = new THREE.PointsMaterial({
      size: 3,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: starTexture,
    });

    const haloMaterial = new THREE.PointsMaterial({
      size: 12,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: haloTexture,
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
    });

    this.starsMesh = new THREE.Points(this.starsGeometry, this.starsMaterial);
    this.haloMesh = new THREE.Points(this.haloGeometry, haloMaterial);
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

    const colors = this.starsGeometry.attributes.color.array as Float32Array;
    const trailPositions = this.trailGeometry.attributes.position.array as Float32Array;
    const positions = this.starsGeometry.attributes.position.array as Float32Array;

    const cameraPos = camera.position;

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

      const lodFactor = distance > this.lodDistance2 ? 0.3 : (distance > this.lodDistance1 ? 0.6 : 1);

      const isHighlighted = this.highlightedIndex === i;
      const colorScale = (isHighlighted ? 1.4 : 1.0) * (0.3 + twinkleValue * 0.7) * lodFactor;
      const colorBoost = isHighlighted ? 0.15 : 0;

      colors[i3] = Math.min(1, this.baseColors[i3] * colorScale + colorBoost);
      colors[i3 + 1] = Math.min(1, this.baseColors[i3 + 1] * colorScale + colorBoost);
      colors[i3 + 2] = Math.min(1, this.baseColors[i3 + 2] * colorScale + colorBoost * 0.6);

      const trailSpeed = 0.015 * lodFactor;
      trailPositions[i3] += (x - trailPositions[i3]) * trailSpeed;
      trailPositions[i3 + 1] += (y - trailPositions[i3 + 1]) * trailSpeed;
      trailPositions[i3 + 2] += (z - trailPositions[i3 + 2]) * trailSpeed;
    }

    this.starsGeometry.attributes.color.needsUpdate = true;
    this.trailGeometry.attributes.position.needsUpdate = true;

    this.starsMaterial.size = 3 + Math.sin(this.time * 0.5) * 0.15;
    this.starsMaterial.opacity = 0.85 + Math.sin(this.time * 0.3) * 0.05;
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
    this.highlightedIndex = index;
  }

  public resetHighlight(_index: number): void {
    this.highlightedIndex = null;
  }

  public dispose(): void {
    this.starsGeometry.dispose();
    this.starsMaterial.dispose();
    this.haloGeometry.dispose();
    this.trailGeometry.dispose();
    this.scene.remove(this.starsMesh);
    this.scene.remove(this.haloMesh);
    this.scene.remove(this.trailMesh);
  }
}
