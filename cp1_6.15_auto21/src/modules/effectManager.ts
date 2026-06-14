import * as THREE from 'three';
import { SceneManager } from './sceneManager';
import { BuildingManager } from './buildingManager';
import {
  IBuilding,
  FLOOR_HEIGHT,
  BREATHING_SPEED,
  BREATHING_INTENSITY,
  STYLE_CONFIGS,
  BuildingStyle
} from '../models/buildingConfig';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  type: 'construction' | 'spark';
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
  private maxParticles: number = 200;

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
    this.updateWindowLights(deltaTime);
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
    const colors = [0xffaa00, 0xffff00, 0xff6600];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const geometry = new THREE.SphereGeometry(0.08 + Math.random() * 0.08, 6, 6);
    const material = new THREE.MeshBasicMaterial({
      color,
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
      type: 'construction'
    };
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      particle.life -= deltaTime / particle.maxLife;
      
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime * 60));
      particle.velocity.y -= 0.001 * deltaTime * 60;
      
      const material = particle.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, particle.life);
      particle.mesh.scale.setScalar(0.5 + particle.life * 0.5);
      
      if (Math.random() < 0.1) {
        material.color.setHex(Math.random() < 0.5 ? 0xffff00 : 0xff6600);
      }
      
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
    
    for (const building of buildings) {
      if (building.isComplete) {
        for (const windowLight of building.windowLights) {
          const mat = windowLight.material as THREE.MeshBasicMaterial;
          
          if (enabled) {
            const shouldLight = Math.random() > 0.4;
            const targetOpacity = shouldLight ? 0.8 + Math.random() * 0.2 : 0;
            
            this.animateWindowOpacity(mat, targetOpacity, 1000);
            
            if (shouldLight) {
              mat.color.setHex(0xffcc33);
            }
          } else {
            this.animateWindowOpacity(mat, 0, 1000);
            const styleConfig = STYLE_CONFIGS[building.style];
            mat.color.setHex(styleConfig.windowColor);
          }
        }
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

  updateWindowLights(deltaTime: number): void {
    if (!this.isNightMode) return;
    
    this.windowUpdateTimer += deltaTime;
    
    if (this.windowUpdateTimer > 2) {
      this.windowUpdateTimer = 0;
      
      const buildings = this.buildingManager.getBuildings();
      
      for (const building of buildings) {
        if (!building.isComplete) continue;
        
        for (const windowLight of building.windowLights) {
          if (Math.random() < 0.02) {
            const mat = windowLight.material as THREE.MeshBasicMaterial;
            const newOpacity = mat.opacity > 0.5 ? 0 : 0.9;
            this.animateWindowOpacity(mat, newOpacity, 500);
            
            if (newOpacity > 0.5 && Math.random() < 0.3) {
              const warmColors = [0xffcc33, 0xffaa33, 0xffee99];
              mat.color.setHex(warmColors[Math.floor(Math.random() * warmColors.length)]);
            }
          }
        }
      }
    }
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
        type: 'spark'
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
  }
}
