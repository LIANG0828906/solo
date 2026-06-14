import * as THREE from 'three';
import { SceneManager } from './sceneManager';
import { BuildingManager } from './buildingManager';
import {
  IBuilding,
  FLOOR_HEIGHT,
  BREATHING_SPEED,
  BREATHING_INTENSITY,
  STYLE_CONFIGS,
  IWindowLightState
} from '../models/buildingConfig';

type ParticleType = 'construction' | 'spark' | 'floor_spark' | 'weld_spark';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  type: ParticleType;
  startColor: THREE.Color;
  midColor: THREE.Color;
  endColor: THREE.Color;
  flickerSpeed: number;
  flickerOffset: number;
}

export class EffectManager {
  sceneManager: SceneManager;
  buildingManager: BuildingManager;
  private particles: Particle[] = [];
  private constructionLights: THREE.PointLight[] = [];
  private isNightMode: boolean = false;
  private windowUpdateTimer: number = 0;
  private beaconPhase: number = 0;
  private breathingTime: number = 0;
  private maxParticles: number = 500;
  private windowUpdateIndex: number = 0;
  private weldSparkTimer: Map<string, number> = new Map();

  constructor(
    sceneManager: SceneManager,
    buildingManager: BuildingManager
  ) {
    this.sceneManager = sceneManager;
    this.buildingManager = buildingManager;
  }

  update(deltaTime: number): void {
    this.breathingTime += BREATHING_SPEED * deltaTime * 60;
    const breathingIntensity = (Math.sin(this.breathingTime) + 1) / 2 * BREATHING_INTENSITY;
    
    if (this.isNightMode) {
      this.sceneManager.updateBreathingEffect(breathingIntensity);
    }

    this.beaconPhase += deltaTime * 0.003;
    this.updateBeaconLights(this.beaconPhase);
    this.updateParticles(deltaTime);
    this.updateConstructionLights();
    this.updateWindowLights(deltaTime, breathingIntensity);
    this.updateWeldSparks(deltaTime);
  }

  triggerFloorGrowthSparks(position: THREE.Vector3, floorHeight: number): void {
    const sparkCount = Math.floor(Math.random() * 6) + 15;
    
    for (let i = 0; i < sparkCount; i++) {
      if (this.particles.length >= this.maxParticles) {
        const oldParticle = this.particles.shift();
        if (oldParticle) {
          this.sceneManager.getScene().remove(oldParticle.mesh);
          oldParticle.mesh.geometry.dispose();
          (oldParticle.mesh.material as THREE.Material).dispose();
        }
      }

      const spark = this.createFloorSpark(position, floorHeight);
      this.particles.push(spark);
      this.sceneManager.getScene().add(spark.mesh);
    }
  }

  private createFloorSpark(position: THREE.Vector3, floorHeight: number): Particle {
    const geometry = new THREE.SphereGeometry(0.04 + Math.random() * 0.04, 4, 4);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.8;
    const offsetX = Math.cos(angle) * radius;
    const offsetZ = Math.sin(angle) * radius;
    
    mesh.position.set(
      position.x + offsetX,
      floorHeight,
      position.z + offsetZ
    );

    const horizontalSpeed = 0.02 + Math.random() * 0.04;
    const verticalSpeed = 0.08 + Math.random() * 0.12;
    
    const velocity = new THREE.Vector3(
      Math.cos(angle) * horizontalSpeed,
      verticalSpeed,
      Math.sin(angle) * horizontalSpeed
    );

    return {
      mesh,
      velocity,
      life: 1,
      maxLife: 0.8 + Math.random() * 0.6,
      type: 'floor_spark',
      startColor: new THREE.Color(0xffffff),
      midColor: new THREE.Color(0xffff00),
      endColor: new THREE.Color(0xff6600),
      flickerSpeed: 0.3 + Math.random() * 0.4,
      flickerOffset: Math.random() * Math.PI * 2
    };
  }

  private createWeldSpark(position: THREE.Vector3): Particle {
    const geometry = new THREE.TetrahedronGeometry(0.02 + Math.random() * 0.02);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    const offsetX = (Math.random() - 0.5) * 1.2;
    const offsetZ = (Math.random() - 0.5) * 1.2;
    
    mesh.position.set(
      position.x + offsetX,
      position.y + 0.5,
      position.z + offsetZ
    );

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.06,
      0.05 + Math.random() * 0.08,
      (Math.random() - 0.5) * 0.06
    );

    return {
      mesh,
      velocity,
      life: 1,
      maxLife: 0.3 + Math.random() * 0.3,
      type: 'weld_spark',
      startColor: new THREE.Color(0xffffff),
      midColor: new THREE.Color(0xffffaa),
      endColor: new THREE.Color(0xff8800),
      flickerSpeed: 0.5 + Math.random() * 0.5,
      flickerOffset: Math.random() * Math.PI * 2
    };
  }

  spawnConstructionParticles(position: THREE.Vector3, buildingId: string): void {
    const particleCount = 5;
    
    for (let i = 0; i < particleCount; i++) {
      if (this.particles.length >= this.maxParticles) {
        const oldParticle = this.particles.shift();
        if (oldParticle) {
          this.sceneManager.getScene().remove(oldParticle.mesh);
          oldParticle.mesh.geometry.dispose();
          (oldParticle.mesh.material as THREE.Material).dispose();
        }
      }

      const constructionParticle = this.createConstructionParticle(position, buildingId);
      this.particles.push(constructionParticle);
      this.sceneManager.getScene().add(constructionParticle.mesh);
    }
  }

  private createConstructionParticle(position: THREE.Vector3, buildingId: string): Particle {
    const geometry = new THREE.SphereGeometry(0.08 + Math.random() * 0.08, 6, 6);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 1
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    const offsetX = (Math.random() - 0.5) * 1.5;
    const offsetZ = (Math.random() - 0.5) * 1.5;
    
    mesh.position.set(
      position.x + offsetX,
      position.y,
      position.z + offsetZ
    );

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      0.03 + Math.random() * 0.05,
      (Math.random() - 0.5) * 0.02
    );

    return {
      mesh,
      velocity,
      life: 1,
      maxLife: 1.5 + Math.random(),
      type: 'construction',
      startColor: new THREE.Color(0xffaa00),
      midColor: new THREE.Color(0xffff00),
      endColor: new THREE.Color(0xff6600),
      flickerSpeed: 0.1,
      flickerOffset: Math.random() * Math.PI * 2
    };
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      particle.life -= deltaTime / particle.maxLife;
      
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime * 60));
      particle.velocity.y -= 0.002 * deltaTime * 60;
      
      const material = particle.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, particle.life);
      
      const lifeProgress = 1 - particle.life;
      let currentColor: THREE.Color;
      
      if (lifeProgress < 0.5) {
        const t = lifeProgress * 2;
        currentColor = particle.startColor.clone().lerp(particle.midColor, t);
      } else {
        const t = (lifeProgress - 0.5) * 2;
        currentColor = particle.midColor.clone().lerp(particle.endColor, t);
      }
      
      const flicker = Math.sin(Date.now() * particle.flickerSpeed + particle.flickerOffset);
      const flickerIntensity = 0.7 + flicker * 0.3;
      currentColor.multiplyScalar(flickerIntensity);
      
      material.color.copy(currentColor);
      
      particle.mesh.scale.setScalar(0.5 + particle.life * 0.5);
      
      if (particle.life <= 0) {
        this.sceneManager.getScene().remove(particle.mesh);
        particle.mesh.geometry.dispose();
        material.dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  private updateConstructionLights(): void {
    const growingBuildings = this.buildingManager.getBuildings().filter(b => b.isGrowing);
    
    while (this.constructionLights.length < growingBuildings.length * 2) {
      const light = new THREE.PointLight(0xffaa00, 0, 8);
      light.castShadow = false;
      this.sceneManager.getScene().add(light);
      this.constructionLights.push(light);
    }
    
    let lightIndex = 0;
    for (const building of growingBuildings) {
      if (lightIndex >= this.constructionLights.length) break;
      
      const light1 = this.constructionLights[lightIndex++];
      const light2 = this.constructionLights[lightIndex++];
      
      const currentY = building.currentHeight + 0.5;
      
      light1.position.set(
        building.position.x + 0.8,
        currentY,
        building.position.z
      );
      light1.intensity = 1 + Math.sin(Date.now() * 0.01 + building.id.charCodeAt(0)) * 0.5;
      light1.color.setHex(Math.random() < 0.7 ? 0xffaa00 : 0xffffff);
      
      light2.position.set(
        building.position.x - 0.8,
        currentY,
        building.position.z
      );
      light2.intensity = 0.8 + Math.sin(Date.now() * 0.015 + building.id.charCodeAt(1)) * 0.4;
      light2.color.setHex(Math.random() < 0.7 ? 0xff6600 : 0xffff00);
    }
    
    for (let i = lightIndex; i < this.constructionLights.length; i++) {
      this.constructionLights[i].intensity = 0;
    }
  }

  private updateWeldSparks(deltaTime: number): void {
    const growingBuildings = this.buildingManager.getBuildings().filter(b => b.isGrowing);
    
    for (const building of growingBuildings) {
      let timer = this.weldSparkTimer.get(building.id) || 0;
      timer -= deltaTime;
      
      if (timer <= 0) {
        const pos = new THREE.Vector3(
          building.position.x,
          building.currentHeight,
          building.position.z
        );
        
        const sparkCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < sparkCount; i++) {
          if (this.particles.length < this.maxParticles) {
            const spark = this.createWeldSpark(pos);
            this.particles.push(spark);
            this.sceneManager.getScene().add(spark.mesh);
          }
        }
        
        timer = 0.1 + Math.random() * 0.3;
      }
      
      this.weldSparkTimer.set(building.id, timer);
    }
    
    for (const [buildingId] of this.weldSparkTimer) {
      const building = growingBuildings.find(b => b.id === buildingId);
      if (!building) {
        this.weldSparkTimer.delete(buildingId);
      }
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
        
        building.beaconLight.intensity = 3 + Math.sin(time * 10) * 2;
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
    const now = Date.now();
    
    for (const building of buildings) {
      if (building.isComplete) {
        if (!building.windowStates) {
          building.windowStates = new Map();
        }
        
        building.windowLights.forEach((windowLight, index) => {
          const windowId = `${building.id}_window_${index}`;
          const mat = windowLight.material as THREE.MeshBasicMaterial;
          
          if (!building.windowStates!.has(windowId)) {
            const shouldLight = Math.random() > 0.4;
            const targetBrightness = shouldLight ? 0.8 + Math.random() * 0.2 : 0;
            const warmColors = [0xffcc33, 0xffaa33, 0xffee99];
            
            const windowState: IWindowLightState = {
              targetBrightness,
              currentBrightness: 0,
              toggleInterval: (Math.random() * 4 + 1) * 1000,
              nextToggleTime: now + (Math.random() * 4 + 1) * 1000,
              color: new THREE.Color(warmColors[Math.floor(Math.random() * warmColors.length)])
            };
            
            building.windowStates!.set(windowId, windowState);
          }
          
          const state = building.windowStates!.get(windowId)!;
          
          if (enabled) {
            state.targetBrightness = state.targetBrightness > 0 ? state.targetBrightness : (Math.random() > 0.4 ? 0.8 + Math.random() * 0.2 : 0);
            if (state.targetBrightness > 0 && state.color) {
              mat.color.copy(state.color);
            } else {
              mat.color.setHex(STYLE_CONFIGS[building.style].windowColor);
            }
          } else {
            state.targetBrightness = 0;
            mat.color.setHex(STYLE_CONFIGS[building.style].windowColor);
          }
          
          this.animateWindowOpacity(mat, state.targetBrightness, 1000);
        });
      }
    }
  }

  private animateWindowOpacity(material: THREE.MeshBasicMaterial, targetOpacity: number, duration: number): void {
    const startOpacity = material.opacity;
    const startTime = Date.now();
    
    const update = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      material.opacity = startOpacity + (targetOpacity - startOpacity) * eased;
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    update();
  }

  updateWindowLights(deltaTime: number, breathingIntensity: number): void {
    if (!this.isNightMode) return;
    
    const buildings = this.buildingManager.getBuildings();
    const now = Date.now();
    
    let totalWindows = 0;
    for (const building of buildings) {
      if (building.isComplete) {
        totalWindows += building.windowLights.length;
      }
    }
    
    if (totalWindows === 0) return;
    
    const windowsPerFrame = Math.max(1, Math.ceil(totalWindows / 60));
    let processedCount = 0;
    
    for (const building of buildings) {
      if (!building.isComplete) continue;
      
      if (!building.windowStates) {
        building.windowStates = new Map();
      }
      
      for (let i = 0; i < building.windowLights.length; i++) {
        const windowIndex = (this.windowUpdateIndex + i) % building.windowLights.length;
        const windowLight = building.windowLights[windowIndex];
        const windowId = `${building.id}_window_${windowIndex}`;
        
        if (!building.windowStates!.has(windowId)) {
          const warmColors = [0xffcc33, 0xffaa33, 0xffee99];
          const shouldLight = Math.random() > 0.4;
          
          const windowState: IWindowLightState = {
            targetBrightness: shouldLight ? 0.8 + Math.random() * 0.2 : 0,
            currentBrightness: 0,
            toggleInterval: (Math.random() * 4 + 1) * 1000,
            nextToggleTime: now + (Math.random() * 4 + 1) * 1000,
            color: new THREE.Color(warmColors[Math.floor(Math.random() * warmColors.length)])
          };
          
          building.windowStates!.set(windowId, windowState);
        }
        
        const state = building.windowStates!.get(windowId)!;
        const mat = windowLight.material as THREE.MeshBasicMaterial;
        
        if (now >= state.nextToggleTime) {
          const shouldLight = Math.random() > 0.4;
          state.targetBrightness = shouldLight ? 0.8 + Math.random() * 0.2 : 0;
          state.nextToggleTime = now + state.toggleInterval;
          
          if (state.targetBrightness > 0 && state.color) {
            const warmColors = [0xffcc33, 0xffaa33, 0xffee99];
            state.color.setHex(warmColors[Math.floor(Math.random() * warmColors.length)]);
            mat.color.copy(state.color);
          }
        }
        
        const smoothFactor = 0.05;
        state.currentBrightness += (state.targetBrightness - state.currentBrightness) * smoothFactor;
        
        const breathFactor = 1 + breathingIntensity * 0.5;
        mat.opacity = Math.min(1, state.currentBrightness * breathFactor);
        
        processedCount++;
        if (processedCount >= windowsPerFrame) {
          break;
        }
      }
      
      if (processedCount >= windowsPerFrame) {
        break;
      }
    }
    
    this.windowUpdateIndex = (this.windowUpdateIndex + windowsPerFrame) % totalWindows;
  }

  spawnGrowthEffect(building: IBuilding): void {
    const growthPos = new THREE.Vector3(
      building.position.x,
      building.currentHeight,
      building.position.z
    );
    this.spawnConstructionParticles(growthPos, building.id);
    
    if (Math.random() < 0.3) {
      this.spawnSparkParticles(growthPos);
    }
  }

  private spawnSparkParticles(position: THREE.Vector3): void {
    for (let i = 0; i < 3; i++) {
      const geometry = new THREE.TetrahedronGeometry(0.05);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        0.1 + Math.random() * 0.1,
        (Math.random() - 0.5) * 0.1
      );
      
      const particle: Particle = {
        mesh,
        velocity,
        life: 0.8,
        maxLife: 0.8,
        type: 'spark',
        startColor: new THREE.Color(0xffffff),
        midColor: new THREE.Color(0xffff00),
        endColor: new THREE.Color(0xff6600),
        flickerSpeed: 0.2,
        flickerOffset: Math.random() * Math.PI * 2
      };
      
      this.particles.push(particle);
      this.sceneManager.getScene().add(mesh);
    }
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
    
    this.weldSparkTimer.clear();
  }
}
