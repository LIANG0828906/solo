import * as THREE from 'three';
import { DisplacementVector } from './地层';

export type FaultType = 'normal' | 'reverse' | 'strike-slip';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
}

export class FaultSystem {
  public particleGroup: THREE.Group;
  public faultGlow: THREE.Mesh | null = null;
  public scratchLines: THREE.Group | null = null;
  
  private particlePool: Particle[] = [];
  private maxParticles: number = 500;
  private activeParticles: number = 0;
  
  private faultType: FaultType = 'normal';
  private faultPlaneX: number = 0;
  private displacementMagnitude: number = 2;
  
  private sceneWidth: number;
  private sceneDepth: number;
  
  private animationProgress: number = 0;
  private isAnimating: boolean = false;
  private animationDuration: number = 4000;
  private animationStartTime: number = 0;
  
  private glowIntensity: number = 0;

  constructor(sceneWidth: number = 30, sceneDepth: number = 30) {
    this.sceneWidth = sceneWidth;
    this.sceneDepth = sceneDepth;
    this.particleGroup = new THREE.Group();
    this.initParticlePool();
    this.createFaultGlow();
    this.createScratchLines();
  }

  private initParticlePool(): void {
    const geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    
    for (let i = 0; i < this.maxParticles; i++) {
      const material = new THREE.MeshLambertMaterial({
        color: 0x8B7355,
        transparent: true,
        opacity: 0
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      
      this.particlePool.push({
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0,
        active: false
      });
      
      this.particleGroup.add(mesh);
    }
  }

  private createFaultGlow(): void {
    const geometry = new THREE.PlaneGeometry(0.2, 10);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff6633,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    
    this.faultGlow = new THREE.Mesh(geometry, material);
    this.faultGlow.rotation.y = Math.PI / 2;
    this.faultGlow.position.set(this.faultPlaneX, -3, 0);
    this.particleGroup.add(this.faultGlow);
  }

  private createScratchLines(): void {
    this.scratchLines = new THREE.Group();
    
    for (let i = 0; i < 30; i++) {
      const geometry = new THREE.PlaneGeometry(3, 0.05);
      const material = new THREE.MeshBasicMaterial({
        color: 0x999999,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      });
      
      const line = new THREE.Mesh(geometry, material);
      line.rotation.x = -Math.PI / 2;
      line.position.set(
        (Math.random() - 0.5) * this.sceneWidth,
        -1 + Math.random() * 2,
        (Math.random() - 0.5) * this.sceneDepth
      );
      
      this.scratchLines.add(line);
    }
    
    this.particleGroup.add(this.scratchLines);
  }

  public setFaultType(type: FaultType): void {
    this.faultType = type;
  }

  public getFaultType(): FaultType {
    return this.faultType;
  }

  public triggerFault(): void {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    this.animationStartTime = performance.now();
    this.animationProgress = 0;
    
    if (this.faultType === 'normal') {
      this.spawnRockDebris();
    } else if (this.faultType === 'reverse') {
      this.triggerGlowFlash();
    } else if (this.faultType === 'strike-slip') {
      this.showScratchLines();
    }
  }

  public update(deltaTime: number, currentTime: number): DisplacementVector | null {
    this.updateParticles(deltaTime);
    
    if (this.isAnimating) {
      const elapsed = currentTime - this.animationStartTime;
      this.animationProgress = Math.min(1, elapsed / this.animationDuration);
      
      if (this.animationProgress >= 1) {
        this.isAnimating = false;
      }
      
      return this.getDisplacementVector();
    }
    
    return null;
  }

  private getDisplacementVector(): DisplacementVector {
    let direction = new THREE.Vector3();
    let magnitude = this.displacementMagnitude * this.easeInOutCubic(this.animationProgress);
    
    switch (this.faultType) {
      case 'normal':
        direction.set(0.3, -1, 0).normalize();
        break;
      case 'reverse':
        direction.set(-0.3, 1, 0).normalize();
        magnitude *= 0.8;
        break;
      case 'strike-slip':
        direction.set(0, 0, 1).normalize();
        magnitude *= 1.5;
        break;
    }
    
    return {
      direction,
      magnitude,
      faultPlaneX: this.faultPlaneX,
      faultType: this.faultType
    };
  }

  private spawnRockDebris(): void {
    const spawnCount = 100;
    
    for (let i = 0; i < spawnCount; i++) {
      setTimeout(() => {
        this.spawnSingleDebris();
      }, i * 30);
    }
  }

  private spawnSingleDebris(): void {
    const particle = this.getAvailableParticle();
    if (!particle) return;
    
    const spawnX = this.faultPlaneX + (Math.random() - 0.3) * 5;
    const spawnY = 2 + Math.random() * 2;
    const spawnZ = (Math.random() - 0.5) * this.sceneDepth * 0.8;
    
    particle.mesh.position.set(spawnX, spawnY, spawnZ);
    particle.mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    particle.velocity.set(
      (Math.random() - 0.5) * 2,
      -2 - Math.random() * 3,
      (Math.random() - 0.5) * 1
    );
    particle.life = 2 + Math.random() * 1.5;
    particle.maxLife = particle.life;
    particle.active = true;
    particle.mesh.visible = true;
    
    const material = particle.mesh.material as THREE.MeshLambertMaterial;
    material.opacity = 1;
    
    const colors = [0x8B7355, 0xA0522D, 0x6B4423, 0x8B4513];
    material.color.setHex(colors[Math.floor(Math.random() * colors.length)]);
    
    const scale = 0.05 + Math.random() * 0.2;
    particle.mesh.scale.set(scale, scale, scale);
    
    this.activeParticles++;
  }

  private getAvailableParticle(): Particle | null {
    const inactive = this.particlePool.find(p => !p.active);
    if (inactive) return inactive;
    
    if (this.activeParticles >= this.maxParticles) {
      const oldestActive = this.particlePool
        .filter(p => p.active)
        .sort((a, b) => a.life - b.life)[0];
      return oldestActive || null;
    }
    
    return null;
  }

  private updateParticles(deltaTime: number): void {
    const gravity = -9.8;
    
    this.particlePool.forEach(particle => {
      if (!particle.active) return;
      
      particle.life -= deltaTime;
      
      if (particle.life <= 0) {
        particle.active = false;
        particle.mesh.visible = false;
        this.activeParticles--;
        return;
      }
      
      particle.velocity.y += gravity * deltaTime * 0.5;
      
      particle.mesh.position.x += particle.velocity.x * deltaTime;
      particle.mesh.position.y += particle.velocity.y * deltaTime;
      particle.mesh.position.z += particle.velocity.z * deltaTime;
      
      particle.mesh.rotation.x += deltaTime * 2;
      particle.mesh.rotation.y += deltaTime * 1.5;
      
      const material = particle.mesh.material as THREE.MeshLambertMaterial;
      material.opacity = Math.min(1, particle.life / particle.maxLife);
    });
  }

  private triggerGlowFlash(): void {
    this.glowIntensity = 1;
    
    const animateGlow = () => {
      this.glowIntensity *= 0.92;
      
      if (this.faultGlow) {
        const material = this.faultGlow.material as THREE.MeshBasicMaterial;
        material.opacity = this.glowIntensity * 0.8;
        this.faultGlow.scale.y = 1 + this.glowIntensity * 0.5;
      }
      
      if (this.glowIntensity > 0.01) {
        requestAnimationFrame(animateGlow);
      }
    };
    
    setTimeout(animateGlow, 500);
  }

  private showScratchLines(): void {
    if (!this.scratchLines) return;
    
    const lines = this.scratchLines.children as THREE.Mesh[];
    
    lines.forEach((line, i) => {
      setTimeout(() => {
        const material = line.material as THREE.MeshBasicMaterial;
        material.opacity = 0.6;
        
        const fadeOut = () => {
          material.opacity *= 0.95;
          if (material.opacity > 0.01) {
            requestAnimationFrame(fadeOut);
          }
        };
        
        setTimeout(fadeOut, 2000);
      }, i * 50);
    });
  }

  public getProgress(): number {
    return this.animationProgress;
  }

  public isPlaying(): boolean {
    return this.isAnimating;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  public reset(): void {
    this.isAnimating = false;
    this.animationProgress = 0;
    this.glowIntensity = 0;
    
    this.particlePool.forEach(particle => {
      particle.active = false;
      particle.mesh.visible = false;
    });
    this.activeParticles = 0;
    
    if (this.faultGlow) {
      const material = this.faultGlow.material as THREE.MeshBasicMaterial;
      material.opacity = 0;
    }
  }

  public dispose(): void {
    this.particlePool.forEach(particle => {
      particle.mesh.geometry.dispose();
      (particle.mesh.material as THREE.Material).dispose();
    });
    
    if (this.faultGlow) {
      this.faultGlow.geometry.dispose();
      (this.faultGlow.material as THREE.Material).dispose();
    }
  }
}
