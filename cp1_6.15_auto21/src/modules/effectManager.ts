import * as THREE from 'three';
import { SceneManager } from './sceneManager';
import { BuildingManager } from './buildingManager';
import {
  IBuilding,
  FLOOR_HEIGHT,
  BREATHING_SPEED,
  BREATHING_INTENSITY,
  WINDOW_BRIGHTNESS_CHANGE_SPEED
} from '../models/buildingConfig';

type ParticleType = 'construction' | 'floor_spark' | 'weld_spark';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  type: ParticleType;
  startColor: THREE.Color;
  endColor: THREE.Color;
  flickerSpeed: number;
  flickerPhase: number;
  gravity: number;
}

export class EffectManager {
  sceneManager: SceneManager;
  buildingManager: BuildingManager;
  private particles: Particle[] = [];
  private constructionLights: THREE.PointLight[] = [];
  private isNightMode: boolean = false;
  private beaconPhase: number = 0;
  private breathingTime: number = 0;
  private maxParticles: number = 300;
  private globalTime: number = 0;
  private lastWeldSparkTime: Map<string, number> = new Map();

  constructor(
    sceneManager: SceneManager,
    buildingManager: BuildingManager
  ) {
    this.sceneManager = sceneManager;
    this.buildingManager = buildingManager;
    
    for (let i = 0; i < 20; i++) {
      const light = new THREE.PointLight(0xffaa00, 0, 8);
      light.castShadow = false;
      this.sceneManager.getScene().add(light);
      this.constructionLights.push(light);
    }
  }

  update(deltaTime: number): void {
    this.globalTime += deltaTime;
    this.breathingTime += BREATHING_SPEED * deltaTime * 60;
    const breathingIntensity = Math.sin(this.breathingTime) * 0.5 + 0.5;
    const breathingMultiplier = 1 + (breathingIntensity - 0.5) * BREATHING_INTENSITY * 2;
    
    if (this.isNightMode) {
      this.sceneManager.updateBreathingEffect(breathingIntensity);
    }

    this.beaconPhase += deltaTime * 0.003;
    
    this.updateParticles(deltaTime);
    this.updateConstructionLights(deltaTime);
    this.updateWindowLights(deltaTime, breathingMultiplier);
    this.updateBeaconLights(this.beaconPhase);
    this.updateWeldSparks(deltaTime);
  }

  triggerFloorGrowthSparks(position: THREE.Vector3, floorHeight: number): void {
    const sparkCount = 18;
    
    for (let i = 0; i < sparkCount; i++) {
      if (this.particles.length >= this.maxParticles) {
        const old = this.particles.shift();
        if (old) {
          this.sceneManager.getScene().remove(old.mesh);
          old.mesh.geometry.dispose();
          (old.mesh.material as THREE.Material).dispose();
        }
      }

      const particle = this.createFloorSpark(position, floorHeight);
      this.particles.push(particle);
      this.sceneManager.getScene().add(particle.mesh);
    }

    for (let i = 0; i < 6; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const burst = this.createBurstParticle(position, floorHeight);
      this.particles.push(burst);
      this.sceneManager.getScene().add(burst.mesh);
    }
  }

  private createFloorSpark(position: THREE.Vector3, floorHeight: number): Particle {
    const colors = [0xffffff, 0xffff88, 0xffaa00, 0xff6600];
    const startColor = new THREE.Color(colors[Math.floor(Math.random() * colors.length]);
    const endColor = new THREE.Color(0xff3300);
    
    const size = 0.06 + Math.random() * 0.08;
    const geometry = new THREE.TetrahedronGeometry(size, 0);
    const material = new THREE.MeshBasicMaterial({
      color: startColor,
      transparent: true,
      opacity: 1
    });
    const mesh = new THREE.Mesh(geometry, material);

    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.8;
    const height = Math.random() * 0.3;
    
    mesh.position.set(
      position.x + Math.cos(angle) * radius,
      position.y + height,
      position.z + Math.sin(angle) * radius
    );

    const speed = 0.08 + Math.random() * 0.12;
    const vy = 0.15 + Math.random() * 0.2;
    const velocity = new THREE.Vector3(
      Math.cos(angle) * speed * 0.5,
      vy,
      Math.sin(angle) * speed * 0.5
    );

    return {
      mesh,
      velocity,
      life: 1,
      maxLife: 0.6 + Math.random() * 0.8,
      type: 'floor_spark',
      startColor,
      endColor,
      flickerSpeed: 20 + Math.random() * 30,
      flickerPhase: Math.random() * Math.PI * 2,
      gravity: 0.008
    };
  }

  private createBurstParticle(position: THREE.Vector3, floorHeight: number): Particle {
    const geometry = new THREE.SphereGeometry(0.15 + Math.random() * 0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.set(
      position.x + (Math.random() - 0.5) * 0.5,
      position.y + floorHeight * 0.5,
      position.z + (Math.random() - 0.5) * 0.5
    );

    return {
      mesh,
      velocity: new THREE.Vector3(0, 0.02, 0),
      life: 1,
      maxLife: 0.3,
      type: 'floor_spark',
      startColor: new THREE.Color(0xffff00),
      endColor: new THREE.Color(0xff6600),
      flickerSpeed: 5,
      flickerPhase: 0,
      gravity: 0
    };
  }

  spawnConstructionParticles(position: THREE.Vector3): void {
    for (let i = 0; i < 5; i++) {
      if (this.particles.length >= this.maxParticles) {
        const old = this.particles.shift();
        if (old) {
          this.sceneManager.getScene().remove(old.mesh);
          old.mesh.geometry.dispose();
          (old.mesh.material as THREE.Material).dispose();
        }
      }

      const colors = [0xffaa00, 0xffff00, 0xff6600];
      const startColor = new THREE.Color(colors[Math.floor(Math.random() * colors.length));
      const endColor = new THREE.Color(0x331100);
      
      const geometry = new THREE.SphereGeometry(0.08 + Math.random() * 0.08, 6, 6;
      const material = new THREE.MeshBasicMaterial({
        color: startColor,
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(geometry, material);

      const angle = Math.random() * Math.PI * 2;
      
      mesh.position.set(
        position.x + (Math.random() - 0.5) * 1.2,
        position.y,
        position.z + (Math.random() - 0.5) * 1.2
      );

      const particle: Particle = {
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          0.03 + Math.random() * 0.05,
          (Math.random() - 0.5) * 0.02
        ),
        life: 1,
        maxLife: 1.5 + Math.random(),
        type: 'construction',
        startColor,
        endColor,
        flickerSpeed: 8 + Math.random() * 4,
        flickerPhase: Math.random() * Math.PI * 2,
        gravity: 0.001
      };

      this.particles.push(particle);
      this.sceneManager.getScene().add(particle.mesh);
    }
  }

  private updateParticles(deltaTime: number): void {
    const tempColor = new THREE.Color();
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      p.life -= deltaTime / p.maxLife;
      
      p.velocity.y -= p.gravity * deltaTime * 60;
      p.mesh.position.add(p.velocity.clone().multiplyScalar(deltaTime * 60));
      
      const progress = 1 - p.life;
      
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      
      tempColor.copy(p.startColor).lerp(p.endColor, progress);
      mat.color.copy(tempColor);
      
      let opacity = Math.max(0, p.life);
      
      if (p.type === 'floor_spark' || p.type === 'weld_spark') {
        const flicker = Math.sin(this.globalTime * p.flickerSpeed + p.flickerPhase);
        opacity *= 0.5 + flicker * 0.5;
      }
      mat.opacity = opacity;
      
      if (p.type !== 'construction') {
        const scale = 0.5 + p.life * 0.5;
        p.mesh.scale.setScalar(scale);
      }
      
      p.mesh.rotation.x += deltaTime * 5;
      p.mesh.rotation.y += deltaTime * 3;
      
      if (p.life <= 0) {
        this.sceneManager.getScene().remove(p.mesh);
        p.mesh.geometry.dispose();
        mat.dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  private updateConstructionLights(deltaTime: number): void {
    const growingBuildings = this.buildingManager.getBuildings().filter(b => b.isGrowing);
    
    let lightIndex = 0;
    
    for (const building of growingBuildings) {
      if (lightIndex + 1 >= this.constructionLights.length) break;
      
      const light1 = this.constructionLights[lightIndex++];
      const light2 = this.constructionLights[lightIndex++];
      
      const currentY = building.currentHeight + 0.5;
      
      light1.position.set(
        building.position.x + 0.8,
        currentY,
        building.position.z
      );
      light1.intensity = (1 + Math.sin(this.globalTime * 10 + building.id.charCodeAt(0)) * 0.5);
      light1.color.setHex(Math.random() < 0.7 ? 0xffaa00 : 0xffffff;
      
      light2.position.set(
        building.position.x - 0.8,
        currentY,
        building.position.z
      );
      light2.intensity = (0.8 + Math.sin(this.globalTime * 15 + building.id.charCodeAt(1)) * 0.4);
      light2.color.setHex(Math.random() < 0.7 ? 0xff6600 : 0xffff00;
    }
    
    for (; lightIndex < this.constructionLights.length; lightIndex++) {
      this.constructionLights[lightIndex].intensity = 0;
    }
  }

  updateBeaconLights(time: number): void {
    const buildings = this.buildingManager.getBuildings();
    
    for (const building of buildings) {
      if (!building.isComplete || !building.beaconLight || !building.beaconMesh) continue;
      
      const beaconY = building.targetHeight + 1;
      
      if (this.isNightMode) {
        const flashSpeed = 5;
        const isRedPhase = Math.sin(time * flashSpeed) > 0;
        
        if (isRedPhase) {
          building.beaconLight.color.setHex(0xff3366);
          (building.beaconMesh.material as THREE.MeshBasicMaterial).color.setHex(0xff3366);
        } else {
          building.beaconLight.color.setHex(0x3366ff);
          (building.beaconMesh.material as THREE.MeshBasicMaterial).color.setHex(0x3366ff);
        }
        
        building.beaconLight.intensity = (3 + Math.sin(time * 10) * 2);
      } else {
        building.beaconLight.color.setHex(0xffff00);
        (building.beaconMesh.material as THREE.MeshBasicMaterial).color.setHex(0xffff00);
        building.beaconLight.intensity = 1.5 + Math.sin(time * 2) * 0.5;
      }
      
      const rotationSpeed = 0.02;
      const radius = 0.3;
      building.beaconMesh.position.x = building.position.x + Math.sin(time * rotationSpeed) * radius;
      building.beaconMesh.position.z = building.position.z + Math.cos(time * rotationSpeed) * radius;
      building.beaconMesh.position.y = beaconY + Math.sin(time * 3) * 0.1;
      
      if (building.beaconLight) {
        building.beaconLight.position.copy(building.beaconMesh.position);
      }
    }
  }

  toggleNightMode(enabled: boolean): void {
    if (this.isNightMode === enabled) return;
    this.isNightMode = enabled;
    
    this.sceneManager.setNightMode(enabled);
    
    const buildings = this.buildingManager.getBuildings();
    
    for (const building of buildings) {
      if (!building.isComplete) continue;
      
      let windowIndex = 0;
      for (const [stateIndex, state] of building.windowStates) {
        if (!building.windowLights[windowIndex]) continue;
        
        if (enabled) {
          const shouldLight = Math.random() > 0.55;
          state.targetBrightness = shouldLight ? 0.6 + Math.random() * 0.4;
          state.color.copy(state.baseColor);
          state.nextToggleTime = this.globalTime + state.toggleInterval;
        } else {
          state.targetBrightness = 0;
        }
        windowIndex++;
      }
    }
  }

  private updateWindowLights(deltaTime: number, breathingMultiplier: number): void {
    const buildings = this.buildingManager.getBuildings();
    
    for (const building of buildings) {
      if (!building.isComplete) continue;
      
      let windowIndex = 0;
      for (const [stateIndex, state] of building.windowStates) {
        const windowLight = building.windowLights[windowIndex];
        if (!windowLight) {
          windowIndex++;
          continue;
        }
        
        if (this.isNightMode) {
          if (this.globalTime >= state.nextToggleTime) {
            const willLight = state.targetBrightness < 0.1;
            state.targetBrightness = willLight ? 0.6 + Math.random() * 0.4 : 0;
            state.toggleInterval = 1 + Math.random() * 4;
            state.nextToggleTime = this.globalTime + state.toggleInterval;
            
            if (willLight) {
              const warmColors = [0xffcc33, 0xffaa33, 0xffee99, 0xffdd66];
              state.baseColor.setHex(warmColors[Math.floor(Math.random() * warmColors.length]);
            }
          }
        }
        
        const brightnessDiff = state.targetBrightness - state.currentBrightness;
        state.currentBrightness += brightnessDiff * Math.min(1, deltaTime * WINDOW_BRIGHTNESS_CHANGE_SPEED);
        
        const mat = windowLight.material as THREE.MeshBasicMaterial;
        const finalBrightness = Math.max(0, Math.min(1, state.currentBrightness * breathingMultiplier));
        mat.opacity = finalBrightness;
        mat.color.copy(state.color).lerp(state.baseColor, this.isNightMode ? 1 : 0);
        windowIndex++;
      }
    }
  }

  private updateWeldSparks(deltaTime: number): void {
    const growingBuildings = this.buildingManager.getBuildings().filter(b => b.isGrowing);
    
    for (const building of growingBuildings) {
      const lastTime = this.lastWeldSparkTime.get(building.id) || 0;
      const interval = 0.15 + Math.random() * 0.25;
      
      if (this.globalTime - lastTime > interval) {
        this.lastWeldSparkTime.set(building.id, this.globalTime);
        
        if (this.particles.length < this.maxParticles) {
          const spark = this.createWeldSpark(building);
          this.particles.push(spark);
          this.sceneManager.getScene().add(spark.mesh);
        }
      }
    }
  }

  private createWeldSpark(building: IBuilding): Particle {
    const y = building.currentHeight + 0.3 + Math.random() * 0.5;
    const x = building.position.x + (Math.random() - 0.5) * building.width * 0.6;
    const z = building.position.z + (Math.random() - 0.5) * building.depth * 0.6;
    
    const geometry = new THREE.TetrahedronGeometry(0.04, 0);
    const startColor = new THREE.Color(0xffffff);
    const endColor = new THREE.Color(0xff4400);
    const material = new THREE.MeshBasicMaterial({
      color: startColor,
      transparent: true,
      opacity: 1
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    
    return {
      mesh,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.03,
        0.05 + Math.random() * 0.08,
        (Math.random() - 0.5) * 0.03
      ),
      life: 1,
      maxLife: 0.35 + Math.random() * 0.25,
      type: 'weld_spark',
      startColor,
      endColor,
      flickerSpeed: 40 + Math.random() * 20,
      flickerPhase: Math.random() * Math.PI * 2,
      gravity: 0.006
    };
  }

  spawnGrowthEffect(building: IBuilding): void {
    const growthPos = new THREE.Vector3(
      building.position.x,
      building.currentHeight,
      building.position.z
    );
    this.spawnConstructionParticles(growthPos);
  }

  getNightModeStatus(): boolean {
    return this.isNightMode;
  }

  dispose(): void {
    for (const particle of this.particles) {
      this.sceneManager.getScene().remove(particle.mesh);
      particle.mesh.geometry.dispose();
      (particle.mesh.material as THREE.Material).dispose();
    }
    this.particles = [];
    
    for (const light of this.constructionLights) {
      this.sceneManager.getScene().remove(light);
      light.dispose();
    }
    this.constructionLights = [];
    
    this.lastWeldSparkTime.clear();
  }
}
