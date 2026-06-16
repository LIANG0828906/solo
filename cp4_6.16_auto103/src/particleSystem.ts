import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';
import { ExplosionShape, ParticleConfig, ParticleData, FireworkInstance } from './types';

const GRAVITY = 9.8;
const WIND_STRENGTH = 0.5;
const PARTICLE_LIFETIME = 2.5;
const RISE_SPEED = 15;
const RISE_DURATION = 1.2;

export class ParticleSystem {
  private scene: THREE.Scene;
  private fireworks: Map<string, FireworkInstance> = new Map();
  private pointsMap: Map<string, THREE.Points> = new Map();
  private trailPointsMap: Map<string, THREE.Points> = new Map();
  private flashLights: Map<string, THREE.PointLight> = new Map();
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
  }

  public launchFirework(
    launchPos: { x: number; y: number; z: number },
    colors: string[],
    shape: ExplosionShape,
    particleCount: number,
    explosionHeight?: number
  ): ParticleConfig {
    const config: ParticleConfig = {
      id: uuidv4(),
      launchPosition: { ...launchPos },
      explosionHeight: explosionHeight ?? 8 + Math.random() * 4,
      colors: colors.length > 0 ? [...colors] : ['#FF6B35', '#FFE66D'],
      shape,
      particleCount,
      timestamp: Date.now(),
    };

    const firework: FireworkInstance = {
      config,
      phase: 'rising',
      risePosition: { ...launchPos },
      riseVelocity: RISE_SPEED,
      riseProgress: 0,
      trailParticles: [],
      explosionParticles: null,
      explosionTime: 0,
      flashLight: null,
    };

    this.fireworks.set(config.id, firework);
    this.createTrailPoints(config.id);
    return config;
  }

  public replayFirework(config: ParticleConfig): void {
    this.clearAllFireworks();
    this.launchFirework(
      config.launchPosition,
      config.colors,
      config.shape,
      config.particleCount,
      config.explosionHeight
    );
  }

  public clearAllFireworks(): void {
    this.fireworks.forEach((_, id) => this.removeFirework(id));
    this.fireworks.clear();
    this.pointsMap.clear();
    this.trailPointsMap.clear();
    this.flashLights.forEach((light) => this.scene.remove(light));
    this.flashLights.clear();
  }

  public update(deltaTime: number): void {
    this.fireworks.forEach((firework, id) => {
      if (firework.phase === 'rising') {
        this.updateRisingPhase(firework, deltaTime, id);
      } else {
        this.updateExplosionPhase(firework, deltaTime, id);
      }
    });
  }

  public takeSnapshot(): string {
    const canvas = this.renderer.domElement;
    const tempCanvas = document.createElement('canvas');
    const targetWidth = 64;
    const targetHeight = 64;
    tempCanvas.width = targetWidth;
    tempCanvas.height = targetHeight;
    const ctx = tempCanvas.getContext('2d')!;

    ctx.fillStyle = '#0a0a2a';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    const scale = Math.min(targetWidth / canvas.width, targetHeight / canvas.height);
    const scaledWidth = canvas.width * scale;
    const scaledHeight = canvas.height * scale;
    const offsetX = (targetWidth - scaledWidth) / 2;
    const offsetY = (targetHeight - scaledHeight) / 2;

    ctx.drawImage(canvas, offsetX, offsetY, scaledWidth, scaledHeight);

    return tempCanvas.toDataURL('image/jpeg', 0.6);
  }

  private updateRisingPhase(firework: FireworkInstance, deltaTime: number, id: string): void {
    firework.riseProgress += deltaTime / RISE_DURATION;
    firework.riseVelocity -= GRAVITY * deltaTime * 0.3;
    firework.risePosition.y += firework.riseVelocity * deltaTime;

    if (Math.random() < 0.3) {
      const trailParticle = this.createTrailParticle(firework.risePosition);
      firework.trailParticles.push(trailParticle);
    }

    firework.trailParticles = firework.trailParticles.filter((p) => {
      p.life[0] -= deltaTime;
      p.position[1] += p.velocity[1] * deltaTime;
      return p.life[0] > 0;
    });

    this.updateTrailPoints(id, firework.trailParticles);

    if (firework.riseProgress >= 1 || firework.risePosition.y >= firework.config.explosionHeight) {
      this.triggerExplosion(firework, id);
    }
  }

  private triggerExplosion(firework: FireworkInstance, id: string): void {
    firework.phase = 'exploded';
    firework.explosionTime = 0;

    firework.explosionParticles = this.createExplosionParticles(
      firework.risePosition,
      firework.config.colors,
      firework.config.shape,
      firework.config.particleCount
    );

    this.createExplosionPoints(id, firework.config.particleCount);

    const flashLight = new THREE.PointLight(0xffffff, 3, 30);
    flashLight.position.set(
      firework.risePosition.x,
      firework.risePosition.y,
      firework.risePosition.z
    );
    this.scene.add(flashLight);
    this.flashLights.set(id, flashLight);

    firework.flashLight = {
      intensity: 3,
      duration: 0.15,
      elapsed: 0,
    };

    this.trailPointsMap.get(id)?.geometry.dispose();
    this.scene.remove(this.trailPointsMap.get(id)!);
    this.trailPointsMap.delete(id);
  }

  private updateExplosionPhase(firework: FireworkInstance, deltaTime: number, id: string): void {
    firework.explosionTime += deltaTime;

    if (firework.flashLight) {
      firework.flashLight.elapsed += deltaTime;
      const t = firework.flashLight.elapsed / firework.flashLight.duration;
      const intensity = firework.flashLight.intensity * Math.max(0, 1 - t);
      const light = this.flashLights.get(id);
      if (light) {
        light.intensity = intensity;
        if (t >= 1) {
          this.scene.remove(light);
          this.flashLights.delete(id);
          firework.flashLight = null;
        }
      }
    }

    if (firework.explosionParticles) {
      let allDead = true;

      firework.explosionParticles.forEach((particle) => {
        if (particle.life[0] <= 0) return;
        allDead = false;

        particle.life[0] -= deltaTime;
        const t = 1 - particle.life[0] / particle.maxLife;

        particle.velocity[1] -= GRAVITY * deltaTime;
        particle.velocity[0] += (Math.random() - 0.5) * WIND_STRENGTH * deltaTime;
        particle.velocity[2] += (Math.random() - 0.5) * WIND_STRENGTH * deltaTime;

        particle.position[0] += particle.velocity[0] * deltaTime;
        particle.position[1] += particle.velocity[1] * deltaTime;
        particle.position[2] += particle.velocity[2] * deltaTime;

        const color = this.interpolateColor(firework.config.colors, t);
        const brightness = 1 - 0.5 * (particle.distanceFromCenter / 8);
        particle.color[0] = color.r * Math.max(0.3, brightness);
        particle.color[1] = color.g * Math.max(0.3, brightness);
        particle.color[2] = color.b * Math.max(0.3, brightness);
        particle.color[3] = Math.max(0, 1 - t);
      });

      this.updateExplosionPoints(id, firework.explosionParticles);

      if (allDead) {
        this.removeFirework(id);
      }
    }
  }

  private createTrailParticle(position: { x: number; y: number; z: number }): ParticleData {
    const t = Math.random();
    return {
      position: new Float32Array([
        position.x + (Math.random() - 0.5) * 0.1,
        position.y,
        position.z + (Math.random() - 0.5) * 0.1,
      ]),
      velocity: new Float32Array([0, -1 - Math.random() * 2, 0]),
      color: new Float32Array([1, 1 - t * 0.5, t * 0.5, 1]),
      life: new Float32Array([0.5 + Math.random() * 0.5]),
      maxLife: 1,
      initialSize: 0.08,
      distanceFromCenter: 0,
    };
  }

  private createExplosionParticles(
    position: { x: number; y: number; z: number },
    colors: string[],
    shape: ExplosionShape,
    count: number
  ): ParticleData[] {
    const particles: ParticleData[] = [];

    for (let i = 0; i < count; i++) {
      const direction = this.getShapeDirection(shape, i, count);
      const speed = 2 + Math.random() * 3;
      const initialColor = this.interpolateColor(colors, 0);

      particles.push({
        position: new Float32Array([position.x, position.y, position.z]),
        velocity: new Float32Array([
          direction.x * speed,
          direction.y * speed,
          direction.z * speed,
        ]),
        color: new Float32Array([initialColor.r, initialColor.g, initialColor.b, 1]),
        life: new Float32Array([PARTICLE_LIFETIME]),
        maxLife: PARTICLE_LIFETIME,
        initialSize: 0.12 + Math.random() * 0.08,
        distanceFromCenter: 0,
      });
    }

    return particles;
  }

  private getShapeDirection(shape: ExplosionShape, index: number, total: number): THREE.Vector3 {
    const dir = new THREE.Vector3();

    switch (shape) {
      case 'circle': {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        dir.setFromSphericalCoords(1, phi, theta);
        break;
      }

      case 'star': {
        const spineIndex = index % 5;
        const spineAngle = (spineIndex / 5) * Math.PI * 2 - Math.PI / 2;
        const spread = (Math.random() - 0.5) * 0.3;
        const theta = spineAngle + spread;
        const phi = Math.PI / 2 + (Math.random() - 0.5) * 0.2;
        const r = 0.7 + Math.random() * 0.3;
        dir.setFromSphericalCoords(r, phi, theta);
        break;
      }

      case 'heart': {
        const t = (index / total) * Math.PI * 2;
        const scale = 0.06;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        const hz = (Math.random() - 0.5) * 8;
        dir.set(hx * scale, hy * scale, hz * scale).normalize();
        break;
      }
    }

    return dir.normalize();
  }

  private interpolateColor(colors: string[], t: number): { r: number; g: number; b: number } {
    if (colors.length === 1) {
      const c = new THREE.Color(colors[0]);
      return { r: c.r, g: c.g, b: c.b };
    }

    const segmentCount = colors.length - 1;
    const scaledT = t * segmentCount;
    const segmentIndex = Math.min(Math.floor(scaledT), segmentCount - 1);
    const segmentT = scaledT - segmentIndex;

    const c1 = new THREE.Color(colors[segmentIndex]);
    const c2 = new THREE.Color(colors[segmentIndex + 1]);

    return {
      r: c1.r + (c2.r - c1.r) * segmentT,
      g: c1.g + (c2.g - c1.g) * segmentT,
      b: c1.b + (c2.b - c1.b) * segmentT,
    };
  }

  private createTrailPoints(id: string): void {
    const geometry = new THREE.BufferGeometry();
    const maxTrails = 50;

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxTrails * 3), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(maxTrails * 4), 4));
    geometry.setAttribute('size', new THREE.BufferAttribute(new Float32Array(maxTrails), 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    this.trailPointsMap.set(id, points);
  }

  private updateTrailPoints(id: string, particles: ParticleData[]): void {
    const points = this.trailPointsMap.get(id);
    if (!points) return;

    const geometry = points.geometry;
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
    const sizeAttr = geometry.getAttribute('size') as THREE.BufferAttribute;

    particles.forEach((p, i) => {
      posAttr.setXYZ(i, p.position[0], p.position[1], p.position[2]);
      const alpha = Math.max(0, p.life[0] / p.maxLife);
      colorAttr.setXYZW(i, p.color[0], p.color[1], p.color[2], alpha);
      sizeAttr.setX(i, p.initialSize * alpha);
    });

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    geometry.setDrawRange(0, particles.length);
  }

  private createExplosionPoints(id: string, count: number): void {
    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 4), 4));
    geometry.setAttribute('size', new THREE.BufferAttribute(new Float32Array(count), 1));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    this.pointsMap.set(id, points);
  }

  private updateExplosionPoints(id: string, particles: ParticleData[]): void {
    const points = this.pointsMap.get(id);
    if (!points) return;

    const geometry = points.geometry;
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
    const sizeAttr = geometry.getAttribute('size') as THREE.BufferAttribute;

    particles.forEach((p, i) => {
      posAttr.setXYZ(i, p.position[0], p.position[1], p.position[2]);
      colorAttr.setXYZW(i, p.color[0], p.color[1], p.color[2], p.color[3]);
      const t = 1 - p.life[0] / p.maxLife;
      sizeAttr.setX(i, p.initialSize * (1 - t * 0.7));
    });

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  }

  private removeFirework(id: string): void {
    const points = this.pointsMap.get(id);
    if (points) {
      points.geometry.dispose();
      (points.material as THREE.Material).dispose();
      this.scene.remove(points);
      this.pointsMap.delete(id);
    }

    const trailPoints = this.trailPointsMap.get(id);
    if (trailPoints) {
      trailPoints.geometry.dispose();
      (trailPoints.material as THREE.Material).dispose();
      this.scene.remove(trailPoints);
      this.trailPointsMap.delete(id);
    }

    const flashLight = this.flashLights.get(id);
    if (flashLight) {
      this.scene.remove(flashLight);
      this.flashLights.delete(id);
    }

    this.fireworks.delete(id);
  }
}
