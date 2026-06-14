import * as THREE from 'three';

export interface OceanConfig {
  oceanRadius: number;
  gridResolution: number;
  particlesPerCurrent: number;
  maxTotalParticles: number;
}

export interface CurrentPath {
  name: string;
  points: THREE.Vector3[];
  startTemperature: number;
  endTemperature: number;
  speed: number;
}

export interface ParticleData {
  pathIndex: number;
  progress: number;
  speed: number;
  temperature: number;
}

export class OceanSystem {
  public scene: THREE.Scene;
  public oceanMesh!: THREE.Mesh;
  public particleSystem!: THREE.Points;
  public currentPaths: CurrentPath[] = [];
  public particleData: ParticleData[] = [];
  public speedMultiplier: number = 1.0;
  public showTemperature: boolean = false;
  public temperatureLabelMap: Map<number, number> = new Map();

  private config: OceanConfig;
  private warmColor = new THREE.Color(0xFF4500);
  private coolColor = new THREE.Color(0x1E90FF);
  private geometry!: THREE.BufferGeometry;
  private positions!: Float32Array;
  private colors!: Float32Array;
  private tempColor = new THREE.Color();

  constructor(scene: THREE.Scene, config: OceanConfig) {
    this.scene = scene;
    this.config = config;
    this.initOceanMesh();
    this.defineCurrentPaths();
    this.initParticleSystem();
  }

  private initOceanMesh(): void {
    const { oceanRadius, gridResolution } = this.config;

    const geometry = new THREE.CircleGeometry(oceanRadius, gridResolution);
    
    const positionAttr = geometry.attributes.position;
    const vertexColors: number[] = [];

    const shallowColor = new THREE.Color(0x87CEEB);
    const deepColor = new THREE.Color(0x000080);

    for (let i = 0; i < positionAttr.count; i++) {
      const x = positionAttr.getX(i);
      const y = positionAttr.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      const t = Math.min(dist / oceanRadius, 1.0);
      const color = shallowColor.clone().lerp(deepColor, t);
      vertexColors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));

    const material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92
    });

    this.oceanMesh = new THREE.Mesh(geometry, material);
    this.oceanMesh.rotation.x = -Math.PI / 2;
    this.oceanMesh.receiveShadow = true;
    this.scene.add(this.oceanMesh);
  }

  private defineCurrentPaths(): void {
    const r = this.config.oceanRadius;
    const half = r * 0.85;

    const gulfStream: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const x = -half * 0.7 + t * half * 1.1;
      const y = -half * 0.4 + t * half * 0.9;
      const curve = Math.sin(t * Math.PI * 1.2) * half * 0.15;
      gulfStream.push(new THREE.Vector3(x + curve, 0.02, y));
    }
    this.currentPaths.push({
      name: '墨西哥湾暖流',
      points: gulfStream,
      startTemperature: 26,
      endTemperature: 14,
      speed: 0.00035
    });

    const northAtlantic: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const x = half * 0.1 + t * half * 0.9;
      const y = half * 0.25 + Math.sin(t * Math.PI) * half * 0.2;
      northAtlantic.push(new THREE.Vector3(x, 0.02, y));
    }
    this.currentPaths.push({
      name: '北大西洋漂流',
      points: northAtlantic,
      startTemperature: 14,
      endTemperature: 7,
      speed: 0.00030
    });

    const kuroshio: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const x = half * 0.3 - t * half * 0.9;
      const y = -half * 0.25 + t * half * 0.95;
      const curve = Math.sin(t * Math.PI * 0.9) * half * 0.18;
      kuroshio.push(new THREE.Vector3(x + curve, 0.02, y));
    }
    this.currentPaths.push({
      name: '黑潮',
      points: kuroshio,
      startTemperature: 24,
      endTemperature: 10,
      speed: 0.00038
    });

    const humboldt: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const x = half * 0.65 - t * half * 0.1;
      const y = -half * 0.1 - t * half * 0.7;
      const curve = Math.sin(t * Math.PI * 1.1) * half * 0.1;
      humboldt.push(new THREE.Vector3(x + curve, 0.02, y));
    }
    this.currentPaths.push({
      name: '秘鲁寒流',
      points: humboldt,
      startTemperature: 18,
      endTemperature: 8,
      speed: 0.00028
    });

    const benguela: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const x = -half * 0.05 + t * half * 0.25;
      const y = -half * 0.05 - t * half * 0.75;
      const curve = Math.sin(t * Math.PI) * half * 0.12;
      benguela.push(new THREE.Vector3(x - curve, 0.02, y));
    }
    this.currentPaths.push({
      name: '本格拉寒流',
      points: benguela,
      startTemperature: 20,
      endTemperature: 9,
      speed: 0.00030
    });

    const equatorial: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const x = -half * 0.8 + t * half * 1.6;
      const y = -half * 0.08 + Math.sin(t * Math.PI * 3) * half * 0.06;
      equatorial.push(new THREE.Vector3(x, 0.02, y));
    }
    this.currentPaths.push({
      name: '北赤道暖流',
      points: equatorial,
      startTemperature: 26,
      endTemperature: 24,
      speed: 0.00032
    });

    const antarctic: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const angle = Math.PI * 2 * t;
      const radius = half * 0.65 + Math.sin(t * Math.PI * 5) * half * 0.05;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius - half * 0.35;
      antarctic.push(new THREE.Vector3(x, 0.02, y));
    }
    this.currentPaths.push({
      name: '南极绕极流',
      points: antarctic,
      startTemperature: 7,
      endTemperature: 5,
      speed: 0.00025
    });

    this.validateParticleCount();
  }

  private validateParticleCount(): void {
    const numPaths = this.currentPaths.length;
    const perPath = this.config.particlesPerCurrent;
    const total = numPaths * perPath;
    if (total > this.config.maxTotalParticles) {
      console.warn(`粒子总数 ${total} 超过上限 ${this.config.maxTotalParticles}，将被裁剪`);
    }
  }

  private initParticleSystem(): void {
    const numPaths = this.currentPaths.length;
    const perPath = this.config.particlesPerCurrent;
    let totalParticles = numPaths * perPath;
    if (totalParticles > this.config.maxTotalParticles) {
      totalParticles = this.config.maxTotalParticles;
    }

    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(totalParticles * 3);
    this.colors = new Float32Array(totalParticles * 3);

    let particleIndex = 0;
    let labelCount = 0;

    for (let pathIdx = 0; pathIdx < numPaths; pathIdx++) {
      const path = this.currentPaths[pathIdx];
      const points = path.points;
      const numSeg = points.length - 1;

      if (labelCount < 8) {
        this.temperatureLabelMap.set(pathIdx * perPath, pathIdx);
        labelCount++;
      }

      for (let i = 0; i < perPath; i++) {
        if (particleIndex >= this.config.maxTotalParticles) break;

        const progress = (i / perPath) + (Math.random() * 0.02 - 0.01);
        const wrappedProgress = progress - Math.floor(progress);

        this.particleData.push({
          pathIndex: pathIdx,
          progress: wrappedProgress,
          speed: path.speed * (0.85 + Math.random() * 0.3),
          temperature: this.getPathTemperature(path, wrappedProgress)
        });

        const pos = this.getPositionOnPath(pathIdx, wrappedProgress);
        const idx3 = particleIndex * 3;
        this.positions[idx3] = pos.x;
        this.positions[idx3 + 1] = pos.y + 0.02;
        this.positions[idx3 + 2] = pos.z;

        this.updateParticleColor(particleIndex, pathIdx, wrappedProgress);
        particleIndex++;
      }
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.particleSystem = new THREE.Points(this.geometry, material);
    this.scene.add(this.particleSystem);

    console.log(`初始化粒子系统：${numPaths}条洋流，${particleIndex}个粒子`);
  }

  private getPositionOnPath(pathIndex: number, progress: number): THREE.Vector3 {
    const path = this.currentPaths[pathIndex];
    const points = path.points;
    const numSeg = points.length - 1;
    const scaled = progress * numSeg;
    const idx = Math.min(Math.floor(scaled), numSeg - 1);
    const localT = scaled - idx;
    const p0 = points[idx];
    const p1 = points[idx + 1];
    return new THREE.Vector3(
      p0.x + (p1.x - p0.x) * localT,
      p0.y + (p1.y - p0.y) * localT,
      p0.z + (p1.z - p0.z) * localT
    );
  }

  private getPathTemperature(path: CurrentPath, progress: number): number {
    return path.startTemperature + (path.endTemperature - path.startTemperature) * progress;
  }

  private updateParticleColor(particleIdx: number, pathIdx: number, progress: number): void {
    const idx3 = particleIdx * 3;
    const path = this.currentPaths[pathIdx];
    const t = Math.min(Math.max(progress, 0), 1);
    const tempRange = 28 - 5;
    const normT = (path.startTemperature + (path.endTemperature - path.startTemperature) * t - 5) / tempRange;
    const clampedT = Math.min(Math.max(normT, 0), 1);
    this.tempColor.copy(this.warmColor).lerp(this.coolColor, 1 - clampedT);
    this.colors[idx3] = this.tempColor.r;
    this.colors[idx3 + 1] = this.tempColor.g;
    this.colors[idx3 + 2] = this.tempColor.b;
  }

  public update(delta: number): void {
    const dt = Math.min(delta, 0.05) * 1000;

    for (let i = 0; i < this.particleData.length; i++) {
      const p = this.particleData[i];
      p.progress += p.speed * this.speedMultiplier * dt;
      if (p.progress >= 1.0) {
        p.progress -= 1.0;
      }

      const pos = this.getPositionOnPath(p.pathIndex, p.progress);
      const idx3 = i * 3;
      this.positions[idx3] = pos.x;
      this.positions[idx3 + 1] = pos.y + 0.02;
      this.positions[idx3 + 2] = pos.z;

      p.temperature = this.getPathTemperature(this.currentPaths[p.pathIndex], p.progress);
      this.updateParticleColor(i, p.pathIndex, p.progress);
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  public getParticleWorldPosition(particleIndex: number): THREE.Vector3 {
    if (particleIndex < 0 || particleIndex >= this.particleData.length) {
      return new THREE.Vector3();
    }
    const p = this.particleData[particleIndex];
    return this.getPositionOnPath(p.pathIndex, p.progress);
  }

  public getParticleTemperature(particleIndex: number): number {
    if (particleIndex < 0 || particleIndex >= this.particleData.length) {
      return 0;
    }
    return this.particleData[particleIndex].temperature;
  }

  public setSpeedMultiplier(value: number): void {
    this.speedMultiplier = Math.max(0.5, Math.min(3.0, value));
  }

  public setShowTemperature(show: boolean): void {
    this.showTemperature = show;
  }

  public getTotalParticleCount(): number {
    return this.particleData.length;
  }

  public getMaxParticles(): number {
    return this.config.maxTotalParticles;
  }
}
