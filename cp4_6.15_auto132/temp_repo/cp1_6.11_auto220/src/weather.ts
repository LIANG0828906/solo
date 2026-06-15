import * as THREE from 'three';

export type WeatherType = 'sunny' | 'fog' | 'storm';

interface RainPool {
  positions: Float32Array;
  velocities: Float32Array;
}

export class WeatherManager {
  currentWeather: WeatherType = 'sunny';
  directionalLight: THREE.DirectionalLight;
  ambientLight: THREE.AmbientLight;
  rainParticles: THREE.Points | null = null;
  rainPool: RainPool | null = null;
  lightningTimer: number = 0;
  isLightning: boolean = false;

  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private lightningDuration: number = 0;
  private readonly MAX_RAIN_PARTICLES = 500;
  private readonly RAIN_AREA = 100;
  private readonly RAIN_HEIGHT = 80;
  private readonly RAIN_FALL_SPEED = 40;
  private readonly RAIN_TILT_SPEED = 3.5;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);

    this.scene.add(this.directionalLight);
    this.scene.add(this.ambientLight);

    this.applySunnyShadows();
  }

  setWeather(type: WeatherType): void {
    if (this.currentWeather === type) return;

    this.currentWeather = type;
    this.cleanup();

    switch (type) {
      case 'sunny':
        this.applySunnyShadows();
        this.scene.fog = null;
        break;
      case 'fog':
        this.applyFogEffect();
        break;
      case 'storm':
        this.applyStormEffect();
        this.lightningTimer = Math.random() * 5 + 5;
        this.isLightning = false;
        break;
    }
  }

  update(delta: number): void {
    switch (this.currentWeather) {
      case 'sunny':
        break;
      case 'fog':
        if (!this.scene.fog) {
          this.scene.fog = new THREE.FogExp2(0xcccccc, 0.015);
        }
        break;
      case 'storm':
        this.updateRain(delta);
        this.updateLightning(delta);
        break;
    }
  }

  private updateRain(delta: number): void {
    if (!this.rainParticles || !this.rainPool) return;

    const positions = this.rainPool.positions;
    const velocities = this.rainPool.velocities;
    const geometry = this.rainParticles.geometry;
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;

    for (let i = 0; i < this.MAX_RAIN_PARTICLES; i++) {
      const idx = i * 3;
      positions[idx + 1] -= velocities[i] * delta;
      positions[idx] += this.RAIN_TILT_SPEED * delta;

      if (positions[idx + 1] < -10) {
        positions[idx] = (Math.random() - 0.5) * this.RAIN_AREA;
        positions[idx + 1] = this.RAIN_HEIGHT + Math.random() * 20;
        positions[idx + 2] = (Math.random() - 0.5) * this.RAIN_AREA;
      }

      if (positions[idx] > this.RAIN_AREA / 2) {
        positions[idx] = -this.RAIN_AREA / 2;
      }
    }

    posAttr.needsUpdate = true;
  }

  private updateLightning(delta: number): void {
    if (this.isLightning) {
      this.lightningDuration -= delta;
      if (this.lightningDuration <= 0) {
        this.isLightning = false;
        this.directionalLight.intensity = 0.4;
      }
    } else {
      this.lightningTimer -= delta;
      if (this.lightningTimer <= 0) {
        this.isLightning = true;
        this.lightningDuration = 0.15;
        this.directionalLight.intensity = 2.5;
        this.lightningTimer = Math.random() * 5 + 5;
      }
    }
  }

  getLightningFlash(): boolean {
    return this.isLightning;
  }

  applySunnyShadows(): void {
    this.directionalLight.color.setHex(0xffffff);
    this.directionalLight.intensity = 1.0;
    this.directionalLight.position.set(-50, 80, -50);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 200;
    this.directionalLight.shadow.camera.left = -80;
    this.directionalLight.shadow.camera.right = 80;
    this.directionalLight.shadow.camera.top = 80;
    this.directionalLight.shadow.camera.bottom = -80;

    this.ambientLight.color.setHex(0xffffff);
    this.ambientLight.intensity = 0.6;
  }

  applyFogEffect(): void {
    this.ambientLight.color.setHex(0xaaaaaa);
    this.ambientLight.intensity = 0.4;

    this.directionalLight.color.setHex(0xcccccc);
    this.directionalLight.intensity = 0.5;
    this.directionalLight.castShadow = false;

    this.scene.fog = new THREE.FogExp2(0xcccccc, 0.015 * 1.5);
  }

  applyStormEffect(): void {
    this.ambientLight.color.setHex(0x444466);
    this.ambientLight.intensity = 0.3;

    this.directionalLight.color.setHex(0x6666aa);
    this.directionalLight.intensity = 0.4;
    this.directionalLight.castShadow = false;

    this.scene.fog = new THREE.FogExp2(0x333344, 0.01);

    this.createRainParticles();
  }

  private createRainParticles(): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.MAX_RAIN_PARTICLES * 3);
    const velocities = new Float32Array(this.MAX_RAIN_PARTICLES);

    for (let i = 0; i < this.MAX_RAIN_PARTICLES; i++) {
      const idx = i * 3;
      positions[idx] = (Math.random() - 0.5) * this.RAIN_AREA;
      positions[idx + 1] = Math.random() * this.RAIN_HEIGHT;
      positions[idx + 2] = (Math.random() - 0.5) * this.RAIN_AREA;
      velocities[i] = this.RAIN_FALL_SPEED + Math.random() * 20;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.3,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    this.rainParticles = new THREE.Points(geometry, material);
    this.rainPool = { positions, velocities };

    this.scene.add(this.rainParticles);
  }

  cleanup(): void {
    if (this.rainParticles) {
      this.scene.remove(this.rainParticles);
      this.rainParticles.geometry.dispose();
      (this.rainParticles.material as THREE.Material).dispose();
      this.rainParticles = null;
    }
    this.rainPool = null;
    this.isLightning = false;
    this.lightningTimer = 0;
  }
}
