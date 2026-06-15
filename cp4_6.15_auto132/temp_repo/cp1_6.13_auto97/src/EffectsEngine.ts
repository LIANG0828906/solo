import * as THREE from 'three';

interface ParticleSystem {
  mesh: THREE.Points;
  velocities: THREE.Vector3[];
  rotations: number[];
  active: boolean;
  targetOpacity: number;
  opacity: number;
  type: string;
  phase: number;
}

export class EffectsEngine {
  private scene: THREE.Scene;
  private particleSystems: Map<string, ParticleSystem> = new Map();
  private currentWeather: string = 'sunny';
  private currentSeason: string = 'summer';

  private rainCount: number = 300;
  private snowCount: number = 200;
  private leafCount: number = 150;
  private petalCount: number = 150;
  private sunRayCount: number = 100;

  private fadeSpeed: number = 0.3;
  private transitionState: {
    fadingOut: string[];
    fadingIn: string[];
  } = { fadingOut: [], fadingIn: [] };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public updateWeather(weather: string, season: string) {
    if (weather === this.currentWeather && season === this.currentSeason) return;

    const oldWeatherKey = this.currentWeather;
    const oldSeasonKey = this.currentSeason;

    const oldWeatherSystemKey = this.getWeatherParticleKey(oldWeatherKey);
    const oldSeasonSystemKey = this.getSeasonParticleKey(oldSeasonKey);

    if (oldWeatherKey !== weather) {
      this.fadeOutSystem(oldWeatherSystemKey);
    }
    if (oldSeasonKey !== season) {
      this.fadeOutSystem(oldSeasonSystemKey);
    }

    this.currentWeather = weather;
    this.currentSeason = season;

    this.createWeatherSystem(weather);
    this.createSeasonParticles(season, weather);
  }

  private getWeatherParticleKey(weather: string): string {
    return `weather_${weather}`;
  }

  private getSeasonParticleKey(season: string): string {
    return `season_${season}`;
  }

  private fadeOutSystem(key: string) {
    const system = this.particleSystems.get(key);
    if (system) {
      system.active = false;
      system.targetOpacity = 0;
    }
  }

  private createWeatherSystem(weather: string) {
    const key = this.getWeatherParticleKey(weather);

    if (weather === 'sunny') {
      this.createSunRaySystem(key);
    } else if (weather === 'rainy') {
      this.createRainSystem(key);
    } else if (weather === 'cloudy') {
    } else if (weather === 'foggy') {
    }
  }

  private createSeasonParticles(season: string, weather: string) {
    const key = this.getSeasonParticleKey(season);

    if (weather === 'rainy' || weather === 'foggy') return;

    if (season === 'spring') {
      this.createPetalSystem(key);
    } else if (season === 'summer') {
      this.createLeafSystem(key, 0x55aa55);
    } else if (season === 'autumn') {
      this.createLeafSystem(key, 0xff8833);
    } else if (season === 'winter') {
      this.createSnowSystem(key);
    }
  }

  private createSunRaySystem(key: string) {
    if (this.particleSystems.has(key)) {
      const system = this.particleSystems.get(key)!;
      system.active = true;
      system.targetOpacity = 0.7;
      return;
    }

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.sunRayCount * 3);
    const velocities: THREE.Vector3[] = [];
    const rotations: number[] = [];

    for (let i = 0; i < this.sunRayCount; i++) {
      const startX = 50 + Math.random() * 40;
      const startY = 80 + Math.random() * 30;
      const startZ = -30 + Math.random() * 60;

      positions[i * 3] = startX;
      positions[i * 3 + 1] = startY;
      positions[i * 3 + 2] = startZ;

      const angle = Math.PI + Math.PI / 4;
      const speed = 2 + Math.random() * 2;
      velocities.push(new THREE.Vector3(
        -Math.cos(angle) * speed,
        -Math.sin(angle) * speed,
        (Math.random() - 0.5) * 0.5
      ));

      rotations.push(Math.random() * Math.PI * 2);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffdd88,
      size: 1.5,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const mesh = new THREE.Points(geometry, material);
    this.scene.add(mesh);

    this.particleSystems.set(key, {
      mesh,
      velocities,
      rotations,
      active: true,
      targetOpacity: 0.7,
      opacity: 0,
      type: 'sunray',
      phase: Math.random() * Math.PI * 2
    });
  }

  private createRainSystem(key: string) {
    if (this.particleSystems.has(key)) {
      const system = this.particleSystems.get(key)!;
      system.active = true;
      system.targetOpacity = 1;
      return;
    }

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 3);
    const velocities: THREE.Vector3[] = [];
    const rotations: number[] = [];

    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 150;
      positions[i * 3 + 1] = Math.random() * 100 + 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 150;

      velocities.push(new THREE.Vector3(0, -5, 0));
      rotations.push(0);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x6699cc,
      size: 0.3,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true
    });

    const mesh = new THREE.Points(geometry, material);
    this.scene.add(mesh);

    this.particleSystems.set(key, {
      mesh,
      velocities,
      rotations,
      active: true,
      targetOpacity: 1,
      opacity: 0,
      type: 'rain',
      phase: 0
    });
  }

  private createSnowSystem(key: string) {
    if (this.particleSystems.has(key)) {
      const system = this.particleSystems.get(key)!;
      system.active = true;
      system.targetOpacity = 1;
      return;
    }

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.snowCount * 3);
    const velocities: THREE.Vector3[] = [];
    const rotations: number[] = [];

    for (let i = 0; i < this.snowCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 150;
      positions[i * 3 + 1] = Math.random() * 100 + 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 150;

      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        -2 - Math.random() * 1,
        (Math.random() - 0.5) * 0.5
      ));

      rotations.push(Math.random() * Math.PI * 2);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.8,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true
    });

    const mesh = new THREE.Points(geometry, material);
    this.scene.add(mesh);

    this.particleSystems.set(key, {
      mesh,
      velocities,
      rotations,
      active: true,
      targetOpacity: 1,
      opacity: 0,
      type: 'snow',
      phase: Math.random() * Math.PI * 2
    });
  }

  private createLeafSystem(key: string, color: number) {
    if (this.particleSystems.has(key)) {
      const system = this.particleSystems.get(key)!;
      system.active = true;
      system.targetOpacity = 0.9;
      (system.mesh.material as THREE.PointsMaterial).color.setHex(color);
      return;
    }

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.leafCount * 3);
    const velocities: THREE.Vector3[] = [];
    const rotations: number[] = [];

    for (let i = 0; i < this.leafCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = Math.random() * 60 + 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;

      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 1,
        -1 - Math.random() * 0.5,
        (Math.random() - 0.5) * 1
      ));

      rotations.push(Math.random() * Math.PI * 2);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: color,
      size: 0.6,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true
    });

    const mesh = new THREE.Points(geometry, material);
    this.scene.add(mesh);

    this.particleSystems.set(key, {
      mesh,
      velocities,
      rotations,
      active: true,
      targetOpacity: 0.9,
      opacity: 0,
      type: 'leaf',
      phase: Math.random() * Math.PI * 2
    });
  }

  private createPetalSystem(key: string) {
    if (this.particleSystems.has(key)) {
      const system = this.particleSystems.get(key)!;
      system.active = true;
      system.targetOpacity = 0.9;
      return;
    }

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.petalCount * 3);
    const velocities: THREE.Vector3[] = [];
    const rotations: number[] = [];

    for (let i = 0; i < this.petalCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = Math.random() * 50 + 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;

      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.8,
        -0.8 - Math.random() * 0.3,
        (Math.random() - 0.5) * 0.8
      ));

      rotations.push(Math.random() * Math.PI * 2);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffb6c1,
      size: 0.5,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true
    });

    const mesh = new THREE.Points(geometry, material);
    this.scene.add(mesh);

    this.particleSystems.set(key, {
      mesh,
      velocities,
      rotations,
      active: true,
      targetOpacity: 0.9,
      opacity: 0,
      type: 'petal',
      phase: Math.random() * Math.PI * 2
    });
  }

  public update(delta: number) {
    this.particleSystems.forEach((system, key) => {
      const material = system.mesh.material as THREE.PointsMaterial;

      if (system.active) {
        system.opacity = Math.min(
          system.targetOpacity,
          system.opacity + delta / this.fadeSpeed
        );
      } else {
        system.opacity = Math.max(0, system.opacity - delta / this.fadeSpeed);
      }

      material.opacity = system.opacity;

      if (system.opacity > 0) {
        this.updateParticlePositions(system, delta);
      }

      if (system.opacity <= 0 && !system.active) {
        this.scene.remove(system.mesh);
        system.mesh.geometry.dispose();
        (system.mesh.material as THREE.Material).dispose();
        this.particleSystems.delete(key);
      }
    });
  }

  private updateParticlePositions(system: ParticleSystem, delta: number) {
    const positions = system.mesh.geometry.attributes.position.array as Float32Array;
    const time = Date.now() * 0.001;

    for (let i = 0; i < system.velocities.length; i++) {
      const velocity = system.velocities[i];

      if (system.type === 'sunray') {
        positions[i * 3] += velocity.x * delta;
        positions[i * 3 + 1] += velocity.y * delta;
        positions[i * 3 + 2] += velocity.z * delta;

        system.rotations[i] += delta * 0.5;

        if (positions[i * 3 + 1] < 0 || positions[i * 3] < -80) {
          positions[i * 3] = 50 + Math.random() * 40;
          positions[i * 3 + 1] = 80 + Math.random() * 30;
          positions[i * 3 + 2] = -30 + Math.random() * 60;
        }
      } else if (system.type === 'rain') {
        positions[i * 3] += velocity.x * delta;
        positions[i * 3 + 1] += velocity.y * delta;
        positions[i * 3 + 2] += velocity.z * delta;

        if (positions[i * 3 + 1] < 0) {
          positions[i * 3] = (Math.random() - 0.5) * 150;
          positions[i * 3 + 1] = 100;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 150;
        }
      } else if (system.type === 'snow') {
        const spiralAngle = time + system.phase + i * 0.1;
        const spiralRadius = 0.5;

        positions[i * 3] += velocity.x * delta + Math.sin(spiralAngle) * delta * 0.5;
        positions[i * 3 + 1] += velocity.y * delta;
        positions[i * 3 + 2] += velocity.z * delta + Math.cos(spiralAngle) * delta * 0.5;

        if (positions[i * 3 + 1] < 0) {
          positions[i * 3] = (Math.random() - 0.5) * 150;
          positions[i * 3 + 1] = 100;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 150;
        }
      } else if (system.type === 'leaf' || system.type === 'petal') {
        const swayAngle = time * 2 + i * 0.5;

        positions[i * 3] += velocity.x * delta + Math.sin(swayAngle) * delta * 0.3;
        positions[i * 3 + 1] += velocity.y * delta;
        positions[i * 3 + 2] += velocity.z * delta + Math.cos(swayAngle) * delta * 0.3;

        if (positions[i * 3 + 1] < 0) {
          positions[i * 3] = (Math.random() - 0.5) * 120;
          positions[i * 3 + 1] = 80;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
        }
      }

      if (positions[i * 3] > 80) positions[i * 3] = -80;
      if (positions[i * 3] < -80) positions[i * 3] = 80;
      if (positions[i * 3 + 2] > 80) positions[i * 3 + 2] = -80;
      if (positions[i * 3 + 2] < -80) positions[i * 3 + 2] = 80;
    }

    system.mesh.geometry.attributes.position.needsUpdate = true;
  }

  public dispose() {
    this.particleSystems.forEach((system) => {
      this.scene.remove(system.mesh);
      system.mesh.geometry.dispose();
      if (Array.isArray(system.mesh.material)) {
        system.mesh.material.forEach(m => m.dispose());
      } else {
        system.mesh.material.dispose();
      }
    });
    this.particleSystems.clear();
  }
}
