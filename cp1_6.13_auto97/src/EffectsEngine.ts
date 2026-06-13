import * as THREE from 'three';

interface ParticleSystem {
  mesh: THREE.Points;
  velocities: THREE.Vector3[];
  active: boolean;
  opacity: number;
  type: string;
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
  
  private transitionSpeed: number = 0.3;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }
  
  public updateWeather(weather: string, season: string) {
    if (weather === this.currentWeather && season === this.currentSeason) return;
    
    const oldWeather = this.currentWeather;
    const oldSeason = this.currentSeason;
    
    this.currentWeather = weather;
    this.currentSeason = season;
    
    this.fadeOutSystem(oldWeather);
    this.fadeOutSystem(this.getSeasonParticleKey(oldSeason));
    
    this.createWeatherSystem(weather);
    this.createSeasonParticles(season, weather);
  }
  
  private getSeasonParticleKey(season: string): string {
    return `season_${season}`;
  }
  
  private fadeOutSystem(key: string) {
    const system = this.particleSystems.get(key);
    if (system) {
      system.active = false;
    }
  }
  
  private createWeatherSystem(weather: string) {
    if (weather === 'rainy') {
      this.createRainSystem();
    }
  }
  
  private createSeasonParticles(season: string, weather: string) {
    if (weather === 'rainy' || weather === 'foggy') return;
    
    if (season === 'spring') {
      this.createPetalSystem();
    } else if (season === 'summer') {
      this.createLeafSystem(0x55aa55);
    } else if (season === 'autumn') {
      this.createLeafSystem(0xff8833);
    } else if (season === 'winter') {
      this.createSnowSystem();
    }
  }
  
  private createRainSystem() {
    const key = 'rainy';
    if (this.particleSystems.has(key)) {
      const system = this.particleSystems.get(key)!;
      system.active = true;
      return;
    }
    
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 3);
    const velocities: THREE.Vector3[] = [];
    
    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 150;
      positions[i * 3 + 1] = Math.random() * 100 + 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 150;
      
      velocities.push(new THREE.Vector3(0, -5, 0));
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
      active: true,
      opacity: 0,
      type: 'rain'
    });
  }
  
  private createSnowSystem() {
    const key = this.getSeasonParticleKey('winter');
    if (this.particleSystems.has(key)) {
      const system = this.particleSystems.get(key)!;
      system.active = true;
      return;
    }
    
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.snowCount * 3);
    const velocities: THREE.Vector3[] = [];
    
    for (let i = 0; i < this.snowCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 150;
      positions[i * 3 + 1] = Math.random() * 100 + 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 150;
      
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        -2 - Math.random() * 1,
        (Math.random() - 0.5) * 0.5
      ));
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
      active: true,
      opacity: 0,
      type: 'snow'
    });
  }
  
  private createLeafSystem(color: number) {
    const key = this.getSeasonParticleKey(this.currentSeason);
    if (this.particleSystems.has(key)) {
      const system = this.particleSystems.get(key)!;
      system.active = true;
      (system.mesh.material as THREE.PointsMaterial).color.setHex(color);
      return;
    }
    
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.leafCount * 3);
    const velocities: THREE.Vector3[] = [];
    
    for (let i = 0; i < this.leafCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = Math.random() * 60 + 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
      
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 1,
        -1 - Math.random() * 0.5,
        (Math.random() - 0.5) * 1
      ));
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
      active: true,
      opacity: 0,
      type: 'leaf'
    });
  }
  
  private createPetalSystem() {
    const key = this.getSeasonParticleKey('spring');
    if (this.particleSystems.has(key)) {
      const system = this.particleSystems.get(key)!;
      system.active = true;
      return;
    }
    
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.petalCount * 3);
    const velocities: THREE.Vector3[] = [];
    
    for (let i = 0; i < this.petalCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = Math.random() * 50 + 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
      
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.8,
        -0.8 - Math.random() * 0.3,
        (Math.random() - 0.5) * 0.8
      ));
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
      active: true,
      opacity: 0,
      type: 'petal'
    });
  }
  
  public update(delta: number) {
    this.particleSystems.forEach((system, key) => {
      const material = system.mesh.material as THREE.PointsMaterial;
      
      if (system.active) {
        system.opacity = Math.min(1, system.opacity + delta / this.transitionSpeed);
      } else {
        system.opacity = Math.max(0, system.opacity - delta / this.transitionSpeed);
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
    
    for (let i = 0; i < system.velocities.length; i++) {
      const velocity = system.velocities[i];
      
      positions[i * 3] += velocity.x * delta;
      positions[i * 3 + 1] += velocity.y * delta;
      positions[i * 3 + 2] += velocity.z * delta;
      
      if (system.type === 'snow' || system.type === 'petal') {
        positions[i * 3] += Math.sin(Date.now() * 0.001 + i) * 0.02;
        positions[i * 3 + 2] += Math.cos(Date.now() * 0.001 + i) * 0.02;
      }
      
      if (positions[i * 3 + 1] < 0) {
        positions[i * 3] = (Math.random() - 0.5) * 150;
        positions[i * 3 + 1] = 100;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 150;
      }
      
      if (positions[i * 3] > 75) positions[i * 3] = -75;
      if (positions[i * 3] < -75) positions[i * 3] = 75;
      if (positions[i * 3 + 2] > 75) positions[i * 3 + 2] = -75;
      if (positions[i * 3 + 2] < -75) positions[i * 3 + 2] = 75;
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
