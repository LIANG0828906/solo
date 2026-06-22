import * as THREE from 'three';

export type AirflowMode = 'none' | 'vortex' | 'gust';

export interface ColorStop {
  position: number;
  color: THREE.Color;
}

export interface ParticleParams {
  emissionRate: number;
  initialSpeed: number;
  lifetime: number;
  particleSize: number;
}

interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  size: number;
  seed: number;
  spawnTime: number;
}

export class FireParticleSystem {
  private scene: THREE.Scene;
  private maxParticles: number;
  private particles: ParticleData[] = [];
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.PointsMaterial;
  private points!: THREE.Points;

  private params: ParticleParams;
  private targetParams: ParticleParams;
  private paramsTransitionStart: number = 0;
  private paramsTransitionDuration: number = 0.2;
  private paramsStartValues: ParticleParams;

  private colorStops: ColorStop[];
  private targetColorStops: ColorStop[];
  private colorTransitionStart: number = 0;
  private colorTransitionDuration: number = 0.2;

  private airflowMode: AirflowMode = 'none';
  private targetAirflowMode: AirflowMode = 'none';
  private airflowTransitionStart: number = 0;
  private airflowTransitionDuration: number = 0.5;
  private previousAirflowMode: AirflowMode = 'none';

  private vortexRadius: number = 17.5;
  private gustOffset: number = 10;
  private gustInterval: number = 2;
  private lastGustTime: number = 0;
  private nextGustInterval: number = 2;
  private currentGustOffset: number = 0;
  private gustTransitionStart: number = 0;
  private gustDuration: number = 0.3;

  private emissionAccumulator: number = 0;
  private currentTime: number = 0;
  private burnerRadius: number = 0.8;

  private positions!: Float32Array;
  private colors!: Float32Array;
  private sizes!: Float32Array;

  constructor(scene: THREE.Scene, maxParticles: number = 3000) {
    this.scene = scene;
    this.maxParticles = maxParticles;

    this.params = {
      emissionRate: 125,
      initialSpeed: 2.5,
      lifetime: 4,
      particleSize: 7
    };
    this.targetParams = { ...this.params };
    this.paramsStartValues = { ...this.params };

    this.colorStops = [
      { position: 0, color: new THREE.Color(0xffffff) },
      { position: 0.5, color: new THREE.Color(0xff7700) },
      { position: 1, color: new THREE.Color(0x330000) }
    ];
    this.targetColorStops = this.colorStops.map(s => ({
      position: s.position,
      color: s.color.clone()
    }));

    this.initGeometry();
    this.initMaterial();
    this.initPoints();
  }

  private initGeometry(): void {
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.geometry.setDrawRange(0, 0);
  }

  private createCircleTexture(): THREE.Texture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private initMaterial(): void {
    this.material = new THREE.PointsMaterial({
      size: this.params.particleSize,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: this.createCircleTexture()
    });
  }

  private initPoints(): void {
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  public setParams(params: Partial<ParticleParams>): void {
    this.paramsStartValues = { ...this.getCurrentParams() };
    this.targetParams = { ...this.targetParams, ...params };
    this.paramsTransitionStart = this.currentTime;
  }

  public getCurrentParams(): ParticleParams {
    const t = Math.min(1, (this.currentTime - this.paramsTransitionStart) / this.paramsTransitionDuration);
    const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    return {
      emissionRate: this.lerp(this.paramsStartValues.emissionRate, this.targetParams.emissionRate, easeT),
      initialSpeed: this.lerp(this.paramsStartValues.initialSpeed, this.targetParams.initialSpeed, easeT),
      lifetime: this.lerp(this.paramsStartValues.lifetime, this.targetParams.lifetime, easeT),
      particleSize: this.lerp(this.paramsStartValues.particleSize, this.targetParams.particleSize, easeT)
    };
  }

  public setColorStops(stops: ColorStop[]): void {
    if (stops.length !== 3) return;
    this.targetColorStops = stops.map(s => ({
      position: s.position,
      color: s.color.clone()
    }));
    this.colorTransitionStart = this.currentTime;
  }

  public getColorStops(): ColorStop[] {
    return this.colorStops;
  }

  public setAirflowMode(mode: AirflowMode): void {
    if (this.targetAirflowMode === mode) return;
    this.previousAirflowMode = this.airflowMode;
    this.targetAirflowMode = mode;
    this.airflowTransitionStart = this.currentTime;
  }

  public getAirflowMode(): AirflowMode {
    return this.targetAirflowMode;
  }

  public setVortexRadius(radius: number): void {
    this.vortexRadius = radius;
  }

  public setGustParams(offset: number, interval: number): void {
    this.gustOffset = offset;
    this.gustInterval = interval;
  }

  public getActiveParticleCount(): number {
    return this.particles.length;
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private lerpColor(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
    return new THREE.Color(
      this.lerp(a.r, b.r, t),
      this.lerp(a.g, b.g, t),
      this.lerp(a.b, b.b, t)
    );
  }

  private getInterpolatedColorStops(): ColorStop[] {
    const t = Math.min(1, (this.currentTime - this.colorTransitionStart) / this.colorTransitionDuration);
    const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    return this.colorStops.map((stop, i) => ({
      position: this.lerp(stop.position, this.targetColorStops[i].position, easeT),
      color: this.lerpColor(stop.color, this.targetColorStops[i].color, easeT)
    }));
  }

  private sampleGradient(lifeRatio: number, stops: ColorStop[]): THREE.Color {
    if (lifeRatio <= stops[0].position) return stops[0].color.clone();
    if (lifeRatio >= stops[2].position) return stops[2].color.clone();

    for (let i = 0; i < 2; i++) {
      if (lifeRatio >= stops[i].position && lifeRatio <= stops[i + 1].position) {
        const range = stops[i + 1].position - stops[i].position;
        const localT = range === 0 ? 0 : (lifeRatio - stops[i].position) / range;
        return this.lerpColor(stops[i].color, stops[i + 1].color, localT);
      }
    }
    return stops[2].color.clone();
  }

  private getAirflowBlend(): { mode: AirflowMode; blend: number } {
    const t = Math.min(1, (this.currentTime - this.airflowTransitionStart) / this.airflowTransitionDuration);
    const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    return { mode: this.targetAirflowMode, blend: easeT };
  }

  private spawnParticle(): void {
    if (this.particles.length >= this.maxParticles) return;

    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * this.burnerRadius;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const y = -2;

    const currentParams = this.getCurrentParams();
    const speed = currentParams.initialSpeed * (0.8 + Math.random() * 0.4);
    const spreadAngle = (Math.random() - 0.5) * 0.3;
    const spreadAzimuth = Math.random() * Math.PI * 2;

    const vy = speed * Math.cos(spreadAngle);
    const vx = speed * Math.sin(spreadAngle) * Math.cos(spreadAzimuth);
    const vz = speed * Math.sin(spreadAngle) * Math.sin(spreadAzimuth);

    const lifetime = currentParams.lifetime * (0.8 + Math.random() * 0.4);

    this.particles.push({
      position: new THREE.Vector3(x, y, z),
      velocity: new THREE.Vector3(vx, vy, vz),
      lifetime: lifetime,
      maxLifetime: lifetime,
      size: currentParams.particleSize * (0.8 + Math.random() * 0.4),
      seed: Math.random() * 1000,
      spawnTime: this.currentTime
    });
  }

  private applyAirflow(p: ParticleData, _dt: number, airflowBlend: { mode: AirflowMode; blend: number }): void {
    const prevMode = this.previousAirflowMode;
    const currMode = airflowBlend.mode;
    const blend = airflowBlend.blend;

    const basePos = p.position.clone();
    let prevOffset = new THREE.Vector3();
    let currOffset = new THREE.Vector3();

    if (prevMode === 'vortex') {
      const age = this.currentTime - p.spawnTime;
      const height = p.position.y + 2;
      const helixR = this.vortexRadius * 0.01 * Math.min(1, height / 3);
      const angle = age * 2 + p.seed;
      prevOffset = new THREE.Vector3(
        Math.cos(angle) * helixR,
        0,
        Math.sin(angle) * helixR
      );
    } else if (prevMode === 'gust') {
      const gustT = Math.min(1, (this.currentTime - this.gustTransitionStart) / this.gustDuration);
      const gustEase = gustT < 0.5 ? 2 * gustT * gustT : 1 - Math.pow(-2 * gustT + 2, 2) / 2;
      const effectiveGust = this.currentGustOffset * 0.01 * gustEase;
      prevOffset = new THREE.Vector3(effectiveGust, 0, 0);
    }

    if (currMode === 'vortex') {
      const age = this.currentTime - p.spawnTime;
      const height = p.position.y + 2;
      const helixR = this.vortexRadius * 0.01 * Math.min(1, height / 3);
      const angle = age * 2 + p.seed;
      currOffset = new THREE.Vector3(
        Math.cos(angle) * helixR,
        0,
        Math.sin(angle) * helixR
      );
    } else if (currMode === 'gust') {
      const gustT = Math.min(1, (this.currentTime - this.gustTransitionStart) / this.gustDuration);
      const gustEase = gustT < 0.5 ? 2 * gustT * gustT : 1 - Math.pow(-2 * gustT + 2, 2) / 2;
      const effectiveGust = this.currentGustOffset * 0.01 * gustEase;
      currOffset = new THREE.Vector3(effectiveGust, 0, 0);
    }

    const blendedOffset = new THREE.Vector3().lerpVectors(prevOffset, currOffset, blend);
    p.position.copy(basePos).add(blendedOffset);
  }

  private updateGust(): void {
    if (this.currentTime - this.lastGustTime >= this.nextGustInterval) {
      this.lastGustTime = this.currentTime;
      this.nextGustInterval = this.gustInterval * (0.7 + Math.random() * 0.6);
      this.currentGustOffset = this.gustOffset * (0.7 + Math.random() * 0.6);
      this.gustTransitionStart = this.currentTime;
    }
    if (this.currentTime - this.gustTransitionStart >= this.gustDuration && this.currentGustOffset !== 0) {
      this.currentGustOffset = 0;
      this.gustTransitionStart = this.currentTime;
    }
  }

  public update(deltaTime: number): void {
    this.currentTime += deltaTime;

    const currentParams = this.getCurrentParams();
    this.params = currentParams;
    this.material.size = currentParams.particleSize;

    this.colorStops = this.getInterpolatedColorStops();

    const airflowBlend = this.getAirflowBlend();
    if (airflowBlend.blend >= 1) {
      this.airflowMode = this.targetAirflowMode;
    }

    this.updateGust();

    this.emissionAccumulator += currentParams.emissionRate * deltaTime;
    while (this.emissionAccumulator >= 1) {
      this.spawnParticle();
      this.emissionAccumulator -= 1;
    }

    const buoyancy = 1.5;
    const drag = 0.98;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.lifetime -= deltaTime;

      if (p.lifetime <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y += buoyancy * deltaTime;
      p.velocity.multiplyScalar(drag);

      const turbulence = 0.5;
      const noiseX = (Math.sin(this.currentTime * 3 + p.seed) * 0.5 + Math.cos(this.currentTime * 2.3 + p.seed * 1.7) * 0.5) * turbulence;
      const noiseZ = (Math.cos(this.currentTime * 2.7 + p.seed * 0.9) * 0.5 + Math.sin(this.currentTime * 3.1 + p.seed * 2.1) * 0.5) * turbulence;
      p.velocity.x += noiseX * deltaTime;
      p.velocity.z += noiseZ * deltaTime;

      const basePos = p.position.clone();
      p.position.add(p.velocity.clone().multiplyScalar(deltaTime));

      if (airflowBlend.mode !== 'none' || this.previousAirflowMode !== 'none') {
        const savedPos = p.position.clone();
        p.position.copy(basePos).add(p.velocity.clone().multiplyScalar(deltaTime));
        this.applyAirflow(p, deltaTime, airflowBlend);
        p.position.y = savedPos.y;
      }
    }

    this.updateBuffers();
  }

  private updateBuffers(): void {
    const count = this.particles.length;
    const drawCount = Math.min(count, this.maxParticles);

    for (let i = 0; i < drawCount; i++) {
      const p = this.particles[i];
      const lifeRatio = 1 - (p.lifetime / p.maxLifetime);
      const tailRatio = Math.min(1, lifeRatio / 0.6);
      const alpha = 1 - tailRatio;

      const idx3 = i * 3;
      this.positions[idx3] = p.position.x;
      this.positions[idx3 + 1] = p.position.y;
      this.positions[idx3 + 2] = p.position.z;

      const color = this.sampleGradient(lifeRatio, this.colorStops);
      this.colors[idx3] = color.r * alpha;
      this.colors[idx3 + 1] = color.g * alpha;
      this.colors[idx3 + 2] = color.b * alpha;

      const sizeMultiplier = 1 + lifeRatio * 0.5;
      this.sizes[i] = p.size * sizeMultiplier;
    }

    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    const sizeAttr = this.geometry.getAttribute('size') as THREE.BufferAttribute;

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    this.geometry.setDrawRange(0, drawCount);
  }

  public dispose(): void {
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
    if (this.material.map) {
      this.material.map.dispose();
    }
  }
}
