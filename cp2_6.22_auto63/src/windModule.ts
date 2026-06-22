import * as THREE from 'three';
import type { WindParams, TransitionState } from './types';

export class WindModule {
  private scene: THREE.Scene | null = null;
  private params: WindParams = { direction: 45, speed: 8, turbulence: 'medium' };
  private targetParams: WindParams = { direction: 45, speed: 8, turbulence: 'medium' };
  private transition: TransitionState = { active: false, startTime: 0, duration: 1000 };

  private streamlineCount = 45;
  private streamlines: {
    points: THREE.Vector3[];
    particles: THREE.Points;
    offsets: Float32Array;
  }[] = [];

  private arrowGroup: THREE.Group | null = null;
  private arrows: THREE.Mesh[] = [];

  private particlePool: {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    streamlineIndex: number;
  }[] = [];

  private areaSize = 120;
  private maxParticles = 1800;
  private particleSystem: THREE.Points | null = null;
  private particlePositions: Float32Array | null = null;
  private particleColors: Float32Array | null = null;
  private particleSizes: Float32Array | null = null;

  private time = 0;

  init(scene: THREE.Scene, areaSize: number): void {
    this.scene = scene;
    this.areaSize = areaSize;

    this.createStreamlines();
    this.createArrowField();
    this.createParticleSystem();
  }

  private createStreamlines(): void {
    if (!this.scene) return;

    for (let i = 0; i < this.streamlineCount; i++) {
      const startX = (Math.random() - 0.5) * this.areaSize;
      const startZ = (Math.random() - 0.5) * this.areaSize;
      const startY = 2 + Math.random() * 45;

      const points = this.generateStreamlinePoints(new THREE.Vector3(startX, startY, startZ));

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x4fc3f7,
        transparent: true,
        opacity: 0.25,
      });
      const line = new THREE.Line(geometry, material);
      this.scene.add(line);

      const particleCount = 8;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const offsets = new Float32Array(particleCount);

      for (let p = 0; p < particleCount; p++) {
        offsets[p] = p / particleCount;
      }

      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const pMat = new THREE.PointsMaterial({
        size: 0.7,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const particles = new THREE.Points(pGeo, pMat);
      this.scene.add(particles);

      this.streamlines.push({ points, particles, offsets });
    }
  }

  private generateStreamlinePoints(start: THREE.Vector3): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const count = 60;
    const step = 1.2;
    let pos = start.clone();

    for (let i = 0; i < count; i++) {
      points.push(pos.clone());
      const vel = this.getWindVelocityAt(pos);
      pos.add(vel.clone().multiplyScalar(step));

      pos.x = THREE.MathUtils.clamp(pos.x, -this.areaSize / 2, this.areaSize / 2);
      pos.z = THREE.MathUtils.clamp(pos.z, -this.areaSize / 2, this.areaSize / 2);
      pos.y = THREE.MathUtils.clamp(pos.y, 1, 60);
    }
    return points;
  }

  getWindVelocityAt(position: THREE.Vector3): THREE.Vector3 {
    const dirRad = (this.params.direction * Math.PI) / 180;
    const baseSpeed = this.params.speed;

    const turbAmplitude = this.params.turbulence === 'low' ? 0.3
      : this.params.turbulence === 'medium' ? 0.8
      : 1.6;

    const t = this.time * 0.5;
    const turbX = Math.sin(position.x * 0.05 + t) * Math.cos(position.z * 0.04) * turbAmplitude;
    const turbZ = Math.cos(position.y * 0.03 + t * 1.1) * Math.sin(position.x * 0.06) * turbAmplitude;
    const turbY = Math.sin(position.z * 0.05 + t * 0.8) * Math.cos(position.y * 0.04) * turbAmplitude * 0.5;

    const heightFactor = 1 + (position.y / 60) * 0.4;
    const speed = baseSpeed * heightFactor * 0.1;

    return new THREE.Vector3(
      Math.sin(dirRad) * speed + turbX,
      turbY,
      Math.cos(dirRad) * speed + turbZ
    );
  }

  private createArrowField(): void {
    if (!this.scene) return;

    this.arrowGroup = new THREE.Group();
    const gridSize = 6;
    const spacing = this.areaSize / gridSize;

    for (let gx = 0; gx < gridSize; gx++) {
      for (let gz = 0; gz < gridSize; gz++) {
        for (let gy = 0; gy < 3; gy++) {
          const x = -this.areaSize / 2 + spacing / 2 + gx * spacing + (Math.random() - 0.5) * 3;
          const z = -this.areaSize / 2 + spacing / 2 + gz * spacing + (Math.random() - 0.5) * 3;
          const y = 5 + gy * 15 + (Math.random() - 0.5) * 3;

          const dir = new THREE.Vector3(0, 1, 0);
          const arrow = new THREE.ArrowHelper(
            dir,
            new THREE.Vector3(x, y, z),
            2,
            0x00bcd4,
            0.8,
            0.4
          );
          this.arrowGroup.add(arrow);
          this.arrows.push(arrow as unknown as THREE.Mesh);
        }
      }
    }
    this.scene.add(this.arrowGroup);
  }

  private createParticleSystem(): void {
    if (!this.scene) return;

    const count = this.maxParticles;
    this.particlePositions = new Float32Array(count * 3);
    this.particleColors = new Float32Array(count * 3);
    this.particleSizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      this.particlePositions[i * 3] = 9999;
      this.particlePositions[i * 3 + 1] = 9999;
      this.particlePositions[i * 3 + 2] = 9999;
      this.particleSizes[i] = 0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.particleSystem);

    this.seedParticles();
  }

  private seedParticles(): void {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particlePool.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * this.areaSize,
          2 + Math.random() * 50,
          (Math.random() - 0.5) * this.areaSize
        ),
        velocity: new THREE.Vector3(),
        life: Math.random(),
        maxLife: 1,
        streamlineIndex: i % this.streamlineCount,
      });
    }
  }

  updateWind(params: Partial<WindParams>): void {
    let changed = false;

    if (params.direction !== undefined && params.direction !== this.targetParams.direction) {
      this.targetParams.direction = params.direction;
      changed = true;
    }
    if (params.speed !== undefined && params.speed !== this.targetParams.speed) {
      this.targetParams.speed = params.speed;
      changed = true;
    }
    if (params.turbulence !== undefined && params.turbulence !== this.targetParams.turbulence) {
      this.targetParams.turbulence = params.turbulence;
      changed = true;
    }

    if (changed) {
      this.transition.active = true;
      this.transition.startTime = performance.now();
    }
  }

  getParams(): WindParams {
    return { ...this.params };
  }

  isTransitioning(): boolean {
    return this.transition.active;
  }

  private lerpAngle(a: number, b: number, t: number): number {
    let diff = b - a;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return a + diff * t;
  }

  update(delta: number): void {
    this.time += delta;

    if (this.transition.active) {
      const elapsed = performance.now() - this.transition.startTime;
      const t = Math.min(1, elapsed / this.transition.duration);
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      this.params.direction = this.lerpAngle(this.params.direction, this.targetParams.direction, easeT);
      this.params.speed = THREE.MathUtils.lerp(this.params.speed, this.targetParams.speed, easeT);

      if (t >= 1) {
        this.params = { ...this.targetParams };
        this.transition.active = false;
      }
    }

    this.updateStreamlineParticles(delta);
    this.updateArrows();
    this.updateFreeParticles(delta);
  }

  private updateStreamlineParticles(delta: number): void {
    const speedFactor = this.params.speed / 10;

    this.streamlines.forEach((sl, idx) => {
      const positions = sl.particles.geometry.attributes.position.array as Float32Array;
      const colors = sl.particles.geometry.attributes.color.array as Float32Array;
      const pointCount = sl.points.length;

      for (let p = 0; p < sl.offsets.length; p++) {
        sl.offsets[p] += delta * 0.15 * speedFactor;
        if (sl.offsets[p] >= 1) sl.offsets[p] -= 1;

        const posIdx = sl.offsets[p] * (pointCount - 1);
        const i0 = Math.floor(posIdx);
        const i1 = Math.min(i0 + 1, pointCount - 1);
        const frac = posIdx - i0;

        const p0 = sl.points[i0];
        const p1 = sl.points[i1];

        positions[p * 3] = THREE.MathUtils.lerp(p0.x, p1.x, frac);
        positions[p * 3 + 1] = THREE.MathUtils.lerp(p0.y, p1.y, frac);
        positions[p * 3 + 2] = THREE.MathUtils.lerp(p0.z, p1.z, frac);

        const color = this.getWindColor(this.params.speed, this.transition.active);
        colors[p * 3] = color.r;
        colors[p * 3 + 1] = color.g;
        colors[p * 3 + 2] = color.b;
      }

      sl.particles.geometry.attributes.position.needsUpdate = true;
      sl.particles.geometry.attributes.color.needsUpdate = true;

      if (this.transition.active || idx % 5 === 0) {
        const startPos = new THREE.Vector3(
          sl.points[0].x,
          sl.points[0].y,
          sl.points[0].z
        );
        const newPoints = this.generateStreamlinePoints(startPos);
        sl.points = newPoints;
        const positionsAttr = (sl.particles.parent as any);
      }
    });
  }

  private updateArrows(): void {
    if (!this.arrowGroup) return;
    const dirRad = (this.params.direction * Math.PI) / 180;
    const arrowLength = 1.5 + (this.params.speed / 20) * 3;

    this.arrowGroup.children.forEach((child, idx) => {
      const arrow = child as THREE.ArrowHelper;
      const pos = arrow.position.clone();
      const vel = this.getWindVelocityAt(pos);
      vel.normalize();

      arrow.setDirection(vel);
      arrow.setLength(arrowLength, 0.8, 0.4);

      const color = this.getWindColor(this.params.speed, this.transition.active);
      arrow.setColor(color);
    });
  }

  private updateFreeParticles(delta: number): void {
    if (!this.particleSystem || !this.particlePositions || !this.particleColors) return;

    for (let i = 0; i < this.particlePool.length; i++) {
      const p = this.particlePool[i];
      const vel = this.getWindVelocityAt(p.position);
      p.position.add(vel.clone().multiplyScalar(delta * 20));
      p.life -= delta * 0.25 * (1 / (this.params.speed / 8 + 0.3));

      if (p.life <= 0) {
        p.position.set(
          (Math.random() - 0.5) * this.areaSize,
          2 + Math.random() * 50,
          (Math.random() - 0.5) * this.areaSize
        );
        p.life = 1;
      }

      if (p.position.y < 1) p.position.y = 50;
      if (Math.abs(p.position.x) > this.areaSize / 2) p.position.x *= -0.8;
      if (Math.abs(p.position.z) > this.areaSize / 2) p.position.z *= -0.8;

      this.particlePositions[i * 3] = p.position.x;
      this.particlePositions[i * 3 + 1] = p.position.y;
      this.particlePositions[i * 3 + 2] = p.position.z;

      const color = this.getWindColor(this.params.speed, this.transition.active);
      const fade = Math.max(0.2, p.life);
      this.particleColors[i * 3] = color.r * fade;
      this.particleColors[i * 3 + 1] = color.g * fade;
      this.particleColors[i * 3 + 2] = color.b * fade;
    }

    this.particleSystem.geometry.attributes.position.needsUpdate = true;
    this.particleSystem.geometry.attributes.color.needsUpdate = true;
  }

  getWindColor(speed: number, transitioning: boolean): THREE.Color {
    if (transitioning) {
      return new THREE.Color(0xff9800);
    }
    const t = Math.min(1, speed / 20);
    const color = new THREE.Color();
    color.setHSL(
      THREE.MathUtils.lerp(0.6, 0.78, t),
      0.8,
      THREE.MathUtils.lerp(0.55, 0.5, t)
    );
    return color;
  }
}

export const windModule = new WindModule();
