import * as THREE from 'three';
import { PlayerBounds } from './player';

export type GameObjectType = 'obstacle' | 'wave';

export interface GameObject {
  id: string;
  type: GameObjectType;
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: number;
  rotationSpeed: number;
  spiralAngle: number;
  spiralRadius: number;
  isAttracting: boolean;
  attractTimer: number;
  originalScale: number;
}

export interface CollisionResult {
  type: GameObjectType;
  object: GameObject;
}

interface AttractEffect {
  sprite: THREE.Sprite;
  life: number;
  maxLife: number;
  targetPosition: THREE.Vector3;
}

export class ObstacleManager {
  private scene: THREE.Scene;
  private objects: GameObject[] = [];
  private attractEffects: AttractEffect[] = [];
  
  private readonly spawnIntervalMin = 2;
  private readonly spawnIntervalMax = 3;
  private spawnTimer = 0;
  private nextSpawnTime = 0;
  
  private readonly waveChance = 0.4;
  private readonly maxObjects = 30;
  
  private readonly waveSpeed = 0.2;
  
  private readonly attractDistance = 8;
  private readonly attractDuration = 0.2;
  
  private getTunnelRadius: () => number;
  private getTunnelSpeed: () => number;
  private getTunnelRotation: () => number;
  
  private objectIdCounter = 0;

  constructor(
    scene: THREE.Scene,
    getTunnelRadius: () => number,
    getTunnelSpeed: () => number,
    getTunnelRotation: () => number
  ) {
    this.scene = scene;
    this.getTunnelRadius = getTunnelRadius;
    this.getTunnelSpeed = getTunnelSpeed;
    this.getTunnelRotation = getTunnelRotation;
    this.nextSpawnTime = this.getRandomSpawnInterval();
  }

  private getRandomSpawnInterval(): number {
    return this.spawnIntervalMin + Math.random() * (this.spawnIntervalMax - this.spawnIntervalMin);
  }

  private generateId(): string {
    return `obj_${++this.objectIdCounter}_${Date.now()}`;
  }

  spawn(currentSpeed: number): void {
    const baseObstacleCount = 1;
    const speedFactor = Math.min(1, (currentSpeed - 0.5) / 1);
    const maxObstacles = Math.floor(1 + speedFactor * 2);
    const obstacleCount = baseObstacleCount + Math.floor(Math.random() * (maxObstacles - baseObstacleCount + 1));
    
    for (let i = 0; i < obstacleCount; i++) {
      if (this.objects.length >= this.maxObjects) break;
      
      const isWave = Math.random() < this.waveChance;
      this.createObject(isWave ? 'wave' : 'obstacle');
    }
  }

  private createObject(type: GameObjectType): void {
    const tunnelRadius = this.getTunnelRadius();
    const spawnZ = -60;
    
    const angle = Math.random() * Math.PI * 2;
    const radius = tunnelRadius * 0.7;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    let mesh: THREE.Mesh;
    let size: number;
    
    if (type === 'obstacle') {
      size = 1 + Math.random();
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshBasicMaterial({
        color: 0xff4444,
        transparent: true,
        opacity: 0.9
      });
      mesh = new THREE.Mesh(geometry, material);
      
      const edgeGeometry = new THREE.EdgesGeometry(geometry);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0xff6666,
        transparent: true,
        opacity: 0.8
      });
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      mesh.add(edges);
    } else {
      size = 1.5;
      const geometry = new THREE.OctahedronGeometry(size * 0.8, 0);
      const material = new THREE.MeshBasicMaterial({
        color: 0x44ff66,
        transparent: true,
        opacity: 0.9
      });
      mesh = new THREE.Mesh(geometry, material);
      
      const edgeGeometry = new THREE.EdgesGeometry(geometry);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0x66ff88,
        transparent: true,
        opacity: 0.9
      });
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      mesh.add(edges);
      
      this.addGlowEffect(mesh, size);
    }
    
    mesh.position.set(x, y, spawnZ);
    this.scene.add(mesh);
    
    const gameObject: GameObject = {
      id: this.generateId(),
      type,
      mesh,
      position: new THREE.Vector3(x, y, spawnZ),
      velocity: new THREE.Vector3(0, 0, 0),
      size,
      rotationSpeed: (Math.random() - 0.5) * 2,
      spiralAngle: angle,
      spiralRadius: radius,
      isAttracting: false,
      attractTimer: 0,
      originalScale: 1
    };
    
    this.objects.push(gameObject);
  }

  private addGlowEffect(mesh: THREE.Mesh, size: number): void {
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 128;
    glowCanvas.height = 128;
    const ctx = glowCanvas.getContext('2d');
    
    if (ctx) {
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(100, 255, 150, 1)');
      gradient.addColorStop(0.3, 'rgba(100, 255, 150, 0.6)');
      gradient.addColorStop(0.6, 'rgba(100, 255, 150, 0.2)');
      gradient.addColorStop(1, 'rgba(100, 255, 150, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
    }
    
    const glowTexture = new THREE.CanvasTexture(glowCanvas);
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const glowSprite = new THREE.Sprite(glowMaterial);
    glowSprite.scale.set(size * 2.5, size * 2.5, 1);
    mesh.add(glowSprite);
  }

  checkCollision(playerBounds: PlayerBounds): CollisionResult | null {
    for (const obj of this.objects) {
      const objMinX = obj.position.x - obj.size / 2;
      const objMaxX = obj.position.x + obj.size / 2;
      const objMinY = obj.position.y - obj.size / 2;
      const objMaxY = obj.position.y + obj.size / 2;
      const objMinZ = obj.position.z - obj.size / 2;
      const objMaxZ = obj.position.z + obj.size / 2;
      
      const collisionX = playerBounds.maxX >= objMinX && playerBounds.minX <= objMaxX;
      const collisionY = playerBounds.maxY >= objMinY && playerBounds.minY <= objMaxY;
      const collisionZ = playerBounds.maxZ >= objMinZ && playerBounds.minZ <= objMaxZ;
      
      if (collisionX && collisionY && collisionZ) {
        return { type: obj.type, object: obj };
      }
    }
    return null;
  }

  removeObject(obj: GameObject): void {
    const index = this.objects.indexOf(obj);
    if (index > -1) {
      this.scene.remove(obj.mesh);
      if (obj.mesh.geometry) {
        obj.mesh.geometry.dispose();
      }
      if (obj.mesh.material instanceof THREE.Material) {
        obj.mesh.material.dispose();
      }
      this.objects.splice(index, 1);
    }
  }

  createAttractEffect(position: THREE.Vector3, targetPosition: THREE.Vector3): void {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(100, 255, 150, 0.8)');
      gradient.addColorStop(1, 'rgba(100, 255, 150, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.set(2, 2, 1);
    
    this.scene.add(sprite);
    this.attractEffects.push({
      sprite,
      life: 0.3,
      maxLife: 0.3,
      targetPosition: targetPosition.clone()
    });
  }

  update(deltaTime: number, playerPosition: THREE.Vector3, isPaused: boolean): void {
    if (isPaused) return;
    
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.nextSpawnTime) {
      this.spawnTimer = 0;
      this.nextSpawnTime = this.getRandomSpawnInterval();
      this.spawn(this.getTunnelSpeed());
    }
    
    const tunnelSpeed = this.getTunnelSpeed();
    const tunnelRotation = this.getTunnelRotation();
    const moveDistance = tunnelSpeed * deltaTime * 60;
    
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      
      obj.mesh.rotation.x += obj.rotationSpeed * deltaTime;
      obj.mesh.rotation.y += obj.rotationSpeed * deltaTime * 0.5;
      
      if (obj.type === 'wave') {
        obj.spiralAngle += this.waveSpeed * deltaTime * 60 * 0.5;
        
        const centerPull = 0.02;
        obj.spiralRadius = Math.max(1, obj.spiralRadius * (1 - centerPull * deltaTime * 60));
        
        const tunnelRadius = this.getTunnelRadius();
        const maxRadius = tunnelRadius * 0.8;
        obj.spiralRadius = Math.min(obj.spiralRadius, maxRadius);
        
        obj.position.x = Math.cos(obj.spiralAngle + tunnelRotation) * obj.spiralRadius;
        obj.position.y = Math.sin(obj.spiralAngle + tunnelRotation) * obj.spiralRadius;
        
        const distToPlayer = obj.position.distanceTo(playerPosition);
        if (distToPlayer < this.attractDistance && !obj.isAttracting) {
          obj.isAttracting = true;
          obj.attractTimer = this.attractDuration;
          this.createAttractEffect(obj.position.clone(), playerPosition.clone());
        }
        
        if (obj.isAttracting) {
          obj.attractTimer -= deltaTime;
          const attractProgress = 1 - (obj.attractTimer / this.attractDuration);
          const attractStrength = Math.sin(attractProgress * Math.PI);
          
          const attractPos = new THREE.Vector3().lerpVectors(
            obj.position,
            playerPosition,
            attractStrength * 0.3
          );
          obj.position.x = attractPos.x;
          obj.position.y = attractPos.y;
          
          const stretch = 1 + attractStrength * 0.5;
          const squash = 1 - attractStrength * 0.3;
          obj.mesh.scale.set(squash, squash, stretch);
          
          if (obj.attractTimer <= 0) {
            obj.isAttracting = false;
            obj.mesh.scale.setScalar(obj.originalScale);
          }
        }
        
        if (obj.type === 'wave') {
          const glowIntensity = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
          if (obj.mesh.children.length > 0) {
            const glow = obj.mesh.children[0] as THREE.Sprite;
            if (glow.material instanceof THREE.SpriteMaterial) {
              glow.material.opacity = glowIntensity;
            }
          }
        }
      }
      
      obj.position.z += moveDistance;
      obj.mesh.position.copy(obj.position);
      
      if (obj.position.z > 20) {
        this.removeObject(obj);
      }
    }
    
    for (let i = this.attractEffects.length - 1; i >= 0; i--) {
      const effect = this.attractEffects[i];
      effect.life -= deltaTime;
      
      if (effect.life <= 0) {
        this.scene.remove(effect.sprite);
        if (effect.sprite.material instanceof THREE.Material) {
          effect.sprite.material.dispose();
        }
        this.attractEffects.splice(i, 1);
        continue;
      }
      
      const progress = 1 - effect.life / effect.maxLife;
      effect.sprite.position.lerp(effect.targetPosition, progress * 0.2);
      
      const scale = 2 * (1 - progress);
      effect.sprite.scale.set(scale, scale, 1);
      
      if (effect.sprite.material instanceof THREE.SpriteMaterial) {
        effect.sprite.material.opacity = 1 - progress;
      }
    }
  }

  getObjectCount(): number {
    return this.objects.length;
  }

  reset(): void {
    for (const obj of this.objects) {
      this.scene.remove(obj.mesh);
      if (obj.mesh.geometry) {
        obj.mesh.geometry.dispose();
      }
      if (obj.mesh.material instanceof THREE.Material) {
        obj.mesh.material.dispose();
      }
    }
    this.objects = [];
    
    for (const effect of this.attractEffects) {
      this.scene.remove(effect.sprite);
      if (effect.sprite.material instanceof THREE.Material) {
        effect.sprite.material.dispose();
      }
    }
    this.attractEffects = [];
    
    this.spawnTimer = 0;
    this.nextSpawnTime = this.getRandomSpawnInterval();
  }

  dispose(): void {
    this.reset();
  }
}
