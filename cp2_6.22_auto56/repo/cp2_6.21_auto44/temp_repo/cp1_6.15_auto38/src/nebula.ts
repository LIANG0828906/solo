import * as THREE from 'three';

export interface ThemePreset {
  name: string;
  colorStart: string;
  colorEnd: string;
  baseDensity: number;
  baseSpeed: number;
}

export const THEMES: ThemePreset[] = [
  { name: '星云', colorStart: '#6366f1', colorEnd: '#ec4899', baseDensity: 0.7, baseSpeed: 0.4 },
  { name: '极光', colorStart: '#10b981', colorEnd: '#3b82f6', baseDensity: 0.6, baseSpeed: 0.3 },
  { name: '火焰', colorStart: '#f59e0b', colorEnd: '#ef4444', baseDensity: 0.8, baseSpeed: 0.6 },
  { name: '深海', colorStart: '#0891b2', colorEnd: '#1e40af', baseDensity: 0.5, baseSpeed: 0.2 },
];

const PARTICLE_COUNT = 8000;
const COLOR_TRANSITION_DURATION = 0.5;
const THEME_TRANSITION_DURATION = 2.0;
const MOUSE_INFLUENCE_RADIUS = 150;
const MOUSE_INFLUENCE_STRENGTH = 0.3;

interface ParticleData {
  radius: number;
  baseRadius: number;
  angle: number;
  angularSpeed: number;
  yAmplitude: number;
  yPhase: number;
  size: number;
  baseSize: number;
  opacity: number;
  baseOpacity: number;
  targetX: number;
  targetY: number;
  targetZ: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(out: THREE.Color, a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
  out.r = lerp(a.r, b.r, t);
  out.g = lerp(a.g, b.g, t);
  out.b = lerp(a.b, b.b, t);
  return out;
}

function createParticleTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export class Nebula {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  private particles: ParticleData[];
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;

  private colorStart = new THREE.Color('#6366f1');
  private colorEnd = new THREE.Color('#ec4899');
  private targetColorStart = new THREE.Color('#6366f1');
  private targetColorEnd = new THREE.Color('#ec4899');
  private colorTransitionProgress = 1;
  private colorTransitionDuration = COLOR_TRANSITION_DURATION;

  private prevColorStart = new THREE.Color('#6366f1');
  private prevColorEnd = new THREE.Color('#ec4899');
  private themeTransitionProgress = 1;

  private density = 0.7;
  private targetDensity = 0.7;
  private speed = 0.4;
  private targetSpeed = 0.4;

  private mousePosition = new THREE.Vector3(0, 0, 0);
  private normalizedMouse = new THREE.Vector2(0, 0);
  private mouseInfluence = 0;
  private targetMouseInfluence = 0;

  private texture: THREE.Texture;
  private disposed = false;

  private tmpColor = new THREE.Color();
  private tmpVec3 = new THREE.Vector3();

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.camera = camera;

    this.texture = createParticleTexture();

    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(PARTICLE_COUNT * 3);
    this.colors = new Float32Array(PARTICLE_COUNT * 3);
    this.sizes = new Float32Array(PARTICLE_COUNT);

    this.particles = new Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 20 + Math.random() * 80;
      const size = 2 + Math.random() * 5;
      const opacity = 0.4 + Math.random() * 0.6;
      this.particles[i] = {
        radius,
        baseRadius: radius,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (0.2 + Math.random() * 0.8) * (Math.random() > 0.5 ? 1 : -1),
        yAmplitude: 5 + Math.random() * 25,
        yPhase: Math.random() * Math.PI * 2,
        size,
        baseSize: size,
        opacity,
        baseOpacity: opacity,
        targetX: 0,
        targetY: 0,
        targetZ: 0,
      };
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 4,
      map: this.texture,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);

    this.updateInitialPositions();
  }

  private updateInitialPositions(): void {
    const time = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = this.particles[i];
      const densityFactor = this.density;
      const r = p.baseRadius * densityFactor;
      const y = Math.sin(time * p.angularSpeed * 0.5 + p.yPhase) * p.yAmplitude;
      const x = Math.cos(p.angle) * r;
      const z = Math.sin(p.angle) * r;

      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;

      const t = i / PARTICLE_COUNT;
      lerpColor(this.tmpColor, this.colorStart, this.colorEnd, t);
      this.colors[i * 3] = this.tmpColor.r;
      this.colors[i * 3 + 1] = this.tmpColor.g;
      this.colors[i * 3 + 2] = this.tmpColor.b;

      this.sizes[i] = p.baseSize;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  updateColor(colorStart: string, colorEnd: string): void {
    this.prevColorStart.copy(this.colorStart);
    this.prevColorEnd.copy(this.colorEnd);
    this.targetColorStart.set(colorStart);
    this.targetColorEnd.set(colorEnd);
    this.colorTransitionProgress = 0;
    this.colorTransitionDuration = COLOR_TRANSITION_DURATION;
  }

  updateDensity(density: number): void {
    this.targetDensity = Math.max(0.1, Math.min(1.5, density));
  }

  updateSpeed(speed: number): void {
    this.targetSpeed = Math.max(0.05, Math.min(2.0, speed));
  }

  applyTheme(theme: ThemePreset): void {
    this.prevColorStart.copy(this.colorStart);
    this.prevColorEnd.copy(this.colorEnd);
    this.targetColorStart.set(theme.colorStart);
    this.targetColorEnd.set(theme.colorEnd);
    this.targetDensity = theme.baseDensity;
    this.targetSpeed = theme.baseSpeed;
    this.colorTransitionProgress = 0;
    this.colorTransitionDuration = THEME_TRANSITION_DURATION;
  }

  setMousePosition(x: number, y: number): void {
    this.normalizedMouse.set(x, y);
  }

  updateMouseInfluence(inside: boolean): void {
    this.targetMouseInfluence = inside ? 1 : 0;
  }

  update(deltaTime: number): void {
    if (this.disposed) return;

    const dt = Math.min(deltaTime, 0.1);

    const lerpFactor = 1 - Math.pow(0.001, dt);

    this.density = lerp(this.density, this.targetDensity, lerpFactor * 2);
    this.speed = lerp(this.speed, this.targetSpeed, lerpFactor * 2);
    this.mouseInfluence = lerp(this.mouseInfluence, this.targetMouseInfluence, lerpFactor * 4);

    if (this.colorTransitionProgress < 1) {
      this.colorTransitionProgress = Math.min(
        1,
        this.colorTransitionProgress + dt / this.colorTransitionDuration
      );
      const t = this.colorTransitionProgress;
      lerpColor(this.colorStart, this.prevColorStart, this.targetColorStart, t);
      lerpColor(this.colorEnd, this.prevColorEnd, this.targetColorEnd, t);
    }

    this.mousePosition.x = this.normalizedMouse.x * 100;
    this.mousePosition.y = this.normalizedMouse.y * 60;
    this.mousePosition.z = 0;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = this.particles[i];

      p.angle += p.angularSpeed * this.speed * dt * 0.3;

      const densityFactor = this.density;
      const r = p.baseRadius * densityFactor;
      const baseY = Math.sin(performance.now() * 0.0005 * p.angularSpeed + p.yPhase) * p.yAmplitude;
      const baseX = Math.cos(p.angle) * r;
      const baseZ = Math.sin(p.angle) * r;

      p.targetX = baseX;
      p.targetY = baseY;
      p.targetZ = baseZ;

      if (this.mouseInfluence > 0.001) {
        this.tmpVec3.set(baseX, baseY, baseZ);
        const dist = this.tmpVec3.distanceTo(this.mousePosition);
        if (dist < MOUSE_INFLUENCE_RADIUS) {
          const falloff = 1 - dist / MOUSE_INFLUENCE_RADIUS;
          const strength = falloff * falloff * MOUSE_INFLUENCE_STRENGTH * this.mouseInfluence;
          const dirX = this.mousePosition.x - baseX;
          const dirY = this.mousePosition.y - baseY;
          const dirZ = this.mousePosition.z - baseZ;
          const len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) + 0.0001;
          p.targetX += (dirX / len) * strength * 30;
          p.targetY += (dirY / len) * strength * 30;
          p.targetZ += (dirZ / len) * strength * 30;
          p.radius = lerp(p.radius, p.baseRadius * (1 - strength * 0.5), lerpFactor);
          p.size = lerp(p.size, p.baseSize * (1 + strength * 0.8), lerpFactor);
          p.opacity = lerp(p.opacity, p.baseOpacity * (1 + strength * 0.5), lerpFactor);
        } else {
          p.radius = lerp(p.radius, p.baseRadius, lerpFactor);
          p.size = lerp(p.size, p.baseSize, lerpFactor);
          p.opacity = lerp(p.opacity, p.baseOpacity, lerpFactor);
        }
      } else {
        p.radius = lerp(p.radius, p.baseRadius, lerpFactor);
        p.size = lerp(p.size, p.baseSize, lerpFactor);
        p.opacity = lerp(p.opacity, p.baseOpacity, lerpFactor);
      }

      const x = lerp(this.positions[i * 3], p.targetX, lerpFactor * 3);
      const y = lerp(this.positions[i * 3 + 1], p.targetY, lerpFactor * 3);
      const z = lerp(this.positions[i * 3 + 2], p.targetZ, lerpFactor * 3);

      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;

      const t = (p.baseRadius - 20) / 80;
      lerpColor(this.tmpColor, this.colorStart, this.colorEnd, Math.max(0, Math.min(1, t)));
      this.colors[i * 3] = this.tmpColor.r;
      this.colors[i * 3 + 1] = this.tmpColor.g;
      this.colors[i * 3 + 2] = this.tmpColor.b;

      this.sizes[i] = p.size;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
  }
}
