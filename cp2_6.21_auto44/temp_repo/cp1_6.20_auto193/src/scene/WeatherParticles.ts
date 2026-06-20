import * as THREE from 'three';

const MAX_PARTICLES = 500;

interface ParticleSystem {
  start(): void;
  stop(): void;
  update(delta: number): void;
  dispose(): void;
}

abstract class BaseParticleSystem implements ParticleSystem {
  protected scene: THREE.Scene;
  protected particles: THREE.Points | null = null;
  protected geometry: THREE.BufferGeometry | null = null;
  protected material: THREE.PointsMaterial | null = null;
  protected active = false;
  protected count: Float32Array | null = null;
  protected particleCount = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  abstract start(): void;
  abstract update(delta: number): void;

  stop(): void {
    this.active = false;
    if (this.particles) {
      this.particles.visible = false;
    }
  }

  dispose(): void {
    this.stop();
    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }
    if (this.particles) {
      this.scene.remove(this.particles);
    }
    this.geometry = null;
    this.material = null;
    this.particles = null;
  }
}

export class RainParticles extends BaseParticleSystem {
  private velocities: Float32Array | null = null;

  constructor(scene: THREE.Scene) {
    super(scene);
    this.particleCount = MAX_PARTICLES;

    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      this.velocities[i] = 0.3 + Math.random() * 0.3;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.material = new THREE.PointsMaterial({
      color: 0xa8cae8,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.particles.visible = false;
    this.scene.add(this.particles);
  }

  start(): void {
    if (!this.particles) return;
    this.active = true;
    this.particles.visible = true;
  }

  update(delta: number): void {
    if (!this.active || !this.geometry || !this.velocities) return;

    const positions = this.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3 + 1] -= this.velocities[i] * delta * 60;
      if (positions[i * 3 + 1] < -2) {
        positions[i * 3 + 1] = 20;
        positions[i * 3] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      }
    }
    this.geometry.attributes.position.needsUpdate = true;
  }
}

export class SnowParticles extends BaseParticleSystem {
  private velocities: Float32Array | null = null;
  private phases: Float32Array | null = null;

  constructor(scene: THREE.Scene) {
    super(scene);
    this.particleCount = MAX_PARTICLES;

    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount);
    this.phases = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      this.velocities[i] = 0.08 + Math.random() * 0.08;
      this.phases[i] = Math.random() * Math.PI * 2;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.particles.visible = false;
    this.scene.add(this.particles);
  }

  start(): void {
    if (!this.particles) return;
    this.active = true;
    this.particles.visible = true;
  }

  update(delta: number): void {
    if (!this.active || !this.geometry || !this.velocities || !this.phases) return;

    const positions = this.geometry.attributes.position.array as Float32Array;
    const time = Date.now() * 0.001;

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3 + 1] -= this.velocities[i] * delta * 60;
      positions[i * 3] += Math.sin(time + this.phases[i]) * 0.02;
      if (positions[i * 3 + 1] < -2) {
        positions[i * 3 + 1] = 20;
        positions[i * 3] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      }
    }
    this.geometry.attributes.position.needsUpdate = true;
  }
}

export class SandstormParticles extends BaseParticleSystem {
  private velocities: Float32Array | null = null;

  constructor(scene: THREE.Scene) {
    super(scene);
    this.particleCount = MAX_PARTICLES;

    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = Math.random() * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      this.velocities[i * 3] = 0.2 + Math.random() * 0.3;
      this.velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.material = new THREE.PointsMaterial({
      color: 0xd4a574,
      size: 0.25,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.particles.visible = false;
    this.scene.add(this.particles);
  }

  start(): void {
    if (!this.particles) return;
    this.active = true;
    this.particles.visible = true;
  }

  update(delta: number): void {
    if (!this.active || !this.geometry || !this.velocities) return;

    const positions = this.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3] += this.velocities[i * 3] * delta * 60;
      positions[i * 3 + 1] += this.velocities[i * 3 + 1] * delta * 60;
      positions[i * 3 + 2] += this.velocities[i * 3 + 2] * delta * 60;

      if (positions[i * 3] > 20) {
        positions[i * 3] = -20;
        positions[i * 3 + 1] = Math.random() * 15;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      }
    }
    this.geometry.attributes.position.needsUpdate = true;
  }
}

export type WeatherType = 'sunny' | 'rain' | 'snow' | 'sandstorm';

export class WeatherManager {
  private scene: THREE.Scene;
  private rain: RainParticles | null = null;
  private snow: SnowParticles | null = null;
  private sandstorm: SandstormParticles | null = null;
  private currentWeather: WeatherType = 'sunny';
  private ambientLight: THREE.AmbientLight;
  private fog: THREE.Fog;

  constructor(scene: THREE.Scene, ambientLight: THREE.AmbientLight, fog: THREE.Fog) {
    this.scene = scene;
    this.ambientLight = ambientLight;
    this.fog = fog;
  }

  setWeather(type: WeatherType): void {
    if (this.currentWeather === type) return;

    this.currentWeather = type;

    if (!this.rain) this.rain = new RainParticles(this.scene);
    if (!this.snow) this.snow = new SnowParticles(this.scene);
    if (!this.sandstorm) this.sandstorm = new SandstormParticles(this.scene);

    this.rain.stop();
    this.snow.stop();
    this.sandstorm.stop();

    switch (type) {
      case 'rain':
        this.rain.start();
        this.ambientLight.intensity = 0.35;
        this.fog.color.setHex(0x556677);
        this.fog.density = 0.03;
        break;
      case 'snow':
        this.snow.start();
        this.ambientLight.intensity = 0.5;
        this.fog.color.setHex(0xdde6ee);
        this.fog.density = 0.025;
        break;
      case 'sandstorm':
        this.sandstorm.start();
        this.ambientLight.intensity = 0.3;
        this.fog.color.setHex(0xc49a6a);
        this.fog.density = 0.04;
        break;
      case 'sunny':
      default:
        this.ambientLight.intensity = 0.6;
        this.fog.density = 0.015;
        break;
    }
  }

  getWeather(): WeatherType {
    return this.currentWeather;
  }

  update(delta: number): void {
    if (this.rain) this.rain.update(delta);
    if (this.snow) this.snow.update(delta);
    if (this.sandstorm) this.sandstorm.update(delta);
  }

  dispose(): void {
    if (this.rain) this.rain.dispose();
    if (this.snow) this.snow.dispose();
    if (this.sandstorm) this.sandstorm.dispose();
  }

  setFogColor(hex: number): void {
    this.fog.color.setHex(hex);
  }
}
