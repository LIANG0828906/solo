import * as THREE from 'three';

export interface PlayerBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

interface TrailParticle {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  velocity: THREE.Vector3;
}

interface ExplosionParticle {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  velocity: THREE.Vector3;
}

export class Player {
  private scene: THREE.Scene;
  private group: THREE.Group;
  private coneMesh: THREE.Mesh;
  private bodyMesh: THREE.Mesh;
  private tailLight: THREE.PointLight;
  
  private position: THREE.Vector3;
  private targetPosition: { x: number; y: number };
  private rotation: THREE.Euler;
  
  private readonly moveRangeX = { min: -4, max: 4 };
  private readonly moveRangeY = { min: -3, max: 3 };
  private readonly lerpFactor = 0.1;
  
  private trailParticles: TrailParticle[] = [];
  private explosionParticles: ExplosionParticle[] = [];
  private readonly maxTrailParticles = 200;
  private readonly maxExplosionParticles = 100;
  private readonly trailParticleSize = 1.5;
  
  private isShaking = false;
  private shakeIntensity = 0;
  private shakeDuration = 0;
  private shakeTimer = 0;
  
  private boundsSize = { width: 2, height: 2, depth: 3 };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.position = new THREE.Vector3(0, 0, 5);
    this.targetPosition = { x: 0, y: 0 };
    this.rotation = new THREE.Euler(0, 0, 0);
    
    const coneGeometry = new THREE.ConeGeometry(0.8, 1.5, 8);
    const coneMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x4aa8ff,
      transparent: true,
      opacity: 0.9
    });
    this.coneMesh = new THREE.Mesh(coneGeometry, coneMaterial);
    this.coneMesh.rotation.x = Math.PI / 2;
    this.coneMesh.position.z = 0.75;
    
    const bodyGeometry = new THREE.BoxGeometry(1.2, 1.2, 2);
    const bodyMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x4aa8ff,
      transparent: true,
      opacity: 0.85
    });
    this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.bodyMesh.position.z = -0.5;
    
    const edgeGeometry = new THREE.EdgesGeometry(bodyGeometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ 
      color: 0x88ccff,
      transparent: true,
      opacity: 0.9
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    this.bodyMesh.add(edges);
    
    this.tailLight = new THREE.PointLight(0x4aa8ff, 2, 15);
    this.tailLight.position.set(0, 0, -1.5);
    
    this.group.add(this.coneMesh);
    this.group.add(this.bodyMesh);
    this.group.add(this.tailLight);
    this.group.position.copy(this.position);
    
    this.scene.add(this.group);
  }

  setTargetX(x: number): void {
    const normalizedX = (x / window.innerWidth) * 2 - 1;
    this.targetPosition.x = normalizedX * 4;
    this.targetPosition.x = Math.max(
      this.moveRangeX.min,
      Math.min(this.moveRangeX.max, this.targetPosition.x)
    );
  }

  setTargetY(y: number): void {
    this.targetPosition.y = Math.max(
      this.moveRangeY.min,
      Math.min(this.moveRangeY.max, y)
    );
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getBounds(): PlayerBounds {
    return {
      minX: this.position.x - this.boundsSize.width / 2,
      maxX: this.position.x + this.boundsSize.width / 2,
      minY: this.position.y - this.boundsSize.height / 2,
      maxY: this.position.y + this.boundsSize.height / 2,
      minZ: this.position.z - this.boundsSize.depth / 2,
      maxZ: this.position.z + this.boundsSize.depth / 2
    };
  }

  triggerShake(intensity: number, duration: number): void {
    this.isShaking = true;
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = 0;
  }

  triggerExplosion(): void {
    const particleCount = 50;
    const colors = [0xff4444, 0xff6633, 0xffaa33, 0xff8844];
    
    for (let i = 0; i < particleCount; i++) {
      if (this.explosionParticles.length >= this.maxExplosionParticles) break;
      
      const geometry = new THREE.SphereGeometry(0.5, 6, 6);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(this.position);
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      );
      
      this.scene.add(mesh);
      this.explosionParticles.push({
        mesh,
        life: 1.5,
        maxLife: 1.5,
        velocity
      });
    }
  }

  update(deltaTime: number): void {
    this.position.x = THREE.MathUtils.lerp(
      this.position.x,
      this.targetPosition.x,
      this.lerpFactor
    );
    this.position.y = THREE.MathUtils.lerp(
      this.position.y,
      this.targetPosition.y,
      this.lerpFactor
    );
    
    const targetRotationY = (this.targetPosition.x - this.position.x) * 0.15;
    const targetRotationX = (this.targetPosition.y - this.position.y) * 0.1;
    
    this.rotation.y = THREE.MathUtils.lerp(this.rotation.y, targetRotationY, this.lerpFactor);
    this.rotation.x = THREE.MathUtils.lerp(this.rotation.x, -targetRotationX, this.lerpFactor);
    
    if (this.isShaking) {
      this.shakeTimer += deltaTime;
      if (this.shakeTimer >= this.shakeDuration) {
        this.isShaking = false;
        this.group.position.copy(this.position);
      } else {
        const shakeProgress = this.shakeTimer / this.shakeDuration;
        const currentIntensity = this.shakeIntensity * (1 - shakeProgress);
        this.group.position.set(
          this.position.x + (Math.random() - 0.5) * currentIntensity,
          this.position.y + (Math.random() - 0.5) * currentIntensity,
          this.position.z + (Math.random() - 0.5) * currentIntensity
        );
      }
    } else {
      this.group.position.copy(this.position);
    }
    
    this.group.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
    
    this.spawnTrailParticles();
    this.updateTrailParticles(deltaTime);
    this.updateExplosionParticles(deltaTime);
    
    this.tailLight.intensity = 1.5 + Math.sin(Date.now() * 0.01) * 0.3;
  }

  private spawnTrailParticles(): void {
    for (let i = 0; i < 5; i++) {
      if (this.trailParticles.length >= this.maxTrailParticles) {
        const oldest = this.trailParticles.shift();
        if (oldest) {
          oldest.mesh.position.set(
            this.position.x + (Math.random() - 0.5) * 0.5,
            this.position.y + (Math.random() - 0.5) * 0.5,
            this.position.z - 1.5
          );
          oldest.life = 1;
          oldest.maxLife = 1;
          oldest.velocity.set(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            -1 - Math.random() * 0.5
          );
          (oldest.mesh.material as THREE.MeshBasicMaterial).opacity = 0.8;
          this.trailParticles.push(oldest);
        }
      } else {
        const geometry = new THREE.SphereGeometry(this.trailParticleSize, 6, 6);
        const material = new THREE.MeshBasicMaterial({
          color: 0x66bbff,
          transparent: true,
          opacity: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
          this.position.x + (Math.random() - 0.5) * 0.5,
          this.position.y + (Math.random() - 0.5) * 0.5,
          this.position.z - 1.5
        );
        
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5,
          -1 - Math.random() * 0.5
        );
        
        this.scene.add(mesh);
        this.trailParticles.push({
          mesh,
          life: 1,
          maxLife: 1,
          velocity
        });
      }
    }
  }

  private updateTrailParticles(deltaTime: number): void {
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const particle = this.trailParticles[i];
      particle.life -= deltaTime;
      
      if (particle.life <= 0) {
        this.scene.remove(particle.mesh);
        this.trailParticles.splice(i, 1);
        continue;
      }
      
      particle.mesh.position.add(
        particle.velocity.clone().multiplyScalar(deltaTime * 60)
      );
      
      const opacity = particle.life / particle.maxLife;
      (particle.mesh.material as THREE.MeshBasicMaterial).opacity = opacity * 0.8;
      
      const scale = 0.3 + opacity * 0.7;
      particle.mesh.scale.setScalar(scale);
    }
  }

  private updateExplosionParticles(deltaTime: number): void {
    for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
      const particle = this.explosionParticles[i];
      particle.life -= deltaTime;
      
      if (particle.life <= 0) {
        this.scene.remove(particle.mesh);
        this.explosionParticles.splice(i, 1);
        continue;
      }
      
      particle.velocity.y -= 5 * deltaTime;
      particle.mesh.position.add(
        particle.velocity.clone().multiplyScalar(deltaTime * 60)
      );
      
      const opacity = particle.life / particle.maxLife;
      (particle.mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
      
      const scale = 0.5 + opacity * 0.5;
      particle.mesh.scale.setScalar(scale);
    }
  }

  setVisible(visible: boolean): void {
    this.group.visible = visible;
  }

  reset(): void {
    this.position.set(0, 0, 5);
    this.targetPosition = { x: 0, y: 0 };
    this.rotation.set(0, 0, 0);
    this.group.position.copy(this.position);
    this.group.rotation.set(0, 0, 0);
    this.isShaking = false;
    this.group.visible = true;
    
    for (const particle of this.trailParticles) {
      this.scene.remove(particle.mesh);
    }
    this.trailParticles = [];
    
    for (const particle of this.explosionParticles) {
      this.scene.remove(particle.mesh);
    }
    this.explosionParticles = [];
  }

  getTotalParticleCount(): number {
    return this.trailParticles.length + this.explosionParticles.length;
  }
}
